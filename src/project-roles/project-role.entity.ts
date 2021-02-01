import {Column, Entity, PrimaryGeneratedColumn, OneToOne, ManyToOne, JoinColumn } from "typeorm";

import { Project } from "../projects/project.entity";
import { User } from "../users/user.entity";
import { Role } from "../roles/role.entity";

@Entity()
export class ProjectRole {
    constructor(data = {}){
        if(data["project"]){
            this.project = data["project"];
        }
        if(data["role"]){
            this.role = data["role"];
        }
    }
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => Project, project => project.projectRoles, { primary: true, nullable: false, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
    project: Project;

    @ManyToOne(type => User, user => user.preferences, { primary: true, nullable: false, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
    user: User;

    @ManyToOne(() => Role, role => role.id, { onUpdate: 'CASCADE', onDelete: 'CASCADE' })
    role: Role;
}