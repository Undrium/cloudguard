import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';

import { Repository, Not } from 'typeorm';
import { Project } from './project.entity';
import { ProjectRole } from '../project-roles/project-role.entity';
import { ProjectPostDto } from './project-post.dto';


@Injectable()
export class ProjectsService {
    private readonly logger = new Logger(ProjectsService.name);
    constructor(
        private configService: ConfigService,
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
    ) {
      
    }

    async getByFormatName(formatName: string): Promise<Project>{
      return this.projectRepository.findOne({formatName: formatName});
    }

    async create(project: any){
        project['formatName'] = await this.generateFormatName(project);
        return this.projectRepository.save(project);
    }

    async update(project: any, projectData: any){
      projectData['formatName'] = await this.generateFormatName(project);
      await this.projectRepository.update(project.id , this.projectRepository.merge(project, projectData));
      return await this.projectRepository.findOne({id: project.id});
    }

    async updateByDto(formatName: string, projectPostDto: ProjectPostDto){
      var project = await this.projectRepository.findOne({formatName: formatName});
      await this.projectRepository.save(this.projectRepository.merge(project, projectPostDto));
      project = await this.projectRepository.findOne({id: project.id});
    }
    
    async upsert(projectData: any): Promise<Project>{
      var project = await this.projectRepository.findOne({name: projectData.name});
      if(!project){
        project = await this.create(projectData);
      }else{
        project = await this.update(project, projectData);
      }
      return project;
    }

   

    async generateFormatName(cluster: any, iteration: number = 0){
      let formatName: string = cluster.name;
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
      if(cluster.id){
          query["id"] = Not(cluster.id);
      }
      var clusters = await this.projectRepository.find(query);
      if(clusters && clusters.length > 0){
          this.logger.verbose("Formatname already exists: " + formatName);
          //Limit reached, TODO A better approach here would be good
          if(iteration > 200){
          this.logger.warn("Too many of the same name");
          return;
        }
        //We have a conflict, generate a new name
        return await this.generateFormatName(cluster, iteration + 1);
      }else{
        return formatName;
      }
    }

}
