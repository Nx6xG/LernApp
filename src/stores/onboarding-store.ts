'use client';

import { create } from 'zustand';

interface OnboardingState {
  active: boolean;
  step: number;
  initialized: boolean;
  start: () => void;
  nextStep: () => void;
  complete: (userId: string) => void;
  initialize: (userId: string) => void;
}

const TOTAL_STEPS = 7;

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  active: false,
  step: 0,
  initialized: false,

  initialize: (userId) => {
    // Only run once
    if (get().initialized) return;
    const key = `lernapp_onboarded_${userId}`;
    const alreadyDone = typeof window !== 'undefined' && localStorage.getItem(key);
    set({ initialized: true, active: !alreadyDone, step: 0 });
  },

  start: () => set({ active: true, step: 0 }),

  nextStep: () => {
    const { step } = get();
    if (step < TOTAL_STEPS - 1) {
      set({ step: step + 1 });
    }
  },

  complete: (userId) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`lernapp_onboarded_${userId}`, 'true');
    }
    set({ active: false, step: 0 });
  },
}));
