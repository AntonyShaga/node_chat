'use client';
import { InviteMembers } from './invite-members';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';

import { deleteRoom, leaveRoom, updateRoom } from '@/lib/api';
import type { ChatProfile, ChatRoom } from '@/types/chat';

type RoomSettingsModalProps = {
  profile: ChatProfile;
  room: ChatRoom;
  onClose: () => void;
  onRemoved: () => void;
};

export function RoomSettingsModal({
  profile,
  room,
  onClose,
  onRemoved,
}: RoomSettingsModalProps) {
  const queryClient = useQueryClient();
  const isOwner = room.ownerId === profile.id;

  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description ?? '');
  const [isPrivate, setIsPrivate] = useState(room.visibility === 'PRIVATE');

  const refreshRooms = () =>
    queryClient.invalidateQueries({
      queryKey: ['rooms', profile.id],
    });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateRoom(room.id, {
        requesterId: profile.id,
        name: name.trim(),
        description: description.trim() || undefined,
        visibility: isPrivate ? 'PRIVATE' : 'PUBLIC',
      }),
    onSuccess: async () => {
      await refreshRooms();
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRoom(room.id, profile.id),
    onSuccess: async () => {
      await refreshRooms();
      onRemoved();
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveRoom(room.id, profile.id),
    onSuccess: async () => {
      await refreshRooms();
      onRemoved();
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (name.trim().length >= 2) {
      updateMutation.mutate();
    }
  }

  const actionError =
    updateMutation.error ?? deleteMutation.error ?? leaveMutation.error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-6">
      <section className="w-full max-w-2xl rounded-2xl border bg-card p-8 shadow-2xl">
        <div className="flex justify-between gap-6">
          <div>
            <p className="text-sm text-primary">#{room.slug}</p>
            <h2 className="mt-1 text-2xl font-semibold">Room settings</h2>
          </div>

          <button
            aria-label="Close"
            className="rounded-lg px-3 py-2 text-xl hover:bg-muted"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        {isOwner ? (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block font-medium">Room name</span>

              <input
                className="w-full rounded-xl border bg-input px-4 py-3 outline-none focus:ring-2 focus:ring-ring/30"
                maxLength={80}
                minLength={2}
                onChange={(event) => setName(event.target.value)}
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
                value={description}
              />
            </label>

            <label className="flex items-center gap-3">
              <input
                checked={isPrivate}
                className="size-5"
                onChange={(event) => setIsPrivate(event.target.checked)}
                type="checkbox"
              />
              Private room
            </label>

            <button
              className="rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground disabled:opacity-50"
              disabled={updateMutation.isPending}
              type="submit"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        ) : (
          <p className="mt-8 text-muted-foreground">
            Only the room owner can change room settings.
          </p>
        )}

        {isOwner && <InviteMembers inviterId={profile.id} roomId={room.id} />}

        {actionError && (
          <p className="mt-5 text-sm text-destructive">{actionError.message}</p>
        )}

        <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <h3 className="font-semibold text-destructive">Danger zone</h3>

          {isOwner ? (
            <button
              className="mt-4 rounded-xl border border-destructive px-5 py-3 text-destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
              type="button"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete room'}
            </button>
          ) : (
            <button
              className="mt-4 rounded-xl border border-destructive px-5 py-3 text-destructive"
              disabled={leaveMutation.isPending}
              onClick={() => leaveMutation.mutate()}
              type="button"
            >
              {leaveMutation.isPending ? 'Leaving...' : 'Leave room'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
