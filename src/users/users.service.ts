import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LoggerService }    from '../common/logger.service';

import { Role }             from '../roles/role.entity';
import { User }             from './user.entity';
import { UserGetDto }       from './user-get.dto';
import { UserPostDto }      from './user-post.dto';
import { Project }          from '../projects/project.entity';
import { ProjectRole }      from '../project-roles/project-role.entity';
import { UserPreference }   from './user-preference.entity';

@Injectable()
export class UsersService {

    private readonly logger = new LoggerService(UsersService.name);

    constructor(
        private configService: ConfigService,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
        @InjectRepository(UserPreference)
        private userPreferenceRepository: Repository<UserPreference>,
        @InjectRepository(Role)
        private roleRepository: Repository<Role>
    ) {}


    // Users which are always there
    async getMemoryUsers(): Promise<any>{
        const defaultUsers = this.configService.get<Array<any>>('defaultUsers');
        return defaultUsers;
    }

    async createClientUser(username: string): Promise<UserGetDto>{
        var user = await this.usersRepository.findOne({username: username},
            {relations: ["projectRoles", "projectRoles.project", "projectRoles.role", "preferences"]});
        // A little special for admin
        if(user.usertype == 'admin'){
            user.projectRoles = [];
            var projects = await this.projectRepository.find();
            for(var project of projects){
                user.projectRoles.push(new ProjectRole({project:project}));
            }

        }    
        let clientUser: UserGetDto = new UserGetDto(user);
        return clientUser;
    }

    async upsert(userData: any){
        var user = await this.usersRepository.findOne({username: userData.username});
        if(!user){
            user = await this.usersRepository.save(userData);
        }else{
            await this.usersRepository.update(user.id , this.usersRepository.merge(user, userData));
            user = await this.usersRepository.findOne({id: user.id});
        }
        return user;
    }

    /*
    * Update based on our data transfer object
    */
    async updateByDto(username: string, userPostDto: UserPostDto){
        var user = await this.usersRepository.findOne({username: username});
        await this.usersRepository.update(user.id, this.usersRepository.merge(user, userPostDto));
        user = await this.usersRepository.findOne({id: user.id});
        return user;
    }

    async createByDto(userPostDto: UserPostDto){
        var user = await this.usersRepository.save(userPostDto);
        return user;
    }

    async getByUsername(username: string, relations = []): Promise<User>{
        var user = await this.usersRepository.findOne({username: username}, {relations: relations});
        // A little special for admin
        if(user && user.usertype == 'admin' && relations.includes("projectRoles")){
            user.projectRoles = [];
            var projects = await this.projectRepository.find();
            var role = await this.roleRepository.findOne({"name": "admin"});
            for(var project of projects){
                var projectRole = new ProjectRole({project:project, role: role});
                user.projectRoles.push(projectRole);
            }
        }    
        return user;
    }

    async updatePreferences(username: string, preferences: any): Promise<any>{
        let user = await this.getByUsername(username, ["preferences"]);

        user.preferences = preferences.map(obj => ({ ...obj, id: user.id }));
        try{
            await this.usersRepository.save(user);
        }catch(error){
            this.logger.error(error);
            return false;
        }
        return true;
    }

    async getDtoByUsername(username: string): Promise<UserGetDto>{
        let user = await this.getByUsername(username, ["projectRoles", "projectRoles.project", "projectRoles.role"]);
        let userDto: UserGetDto = new UserGetDto(user);
        return userDto;
    }

    async UserIsAllowed(username: string, projectFormatName: string, allowedRoles: string[]): Promise<boolean>{
        var user = await this.getByUsername(username, ["projectRoles", "projectRoles.project", "projectRoles.role"]);
        if(!user){
            this.logger.verbose("Could not find user " + username + " therefor failing guard check.");
            return false;
        }
        if(user.usertype == 'admin'){
            return true;
        }
        var project = await this.projectRepository.findOne({formatName: projectFormatName});
        for(var projectRole of user.projectRoles){
            // Do we have a match?
            if(projectRole.project && projectRole.project.id == project.id){
                // Does the user have the right role?
                if(projectRole.role && projectRole.role.name && allowedRoles.includes(projectRole.role.name)){
                    return true;
                }
            }
        }
        this.logger.verbose("User is not allowed: " + username);
        return false;
    }

}
