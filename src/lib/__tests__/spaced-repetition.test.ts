import { calculateSM2, isDue, difficultyToQuality } from '../spaced-repetition';

describe('SM-2 Spaced Repetition Algorithm', () => {
  it('should set interval to 1 day for first correct answer', () => {
    const result = calculateSM2(4, 2.5, 0, 0);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(1);
  });

  it('should set interval to 6 days for second correct answer', () => {
    const result = calculateSM2(4, 2.5, 1, 1);
    expect(result.interval).toBe(6);
    expect(result.repetitions).toBe(2);
  });

  it('should multiply interval by ease factor for subsequent reviews', () => {
    const result = calculateSM2(4, 2.5, 6, 2);
    expect(result.interval).toBe(15); // 6 * 2.5 = 15
    expect(result.repetitions).toBe(3);
  });

  it('should reset on incorrect answer (quality < 3)', () => {
    const result = calculateSM2(1, 2.5, 15, 3);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(0);
  });

  it('should never let ease factor drop below 1.3', () => {
    const result = calculateSM2(0, 1.3, 1, 0);
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('should increase ease factor for easy answers', () => {
    const result = calculateSM2(5, 2.5, 6, 2);
    expect(result.easeFactor).toBeGreaterThan(2.5);
  });

  it('should decrease ease factor for hard answers', () => {
    const result = calculateSM2(3, 2.5, 6, 2);
    expect(result.easeFactor).toBeLessThan(2.5);
  });
});

describe('isDue', () => {
  it('should return true for past dates', () => {
    expect(isDue('2020-01-01T00:00:00.000Z')).toBe(true);
  });

  it('should return false for future dates', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(isDue(future.toISOString())).toBe(false);
  });
});

describe('difficultyToQuality', () => {
  it('should map again to 1', () => {
    expect(difficultyToQuality('again')).toBe(1);
  });

  it('should map easy to 5', () => {
    expect(difficultyToQuality('easy')).toBe(5);
  });
});
