'use client';

import { useQuery } from '@tanstack/react-query';

import { getRoomDetails } from '@/lib/api';
import type { ChatProfile, ChatRoom } from '@/types/chat';

type MembersModalProps = {
  profile: ChatProfile;
  room: ChatRoom;
  onClose: () => void;
};

export function MembersModal({ profile, room, onClose }: MembersModalProps) {
  const roomQuery = useQuery({
    queryKey: ['room', room.id, profile.id],
    queryFn: () => getRoomDetails(room.id, profile.id),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-6">
      <section className="w-full max-w-lg rounded-2xl border bg-card p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Members</h2>
            <p className="mt-1 text-muted-foreground">#{room.name}</p>
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

        {roomQuery.isLoading && (
          <p className="mt-6 text-muted-foreground">Loading members...</p>
        )}

        {roomQuery.error && (
          <p className="mt-6 text-destructive">{roomQuery.error.message}</p>
        )}

        <div className="mt-6 max-h-96 space-y-3 overflow-y-auto">
          {roomQuery.data?.members.map((member) => (
            <article
              className="flex items-center gap-4 rounded-xl border p-4"
              key={member.userId}
            >
              <div className="flex size-11 items-center justify-center rounded-full bg-muted font-semibold">
                {member.user.displayName.slice(0, 2).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {member.user.displayName}
                </p>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>

              {member.userId === profile.id && (
                <span className="rounded-lg bg-primary/10 px-2 py-1 text-xs text-primary">
                  You
                </span>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
