import { Injectable } from '@nestjs/common';

import { LoggerService }    from '../logs/logs.service';

@Injectable()
export class ResponseService {

  constructor(
    private logger: LoggerService
  ){
    this.logger.setContext(ResponseService.name);
  }

  public createResponse(result, message){
    this.logger.verbose(message);
    return {
      result: result, 
      message: message
    }
  }
  
}