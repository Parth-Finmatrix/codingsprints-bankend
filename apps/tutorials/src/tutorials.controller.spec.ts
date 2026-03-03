import { Test, TestingModule } from '@nestjs/testing';
import { TutorialsController } from './tutorials.controller';
import { TutorialsService } from './tutorials.service';

describe('TutorialsController', () => {
  let tutorialsController: TutorialsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TutorialsController],
      providers: [TutorialsService],
    }).compile();

    tutorialsController = app.get<TutorialsController>(TutorialsController);
  });

  // describe('root', () => {
  //   it('should return "Hello World!"', () => {
  //     expect(tutorialsController.getHello()).toBe('Hello World!');
  //   });
  // });
});
