import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { LoggerService }    from '../logs/logs.service';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {


    constructor(
        private logger: LoggerService
    ) {
        super();
        this.logger.setContext(LocalAuthGuard.name);
    }

    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        
        this.logger.debug("Validating if user can " + context.getClass().name + " " + context.getHandler().name);
        
        return super.canActivate(context);
    }
}