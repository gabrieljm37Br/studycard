import React, { useEffect, useMemo, useState } from 'react';
import { usePomodoroTimer } from '../hooks/usePomodoroTimer';
import { useStopwatch } from '../hooks/useStopwatch';

const VISIBILITY_KEY = 'study_timer_bar_visible_v1';

const formatLabel = (pomodoro: { formattedTime: string; status: string }, stopwatch: { formattedTime: string; status: string }) => {
    if (pomodoro.status === 'running') return `🍅 ${pomodoro.formattedTime}`;
    if (stopwatch.status === 'running') return `⏱ ${stopwatch.formattedTime}`;
    return `⏱ ${stopwatch.formattedTime || '00:00'}`;
};

const StudyTimerBar: React.FC = () => {
    const pomodoro = usePomodoroTimer();
    const stopwatch = useStopwatch();
    const [visible, setVisible] = useState<boolean>(() => {
        try {
            const saved = localStorage.getItem(VISIBILITY_KEY);
            return saved ? JSON.parse(saved) : true;
        } catch {
            return true;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(VISIBILITY_KEY, JSON.stringify(visible));
        } catch {
            // ignore
        }
    }, [visible]);

    const badgeLabel = useMemo(() => formatLabel(pomodoro, stopwatch), [pomodoro, stopwatch]);

    if (!visible) {
        return (
            <button
                onClick={() => setVisible(true)}
                className="fixed top-4 right-4 z-50 px-3 py-2 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
                title="Mostrar timers"
            >
                {badgeLabel}
            </button>
        );
    }

    return (
        <div className="fixed top-4 right-4 z-50">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-4 py-3 flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-200">Pomodoro</div>
                    <div className={`text-lg font-bold ${pomodoro.status === 'finished' ? 'text-red-600' : 'text-indigo-700 dark:text-indigo-300'}`}>
                        {pomodoro.formattedTime}
                    </div>
                    <div className="flex items-center gap-2">
                        {pomodoro.status === 'running' ? (
                            <button
                                onClick={pomodoro.pause}
                                className="px-2 py-1 text-xs font-semibold rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-200"
                            >
                                Pausar
                            </button>
                        ) : (
                            <button
                                onClick={pomodoro.start}
                                className="px-2 py-1 text-xs font-semibold rounded bg-indigo-600 text-white hover:bg-indigo-700"
                            >
                                Iniciar
                            </button>
                        )}
                        <button
                            onClick={pomodoro.reset}
                            className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                        >
                            Resetar
                        </button>
                    </div>
                </div>

                <div className="h-10 w-px bg-gray-200 dark:bg-gray-700" />

                <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-200">Cronômetro</div>
                    <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                        {stopwatch.formattedTime}
                    </div>
                    <div className="flex items-center gap-2">
                        {stopwatch.status === 'running' ? (
                            <button
                                onClick={stopwatch.pause}
                                className="px-2 py-1 text-xs font-semibold rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200"
                            >
                                Pausar
                            </button>
                        ) : (
                            <button
                                onClick={stopwatch.start}
                                className="px-2 py-1 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                                Iniciar
                            </button>
                        )}
                        <button
                            onClick={stopwatch.reset}
                            className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                        >
                            Resetar
                        </button>
                    </div>
                </div>

                <button
                    onClick={() => setVisible(false)}
                    className="ml-2 px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                >
                    Ocultar
                </button>
            </div>
        </div>
    );
};

export default StudyTimerBar;
