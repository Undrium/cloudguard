import { Injectable, HttpException, HttpStatus  } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';

import { KubernetesService } from '../kubernetes/kubernetes.service';

import { Repository, Not } from 'typeorm';

const axios = require('axios').default;
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

@Injectable()
export class AzureConfiguratorService {
    private readonly logger = new Logger(AzureConfiguratorService.name);
    constructor(
        private configService: ConfigService,
        private kubernetesService: KubernetesService
    ) {
      
    }

    async setupYaml(cluster: any){
        try {
            let fileContents = fs.readFileSync(path.join(__dirname, '..', '..') + '\\azure-config\\nginx.yaml', {encoding: 'utf-8'});
            const data = yaml.safeLoadAll(fileContents); 
            this.kubernetesService.apply(cluster, data);

        } catch (e) {
            console.log(e);
        }
    }

}
