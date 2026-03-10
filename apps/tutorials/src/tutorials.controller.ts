import { Controller, Get } from '@nestjs/common';
import { TutorialsService } from './tutorials.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class TutorialsController {
  constructor(private readonly tutorialsService: TutorialsService) {}

  @MessagePattern('service.ping')
  ping() {
    return this.tutorialsService.ping();
  }

  @MessagePattern('tutorial.created')
  handleMessage(@Payload() message: any) {
    console.log('Received =>', message);

    return {
      success: true,
      received: message,
    };
  }
}
