'use client';

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';

import { joinRoom } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ChatProfile, ChatRoom } from '@/types/chat';

import { useRoomMessages } from './use-room-messages';

type RoomConversationProps = {
  profile: ChatProfile;
  room: ChatRoom;
};

export function RoomConversation({ profile, room }: RoomConversationProps) {
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const queryClient = useQueryClient();

  const joinMutation = useMutation({
    mutationFn: () => joinRoom(room.id, profile.id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['rooms', profile.id],
      }),
  });

  const isMember = room.members.some((member) => member.userId === profile.id);

  const {
    messages,
    isLoading,
    historyError,
    isConnected,
    socketError,
    sendMessage,
  } = useRoomMessages({
    roomId: room.id,
    userId: profile.id,
    enabled: isMember,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages]);

  function submitMessage() {
    if (sendMessage(text)) {
      setText('');
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  }

  if (!isMember) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <div>
          <h2 className="text-xl font-semibold">Join this room</h2>

          <p className="mt-2 text-muted-foreground">
            Join the room to read and send messages.
          </p>

          <button
            className="mt-6 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground disabled:opacity-50"
            disabled={joinMutation.isPending}
            onClick={() => joinMutation.mutate()}
            type="button"
          >
            {joinMutation.isPending ? 'Joining...' : 'Join room'}
          </button>

          {joinMutation.error && (
            <p className="mt-3 text-sm text-destructive">
              {joinMutation.error.message}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {isLoading && (
          <p className="text-muted-foreground">Loading messages...</p>
        )}

        {(historyError || socketError) && (
          <p className="text-destructive">{historyError ?? socketError}</p>
        )}

        <div className="mx-auto max-w-4xl space-y-6">
          {messages.map((message) => (
            <article className="flex gap-4" key={message.id}>
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted font-semibold">
                {message.authorName.slice(0, 2).toUpperCase()}
              </div>

              <div className="min-w-0">
                <div className="flex items-baseline gap-3">
                  <h3 className="font-semibold">{message.authorName}</h3>

                  <time className="text-xs text-muted-foreground">
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>

                <p className="mt-1 wrap-break-word text-muted-foreground">
                  {message.text}
                </p>
              </div>
            </article>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form className="border-t bg-card p-6" onSubmit={handleSubmit}>
        <div className="mx-auto flex max-w-4xl gap-3">
          <textarea
            className="max-h-36 min-h-12 min-w-0 flex-1 resize-none rounded-xl border bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-ring/30"
            disabled={!isConnected}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${room.name}`}
            rows={1}
            value={text}
          />

          <button
            className="rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground disabled:opacity-50"
            disabled={!isConnected || !text.trim()}
            type="submit"
          >
            Send
          </button>
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          {isConnected
            ? 'Press Enter to send · Shift + Enter for a new line'
            : 'Connecting to room...'}
        </p>
      </form>
    </>
  );
}
