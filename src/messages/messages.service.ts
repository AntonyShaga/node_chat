import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureMembership(roomId: string, userId: string) {
    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        deletedAt: null,
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const membership = await this.prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
      include: {
        user: true,
      },
    });

    if (!membership || membership.user.deletedAt) {
      throw new ForbiddenException('User is not a room member');
    }

    return membership;
  }

  async create(roomId: string, data: CreateMessageDto) {
    return this.prisma.$transaction(async (transaction) => {
      const room = await transaction.room.findFirst({
        where: {
          id: roomId,
          deletedAt: null,
        },
      });

      if (!room) {
        throw new NotFoundException('Room not found');
      }

      const membership = await transaction.roomMember.findUnique({
        where: {
          roomId_userId: {
            roomId,
            userId: data.authorId,
          },
        },
        include: {
          user: true,
        },
      });

      if (!membership || membership.user.deletedAt) {
        throw new ForbiddenException('Only room members can send messages');
      }

      const existingMessage = await transaction.message.findUnique({
        where: {
          authorId_clientMessageId: {
            authorId: data.authorId,
            clientMessageId: data.clientMessageId,
          },
        },
      });

      if (existingMessage) {
        if (existingMessage.roomId !== roomId) {
          throw new ConflictException('Client message ID is already in use');
        }

        return existingMessage;
      }

      return transaction.message.create({
        data: {
          clientMessageId: data.clientMessageId,
          text: data.text,
          authorName: membership.user.displayName,
          room: {
            connect: {
              id: roomId,
            },
          },
          author: {
            connect: {
              id: data.authorId,
            },
          },
        },
      });
    });
  }

  async findHistory(roomId: string, userId: string) {
    const room = await this.prisma.room.findFirst({
      where: {
        id: roomId,
        deletedAt: null,
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const membership = await this.prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only room members can read messages');
    }

    return this.prisma.message.findMany({
      where: {
        roomId,
        deletedAt: null,
      },
      orderBy: [
        {
          createdAt: 'asc',
        },
        {
          id: 'asc',
        },
      ],
    });
  }
}
