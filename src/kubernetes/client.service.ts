import { Injectable } from '@nestjs/common';
const k8s = require('@kubernetes/client-node');
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Cluster } from '../clusters/cluster.entity';
import { Project } from 'src/projects/project.entity';
import { User } from 'src/users/user.entity';

@Injectable()
export class ClientService {
    private readonly logger = new Logger(ClientService.name);

    constructor(private configService: ConfigService) {}

    createRbacClient(cluster: Cluster){
        var kubeConfig = this.createKubeConfig(cluster);
        return kubeConfig.makeApiClient(k8s.RbacAuthorizationV1Api);
    }

    createClient(cluster: Cluster){
        var kubeConfig = this.createKubeConfig(cluster);
        return kubeConfig.makeApiClient(k8s.CoreV1Api);
    }

    createObjectClient(cluster: Cluster){
        var kubeConfig = this.createKubeConfig(cluster);
        return k8s.KubernetesObjectApi.makeApiClient(kubeConfig);
    }

    createKubeConfig(cluster: Cluster){
        const clusterConf = {
            name: cluster.name,
            server: cluster.apiServer,
            "insecure-skip-tls-verify": true,
            skipTLSVerify: true
        };
        const user = {
            name: 'default',
            token: cluster.token,
        };
        
        const context = {
            name: cluster.name,
            user: user.name,
            cluster: cluster.name,
        };
        const kubeConfig = new k8s.KubeConfig();
        kubeConfig.loadFromOptions({
            clusters: [clusterConf],
            users: [user],
            contexts: [context],
            currentContext: cluster.name,
        });
        return kubeConfig;
    }

}
