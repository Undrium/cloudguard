import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommonModule }   from '../common/common.module';

import { RegistriesController } from './registries.controller';

import { RegistriesService } from './registries.service';

import { Registry } from './registry.entity';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([Registry])
  ],
  controllers: [RegistriesController],
  providers: [RegistriesService],
  exports: [RegistriesService]
})
export class RegistriesModule {}
