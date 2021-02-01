import { Column, Entity, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, JoinColumn, BeforeUpdate} from "typeorm";

import { User } from "../users/user.entity";

@Entity()
export class UserPreference {   
    @ManyToOne(type => User, user => user.preferences, { primary: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
    user: User;

    @PrimaryColumn()
    readonly preferenceName: string;

    @Column()
    readonly preferenceValue: string;
}