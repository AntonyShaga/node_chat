import { IsUUID } from 'class-validator';

export class MessageHistoryQueryDto {
  @IsUUID()
  userId: string;
}
