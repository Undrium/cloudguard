import { Column, Entity, OneToMany, PrimaryGeneratedColumn, JoinColumn, BeforeUpdate} from "typeorm";

import { ProjectRole } from "../project-roles/project-role.entity";
import { UserPreference } from "./user-preference.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    username: string;

    @Column({ default: "noemail@poorguyreceiving.com" })
    email: string;

    @Column({ default: "user" })
    usertype: string;

    @OneToMany(type => UserPreference, userPreference => userPreference.user, {cascade: true})
    preferences: UserPreference[];

    @OneToMany(type => ProjectRole, projectRole => projectRole.user, {cascade: true})
    projectRoles: ProjectRole[];
    
}