'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { Sidebar } from './Sidebar';
import { Onboarding } from './Onboarding';
import { NotificationPrompt } from './NotificationPrompt';
import { redirect } from 'next/navigation';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, profile } = useAuthStore();
  const { isLoading: wsLoading, initializeWorkspaces, loadInvites } = useWorkspaceStore();
  const { active: showOnboarding, initialize: initOnboarding, complete: completeOnboarding } =
    useOnboardingStore();

  useEffect(() => {
    if (!authLoading && !user) {
      redirect('/');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user && !authLoading) {
      initializeWorkspaces(user.uid);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (profile?.email) {
      loadInvites(profile.email);
    }
  }, [profile?.email]);

  // Real-time sync — listen to Firestore changes from other users
  useRealtimeSync();

  // Initialize onboarding (only once via store)
  useEffect(() => {
    if (user && !authLoading && !wsLoading) {
      initOnboarding(user.uid);
    }
  }, [user, authLoading, wsLoading]);

  if (authLoading || wsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-neutral-500">Laden...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {showOnboarding && (
        <Onboarding onComplete={() => completeOnboarding(user.uid)} />
      )}
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 animate-fade-in">{children}</div>
      </main>
      {!showOnboarding && <NotificationPrompt />}
    </div>
  );
}
