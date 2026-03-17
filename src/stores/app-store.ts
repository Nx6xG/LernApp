'use client';

import { create } from 'zustand';
import type { Deck, Flashcard, Quiz, TheoryNote, Subject, LearningGoal, StudySession } from '@/types';
import * as firestore from '@/lib/firestore';
import { updateStreak } from '@/lib/streak';

interface AppState {
  // Data
  decks: Deck[];
  flashcards: Record<string, Flashcard[]>;
  quizzes: Quiz[];
  theoryNotes: TheoryNote[];
  subjects: Subject[];
  learningGoals: LearningGoal[];
  studySessions: StudySession[];

  // Cache tracking — which workspace data was loaded for
  _loaded: Record<string, string>; // key -> workspaceId

  // UI state
  isLoading: boolean;
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Clear all data (when switching workspaces)
  clearAll: () => void;

  // Data loaders — cached, won't re-fetch if already loaded for same workspace
  loadDecks: (workspaceId: string, force?: boolean) => Promise<void>;
  loadFlashcards: (deckId: string) => Promise<void>;
  loadQuizzes: (workspaceId: string, force?: boolean) => Promise<void>;
  loadTheoryNotes: (workspaceId: string, subjectId?: string, force?: boolean) => Promise<void>;
  loadSubjects: (workspaceId: string, force?: boolean) => Promise<void>;
  loadLearningGoals: (workspaceId: string, force?: boolean) => Promise<void>;
  loadStudySessions: (workspaceId: string, force?: boolean) => Promise<void>;

  // Deck actions
  addDeck: (deck: Omit<Deck, 'id'>) => Promise<string>;
  removeDeck: (id: string) => Promise<void>;

  // Flashcard actions
  addFlashcard: (card: Omit<Flashcard, 'id'>) => Promise<string>;
  editFlashcard: (id: string, data: Partial<Flashcard>) => Promise<void>;
  removeFlashcard: (id: string, deckId: string) => Promise<void>;

  // Quiz actions
  addQuiz: (quiz: Omit<Quiz, 'id'>) => Promise<string>;
  editQuiz: (id: string, data: Partial<Quiz>) => Promise<void>;
  removeQuiz: (id: string) => Promise<void>;

  // Theory actions
  addTheoryNote: (note: Omit<TheoryNote, 'id'>) => Promise<string>;
  editTheoryNote: (id: string, data: Partial<TheoryNote>) => Promise<void>;
  removeTheoryNote: (id: string) => Promise<void>;

  // Subject actions
  addSubject: (subject: Omit<Subject, 'id'>) => Promise<string>;

  // Goal actions
  addLearningGoal: (goal: Omit<LearningGoal, 'id'>) => Promise<string>;
  editLearningGoal: (id: string, data: Partial<LearningGoal>) => Promise<void>;

  // Session logging
  logSession: (session: Omit<StudySession, 'id'>) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  decks: [],
  flashcards: {},
  quizzes: [],
  theoryNotes: [],
  subjects: [],
  learningGoals: [],
  studySessions: [],
  _loaded: {},
  isLoading: false,
  sidebarOpen: true,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  clearAll: () => set({
    decks: [],
    flashcards: {},
    quizzes: [],
    theoryNotes: [],
    subjects: [],
    learningGoals: [],
    studySessions: [],
    _loaded: {},
  }),

  // ===== Loaders (cached) =====
  loadDecks: async (workspaceId, force) => {
    if (!force && get()._loaded['decks'] === workspaceId) return;
    set({ isLoading: true });
    const decks = await firestore.getDecks(workspaceId);
    set((s) => ({ decks, isLoading: false, _loaded: { ...s._loaded, decks: workspaceId } }));
  },

  loadFlashcards: async (deckId) => {
    if (get().flashcards[deckId]) return; // already loaded
    const cards = await firestore.getFlashcards(deckId);
    set((s) => ({ flashcards: { ...s.flashcards, [deckId]: cards } }));
  },

  loadQuizzes: async (workspaceId, force) => {
    if (!force && get()._loaded['quizzes'] === workspaceId) return;
    const quizzes = await firestore.getQuizzes(workspaceId);
    set((s) => ({ quizzes, _loaded: { ...s._loaded, quizzes: workspaceId } }));
  },

  loadTheoryNotes: async (workspaceId, subjectId, force) => {
    const key = `theoryNotes_${subjectId || 'all'}`;
    if (!force && get()._loaded[key] === workspaceId) return;
    const theoryNotes = await firestore.getTheoryNotes(workspaceId, subjectId);
    set((s) => ({ theoryNotes, _loaded: { ...s._loaded, [key]: workspaceId } }));
  },

  loadSubjects: async (workspaceId, force) => {
    if (!force && get()._loaded['subjects'] === workspaceId) return;
    const subjects = await firestore.getSubjects(workspaceId);
    set((s) => ({ subjects, _loaded: { ...s._loaded, subjects: workspaceId } }));
  },

