import { describe, it, expect } from 'vitest';
import { applySm2 } from '../services/srsAlgorithm';

describe('srsAlgorithm (SM-2)', () => {
  const refDate = new Date('2026-01-01T12:00:00.000Z');

  it('deve inicializar card novo com intervalo 1 e repetição 1 em caso de acerto (quality=5)', () => {
    const res = applySm2({}, 5, refDate);
    expect(res.interval).toBe(1);
    expect(res.repetition).toBe(1);
    expect(res.easeFactor).toBeCloseTo(2.6);
    expect(new Date(res.nextReview).getDate()).toBe(2);
  });

  it('deve aumentar intervalo para 6 na segunda repetição bem-sucedida (repetition=1, quality=4)', () => {
    const res = applySm2({ interval: 1, repetition: 1, ease_factor: 2.5 }, 4, refDate);
    expect(res.interval).toBe(6);
    expect(res.repetition).toBe(2);
    expect(res.easeFactor).toBe(2.5);
    expect(new Date(res.nextReview).getDate()).toBe(7);
  });

  it('deve multiplicar intervalo por easeFactor a partir da terceira repetição', () => {
    const res = applySm2({ interval: 6, repetition: 2, ease_factor: 2.5 }, 5, refDate);
    expect(res.repetition).toBe(3);
    expect(res.interval).toBe(Math.round(6 * 2.6)); // 16
  });

  it('deve resetar repetição para 0 e intervalo para 1 quando erra (quality < 3)', () => {
    const res = applySm2({ interval: 20, repetition: 5, ease_factor: 2.5 }, 1, refDate);
    expect(res.repetition).toBe(0);
    expect(res.interval).toBe(1);
    expect(res.easeFactor).toBeLessThan(2.5);
    expect(new Date(res.nextReview).getDate()).toBe(2);
  });

  it('nunca deve permitir easeFactor menor que 1.3', () => {
    let state = { interval: 1, repetition: 0, ease_factor: 1.4 };
    const res = applySm2(state, 0, refDate);
    expect(res.easeFactor).toBe(1.3);
  });
});
