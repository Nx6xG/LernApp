'use client';

import { useEffect, useState } from 'react';
import { useWorkspaceContext } from '@/hooks/useWorkspaceContext';
import { useAppStore } from '@/stores/app-store';
import { Plus, Target, CheckCircle2, Circle, Clock, TrendingUp, Flame } from 'lucide-react';
import type { LearningGoal, Milestone } from '@/types';

export default function FortschrittPage() {
  const { uid, profile, workspaceId } = useWorkspaceContext();
  const { learningGoals, studySessions, loadLearningGoals, loadStudySessions, addLearningGoal, editLearningGoal } =
    useAppStore();

  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState('');
  const [milestones, setMilestones] = useState<string[]>(['']);

  useEffect(() => {
    if (workspaceId) {
      loadLearningGoals(workspaceId);
      loadStudySessions(workspaceId);
    }
  }, [workspaceId]);

  const handleCreateGoal = async () => {
    if (!uid || !workspaceId || !newTitle.trim()) return;
    const ms: Milestone[] = milestones
      .filter(Boolean)
      .map((title, i) => ({ id: `${Date.now()}-${i}`, title, completed: false }));

    await addLearningGoal({
      workspaceId,
      userId: uid,
      title: newTitle,
      description: newDesc,
      targetDate: newDate || undefined,
      milestones: ms,
      progress: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setNewTitle('');
    setNewDesc('');
    setNewDate('');
    setMilestones(['']);
    setShowNew(false);
  };

  const toggleMilestone = async (goalId: string, milestoneId: string) => {
    const goal = learningGoals.find((g) => g.id === goalId);
    if (!goal) return;
    const updated = goal.milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : undefined } : m
    );
    const completedCount = updated.filter((m) => m.completed).length;
    const progress = updated.length > 0 ? Math.round((completedCount / updated.length) * 100) : 0;
    const status = progress === 100 ? 'completed' : goal.status;
    await editLearningGoal(goalId, { milestones: updated, progress, status, updatedAt: new Date().toISOString() });
  };

  // Stats
  const last7Days = studySessions.filter(
    (s) => new Date(s.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  const totalMinutes7d = last7Days.reduce((acc, s) => acc + s.duration, 0);
  const totalCards7d = last7Days.reduce((acc, s) => acc + (s.cardsStudied || 0), 0);

  const activeGoals = learningGoals.filter((g) => g.status === 'active');
  const completedGoals = learningGoals.filter((g) => g.status === 'completed');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Fortschritt</h1>
        <p className="text-neutral-500 mt-1">Deine Lernziele und Statistiken</p>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <Clock size={18} className="text-primary-600" />
            <span className="text-sm text-neutral-500">Letzte 7 Tage</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{totalMinutes7d} Min.</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={18} className="text-green-600" />
            <span className="text-sm text-neutral-500">Karten gelernt</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{totalCards7d}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <Flame size={18} className="text-orange-500" />
            <span className="text-sm text-neutral-500">Streak</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{profile?.streak || 0} Tage</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <Target size={18} className="text-purple-600" />
            <span className="text-sm text-neutral-500">Ziele erreicht</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{completedGoals.length}</p>
        </div>
      </div>

      {/* Learning Goals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Lernziele</h2>
          <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={14} />
            Neues Ziel
          </button>
        </div>

        {showNew && (
          <div className="card p-6 space-y-4 mb-4">
            <h3 className="font-semibold text-neutral-900 dark:text-white">Neues Lernziel</h3>
            <div>
              <label className="label">Titel</label>
              <input className="input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="z.B. Mathe-Klausur bestehen" />
            </div>
            <div>
              <label className="label">Beschreibung (optional)</label>
              <textarea className="input" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Details zum Ziel..." />
            </div>
            <div>
              <label className="label">Zieldatum (optional)</label>
              <input type="date" className="input" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </div>
            <div>
              <label className="label">Meilensteine</label>
              {milestones.map((ms, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <input
                    className="input flex-1"
                    value={ms}
                    onChange={(e) => {
                      const updated = [...milestones];
                      updated[i] = e.target.value;
                      setMilestones(updated);
                    }}
                    placeholder={`Meilenstein ${i + 1}`}
                  />
                  {i === milestones.length - 1 && (
                    <button
                      onClick={() => setMilestones([...milestones, ''])}
                      className="text-primary-600 text-sm whitespace-nowrap"
                    >
                      + Mehr
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreateGoal} className="btn-primary">Erstellen</button>
              <button onClick={() => setShowNew(false)} className="btn-secondary">Abbrechen</button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {activeGoals.map((goal) => (
            <div key={goal.id} className="card p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">{goal.title}</h3>
                  {goal.description && <p className="text-sm text-neutral-500 mt-1">{goal.description}</p>}
                </div>
                <span className="text-sm font-medium text-primary-600">{goal.progress}%</span>
              </div>
              <div className="w-full bg-neutral-100 dark:bg-neutral-700 rounded-full h-2.5 mb-4">
                <div
                  className="bg-primary-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              {goal.milestones.length > 0 && (
                <div className="space-y-2">
                  {goal.milestones.map((ms) => (
                    <button
                      key={ms.id}
                      onClick={() => toggleMilestone(goal.id, ms.id)}
                      className="flex items-center gap-3 w-full text-left py-1 group"
                    >
                      {ms.completed ? (
                        <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle size={18} className="text-neutral-300 group-hover:text-primary-400 flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          ms.completed ? 'line-through text-neutral-400' : 'text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {ms.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {goal.targetDate && (
                <p className="text-xs text-neutral-400 mt-3">
                  Ziel bis: {new Date(goal.targetDate).toLocaleDateString('de-DE')}
                </p>
              )}
            </div>
          ))}
        </div>

        {completedGoals.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-neutral-500 mb-3">Erreichte Ziele</h3>
            <div className="space-y-2">
              {completedGoals.map((goal) => (
                <div key={goal.id} className="card p-4 opacity-70">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{goal.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {learningGoals.length === 0 && !showNew && (
          <div className="text-center py-12">
            <Target size={32} className="text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500 mb-3">Setze dir Lernziele, um deinen Fortschritt zu verfolgen.</p>
            <button onClick={() => setShowNew(true)} className="btn-primary text-sm">
              Erstes Ziel setzen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
