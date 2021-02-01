import {Column, Entity, PrimaryGeneratedColumn, OneToMany, JoinTable } from "typeorm";

import { ProjectRole } from "../project-roles/project-role.entity";

@Entity()
export class Project {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ default: "", nullable: false, unique: true })
    formatName: string;

    @Column({ default: "", nullable: false })
    kubernetesIdentifier: string;

    @OneToMany(
        type => ProjectRole, 
        projectRole => projectRole.project, 
        { cascade: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' }
    )
    projectRoles: ProjectRole[];
}