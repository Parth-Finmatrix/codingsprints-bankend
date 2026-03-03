import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Roles, RoleSchema } from './schema/roles.shema';
import { RolesSeedService } from './seed/roles.seed';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Roles.name, schema: RoleSchema }]),
  ],
  providers: [RolesSeedService],
  exports: [MongooseModule],
})
export class RolesModule {}
