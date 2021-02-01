import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';


import { AuthDto } from '../auth/auth.dto';

import { UserGetDto } from '../users/user-get.dto';

import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    constructor(
        private configService: ConfigService,
        private usersService: UsersService, 
        private jwtService: JwtService
    ) {}

    async validateUser(username: string, password: string): Promise<any>{
        var user = await this.authenticateThroughMemory(username, password);
        if(!user){
            try{
                user = await this.authenticateThroughLdap(username, password)
            }catch(error){
                this.logger.warn("Failed authenticate with LDAP, net probably not accessible.");
                this.logger.verbose(error);
            }
        }
        if(user){
            // Add to our database for quick access
            await this.usersService.upsert(user);
        }
        return user;
    }

    async login(user: AuthDto) {
        let clientUser: UserGetDto = await this.usersService.createClientUser(user.username);
        const payload = { username: user.username, sub: clientUser.id };
        clientUser.token = this.jwtService.sign(payload);
        return clientUser;
    }

    async authenticateThroughMemory(username: string, password: string): Promise<any>{
        var memoryUsers = await this.usersService.getMemoryUsers();
        for(let memoryUser of memoryUsers){
            if(memoryUser.username == username && memoryUser.password == password){
                return memoryUser;
            }
        }
        console.log("no memory match");
        return null;
    }

    async authenticateThroughLdap(username: string, password: string): Promise<any>{
        // TODO ADD SSL/TLS
        let bulkUsername = this.configService.get<string>('ldap.username');
        let bulkPassword = this.configService.get<string>('ldap.password');
        let namespace = this.configService.get<string>('ldap.namespace');
        let organization = this.configService.get<string>('ldap.organization');
        let url = this.configService.get<string>('ldap.url');
        return new Promise(function(resolve, reject) {
            var ldap = require('ldapjs');
            var client = ldap.createClient({"url": url});  
            var opts = {
                filter: '(uid='+username+')',
                scope: 'sub',
                attributes:[]
            };
            // Login with our bulk-user which has search access to LDAP
            client.bind("cn="+bulkUsername+","+namespace+"", bulkPassword, function(err) {
                if(err){
                    client.destroy(err);
                    return reject(err);
                }
                client.search(organization, opts, function(err, res) {
                    var found = {};
                    if(err){
                        return reject(err);
                    }
                    res.on('searchEntry', function(entry) {
                        found = entry.object;
                    });
                    res.on('searchReference', function(referral) {
                        console.log('referral: ' + referral.uris.join());
                    });
                    res.on('error', function(err) {
                        console.error('error: ' + err.message);
                        return reject(err.message);
                    });
                    res.on('end', function(result) {
                        //We have a user, verify!
                        var userClient = ldap.createClient({url: url});
                        userClient.bind('cn='+username+","+namespace, password, function(err) {
                            if(!err){
                                return resolve({"username": username, "email": found['email'], "data": found});
                            }else{
                                return reject(err);
                            }
                        });//End verify
                    });
                });
            });//END client bind
        });//END Promise
    }
}
