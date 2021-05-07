import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';


import { AuthService }      from './auth.service';
import { LoggerService }    from '../logs/logs.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  
  constructor(
    private authService: AuthService,
    private logger: LoggerService
  ) {
    super();
    this.logger.setContext(LocalStrategy.name);
  }

  async validate(username: string, password: string): Promise<any> {
    this.logger.debug("Validating user " + username);
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}