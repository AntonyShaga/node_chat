import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import { ChatProfilesService } from './chat-profiles.service';
import { CreateChatProfileDto } from './dto/create-chat-profile.dto';

@Controller('chat-profiles')
export class ChatProfilesController {
  constructor(private readonly chatProfilesService: ChatProfilesService) {}

  @Post()
  create(@Body() data: CreateChatProfileDto) {
    return this.chatProfilesService.create(data);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.chatProfilesService.findOne(id);
  }
}