  loadLearningGoals: async (workspaceId, force) => {
    if (!force && get()._loaded['learningGoals'] === workspaceId) return;
    const learningGoals = await firestore.getLearningGoals(workspaceId);
    set((s) => ({ learningGoals, _loaded: { ...s._loaded, learningGoals: workspaceId } }));
  },

  loadStudySessions: async (workspaceId, force) => {
    if (!force && get()._loaded['studySessions'] === workspaceId) return;
    const studySessions = await firestore.getStudySessions(workspaceId);
    set((s) => ({ studySessions, _loaded: { ...s._loaded, studySessions: workspaceId } }));
  },

  // ===== Deck Actions =====
  addDeck: async (deck) => {
    const id = await firestore.createDeck(deck);
    set((s) => ({ decks: [{ ...deck, id } as Deck, ...s.decks] }));
    return id;
  },

  removeDeck: async (id) => {
    await firestore.deleteDeck(id);
    set((s) => ({
      decks: s.decks.filter((d) => d.id !== id),
      flashcards: Object.fromEntries(Object.entries(s.flashcards).filter(([k]) => k !== id)),
    }));
  },

  // ===== Flashcard Actions =====
  addFlashcard: async (card) => {
    const id = await firestore.createFlashcard(card);
    const newCard = { ...card, id } as Flashcard;
    set((s) => ({
      flashcards: {
        ...s.flashcards,
        [card.deckId]: [...(s.flashcards[card.deckId] || []), newCard],
      },
    }));
    return id;
  },

  editFlashcard: async (id, data) => {
    await firestore.updateFlashcard(id, data);
    set((s) => {
      const updated = { ...s.flashcards };
      for (const deckId in updated) {
        updated[deckId] = updated[deckId].map((c) => (c.id === id ? { ...c, ...data } : c));
      }
      return { flashcards: updated };
    });
  },

  removeFlashcard: async (id, deckId) => {
    await firestore.deleteFlashcard(id);
    set((s) => ({
      flashcards: {
        ...s.flashcards,
        [deckId]: (s.flashcards[deckId] || []).filter((c) => c.id !== id),
      },
    }));
  },

  // ===== Quiz Actions =====
  addQuiz: async (quiz) => {
    const id = await firestore.createQuiz(quiz);
    set((s) => ({ quizzes: [{ ...quiz, id } as Quiz, ...s.quizzes] }));
    return id;
  },

  editQuiz: async (id, data) => {
    await firestore.updateQuiz(id, data);
    set((s) => ({ quizzes: s.quizzes.map((q) => (q.id === id ? { ...q, ...data } : q)) }));
  },

  removeQuiz: async (id) => {
    await firestore.deleteQuiz(id);
    set((s) => ({ quizzes: s.quizzes.filter((q) => q.id !== id) }));
  },

  // ===== Theory Actions =====
  addTheoryNote: async (note) => {
    const id = await firestore.createTheoryNote(note);
    set((s) => ({ theoryNotes: [{ ...note, id } as TheoryNote, ...s.theoryNotes] }));
    return id;
  },

  editTheoryNote: async (id, data) => {
    await firestore.updateTheoryNote(id, data);
    set((s) => ({ theoryNotes: s.theoryNotes.map((n) => (n.id === id ? { ...n, ...data } : n)) }));
  },

  removeTheoryNote: async (id) => {
    await firestore.deleteTheoryNote(id);
    set((s) => ({ theoryNotes: s.theoryNotes.filter((n) => n.id !== id) }));
  },

  // ===== Subject Actions =====
  addSubject: async (subject) => {
    const id = await firestore.createSubject(subject);
    set((s) => ({ subjects: [...s.subjects, { ...subject, id } as Subject] }));
    return id;
  },

  // ===== Goal Actions =====
  addLearningGoal: async (goal) => {
    const id = await firestore.createLearningGoal(goal);
    set((s) => ({ learningGoals: [{ ...goal, id } as LearningGoal, ...s.learningGoals] }));
    return id;
  },

  editLearningGoal: async (id, data) => {
    await firestore.updateLearningGoal(id, data);
    set((s) => ({
      learningGoals: s.learningGoals.map((g) => (g.id === id ? { ...g, ...data } : g)),
    }));
  },

  // ===== Session Logging =====
  logSession: async (session) => {
    await firestore.logStudySession(session);
    await updateStreak(session.userId).catch(() => {});
    await firestore.updateUserProfile(session.userId, {
      totalStudyMinutes: ((await firestore.getUserProfile(session.userId))?.totalStudyMinutes || 0) + session.duration,
    } as any).catch(() => {});
    set((s) => ({
      studySessions: [{ ...session, id: Date.now().toString() } as StudySession, ...s.studySessions],
    }));
  },
}));
