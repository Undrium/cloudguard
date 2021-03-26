import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Global modules
import { CommonModule }       from './common/common.module';
// Normal modules
import { AuthModule }         from './auth/auth.module';
import { ClustersModule }     from './clusters/clusters.module';
import { KubernetesModule }   from './kubernetes/kubernetes.module';
import { RegistriesModule }   from './registries/registries.module';
import { UsersModule }        from './users/users.module';
import { SandboxModule }      from './sandbox/sandbox.module';

import { Cluster }        from './clusters/cluster.entity';
import { Registry }       from './registries/registry.entity';
import { User }           from './users/user.entity';
import { UserPreference } from './users/user-preference.entity';
import { Project }        from './projects/project.entity';
import { ProjectRole }    from './project-roles/project-role.entity';
import { Role }           from './roles/role.entity';

import configuration from './config/configuration';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjectsModule } from './projects/projects.module';
import { RolesModule } from './roles/roles.module';
import { ProjectRolesModule } from './project-roles/project-roles.module';

@Module({
  imports: [
    AuthModule, 
    CommonModule,
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
      type: 'postgres',
      host: process.env.CLOUDGUARD_POSTGRES_HOST || "localhost",
      port: parseInt(process.env.CLOUDGUARD_POSTGRES_PORT || "5432"),
      username: process.env.CLOUDGUARD_POSTGRES_USERNAME || "postgres",
      password: process.env.CLOUDGUARD_POSTGRES_PASSWORD || "pass",
      database: process.env.CLOUDGUARD_POSTGRES_DATABASE || "cloudguard",
      entities: [User, UserPreference, Cluster, Registry, Role, Project, ProjectRole],
      synchronize: true
    }),
    ProjectsModule,
    ProjectRolesModule,
  ],
  controllers: [ AppController ],
  providers: [ AppService ],
  exports: [ CommonModule ]
})
export class AppModule {}
