'use client';

import { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import type { Flashcard } from '@/types';
import { calculateSM2, difficultyToQuality } from '@/lib/spaced-repetition';
import { useAppStore } from '@/stores/app-store';

interface Props {
  cards: Flashcard[];
  deckName: string;
  onExit: () => void;
}

export function FlashcardStudy({ cards, deckName, onExit }: Props) {
  const editFlashcard = useAppStore((s) => s.editFlashcard);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [remaining, setRemaining] = useState([...cards]);

  const currentCard = remaining[0];

  if (!currentCard || remaining.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-20 h-20 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🎉</span>
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
          Geschafft!
        </h2>
        <p className="text-neutral-500 mb-6">
          Du hast {completed} Karten aus &quot;{deckName}&quot; wiederholt.
        </p>
        <button onClick={onExit} className="btn-primary">
          Zurück zum Stapel
        </button>
      </div>
    );
  }

  const handleRate = async (difficulty: 'again' | 'hard' | 'good' | 'easy') => {
    const quality = difficultyToQuality(difficulty);
    const result = calculateSM2(
      quality,
      currentCard.easeFactor,
      currentCard.interval,
      currentCard.repetitions
    );

    await editFlashcard(currentCard.id, {
      easeFactor: result.easeFactor,
      interval: result.interval,
      repetitions: result.repetitions,
      nextReview: result.nextReview,
      lastReview: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setCompleted((c) => c + 1);
    setIsFlipped(false);

    if (difficulty === 'again') {
      // Move to end of queue
      setRemaining((prev) => [...prev.slice(1), prev[0]]);
    } else {
      setRemaining((prev) => prev.slice(1));
    }
  };

  const progress = cards.length > 0 ? (completed / cards.length) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-neutral-900 dark:text-white">{deckName}</h2>
          <p className="text-sm text-neutral-500">
            {completed} von {cards.length} Karten &middot; {remaining.length} verbleibend
          </p>
        </div>
        <button onClick={onExit} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg">
          <X size={20} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-neutral-100 dark:bg-neutral-700 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Flashcard */}
      <div className="perspective">
        <div
          className={`flashcard-inner relative min-h-[300px] cursor-pointer ${isFlipped ? 'flipped' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front */}
          <div className="flashcard-front absolute inset-0 card p-8 flex flex-col items-center justify-center">
            <p className="text-xs uppercase tracking-wider text-neutral-400 mb-4">Frage</p>
            <p className="text-xl text-center text-neutral-900 dark:text-white font-medium">
              {currentCard.front}
            </p>
            <p className="text-sm text-neutral-400 mt-6">Tippe zum Umdrehen</p>
          </div>

          {/* Back */}
          <div className="flashcard-back absolute inset-0 card p-8 flex flex-col items-center justify-center bg-primary-50 dark:bg-primary-900/10">
            <p className="text-xs uppercase tracking-wider text-primary-500 mb-4">Antwort</p>
            <p className="text-xl text-center text-neutral-900 dark:text-white font-medium">
              {currentCard.back}
            </p>
          </div>
        </div>
      </div>

      {/* Rating buttons - only show when flipped */}
      {isFlipped && (
        <div className="grid grid-cols-4 gap-3 animate-fade-in">
          <button
            onClick={() => handleRate('again')}
            className="flex flex-col items-center gap-1 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <RotateCcw size={18} className="text-red-500" />
            <span className="text-sm font-medium text-red-600 dark:text-red-400">Nochmal</span>
            <span className="text-xs text-red-400">&lt;1 Min.</span>
          </button>
          <button
            onClick={() => handleRate('hard')}
            className="flex flex-col items-center gap-1 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
          >
            <span className="text-lg">😓</span>
            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">Schwer</span>
            <span className="text-xs text-orange-400">1 Tag</span>
          </button>
          <button
            onClick={() => handleRate('good')}
            className="flex flex-col items-center gap-1 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <span className="text-lg">😊</span>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">Gut</span>
            <span className="text-xs text-green-400">
              {currentCard.interval > 0 ? `${Math.round(currentCard.interval * currentCard.easeFactor)} Tage` : '6 Tage'}
            </span>
          </button>
          <button
            onClick={() => handleRate('easy')}
            className="flex flex-col items-center gap-1 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <span className="text-lg">🧠</span>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Einfach</span>
            <span className="text-xs text-blue-400">
              {currentCard.interval > 0 ? `${Math.round(currentCard.interval * currentCard.easeFactor * 1.3)} Tage` : '10 Tage'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
