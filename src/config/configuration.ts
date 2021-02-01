export default () => ({
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
    aks: {
        clientId: process.env.CLOUDGUARD_AKS_CLIENT_ID,
        subscription: process.env.CLOUDGUARD_AKS_SUBSCRIPTION,
        secret: process.env.CLOUDGUARD_AKS_SECRET,
        resourceGroup: process.env.CLOUDGUARD_AKS_RESOURCE_GROUP
    }
  });