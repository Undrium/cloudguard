import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class Cluster {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ unique:true })
    formatName: string;

    @Column({ default: "NONE" })
    apiServer: string;

    @Column({ type: "text", default: "" })
    token: string;

    @Column({ type: "text", default: "" })
    certData: string;

    @Column({ type: "text", default: "" })
    keyData: string;

    @Column({ nullable: true })
    dashboardUrl: string;

    @Column({ default: "KUBERNETES" })
    platform: string;

    @Column('jsonb', {nullable: true})
    platformVersionInfo?: object;

    @Column({ default: "LOCAL" })
    vendor: string;

    @Column({ default: "CREATED" })
    vendorState: string;

    @Column('jsonb', {nullable: true})
    specification?: object;

    @Column({ default: "" })
    vendorLocation: string;

}