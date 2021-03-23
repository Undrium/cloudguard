import { Controller, Get, Body, Patch, Param, Post, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard }     from '../auth/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository }       from 'typeorm';

import { LoggerService } from '../logger.service';

import { User }                 from './user.entity';
import { User as UserDec }      from './user.decorator';
import { UserPostDto }          from './user-post.dto';
import { UsersService }         from './users.service';

@Controller('users')
export class UsersController {
    private readonly logger = new LoggerService(UsersController.name);
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private usersService: UsersService
    ) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(): Promise<User[]> {
        this.logger.verbose("Finding all users");
        return this.usersRepository.find({relations: ["projectRoles", "projectRoles.project", "projectRoles.role", "preferences"]});
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() userPostDto: UserPostDto) {
        return this.usersService.createByDto(userPostDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('/preferences')
    async updatePreferences(@UserDec() user, @Body() preferences: any) {
        return this.usersService.updatePreferences(user.username, preferences);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':username')
    async update(@Param('username') username, @Body() userPostDto: UserPostDto) {
        return this.usersService.updateByDto(username, userPostDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('/count')
    async count(): Promise<Number> {
        this.logger.verbose("Counting users");
        return this.usersRepository.count();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':username')
    async fetchOne(@Param('username') username) {
        return this.usersService.getDtoByUsername(username);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':username')
    async delete(@Param('username') username) {
        return await this.usersRepository.delete({username: username});
    }

    
    
}
