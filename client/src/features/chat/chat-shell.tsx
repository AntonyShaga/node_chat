'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState, useSyncExternalStore } from 'react';

import { getRooms } from '@/lib/api';
import {
  getProfileSnapshot,
  getServerProfileSnapshot,
  parseChatProfile,
  subscribeToProfile,
} from '@/lib/profile-storage';

import { MembersModal } from './members-modal';
import { RoomConversation } from './room-conversation';
import { RoomMembersBar } from './room-members-bar';
import { MoreHorizontalIcon } from '@/components/icons';

export function ChatShell() {
  const searchParams = useSearchParams();

  const storedProfile = useSyncExternalStore(
    subscribeToProfile,
    getProfileSnapshot,
    getServerProfileSnapshot,
  );

  const profile = useMemo(
    () => parseChatProfile(storedProfile),
    [storedProfile],
  );

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
    return null;
  }

  const rooms = roomsQuery.data ?? [];
  const requestedRoomId = searchParams.get('roomId');

  const selectedRoom =
    rooms.find((room) => room.id === requestedRoomId) ?? rooms[0];

  if (roomsQuery.isPending) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden text-muted-foreground">
        Loading rooms...
      </div>
    );
  }

  if (roomsQuery.error) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-6 text-center text-destructive">
        {roomsQuery.error.message}
      </div>
    );
  }

  if (!selectedRoom) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden text-muted-foreground">
        No rooms available
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b px-6 py-5 sm:px-8">
        <div className="flex items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl text-primary">
              #
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold">
                {selectedRoom.name}
              </h1>

              <p className="truncate text-sm text-muted-foreground">
                {selectedRoom.description ?? 'No room description'}
              </p>
            </div>
          </div>

          {selectedRoom.members.length > 0 && (
            <Link
              aria-label="Room settings"
              className="shrink-0 rounded-xl px-4 py-2 text-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
              href={`/rooms/${selectedRoom.id}/settings`}
            >
              <MoreHorizontalIcon className="size-5" />
            </Link>
          )}
        </div>
      </header>

      <div className="shrink-0">
        <RoomMembersBar
          memberCount={selectedRoom._count.members}
          onViewMembers={() => setIsMembersOpen(true)}
        />
      </div>

      <RoomConversation
        key={selectedRoom.id}
        profile={profile}
        room={selectedRoom}
      />

      {isMembersOpen && (
        <MembersModal
          onClose={() => setIsMembersOpen(false)}
          profile={profile}
          room={selectedRoom}
        />
      )}
    </div>
  );
}
