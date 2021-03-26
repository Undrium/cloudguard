import { Controller, Get, UseGuards, Param, Post, Patch, Body, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository }     from '@nestjs/typeorm';
import { Repository }           from 'typeorm';
import { ConfigService }        from '@nestjs/config';

import { JwtAuthGuard }         from '../auth/jwt-auth.guard';
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

    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(): Promise<Cluster[]> {
        // todo return an admin version of clusters here
        this.logger.verbose("Finding all projects");
        return this.clusterRepository.find();
    }
    
    @UseGuards(JwtAuthGuard)
    @Get('/count')
    async count(): Promise<Number> {
        this.logger.verbose("Counting clusters");
        return this.clusterRepository.count();
    }

    @UseGuards(JwtAuthGuard)
    @Post('/aks')
    async createAksCluster(@Body() clusterData: any) {
        try{
            var response = await this.clustersService.createAKSCluster(clusterData);
        }catch(error){
            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return response;
    }

    @UseGuards(JwtAuthGuard)
    @Get('/aks/:name')
    async getAksCluster(@Param('name') name) {
        try{
            var response = await this.clustersService.getAKSCluster(name);
        }catch(error){
            throw new HttpException("Azure did not like the request", HttpStatus.NOT_FOUND);
        }
        return response;
    }

    @UseGuards(JwtAuthGuard)
    @Delete('/aks/:name')
    async deleteAksCluster(@Param('name') name) {
        try{
            var response = await this.clustersService.deleteAKSCluster(name);
        }catch(error){
            throw new HttpException("Azure did not like the request", HttpStatus.NOT_FOUND);
        }
        return response;
    }
    
    @UseGuards(JwtAuthGuard)
    @Get(':formatName')
    async findOne(@Param('formatName') formatName): Promise<any> {
        // todo return an admin version of clusters here
        let cluster = await this.clusterRepository.findOne({formatName: formatName});
        cluster.token = cluster.token.toString();
        return cluster;
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':formatName')
    async update(@Param('formatName') formatName, @Body() clusterPostDto: ClusterPatchDto) {
        return this.clustersService.updateByPatch(formatName, clusterPostDto);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':sourceClusterformatName/namespaces/:namespaceFormatName/clone')
    async clone(@Param('sourceClusterformatName') sourceClusterformatName, @Param('namespaceFormatName') namespaceFormatName, @Body() cloneData: any) {
        var sourceCluster = await this.clustersService.getCluster(sourceClusterformatName);
        var targetCluster = await this.clustersService.getCluster(cloneData.targetClusterFormatName);
        
        try{
            await this.cloneService.cloneNamespaceAndContent(
                namespaceFormatName, 
                sourceCluster, 
                targetCluster, 
                cloneData
            );
        }catch(error){
            throw new HttpException(error, HttpStatus.METHOD_NOT_ALLOWED);
        }

        return this.responseService.createResponse(true, "Clone was succesful.");
    }

    @UseGuards(JwtAuthGuard)
    @Post('')
    async create(@Body() clusterPostDto: ClusterPostDto) {
        return this.clustersService.createByPost(clusterPostDto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':formatName')
    async DeleteCluster(@Param('formatName') formatName) {
        return this.clustersService.deleteClusterByFormatname(formatName);
    }
}
