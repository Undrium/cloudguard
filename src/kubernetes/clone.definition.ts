module.exports.default = {
    "namespace": {
        "client": "CoreV1Api",
        "list": false,
        "readAction": "readNamespace",
        "patchAction": "patchNamespace",
        "createAction": "createNamespace",
        "createOnly": false, 
        "modifyBeforeUpdate": function(newResource, blueprint){
            delete newResource.metadata.resourceVersion;
            delete newResource.metadata.uid;
            if(blueprint['targetNamespaceName']){
                newResource.metadata.name = blueprint['targetNamespaceName'];
            }
            return newResource;
        }
    },
    "deployments": {
        "client": "AppsV1Api",
        "list": true,
        "readAction": "readNamespacedDeployment",
        "readListAction": "listNamespacedDeployment",
        "patchAction": "patchNamespacedDeployment",
        "createAction": "createNamespacedDeployment",
        "requiresNamespaceOnCreate": true,
        "createOnly": false,
        "modifyBeforeUpdate": function(resource, blueprint){
            delete resource.metadata.resourceVersion;
            delete resource.metadata.uid;
            if(blueprint['targetNamespaceName']){
                resource.metadata.namespace = blueprint['targetNamespaceName'];
            }
            return resource;
        },
        "getTargetResourceName": function(resource, blueprint){
            var name = blueprint["newName"] || resource.metadata.name;
            return name;
        }
    }
}