'use client';

import { create } from 'zustand';
import type { Workspace, WorkspaceInvite, WorkspaceMember, WorkspaceRole, UserProfile } from '@/types';
import * as firestore from '@/lib/firestore';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
  currentWorkspace: Workspace | null;
  invites: WorkspaceInvite[];
  isLoading: boolean;

  // Init
  initializeWorkspaces: (userId: string) => Promise<void>;

  // Workspace CRUD
  loadWorkspaces: (userId: string) => Promise<void>;
  setCurrentWorkspace: (workspaceId: string) => void;
  createWorkspace: (workspace: Omit<Workspace, 'id'>) => Promise<string>;
  updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;

  // Invites
  loadInvites: (email: string) => Promise<void>;
  sendInvite: (invite: Omit<WorkspaceInvite, 'id'>) => Promise<void>;
  acceptInvite: (inviteId: string, member: WorkspaceMember, workspaceId: string) => Promise<void>;
  declineInvite: (inviteId: string) => Promise<void>;

  // Members
  removeMember: (workspaceId: string, member: WorkspaceMember) => Promise<void>;

  // Reset
  reset: () => void;
}

function getStoredWorkspaceId(userId: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`lernapp_workspace_${userId}`);
}

function storeWorkspaceId(userId: string, workspaceId: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`lernapp_workspace_${userId}`, workspaceId);
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspaceId: null,
  currentWorkspace: null,
  invites: [],
  isLoading: true,

  initializeWorkspaces: async (userId) => {
    set({ isLoading: true });
    let workspaces = await firestore.getWorkspaces(userId);

    // Auto-create default workspace for existing users who have none
    if (workspaces.length === 0) {
      const profile = await firestore.getUserProfile(userId);
      const now = new Date().toISOString();
      const name = profile?.displayName || 'Mein Bereich';
      const email = profile?.email || '';
      const id = await firestore.createWorkspace({
        name: `${name}s Bereich`,
        description: 'Persönlicher Arbeitsbereich',
        color: '#4c6ef5',
        icon: 'user',
        ownerId: userId,
        members: [{
          userId,
          role: 'owner',
          displayName: name,
          email,
          joinedAt: now,
        }],
        memberIds: [userId],
        createdAt: now,
        updatedAt: now,
      });
      workspaces = await firestore.getWorkspaces(userId);
    }

    const storedId = getStoredWorkspaceId(userId);
    const targetId = storedId && workspaces.find((w) => w.id === storedId)
      ? storedId
      : workspaces[0]?.id || null;

    set({
      workspaces,
      currentWorkspaceId: targetId,
      currentWorkspace: workspaces.find((w) => w.id === targetId) || null,
      isLoading: false,
    });

    if (targetId) storeWorkspaceId(userId, targetId);
  },

  loadWorkspaces: async (userId) => {
    const workspaces = await firestore.getWorkspaces(userId);
    const { currentWorkspaceId } = get();
    set({
      workspaces,
      currentWorkspace: workspaces.find((w) => w.id === currentWorkspaceId) || null,
    });
  },

  setCurrentWorkspace: (workspaceId) => {
    const { workspaces } = get();
    const ws = workspaces.find((w) => w.id === workspaceId);
    set({ currentWorkspaceId: workspaceId, currentWorkspace: ws || null });
    // Persist — we don't have userId here so store with a generic key
    if (typeof window !== 'undefined') {
      // Find userId from the workspace members (current user is always in it)
      const stored = Object.keys(localStorage)
        .find((k) => k.startsWith('lernapp_workspace_'));
      if (stored) {
        const uid = stored.replace('lernapp_workspace_', '');
        storeWorkspaceId(uid, workspaceId);
      }
    }
  },

  createWorkspace: async (workspace) => {
    const id = await firestore.createWorkspace(workspace);
    const newWs = { ...workspace, id } as Workspace;
    set((s) => ({ workspaces: [newWs, ...s.workspaces] }));
    return id;
  },

  updateWorkspace: async (id, data) => {
    await firestore.updateWorkspace(id, data);
    set((s) => ({
      workspaces: s.workspaces.map((w) => (w.id === id ? { ...w, ...data } : w)),
      currentWorkspace: s.currentWorkspaceId === id
        ? { ...s.currentWorkspace!, ...data }
        : s.currentWorkspace,
    }));
  },

  deleteWorkspace: async (id) => {
    await firestore.deleteWorkspace(id);
    const { workspaces, currentWorkspaceId } = get();
    const remaining = workspaces.filter((w) => w.id !== id);
    set({
      workspaces: remaining,
      currentWorkspaceId: currentWorkspaceId === id ? remaining[0]?.id || null : currentWorkspaceId,
      currentWorkspace: currentWorkspaceId === id ? remaining[0] || null : get().currentWorkspace,
    });
  },

  loadInvites: async (email) => {
    const invites = await firestore.getInvitesForUser(email);
    set({ invites });
  },

  sendInvite: async (invite) => {
    await firestore.createInvite(invite);
  },

  acceptInvite: async (inviteId, member, workspaceId) => {
    await firestore.acceptInvite(inviteId, member, workspaceId);
    set((s) => ({ invites: s.invites.filter((i) => i.id !== inviteId) }));
    // Reload workspaces to include the new one
    if (member.userId) {
      const workspaces = await firestore.getWorkspaces(member.userId);
      set({ workspaces });
    }
  },

  declineInvite: async (inviteId) => {
    await firestore.declineInvite(inviteId);
    set((s) => ({ invites: s.invites.filter((i) => i.id !== inviteId) }));
  },

  removeMember: async (workspaceId, member) => {
    await firestore.removeMemberFromWorkspace(workspaceId, member);
    set((s) => ({
      workspaces: s.workspaces.map((w) =>
        w.id === workspaceId
          ? {
              ...w,
              members: w.members.filter((m) => m.userId !== member.userId),
              memberIds: w.memberIds.filter((id) => id !== member.userId),
            }
          : w
      ),
    }));
  },

  reset: () => set({
    workspaces: [],
    currentWorkspaceId: null,
    currentWorkspace: null,
    invites: [],
    isLoading: true,
  }),
}));
