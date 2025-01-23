import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Chat } from './entity/chat.entity';
import { CreateChatDto } from './dto/create-chat.dto';
import { WsException } from '@nestjs/websockets';
import { plainToClass } from 'class-transformer';
import { PrismaService } from 'src/common/prisma.service';
import { PrismaClient, Role, User } from '@prisma/client';
import * as runtime from '@prisma/client/runtime/library.js';

@Injectable()
export class ChatService {
  private readonly connectedClients = new Map<number, Socket>();

  constructor(private readonly prisma: PrismaService) {}

  registerClient(userId: number, client: Socket) {
    this.connectedClients.set(userId, client);
  }

  removeClient(userId: number) {
    this.connectedClients.delete(userId);
  }

  async joinUserRooms(user: { sub: number }, client: Socket) {
    const chatRooms = await this.prisma.chatRoom.findMany({
      where: {
        users: { some: { id: user.sub } },
      },
      include: { users: true },
    });

    chatRooms.forEach((room) => {
      client.join(room.id.toString());
    });
  }

  async createMessage(
    payload: { sub: number },
    { message, room }: CreateChatDto,
  ) {
    return this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.findUnique({
        where: {
          id: payload.sub,
        },
      });

      const chatRoom = await this.getOrCreateChatRoom(user, prisma, room);

      const msgModel = await prisma.chat.create({
        data: {
          author: { connect: { id: user.id } },
          message,
          chatRoom: { connect: { id: chatRoom.id } },
        },
      });

      const client = this.connectedClients.get(user.id);

      client
        .to(chatRoom.id.toString())
        .emit('newMessage', plainToClass(Chat, msgModel));

      return message;
    });
  }

  async getOrCreateChatRoom(
    user: User,
    prisma: Omit<PrismaClient, runtime.ITXClientDenyList>,
    room?: number,
  ) {
    if (user.role === Role.admin) {
      if (!room) {
        throw new WsException('어드민은 room 값을 필수로 제공해야 합니다.');
      }
      return prisma.chatRoom.findUnique({
        where: { id: room },
        include: { users: true },
      });
    }

    let chatRoom = await prisma.chatRoom.findFirst({
      where: { users: { some: { id: user.id } } },
      include: { users: true },
    });

    if (!chatRoom) {
      const adminUser = await prisma.user.findFirst({
        where: { role: Role.admin },
      });

      await prisma.chatRoom.create({
        data: {
          users: { connect: [user, adminUser].map((u) => ({ id: u.id })) },
        },
      });

      chatRoom = await prisma.chatRoom
        .findFirst({
          where: { users: { some: { id: user.id } } },
          include: { users: true },
        })

        [(user.id, adminUser.id)].forEach((userId) => {
          const client = this.connectedClients.get(userId);

          if (client) {
            client.emit('roomCreated', chatRoom.id);
            client.join(chatRoom.id.toString());
          }
        });
    }

    return chatRoom;
  }
}
