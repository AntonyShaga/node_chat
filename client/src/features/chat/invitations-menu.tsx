'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { getPendingInvitations, respondToInvitation } from '@/lib/api';

type InvitationsMenuProps = {
  profileId: string;
};

type InvitationResponse = {
  invitationId: string;
  action: 'accept' | 'decline';
};

export function InvitationsMenu({ profileId }: InvitationsMenuProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const invitationsQuery = useQuery({
    queryKey: ['room-invitations', profileId],
    queryFn: () => getPendingInvitations(profileId),
    refetchInterval: 10_000,
  });

  const responseMutation = useMutation({
    mutationFn: ({ invitationId, action }: InvitationResponse) =>
      respondToInvitation(invitationId, profileId, action),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['room-invitations', profileId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['rooms', profileId],
        }),
      ]);
    },
  });

  const invitations = invitationsQuery.data ?? [];

  return (
    <div className="relative">
      <button
        aria-label="Invitations"
        className="relative rounded-xl p-3 hover:bg-muted"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span aria-hidden="true">🔔</span>

        {invitations.length > 0 && (
          <span className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
            {invitations.length}
          </span>
        )}
      </button>

      {isOpen && (
        <section className="absolute top-12 left-0 z-40 w-80 rounded-2xl border bg-popover p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Invitations</h2>

            <button
              aria-label="Close invitations"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              ×
            </button>
          </div>

          {invitationsQuery.isLoading && (
            <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
          )}

          {!invitationsQuery.isLoading && invitations.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              No pending invitations
            </p>
          )}

          <div className="mt-4 space-y-3">
            {invitations.map((invitation) => (
              <article className="rounded-xl border p-4" key={invitation.id}>
                <p className="font-medium">#{invitation.room.name}</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Invited by {invitation.invitedBy.displayName}
                </p>

                <div className="mt-4 flex gap-2">
                  <button
                    className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
                    disabled={responseMutation.isPending}
                    onClick={() =>
                      responseMutation.mutate({
                        invitationId: invitation.id,
                        action: 'accept',
                      })
                    }
                    type="button"
                  >
                    Accept
                  </button>

                  <button
                    className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                    disabled={responseMutation.isPending}
                    onClick={() =>
                      responseMutation.mutate({
                        invitationId: invitation.id,
                        action: 'decline',
                      })
                    }
                    type="button"
                  >
                    Decline
                  </button>
                </div>
              </article>
            ))}
          </div>

          {responseMutation.error && (
            <p className="mt-3 text-sm text-destructive">
              {responseMutation.error.message}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
