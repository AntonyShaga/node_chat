'use client';

import Link from 'next/link';
import { useMemo, useSyncExternalStore } from 'react';

import {
  getProfileSnapshot,
  getServerProfileSnapshot,
  parseChatProfile,
  subscribeToProfile,
} from '@/lib/profile-storage';

export default function SecurityPage() {
  const storedProfile = useSyncExternalStore(
    subscribeToProfile,
    getProfileSnapshot,
    getServerProfileSnapshot,
  );

  const profile = useMemo(
    () => parseChatProfile(storedProfile),
    [storedProfile],
  );

  if (!profile) {
    return null;
  }

  const identifier = profile.identifier?.trim();

  const email = identifier?.includes('@') ? identifier : null;

  const phone = identifier && !identifier.includes('@') ? identifier : null;

  return (
    <>
      <header className="flex min-h-16 items-center gap-3 border-b px-6 sm:px-8">
        <Link
          aria-label="Back to profile"
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          href="/profile"
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

        <h1 className="text-lg font-semibold">Security settings</h1>
      </header>

      <section className="flex-1 overflow-y-auto px-6 py-8 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <div>
            <h2 className="text-2xl font-semibold">Keep your account secure</h2>

            <p className="mt-2 text-muted-foreground">
              Manage your password and account identifiers.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <section className="flex min-h-28 items-center gap-6 rounded-2xl border bg-card px-6 py-5 text-card-foreground">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium">Password</h3>

                <p className="mt-1 text-muted-foreground">
                  Password authentication will be available later.
                </p>
              </div>

              <Link
                className="shrink-0 rounded-xl border px-5 py-3 font-medium transition hover:bg-muted"
                href="/profile/security/password"
              >
                Change password
              </Link>
            </section>

            <section className="flex min-h-28 items-center gap-6 rounded-2xl border bg-card px-6 py-5 text-card-foreground">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium">Email address</h3>

                <p
                  className={
                    email
                      ? 'mt-1 truncate text-muted-foreground'
                      : 'mt-1 text-muted-foreground italic'
                  }
                >
                  {email ?? 'Not added'}
                </p>
              </div>

              <button
                aria-disabled="true"
                className="shrink-0 cursor-not-allowed rounded-xl border px-5 py-3 font-medium text-muted-foreground opacity-60"
                disabled
                title="Available after authentication is connected"
                type="button"
              >
                {email ? 'Change email' : 'Add email'}
              </button>
            </section>

            <section className="flex min-h-28 items-center gap-6 rounded-2xl border bg-card px-6 py-5 text-card-foreground">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium">Phone number</h3>

                <p
                  className={
                    phone
                      ? 'mt-1 truncate text-muted-foreground'
                      : 'mt-1 text-muted-foreground italic'
                  }
                >
                  {phone ?? 'Not added'}
                </p>
              </div>

              <button
                aria-disabled="true"
                className="shrink-0 cursor-not-allowed rounded-xl border px-5 py-3 font-medium text-muted-foreground opacity-60"
                disabled
                title="Available after authentication is connected"
                type="button"
              >
                {phone ? 'Change phone' : 'Add phone'}
              </button>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
