import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateChatProfileDto } from './dto/create-chat-profile.dto';

@Injectable()
export class ChatProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateChatProfileDto) {
    return this.prisma.chatProfile.create({ data });
  }

  findAll(search?: string) {
    const normalizedSearch = search?.trim();

    return this.prisma.chatProfile.findMany({
      where: {
        deletedAt: null,
        displayName: normalizedSearch
          ? {
              contains: normalizedSearch,
              mode: 'insensitive',
            }
          : undefined,
      },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
      },
      orderBy: {
        displayName: 'asc',
      },
      take: 20,
    });
  }

  async findOne(id: string) {
    const profile = await this.prisma.chatProfile.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!profile) {
      throw new NotFoundException('Chat profile not found');
    }

    return profile;
  }
}
