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
    async cloneNamespaceAndContent(sourceName: string, sourceCluster: Cluster, targetCluster: Cluster, options: any): Promise<any>{
        this.logger.debug(`Attempting to clone namespace ${sourceName} from ${sourceCluster.formatName} to ${targetCluster.formatName}`);
        
        var namespaceBlueprint = this.createBlueprint("namespace", sourceName, sourceCluster, targetCluster, options);

        var result = await this.executeCloneBlueprint(namespaceBlueprint);

        return result;
    }

    createBlueprint(typeName: string, sourceName: string, sourceCluster: Cluster, targetCluster: Cluster, options: any){
        var cloneDefinition = require('./clone.definition').default;
        var blueprint = cloneDefinition[typeName];
        blueprint["type"] = typeName;
        blueprint["targetCluster"] = targetCluster;
        blueprint["sourceCluster"] = sourceCluster;
        blueprint["sourceName"] = sourceName;
        blueprint["newName"] =  options['newName'] || sourceName;
        return blueprint;
    }

    async executeCloneBlueprint(blueprint: any){
        var sourceCluster = blueprint['sourceCluster'];
        var targetCluster = blueprint['targetCluster'];

        this.logger.verbose(`Creating Kube Client from API ${blueprint['client']} for source ${sourceCluster.formatName} to target ${targetCluster.formatName}`);
        var sourceClient = await this.kubernetesService.createClientByType(blueprint['client'], sourceCluster);
        var targetClient = await this.kubernetesService.createClientByType(blueprint['client'], targetCluster);
        
        var targetResource = await this.readOneResource(blueprint["newName"], blueprint, targetCluster, "");
        
        if(targetResource && blueprint['createOnly']){
            throw blueprint["type"] + " already exists in target cluster " + targetCluster.formatName;
        }
 
        var sourceResource = await this.readOneResource(blueprint["sourceName"], blueprint, sourceCluster, "");

        if(blueprint.modifyBeforeUpdate){
            sourceResource = blueprint.modifyBeforeUpdate(sourceResource, blueprint);
        }

        var modifyResult = null;
        
            if(targetResource){
                try{
                    var modifyResult = await targetClient[blueprint['patchAction']](blueprint["newName"], sourceResource);
                }catch(error){
                    this.logger.handleKubernetesError(error);
                }
            }else{
                try{
                    var modifyResult = await targetClient[blueprint['createAction']](sourceResource);
                }catch(error){
                    this.logger.handleKubernetesError(error);
                }
            }
            
        
        return modifyResult;
    }

    async readOneResource(name, blueprint, cluster, namespaceName){
        var client = await this.kubernetesService.createClientByType(blueprint['client'], cluster);
        var resource = false;
        try{
            var response = false;
            if(namespaceName){
                response = await client[blueprint['readAction']](namespaceName, name);
            }else{
                response = await client[blueprint['readAction']](name);
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


}
