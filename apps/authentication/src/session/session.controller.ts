import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SessionService } from './session.service';

@Controller()
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @MessagePattern('session.getAll')
  getAllSessions(
    @Payload()
    payload: {
      userId: string;
      sessionId: string;
      adminId: string;
      role: string;
    },
  ) {
    return this.sessionService.getAllSessions(
      payload.userId,
      payload.sessionId,
    );
  }

  @MessagePattern('session.getOne')
  getSession(@Payload() payload: { sessionId: string }) {
    return this.sessionService.getSessionById(payload.sessionId);
  }

  @MessagePattern('session.delete')
  deleteSession(
    @Payload()
    payload: {
      sessionId: string;
      userId: string;
    },
  ) {
    return this.sessionService.deleteSession(payload.sessionId, payload.userId);
  }
}
