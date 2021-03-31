module.exports.default = {
    "namespace": {
        "client": "CoreV1Api",
        "readAction": "readNamespace",
        "patchAction": "patchNamespace",
        "createAction": "createNamespace",
        "createOnly": true, 
        "modifyBeforeUpdate": function(newResource, blueprint){
            delete newResource.metadata.resourceVersion;
            if(blueprint['newName']){
                newResource.metadata.name = blueprint['newName'];
            }
            return newResource;
        }
    }
}