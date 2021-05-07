import { Module }               from '@nestjs/common';

import { LoggerModule }       from '../logs/logs.module';
import { ResponseService }      from './response.service';

@Module({
  controllers: [],
  imports: [ LoggerModule ],
  providers: [
    ResponseService
  ],
  exports: [
    ResponseService,
    LoggerModule
  ]
})
export class CommonModule {}
