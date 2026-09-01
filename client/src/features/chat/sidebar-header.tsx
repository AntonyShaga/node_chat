import Link from 'next/link';

import { InvitationsMenu } from './invitations-menu';
import type { ChatProfile } from '@/types/chat';

type SidebarHeaderProps = {
  profile: ChatProfile;
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function SidebarHeader({ profile }: SidebarHeaderProps) {
  return (
    <header>
      <div className="flex items-center justify-between">
        <Link
          aria-label="Chat home"
          className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition hover:opacity-90"
          href="/chat"
        >
          <svg
            aria-hidden="true"
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="m13.5 2-7 11H12l-1.5 9 7-12H12l1.5-8Z"
              fill="currentColor"
              stroke="currentColor"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <InvitationsMenu profileId={profile.id} />
      </div>

      <Link
        className="mt-10 flex items-center gap-3 rounded-xl p-2 transition hover:bg-muted"
        href="/profile"
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
          {getInitials(profile.displayName)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{profile.displayName}</p>
          <p className="text-sm text-accent">Online</p>
        </div>

        <svg
          aria-hidden="true"
          className="size-5 shrink-0 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="m9 18 6-6-6-6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
        </svg>
      </Link>
    </header>
  );
}
