'use client';
import {
  getProfileSnapshot,
  getServerProfileSnapshot,
  parseChatProfile,
  saveChatProfile,
  subscribeToProfile,
} from '@/lib/profile-storage';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';

import { createChatProfile } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const storedProfile = useSyncExternalStore(
    subscribeToProfile,
    getProfileSnapshot,
    getServerProfileSnapshot,
  );

  const existingProfile = useMemo(
    () => parseChatProfile(storedProfile),
    [storedProfile],
  );
  const [displayName, setDisplayName] = useState('');

  const createProfile = useMutation({
    mutationFn: createChatProfile,
    onSuccess: (profile) => {
      saveChatProfile(profile);
      router.push('/chat');
    },
  });

  useEffect(() => {
    if (existingProfile) {
      router.replace('/chat');
    }
  }, [existingProfile, router]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedName = displayName.trim();

    if (normalizedName.length < 2) {
      return;
    }

    createProfile.mutate(normalizedName);
  }

  if (existingProfile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Opening chat...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-semibold text-slate-900">Join the chat</h1>

        <p className="mt-2 text-slate-600">
          Choose the name shown beside your messages.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block font-medium text-slate-800">
              Username
            </span>

            <input
              autoFocus
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              maxLength={50}
              minLength={2}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Anton"
              required
              value={displayName}
            />
          </label>

          {createProfile.error && (
            <p className="text-sm text-red-600">
              {createProfile.error.message}
            </p>
          )}

          <button
            className="w-full rounded-xl bg-teal-700 px-4 py-3 font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={createProfile.isPending}
            type="submit"
          >
            {createProfile.isPending ? 'Joining...' : 'Continue'}
          </button>
        </form>
      </section>
    </main>
  );
}
