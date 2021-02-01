import {Column, Entity, PrimaryGeneratedColumn, BeforeUpdate, BeforeInsert} from "typeorm";


import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';

import { Repository, Not } from 'typeorm';

import { create } from 'domain';

@Entity()
export class Registry {
    private readonly logger = new Logger(Registry.name);
    constructor(
        private configService: ConfigService,
        @InjectRepository(Registry)
        private registryRepository: Repository<Registry>
    ) {}

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    formatName: string;

    @Column()
    provider: string;

    @Column()
    url: string;
    
    @Column()
    email: string;
    
    @Column()
    username: string;
    
    @Column()
    password: string;

    @Column()
    secretName: string;

    @Column()
    secret: string;


    @BeforeInsert()
    private async beforeInsert() {

    }
    
    @BeforeUpdate()
    private async beforeUpdate() {

    }

    

}