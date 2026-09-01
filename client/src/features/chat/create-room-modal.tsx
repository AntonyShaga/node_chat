'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';

import { createRoom } from '@/lib/api';

type CreateRoomModalProps = {
  ownerId: string;
  onClose: () => void;
  onCreated: (roomId: string) => void;
};

export function CreateRoomModal({
  ownerId,
  onClose,
  onCreated,
}: CreateRoomModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const createMutation = useMutation({
    mutationFn: () =>
      createRoom({
        name: name.trim(),
        description: description.trim() || undefined,
        visibility: isPrivate ? 'PRIVATE' : 'PUBLIC',
        ownerId,
      }),
    onSuccess: async (room) => {
      await queryClient.invalidateQueries({
        queryKey: ['rooms', ownerId],
      });

      onCreated(room.id);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (name.trim().length < 2) {
      return;
    }

    createMutation.mutate();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-6"
      role="presentation"
    >
      <section
        aria-labelledby="create-room-title"
        aria-modal="true"
        className="w-full max-w-xl rounded-2xl border bg-card p-8 shadow-2xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold" id="create-room-title">
              Create a room
            </h2>

            <p className="mt-2 text-muted-foreground">
              Start a new space for your team.
            </p>
          </div>

          <button
            aria-label="Close"
            className="rounded-lg px-3 py-2 text-xl text-muted-foreground hover:bg-muted"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block font-medium">Room name</span>

            <input
              autoFocus
              className="w-full rounded-xl border bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-ring/30"
              maxLength={80}
              minLength={2}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. marketing"
              required
              value={name}
            />
          </label>

          <label className="block">
            <span className="mb-2 block font-medium">Description</span>

            <textarea
              className="min-h-28 w-full resize-none rounded-xl border bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-ring/30"
              maxLength={500}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this room for?"
              value={description}
            />
          </label>

          <label className="flex cursor-pointer items-center gap-4 rounded-xl border p-4">
            <input
              checked={isPrivate}
              className="size-5 accent-current"
              onChange={(event) => setIsPrivate(event.target.checked)}
              type="checkbox"
            />

            <span>
              <span className="block font-medium">Private room</span>
              <span className="text-sm text-muted-foreground">
                Only invited members can join.
              </span>
            </span>
          </label>

          {createMutation.error && (
            <p className="text-sm text-destructive">
              {createMutation.error.message}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              className="rounded-xl px-5 py-3 hover:bg-muted"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>

            <button
              className="rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground disabled:opacity-50"
              disabled={createMutation.isPending}
              type="submit"
            >
              {createMutation.isPending ? 'Creating...' : 'Create room'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
