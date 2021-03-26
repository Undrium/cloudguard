import { Injectable } from '@nestjs/common';
const k8s = require('@kubernetes/client-node');
import { ConfigService } from '@nestjs/config';
import { Cluster } from '../clusters/cluster.entity';

import { ClientService }        from './client.service';
import { KubernetesService }    from './kubernetes.service';
import { LoggerService }        from '../common/logger.service';


@Injectable()
export class CloneService {
    private readonly logger = new LoggerService(CloneService.name);

    constructor(
        private configService: ConfigService, 
        private clientService: ClientService,
        private kubernetesService: KubernetesService
    ) {}

    async cloneNamespaceAndContent(namespaceName: string, sourceCluster: Cluster, targetCluster: Cluster, options: any): Promise<any[]>{
        this.logger.debug(`Attempting to clone namespace ${namespaceName} from ${sourceCluster.formatName} to ${targetCluster.formatName}`);
        var namespaces = [];
        // TODO use clone logic from previous projects 
        // TODO add a tracker which can rollback everything if something fails
        var newNamespaceName = options['newNamespaceName'] || namespaceName;
        await this.cloneNamespace(namespaceName, sourceCluster, targetCluster, newNamespaceName);

        return namespaces;
    }

    async cloneNamespace(namespaceName: string , sourceCluster: Cluster, targetCluster: Cluster, newNamespaceName: string){
        var namespace = await this.kubernetesService.getNamespace(sourceCluster, namespaceName);
        var targetNamespace = await this.kubernetesService.getNamespace(targetCluster, newNamespaceName);
        
        if(targetNamespace){
            console.log(newNamespaceName, targetNamespace)
            throw "Namespace already exists in target cluster " + targetCluster.formatName;
        }
        namespace.metadata.name = newNamespaceName;
        delete namespace.metadata.resourceVersion;
        await this.kubernetesService.createNamespace(targetCluster, namespace);

        return true;
    }
    

}
