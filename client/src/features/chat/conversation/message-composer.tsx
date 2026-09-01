'use client';

import { type FormEvent, type KeyboardEvent, useState } from 'react';
import { SendIcon } from '@/components/icons';

type MessageComposerProps = {
  roomName: string;
  isConnected: boolean;
  onSend: (text: string) => boolean;
  onMessageSent: () => void;
};

export function MessageComposer({
  roomName,
  isConnected,
  onSend,
  onMessageSent,
}: MessageComposerProps) {
  const [text, setText] = useState('');

  function submitMessage() {
    if (onSend(text)) {
      setText('');
      onMessageSent();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  }

  return (
    <form
      className="shrink-0 border-t bg-card px-6 py-4 sm:px-8"
      onSubmit={handleSubmit}
    >
      <div className="mx-auto flex max-w-4xl items-end gap-3">
        <textarea
          aria-label={`Message #${roomName}`}
          className="max-h-36 min-h-12 min-w-0 flex-1 resize-none rounded-xl border bg-input px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring/30"
          disabled={!isConnected}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${roomName}`}
          rows={1}
          value={text}
        />

        <button
          aria-label="Send message"
          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!isConnected || !text.trim()}
          title="Send message"
          type="submit"
        >
          <SendIcon className="size-5" />
        </button>
      </div>

      <p className="mt-2 text-center text-xs text-muted-foreground">
        {isConnected
          ? 'Press Enter to send · Shift + Enter for a new line'
          : 'Connecting to room...'}
      </p>
    </form>
  );
}
