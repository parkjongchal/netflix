import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from './schema/chat.schema';
import { ChatRoom, ChatRoomSchema } from './schema/chat-room.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Chat.name,
        schema: ChatSchema,
      },
      {
        name: ChatRoom.name,
        schema: ChatRoomSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    AuthModule,
  ],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
