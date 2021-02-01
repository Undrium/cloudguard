import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';

@Injectable()
export class RolesService {
    constructor(
        private configService: ConfigService,
        @InjectRepository(Role)
        private rolesRepository: Repository<Role>
    ) {}

    async getById(id: number): Promise<Role>{
        return await this.rolesRepository.findOne({id: id});
    }

    async upsert(roleData: any): Promise<Role>{
        var role = await this.rolesRepository.findOne({name: roleData.name});
        if(!role){
            role = await this.rolesRepository.save(roleData);
        }else{
            await this.rolesRepository.update(role.id , this.rolesRepository.merge(role, roleData));
            role = await this.rolesRepository.findOne({id: role.id});
        }
        return role;
      }

}
