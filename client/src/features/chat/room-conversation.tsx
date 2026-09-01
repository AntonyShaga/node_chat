'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import { joinRoom } from '@/lib/api';
import type { ChatProfile, ChatRoom } from '@/types/chat';

import { useRoomMessages } from './use-room-messages';

type RoomConversationProps = {
  profile: ChatProfile;
  room: ChatRoom;
};

type ScrollSnapshot = {
  scrollHeight: number;
  scrollTop: number;
};

export function RoomConversation({ profile, room }: RoomConversationProps) {
  const queryClient = useQueryClient();

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const initialScrollCompletedRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const scrollSnapshotRef = useRef<ScrollSnapshot | null>(null);

  const [text, setText] = useState('');

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
    hasOlderMessages,
    isLoadingOlderMessages,
    loadOlderMessages,
    isConnected,
    socketError,
    sendMessage,
  } = useRoomMessages({
    roomId: room.id,
    userId: profile.id,
    enabled: isMember,
  });

  const loadOlder = useCallback(async () => {
    const container = scrollContainerRef.current;

    if (
      !container ||
      !hasOlderMessages ||
      isLoadingOlderMessages ||
      scrollSnapshotRef.current
    ) {
      return;
    }

    scrollSnapshotRef.current = {
      scrollHeight: container.scrollHeight,
      scrollTop: container.scrollTop,
    };

    try {
      await loadOlderMessages();
    } catch {
      scrollSnapshotRef.current = null;
    }
  }, [hasOlderMessages, isLoadingOlderMessages, loadOlderMessages]);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;

    if (!container || isLoading) {
      return;
    }

    const snapshot = scrollSnapshotRef.current;

    if (snapshot) {
      const addedHeight = container.scrollHeight - snapshot.scrollHeight;

      container.scrollTop = snapshot.scrollTop + addedHeight;
      scrollSnapshotRef.current = null;

      return;
    }

    if (!initialScrollCompletedRef.current) {
      container.scrollTop = container.scrollHeight;
      initialScrollCompletedRef.current = true;
      isNearBottomRef.current = true;

      return;
    }

    if (isNearBottomRef.current) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [isLoading, messages.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const sentinel = topSentinelRef.current;

    if (!container || !sentinel || !initialScrollCompletedRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void loadOlder();
        }
      },
      {
        root: container,
        rootMargin: '120px 0px 0px',
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [loadOlder, messages.length]);

  function handleScroll() {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    isNearBottomRef.current = distanceFromBottom < 120;
  }

  function submitMessage() {
    if (sendMessage(text)) {
      setText('');
      isNearBottomRef.current = true;
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
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-8 text-center">
        <div>
          <h2 className="text-xl font-semibold">Join this room</h2>

          <p className="mt-2 text-muted-foreground">
            Join the room to read and send messages.
          </p>

          <button
            className="mt-6 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 [scrollbar-gutter:stable] sm:px-8"
        onScroll={handleScroll}
        ref={scrollContainerRef}
      >
        <div className="mx-auto max-w-4xl">
          <div ref={topSentinelRef} />

          {isLoadingOlderMessages && (
            <p className="pb-5 text-center text-sm text-muted-foreground">
              Loading older messages...
            </p>
          )}

          {!hasOlderMessages && messages.length > 0 && (
            <p className="pb-5 text-center text-xs text-muted-foreground">
              Beginning of conversation
            </p>
          )}

          {isLoading && (
            <p className="text-muted-foreground">Loading messages...</p>
          )}

          {(historyError || socketError) && (
            <p className="text-destructive">{historyError ?? socketError}</p>
          )}

          {!isLoading && messages.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <p>No messages yet.</p>

              <p className="mt-1 text-sm">
                Send the first message in this room.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((message) => (
              <article className="flex min-w-0 gap-4" key={message.id}>
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted font-semibold">
                  {message.authorName.slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="max-w-full truncate font-semibold">
                      {message.authorName}
                    </h3>

                    <time className="shrink-0 text-xs text-muted-foreground">
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>

                  <p className="mt-1 break-words whitespace-pre-wrap text-muted-foreground">
                    {message.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <form
        className="shrink-0 border-t bg-card px-6 py-4 sm:px-8"
        onSubmit={handleSubmit}
      >
        <div className="mx-auto flex max-w-4xl items-end gap-3">
          <textarea
            className="max-h-36 min-h-12 min-w-0 flex-1 resize-none rounded-xl border bg-input px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring/30"
            disabled={!isConnected}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${room.name}`}
            rows={1}
            value={text}
          />

          <button
            className="min-h-12 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
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
    </div>
  );
}
