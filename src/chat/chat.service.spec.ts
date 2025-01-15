import { ChatService } from './chat.service';
import { Chat } from './entity/chat.entity';
import { ChatRoom } from './entity/chat-room.entity';
import { Repository } from 'typeorm';
import { TestBed } from '@automock/jest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';

describe('ChatService', () => {
  let service: ChatService;
  let chatRepository: jest.Mocked<Repository<Chat>>;
  let chatRoomRepository: jest.Mocked<Repository<ChatRoom>>;
  let userRepository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(ChatService).compile();
    service = unit;
    chatRepository = unitRef.get(getRepositoryToken(Chat) as string);
    chatRoomRepository = unitRef.get(getRepositoryToken(ChatRoom) as string);
    userRepository = unitRef.get(getRepositoryToken(User) as string);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
