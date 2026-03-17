import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  setDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import type {
  Deck, Flashcard, Quiz, TheoryNote, Subject, StudySession,
  LearningGoal, UserProfile, Workspace, WorkspaceMember, WorkspaceInvite,
} from '@/types';
import { localDb } from './db';

const db = () => getFirebaseDb();

// ==================== Helpers ====================

async function syncToLocal<T extends { id: string }>(table: any, items: T[]): Promise<void> {
  try { await table.bulkPut(items); } catch { /* offline */ }
}

function sortDesc<T>(arr: T[], field: keyof T): T[] {
  return [...arr].sort((a, b) => String(b[field]).localeCompare(String(a[field])));
}

// ==================== User Profile ====================

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db(), 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  await setDoc(doc(db(), 'users', profile.uid), profile);
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  await updateDoc(doc(db(), 'users', uid), data);
}

// ==================== Workspaces ====================

export async function getWorkspaces(userId: string): Promise<Workspace[]> {
  const q = query(collection(db(), 'workspaces'), where('memberIds', 'array-contains', userId));
  const snap = await getDocs(q);
  return sortDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Workspace), 'createdAt');
}

export async function createWorkspace(workspace: Omit<Workspace, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db(), 'workspaces'), workspace);
  return docRef.id;
}

export async function updateWorkspace(id: string, data: Partial<Workspace>): Promise<void> {
  await updateDoc(doc(db(), 'workspaces', id), data);
}

export async function deleteWorkspace(id: string): Promise<void> {
  await deleteDoc(doc(db(), 'workspaces', id));
}

export async function addMemberToWorkspace(
  workspaceId: string,
  member: WorkspaceMember
): Promise<void> {
  const ref = doc(db(), 'workspaces', workspaceId);
  await updateDoc(ref, {
    members: arrayUnion(member),
    memberIds: arrayUnion(member.userId),
    updatedAt: new Date().toISOString(),
  });
}

export async function removeMemberFromWorkspace(
  workspaceId: string,
  member: WorkspaceMember
): Promise<void> {
  const ref = doc(db(), 'workspaces', workspaceId);
  await updateDoc(ref, {
    members: arrayRemove(member),
    memberIds: arrayRemove(member.userId),
    updatedAt: new Date().toISOString(),
  });
}

// ==================== Workspace Invites ====================

export async function createInvite(invite: Omit<WorkspaceInvite, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db(), 'workspaceInvites'), invite);
  return docRef.id;
}

export async function getInvitesForUser(email: string): Promise<WorkspaceInvite[]> {
  const q = query(
    collection(db(), 'workspaceInvites'),
    where('invitedEmail', '==', email),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WorkspaceInvite);
}

export async function acceptInvite(
  inviteId: string,
  member: WorkspaceMember,
  workspaceId: string
): Promise<void> {
  await updateDoc(doc(db(), 'workspaceInvites', inviteId), { status: 'accepted' });
  await addMemberToWorkspace(workspaceId, member);
}

export async function declineInvite(inviteId: string): Promise<void> {
  await updateDoc(doc(db(), 'workspaceInvites', inviteId), { status: 'declined' });
}

// ==================== Decks ====================

export async function getDecks(workspaceId: string): Promise<Deck[]> {
  const q = query(collection(db(), 'decks'), where('workspaceId', '==', workspaceId));
  const snap = await getDocs(q);
  const decks = sortDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Deck), 'updatedAt');
  await syncToLocal(localDb.decks, decks);
  return decks;
}

export async function createDeck(deck: Omit<Deck, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db(), 'decks'), deck);
  await localDb.decks.put({ ...deck, id: docRef.id } as Deck);
  return docRef.id;
}

export async function updateDeck(id: string, data: Partial<Deck>): Promise<void> {
  await updateDoc(doc(db(), 'decks', id), data);
  await localDb.decks.update(id, data);
}

export async function deleteDeck(id: string): Promise<void> {
  await deleteDoc(doc(db(), 'decks', id));
  await localDb.decks.delete(id);
  const cards = await localDb.flashcards.where('deckId').equals(id).toArray();
  await localDb.flashcards.bulkDelete(cards.map((c) => c.id));
}

// ==================== Flashcards ====================

export async function getFlashcards(deckId: string): Promise<Flashcard[]> {
  const q = query(collection(db(), 'flashcards'), where('deckId', '==', deckId));
  const snap = await getDocs(q);
  const cards = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Flashcard);
  await syncToLocal(localDb.flashcards, cards);
  return cards;
}

export async function getDueFlashcards(workspaceId: string): Promise<Flashcard[]> {
  const now = new Date().toISOString();
  const decks = await getDecks(workspaceId);
  if (decks.length === 0) return [];
  const allCards: Flashcard[] = [];
  for (const deck of decks) {
    const cards = await getFlashcards(deck.id);
    allCards.push(...cards.filter((c) => c.nextReview <= now));
  }
  return allCards;
}

