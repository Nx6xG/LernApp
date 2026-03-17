/**
 * SM-2 Spaced Repetition Algorithm
 * Based on the SuperMemo SM-2 algorithm by Piotr Wozniak
 *
 * Quality ratings:
 * 0 - Complete blackout
 * 1 - Incorrect, but remembered upon seeing answer
 * 2 - Incorrect, but answer seemed easy to recall
 * 3 - Correct with serious difficulty
 * 4 - Correct with some hesitation
 * 5 - Perfect response
 */

export interface SM2Result {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
}

export function calculateSM2(
  quality: number, // 0-5
  previousEaseFactor: number,
  previousInterval: number,
  previousRepetitions: number
): SM2Result {
  // Clamp quality to valid range
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  let easeFactor = previousEaseFactor;
  let interval: number;
  let repetitions: number;

  if (q >= 3) {
    // Correct response
    repetitions = previousRepetitions + 1;

    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(previousInterval * easeFactor);
    }

    // Update ease factor
    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  } else {
    // Incorrect response - reset
    repetitions = 0;
    interval = 1;
  }

  // Ease factor minimum is 1.3
  easeFactor = Math.max(1.3, easeFactor);

  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    easeFactor,
    interval,
    repetitions,
    nextReview: nextReview.toISOString(),
  };
}

/**
 * Determines if a card is due for review
 */
export function isDue(nextReview: string): boolean {
  return new Date(nextReview) <= new Date();
}

/**
 * Maps a simple difficulty rating to SM-2 quality
 */
export function difficultyToQuality(difficulty: 'again' | 'hard' | 'good' | 'easy'): number {
  const mapping = { again: 1, hard: 3, good: 4, easy: 5 };
  return mapping[difficulty];
}
