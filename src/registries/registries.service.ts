import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';

import { Repository, Not } from 'typeorm';
import { Registry } from './registry.entity';
import { create } from 'domain';


@Injectable()
export class RegistriesService {
    private readonly logger = new Logger(RegistriesService.name);

    constructor(
        private configService: ConfigService,
        @InjectRepository(Registry)
        private registryRepository: Repository<Registry>
    ) {}


    async create(registryData: any){
        registryData['formatName'] = await this.generateFormatName(registryData)
        return this.registryRepository.save(registryData);
    }

    async deleteRegistryByFormatName(formatName: string){
        return await this.registryRepository.delete({formatName: formatName});
    }

    async generateFormatName(registry: Registry, iteration: number = 0){
        let formatName: string = registry.name;
        //Do we even have a format name?
        if(!formatName){ formatName = "noname"; }
        //Convert special-characters and lowercase it
        // Remove dots
        formatName = formatName.replace(/\./g, "");
        formatName = encodeURIComponent(formatName.replace(/ /g,'')).toLowerCase();
        //Do we have a number to append to the format name?
        if(iteration !== 0){
          formatName = formatName + iteration;
        }
      
        let query = {formatName: formatName};
        if(registry.id){
            query["id"] = Not(registry.id);
        }
        var registries = await this.registryRepository.find(query);
        if(registries && registries.length > 0){
            this.logger.verbose("Formatname already exists: " + formatName);
            //Limit reached, TODO A better approach here would be good
            if(iteration > 200){
            this.logger.warn("Too many of the same name");
            return;
          }
          //We have a conflict, generate a new name
          return await this.generateFormatName(registry, iteration + 1);
        }else{
          return formatName;
        }
      }

}
