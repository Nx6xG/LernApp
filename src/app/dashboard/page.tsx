'use client';

import { useEffect } from 'react';
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
} from 'lucide-react';

export default function DashboardPage() {
  const { profile, workspaceId, workspace } = useWorkspaceContext();
  const { decks, quizzes, learningGoals, studySessions, loadDecks, loadQuizzes, loadLearningGoals, loadStudySessions } =
    useAppStore();

  useEffect(() => {
    if (workspaceId) {
      loadDecks(workspaceId);
      loadQuizzes(workspaceId);
      loadLearningGoals(workspaceId);
      loadStudySessions(workspaceId);
    }
  }, [workspaceId]);

  const todayMinutes = studySessions
    .filter((s) => s.date.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((acc, s) => acc + s.duration, 0);

  const activeGoals = learningGoals.filter((g) => g.status === 'active');
  const totalDueCards = decks.reduce((acc, d) => acc + (d.dueCount || 0), 0);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          {greeting()}, {profile?.displayName || 'Lerner'}!
        </h1>
        <p className="text-neutral-500 mt-1">
          {workspace ? (
            <>
              <span
                className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 -mb-px"
                style={{ backgroundColor: workspace.color }}
              />
              {workspace.name}
              {totalDueCards > 0
                ? ` — ${totalDueCards} Karteikarten zur Wiederholung`
                : ' — alles auf dem neuesten Stand'}
            </>
          ) : (
            'Wähle einen Arbeitsbereich'
          )}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/karteikarten" className="card p-6 hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                <Layers size={24} className="text-primary-600" />
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">Karteikarten lernen</h3>
              <p className="text-sm text-neutral-500">{totalDueCards} Karten fällig</p>
            </div>
            <ChevronRight size={20} className="text-neutral-400 group-hover:text-primary-600 transition-colors" />
          </div>
        </Link>

        <Link href="/quiz" className="card p-6 hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                <HelpCircle size={24} className="text-purple-600" />
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">Quiz starten</h3>
              <p className="text-sm text-neutral-500">{quizzes.length} Quizze verfügbar</p>
            </div>
            <ChevronRight size={20} className="text-neutral-400 group-hover:text-purple-600 transition-colors" />
          </div>
        </Link>

        <Link href="/theorie" className="card p-6 hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <BookOpen size={24} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">Theorie lesen</h3>
              <p className="text-sm text-neutral-500">Wissen nachlesen & vertiefen</p>
            </div>
            <ChevronRight size={20} className="text-neutral-400 group-hover:text-green-600 transition-colors" />
          </div>
        </Link>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Aktive Lernziele</h2>
            <Link href="/fortschritt" className="text-sm text-primary-600 hover:text-primary-700">Alle anzeigen</Link>
          </div>
          <div className="space-y-3">
            {activeGoals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-neutral-900 dark:text-white">{goal.title}</h3>
                  <span className="text-sm font-medium text-primary-600">{goal.progress}%</span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-700 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
                </div>
                {goal.targetDate && (
                  <p className="text-xs text-neutral-400 mt-2">
                    Ziel bis: {new Date(goal.targetDate).toLocaleDateString('de-DE')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
