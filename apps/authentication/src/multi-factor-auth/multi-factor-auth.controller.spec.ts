import { Test, TestingModule } from '@nestjs/testing';
import { MultiFactorAuthController } from './multi-factor-auth.controller';
import { MultiFactorAuthService } from './multi-factor-auth.service';

describe('MultiFactorAuthController', () => {
  let controller: MultiFactorAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MultiFactorAuthController],
      providers: [MultiFactorAuthService],
    }).compile();

    controller = module.get<MultiFactorAuthController>(MultiFactorAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
