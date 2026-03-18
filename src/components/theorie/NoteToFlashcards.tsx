'use client';

import { useState } from 'react';
import { Sparkles, Layers, Loader2, X, Check, Zap, Settings2 } from 'lucide-react';
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
  const [mode, setMode] = useState<'smart' | 'manual'>('smart');
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [generated, setGenerated] = useState<Array<{ front: string; back: string }>>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const textContent = extractTextFromContent(noteContent);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setReasoning('');
    try {
      const aiConfig = getAIConfig();
      const isSmartMode = mode === 'smart';
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: isSmartMode ? 'smart-flashcards' : 'flashcards',
          topic: noteTitle,
          content: textContent,
          count: isSmartMode ? undefined : count,
          difficulty: isSmartMode ? undefined : difficulty,
          provider: aiConfig.provider,
          apiKey: aiConfig.apiKey,
          model: aiConfig.model,
          language: 'de',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'KI-Generierung fehlgeschlagen');
      }
      const data = await res.json();
      if (data.flashcards) {
        setGenerated(data.flashcards);
        setSelected(new Set(data.flashcards.map((_: any, i: number) => i)));
        if (data.reasoning) setReasoning(data.reasoning);
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

  const selectAll = () => setSelected(new Set(generated.map((_, i) => i)));
  const selectNone = () => setSelected(new Set());

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

        {generated.length === 0 ? (
          <>
            <p className="text-sm text-neutral-500">
              &quot;{noteTitle}&quot; — {textContent.length} Zeichen
            </p>

            {/* Mode selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('smart')}
                className={`p-4 rounded-xl border-2 text-left transition-colors ${
                  mode === 'smart'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={18} className="text-primary-600" />
                  <span className="font-semibold text-sm text-neutral-900 dark:text-white">KI entscheidet</span>
                </div>
                <p className="text-xs text-neutral-500">
                  Die KI liest die Notiz und entscheidet selbst welche und wie viele Karten sinnvoll sind.
                </p>
              </button>
              <button
                onClick={() => setMode('manual')}
                className={`p-4 rounded-xl border-2 text-left transition-colors ${
                  mode === 'manual'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Settings2 size={18} className="text-neutral-600 dark:text-neutral-400" />
                  <span className="font-semibold text-sm text-neutral-900 dark:text-white">Manuell</span>
                </div>
                <p className="text-xs text-neutral-500">
                  Du bestimmst Anzahl und Schwierigkeit der Karteikarten.
                </p>
              </button>
            </div>

            {/* Manual options */}
            {mode === 'manual' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Anzahl</label>
                  <select className="input" value={count} onChange={(e) => setCount(Number(e.target.value))}>
                    {[5, 10, 15, 20, 30].map((n) => (
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
            )}

            {/* Smart mode info */}
            {mode === 'smart' && (
              <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800">
                <p className="text-sm text-primary-700 dark:text-primary-300">
                  Die KI analysiert deine Notiz, identifiziert alle wichtigen Konzepte und erstellt für jedes eine passende Karteikarte. Du kannst danach einzelne Karten entfernen oder bearbeiten.
                </p>
              </div>
            )}

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
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                {loading
                  ? mode === 'smart' ? 'Analysiere Notiz...' : 'Generiere...'
                  : mode === 'smart' ? 'Notiz analysieren' : 'Generieren'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Results header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  {generated.length} Karten erstellt
                </p>
                {reasoning && (
                  <p className="text-xs text-neutral-500 mt-1">{reasoning}</p>
                )}
              </div>
              <div className="flex gap-2 text-xs">
                <button onClick={selectAll} className="text-primary-600 hover:text-primary-700">Alle</button>
                <span className="text-neutral-300">|</span>
                <button onClick={selectNone} className="text-neutral-500 hover:text-neutral-700">Keine</button>
              </div>
            </div>

            {/* Card list */}
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

            {/* Actions */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500">
                {selected.size} von {generated.length} ausgewählt
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setGenerated([]); setReasoning(''); }}
                  className="btn-secondary"
                >
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
