import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { JoinRoomEventDto } from './dto/join-room-event.dto';
import { SendMessageEventDto } from './dto/send-message-event.dto';
import { MessagesService } from './messages.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  private server: Server;

  constructor(private readonly messagesService: MessagesService) {}

  @SubscribeMessage('room:join')
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomEventDto,
  ) {
    try {
      await this.messagesService.ensureMembership(data.roomId, data.userId);

      await client.join(data.roomId);

      return {
        event: 'room:joined',
        data: {
          roomId: data.roomId,
        },
      };
    } catch (error) {
      throw new WsException(
        error instanceof Error ? error.message : 'Unable to join room',
      );
    }
  }

  @SubscribeMessage('message:send')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageEventDto,
  ) {
    if (!client.rooms.has(data.roomId)) {
      throw new WsException('Join the room before sending messages');
    }

    try {
      const message = await this.messagesService.create(data.roomId, {
        authorId: data.authorId,
        clientMessageId: data.clientMessageId,
        text: data.text,
      });

      this.server.to(data.roomId).emit('message:created', message);

      return {
        event: 'message:sent',
        data: message,
      };
    } catch (error) {
      throw new WsException(
        error instanceof Error ? error.message : 'Unable to send message',
      );
    }
  }
}
