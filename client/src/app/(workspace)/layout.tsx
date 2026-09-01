'use client';

import { useRouter } from 'next/navigation';
import {
  type ReactNode,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';

import { WorkspaceSidebar } from '@/features/chat/workspace-sidebar';
import {
  getProfileSnapshot,
  getServerProfileSnapshot,
  parseChatProfile,
  subscribeToProfile,
} from '@/lib/profile-storage';

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
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

  useEffect(() => {
    if (!profile) {
      router.replace('/');
    }
  }, [profile, router]);

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Opening sign in...</p>
      </main>
    );
  }

  return (
    <main className="flex h-screen overflow-hidden bg-background text-foreground">
      <WorkspaceSidebar profile={profile} />

      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </section>
    </main>
  );
}
