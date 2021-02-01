import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

import { Role } from '../roles/role.entity';
import { User } from './user.entity';
import { Project } from '../projects/project.entity';
import { UserPreference } from './user-preference.entity';

@Module({
  controllers: [UsersController],
  exports: [UsersService],
  imports: [
    TypeOrmModule.forFeature([Role]), 
    TypeOrmModule.forFeature([User]), 
    TypeOrmModule.forFeature([Project]), 
    TypeOrmModule.forFeature([UserPreference])
  ],
  providers: [UsersService],
})
export class UsersModule {}
