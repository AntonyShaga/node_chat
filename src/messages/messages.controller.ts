import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';

import { CreateMessageDto } from './dto/create-message.dto';
import { MessageHistoryQueryDto } from './dto/message-history-query.dto';
import { MessagesService } from './messages.service';

@Controller('rooms/:roomId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() data: CreateMessageDto,
  ) {
    return this.messagesService.create(roomId, data);
  }

  @Get()
  findHistory(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Query() query: MessageHistoryQueryDto,
  ) {
    return this.messagesService.findHistory(roomId, query);
  }
}
