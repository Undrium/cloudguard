import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';


import { AuthModule } from './auth/auth.module';
import { ClustersModule } from './clusters/clusters.module';
import { KubernetesModule } from './kubernetes/kubernetes.module';
import { RegistriesModule } from './registries/registries.module';
import { UsersModule } from './users/users.module';
import { SandboxModule } from './sandbox/sandbox.module';

import { Cluster } from './clusters/cluster.entity';
import { Registry } from './registries/registry.entity';
import { User } from './users/user.entity';
import { UserPreference } from './users/user-preference.entity';
import { Project } from './projects/project.entity';
import { ProjectRole } from './project-roles/project-role.entity';
import { Role } from './roles/role.entity';

import configuration from './config/configuration';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjectsModule } from './projects/projects.module';
import { RolesModule } from './roles/roles.module';
import { ProjectRolesModule } from './project-roles/project-roles.module';



@Module({
  imports: [
    AuthModule, 
    ClustersModule, 
    KubernetesModule,
    RegistriesModule,
    SandboxModule,
    UsersModule, 
    RolesModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
    TypeOrmModule.forRoot({
      type: 'mariadb',
      host: process.env.CLOUDGUARD_MARIADB_HOST,
      port: 3306,
      username: process.env.CLOUDGUARD_MARIADB_USERNAME,
      password: process.env.CLOUDGUARD_MARIADB_PASSWORD,
      database: process.env.CLOUDGUARD_MARIADB_DATABASE,
      entities: [User, UserPreference, Cluster, Registry, Role, Project, ProjectRole],
      synchronize: true
    }),
    ProjectsModule,
    ProjectRolesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
