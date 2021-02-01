import { Controller, Post, Body, UseGuards } from '@nestjs/common';

import { AuthService } from '../auth/auth.service';
import { AuthDto } from '../auth/auth.dto';
import { LocalAuthGuard } from '../auth/local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @UseGuards(LocalAuthGuard)
    @Post('/login')
    async login(@Body() authDto: AuthDto) {
        return this.authService.login(authDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post('/refresh')
    async refresh() {
        return true;
    }
}
