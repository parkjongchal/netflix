import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { AuthService } from 'src/auth/auth.service';
const mockAuthService = {
  parseBearerToken: jest.fn(),
};
const mockChatGateway = {
  handleDisconnect: jest.fn(),
  handleConnection: jest.fn(),
  handleMessage: jest.fn(),
};
const mockChatService = {
  registerClient: jest.fn(),
  removeClient: jest.fn(),
  joinUserRooms: jest.fn(),
  createMessage: jest.fn(),
  getOrCreateChatRoom: jest.fn(),
};
describe('ChatGateway', () => {
  let gateway: ChatGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: ChatGateway, useValue: mockChatGateway },
        { provide: ChatService, useValue: mockChatService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();
    gateway = module.get<ChatGateway>(ChatGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
