'use client';

import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { createUserProfile, getUserProfile, createWorkspace } from '@/lib/firestore';
import type { UserProfile } from '@/types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  initialize: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      const profile = await getUserProfile(cred.user.uid);
      set({ user: cred.user, profile, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  signUp: async (email, password, displayName) => {
    set({ loading: true, error: null });
    try {
      const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      await updateProfile(cred.user, { displayName });
      const now = new Date().toISOString();

      const profile: UserProfile = {
        uid: cred.user.uid,
        email,
        displayName,
        dailyGoalMinutes: 30,
        preferredLanguage: 'de',
        createdAt: now,
        streak: 0,
        totalStudyMinutes: 0,
      };
      await createUserProfile(profile);

      // Auto-create default personal workspace
      await createWorkspace({
        name: `${displayName}s Bereich`,
        description: 'Persönlicher Arbeitsbereich',
        color: '#4c6ef5',
        icon: 'user',
        ownerId: cred.user.uid,
        members: [{
          userId: cred.user.uid,
          role: 'owner',
          displayName,
          email,
          joinedAt: now,
        }],
        memberIds: [cred.user.uid],
        createdAt: now,
        updatedAt: now,
      });

      set({ user: cred.user, profile, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  signOut: async () => {
    await firebaseSignOut(getFirebaseAuth());
    set({ user: null, profile: null });
  },

  clearError: () => set({ error: null }),

  initialize: () => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (user) => {
      if (user) {
        let profile = await getUserProfile(user.uid);

        // Auto-create profile for existing users who don't have one
        if (!profile) {
          profile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || 'Benutzer',
            dailyGoalMinutes: 30,
            preferredLanguage: 'de',
            createdAt: new Date().toISOString(),
            streak: 0,
            totalStudyMinutes: 0,
          };
          await createUserProfile(profile);
        }

        set({ user, profile, loading: false });
      } else {
        set({ user: null, profile: null, loading: false });
      }
    });
    return unsubscribe;
  },
}));
