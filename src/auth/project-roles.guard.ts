import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

import { UsersService }         from '../users/users.service';
import { LoggerService }        from '../logger.service';


@Injectable()
export class ProjectRolesGuard implements CanActivate {
    private readonly logger = new LoggerService(ProjectRolesGuard.name);

    constructor(private usersService: UsersService, private reflector: Reflector){}

    async canActivate(context: ExecutionContext,): Promise<boolean> {
        this.logger.verbose("Guard check " + context.getClass().name + " " + context.getHandler().name);

        const allowedRoles = this.reflector.get<string[]>('projectRoles', context.getHandler());
        if(!allowedRoles || allowedRoles.length == 0){
            this.logger.debug("Missing allowed roles for guard.");
            return false;
        }

        const request = context.switchToHttp().getRequest();
        const userContext = request.user;
        
        if(!request.params || !request.params.projectFormatName){
            this.logger.debug("Parameter projectFormatName required in path to validate role.");
            return false;
        }

        if(!userContext || !userContext.username){
            this.logger.debug("Could not find user in context to validate role.");
            return false;
        }

        return await this.usersService.UserIsAllowed(userContext.username, request.params.projectFormatName, allowedRoles);
    }

}
