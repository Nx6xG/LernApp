import {
  collection,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import type { Deck, Flashcard, Quiz, TheoryNote, Subject, LearningGoal, StudySession } from '@/types';

const db = () => getFirebaseDb();

function sortDesc<T>(arr: T[], field: keyof T): T[] {
  return [...arr].sort((a, b) => String(b[field]).localeCompare(String(a[field])));
}

export interface RealtimeCallbacks {
  onDecks: (decks: Deck[]) => void;
  onQuizzes: (quizzes: Quiz[]) => void;
  onTheoryNotes: (notes: TheoryNote[]) => void;
  onSubjects: (subjects: Subject[]) => void;
  onLearningGoals: (goals: LearningGoal[]) => void;
  onStudySessions: (sessions: StudySession[]) => void;
  onFlashcards: (deckId: string, cards: Flashcard[]) => void;
}

/**
 * Subscribes to real-time updates for all workspace data.
 * Returns a cleanup function that unsubscribes from all listeners.
 */
export function subscribeToWorkspace(
  workspaceId: string,
  callbacks: RealtimeCallbacks
): Unsubscribe {
  const unsubscribes: Unsubscribe[] = [];

  // Decks
  const decksQuery = query(collection(db(), 'decks'), where('workspaceId', '==', workspaceId));
  unsubscribes.push(
    onSnapshot(decksQuery, (snap) => {
      const decks = sortDesc(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Deck),
        'updatedAt'
      );
      callbacks.onDecks(decks);

      // Subscribe to flashcards for each deck
      for (const deck of decks) {
        const cardsQuery = query(collection(db(), 'flashcards'), where('deckId', '==', deck.id));
        unsubscribes.push(
          onSnapshot(cardsQuery, (cardSnap) => {
            const cards = cardSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Flashcard);
            callbacks.onFlashcards(deck.id, cards);
          })
        );
      }
    })
  );

  // Quizzes
  const quizzesQuery = query(collection(db(), 'quizzes'), where('workspaceId', '==', workspaceId));
  unsubscribes.push(
    onSnapshot(quizzesQuery, (snap) => {
      callbacks.onQuizzes(
        sortDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Quiz), 'updatedAt')
      );
    })
  );

  // Theory Notes
  const notesQuery = query(collection(db(), 'theoryNotes'), where('workspaceId', '==', workspaceId));
  unsubscribes.push(
    onSnapshot(notesQuery, (snap) => {
      callbacks.onTheoryNotes(
        sortDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TheoryNote), 'updatedAt')
      );
    })
  );

  // Subjects
  const subjectsQuery = query(collection(db(), 'subjects'), where('workspaceId', '==', workspaceId));
  unsubscribes.push(
    onSnapshot(subjectsQuery, (snap) => {
      callbacks.onSubjects(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Subject));
    })
  );

  // Learning Goals
  const goalsQuery = query(collection(db(), 'learningGoals'), where('workspaceId', '==', workspaceId));
  unsubscribes.push(
    onSnapshot(goalsQuery, (snap) => {
      callbacks.onLearningGoals(
        sortDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as LearningGoal), 'createdAt')
      );
    })
  );

  // Study Sessions (last 30 days)
  const sessionsQuery = query(collection(db(), 'studySessions'), where('workspaceId', '==', workspaceId));
  unsubscribes.push(
    onSnapshot(sessionsQuery, (snap) => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      callbacks.onStudySessions(
        sortDesc(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as StudySession)
            .filter((s) => s.date >= since.toISOString()),
          'date'
        )
      );
    })
  );

  // Return combined unsubscribe
  return () => {
    unsubscribes.forEach((unsub) => unsub());
  };
}
