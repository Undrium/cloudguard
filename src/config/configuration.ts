export default () => ({
    logging: {
        logLevels: ['warn', 'debug', 'error'],
        logTypes: [
            "common", 
            "cluster_created", 
            "cluster_creation_started",
            "cluster_patched",
            "cluster_patching_started"
        ]
    },
    ldap: {
        username: process.env.CLOUDGUARD_LDAP_USERNAME,
        password: process.env.CLOUDGUARD_LDAP_PASSWORD,
        namespace: process.env.CLOUDGUARD_LDAP_NAMESPACE,
        organization: process.env.CLOUDGUARD_LDAP_ORGANIZATION,
        url: process.env.CLOUDGUARD_LDAP_URL
    },
    defaultUsers: [
        { "username": "kron","password": "optimusprime","usertype": "admin", "email": "kron@thisawesomemailcannotbetaken.com" },
        { "username": "bumblebee","password": "optimusprime","usertype": "user" }
    ],
    jwt:{
        // Salt added to the jwt nest uses todo; maybe look into this
        secret: "supersecretKeya"
    },
    project: {
        kubernetesLabelName: "cloudguard-project",
        serviceAccountPrefix: "cloudguard-user-",
        serviceAccountsNamespace: "default",
        clusterRoleReaderName: "node-reader",
        roles: [
            {"name": "view", "prefix": "cloudguard-view-"},
            {"name": "edit", "prefix": "cloudguard-edit-"},
            {"name": "admin", "prefix": "cloudguard-admin-"}
        ]
    },
    cluster: {
        // All states a cluster can have
        validStates: ["created", "creating", "patching", "deleting", "unknown"],
        // States which requires polling from vendor
        progressStates: ["deleting", "patching", "creating", "unknown"]
    },
    clusterPlugins: {
        // When argo cd is setup this config is defaulted
        argo:{
            namespace: "argocd",
            resourceUrl: "https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml"
        }
    },
    aks: {
        clientId: process.env.CLOUDGUARD_AKS_CLIENT_ID,
        subscription: process.env.CLOUDGUARD_AKS_SUBSCRIPTION,
        secret: process.env.CLOUDGUARD_AKS_SECRET,
        resourceGroup: process.env.CLOUDGUARD_AKS_RESOURCE_GROUP,
        // States which means Azure is doing stuff to cluster
        progressStates: ["Creating", "Upgrading", "Terminating"]
    }
  });