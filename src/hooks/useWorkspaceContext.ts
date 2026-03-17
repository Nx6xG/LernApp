'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useWorkspaceStore } from '@/stores/workspace-store';

/**
 * Returns current user and workspace context for use in pages.
 */
export function useWorkspaceContext() {
  const uid = useAuthStore((s) => s.user?.uid) ?? '';
  const profile = useAuthStore((s) => s.profile);
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId) ?? '';
  const workspace = useWorkspaceStore((s) => s.currentWorkspace);

  return { uid, profile, workspaceId, workspace };
}
