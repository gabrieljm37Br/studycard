import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePomodoroTimer } from '../hooks/usePomodoroTimer';

describe('usePomodoroTimer Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  it('deve inicializar pausado com 25 minutos restantes por padrão', () => {
    const { result } = renderHook(() => usePomodoroTimer());

    expect(result.current.status).toBe('paused');
    expect(result.current.remainingMs).toBe(25 * 60 * 1000);
    expect(result.current.formattedTime).toBe('25:00');
  });

  it('deve iniciar contagem regressiva ao chamar start()', () => {
    const { result } = renderHook(() => usePomodoroTimer());

    act(() => {
      result.current.start();
    });

    expect(result.current.status).toBe('running');

    act(() => {
      vi.advanceTimersByTime(60 * 1000); // 1 minuto
    });

    expect(result.current.remainingMs).toBeLessThanOrEqual(24 * 60 * 1000);
    expect(result.current.formattedTime).toBe('24:00');
  });

  it('deve pausar o timer e manter o tempo restante', () => {
    const { result } = renderHook(() => usePomodoroTimer());

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(2 * 60 * 1000); // 2 minutos
    });

    act(() => {
      result.current.pause();
    });

    expect(result.current.status).toBe('paused');
    const pausedRemaining = result.current.remainingMs;

    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000); // Avança com timer pausado
    });

    expect(result.current.remainingMs).toBe(pausedRemaining);
  });

  it('deve marcar como finished quando o tempo expirar (0ms)', () => {
    const { result } = renderHook(() => usePomodoroTimer());

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(26 * 60 * 1000); // Mais que 25 min
    });

    expect(result.current.status).toBe('finished');
    expect(result.current.remainingMs).toBe(0);
    expect(result.current.formattedTime).toBe('00:00');
  });

  it('deve resetar para os 25 minutos padrão ao chamar reset()', () => {
    const { result } = renderHook(() => usePomodoroTimer());

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(10 * 60 * 1000);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('paused');
    expect(result.current.remainingMs).toBe(25 * 60 * 1000);
    expect(result.current.formattedTime).toBe('25:00');
  });
});
