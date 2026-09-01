'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { BellIcon, PlusIcon } from '@/components/icons';
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
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (!menuRef.current?.contains(target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const invitations = invitationsQuery.data ?? [];

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Invitations"
        className="relative flex size-11 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
      >
        <BellIcon className="size-5" />

        {invitations.length > 0 && (
          <span className="absolute right-0 top-0 flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            {invitations.length}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          aria-label="Pending invitations"
          className="absolute left-1/2 top-full z-50 mt-3 w-80 max-w-[calc(100vw-2rem)] -translate-x-1/4 rounded-2xl border bg-popover p-4 text-popover-foreground shadow-xl"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Invitations</h2>

            <button
              aria-label="Close invitations"
              className="rounded-lg px-2 py-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              <PlusIcon className="size-5" />
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

          <div className="mt-4 max-h-80 space-y-3 overflow-y-auto">
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
                    className="rounded-lg border px-3 py-2 text-sm transition hover:bg-muted disabled:opacity-50"
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
