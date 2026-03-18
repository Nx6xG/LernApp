'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { setPresence, removePresence, subscribeToPresence, type UserPresence } from '@/lib/presence';

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/karteikarten': 'Karteikarten',
  '/quiz': 'Quiz',
  '/theorie': 'Theorie',
  '/fortschritt': 'Fortschritt',
  '/zusammenarbeit': 'Zusammenarbeit',
  '/arbeitsbereich': 'Arbeitsbereich',
  '/profil': 'Profil',
};

/**
 * Updates the detail text for the current presence (e.g. which note/deck you're editing).
 */
export function usePresenceDetail(detail: string | undefined) {
  const uid = useAuthStore((s) => s.user?.uid);
  const displayName = useAuthStore((s) => s.profile?.displayName) || '';
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const pathname = usePathname();

  useEffect(() => {
    if (!uid || !workspaceId || !displayName) return;
    const page = PAGE_LABELS[pathname] || pathname;
    setPresence(workspaceId, uid, displayName, page, detail);
  }, [detail, uid, workspaceId, displayName, pathname]);
}

/**
 * Tracks current user's presence and returns other online users.
 */
export function usePresence(): UserPresence[] {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const pathname = usePathname();
  const uid = useAuthStore((s) => s.user?.uid);
  const displayName = useAuthStore((s) => s.profile?.displayName) || '';
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update own presence when page changes
  useEffect(() => {
    if (!uid || !workspaceId || !displayName) return;

    const page = PAGE_LABELS[pathname] || pathname;
    setPresence(workspaceId, uid, displayName, page);

    // Heartbeat every 60s to keep presence fresh
    intervalRef.current = setInterval(() => {
      setPresence(workspaceId, uid, displayName, page);
    }, 60000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [uid, workspaceId, displayName, pathname]);

  // Clean up on unmount (logout/close)
  useEffect(() => {
    return () => {
      if (uid && workspaceId) {
        removePresence(workspaceId, uid);
      }
    };
  }, [uid, workspaceId]);

  // Subscribe to other users' presence
  useEffect(() => {
    if (!uid || !workspaceId) return;
    const unsub = subscribeToPresence(workspaceId, uid, setOnlineUsers);
    return unsub;
  }, [uid, workspaceId]);

  return onlineUsers;
}
