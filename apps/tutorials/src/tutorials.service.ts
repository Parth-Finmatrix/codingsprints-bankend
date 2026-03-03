import { Injectable } from '@nestjs/common';

@Injectable()
export class TutorialsService {
  ping() {
    return {
      ok: true,
      service: 'tutorials',
      now: new Date().toISOString(),
    };
  }
}
