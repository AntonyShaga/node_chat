import Link from 'next/link';

import { BoltIcon, ChevronRightIcon } from '@/components/icons';
import type { ChatProfile } from '@/types/chat';

import { InvitationsMenu } from './invitations-menu';

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
          <BoltIcon className="size-5" />
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

        <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground" />
      </Link>
    </header>
  );
}
