import { Injectable, HttpException, HttpStatus  } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Logger } from '@nestjs/common';

import { AzureConfiguratorService } from './azure-configurator.service';
import { SimpleConsoleLogger } from 'typeorm';

const axios = require('axios').default;
const yaml = require('js-yaml');
const querystring = require('querystring');


@Injectable()
export class AzureDataSource {
    private readonly logger = new Logger(AzureDataSource.name);

    constructor(
        private configService: ConfigService,
        private azureConfiguratorService: AzureConfiguratorService
    ) {
      
    }

    async getCluster(resourceName: string){
        var token = await this.authenticate();
        // TODO Move these
        var subscriptionId = this.configService.get<string>('aks.subscription');
        var resourceGroup = this.configService.get<string>('aks.resourceGroup');
        var url = "https://management.azure.com/subscriptions/"+subscriptionId+"/resourceGroups/"+resourceGroup+"/providers/Microsoft.ContainerService/managedClusters/"+resourceName+"?api-version=2020-09-01";
        var options = {headers: { Authorization: `Bearer ${token}` }};
        try{
            var response = await axios.get(url, options);
        }catch(error){
            throw this.handleAzureError(error);
        }
        return response.data || null;
    }

    async getClusterMonitoringCredentials(resourceName: string){
        var token = await this.authenticate();
        // TODO Move these
        var subscriptionId = this.configService.get<string>('aks.subscription');
        var resourceGroup = this.configService.get<string>('aks.resourceGroup');
        var url = "https://management.azure.com/subscriptions/"+subscriptionId+"/resourceGroups/"+resourceGroup+"/providers/Microsoft.ContainerService/managedClusters/"+resourceName+"/listClusterMonitoringUserCredential?api-version=2020-09-01";
        var options = {headers: { Authorization: `Bearer ${token}` }};
        try{
            var response = await axios.post(url, {}, options);
            console.log(response.data);
        }catch(error){
            throw this.handleAzureError(error);
        }
        return response.data || null;
    }

