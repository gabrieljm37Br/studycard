import { useCallback, useEffect, useState } from 'react';

type PomodoroStatus = 'running' | 'paused' | 'finished';

type PomodoroState = {
    remainingMs: number;
    status: PomodoroStatus;
    lastStart: number | null;
};

const STORAGE_KEY = 'study_timer_pomodoro_v1';
const DEFAULT_DURATION_MS = 25 * 60 * 1000;
const TICK_MS = 500;

const loadState = (): PomodoroState => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as PomodoroState;
            return {
                remainingMs: typeof parsed.remainingMs === 'number' ? parsed.remainingMs : DEFAULT_DURATION_MS,
                status: parsed.status === 'running' || parsed.status === 'paused' || parsed.status === 'finished' ? parsed.status : 'paused',
                lastStart: typeof parsed.lastStart === 'number' ? parsed.lastStart : null,
            };
        }
    } catch {
        // ignore and fall back
    }
    return { remainingMs: DEFAULT_DURATION_MS, status: 'paused', lastStart: null };
};

const persistState = (state: PomodoroState) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // ignore write errors
    }
};

const formatTime = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const usePomodoroTimer = () => {
    const [state, setState] = useState<PomodoroState>(() => loadState());

    const tick = useCallback(() => {
        setState(prev => {
            if (prev.status !== 'running' || prev.lastStart === null) return prev;
            const elapsed = Date.now() - prev.lastStart;
            const remaining = prev.remainingMs - elapsed;
            if (remaining <= 0) {
                return { remainingMs: 0, status: 'finished', lastStart: null };
            }
            return { remainingMs: remaining, status: 'running', lastStart: Date.now() };
        });
    }, []);

    useEffect(() => {
        persistState(state);
    }, [state]);

    useEffect(() => {
        if (state.status !== 'running' || state.lastStart === null) return;
        const id = setInterval(tick, TICK_MS);
        return () => clearInterval(id);
    }, [state.status, state.lastStart, tick]);

    const start = useCallback(() => {
        setState(prev => {
            if (prev.status === 'finished') {
                return { remainingMs: DEFAULT_DURATION_MS, status: 'running', lastStart: Date.now() };
            }
            if (prev.status === 'running') return prev;
            return { ...prev, status: 'running', lastStart: Date.now() };
        });
    }, []);

    const pause = useCallback(() => {
        setState(prev => {
            if (prev.status !== 'running' || prev.lastStart === null) return prev;
            const elapsed = Date.now() - prev.lastStart;
            return { remainingMs: Math.max(prev.remainingMs - elapsed, 0), status: prev.remainingMs - elapsed <= 0 ? 'finished' : 'paused', lastStart: null };
        });
    }, []);

    const reset = useCallback(() => {
        setState({ remainingMs: DEFAULT_DURATION_MS, status: 'paused', lastStart: null });
    }, []);

    const remainingMs = state.status === 'running' && state.lastStart
        ? Math.max(0, state.remainingMs - (Date.now() - state.lastStart))
        : Math.max(0, state.remainingMs);

    return {
        remainingMs,
        formattedTime: formatTime(remainingMs),
        status: state.status,
        start,
        pause,
        reset,
    };
};

export type { PomodoroStatus };
