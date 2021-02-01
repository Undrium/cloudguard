import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';

import { Repository, Not } from 'typeorm';

import { KubernetesService } from '../kubernetes/kubernetes.service';
import { AzureService } from '../vendors/azure.service';
import { ClientService } from '../kubernetes/client.service';
import { RbacService } from '../kubernetes/rbac.service';
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
    private readonly logger = new Logger(ClustersService.name);
    constructor(
        private azureService: AzureService,
        private configService: ConfigService,
        @InjectRepository(Cluster)
        private clusterRepository: Repository<Cluster>,
        private projectsService: ProjectsService,
        private kubernetesService: KubernetesService,
        private rbacService: RbacService,
        private usersService: UsersService,
        @InjectRepository(User)
        private usersRepository: Repository<User>
    ) {}

    async deleteClusterByFormatname(formatName: string){
        return await this.clusterRepository.delete({formatName: formatName});
    }


    async createAKSCluster(clusterData: any) {
      var clusterData = await this.azureService.createCluster(clusterData);
      // We need a reference somewhere, create it here
      if(clusterData.name){
        try{
          await this.create({
            name: clusterData.name,
            platform: "KUBERNETES",
            vendor: "AZURE",
            vendorState: "Creating",
            vendorLocation: clusterData.location
          });
        }catch(error){
          // Fallback!
          await this.azureService.deleteCluster(clusterData.name);
        }
      }

      return clusterData;
    }

    async getAKSCluster(name: string) {
      var azureCluster = await this.azureService.getCluster(name);
      // This is for updating the reference status so we won't spam Azure in vain
      if(
        azureCluster && azureCluster.properties && azureCluster.properties.provisioningState 
        && azureCluster.properties.provisioningState != "Creating"){
        var cluster = await this.getCluster(name);
        // Really important to make sure the cluster has standards configurated for the enterprise
        cluster = await this.azureService.postProvisionModifiyCluster(cluster, azureCluster);
        if(cluster){
          await this.update(cluster);
        }
      }
      return azureCluster;
    }

    async deleteAKSCluster(name: string) {

      var deleted: Boolean = await this.azureService.deleteCluster(name);
      
      if(deleted){
        await this.deleteClusterByFormatname(name);
      }
      
      return deleted;
    }

    async create(clusterData: any){
      clusterData['formatName'] = await this.generateFormatName(clusterData);
      return this.clusterRepository.save(clusterData);
    }

    async update(clusterData: any){
      clusterData['formatName'] = await this.generateFormatName(clusterData);
      return this.clusterRepository.save(clusterData);
    }

    async createByPost(clusterData: ClusterPostDto){
        clusterData['formatName'] = await this.generateFormatName(clusterData);
        return this.clusterRepository.save(clusterData);
    }

    async updateByPatch(formatName: string, clusterData: ClusterPatchDto){
      var oldCluster = await this.clusterRepository.findOne({formatName: formatName});
      clusterData['formatName'] = await this.generateFormatName(clusterData);

      var mergedCluster = this.clusterRepository.merge(oldCluster, clusterData);
      var updatedCluster = await this.clusterRepository.update(oldCluster.id , mergedCluster);

      return await this.clusterRepository.findOne({id: oldCluster.id});
    }

    async getProjectClusters(formatName: string): Promise<ClusterGetDto[]>{
      var project = await this.projectsService.getByFormatName(formatName);
      var ClusterGetDtos = [];
      // @todo connect clusters with user 
      var clusters = await this.clusterRepository.find();
      for(var cluster of clusters){
        ClusterGetDtos.push(new ClusterGetDto(cluster))
      }
      return ClusterGetDtos;
    }

    /*
    * Will puzzle together a cluster containing correct credentials for the user
    */
    async getProjectCluster(projectFormatName: string, formatName: string, username: string ): Promise<ClusterGetDto>{
      var project = await this.projectsService.getByFormatName(projectFormatName);
      
      var cluster = await this.clusterRepository.findOne({formatName: formatName});
      var clusterGetDto = new ClusterGetDto(cluster);
      
      var user = await this.usersRepository.findOne({username: username});
      
      clusterGetDto.namespaces = await this.rbacService.getNamespacesForProjectAndCluster(project, cluster);
      clusterGetDto.personalToken = await this.rbacService.getClusterToken(project, cluster, user);
      clusterGetDto.dashboardUrl = await this.kubernetesService.getDashboardUrl(cluster);
      
      return clusterGetDto;
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
