import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';

import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageHistoryQueryDto } from './dto/message-history-query.dto';

type MessageCursor = {
  createdAt: string;
  id: string;
};

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

  async findHistory(roomId: string, query: MessageHistoryQueryDto) {
    await this.ensureMembership(roomId, query.userId);

    const limit = query.limit ?? 30;
    const cursor = query.before ? this.decodeCursor(query.before) : null;

    const messages = await this.prisma.message.findMany({
      where: {
        roomId,
        deletedAt: null,

        ...(cursor
          ? {
              OR: [
                {
                  createdAt: {
                    lt: cursor.createdAt,
                  },
                },
                {
                  createdAt: cursor.createdAt,
                  id: {
                    lt: cursor.id,
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const page = messages.slice(0, limit).reverse();
    const oldestMessage = page[0];

    return {
      items: page,
      nextCursor:
        hasMore && oldestMessage
          ? this.encodeCursor({
              createdAt: oldestMessage.createdAt.toISOString(),
              id: oldestMessage.id,
            })
          : null,
      hasMore,
    };
  }

  private encodeCursor(cursor: MessageCursor) {
    return Buffer.from(JSON.stringify(cursor)).toString('base64url');
  }

  private decodeCursor(encodedCursor: string) {
    try {
      const decodedCursor = Buffer.from(encodedCursor, 'base64url').toString(
        'utf8',
      );

      const parsedCursor = JSON.parse(decodedCursor) as Partial<MessageCursor>;

      if (
        typeof parsedCursor.createdAt !== 'string' ||
        typeof parsedCursor.id !== 'string' ||
        !isUUID(parsedCursor.id)
      ) {
        throw new Error('Invalid cursor data');
      }

      const createdAt = new Date(parsedCursor.createdAt);

      if (Number.isNaN(createdAt.getTime())) {
        throw new Error('Invalid cursor date');
      }

      return {
        createdAt,
        id: parsedCursor.id,
      };
    } catch {
      throw new BadRequestException('Invalid message history cursor');
    }
  }
}
