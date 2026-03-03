import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MultiFactorAuthService } from './multi-factor-auth.service';

@Controller()
export class MultiFactorAuthController {
  constructor(private readonly mfaService: MultiFactorAuthService) {}

  @MessagePattern('mfa.setup')
  generateSetup(@Payload() payload: { userId: string }) {
    return this.mfaService.generateMFASetup(payload.userId);
  }

  @MessagePattern('mfa.verify')
  verifySetup(
    @Payload()
    payload: {
      userId: string;
      code: string;
      secretKey: string;
    },
  ) {
    return this.mfaService.verifyMFASetup(
      payload.userId,
      payload.code,
      payload.secretKey,
    );
  }

  @MessagePattern('mfa.revoke')
  revoke(@Payload() payload: { userId: string }) {
    return this.mfaService.revokeMFA(payload.userId);
  }

  @MessagePattern('mfa.verify-login')
  verifyLogin(
    @Payload()
    payload: {
      email: string;
      code: string;
      userAgent?: string;
    },
  ) {
    return this.mfaService.verifyMFAForLogin(
      payload.code,
      payload.email,
      payload.userAgent,
    );
  }
}
