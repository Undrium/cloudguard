import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistriesController } from './registries.controller';
import { RegistriesService } from './registries.service';

import { Registry } from './registry.entity';

@Module({
  controllers: [RegistriesController],
  imports: [TypeOrmModule.forFeature([Registry])],
  providers: [RegistriesService],
  exports: [RegistriesService]
})
export class RegistriesModule {}
