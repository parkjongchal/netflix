import { Test, TestingModule } from '@nestjs/testing';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import { ConfigModule } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';

describe('CommonController', () => {
  let controller: CommonController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      controllers: [CommonController],
      providers: [
        CommonService,
        {
          provide: getQueueToken('thumbnail-generation'), // Bull Queue Token
          useValue: {
            add: jest.fn(), // 큐 작업 추가 메서드 모킹
          },
        },
      ],
    }).compile();

    controller = module.get<CommonController>(CommonController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
