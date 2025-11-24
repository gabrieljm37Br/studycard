export interface SrsState {
  interval: number;
  repetition: number;
  easeFactor: number;
  nextReview: string;
}

export interface SrsInput {
  interval?: number;
  repetition?: number;
  ease_factor?: number;
}

/**
 * Apply SM-2 spaced repetition algorithm.
 * @param current existing spaced repetition fields for the card
 * @param quality integer from 0 to 5 (see quality mapping in Study.tsx)
 * @param now reference date (defaults to current date)
 */
export function applySm2(current: SrsInput, quality: number, now: Date = new Date()): SrsState {
  const prevInterval = current.interval ?? 0;
  const prevRepetition = current.repetition ?? 0;
  const prevEase = current.ease_factor ?? 2.5;

  // Calculate new ease factor
  let ease = prevEase + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  ease = Math.max(1.3, ease); // SM-2 minimum

  let repetition = prevRepetition;
  let interval: number;

  if (quality < 3) {
    // Fail: reset repetition, short interval so it shows up again
    repetition = 0;
    interval = 1;
  } else {
    repetition += 1;
    if (repetition === 1) {
      interval = 1;
    } else if (repetition === 2) {
      interval = 6;
    } else {
      interval = Math.round(prevInterval * ease);
    }
  }

  const next = new Date(now);
  next.setDate(next.getDate() + interval);

  return {
    interval,
    repetition,
    easeFactor: ease,
    nextReview: next.toISOString(),
  };
}
