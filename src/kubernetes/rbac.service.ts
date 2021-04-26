import { Injectable } from '@nestjs/common';
const k8s = require('@kubernetes/client-node');

import { ConfigService } from '@nestjs/config';

import { Cluster } from '../clusters/cluster.entity';
import { Project } from 'src/projects/project.entity';
import { User } from 'src/users/user.entity';

import { LoggerService } from '../common/logger.service';

import { ClientService } from './client.service';

@Injectable()
export class RbacService {
    private readonly logger = new LoggerService(RbacService.name);

    constructor(private configService: ConfigService, private clientService: ClientService) {}

    async getClusterToken(project: Project, cluster: Cluster, user: User){
        const projectConfig = this.configService.get<any>('project');
        // Always setup before getting the token
        // TODO Actually bind the correct role to a user
        var setupGood = await this.setupAccessInProjectAndCluster(project, cluster, user, 'edit');
        if(!setupGood){
            this.logger.verbose("Problems with setting up access to cluster " + cluster.name + " and user "+ user.username);
            return "";
        }
        // @todo add try catch if failing and inform the client
        var client = this.clientService.createClient(cluster);
        try{
            var response = await client.listNamespacedSecret(projectConfig.serviceAccountsNamespace);
        }catch(err){
            
            this.logger.handleKubernetesError(err);
            return "";
        }
        if(!response || !response.body || !response.body.items){
            return "";
        }
        var foundName = "";
        var serviceAccountName = projectConfig.serviceAccountPrefix + user.username;
        for(var item of response.body.items) {
            if(item.metadata && item.metadata.name && item.metadata.name.includes(serviceAccountName+ "-token") && item.data.token)  {
                return item.data.token;
            }
        }
        return "";
    }

    async getProjectsClustersNamespaces(project: Project, cluster: Cluster): Promise<any[]>{
        var namespaces = [];
        var client = this.clientService.createClient(cluster);
        const projectConfig = this.configService.get<any>('project');
        try{
            var labelQuery = projectConfig.kubernetesLabelName + "=" + project.kubernetesIdentifier;
            var response = await client.listNamespace("", false, "", "", labelQuery);
        }catch(err){
            this.logger.handleKubernetesError(err);
            return [];
        }
        if(response && response.body && response.body.items){
            namespaces = response.body.items;
        }
        return namespaces;
    }

    async setupAccessInProjectAndCluster(project: Project, cluster: Cluster, user: User, roleType = 'edit'){

        // First delete all accesses 
        await this.deleteAllRolebindingsForUser(cluster, user);
        var serviceAccount = await this.upsertServiceAccount(cluster, user);
        if(!serviceAccount){
            this.logger.verbose("Service account not found or not possible to create for user: " + user.username || "No user");
            return false;
        }
        
        var namespaces = await this.getProjectsClustersNamespaces(project, cluster);
        var namespaceUpdates = [];
        // await this.displayRoleBindingsForServiceAccount(cluster, serviceAccount);
        for(var namespace of namespaces){
            // Skip if terminating
            if(namespace?.status?.phase == "Terminating"){continue;}
            namespaceUpdates.push(this.upsertRoleBinding(cluster, namespace.metadata.name, serviceAccount, roleType));
        }
        // Upsert the cluster read node role
        await this.upsertClusterNodeViewRole(cluster);
        // Add a cluster rolebinding
        var config = this.configService.get<any>('project');
        await this.upsertClusterRoleBinding(cluster, serviceAccount, config['clusterRoleReaderName']);

        return await Promise.all(namespaceUpdates);
    }

