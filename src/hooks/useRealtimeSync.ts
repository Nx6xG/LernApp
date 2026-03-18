'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { subscribeToWorkspace } from '@/lib/realtime';

/**
 * Subscribes to real-time Firestore updates for the current workspace.
 * Automatically updates the app store when any data changes.
 * Cleans up listeners when workspace changes or component unmounts.
 */
export function useRealtimeSync() {
  const workspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Clean up previous listener
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    if (!workspaceId) return;

    const unsub = subscribeToWorkspace(workspaceId, {
      onDecks: (decks) => {
        // Recalculate due counts from cached flashcards
        const flashcards = useAppStore.getState().flashcards;
        const now = new Date().toISOString();
        const updated = decks.map((d) => {
          const cards = flashcards[d.id];
          if (cards) {
            return {
              ...d,
              cardCount: cards.length,
              dueCount: cards.filter((c) => c.nextReview <= now).length,
            };
          }
          return d;
        });
        useAppStore.setState({ decks: updated });
      },
      onFlashcards: (deckId, cards) => {
        useAppStore.setState((s) => ({
          flashcards: { ...s.flashcards, [deckId]: cards },
        }));
      },
      onQuizzes: (quizzes) => {
        useAppStore.setState({ quizzes });
      },
      onTheoryNotes: (theoryNotes) => {
        useAppStore.setState({ theoryNotes });
      },
      onSubjects: (subjects) => {
        useAppStore.setState({ subjects });
      },
      onLearningGoals: (learningGoals) => {
        useAppStore.setState({ learningGoals });
      },
      onStudySessions: (studySessions) => {
        useAppStore.setState({ studySessions });
      },
    });

    unsubRef.current = unsub;

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [workspaceId]);
}
