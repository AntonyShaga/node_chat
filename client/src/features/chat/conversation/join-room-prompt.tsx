'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { joinRoom } from '@/lib/api';

type JoinRoomPromptProps = {
  roomId: string;
  userId: string;
};

export function JoinRoomPrompt({ roomId, userId }: JoinRoomPromptProps) {
  const queryClient = useQueryClient();

  const joinMutation = useMutation({
    mutationFn: () => joinRoom(roomId, userId),

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['rooms', userId],
      }),
  });

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
