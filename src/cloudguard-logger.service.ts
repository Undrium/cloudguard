import { LoggerService } from '@nestjs/common';
import { Logger } from '@nestjs/common';

export class CloudguardLogger implements LoggerService {
  private readonly logger
  constructor(sourceName: string){
    this.logger = new Logger(sourceName);
  }

  handleKubernetesError(error: any){
    if(error.code && error.code == 'ETIMEDOUT' && error.address){
      this.logger.error("Can't reach cluster " + error.address, error.stack);
    }else if(error.response && error.response.body && error.response.body.code && error.response.body.message){
      var code = error.response.body.code;
      if(code == 400 || code == 409 || code == 422){
        this.logger.error(error.response.body.message, error.stack);
      }
    }
    // Always go verbose if verbose
    this.verbose(error);
  }

  log(message: any) {
    this.logger.log(message);
  }

  error(error: any) {
    console.log("Started at ", (new Error().stack.split("at ")[2]).trim());
    this.logger.error(error, error.stack);
  }

  warn(message: any) {
    this.logger.warn(message);
  }

  debug(message: any) {
    this.logger.debug(message);
  }

  verbose(message: any) {
    this.logger.verbose(message);
  }

}