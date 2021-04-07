import { Controller, Get, UseGuards, Param, Post, Patch, Body, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository }     from '@nestjs/typeorm';
import { Repository }           from 'typeorm';
import { ConfigService }        from '@nestjs/config';

import { MustHaveJwtGuard }         from '../auth/must-have-jwt.guard';
import { ProjectRolesGuard }    from '../auth/project-roles.guard';

import { ClustersService }  from './clusters.service';
import { CloneService }     from '../kubernetes/clone.service';
import { LoggerService }    from '../common/logger.service';
import { ResponseService }  from '../common/response.service';

import { Cluster }          from './cluster.entity';
import { ClusterPostDto }   from './cluster-post.dto';
import { ClusterGetDto }    from './cluster-get.dto';
import { ClusterPatchDto }  from './cluster-patch.dto';


@Controller('clusters')
export class ClustersController {
    
    private readonly logger = new LoggerService(ClustersController.name);

    constructor(
        private configService: ConfigService,
        @InjectRepository(Cluster)
        private clusterRepository: Repository<Cluster>,
        private cloneService: CloneService,
        private clustersService: ClustersService,
        private responseService: ResponseService
    ) {}

    @UseGuards(MustHaveJwtGuard)
    @Get()
    async findAll(): Promise<any> {
        // todo return an admin version of clusters here
        this.logger.verbose("Finding all projects");
        var clusters = await this.clusterRepository.find();
        return this.responseService.createResponse(clusters, "Getting all clusters.");
    }
    
    @UseGuards(MustHaveJwtGuard)
    @Get('/count')
    async count(): Promise<any> {
        this.logger.verbose("Counting clusters");
        var count = await this.clusterRepository.count();
        return this.responseService.createResponse(count, "Counted clusters.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Post('/aks')
    async createAksCluster(@Body() clusterData: any) {
        try{
            var cluster = await this.clustersService.createAKSCluster(clusterData);
        }catch(error){
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return this.responseService.createResponse(cluster, "Started creating cluster in Azure.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Patch('/aks/:formatName')
    async patchAksCluster(@Param('formatName') formatName, @Body() patchData: any) {
        try{
            var cluster = await this.clustersService.patchAKSCluster(formatName, patchData);
        }catch(error){
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return this.responseService.createResponse(cluster, "Started patching cluster in Azure.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Get('/aks/:name/upgradeProfile')
    async getAksClusterUpgradeProfile(@Param('name') name) {
        try{
            var cluster = await this.clustersService.getUpgradeProfile(name);
        }catch(error){
            throw new HttpException("Azure did not like the request", HttpStatus.NOT_FOUND);
        }
        return this.responseService.createResponse(cluster, "Fetched cluster upgrade profile from Azure.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Get('/aks/:name')
    async getAksCluster(@Param('name') name) {
        try{
            var cluster = await this.clustersService.getAKSCluster(name);
        }catch(error){
            throw new HttpException("Azure did not like the request", HttpStatus.NOT_FOUND);
        }
        return this.responseService.createResponse(cluster, "Fetched cluster from Azure.");
    }


    @UseGuards(MustHaveJwtGuard)
    @Delete('/aks/:name')
    async deleteAksCluster(@Param('name') name) {
        try{
            var response = await this.clustersService.deleteAKSCluster(name);
        }catch(error){
            throw new HttpException("Azure did not like the request", HttpStatus.NOT_FOUND);
        }
        return this.responseService.createResponse(response, "Deleted cluster in Azure.");
    }
    
    @UseGuards(MustHaveJwtGuard)
    @Get(':formatName')
    async findOne(@Param('formatName') formatName): Promise<any> {
        // todo return an admin version of clusters here
        let cluster = await this.clusterRepository.findOne({formatName: formatName});
        cluster.token = cluster.token.toString();
        return this.responseService.createResponse(cluster, "Fetched cluster.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Patch(':formatName')
    async update(@Param('formatName') formatName, @Body() clusterPatchDto: ClusterPatchDto) {
        var result = await this.clustersService.updateByPatch(formatName, clusterPatchDto);
        return this.responseService.createResponse(result, "Patching went good.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Post('')
    async createExisting(@Body() clusterPostDto: ClusterPostDto) {
        var cluster = await this.clustersService.createExisting(clusterPostDto);
        return this.responseService.createResponse(cluster, "Created existing cluster.");
    }

    @UseGuards(MustHaveJwtGuard)
    @Delete(':formatName')
    async DeleteCluster(@Param('formatName') formatName) {
        var response = await this.clustersService.deleteClusterByFormatname(formatName);
        return this.responseService.createResponse(response, "Deleted cluster.");
    }
}
