type MessageDateDividerProps = {
  createdAt: string;
};

export function isSameMessageDay(firstValue: string, secondValue: string) {
  const firstDate = new Date(firstValue);
  const secondDate = new Date(secondValue);

  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function getDateLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  if (isSameMessageDay(value, today.toISOString())) {
    return 'Today';
  }

  if (isSameMessageDay(value, yesterday.toISOString())) {
    return 'Yesterday';
  }

  return date.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

export function MessageDateDivider({ createdAt }: MessageDateDividerProps) {
  return (
    <div className="my-6 flex items-center gap-4">
      <div className="h-px flex-1 bg-border" />

      <time
        className="shrink-0 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
        dateTime={createdAt}
      >
        {getDateLabel(createdAt)}
      </time>

      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
