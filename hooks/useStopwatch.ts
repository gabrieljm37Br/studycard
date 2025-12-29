import { useCallback, useEffect, useState } from 'react';

type StopwatchStatus = 'running' | 'paused';

type StopwatchState = {
    elapsedMs: number;
    status: StopwatchStatus;
    lastStart: number | null;
};

const STORAGE_KEY = 'study_timer_stopwatch_v1';
const TICK_MS = 500;

const loadState = (): StopwatchState => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as StopwatchState;
            return {
                elapsedMs: typeof parsed.elapsedMs === 'number' ? parsed.elapsedMs : 0,
                status: parsed.status === 'running' ? 'running' : 'paused',
                lastStart: typeof parsed.lastStart === 'number' ? parsed.lastStart : null,
            };
        }
    } catch {
        // ignore malformed storage
    }
    return { elapsedMs: 0, status: 'paused', lastStart: null };
};

const persistState = (state: StopwatchState) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // ignore write errors
    }
};

const formatTime = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const useStopwatch = () => {
    const [state, setState] = useState<StopwatchState>(() => loadState());

    const tick = useCallback(() => {
        setState(prev => {
            if (prev.status !== 'running' || prev.lastStart === null) return prev;
            const elapsed = Date.now() - prev.lastStart;
            return {
                elapsedMs: prev.elapsedMs + elapsed,
                status: 'running',
                lastStart: Date.now(),
            };
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
            if (prev.status === 'running') return prev;
            return { ...prev, status: 'running', lastStart: Date.now() };
        });
    }, []);

    const pause = useCallback(() => {
        setState(prev => {
            if (prev.status !== 'running' || prev.lastStart === null) return prev;
            const elapsed = Date.now() - prev.lastStart;
            return { elapsedMs: prev.elapsedMs + elapsed, status: 'paused', lastStart: null };
        });
    }, []);

    const reset = useCallback(() => {
        setState({ elapsedMs: 0, status: 'paused', lastStart: null });
    }, []);

    const elapsedMs = state.status === 'running' && state.lastStart
        ? state.elapsedMs + (Date.now() - state.lastStart)
        : state.elapsedMs;

    return {
        elapsedMs,
        formattedTime: formatTime(elapsedMs),
        status: state.status,
        start,
        pause,
        reset,
    };
};

export type { StopwatchStatus };
