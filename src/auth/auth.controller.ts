import { Controller, Post, Body, UseGuards } from '@nestjs/common';

import { AuthService }      from '../auth/auth.service';
import { ResponseService }  from '../common/response.service';

import { User } from '../users/user.decorator';

import { AuthDto }          from '../auth/auth.dto';
import { LocalAuthGuard }   from '../auth/local-auth.guard';
import { MustHaveJwtGuard }     from './must-have-jwt.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService,
        private responseService: ResponseService) {}

    @UseGuards(LocalAuthGuard)
    @Post('/login')
    async login(@Body() authDto: AuthDto) {
        var response = await this.authService.login(authDto);
        return this.responseService.createResponse(response, "Logged in.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Post('/heartbeat')
    async refresh(@User() user) {
        var response = await this.authService.heartbeat(user);
        return this.responseService.createResponse(response, "Refreshed.");
    }
}