export async function createFlashcard(card: Omit<Flashcard, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db(), 'flashcards'), card);
  await localDb.flashcards.put({ ...card, id: docRef.id } as Flashcard);
  return docRef.id;
}

export async function updateFlashcard(id: string, data: Partial<Flashcard>): Promise<void> {
  await updateDoc(doc(db(), 'flashcards', id), data);
  await localDb.flashcards.update(id, data);
}

export async function deleteFlashcard(id: string): Promise<void> {
  await deleteDoc(doc(db(), 'flashcards', id));
  await localDb.flashcards.delete(id);
}

// ==================== Quizzes ====================

export async function getQuizzes(workspaceId: string): Promise<Quiz[]> {
  const q = query(collection(db(), 'quizzes'), where('workspaceId', '==', workspaceId));
  const snap = await getDocs(q);
  const quizzes = sortDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Quiz), 'updatedAt');
  await syncToLocal(localDb.quizzes, quizzes);
  return quizzes;
}

export async function createQuiz(quiz: Omit<Quiz, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db(), 'quizzes'), quiz);
  await localDb.quizzes.put({ ...quiz, id: docRef.id } as Quiz);
  return docRef.id;
}

export async function updateQuiz(id: string, data: Partial<Quiz>): Promise<void> {
  await updateDoc(doc(db(), 'quizzes', id), data);
  await localDb.quizzes.update(id, data);
}

export async function deleteQuiz(id: string): Promise<void> {
  await deleteDoc(doc(db(), 'quizzes', id));
  await localDb.quizzes.delete(id);
}

// ==================== Theory Notes ====================

export async function getTheoryNotes(workspaceId: string, subjectId?: string): Promise<TheoryNote[]> {
  let q;
  if (subjectId) {
    q = query(collection(db(), 'theoryNotes'), where('workspaceId', '==', workspaceId), where('subjectId', '==', subjectId));
  } else {
    q = query(collection(db(), 'theoryNotes'), where('workspaceId', '==', workspaceId));
  }
  const snap = await getDocs(q);
  const notes = sortDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TheoryNote), 'updatedAt');
  await syncToLocal(localDb.theoryNotes, notes);
  return notes;
}

export async function createTheoryNote(note: Omit<TheoryNote, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db(), 'theoryNotes'), note);
  await localDb.theoryNotes.put({ ...note, id: docRef.id } as TheoryNote);
  return docRef.id;
}

export async function updateTheoryNote(id: string, data: Partial<TheoryNote>): Promise<void> {
  await updateDoc(doc(db(), 'theoryNotes', id), data);
  await localDb.theoryNotes.update(id, data);
}

export async function deleteTheoryNote(id: string): Promise<void> {
  await deleteDoc(doc(db(), 'theoryNotes', id));
  await localDb.theoryNotes.delete(id);
}

// ==================== Subjects ====================

export async function getSubjects(workspaceId: string): Promise<Subject[]> {
  const q = query(collection(db(), 'subjects'), where('workspaceId', '==', workspaceId));
  const snap = await getDocs(q);
  const subjects = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Subject);
  await syncToLocal(localDb.subjects, subjects);
  return subjects;
}

export async function createSubject(subject: Omit<Subject, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db(), 'subjects'), subject);
  await localDb.subjects.put({ ...subject, id: docRef.id } as Subject);
  return docRef.id;
}

// ==================== Study Sessions ====================

export async function logStudySession(session: Omit<StudySession, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db(), 'studySessions'), session);
  await localDb.studySessions.put({ ...session, id: docRef.id } as StudySession);
  return docRef.id;
}

export async function getStudySessions(workspaceId: string, days: number = 30): Promise<StudySession[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const q = query(collection(db(), 'studySessions'), where('workspaceId', '==', workspaceId));
  const snap = await getDocs(q);
  return sortDesc(
    snap.docs.map((d) => ({ id: d.id, ...d.data() }) as StudySession).filter((s) => s.date >= since.toISOString()),
    'date'
  );
}

// ==================== Learning Goals ====================

export async function getLearningGoals(workspaceId: string): Promise<LearningGoal[]> {
  const q = query(collection(db(), 'learningGoals'), where('workspaceId', '==', workspaceId));
  const snap = await getDocs(q);
  const goals = sortDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as LearningGoal), 'createdAt');
  await syncToLocal(localDb.learningGoals, goals);
  return goals;
}

export async function createLearningGoal(goal: Omit<LearningGoal, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db(), 'learningGoals'), goal);
  await localDb.learningGoals.put({ ...goal, id: docRef.id } as LearningGoal);
  return docRef.id;
}

export async function updateLearningGoal(id: string, data: Partial<LearningGoal>): Promise<void> {
  await updateDoc(doc(db(), 'learningGoals', id), data);
  await localDb.learningGoals.update(id, data);
}
