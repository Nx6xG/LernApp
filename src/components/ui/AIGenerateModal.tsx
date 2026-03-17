'use client';

import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';

interface Props {
  type: 'flashcards' | 'quiz' | 'summary';
  onGenerate: (data: any) => void;
  onClose: () => void;
}

export function AIGenerateModal({ type, onGenerate, onClose }: Props) {
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, topic, content, count, difficulty, language: 'de' }),
      });

      if (!res.ok) throw new Error('KI-Generierung fehlgeschlagen');

      const data = await res.json();
      if (type === 'flashcards') {
        onGenerate(data.flashcards);
      } else if (type === 'quiz') {
        onGenerate(data.questions);
      } else {
        onGenerate(data.summary);
      }
    } catch (err: any) {
      setError(err.message || 'Fehler bei der Generierung');
    } finally {
      setLoading(false);
    }
  };

  const typeLabels = {
    flashcards: 'Karteikarten',
    quiz: 'Quizfragen',
    summary: 'Zusammenfassung',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="card p-6 w-full max-w-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-primary-600" />
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {typeLabels[type]} mit KI generieren
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div>
          <label className="label">Thema</label>
          <input
            className="input"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="z.B. Photosynthese, Zweiter Weltkrieg, Python Grundlagen..."
          />
        </div>

        <div>
          <label className="label">Zusätzlicher Kontext (optional)</label>
          <textarea
            className="input min-h-[80px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Füge eigenen Text hinzu, aus dem die KI Inhalte generieren soll..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {type !== 'summary' && (
            <div>
              <label className="label">Anzahl</label>
              <select
                className="input"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              >
                {[3, 5, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Schwierigkeit</label>
            <select
              className="input"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
            >
              <option value="easy">Einfach</option>
              <option value="medium">Mittel</option>
              <option value="hard">Schwer</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary">
            Abbrechen
          </button>
          <button
            onClick={handleGenerate}
            className="btn-primary flex items-center gap-2"
            disabled={loading || !topic.trim()}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generiere...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generieren
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
