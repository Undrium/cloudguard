import { Injectable } from '@nestjs/common';

import { LoggerService }    from '../logs/logs.service';

@Injectable()
export class ResponseService {

  constructor(
    private logger: LoggerService
  ){
    this.logger.setContext(ResponseService.name);
  }

  public createResponse(result, message, metadata?: any){
    var data = {
      result: result, 
      message: message
    };
    if(metadata){
      data['metadata'] = metadata;
    }
    this.logger.verbose(data);
    return data;
  }
  
}