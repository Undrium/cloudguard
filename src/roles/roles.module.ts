import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommonModule }   from '../common/common.module';

import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

import { Role } from './role.entity';

@Module({
    imports: [
        CommonModule,
        TypeOrmModule.forFeature([Role])
    ],
    controllers: [RolesController],
    exports: [RolesService],
    providers: [RolesService],
})
export class RolesModule {}
