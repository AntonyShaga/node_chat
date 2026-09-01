'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useMemo, useState, useSyncExternalStore } from 'react';

import { updateChatProfile } from '@/lib/api';
import {
  clearChatProfile,
  getProfileSnapshot,
  getServerProfileSnapshot,
  parseChatProfile,
  saveChatProfile,
  subscribeToProfile,
} from '@/lib/profile-storage';

type UpdateProfileInput = {
  profileId: string;
  displayName: string;
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();

  const storedProfile = useSyncExternalStore(
    subscribeToProfile,
    getProfileSnapshot,
    getServerProfileSnapshot,
  );

  const profile = useMemo(
    () => parseChatProfile(storedProfile),
    [storedProfile],
  );

  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState('');

  const updateProfile = useMutation({
    mutationFn: ({ profileId, displayName }: UpdateProfileInput) =>
      updateChatProfile(profileId, displayName),

    onSuccess: (updatedProfile) => {
      saveChatProfile({
        ...updatedProfile,
        identifier: profile?.identifier,
      });

      setIsEditingName(false);
    },
  });

  if (!profile) {
    return null;
  }

  const currentProfile = profile;

  function startEditing() {
    setDisplayName(currentProfile.displayName);
    setIsEditingName(true);
    updateProfile.reset();
  }

  function cancelEditing() {
    setDisplayName('');
    setIsEditingName(false);
    updateProfile.reset();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedName = displayName.trim();

    if (normalizedName.length < 2) {
      return;
    }

    updateProfile.mutate({
      profileId: currentProfile.id,
      displayName: normalizedName,
    });
  }

  function handleLogout() {
    clearChatProfile();
    router.replace('/');
  }

  return (
    <>
      <header className="flex min-h-16 items-center gap-3 border-b px-6 sm:px-8">
        <Link
          aria-label="Back to chat"
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          href="/chat"
        >
          <svg
            aria-hidden="true"
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="m15 18-6-6 6-6"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.75"
            />
          </svg>
        </Link>

        <h1 className="text-lg font-semibold">Your profile</h1>
      </header>

      <section className="flex-1 overflow-y-auto px-6 py-8 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-semibold text-primary">
              {getInitials(currentProfile.displayName)}
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-2xl font-semibold">
                {currentProfile.displayName}
              </h2>

              <p className="mt-1 truncate text-sm text-muted-foreground">
                {currentProfile.identifier ?? 'Sign-in identifier unavailable'}
              </p>
            </div>

            <span className="ml-auto rounded-full bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent">
              Active
            </span>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border bg-card text-card-foreground">
            <section className="flex min-h-24 items-center gap-5 px-6 py-5">
              {isEditingName ? (
                <form
                  className="flex w-full items-end gap-3"
                  onSubmit={handleSubmit}
                >
                  <label className="min-w-0 flex-1">
                    <span className="mb-2 block text-sm font-medium">
                      Display name
                    </span>

                    <input
                      autoFocus
                      className="w-full rounded-xl border bg-background px-4 py-2.5 outline-none transition focus:ring-2 focus:ring-ring/30"
                      maxLength={50}
                      minLength={2}
                      onChange={(event) => setDisplayName(event.target.value)}
                      required
                      value={displayName}
                    />
                  </label>

                  <button
                    className="rounded-xl bg-primary px-4 py-2.5 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={updateProfile.isPending}
                    type="submit"
                  >
                    {updateProfile.isPending ? 'Saving...' : 'Save'}
                  </button>

                  <button
                    className="rounded-xl border px-4 py-2.5 transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={updateProfile.isPending}
                    onClick={cancelEditing}
                    type="button"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium">Display name</h3>

                    <p className="mt-1 truncate text-muted-foreground">
                      {currentProfile.displayName}
                    </p>
                  </div>

                  <button
                    className="font-medium text-primary transition hover:opacity-70"
                    onClick={startEditing}
                    type="button"
                  >
                    Edit
                  </button>
                </>
              )}
            </section>

            {updateProfile.error && (
              <p className="border-t px-6 py-3 text-sm text-destructive">
                {updateProfile.error.message}
              </p>
            )}

            <Link
              className="flex min-h-24 w-full items-center gap-5 border-t px-6 py-5 text-left transition hover:bg-muted/40"
              href="/profile/security"
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-medium">Security</h3>

                <p className="mt-1 text-muted-foreground">
                  Manage your sign-in and account access
                </p>
              </div>

              <span
                aria-hidden="true"
                className="text-xl text-muted-foreground"
              >
                ›
              </span>
            </Link>

            <button
              className="flex min-h-20 w-full items-center gap-3 border-t px-6 py-5 text-left font-medium text-destructive transition hover:bg-destructive/5"
              onClick={handleLogout}
              type="button"
            >
              <span aria-hidden="true">↪</span>
              Log out
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
