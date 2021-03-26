import { Module }                 from '@nestjs/common';
import { JwtModule, JwtService }  from '@nestjs/jwt';
import { PassportModule }         from '@nestjs/passport';
import { ConfigService }          from '@nestjs/config';

import { AuthController }         from './auth.controller';

import { CommonModule }           from '../common/common.module';
import { UsersModule }            from '../users/users.module';

import { AuthService }            from './auth.service';

import { LocalStrategy }          from './local.strategy';
import { JwtStrategy }            from './jwt.strategy';

@Module({
  controllers: [ AuthController ],
  imports: [
    CommonModule,
    UsersModule, 
    PassportModule,
    JwtModule.registerAsync({
      imports:[],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: { expiresIn: '7200s' }
      }),
    })
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService]
})
export class AuthModule {}
