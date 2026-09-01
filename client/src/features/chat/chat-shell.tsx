'use client';
import { RoomSettingsModal } from './room-settings-modal';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { RoomConversation } from './room-conversation';
import { getRooms } from '@/lib/api';
import {
  clearChatProfile,
  getProfileSnapshot,
  getServerProfileSnapshot,
  parseChatProfile,
  subscribeToProfile,
} from '@/lib/profile-storage';
import type { ChatRoom } from '@/types/chat';
import { CreateRoomModal } from './create-room-modal';
import { InvitationsMenu } from '@/features/chat/invitations-menu';
import { MembersModal } from '@/features/chat/members-modal';
import { useRouter } from 'next/navigation';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function RoomButton({
  room,
  selected,
  onSelect,
}: {
  room: ChatRoom;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
        selected
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
      onClick={onSelect}
      type="button"
    >
      <span className="text-xl">
        {room.visibility === 'PRIVATE' ? '🔒' : '#'}
      </span>

      <span className="min-w-0 flex-1 truncate">{room.name}</span>

      <span className="text-xs">{room._count.members}</span>
    </button>
  );
}

export function ChatShell() {
  const storedProfile = useSyncExternalStore(
    subscribeToProfile,
    getProfileSnapshot,
    getServerProfileSnapshot,
  );
  const router = useRouter();
  const profile = useMemo(
    () => parseChatProfile(storedProfile),
    [storedProfile],
  );

  const [search, setSearch] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);

  const roomsQuery = useQuery({
    queryKey: ['rooms', profile?.id],
    queryFn: () => {
      if (!profile) {
        throw new Error('Chat profile is missing');
      }

      return getRooms(profile.id);
    },
    enabled: Boolean(profile),
  });

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <section className="rounded-2xl border bg-card p-8 text-center">
          <h1 className="text-2xl font-semibold">Choose a username first</h1>

          <Link
            className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 text-primary-foreground"
            href="/"
          >
            Go to sign in
          </Link>
        </section>
      </main>
    );
  }

  const rooms = roomsQuery.data ?? [];
  const normalizedSearch = search.trim().toLowerCase();

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(normalizedSearch),
  );

  const joinedRooms = filteredRooms.filter((room) => room.members.length > 0);

  const discoverRooms = filteredRooms.filter(
    (room) => room.members.length === 0,
  );

  const selectedRoom =
    rooms.find((room) => room.id === selectedRoomId) ?? rooms[0];

  return (
    <main className="flex min-h-screen bg-background text-foreground">
      <aside className="flex w-80 shrink-0 flex-col border-r bg-sidebar p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
            {getInitials(profile.displayName)}
          </div>

          <div className="ml-auto">
            <InvitationsMenu profileId={profile.id} />
          </div>

          <div className="min-w-0">
            <p className="truncate font-semibold">{profile.displayName}</p>
            <p className="text-sm text-accent">Online</p>
          </div>
        </div>

        <input
          className="mt-8 w-full rounded-xl border bg-input px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring/30"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search rooms"
          value={search}
        />

        <section className="mt-8">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Your rooms
            </h2>

            <button
              aria-label="Create room"
              className="rounded-lg px-2 text-xl text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setIsCreateRoomOpen(true)}
              type="button"
            >
              +
            </button>
          </div>

          <div className="mt-3 space-y-1">
            {joinedRooms.map((room) => (
              <RoomButton
                key={room.id}
                onSelect={() => setSelectedRoomId(room.id)}
                room={room}
                selected={selectedRoom?.id === room.id}
              />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="px-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Discover
          </h2>

          <div className="mt-3 space-y-1">
            {discoverRooms.map((room) => (
              <RoomButton
                key={room.id}
                onSelect={() => setSelectedRoomId(room.id)}
                room={room}
                selected={selectedRoom?.id === room.id}
              />
            ))}
          </div>
        </section>

        {roomsQuery.isPending && (
          <p className="mt-6 px-4 text-sm text-muted-foreground">
            Loading rooms...
          </p>
        )}

        {roomsQuery.error && (
          <p className="mt-6 px-4 text-sm text-destructive">
            {roomsQuery.error.message}
          </p>
        )}
        <button
          className="mt-auto rounded-xl border px-4 py-3 text-left text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => {
            clearChatProfile();
            router.replace('/');
          }}
          type="button"
        >
          Log out
        </button>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        {selectedRoom ? (
          <>
            <header className="border-b px-8 py-6">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-xl text-primary">
                    #
                  </div>

                  <div>
                    <h1 className="text-xl font-semibold">
                      {selectedRoom.name}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {selectedRoom.description ?? 'No room description'}
                    </p>
                  </div>
                </div>

                {selectedRoom.members.length > 0 && (
                  <button
                    aria-label="Room settings"
                    className="rounded-xl px-4 py-2 text-xl text-muted-foreground hover:bg-muted"
                    onClick={() => setIsRoomSettingsOpen(true)}
                    type="button"
                  >
                    ···
                  </button>
                )}
              </div>
            </header>
            <button
              className="mt-1 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setIsMembersOpen(true)}
              type="button"
            >
              {selectedRoom._count.members} members
            </button>
            <RoomConversation profile={profile} room={selectedRoom} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            No rooms available
          </div>
        )}
      </section>
      {isCreateRoomOpen && (
        <CreateRoomModal
          onClose={() => setIsCreateRoomOpen(false)}
          onCreated={(roomId) => {
            setSelectedRoomId(roomId);
            setIsCreateRoomOpen(false);
          }}
          ownerId={profile.id}
        />
      )}
      {isRoomSettingsOpen && selectedRoom && (
        <RoomSettingsModal
          onClose={() => setIsRoomSettingsOpen(false)}
          onRemoved={() => {
            setSelectedRoomId(null);
            setIsRoomSettingsOpen(false);
          }}
          profile={profile}
          room={selectedRoom}
        />
      )}
      {isMembersOpen && selectedRoom && (
        <MembersModal
          onClose={() => setIsMembersOpen(false)}
          profile={profile}
          room={selectedRoom}
        />
      )}
    </main>
  );
}
