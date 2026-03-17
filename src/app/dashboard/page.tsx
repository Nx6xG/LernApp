'use client';

import { useEffect, useState } from 'react';
import { useWorkspaceContext } from '@/hooks/useWorkspaceContext';
import { useAppStore } from '@/stores/app-store';
import Link from 'next/link';
import {
  Layers,
  HelpCircle,
  BookOpen,
  Clock,
  Flame,
  ChevronRight,
  Play,
  Zap,
} from 'lucide-react';
import { FlashcardStudy } from '@/components/karteikarten/FlashcardStudy';

export default function DashboardPage() {
  const { profile, workspaceId, workspace } = useWorkspaceContext();
  const {
    decks, quizzes, learningGoals, studySessions,
    loadDecks, loadQuizzes, loadLearningGoals, loadStudySessions,
    loadAllFlashcardsForWorkspace, getAllDueCards,
  } = useAppStore();

  const [studyAll, setStudyAll] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      loadAllFlashcardsForWorkspace(workspaceId);
      loadQuizzes(workspaceId);
      loadLearningGoals(workspaceId);
      loadStudySessions(workspaceId);
    }
  }, [workspaceId]);

  const dueCards = getAllDueCards();
  const totalDueCards = dueCards.length;

  const todayMinutes = studySessions
    .filter((s) => s.date.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((acc, s) => acc + s.duration, 0);

  const activeGoals = learningGoals.filter((g) => g.status === 'active');

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  // Study all due cards mode
  if (studyAll && dueCards.length > 0) {
    return (
      <FlashcardStudy
        cards={dueCards}
        deckName="Alle fälligen Karten"
        onExit={() => setStudyAll(false)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          {greeting()}, {profile?.displayName || 'Lerner'}!
        </h1>
        <p className="text-neutral-500 mt-1">
          {workspace && (
            <span
              className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 -mb-px"
              style={{ backgroundColor: workspace.color }}
            />
          )}
          {workspace?.name || 'Arbeitsbereich'}
        </p>
      </div>

      {/* Main CTA — Study due cards */}
      {totalDueCards > 0 ? (
        <button
          onClick={() => setStudyAll(true)}
          className="w-full card p-6 hover:shadow-md transition-shadow group text-left bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-900/10 border-primary-200 dark:border-primary-800"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center">
                <Zap size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  {totalDueCards} Karte{totalDueCards !== 1 ? 'n' : ''} fällig
                </h2>
                <p className="text-sm text-neutral-500">
                  Aus {decks.filter((d) => d.dueCount > 0).length} Stapel{decks.filter((d) => d.dueCount > 0).length !== 1 ? 'n' : ''} — jetzt wiederholen
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-primary-600">
              <span className="text-sm font-semibold hidden sm:inline">Jetzt lernen</span>
              <Play size={20} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>
      ) : (
        <div className="card p-6 text-center bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
          <p className="text-green-700 dark:text-green-400 font-medium">
            Alle Karten sind auf dem neuesten Stand!
          </p>
          <p className="text-sm text-green-600/70 dark:text-green-500/70 mt-1">
            Erstelle neue Karten oder warte bis welche fällig werden.
          </p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Clock size={20} className="text-primary-600" />
            </div>
            <span className="text-sm text-neutral-500">Heute gelernt</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{todayMinutes} Min.</p>
          {profile?.dailyGoalMinutes && (
            <div className="mt-2">
              <div className="w-full bg-neutral-100 dark:bg-neutral-700 rounded-full h-1.5">
                <div
                  className="bg-primary-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (todayMinutes / profile.dailyGoalMinutes) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-neutral-400 mt-1">Ziel: {profile.dailyGoalMinutes} Min.</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Flame size={20} className="text-orange-500" />
            </div>
            <span className="text-sm text-neutral-500">Streak</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{profile?.streak || 0} Tage</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Layers size={20} className="text-green-600" />
            </div>
            <span className="text-sm text-neutral-500">Kartenstapel</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{decks.length}</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <HelpCircle size={20} className="text-purple-600" />
            </div>
            <span className="text-sm text-neutral-500">Quizze</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{quizzes.length}</p>
        </div>
      </div>

      {/* Due cards per deck */}
      {decks.some((d) => d.dueCount > 0) && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">Fällig pro Stapel</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {decks.filter((d) => d.dueCount > 0).map((deck) => (
              <Link
                key={deck.id}
                href="/karteikarten"
                className="card p-4 hover:shadow-md transition-shadow flex items-center gap-3 group"
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: deck.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{deck.name}</p>
                  <p className="text-xs text-neutral-500">{deck.cardCount} Karten</p>
                </div>
                <span className="badge bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                  {deck.dueCount} fällig
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/karteikarten" className="card p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Layers size={20} className="text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">Karteikarten</h3>
                <p className="text-xs text-neutral-500">{decks.length} Stapel</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-neutral-400 group-hover:text-primary-600 transition-colors" />
          </div>
        </Link>

        <Link href="/quiz" className="card p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <HelpCircle size={20} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">Quiz</h3>
                <p className="text-xs text-neutral-500">{quizzes.length} Quizze</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-neutral-400 group-hover:text-purple-600 transition-colors" />
          </div>
        </Link>

        <Link href="/theorie" className="card p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <BookOpen size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">Theorie</h3>
                <p className="text-xs text-neutral-500">Notizen & Erklärungen</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-neutral-400 group-hover:text-green-600 transition-colors" />
          </div>
        </Link>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Aktive Lernziele</h2>
            <Link href="/fortschritt" className="text-sm text-primary-600 hover:text-primary-700">Alle anzeigen</Link>
          </div>
          <div className="space-y-3">
            {activeGoals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-neutral-900 dark:text-white text-sm">{goal.title}</h3>
                  <span className="text-sm font-medium text-primary-600">{goal.progress}%</span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-700 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
