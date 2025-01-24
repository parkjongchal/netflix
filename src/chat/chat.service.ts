import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { CreateChatDto } from './dto/create-chat.dto';
import { WsException } from '@nestjs/websockets';
import { plainToClass } from 'class-transformer';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/user/schema/user.schema';
import { ClientSession, Model } from 'mongoose';
import { Chat } from './schema/chat.schema';
import { ChatRoom } from './schema/chat-room.schema';
import { Role } from '@prisma/client';

@Injectable()
export class ChatService {
  private readonly connectedClients = new Map<string, Socket>();

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Chat.name)
    private readonly chatModel: Model<Chat>,
    @InjectModel(ChatRoom.name)
    private readonly chatRoomModel: Model<ChatRoom>,
  ) {}

  registerClient(userId: string, client: Socket) {
    this.connectedClients.set(userId, client);
  }

  removeClient(userId: string) {
    this.connectedClients.delete(userId);
  }

  async joinUserRooms(user: { sub: number }, client: Socket) {
    const chatRooms = await this.chatRoomModel
      .find({
        users: user.sub,
      })
      .exec();

    chatRooms.forEach((room) => {
      client.join(room.id.toString());
    });
  }

  async createMessage(
    payload: { sub: number },
    { message, room }: CreateChatDto,
  ) {
    const user = await this.userModel.findById(payload.sub).exec();
    const session = await this.chatModel.startSession();
    session.startTransaction();
    try {
      const chatRoom = await this.getOrCreateChatRoom(user, session, room);
      const msgModel = await this.chatModel.create(
        [
          {
            author: user._id,
            message,
            chatRoom: chatRoom._id,
          },
        ],
        { session },
      );
      session.commitTransaction();
      const client = this.connectedClients.get(user._id.toString());
      client
        .to(chatRoom._id.toString())
        .emit('newMessage', plainToClass(Chat, msgModel));
    } catch {
      session.abortTransaction();
    } finally {
      session.endSession();
    }

    return message;
  }

  async getOrCreateChatRoom(user: User, session: ClientSession, room?: number) {
    if (user.role === Role.admin) {
      if (!room) {
        throw new WsException('어드민은 room 값을 필수로 제공해야 합니다.');
      }
      return (await this.chatModel.findById(room)).populated('users');
    }

    let chatRoom = await this.chatRoomModel
      .findOne({
        user: user._id,
      })
      .exec();

    if (!chatRoom) {
      const adminUser = await this.userModel.findOne({
        role: Role.admin,
      });

      await this.chatRoomModel.create(
        [
          {
            users: [user._id, adminUser._id],
          },
        ],
        { session },
      );
      chatRoom = await this.chatRoomModel
        .findOne({
          user: user._id,
        })
        .exec();
      [user._id, adminUser._id].forEach((userId) => {
        const client = this.connectedClients.get(userId.toString());

        if (client) {
          client.emit('roomCreated', chatRoom._id);
          client.join(chatRoom._id.toString());
        }
      });
    }

    return chatRoom;
  }
}
