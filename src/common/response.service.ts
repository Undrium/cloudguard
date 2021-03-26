import { LoggerService }    from './logger.service';

export class ResponseService {
  private readonly logger = new LoggerService(ResponseService.name);

  constructor(){

  }

  public createResponse(result, message){
    this.logger.verbose(message);
    return {
      result: result, 
      message: message
    }
  }
  
}