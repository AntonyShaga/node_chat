'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { createRoomInvitation, searchChatProfiles } from '@/lib/api';

type InviteMembersProps = {
  roomId: string;
  inviterId: string;
  existingMemberIds?: string[];
};

export function InviteMembers({
  roomId,
  inviterId,
  existingMemberIds = [],
}: InviteMembersProps) {
  const [search, setSearch] = useState('');
  const [invitedUsers, setInvitedUsers] = useState(() => new Set<string>());

  const normalizedSearch = search.trim();

  const profilesQuery = useQuery({
    queryKey: ['chat-profiles', normalizedSearch],
    queryFn: () => searchChatProfiles(normalizedSearch),
    enabled: normalizedSearch.length >= 2,
  });

  const invitationMutation = useMutation({
    mutationFn: (recipientId: string) =>
      createRoomInvitation(roomId, inviterId, recipientId),

    onSuccess: (_, recipientId) => {
      setInvitedUsers((currentUsers) => {
        const nextUsers = new Set(currentUsers);

        nextUsers.add(recipientId);

        return nextUsers;
      });
    },
  });

  const profiles = (profilesQuery.data ?? []).filter(
    (profile) =>
      profile.id !== inviterId && !existingMemberIds.includes(profile.id),
  );

  return (
    <section>
      <h3 className="font-medium">Invite members</h3>

      <p className="mt-1 text-sm text-muted-foreground">
        Search for a chat profile by username.
      </p>

      <input
        className="mt-4 w-full rounded-xl border bg-input px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring/30"
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search users"
        value={search}
      />

      {profilesQuery.isFetching && (
        <p className="mt-3 text-sm text-muted-foreground">Searching...</p>
      )}

      <div className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-2">
        {profiles.map((profile) => {
          const isInvited = invitedUsers.has(profile.id);

          return (
            <article
              className="flex items-center gap-3 rounded-xl border p-3"
              key={profile.id}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted font-semibold">
                {profile.displayName.slice(0, 2).toUpperCase()}
              </div>

              <span className="min-w-0 flex-1 truncate">
                {profile.displayName}
              </span>

              <button
                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
                disabled={isInvited || invitationMutation.isPending}
                onClick={() => invitationMutation.mutate(profile.id)}
                type="button"
              >
                {isInvited ? 'Invited' : 'Invite'}
              </button>
            </article>
          );
        })}
      </div>

      {normalizedSearch.length >= 2 &&
        !profilesQuery.isFetching &&
        profiles.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            No available users found
          </p>
        )}

      {invitationMutation.error && (
        <p className="mt-3 text-sm text-destructive">
          {invitationMutation.error.message}
        </p>
      )}
    </section>
  );
}