    async deleteAllRolebindingsForUser(cluster, user){
        var client = this.clientService.createClient(cluster);
        var clientRbac = this.clientService.createRbacClient(cluster);
        const projectConfig = this.configService.get<any>('project');
        var serviceAccountName = projectConfig.serviceAccountPrefix + user.username;
        try{
            var namespacesResponse = await client.listNamespace();
        }catch(err){
            this.logger.handleKubernetesError(err);
            return "";
        }
        var namespaces = [];
        if(namespacesResponse && namespacesResponse.body && namespacesResponse.body.items){
            namespaces = namespacesResponse.body.items;
        }
        var deletes = [];
        for(var namespace of namespaces){
            var roleBindingName = namespace.metadata.name+"-"+serviceAccountName;
            deletes.push(clientRbac.deleteNamespacedRoleBinding(roleBindingName, namespace.metadata.name));
        }
        try{
            await Promise.all(deletes)        
        }catch(err){
            this.logger.handleKubernetesError(err);
        }
        return true;
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

    async upsertServiceAccount(cluster: any, user: any){
        const projectConfig = this.configService.get<any>('project');
        var serviceAccountName = projectConfig.serviceAccountPrefix + user.username;
        var client = this.clientService.createClient(cluster);
        try{
            var serviceAccountResponse = await client.readNamespacedServiceAccount (serviceAccountName, projectConfig.serviceAccountsNamespace);
        }catch(err){

            if(err.statusCode && err.statusCode == 404){
                serviceAccountResponse = null;
            }else{
                this.logger.handleKubernetesError(err);
                return null;
            }
        }
        var serviceAccount = null;
        if(!serviceAccountResponse || !serviceAccountResponse.body){
            // Doesn't exist, create it
            var serviceAccountSpec = this.createServiceAccountSpec(serviceAccountName, projectConfig.serviceAccountsNamespace);
            serviceAccount = await client.createNamespacedServiceAccount(projectConfig.serviceAccountsNamespace, serviceAccountSpec);
        }else{
            // @todo modify service account here for an update if feasible
            try{
                serviceAccount = await client.replaceNamespacedServiceAccount(serviceAccountName, projectConfig.serviceAccountsNamespace, serviceAccountResponse.body);
            }catch(err){
                this.logger.handleKubernetesError(err);
                return null;
            }
        }
        return serviceAccount.body ? serviceAccount.body : null;
    }

    async upsertClusterNodeViewRole(cluster: any){
        var config = this.configService.get<any>('project');
        var clusterRoleName = config['clusterRoleReaderName'];
        var client = this.clientService.createRbacClient(cluster);
        
        if(!await this.clusterRoleExists(cluster, clusterRoleName)){
            try{
                var resp = await client.createClusterRole(this.createClusterRoleSpec(clusterRoleName));
            }catch(err){
                this.logger.handleKubernetesError(err);
                return null;
            }
        }

        return true;
    }

    createClusterRoleSpec(clusterRoleName: string){
        return {
            "apiVersion": "rbac.authorization.k8s.io/v1",
            "kind": "ClusterRole",
            "metadata": { "name": clusterRoleName },
            "rules": [{
                "apiGroups": [""], 
                "resources": ["nodes"],
                "verbs": ["get", "watch", "list"]
            },
            {
                "apiGroups": [""], 
                "resources": ["namespaces"],
                "verbs": ["get", "list", "watch", "create", "update", "patch", "delete"]
            }]
        }
    }

    createServiceAccountSpec(serviceAccountName: string, namespaceName: string){
        return {
            "apiVersion": "v1",
            "kind": "ServiceAccount",
            "metadata": {"name": serviceAccountName,"namespace": namespaceName}
        }
    }

    async upsertRoleBinding(cluster, namespaceName, serviceAccount, roleName){
        var client = this.clientService.createRbacClient(cluster);
        try{
            var roleBindingResponse = await client.listNamespacedRoleBinding(namespaceName);
        }catch(err){
            this.logger.handleKubernetesError(err);
            return null;
        }
        if(!roleBindingResponse || !roleBindingResponse.body || !roleBindingResponse.body.items){
            this.logger.verbose("Response in listRoleBinding is not valid");
            return false;
        }
        if(this.roleBindingExists(roleBindingResponse.body.items, serviceAccount, roleName)){
            this.logger.verbose("Cluster role already exists: "+ roleName);
            return true;
        }
        var foundRoleBinding = null;

        // Loop through all and remove service account first
        for(var roleBinding of roleBindingResponse.body.items){
            var modifiedRoleBinding = this.removeServiceAccountInRoleBinding(serviceAccount, roleBinding);
            // Update rolebinding with new list of subjects (minus the user)
            if(modifiedRoleBinding){
                try{
                    await client.replaceNamespacedRoleBinding(roleBinding.metadata.name, namespaceName, modifiedRoleBinding);
                }catch(err){
                    this.logger.handleKubernetesError(err);
                }
            }
            // This is the rolebinding we must add the user to
            if(roleBinding.roleRef.name == roleName){
                foundRoleBinding = roleBinding;
            }
        }

        if(!foundRoleBinding){
            // No rolebinding was found, create it instead
            try{
                await client.createNamespacedRoleBinding(namespaceName, this.createRoleBindingSpec(namespaceName, serviceAccount, roleName));
            }catch(err){
                this.logger.handleKubernetesError(err);
            }
        }else{
            // We have an upsert
            if(!foundRoleBinding.subjects){
                foundRoleBinding['subjects'] = [];
            }
            foundRoleBinding.subjects.push({
                "apiGroup": "",
                "kind": "ServiceAccount",
                "name": serviceAccount.metadata.name,
                "namespace": serviceAccount.metadata.namespace
            });
            try{
                await client.replaceNamespacedRoleBinding(foundRoleBinding.metadata.name, namespaceName, foundRoleBinding);
            }catch(err){
                this.logger.handleKubernetesError(err);
            }
        }
        return true;
    }

    async upsertClusterRoleBinding(cluster, serviceAccount, roleName){

        var client = this.clientService.createRbacClient(cluster);

        try{
            var clusterRoleBindingResponse = await client.listClusterRoleBinding();
        }catch(err){
            this.logger.handleKubernetesError(err);
            return null;
        }

        if(!clusterRoleBindingResponse || !clusterRoleBindingResponse.body || !clusterRoleBindingResponse.body.items){
            this.logger.verbose("Response in listRoleBinding is not valid");
            return false;
        }

        if(this.clusterRoleBindingExists(clusterRoleBindingResponse.body.items, serviceAccount, roleName)){
            this.logger.verbose("Cluster role already exists: "+ roleName);
            return true;
        }

        var foundClusterRoleBinding = null;
        // Loop through all and remove service account first
        for(var clusterRoleBinding of clusterRoleBindingResponse.body.items){
            // We can use the same function as roleBinding does
            var modifiedClusterRoleBinding = this.removeServiceAccountInRoleBinding(serviceAccount, clusterRoleBinding);
            // Update rolebinding with new list of subjects (minus the user)
            if(modifiedClusterRoleBinding){
                try{
                    var resp = await client.replaceClusterRoleBinding(clusterRoleBinding.metadata.name, modifiedClusterRoleBinding);
                    clusterRoleBinding = resp.body;
                }catch(err){
                    this.logger.handleKubernetesError(err);
                }
            }
            // This is the rolebinding we must add the user to
            if(clusterRoleBinding.roleRef.name == roleName){
                foundClusterRoleBinding = clusterRoleBinding;
            }
        }

        if(!foundClusterRoleBinding){
            // No rolebinding was found, create it instead
            try{
                await client.createClusterRoleBinding(this.createClusterRoleBindingSpec(serviceAccount, roleName));
            }catch(err){
                this.logger.handleKubernetesError(err);
            }
        }else{
            // We have an upsert
            if(!foundClusterRoleBinding.subjects){
                foundClusterRoleBinding['subjects'] = [];
            }
            foundClusterRoleBinding.subjects.push({
                "apiGroup": "",
                "kind": "ServiceAccount",
                "name": serviceAccount.metadata.name,
                "namespace": serviceAccount.metadata.namespace
            });
            try{
                await client.replaceClusterRoleBinding(foundClusterRoleBinding.metadata.name, foundClusterRoleBinding);
            }catch(err){
                this.logger.handleKubernetesError(err);
            }
        }
        return true;
    }

    async displayRoleBindingsForServiceAccount(cluster:any, serviceAccount: any){
        console.log("Finding role bindings for " + serviceAccount.metadata.name);
        var output = [];
        var clusterOutput = [];
        var clusterRoleBindings = await this.getClusterRoleBindingsForServiceAccount(cluster, serviceAccount);
        if(clusterRoleBindings.length > 0){
            console.log("Found clusterrolebindings: ");
            for(var clusterRoleBinding of clusterRoleBindings){
                clusterOutput.push({
                    "name": clusterRoleBinding.metadata.name,
                    "role": clusterRoleBinding.roleRef.name
                });
            }
            console.table(clusterOutput);
        }
        var roleBindings = await this.getRoleBindingsForServiceAccount(cluster, serviceAccount);
        if(roleBindings.length > 0){
            console.log("Found rolebindings: ");
            for(var roleBinding of roleBindings){
                output.push({
                        name:roleBinding.metadata.name, 
                        namespace:roleBinding.metadata.namespace, 
                        role:roleBinding.roleRef.name
                    });
            }
            console.table(output);
        }

        
    }

    async getRoleBindingsForServiceAccount(cluster:any, serviceAccount: any){
        var namespaces = [];
        var allRolebindings = [];
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
        for(var namespace of namespaces){
            var rbs = await this.getRoleBindingsForServiceAccountPerNamespace(cluster, serviceAccount, namespace.metadata.name);
            allRolebindings = allRolebindings.concat(rbs);
        }
        return allRolebindings;
    }

    async getClusterRoleBindingsForServiceAccount(cluster:any, serviceAccount: any){
        var client = this.clientService.createRbacClient(cluster);
        try{
            var roleBindingResponse = await client.listClusterRoleBinding();
        }catch(err){
            this.logger.handleKubernetesError(err);
            return null;
        }
        if(!roleBindingResponse || !roleBindingResponse.body || !roleBindingResponse.body.items){
            return [];
        }
        var roleBindings = [];
        for(var roleBinding of roleBindingResponse.body.items){
            if(!roleBinding.subjects){continue;}
            
            for(var subject of roleBinding.subjects){
                if(subject.kind == 'ServiceAccount' && subject.name == serviceAccount.metadata.name){
                    roleBindings.push(roleBinding);
                }
            }
        }
        return roleBindings;
    }

    async getRoleBindingsForServiceAccountPerNamespace(cluster:any, serviceAccount: any, namespaceName: string){
        var client = this.clientService.createRbacClient(cluster);
        try{
            var roleBindingResponse = await client.listNamespacedRoleBinding(namespaceName);
        }catch(err){
            this.logger.handleKubernetesError(err);
            return null;
        }

        if(!roleBindingResponse || !roleBindingResponse.body || !roleBindingResponse.body.items){
            return [];
        }
        var roleBindings = [];
        for(var roleBinding of roleBindingResponse.body.items){
            if(!roleBinding.subjects || !roleBinding.subjects.length){
                continue;
            }
            for(var subject of roleBinding.subjects){
                
                if(subject.kind == 'ServiceAccount' && subject.name == serviceAccount.metadata.name){
                    roleBindings.push(roleBinding);
                }
            }
        }
        return roleBindings;
    }

    createClusterRoleBindingSpec(serviceAccount: any, roleName: string){
        var roleBindingName = "kron-"+roleName;
        return {
            "apiVersion": "rbac.authorization.k8s.io/v1",
            "kind": "ClusterRoleBinding",
            "metadata": {
                "name": roleBindingName
            },
            "roleRef": {
                "apiGroup": "rbac.authorization.k8s.io",
                "kind": "ClusterRole",
                "name": roleName
            },
            "subjects": [{
                "apiGroup": "",
                "kind": "ServiceAccount",
                "name": serviceAccount.metadata.name,
                "namespace": serviceAccount.metadata.namespace
            }]
        };
    }

    async clusterRoleExists(cluster: any, clusterRoleName: string): Promise<boolean>{
        var client = this.clientService.createRbacClient(cluster);
        var clusterRole = null;
        try{
            clusterRole = await client.readClusterRole(clusterRoleName);
        }catch(err){
            this.logger.handleKubernetesError(err);
        }
        return clusterRole ? true: false;
    }

    clusterRoleBindingExists(clusterRoleBindings: any, serviceAccount: any, roleName: string): boolean{
        for(var clusterRoleBinding of clusterRoleBindings){
            if(clusterRoleBinding.roleRef.name == roleName && clusterRoleBinding.subjects && clusterRoleBinding.subjects.length){
                for(var subject of clusterRoleBinding.subjects){
                    if(
                        serviceAccount.metadata.namespace == subject.namespace && 
                        subject.kind == "ServiceAccount" && 
                        serviceAccount.metadata.name == subject.name 
                        ){
                        return true;
                    }
                }
            }
        }
        return false;
    }

    roleBindingExists(roleBindings: any, serviceAccount: any, roleName: string): boolean{
        for(var roleBinding of roleBindings){
            if(roleBinding.roleRef.name == roleName && roleBinding.subjects && roleBinding.subjects.length){
                for(var subject of roleBinding.subjects){
                    if(
                        serviceAccount.metadata.namespace == subject.namespace && 
                        subject.kind == "ServiceAccount" && 
                        serviceAccount.metadata.name == subject.name 
                        ){
                        return true;
                    }
                }
            }
        }
        return false;
    }

    createRoleBindingSpec(namespaceName: string, serviceAccount: any, roleName: string){
        var roleBindingName = namespaceName+"-kron-"+roleName;
        return {
            "apiVersion": "rbac.authorization.k8s.io/v1",
            "kind": "RoleBinding",
            "metadata": {
                "name": roleBindingName,
                "namespace": namespaceName
            },
            "roleRef": {
                "apiGroup": "rbac.authorization.k8s.io",
                "kind": "ClusterRole",
                "name": roleName
            },
            "subjects": [{
                "kind": "ServiceAccount",
                "name": serviceAccount.metadata.name,
                "namespace": serviceAccount.metadata.namespace
            }]
        };
    }

    /*
    * Returns nothing if not modified, returns rolebinding if modified
    */
    removeServiceAccountInRoleBinding(serviceAccount: any, roleBinding: any): any{
        if(!roleBinding || !roleBinding.subjects || roleBinding.subjects.length == 0){
            return null;
        }
        var foundSubject = null;
        for(var subjectKey in roleBinding.subjects){
            var subject = roleBinding.subjects[subjectKey];
            if(subject.kind == 'ServiceAccount' && subject.name == serviceAccount.metadata.name){
                foundSubject = subject;
                delete roleBinding.subjects[subjectKey];
            }
        }
        return foundSubject ? roleBinding : null;
    }

}
