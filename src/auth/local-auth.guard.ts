import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { LoggerService }    from '../logger.service';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
    private readonly logger = new LoggerService(LocalAuthGuard.name);

    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        
        this.logger.debug("Can activate " + context.getClass().name + " " + context.getHandler().name);
        
        return super.canActivate(context);
    }
}