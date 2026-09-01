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
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <svg
          aria-hidden="true"
          className="size-5"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          />
        </svg>

        <span>
          {memberCount} {memberLabel}
        </span>
      </div>

      <span aria-hidden="true" className="h-5 w-px bg-border" />

      <button
        className="text-sm font-medium text-primary transition hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={memberCount === 0}
        onClick={onViewMembers}
        type="button"
      >
        View members
      </button>
    </section>
  );
}
