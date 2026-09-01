'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { type FormEvent, useMemo, useState, useSyncExternalStore } from 'react';

import { InviteMembers } from '@/features/chat/invite-members';
import { deleteRoom, getRoomDetails, leaveRoom, updateRoom } from '@/lib/api';
import {
  getProfileSnapshot,
  getServerProfileSnapshot,
  parseChatProfile,
  subscribeToProfile,
} from '@/lib/profile-storage';
import type { ChatProfile } from '@/types/chat';
import { ArrowLeftIcon } from '@/components/icons';

type RoomSettingsContentProps = {
  profile: ChatProfile;
  roomId: string;
};

type UpdateRoomSettingsInput = {
  name: string;
  description?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function RoomSettingsContent({ profile, roomId }: RoomSettingsContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSaved, setIsSaved] = useState(false);

  const roomQuery = useQuery({
    queryKey: ['room', roomId, profile.id],
    queryFn: () => getRoomDetails(roomId, profile.id),
  });

  const room = roomQuery.data;
  const isOwner = room?.ownerId === profile.id;

  async function refreshRoomData() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['rooms', profile.id],
      }),
      queryClient.invalidateQueries({
        queryKey: ['room', roomId, profile.id],
      }),
    ]);
  }

  const updateMutation = useMutation({
    mutationFn: (input: UpdateRoomSettingsInput) =>
      updateRoom(roomId, {
        requesterId: profile.id,
        ...input,
      }),

    onSuccess: async () => {
      await refreshRoomData();
      setIsSaved(true);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRoom(roomId, profile.id),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['rooms', profile.id],
      });

      router.replace('/chat');
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveRoom(roomId, profile.id),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['rooms', profile.id],
      });

      router.replace('/chat');
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const normalizedName = String(formData.get('name') ?? '').trim();
    const normalizedDescription = String(
      formData.get('description') ?? '',
    ).trim();
    const isPrivate = formData.has('isPrivate');

    if (normalizedName.length < 2) {
      return;
    }

    setIsSaved(false);

    updateMutation.mutate({
      name: normalizedName,
      description: normalizedDescription || undefined,
      visibility: isPrivate ? 'PRIVATE' : 'PUBLIC',
    });
  }

  function handleDeleteRoom() {
    const confirmed = window.confirm(
      `Delete #${room?.name ?? 'this room'} permanently?`,
    );

    if (confirmed) {
      deleteMutation.mutate();
    }
  }

  function handleLeaveRoom() {
    const confirmed = window.confirm(`Leave #${room?.name ?? 'this room'}?`);

    if (confirmed) {
      leaveMutation.mutate();
    }
  }

  if (roomQuery.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Loading room settings...
      </div>
    );
  }

  if (roomQuery.error || !room) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-destructive">
          {roomQuery.error?.message ?? 'Room not found'}
        </p>

        <Link
          className="rounded-xl border px-4 py-2.5 transition hover:bg-muted"
          href="/chat"
        >
          Back to chat
        </Link>
      </div>
    );
  }

  const memberIds = room.members.map((member) => member.userId);
  const dangerError = deleteMutation.error ?? leaveMutation.error;

  return (
    <>
      <header className="flex min-h-16 shrink-0 items-center gap-3 border-b px-6 sm:px-8">
        <Link
          aria-label="Back to room"
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          href={`/chat?roomId=${room.id}`}
        >
          <ArrowLeftIcon />
        </Link>

        <h1 className="text-lg font-semibold">Room settings</h1>
      </header>

      <section className="min-h-0 flex-1 overflow-y-auto px-6 py-8 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <div>
            <p className="text-sm font-medium text-primary">#{room.slug}</p>

            <h2 className="mt-1 text-2xl font-semibold">Manage this room</h2>

            <p className="mt-1 text-muted-foreground">
              Update details, members, invitations and access.
            </p>
          </div>

          <section className="mt-8 rounded-2xl border bg-card p-6 text-card-foreground">
            {isOwner ? (
              <form
                className="space-y-5"
                key={room.updatedAt}
                onSubmit={handleSubmit}
              >
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    Room name
                  </span>

                  <input
                    className="w-full rounded-xl border bg-input px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring/30"
                    defaultValue={room.name}
                    maxLength={80}
                    minLength={2}
                    name="name"
                    onChange={() => setIsSaved(false)}
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    Description
                  </span>

                  <textarea
                    className="min-h-28 w-full resize-y rounded-xl border bg-input px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring/30"
                    defaultValue={room.description ?? ''}
                    maxLength={500}
                    name="description"
                    onChange={() => setIsSaved(false)}
                  />
                </label>

                <label className="flex items-center gap-3 text-sm">
                  <input
                    className="size-4 accent-primary"
                    defaultChecked={room.visibility === 'PRIVATE'}
                    name="isPrivate"
                    onChange={() => setIsSaved(false)}
                    type="checkbox"
                  />
                  Private room
                </label>

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    className="rounded-xl bg-primary px-5 py-2.5 font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={updateMutation.isPending}
                    type="submit"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save changes'}
                  </button>

                  {isSaved && (
                    <p className="text-sm text-accent">Changes saved</p>
                  )}
                </div>

                {updateMutation.error && (
                  <p className="text-sm text-destructive">
                    {updateMutation.error.message}
                  </p>
                )}
              </form>
            ) : (
              <div>
                <h3 className="font-medium">Room information</h3>

                <dl className="mt-4 space-y-4">
                  <div>
                    <dt className="text-sm text-muted-foreground">Room name</dt>

                    <dd className="mt-1">{room.name}</dd>
                  </div>

                  <div>
                    <dt className="text-sm text-muted-foreground">
                      Description
                    </dt>

                    <dd className="mt-1">
                      {room.description ?? 'No room description'}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm text-muted-foreground">
                      Visibility
                    </dt>

                    <dd className="mt-1">
                      {room.visibility === 'PRIVATE' ? 'Private' : 'Public'}
                    </dd>
                  </div>
                </dl>

                <p className="mt-5 text-sm text-muted-foreground">
                  Only the room owner can change room settings.
                </p>
              </div>
            )}
          </section>

          {isOwner && (
            <section className="mt-5 rounded-2xl border bg-card p-6 text-card-foreground">
              <InviteMembers
                existingMemberIds={memberIds}
                inviterId={profile.id}
                roomId={room.id}
              />
            </section>
          )}

          <section className="mt-5 rounded-2xl border bg-card p-6 text-card-foreground">
            <h3 className="font-medium">Members ({room.members.length})</h3>

            <div className="mt-5 max-h-72 space-y-2 overflow-y-auto pr-2">
              {room.members.map((member) => (
                <article
                  className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-muted/50"
                  key={member.userId}
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted font-semibold">
                    {getInitials(member.user.displayName)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {member.user.displayName}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {member.role}
                    </p>
                  </div>

                  {member.userId === profile.id && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                      You
                    </span>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <h3 className="font-semibold text-destructive">Danger zone</h3>

            <p className="mt-1 text-sm text-muted-foreground">
              {isOwner
                ? 'Deleting permanently removes this room and its messages.'
                : 'Leaving removes this room from your workspace.'}
            </p>

            {isOwner ? (
              <button
                className="mt-5 rounded-xl border border-destructive px-5 py-2.5 font-medium text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={deleteMutation.isPending}
                onClick={handleDeleteRoom}
                type="button"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete room'}
              </button>
            ) : (
              <button
                className="mt-5 rounded-xl border border-destructive px-5 py-2.5 font-medium text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={leaveMutation.isPending}
                onClick={handleLeaveRoom}
                type="button"
              >
                {leaveMutation.isPending ? 'Leaving...' : 'Leave room'}
              </button>
            )}

            {dangerError && (
              <p className="mt-4 text-sm text-destructive">
                {dangerError.message}
              </p>
            )}
          </section>
        </div>
      </section>
    </>
  );
}

export default function RoomSettingsPage() {
  const params = useParams<{ roomId: string }>();

  const storedProfile = useSyncExternalStore(
    subscribeToProfile,
    getProfileSnapshot,
    getServerProfileSnapshot,
  );

  const profile = useMemo(
    () => parseChatProfile(storedProfile),
    [storedProfile],
  );

  if (!profile) {
    return null;
  }

  return <RoomSettingsContent profile={profile} roomId={params.roomId} />;
}
