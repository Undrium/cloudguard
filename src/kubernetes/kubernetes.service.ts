import { Injectable } from '@nestjs/common';

import { ConfigService }    from '@nestjs/config';
import { Cluster }          from '../clusters/cluster.entity';

import { ClientService }    from './client.service';
import { LoggerService }    from '../logs/logs.service';

@Injectable()
export class KubernetesService {

    constructor(
        private configService: ConfigService, 
        private clientService: ClientService,
        private logger: LoggerService
    ) {
        this.logger.setContext(KubernetesService.name);
    }

    getDashboardUrl(cluster: Cluster){
        return cluster.apiServer + "/api/v1/namespaces/kubernetes-dashboard/services/http:kubernetes-dashboard:/proxy/"
    }

    async createClientByType(typeName: string, cluster: Cluster){
        return this.clientService.createClientByType(typeName, cluster);
    }

    async hasKubernetesAccess(cluster: Cluster){
        if(!cluster || !cluster.apiServer){
            return false;
        }
        try{
            var versionInfo = await this.getKubernetesVersionInfo(cluster);
            return versionInfo ? true : false;
        }catch(error){
            this.logger.verbose(error);
        }
        return false;
    }

    async upsertArgo(cluster: Cluster, options: any){
        const k8s = require('@kubernetes/client-node');
        const argoConfig = this.configService.get<any>('clusterPlugins.argo');
        
        var createdNamespace = {};
        var client = this.clientService.createClient(cluster);

        
        this.logger.debug(`Creating namespace ${argoConfig.namespace} for Argo CD.`);
        try{
            // Call client immediately since we need to handle exceptions here aswell
            var response = await client.createNamespace({ metadata: { name: argoConfig.namespace } });
        }catch(error){
            if(error?.statusCode == 409){
                this.logger.debug(`Namespace ${argoConfig.namespace} already exists ...`);
            }else{
                console.log( error);
            }  
        }

        if(response && response.body){
            createdNamespace = response.body;
        }

        this.logger.debug(`Applying resources to ${argoConfig.namespace} namespace for Argo CD.`);
        var yamlData = await this.getArgoYaml();
        //await this.apply(cluster, yamlData, argoConfig.namespace);

        this.logger.debug(`Modifying service in ${argoConfig.namespace} namespace for access to Argo CD.`);
        try{    
            var response = await client.patchNamespacedService(
                "argocd-server", 
                argoConfig.namespace, 
                {"spec": {"type": "LoadBalancer"}},
                undefined, undefined, undefined, undefined,
                { "headers": { "Content-type": k8s.PatchUtils.PATCH_FORMAT_JSON_MERGE_PATCH}}
            );

            console.log(response.body.spec.ports);
        }catch(error){
            if(error?.response?.body){
                console.log(error.response.body);
            }else{
                console.log(error);
            }
        }
    }

    async getKubernetesVersionInfo(cluster: Cluster){
        var client = await this.createClientByType("VersionApi", cluster);
        var response = await client.getCode();
        return response.body || null;
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

    /*
    * Wrapper for creating namespaces fast, will handle exception on its own
    */
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

    /*
    * Apply specifications (of resources) to a cluster
    */
    async apply(cluster: any, specs: any[], namespace?): Promise<any[]> {
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
            
            var createString = `Creating ${spec.kind} ${spec.metadata?.name}`;
            
            
            if(!spec.metadata["namespace"] && namespace && spec.kind != "Namespace"){
                spec.metadata["namespace"] = namespace;
                createString += ` in namespace ${namespace}`
            }
            
            this.logger.debug(createString);
            
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

    async getArgoYaml(): Promise<any>{
        const argoConfig = this.configService.get<any>('clusterPlugins.argo');
        const yaml = require('js-yaml');
        const axios = require('axios').default;
        var yamlData = [];
        try {
            var response = await axios.get(argoConfig.resourceUrl, null);

            if(response.data){
                yamlData = yaml.loadAll(response.data); 
            }
            
        } catch (e) {
            console.log(e);
        }
        return yamlData;
    }
}
