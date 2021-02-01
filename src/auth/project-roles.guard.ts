import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

import { UsersService } from '../users/users.service';


@Injectable()
export class ProjectRolesGuard implements CanActivate {
    constructor(private usersService: UsersService, private reflector: Reflector){}
    async canActivate(context: ExecutionContext,): Promise<boolean> {
        const allowedRoles = this.reflector.get<string[]>('projectRoles', context.getHandler());
        if(!allowedRoles || allowedRoles.length == 0){
            console.log("Missing allowed roles for guard.");
            return false;
        }
        const request = context.switchToHttp().getRequest();
        const userContext = request.user;
        if(!request.params || !request.params.projectFormatName){
            console.log("Parameter projectFormatName required in path to validate role.");
            return false;
        }
        if(!userContext || !userContext.username){
            console.log("Could not find user in context to validate role.");
            return false;
        }
        return await this.usersService.UserIsAllowed(userContext.username, request.params.projectFormatName, allowedRoles);
    }

}
