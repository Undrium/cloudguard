import { LoggerService as NestLoggerService } from '@nestjs/common';
import { Logger } from '@nestjs/common';

export class LoggerService implements NestLoggerService {
  private readonly logger
  constructor(sourceName: string){
    this.logger = new Logger(sourceName);
  }

  handleKubernetesError(error: any){
    if(error.code && error.code == 'ETIMEDOUT' && error.address){
      this.logger.error("Can't reach cluster " + error.address, error.stack);
    }else if(error.response && error.response.body && error.response.body.code && error.response.body.message){
      var code = error.response.body.code;
      if(code == 400 || code == 409 || code == 422 || code == 500){
        this.logger.error(error.response.body.message, error.stack);
      }
    }
    // Always go verbose if verbose
    this.verbose(error);
  }

  log(...args: any[]) {
    this.logger.log(args);
  }

  error(error: any) {
    console.log("Started at ", (new Error().stack.split("at ")[2]).trim());
    this.logger.error(error, error.stack);
  }

  warn(...args: any[]) {
    this.logger.warn(args);
  }

  debug(...args: any[]) {
    this.logger.debug(args);
  }

  verbose(...args: any[]) {
    this.logger.verbose(args);
  }

}