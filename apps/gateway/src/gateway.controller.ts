import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { ClientKafka, ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('tutorials')
export class GatewayController {
  constructor(
    @Inject('TUTORIALS_CLIENT')
    private readonly tutorialsClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // 👇 This is the real fix
    this.tutorialsClient.subscribeToResponseOf('service.ping');

    this.tutorialsClient.subscribeToResponseOf('tutorial.created'); // for send()
    await this.tutorialsClient.connect();
  }

  @Post()
  create(@Body() data: any) {
    // const dummy = {
    //   title: 'Test Tutorial',
    //   level: 'Basic',
    //   author: 'System',
    // };
    return this.tutorialsClient.send('tutorial.created', data);
  }

  @Get('health')
  // @Public()
  async health() {
    const ping = async (serviceName: string, client: ClientKafka) => {
      try {
        const result = await firstValueFrom(
          client.send('service.ping', { from: 'gateway' }),
        );

        return {
          ok: true,
          service: serviceName,
          result,
        };
      } catch (err: any) {
        return {
          ok: false,
          service: serviceName,
          error: err?.message ?? 'unknown error',
        };
      }
    };

    const [tutorials] = await Promise.all([
      ping('tutorials', this.tutorialsClient),
    ]);

    const ok = [tutorials].every((s) => s.ok);

    return {
      ok,
      gateway: {
        service: 'gateway',
        now: new Date().toISOString(),
      },
      services: {
        tutorials,
      },
    };
  }
}
