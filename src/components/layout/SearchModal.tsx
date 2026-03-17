'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Layers, HelpCircle, BookOpen, Target } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { useRouter } from 'next/navigation';

interface SearchResult {
  type: 'deck' | 'quiz' | 'note' | 'goal';
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Layers;
  href: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { decks, quizzes, theoryNotes, learningGoals } = useAppStore();

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
        else onClose(); // toggle is handled by parent
      }
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const matches: SearchResult[] = [];

    for (const d of decks) {
      if (d.name.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q)) {
        matches.push({ type: 'deck', id: d.id, title: d.name, subtitle: `${d.cardCount || 0} Karten`, icon: Layers, href: '/karteikarten' });
      }
    }
    for (const quiz of quizzes) {
      if (quiz.title.toLowerCase().includes(q) || quiz.description?.toLowerCase().includes(q)) {
        matches.push({ type: 'quiz', id: quiz.id, title: quiz.title, subtitle: `${quiz.questions.length} Fragen`, icon: HelpCircle, href: '/quiz' });
      }
    }
    for (const note of theoryNotes) {
      const content = (() => {
        try {
          const blocks = JSON.parse(note.content);
          return blocks.map((b: any) => {
            if (typeof b.content === 'string') return b.content;
            if (Array.isArray(b.content)) return b.content.map((c: any) => c.text || '').join('');
            return '';
          }).join(' ');
        } catch {
          return note.content || '';
        }
      })();
      if (note.title.toLowerCase().includes(q) || content.toLowerCase().includes(q) || note.tags?.some((t) => t.toLowerCase().includes(q))) {
        matches.push({ type: 'note', id: note.id, title: note.title, subtitle: note.tags?.join(', ') || 'Notiz', icon: BookOpen, href: '/theorie' });
      }
    }
    for (const goal of learningGoals) {
      if (goal.title.toLowerCase().includes(q) || goal.description?.toLowerCase().includes(q)) {
        matches.push({ type: 'goal', id: goal.id, title: goal.title, subtitle: `${goal.progress}% abgeschlossen`, icon: Target, href: '/fortschritt' });
      }
    }

    return matches.slice(0, 10);
  }, [query, decks, quizzes, theoryNotes, learningGoals]);

  const handleSelect = (result: SearchResult) => {
    router.push(result.href);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-[15vh] px-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg card shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-neutral-200 dark:border-neutral-700">
          <Search size={18} className="text-neutral-400 flex-shrink-0" />
          <input
            ref={inputRef}
            className="flex-1 py-4 bg-transparent border-none outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suche nach Karten, Quizzen, Notizen..."
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {query.trim() && (
          <div className="max-h-80 overflow-y-auto p-2">
            {results.length === 0 ? (
              <div className="py-8 text-center text-neutral-400 text-sm">
                Keine Ergebnisse für &quot;{query}&quot;
              </div>
            ) : (
              results.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => handleSelect(r)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700/50 text-left transition-colors"
                  >
                    <Icon size={16} className="text-neutral-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                        {r.title}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">{r.subtitle}</p>
                    </div>
                    <span className="text-xs text-neutral-400 capitalize">{
                      { deck: 'Stapel', quiz: 'Quiz', note: 'Notiz', goal: 'Ziel' }[r.type]
                    }</span>
                  </button>
                );
              })
            )}
          </div>
        )}

        {!query.trim() && (
          <div className="p-4 text-center text-sm text-neutral-400">
            Tippe um zu suchen &middot; <kbd className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded text-xs">Ctrl+K</kbd>
          </div>
        )}
      </div>
    </div>
  );
}
