import Dexie, { type EntityTable } from 'dexie';
import type { Flashcard, Deck, Quiz, TheoryNote, Subject, StudySession, LearningGoal, Workspace } from '@/types';

/**
 * Local IndexedDB database for offline support.
 * All data is synced with Firestore when online.
 */
class LernAppDB extends Dexie {
  flashcards!: EntityTable<Flashcard, 'id'>;
  decks!: EntityTable<Deck, 'id'>;
  quizzes!: EntityTable<Quiz, 'id'>;
  theoryNotes!: EntityTable<TheoryNote, 'id'>;
  subjects!: EntityTable<Subject, 'id'>;
  studySessions!: EntityTable<StudySession, 'id'>;
  learningGoals!: EntityTable<LearningGoal, 'id'>;
  workspaces!: EntityTable<Workspace, 'id'>;

  constructor() {
    super('LernAppDB');

    this.version(2).stores({
      flashcards: 'id, deckId, nextReview, *tags',
      decks: 'id, workspaceId, userId',
      quizzes: 'id, workspaceId, userId, subjectId',
      theoryNotes: 'id, workspaceId, userId, subjectId, *tags',
      subjects: 'id, workspaceId, userId',
      studySessions: 'id, workspaceId, userId, date, type',
      learningGoals: 'id, workspaceId, userId, status',
      workspaces: 'id, ownerId, *memberIds',
    });
  }
}

export const localDb = new LernAppDB();
