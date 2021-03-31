import { Injectable } from '@nestjs/common';

import { ConfigService }    from '@nestjs/config';
import { Cluster }          from '../clusters/cluster.entity';

import { ClientService }    from './client.service';
import { LoggerService }    from '../common/logger.service';

@Injectable()
export class KubernetesService {
    private readonly logger = new LoggerService(KubernetesService.name);

    constructor(private configService: ConfigService, private clientService: ClientService) {}

    getDashboardUrl(cluster: Cluster){
        return cluster.apiServer + "/api/v1/namespaces/kubernetes-dashboard/services/http:kubernetes-dashboard:/proxy/"
    }

    async createClientByType(typeName: string, cluster: Cluster){
        return this.clientService.createClientByType(typeName, cluster);
    }

    async getNamespaces(cluster: Cluster): Promise<any[]>{
        var namespaces = [];
        var client = this.clientService.createClient(cluster);
        try{
            var response = await client.listNamespace("", false, "");
        }catch(err){
            this.logger.handleKubernetesError(err);
            return [];
        }
        if(response && response.body && response.body.items){
            namespaces = response.body.items;
        }
        return namespaces;
    }

    async getNamespace(cluster: Cluster, namespaceName: string): Promise<any>{
        var namespace = {};
        var client = this.clientService.createClient(cluster);
        try{
            var response = await client.readNamespace(namespaceName);
        }catch(err){
            this.logger.handleKubernetesError(err);
            return false;
        }
        if(response && response.body){
            namespace = response.body;
        }
        return namespace;
    }

    async createNamespace(cluster: Cluster, namespace: any): Promise<any>{
        var createdNamespace = {};
        var client = this.clientService.createClient(cluster);
        try{
            var response = await client.createNamespace(namespace);
        }catch(err){
            console.log(err);
            this.logger.handleKubernetesError(err);
            return createdNamespace;
        }
        if(response && response.body){
            createdNamespace = response.body;
        }
        return createdNamespace;
    }

    async findClusterRole(cluster, roleType = 'edit'){
        var client = this.clientService.createRbacClient(cluster);
        try{
            var response = await client.listClusterRole();
        }catch(err){
            this.logger.handleKubernetesError(err);
            return null;
        }
        if(!response || !response.body || !response.body.items){
            this.logger.verbose("Response in findClusterRole is not valid");
            return null;
        }
        for(var item of response.body.items){
            if(item.metadata.name == roleType){
                return item;
            }
        }
        return null;
    }

    async apply(cluster: any, specs: any[]): Promise<any[]> {
        const client = this.clientService.createObjectClient(cluster);

        const validSpecs = specs.filter((s) => s && s.kind && s.metadata);
        const created: any[] = [];
        for (const spec of validSpecs) {
            // this is to convince the old version of TypeScript that metadata exists even though we already filtered specs
            // without metadata out
            spec.metadata = spec.metadata || {};
            spec.metadata.annotations = spec.metadata.annotations || {};
            delete spec.metadata.annotations['kubectl.kubernetes.io/last-applied-configuration'];
            spec.metadata.annotations['kubectl.kubernetes.io/last-applied-configuration'] = JSON.stringify(spec);
            try {
                // try to get the resource, if it does not exist an error will be thrown and we will end up in the catch
                // block.
                await client.read(spec);
                // we got the resource, so it exists, so patch it
                const response = await client.patch(spec);
                created.push(response.body);
            } catch (e) {
                // we did not get the resource, so it does not exist, so create it
                try {
                const response = await client.create(spec);
                created.push(response.body);
                }catch(error){
                    console.log(error);
                }
                
            }
        }
        return created;
    }
}
