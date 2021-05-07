import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository, Not } from 'typeorm';

import { KubernetesService } from '../kubernetes/kubernetes.service';
import { AzureDataSource } from '../vendors/azure.data-source';
import { RbacService } from '../kubernetes/rbac.service';
import { LoggerService } from '../logs/logs.service';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';

import { Cluster } from './cluster.entity';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';

import { ClusterGetDto } from './cluster-get.dto';
import { ClusterPostDto } from './cluster-post.dto';
import { ClusterPatchDto } from './cluster-patch.dto';

@Injectable()
export class ClustersService {

    constructor(
        private azureDataSource: AzureDataSource,
        private configService: ConfigService,
        @InjectRepository(Cluster)
        private clusterRepository: Repository<Cluster>,
        private projectsService: ProjectsService,
        private kubernetesService: KubernetesService,
        private logger: LoggerService,
        private rbacService: RbacService,
        private usersService: UsersService,
        @InjectRepository(User)
        private usersRepository: Repository<User>
    ) {
      this.logger.setContext(ClustersService.name);
    }

    async deleteClusterByFormatname(formatName: string){
        return await this.clusterRepository.delete({formatName: formatName});
    }


    async createAKSCluster(clusterData: any, projectFormatName?: string) {
      var cloudguardCluster = {};
      var azureResponse = await this.azureDataSource.createCluster(clusterData);
      // We need a reference somewhere, create it here
      if(clusterData.name){
        try{
          var data = {
            name: azureResponse.name,
            platform: "KUBERNETES",
            vendor: "AZURE",
            vendorState: "creating",
            vendorLocation: azureResponse.location,
            specification: clusterData.specification
          }
          // Attach it to a project if wanted
          if(projectFormatName){
            data['project'] = await this.projectsService.getByFormatName(projectFormatName);
          }
          cloudguardCluster = await this.create(data);
        }catch(error){
          // Fallback!
          await this.azureDataSource.deleteCluster(azureResponse.name);
        }
      }

      return cloudguardCluster;
    }

    async patchAKSCluster(formatName: string, patchData: any) {

      var cluster = await this.getCluster(formatName);
      // todo Verify response
      var azureResponse = await this.azureDataSource.patchCluster(cluster.name, patchData);
      cluster["specification"] = azureResponse; 
      cluster["vendorState"] = this.normalizeClusterState(cluster, azureResponse?.properties?.provisioningState);
      await this.clusterRepository.save(cluster);

      return cluster;
    }

    async getUpgradeProfile(name: string) {
      return await this.azureDataSource.getUpgradeProfile(name);
    }

    async getAksKubeConfig(name: string) {
      return await this.azureDataSource.getClusterKubeConfig(name);
    }

    async getAKSCluster(name: string) {
      var azureCluster = await this.azureDataSource.getCluster(name);

      var aksProgressStates = this.configService.get<String[]>('aks.progressStates');
      
      var currentState = azureCluster?.properties?.provisioningState;
      // This is for updating the reference status so we won't spam Azure in vain
      if(currentState && !aksProgressStates.includes(currentState)){
        var cluster = await this.getCluster(name);
        // Really important to make sure the cluster has standards configurated for the enterprise
        cluster = await this.azureDataSource.postProvisionModifyCluster(cluster, azureCluster);
        // Normalize vendorState
        cluster['vendorState'] = this.normalizeClusterState(cluster, cluster.vendorState);
        // Also do internal updates when cluster is done
        if(await this.kubernetesService.hasKubernetesAccess(cluster)){
          cluster = await this.postProvisionModifyCluster(cluster);
        }
      }else if(!currentState){
        this.logger.debug(`Cluster ${cluster.name} is missing a state.`);
      }

      return azureCluster;
    }

    async deleteAKSCluster(name: string) {

      var deleted: Boolean = await this.azureDataSource.deleteCluster(name);
      
      if(deleted){
        await this.deleteClusterByFormatname(name);
      }
      
      return deleted;
    }

    /*
    * This is done to all added clusters when they are known to have been provisioned (out of creation stage)
    */
    async postProvisionModifyCluster(cluster: Cluster){
      var versionInfo = await this.kubernetesService.getKubernetesVersionInfo(cluster);
      cluster.platformVersionInfo = versionInfo;
      return await this.update(cluster);
    }

    async create(clusterData: any){
      clusterData['formatName'] = await this.generateFormatName(clusterData);
      return this.clusterRepository.save(clusterData);
    }

    async update(clusterData: any){
      clusterData['formatName'] = await this.generateFormatName(clusterData);
      return this.clusterRepository.save(clusterData);
    }

    // Normalize the state of a cluster from different vendors
    public normalizeClusterState(cluster: any, stateToNormalize: string): string{
      var patchingVersions = ["upgrading", "patching"];
      if(patchingVersions.includes(stateToNormalize.toLowerCase())){
        return "patching";
      }
      var creatingVersions = ["provisioning", "creating"];
      if(creatingVersions.includes(stateToNormalize.toLowerCase())){
        return "creating";
      }
      var deletingVersions = ["deleting", "terminating"];
      if(deletingVersions.includes(stateToNormalize.toLowerCase())){
        return "deleting";
      }
      var createdVersions = ["succeeded", "created"];
      if(createdVersions.includes(stateToNormalize.toLowerCase())){
        return "created";
      }
      this.logger.debug(`Cluster ${cluster.name} has a weird state (${stateToNormalize}) at its vendor.`);
      return "unknown";
    }

