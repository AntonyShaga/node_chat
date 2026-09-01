'use client';

import {
  type KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import type { ChatMessage } from '@/types/chat';
import { MoreHorizontalIcon } from '@/components/icons';

type MessageMode = 'idle' | 'editing' | 'deleting' | 'removing';

type MessageItemProps = {
  message: ChatMessage;
  isOwnMessage: boolean;
  onEdit: (messageId: string, text: string) => boolean;
  onDelete: (messageId: string) => boolean;
};

const PANEL_ANIMATION_DURATION = 300;
const DELETE_ANIMATION_DURATION = 220;

export function MessageItem({
  message,
  isOwnMessage,
  onEdit,
  onDelete,
}: MessageItemProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const editingInputRef = useRef<HTMLTextAreaElement | null>(null);
  const editingControlsRef = useRef<HTMLDivElement | null>(null);
  const deletionControlsRef = useRef<HTMLDivElement | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mode, setMode] = useState<MessageMode>('idle');
  const [editingText, setEditingText] = useState(message.text);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isEditing = mode === 'editing';
  const isDeleting = mode === 'deleting';
  const isRemoving = mode === 'removing';

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const menu = menuRef.current;

      if (menu && !menu.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (!isEditing && !isDeleting) {
      return;
    }

    const controls = isEditing
      ? editingControlsRef.current
      : deletionControlsRef.current;

    const animationFrame = requestAnimationFrame(() => {
      if (isEditing) {
        editingInputRef.current?.focus();
        editingInputRef.current?.select();
      }

      controls?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    });

    const finalScrollTimer = window.setTimeout(() => {
      controls?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }, PANEL_ANIMATION_DURATION);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.clearTimeout(finalScrollTimer);
    };
  }, [isDeleting, isEditing]);

  function startEditing() {
    setEditingText(message.text);
    setIsMenuOpen(false);
    setMode('editing');
  }

  function cancelEditing() {
    setEditingText(message.text);
    setMode('idle');
  }

  function saveEditedMessage() {
    const normalizedText = editingText.trim();

    if (!normalizedText || normalizedText === message.text) {
      return;
    }

    if (onEdit(message.id, normalizedText)) {
      setMode('idle');
    }
  }

  function handleEditKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditing();

      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      saveEditedMessage();
    }
  }

  function requestDeletion() {
    setIsMenuOpen(false);
    setMode('deleting');
  }

  function cancelDeletion() {
    setMode('idle');
  }

  function confirmDeletion() {
    setMode('removing');

    deleteTimerRef.current = setTimeout(() => {
      const deletionStarted = onDelete(message.id);

      if (!deletionStarted) {
        setMode('idle');
      }

      deleteTimerRef.current = null;
    }, DELETE_ANIMATION_DURATION);
  }

  return (
    <article
      className={`group -mx-3 flex min-w-0 gap-4 rounded-xl px-3 transition-[max-height,opacity,transform,background-color,padding] ease-out motion-reduce:transition-none ${
        isRemoving
          ? 'max-h-0 translate-x-6 overflow-hidden py-0 opacity-0 duration-200'
          : 'max-h-[40rem] translate-x-0 overflow-visible py-3 opacity-100 duration-300 hover:bg-muted/30'
      }`}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted font-semibold">
        {message.authorName.slice(0, 2).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="max-w-[60%] truncate font-semibold">
            {message.authorName}
          </h3>

          {isOwnMessage && (
            <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              You
            </span>
          )}

          <time
            className="shrink-0 text-xs text-muted-foreground"
            dateTime={message.createdAt}
          >
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>

          {message.editedAt && (
            <>
              <span
                aria-hidden="true"
                className="text-xs text-muted-foreground"
              >
                ·
              </span>

              <span className="shrink-0 text-xs text-muted-foreground">
                edited
              </span>
            </>
          )}

          {isOwnMessage && !isEditing && !isDeleting && (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                aria-expanded={isMenuOpen}
                aria-label="Message actions"
                className="flex size-7 items-center justify-center rounded-lg text-base text-muted-foreground opacity-100 transition-[background-color,color,opacity,transform] duration-200 hover:scale-105 hover:bg-muted hover:text-foreground active:scale-95 sm:opacity-0 sm:group-hover:opacity-100"
                onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
                type="button"
              >
                <MoreHorizontalIcon className="size-4" />
              </button>

              <div
                aria-hidden={!isMenuOpen}
                className={`absolute bottom-full left-0 z-20 mb-1 min-w-32 origin-bottom-left overflow-hidden rounded-xl border bg-card p-1 shadow-lg transition-[opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none ${
                  isMenuOpen
                    ? 'visible scale-100 translate-y-0 opacity-100'
                    : 'invisible pointer-events-none scale-95 translate-y-1 opacity-0'
                }`}
              >
                <button
                  className="w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted"
                  onClick={startEditing}
                  tabIndex={isMenuOpen ? 0 : -1}
                  type="button"
                >
                  Edit
                </button>

                <button
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-destructive transition hover:bg-destructive/5"
                  onClick={requestDeletion}
                  tabIndex={isMenuOpen ? 0 : -1}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          className={`grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
            isEditing
              ? 'grid-rows-[0fr] -translate-y-1 opacity-0'
              : 'grid-rows-[1fr] translate-y-0 opacity-100'
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <p className="mt-1 break-words whitespace-pre-wrap text-muted-foreground">
              {message.text}
            </p>
          </div>
        </div>

        <div
          className={`grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
            isEditing
              ? 'grid-rows-[1fr] translate-y-0 opacity-100'
              : 'pointer-events-none grid-rows-[0fr] -translate-y-2 opacity-0'
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="pt-2">
              <textarea
                className="max-h-40 min-h-20 w-full resize-y rounded-xl border bg-input px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring/30"
                disabled={!isEditing}
                maxLength={5000}
                onChange={(event) => setEditingText(event.target.value)}
                onKeyDown={handleEditKeyDown}
                ref={editingInputRef}
                value={editingText}
              />

              <div
                className="mt-2 flex scroll-mb-4 items-center justify-end gap-2"
                ref={editingControlsRef}
              >
                <button
                  className="rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-muted active:scale-95"
                  disabled={!isEditing}
                  onClick={cancelEditing}
                  type="button"
                >
                  Cancel
                </button>

                <button
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    !isEditing ||
                    !editingText.trim() ||
                    editingText.trim() === message.text
                  }
                  onClick={saveEditedMessage}
                  type="button"
                >
                  Save
                </button>
              </div>

              <p className="mt-1 text-right text-xs text-muted-foreground">
                Enter to save · Shift + Enter for a new line · Esc to cancel
              </p>
            </div>
          </div>
        </div>

        <div
          className={`grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out motion-reduce:transition-none ${
            isDeleting
              ? 'grid-rows-[1fr] translate-y-0 opacity-100'
              : 'pointer-events-none grid-rows-[0fr] -translate-y-2 opacity-0'
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className="mt-3 flex scroll-mb-4 flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3"
              ref={deletionControlsRef}
            >
              <p className="min-w-0 flex-1 text-sm text-destructive">
                Delete this message permanently?
              </p>

              <button
                className="rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-muted active:scale-95"
                disabled={!isDeleting}
                onClick={cancelDeletion}
                type="button"
              >
                Cancel
              </button>

              <button
                className="rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground transition active:scale-95"
                disabled={!isDeleting}
                onClick={confirmDeletion}
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
