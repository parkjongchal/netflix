import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { CommonMoudle } from 'src/common/common.module';

@Module({
  imports: [CommonMoudle, AuthModule],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
