## Environment Variables
### Database 
The CloudGuard currently uses PostgreSQL, setup the following variables to make it work. Also make sure the PostgreSQL has the database up and running. It will be populated once the Cloudguard starts up.
* CLOUDGUARD_POSTGRES_HOST
* CLOUDGUARD_POSTGRES_PORT
* CLOUDGUARD_POSTGRES_USERNAME
* CLOUDGUARD_POSTGRES_PASSWORD
* CLOUDGUARD_POSTGRES_DATABASE

### Azure
* CLOUDGUARD_AKS_CLIENT_ID - The applications client ID if AKS API is needed
* CLOUDGUARD_AKS_SECRET - The secret attached to the client ID
* CLOUDGUARD_AKS_SUBSCRIPTION - The subscription in AKS being used for the clusters 
* CLOUDGUARD_AKS_RESOURCE_GROUP - The resource group where the AKS clusters will be stored

### LDAP
Cloudguard supports LDAP, to setup please provide the following environment variables
* CLOUDGUARD_LDAP_USERNAME - A service account to do lookups 
* CLOUDGUARD_LDAP_PASSWORD - A service account password
* CLOUDGUARD_LDAP_NAMESPACE - Where to do the lookup, for instance "ou=Internal,ou=Users,o=myorg" 
* CLOUDGUARD_LDAP_ORGANIZATION - Which organization, for instance "ou=Users,o=myorg"
* CLOUDGUARD_LDAP_URL - The URL where LDAP is located

## Setting up a Kubernetes Project for Cloudguard
The CloudGuard tries to find namespaces associated with a project through a label called 'cloudguard-project', this must exist
in the namespace for the cloudguard to know it's a valid project namespace. Example cloudguard-project=kron-project.

### Roles decorator
´@projectRoles´ before an endpoint will make sure the user has the proper role for the endpoint, this requires the projectformatname to be present so the system knows which project is being addressed. To fully use this decorator the projectRolesGuard is needed. 

´@projectRoles['edit', 'admin']´ for instance will give access to users having the edit or admin role to an endpoint.