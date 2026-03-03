import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from '../auth/schema/session.schema';
import { Types } from 'mongoose';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name)
    private readonly SessionModel: Model<SessionDocument>,
  ) {}

  async getAllSessions(userId: string, currentSessionId: string) {
    const sessions = await this.SessionModel.find(
      {
        userId: new Types.ObjectId(userId),
        expiredAt: { $gt: new Date() },
      },
      {
        userId: 1,
        adminId: 1,
        roleId: 1,
        userAgent: 1,
        createdAt: 1,
        expiredAt: 1,
      },
      {
        sort: { createdAt: -1 },
      },
    ).lean();

    console.log('all =>', userId, sessions, 'req =>', currentSessionId);

    return {
      message: 'Retrieved all sessions successfully',
      sessions: sessions.map((s) => ({
        ...s,
        isCurrent: s._id.toString() === currentSessionId,
      })),
    };
  }

  async getSessionById(sessionId: string) {
    const session = await this.SessionModel.findById(sessionId)
      .populate('userId', '-password')
      .lean();

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return {
      message: 'Session retrieved successfully',
      session,
    };
  }

  async deleteSession(sessionId: string, userId: string) {
    console.log('delete sessionId =>', sessionId, userId);

    const deleted = await this.SessionModel.findOneAndDelete({
      _id: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId),
    });

    console.log('deleted =>', deleted);

    if (!deleted) {
      throw new NotFoundException('Session not found');
    }

    return {
      message: 'Session removed successfully',
      data: deleted,
    };
  }
}
