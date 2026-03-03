import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RoleName, Roles, RolesDocument } from '../schema/roles.shema';

@Injectable()
export class RolesSeedService implements OnModuleInit {
  private readonly logger = new Logger(RolesSeedService.name);

  constructor(
    @InjectModel(Roles.name)
    private readonly roleModel: Model<RolesDocument>,
  ) {}

  async onModuleInit() {
    await this.seedRoles();
  }

  private async seedRoles() {
    const roles = [
      {
        name: RoleName.ADMIN,
        code: 1,
        permissions: ['CREATE_VENDOR', 'VIEW_ALL', 'MANAGE_WALLET'],
      },
      {
        name: RoleName.USER,
        code: 2,
        permissions: ['VIEW_KYC', 'USE_SERVICES'],
      },
    ];

    for (const role of roles) {
      const exists = await this.roleModel.exists({ name: role.name });

      if (!exists) {
        await this.roleModel.create(role);
        this.logger.log(`✅ Role created: ${role.name}`);
      }
    }

    this.logger.log('🎯 Role seeding completed');
  }
}
