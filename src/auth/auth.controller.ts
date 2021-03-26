import { Controller, Post, Body, UseGuards } from '@nestjs/common';

import { AuthService }      from '../auth/auth.service';
import { ResponseService }  from '../common/response.service';

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
    @Post('/refresh')
    async refresh() {
        return this.responseService.createResponse(true, "Refreshed.");
    }
}
