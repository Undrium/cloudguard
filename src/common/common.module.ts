import { Module }               from '@nestjs/common';


import { LoggerService }        from './logger.service';
import { ResponseService }      from './response.service';



@Module({
  controllers: [],
  imports: [],
  providers: [
    LoggerService, 
    ResponseService
  ],
  exports: [
    LoggerService, 
    ResponseService
  ]
})
export class CommonModule {}
