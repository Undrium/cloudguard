import { SetMetadata } from '@nestjs/common';

export const ProjectRoles = (roles: string[]) => SetMetadata('projectRoles', roles);