    /*
    * This creates a reference to an already existing cluster in CloudGuard
    */
    async createExisting(clusterData: ClusterPostDto, projectFormatName?){
        clusterData['formatName'] = await this.generateFormatName(clusterData);
        if(projectFormatName){
          clusterData['project'] = await this.projectsService.getByFormatName(projectFormatName);
        }
        var cluster = await this.clusterRepository.save(clusterData);

        if(await this.kubernetesService.hasKubernetesAccess(cluster)){
          cluster = await this.postProvisionModifyCluster(cluster);
        }
        return cluster;
    }

    async updateByPatch(formatName: string, clusterData: ClusterPatchDto){
      var oldCluster = await this.clusterRepository.findOne({formatName: formatName});
      clusterData['formatName'] = await this.generateFormatName(clusterData);

      var mergedCluster = this.clusterRepository.merge(oldCluster, clusterData);
      var updatedCluster = await this.clusterRepository.update(oldCluster.id , mergedCluster);

      return await this.clusterRepository.findOne({id: oldCluster.id});
    }

    async getProjectClusters(formatName: string): Promise<ClusterGetDto[]>{
      var project = await this.projectsService.getByFormatName(formatName, ["clusters"]);
      var clusterGetDtos = [];

      for(var cluster of project.clusters){
        clusterGetDtos.push(new ClusterGetDto(cluster))
      }
      return clusterGetDtos;
    }

    /*
    * Will puzzle together a cluster containing correct credentials for the user
    */
    async getProjectCluster(projectFormatName: string, formatName: string, username: string ): Promise<ClusterGetDto>{
      var project = await this.projectsService.getByFormatName(projectFormatName);
      
      var cluster = await this.clusterRepository.findOne({formatName: formatName});
      var clusterGetDto = new ClusterGetDto(cluster);
      
      // Cluster can be in a state where we need to ask the vendor if something has changed
      if(this.hasVendorProgress(cluster)){
        await this.getAKSCluster(cluster.name);
      }
      
      if(await this.kubernetesService.hasKubernetesAccess(cluster)){
        var user = await this.usersRepository.findOne({username: username});
        clusterGetDto.personalToken = await this.rbacService.getClusterToken(project, cluster, user);
        clusterGetDto.dashboardUrl = await this.kubernetesService.getDashboardUrl(cluster);
      }
      
      return clusterGetDto;
    }

    public hasVendorProgress(cluster: any): boolean{
      if(!cluster.vendorState){
        return false;
      }
      var progressStates = this.configService.get<String[]>('cluster.progressStates');
      return progressStates.includes(cluster.vendorState);
    }

    async getProjectsClustersNamespaces(projectFormatName: string, clusterFormatName: string): Promise<any>{

      var project = await this.projectsService.getByFormatName(projectFormatName);
      var cluster = await this.clusterRepository.findOne({formatName: clusterFormatName});

      if(!cluster.readyForKubernetes()){
        this.logger.debug(`Cluster ${cluster.name} is not properly setup yet for Kubernetes communication.`);
        return [];
      }

      return await this.rbacService.getProjectsClustersNamespaces(project, cluster);

    }

    async getPersonalToken(projectFormatName: string, formatName: string, username: string ): Promise<string>{
      var project = await this.projectsService.getByFormatName(projectFormatName);
      var cluster = await this.clusterRepository.findOne({formatName: formatName});
      var user = await this.usersRepository.findOne({username: username});

      return await this.rbacService.getClusterToken(project, cluster, user);
    }

    async getCluster(formatName: string): Promise<Cluster>{
      return await this.clusterRepository.findOne({formatName: formatName});
    }

    async generateFormatName(cluster: any, iteration: number = 0){
        let formatName: string = cluster.name;
        //Do we even have a format name?
        if(!formatName){ formatName = "noname"; }
        //Convert special-characters and lowercase it
        // Remove dots
        formatName = formatName.replace(/\./g, "");
        formatName = encodeURIComponent(formatName.replace(/ /g,'')).toLowerCase();
        //Do we have a number to append to the format name?
        if(iteration !== 0){
          formatName = formatName + iteration;
        }
        let query = {formatName: formatName};
        if(cluster.id){
            query["id"] = Not(cluster.id);
        }
        var clusters = await this.clusterRepository.find(query);
        if(clusters && clusters.length > 0){
            this.logger.verbose("Formatname already exists: " + formatName);
            //Limit reached, TODO A better approach here would be good
            if(iteration > 200){
            this.logger.warn("Too many of the same name");
            return;
          }
          //We have a conflict, generate a new name
          return await this.generateFormatName(cluster, iteration + 1);
        }else{
          return formatName;
        }
      }

      async generateAccess(project: Project, cluster: Cluster, user: User){

      }


}
