import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';

import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationsService } from './invitations.service';

@Controller()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('rooms/:roomId/invitations')
  create(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() data: CreateInvitationDto,
  ) {
    return this.invitationsService.create(roomId, data);
  }

  @Post('room-invitations/:invitationId/accept')
  accept(
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
    @Body() data: AcceptInvitationDto,
  ) {
    return this.invitationsService.accept(invitationId, data);
  }

  @Get('room-invitations')
  findPending(@Query('recipientId', ParseUUIDPipe) recipientId: string) {
    return this.invitationsService.findPending(recipientId);
  }

  @Post('room-invitations/:invitationId/decline')
  decline(
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
    @Body() data: AcceptInvitationDto,
  ) {
    return this.invitationsService.decline(invitationId, data);
  }
}
