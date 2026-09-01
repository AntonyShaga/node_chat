'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { CreateRoomModal } from './create-room-modal';
import { SidebarHeader } from './sidebar-header';
import { getRooms } from '@/lib/api';
import type { ChatProfile, ChatRoom } from '@/types/chat';

type WorkspaceSidebarProps = {
  profile: ChatProfile;
};

function RoomLink({ room, selected }: { room: ChatRoom; selected: boolean }) {
  return (
    <Link
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition ${
        selected
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
      href={`/chat?roomId=${room.id}`}
    >
      <span className="text-xl">
        {room.visibility === 'PRIVATE' ? '🔒' : '#'}
      </span>

      <span className="min-w-0 flex-1 truncate">{room.name}</span>
      <span className="text-xs">{room._count.members}</span>
    </Link>
  );
}

export function WorkspaceSidebar({ profile }: WorkspaceSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState('');
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);

  const roomsQuery = useQuery({
    queryKey: ['rooms', profile.id],
    queryFn: () => getRooms(profile.id),
  });

  const rooms = roomsQuery.data ?? [];
  const normalizedSearch = search.trim().toLowerCase();

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(normalizedSearch),
  );

  const joinedRooms = filteredRooms.filter((room) => room.members.length > 0);

  const discoverRooms = filteredRooms.filter(
    (room) => room.members.length === 0,
  );

  const selectedRoomId = searchParams.get('roomId') ?? rooms[0]?.id;

  return (
    <>
      <aside className="sticky top-0 z-30 flex h-screen w-80 shrink-0 flex-col border-r bg-sidebar p-6">
        <SidebarHeader profile={profile} />

        <input
          className="mt-8 w-full rounded-xl border bg-input px-4 py-3 outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30"
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
              className="rounded-lg px-2 text-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
              onClick={() => setIsCreateRoomOpen(true)}
              type="button"
            >
              +
            </button>
          </div>

          <div className="mt-3 space-y-1">
            {joinedRooms.map((room) => (
              <RoomLink
                key={room.id}
                room={room}
                selected={selectedRoomId === room.id}
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
              <RoomLink
                key={room.id}
                room={room}
                selected={selectedRoomId === room.id}
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
      </aside>

      {isCreateRoomOpen && (
        <CreateRoomModal
          onClose={() => setIsCreateRoomOpen(false)}
          onCreated={(roomId) => {
            setIsCreateRoomOpen(false);
            router.push(`/chat?roomId=${roomId}`);
          }}
          ownerId={profile.id}
        />
      )}
    </>
  );
}