    async getUpgradeProfile(resourceName: string){
        var token = await this.authenticate();
        // TODO Move these
        var subscriptionId = this.configService.get<string>('aks.subscription');
        var resourceGroup = this.configService.get<string>('aks.resourceGroup');
        var url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.ContainerService/managedClusters/${resourceName}/upgradeProfiles/default?api-version=2020-11-01`;
        var options = {headers: { Authorization: `Bearer ${token}` }};
        
        try{
            var response = await axios.get(url, options);
        }catch(error){
            throw this.handleAzureError(error);
        }
        console.log(response.data);
        return response.data || null;
    }

    async deleteCluster(resourceName: string): Promise<Boolean>{
        var token = await this.authenticate();
        // TODO Move these
        var subscriptionId = this.configService.get<string>('aks.subscription');
        var resourceGroup = this.configService.get<string>('aks.resourceGroup');
        var url = "https://management.azure.com/subscriptions/"+subscriptionId+"/resourceGroups/"+resourceGroup+"/providers/Microsoft.ContainerService/managedClusters/"+resourceName+"?api-version=2020-09-01";
        var options = {headers: { Authorization: `Bearer ${token}` }};
        try{
            var response = await axios.delete(url, options);
        }catch(error){
            throw this.handleAzureError(error);
        }
        // No content means we do not have the cluster anymore (it was deleted), response.data "" means also good delete
        if(response.status == 204 || response.data == ""){
            return true;
        }
        // Something else happened, deletion not really guaranteed
        return false;
    }

    async createCluster(clusterData: any): Promise<any>{
        console.log(clusterData.specification.properties);
        var name = clusterData.name;
        var token = await this.authenticate();
        // TODO Move these
        var subscriptionId = this.configService.get<string>('aks.subscription');
        var resourceGroup = this.configService.get<string>('aks.resourceGroup');
        var resourceName = name + "-generated";
        var url = "https://management.azure.com/subscriptions/"+subscriptionId+"/resourceGroups/"+resourceGroup+"/providers/Microsoft.ContainerService/managedClusters/"+resourceName+"?api-version=2020-09-01";
        
        var data = clusterData.specification;
        data.properties['dnsPrefix'] = resourceName;
        data.properties['servicePrincipalProfile'] = {
            clientId: this.configService.get<string>('aks.clientId'),
            secret: this.configService.get<string>('aks.secret')
        };       
        data.properties.agentPoolProfiles[0].name = clusterData.name;
        
        var options = {headers: { Authorization: `Bearer ${token}` }};
        try{
            var response = await axios.put(url, data, options);
        }catch(error){
            console.log("HERP", error);
            throw this.handleAzureError(error);
        }
        
        // Response will contain a data object describing the cluster, this will have for instance name
        return response.data || null;
    }

    async patchCluster(clusterName: string, clusterPatch: any): Promise<any>{
        var token = await this.authenticate();
        // TODO Move these
        var subscriptionId = this.configService.get<string>('aks.subscription');
        var resourceGroup = this.configService.get<string>('aks.resourceGroup');

        var url = "https://management.azure.com/subscriptions/"+subscriptionId+"/resourceGroups/"+resourceGroup+"/providers/Microsoft.ContainerService/managedClusters/"+clusterName+"?api-version=2020-09-01";
        
        try{
            var response = await axios.put(url, clusterPatch, {headers: { Authorization: `Bearer ${token}` }});
        }catch(error){
            throw this.handleAzureError(error);
        }
        
        // Response will contain a data object describing the cluster, this will have for instance name
        return response.data || null;
    }

    async getClusterAdminCredentials(resourceName: string){
        var token = await this.authenticate();
        // TODO Move these
        var subscriptionId = this.configService.get<string>('aks.subscription');
        var resourceGroup = this.configService.get<string>('aks.resourceGroup');
        var url = "https://management.azure.com/subscriptions/"+subscriptionId+"/resourceGroups/"+resourceGroup+"/providers/Microsoft.ContainerService/managedClusters/"+resourceName+"/listClusterAdminCredential?api-version=2020-09-01";
        var options = {headers: { Authorization: `Bearer ${token}` }};
        try{
            var response = await axios.post(url, {}, options);
        }catch(error){
            throw this.handleAzureError(error);
        }
        return response.data || null;
    }

    async getClusterKubeConfig(resourceName: string){
        var data = await this.getClusterAdminCredentials(resourceName);
        var token = null;
        if(data?.kubeconfigs){
            for(var kubeConfigWrapper of data.kubeconfigs){
                if(kubeConfigWrapper?.name?.includes("clusterAdmin")){
                    token = kubeConfigWrapper.value || null; 
                    break;
                }
            }
        }
        return token;
    }

    async getClusterAdminToken(resourceName: string){
        var data = await this.getClusterAdminCredentials(resourceName);
        var token = null;
        if(data && data['kubeconfigs'] && data['kubeconfigs'][0] && data['kubeconfigs'][0].value){
            let buff = Buffer.from(data['kubeconfigs'][0].value, "base64");
            const yamlData = yaml.load(buff.toString()); 
            if(yamlData?.users){
                for(var user of yamlData.users){
                    if(user.name && user.name.includes("clusterAdmin")){
                        token = user['user'].token || null; 
                    }
                }
            }

        }
        return token;
    }

    async authenticate(){
        var tenantId = "81fa766e-a349-4867-8bf4-ab35e250a08f";
        var clientId = this.configService.get<string>('aks.clientId');
        var baseUrl = "https://login.microsoftonline.com/"+tenantId+"/oauth2/v2.0/token";

        var secret = this.configService.get<string>('aks.secret');
        
        var data = {
            client_id: clientId,
            scope: "https://management.azure.com/.default",
            client_secret: secret,
            grant_type: "client_credentials"
        }

        var options = {
            headers: {'X-Csrf-Token': 1},
            rejectUnauthorized: false,
            resolveWithFullResponse: true
        };
        try{
            var response = await axios.post(baseUrl, querystring.stringify(data), options);
        }catch(error){
            console.log(error);
            throw this.handleAzureError(error);
        }
        return response.data.access_token || null;
    }

    async postProvisionModifyCluster(cluster: any, azureCluster: any): Promise<any>{
        if(azureCluster && azureCluster.properties && azureCluster.properties.fqdn){
            var fqdn = azureCluster.properties.fqdn;
            var apiSerer = "https://" + fqdn.replace('.', '.portal.');
            //TODO this must be fixed in the future, portal is a fulhack from MS
            cluster['apiServer'] = apiSerer;
        }
        cluster['token'] = await this.getClusterAdminToken(cluster.name);
        //TODO Configurator service should setup the rest of the containers/services we need
        //await this.azureConfiguratorService.setupYaml(cluster);
        return cluster;
    }

    handleAzureError(error: any): HttpException{
        if(error && error.response.data){
            return error.response.data;
        }
        return error;
    }

}
