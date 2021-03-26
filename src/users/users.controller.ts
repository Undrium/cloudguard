import { Controller, Get, Body, Patch, Param, Post, Delete, UseGuards } from '@nestjs/common';
import { MustHaveJwtGuard }     from '../auth/must-have-jwt.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository }       from 'typeorm';

import { LoggerService }            from '../common/logger.service';
import { ResponseService }          from '../common/response.service';

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
        private usersService: UsersService,
        private responseService: ResponseService
    ) {}

    @UseGuards(MustHaveJwtGuard)
    @Get()
    async findAll(): Promise<any> {
        this.logger.verbose("Finding all users");
        var users = await this.usersRepository.find({relations: ["projectRoles", "projectRoles.project", "projectRoles.role", "preferences"]});
        return this.responseService.createResponse(users, "Found all users.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Post()
    async create(@Body() userPostDto: UserPostDto) {
        var user = await this.usersService.createByDto(userPostDto);
        return this.responseService.createResponse(user, "Created user.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Patch('/preferences')
    async updatePreferences(@UserDec() user, @Body() preferences: any) {
        var response = await this.usersService.updatePreferences(user.username, preferences);
        return this.responseService.createResponse(response, "Updated preferences for user.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Patch(':username')
    async update(@Param('username') username, @Body() userPostDto: UserPostDto) {
        var response = await this.usersService.updateByDto(username, userPostDto);
        return this.responseService.createResponse(response, "Updated user.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Get('/count')
    async count(): Promise<any> {
        this.logger.verbose("Counting users");
        var count = await this.usersRepository.count();
        return this.responseService.createResponse(count, "Counted users.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Get(':username')
    async fetchOne(@Param('username') username) {
        var user = await this.usersService.getDtoByUsername(username);
        return this.responseService.createResponse(user, "Got user.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Delete(':username')
    async delete(@Param('username') username) {
        var response = await this.usersRepository.delete({username: username});
        return this.responseService.createResponse(response, "Deleted user.");
    }

    
    
}
