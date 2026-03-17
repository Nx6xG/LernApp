'use client';

import { useState } from 'react';
import { Sparkles, Layers, Loader2, X, Check } from 'lucide-react';
import { getAIConfig } from '@/lib/ai-config';

interface Props {
  noteTitle: string;
  noteContent: string;
  onGenerate: (cards: Array<{ front: string; back: string }>) => Promise<void>;
  onClose: () => void;
}

function extractTextFromContent(content: string): string {
  try {
    const blocks = JSON.parse(content);
    if (Array.isArray(blocks)) {
      return blocks.map((block: any) => {
        if (typeof block.content === 'string') return block.content;
        if (Array.isArray(block.content)) {
          return block.content.map((c: any) => c.text || '').join('');
        }
        return '';
      }).filter(Boolean).join('\n');
    }
  } catch {}
  return content;
}

export function NoteToFlashcards({ noteTitle, noteContent, onGenerate, onClose }: Props) {
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState<Array<{ front: string; back: string }>>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const textContent = extractTextFromContent(noteContent);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const aiConfig = getAIConfig();
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'flashcards',
          topic: noteTitle,
          content: textContent,
          count,
          difficulty,
          provider: aiConfig.provider,
          apiKey: aiConfig.apiKey,
          model: aiConfig.model,
          language: 'de',
        }),
      });
      if (!res.ok) throw new Error('KI-Generierung fehlgeschlagen');
      const data = await res.json();
      if (data.flashcards) {
        setGenerated(data.flashcards);
        setSelected(new Set(data.flashcards.map((_: any, i: number) => i)));
      }
    } catch (err: any) {
      setError(err.message || 'Fehler');
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (i: number) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  };

  const handleAdd = async () => {
    const cards = generated.filter((_, i) => selected.has(i));
    if (cards.length === 0) return;
    setLoading(true);
    await onGenerate(cards);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="card p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Sparkles size={20} className="text-primary-600" />
            Notiz zu Karteikarten
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-neutral-500">
          Die KI erstellt Karteikarten aus &quot;{noteTitle}&quot;
          {textContent.length > 0 && ` (${textContent.length} Zeichen)`}.
        </p>

        {generated.length === 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Anzahl</label>
                <select className="input" value={count} onChange={(e) => setCount(Number(e.target.value))}>
                  {[5, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>{n} Karten</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Schwierigkeit</label>
                <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
                  <option value="easy">Einfach</option>
                  <option value="medium">Mittel</option>
                  <option value="hard">Schwer</option>
                </select>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="btn-secondary">Abbrechen</button>
              <button
                onClick={handleGenerate}
                className="btn-primary flex items-center gap-2"
                disabled={loading || textContent.length < 10}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {loading ? 'Generiere...' : 'Generieren'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              {generated.length} Karten generiert — wähle welche du hinzufügen möchtest:
            </p>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {generated.map((card, i) => (
                <button
                  key={i}
                  onClick={() => toggleCard(i)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-colors ${
                    selected.has(i)
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                      : 'border-neutral-200 dark:border-neutral-700 opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                      selected.has(i) ? 'bg-primary-600 border-primary-600' : 'border-neutral-300 dark:border-neutral-600'
                    }`}>
                      {selected.has(i) && <Check size={12} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">{card.front}</p>
                      <p className="text-xs text-neutral-500 mt-1">{card.back}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500">
                {selected.size} von {generated.length} ausgewählt
              </p>
              <div className="flex gap-2">
                <button onClick={() => setGenerated([])} className="btn-secondary">
                  Neu generieren
                </button>
                <button
                  onClick={handleAdd}
                  className="btn-primary flex items-center gap-2"
                  disabled={selected.size === 0 || loading}
                >
                  <Layers size={16} />
                  {selected.size} Karten hinzufügen
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
