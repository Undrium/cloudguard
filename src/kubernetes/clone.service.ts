import { Injectable } from '@nestjs/common';
const k8s = require('@kubernetes/client-node');
import { ConfigService } from '@nestjs/config';
import { Cluster } from '../clusters/cluster.entity';


import { ClientService }        from './client.service';
import { KubernetesService }    from './kubernetes.service';
import { LoggerService }        from '../common/logger.service';
import { resourceLimits } from 'node:worker_threads';


@Injectable()
export class CloneService {
    private readonly logger = new LoggerService(CloneService.name);
    
    constructor(
        private configService: ConfigService, 
        private clientService: ClientService,
        private kubernetesService: KubernetesService
    ) {}

    async clone(options: any){

    }

    /*
    * Generic engine for cloning resources in Kubernetes
    */
    async cloneNamespaceAndContent(sourceNamespaceName: string, sourceCluster: Cluster, targetCluster: Cluster, options: any): Promise<any>{
        this.logger.debug(`Attempting to clone namespace ${sourceNamespaceName} from ${sourceCluster.formatName} to ${targetCluster.formatName}`);
        
        var namespaceBlueprint = this.createBlueprint("namespace", sourceNamespaceName, sourceCluster, targetCluster, options);
        var resource = await this.executeCloneBlueprint(namespaceBlueprint);

        this.logger.debug(`Attempting to clone deployments from ${sourceCluster.formatName} to ${targetCluster.formatName}`);
        
        var deploymentsBlueprint = this.createBlueprint("deployments", sourceNamespaceName, sourceCluster, targetCluster, options);
        var result = await this.executeCloneBlueprint(deploymentsBlueprint);
        
        return resource;
    }

    createBlueprint(typeName: string, sourceNamespaceName: string, sourceCluster: Cluster, targetCluster: Cluster, options: any){
        var cloneDefinition = require('./clone.definition').default;
        var blueprint = cloneDefinition[typeName];
        blueprint["type"] = typeName;

        blueprint["targetCluster"] = targetCluster;
        blueprint["sourceCluster"] = sourceCluster;
        blueprint["sourceNamespaceName"] = sourceNamespaceName;
        blueprint["targetNamespaceName"] =  options['targetNamespaceName'] || sourceNamespaceName;
        return blueprint;
    }

    async executeCloneBlueprint(blueprint: any){
        var sourceCluster = blueprint['sourceCluster'];
        var sourceResources: any = [];

        if(blueprint['list']){
            this.logger.debug(`Listing ${blueprint['type']} from ${sourceCluster.formatName}`);
            var sourceResourceList = await this.readResources(blueprint["sourceNamespaceName"], blueprint, sourceCluster);
            sourceResources = sourceResourceList.items || [];
        }else{
            this.logger.debug(`Reading one ${blueprint['type']} from ${sourceCluster.formatName}`);
            var singleSourceResource = await this.readResource(blueprint["sourceNamespaceName"], blueprint, sourceCluster, "");
            sourceResources.push(singleSourceResource);
        }

        var result = [];
        for(var sourceResource of sourceResources){
            if(blueprint.modifyBeforeUpdate){
                sourceResource = blueprint.modifyBeforeUpdate(sourceResource, blueprint);
            }
            var resource = await this.createOrUpsertResource(sourceResource, blueprint);
            result.push(resource);
        }
        return result;
    }

    async createOrUpsertResource(sourceResource: any, blueprint: any){
        var modifyResult = null;

        if(blueprint['createOnly']){
            this.logger.debug(`Creating one ${sourceResource.kind || "unknown"} in target ${blueprint['targetCluster'].name}`);
            modifyResult = await this.createResource(sourceResource, blueprint);  
        }else{
            this.logger.debug(`Upserting one ${sourceResource.kind || "unknown"} in target ${blueprint['targetCluster'].name}`);
            modifyResult = await this.upsertResource(sourceResource, blueprint);    
        }

        return modifyResult.body || modifyResult;
    }

    async upsertResource(sourceResource: any, blueprint: any){
        var targetClient = await this.kubernetesService.createClientByType(blueprint['client'], blueprint['targetCluster']);
  
        var targetName = "";
        if(blueprint.getTargetResourceName){
            targetName = blueprint.getTargetResourceName(sourceResource, blueprint);
        }
        var targetResource = await this.readResource(blueprint["targetNamespaceName"], blueprint, blueprint["targetCluster"], targetName);

        var modifyResult = null;

        if(targetResource){
            try{
                this.logger.debug(`Patching ${sourceResource.kind || "unknown"} in target ${blueprint['targetCluster'].name}`);
                const options = { "headers": { "Content-type": k8s.PatchUtils.PATCH_FORMAT_JSON_MERGE_PATCH}};
                modifyResult = await targetClient[blueprint['patchAction']](
                    blueprint["targetNamespaceName"], 
                    sourceResource, 
                    undefined, undefined, undefined, undefined, options
                    );
            }catch(error){
                this.logger.handleKubernetesError(error);
            }
        }else{
            try{
                this.logger.debug(`Inserting ${sourceResource.kind || "unknown"} in target ${blueprint['targetCluster'].name}`);
                if(blueprint['requiresNamespaceOnCreate']){
                    modifyResult = await targetClient[blueprint['createAction']](blueprint["targetNamespaceName"], sourceResource);
                }else{
                    modifyResult = await targetClient[blueprint['createAction']](sourceResource);
                }
            }catch(error){
                this.logger.handleKubernetesError(error);
            }
        }
        return modifyResult;
    }

    async createResource(resource, blueprint){
        var targetClient = await this.kubernetesService.createClientByType(blueprint['client'], blueprint['targetCluster']);

        var targetName = "";
        if(blueprint.getTargetResourceName){
            targetName = blueprint.getTargetResourceName(resource, blueprint);
        }
        var targetResource = await this.readResource(blueprint["targetNamespaceName"], blueprint, blueprint["targetCluster"], targetName);
        
        if(targetResource && blueprint['createOnly']){
            throw blueprint["type"] + " " + targetName + " already exists in target cluster " + blueprint["targetCluster"] .formatName;
        }
        var createResult = null;
        try{
            createResult = await targetClient[blueprint['createAction']](resource);
        }catch(error){
            this.logger.handleKubernetesError(error);
        }
        return createResult;
    }

    async readResource(namespaceName, blueprint, cluster, name){
        var client = await this.kubernetesService.createClientByType(blueprint['client'], cluster);
        var resource = false;
        try{
            var response = false;
            if(name){
                response = await client[blueprint['readAction']](name, namespaceName);
            }else{
                response = await client[blueprint['readAction']](namespaceName);
            }
            if(response['body']){
                resource = response['body'];
            }
        }catch(error){
            this.logger.handleKubernetesError(error);
            return false;
        }
        return resource;
    }

    async readResources(namespaceName, blueprint, cluster){
        var client = await this.kubernetesService.createClientByType(blueprint['client'], cluster);
        var resourceList = null;
        try{
            var response = false;
            response = await client[blueprint['readListAction']](namespaceName);
            if(response['body']){
                resourceList = response['body'];
            }
        }catch(error){
            this.logger.handleKubernetesError(error);
            return false;
        }
        return resourceList;
    }


}
