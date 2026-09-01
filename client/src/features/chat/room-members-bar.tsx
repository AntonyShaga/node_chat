import { UsersIcon } from '@/components/icons';

type RoomMembersBarProps = {
  memberCount: number;
  onViewMembers: () => void;
};

export function RoomMembersBar({
  memberCount,
  onViewMembers,
}: RoomMembersBarProps) {
  const memberLabel = memberCount === 1 ? 'member' : 'members';

  return (
    <section className="flex min-h-12 items-center gap-4 border-b bg-muted/30 px-6 sm:px-8">
      <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
        <UsersIcon className="size-5 shrink-0" />

        <span className="whitespace-nowrap">
          {memberCount} {memberLabel}
        </span>
      </div>

      <span aria-hidden="true" className="h-5 w-px shrink-0 bg-border" />

      <button
        className="whitespace-nowrap text-sm font-medium text-primary transition hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={memberCount === 0}
        onClick={onViewMembers}
        type="button"
      >
        View members
      </button>
    </section>
  );
}
