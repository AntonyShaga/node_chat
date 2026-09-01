'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { getMessages } from '@/lib/api';
import type { ChatMessage } from '@/types/chat';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3000';

type UseRoomMessagesOptions = {
  roomId: string;
  userId: string;
  enabled: boolean;
};

export function useRoomMessages({
  roomId,
  userId,
  enabled,
}: UseRoomMessagesOptions) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);

  const messagesQuery = useQuery({
    queryKey: ['messages', roomId, userId],
    queryFn: () => getMessages(roomId, userId),
    enabled,
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const socket = io(SOCKET_URL);

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(false);

      socket.emit('room:join', {
        roomId,
        userId,
      });
    });

    socket.on('room:joined', () => {
      setIsConnected(true);
      setSocketError(null);
    });

    socket.on('message:created', (message: ChatMessage) => {
      queryClient.setQueryData<ChatMessage[]>(
        ['messages', roomId, userId],
        (currentMessages = []) => {
          const messageExists = currentMessages.some(
            (currentMessage) => currentMessage.id === message.id,
          );

          return messageExists
            ? currentMessages
            : [...currentMessages, message];
        },
      );
    });

    socket.on('exception', (error: unknown) => {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : 'WebSocket error';

      setSocketError(message);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, queryClient, roomId, userId]);

  const sendMessage = useCallback(
    (text: string) => {
      const normalizedText = text.trim();
      const socket = socketRef.current;

      if (!socket?.connected || !normalizedText) {
        return false;
      }

      socket.emit('message:send', {
        roomId,
        authorId: userId,
        clientMessageId: crypto.randomUUID(),
        text: normalizedText,
      });

      return true;
    },
    [roomId, userId],
  );

  return {
    messages: messagesQuery.data ?? [],
    isLoading: messagesQuery.isPending,
    historyError: messagesQuery.error?.message ?? null,
    isConnected,
    socketError,
    sendMessage,
  };
}
