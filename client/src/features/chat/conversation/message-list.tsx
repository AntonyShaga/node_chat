import { Fragment } from 'react';

import type { ChatMessage } from '@/types/chat';

import { isSameMessageDay, MessageDateDivider } from './message-date-divider';
import { MessageItem } from './message-item';

type MessageListProps = {
  messages: ChatMessage[];
  currentUserId: string;
  onEdit: (messageId: string, text: string) => boolean;
  onDelete: (messageId: string) => boolean;
};

export function MessageList({
  messages,
  currentUserId,
  onEdit,
  onDelete,
}: MessageListProps) {
  return (
    <div>
      {messages.map((message, index) => {
        const previousMessage = messages[index - 1];

        const showDateDivider =
          !previousMessage ||
          !isSameMessageDay(message.createdAt, previousMessage.createdAt);

        return (
          <Fragment key={message.id}>
            {showDateDivider && (
              <MessageDateDivider createdAt={message.createdAt} />
            )}

            <MessageItem
              isOwnMessage={message.authorId === currentUserId}
              message={message}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          </Fragment>
        );
      })}
    </div>
  );
}
