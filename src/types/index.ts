// ==================== Arbeitsbereich (Workspace) ====================

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface WorkspaceMember {
  userId: string;
  role: WorkspaceRole;
  displayName: string;
  email: string;
  joinedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  ownerId: string;
  members: WorkspaceMember[];
  memberIds: string[]; // denormalized for Firestore array-contains queries
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  workspaceName: string;
  invitedEmail: string;
  invitedBy: string;
  invitedByName: string;
  role: WorkspaceRole;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

// ==================== Karteikarten (Flashcards) ====================

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  imageUrl?: string;
  tags: string[];
  // SM-2 Spaced Repetition fields
  easeFactor: number; // starts at 2.5
  interval: number; // days until next review
  repetitions: number; // number of consecutive correct answers
  nextReview: string; // ISO date string
  lastReview?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deck {
  id: string;
  workspaceId: string;
  userId: string; // creator
  name: string;
  description: string;
  color: string;
  cardCount: number;
  dueCount: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== Quiz ====================

export type QuestionType = 'multiple-choice' | 'free-text' | 'true-false';

export interface QuizQuestion {
  id: string;
  quizId: string;
  type: QuestionType;
  question: string;
  options?: string[]; // for multiple-choice
  correctAnswer: string;
  explanation?: string;
  imageUrl?: string;
  points: number;
  createdAt: string;
}

export interface Quiz {
  id: string;
  workspaceId: string;
  userId: string; // creator
  title: string;
  description: string;
  subjectId?: string;
  questions: QuizQuestion[];
  // Active Recall scheduling
  nextRecallDate?: string;
  recallInterval: number; // days
  timesCompleted: number;
  averageScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  answers: Record<string, string>;
  score: number;
  maxScore: number;
  completedAt: string;
}

// ==================== Theorie (Theory/Notes) ====================

export interface TheoryNote {
  id: string;
  workspaceId: string;
  userId: string; // creator
  subjectId: string;
  title: string;
  content: string; // Markdown content
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  workspaceId: string;
  userId: string; // creator
  name: string;
  description: string;
  color: string;
  icon: string;
  noteCount: number;
  createdAt: string;
}

// ==================== Lernziele (Learning Goals) ====================

export interface LearningGoal {
  id: string;
  workspaceId: string;
  userId: string; // creator
  title: string;
  description: string;
  targetDate?: string;
  subjectId?: string;
  milestones: Milestone[];
  progress: number; // 0-100
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

// ==================== Fortschritt (Progress/Stats) ====================

export interface StudySession {
  id: string;
  workspaceId: string;
  userId: string;
  type: 'flashcard' | 'quiz' | 'theory';
  subjectId?: string;
  duration: number; // minutes
  cardsStudied?: number;
  correctAnswers?: number;
  totalAnswers?: number;
  date: string;
}

export interface DailyStats {
  date: string;
  totalMinutes: number;
  cardsReviewed: number;
  quizzesTaken: number;
  notesRead: number;
  streak: number;
}

// ==================== Zusammenarbeit (Collaboration) ====================

export interface CollaborationSession {
  id: string;
  workspaceId: string;
  hostId: string;
  hostName: string;
  title: string;
  type: 'flashcard' | 'quiz';
  resourceId: string; // deck or quiz id
  participants: Participant[];
  status: 'waiting' | 'active' | 'completed';
  createdAt: string;
}

export interface Participant {
  userId: string;
  displayName: string;
  score?: number;
  isReady: boolean;
  joinedAt: string;
}

// ==================== User ====================

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  dailyGoalMinutes: number;
  preferredLanguage: string;
  createdAt: string;
  streak: number;
  totalStudyMinutes: number;
}

// ==================== AI ====================

export interface AIGenerateRequest {
  type: 'flashcards' | 'quiz' | 'summary' | 'explanation';
  topic: string;
  content?: string;
  count?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  language?: string;
}

export interface AIGenerateResponse {
  flashcards?: Array<{ front: string; back: string }>;
  questions?: Array<{
    question: string;
    type: QuestionType;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
  }>;
  summary?: string;
  explanation?: string;
}
