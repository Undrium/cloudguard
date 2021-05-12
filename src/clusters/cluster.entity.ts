import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";

import { Project } from "../projects/project.entity";

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

    @Column({ default: "LOCAL" })
    vendor: string;

    @Column({ default: "CREATED" })
    vendorState: string;

    @Column('jsonb', {nullable: true})
    specification?: object;

    @Column('jsonb', {nullable: false, default: {}})
    internal: {
        description?: string, 
        comment?: string
    };

    @Column('jsonb', {nullable: false, default: {}})
    external: {
        platformVersionInfo?: object;
        vendorLocation: string;
    };

    @ManyToOne(
        type => Project, 
        project => project.clusters, 
        { onUpdate: 'CASCADE', onDelete: 'CASCADE', nullable: true }
    )
    project: Project;

    public readyForKubernetes(){
        if(!this.apiServer){
            return false;
        }

        if(!(this.keyData && this.certData) && !this.token){
            return false;
        }
        return true;
    }

}