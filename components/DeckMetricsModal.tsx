import React, { useEffect, useMemo, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { X, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import { FlashcardData, FeedbackStatus } from '../types';
import { fetchDeckRecursiveMetrics } from '../services/statsService';

interface DeckMetricsModalProps {
    isOpen: boolean;
    onClose: () => void;
    deckName: string;
    deckId: string;
}

interface WeeklyDataPoint {
    day: string;
    count: number;
    fullDate: string;
}

const COLORS = {
    Novos: '#94a3b8', // Slate 400
    Aprendendo: '#facc15', // Yellow 400
    Revisando: '#22c55e', // Green 500
    Almost: '#f97316', // Orange 500
};

export const DeckMetricsModal: React.FC<DeckMetricsModalProps> = ({
    isOpen,
    onClose,
    deckName,
    deckId,
}) => {
    const [weeklyData, setWeeklyData] = useState<WeeklyDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        studied: 0,
        unseen: 0,
        historicalAccuracy: 0,
        totalReviews: 0,
        distribution: [] as { name: string; value: number; color: string }[]
    });

    useEffect(() => {
        if (!isOpen) return;

        const loadMetrics = async () => {
            setLoading(true);
            try {
                const data = await fetchDeckRecursiveMetrics(deckId);

                // Process distribution for Pie Chart
                const distribution = [
                    { name: 'Novos', value: data.counts.unseen, color: COLORS.Novos },
                    { name: 'Aprendendo', value: data.counts.learning, color: COLORS.Aprendendo },
                    { name: 'Quase', value: data.counts.almost, color: COLORS.Almost },
                    { name: 'Revisando', value: data.counts.reviewing, color: COLORS.Revisando },
                ].filter(d => d.value > 0);

                // Process Weekly Study History for Bar Chart
                const today = new Date();
                const last7DaysMap = new Map<string, number>();

                // Initialize last 7 days with 0
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(today.getDate() - i);
                    const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    last7DaysMap.set(key, 0);
                }

                // Fill with actual data
                data.study_history.forEach(item => {
                    // Since date comes as YYYY-MM-DD from SQL
                    const [year, month, day] = item.date.split('-').map(Number);
                    const itemDate = new Date(year, month - 1, day);
                    const key = itemDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

                    if (last7DaysMap.has(key)) {
                        last7DaysMap.set(key, item.count);
                    }
                });

                const chartData = Array.from(last7DaysMap.entries()).map(([day, count]) => ({
                    day,
                    count,
                    fullDate: day
                }));

                setWeeklyData(chartData);

                // Calculate historical accuracy from aggregate totals
                const accuracy = data.total_reviews > 0
                    ? Math.round((data.total_correct / data.total_reviews) * 100)
                    : 0;

                setStats({
                    total: data.total_cards,
                    studied: data.total_cards - data.counts.unseen,
                    unseen: data.counts.unseen,
                    historicalAccuracy: accuracy,
                    totalReviews: data.total_reviews,
                    distribution
                });
            } catch (error) {
                console.error('Error loading recursive metrics:', error);
            } finally {
                setLoading(false);
            }
        };

        loadMetrics();
    }, [isOpen, deckId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            Meus Resultados
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            Análise detalhada do deck <span className="font-semibold text-cyan-600 dark:text-cyan-400">{deckName}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar">

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-300">
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">Progresso do Deck</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {loading ? '-' : stats.studied}<span className="text-sm text-slate-400 font-normal">/{loading ? '-' : stats.total}</span>
                                    </h3>
                                    {!loading && (
                                        <span className="text-xs text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                                            {stats.total > 0 ? Math.round((stats.studied / stats.total) * 100) : 0}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-300">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-emerald-600 dark:text-emerald-300 font-medium">Acurácia Histórica</p>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {loading ? '-' : `${stats.historicalAccuracy}%`}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Baseado em {loading ? '-' : stats.totalReviews} revisões
                                </p>
                            </div>
                        </div>

                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-center gap-4">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-800 rounded-lg text-indigo-600 dark:text-indigo-300">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-indigo-600 dark:text-indigo-300 font-medium">Para Estudar</p>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {loading ? '-' : stats.unseen}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Flashcards novos
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Weekly Study Chart */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center justify-between">
                                Atividade Recente
                                <span className="text-xs font-normal text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">Últimos 7 dias</span>
                            </h3>
                            <div className="h-64 w-full">
                                {loading ? (
                                    <div className="h-full flex items-center justify-center text-slate-400">
                                        Carregando dados...
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                            <XAxis
                                                dataKey="day"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 12 }}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            />
                                            <Bar
                                                dataKey="count"
                                                fill="#0891b2"
                                                radius={[4, 4, 0, 0]}
                                                barSize={32}
                                                name="Cards Estudados"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Status Distribution Chart */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">
                                Distribuição do Deck
                            </h3>
                            <div className="h-64 w-full flex items-center justify-center">
                                {loading ? (
                                    <div className="text-slate-400">Carregando...</div>
                                ) : stats.distribution.length === 0 ? (
                                    <div className="text-center text-slate-400">
                                        Nenhum dado disponível
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats.distribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {stats.distribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                            {/* Legend */}
                            <div className="flex flex-wrap gap-4 justify-center mt-4">
                                {loading ? null : stats.distribution.map((item) => (
                                    <div key={item.name} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-sm text-slate-600 dark:text-slate-300">
                                            {item.name} ({item.value})
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-200 text-slate-800 font-medium rounded-lg hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
