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
  Cell,
  LineChart,
  Line
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  fetchOverview,
  fetchHeatmap,
  fetchCardMaturity,
  fetchReviewForecast,
  fetchWeakestDecks,
  OverviewStats,
  StudyHeatmapPoint,
  CardMaturitySlice,
  ReviewForecastPoint,
  WeakDeckRow,
} from '../services/statsService';

const MATURITY_COLORS: Record<CardMaturitySlice['status'], string> = {
  Novos: '#ef4444',
  Aprendendo: '#f97316',
  Jovens: '#22c55e',
  Maduros: '#10b981',
};

const intensityClass = (count: number) => {
  if (count === 0) return 'bg-gray-200 dark:bg-gray-700';
  if (count < 2) return 'bg-emerald-100 dark:bg-emerald-900/40';
  if (count < 5) return 'bg-emerald-300 dark:bg-emerald-700/60';
  if (count < 10) return 'bg-emerald-500 dark:bg-emerald-600';
  return 'bg-emerald-700 dark:bg-emerald-400';
};

const Statistics: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [heatmap, setHeatmap] = useState<StudyHeatmapPoint[]>([]);
  const [maturity, setMaturity] = useState<CardMaturitySlice[]>([]);
  const [forecast, setForecast] = useState<ReviewForecastPoint[]>([]);
  const [weakDecks, setWeakDecks] = useState<WeakDeckRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const [ov, hm, mat, fc, wd] = await Promise.all([
          fetchOverview(user.id),
          fetchHeatmap(user.id),
          fetchCardMaturity(user.id),
          fetchReviewForecast(user.id),
          fetchWeakestDecks(user.id),
        ]);
        setOverview(ov);
        setHeatmap(hm);
        setMaturity(mat);
        setForecast(fc);
        setWeakDecks(wd);
      } catch (err: any) {
        console.error(err);
        setError('Não foi possível carregar estatísticas.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const heatmapMap = useMemo(() => {
    const map: Record<string, number> = {};
    heatmap.forEach(h => {
      map[h.date] = h.count;
    });
    return map;
  }, [heatmap]);

  const heatmapDays = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({ date: dateStr, count: heatmapMap[dateStr] || 0 });
    }
    return days;
  }, [heatmapMap]);

  const aiInsight = useMemo(() => {
    const retention = overview?.retention ?? 0;
    if (retention < 70) {
      return 'Retenção baixa. Sugiro revisar o material base e diminuir a carga diária.';
    }
    if (retention > 95) {
      return 'Retenção alta. Considere aumentar a dificuldade ou adicionar novos tópicos.';
    }
    return 'Continue revisando no ritmo atual e monitore os decks mais fracos.';
  }, [overview]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Estatísticas e Desempenho</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Acompanhe retenção, carga de revisão e decks que precisam de atenção.</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Voltar
          </button>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-800">{error}</div>}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Streak Atual', value: overview?.streak ?? '-', icon: '🔥' },
            { label: 'Total de Cards Estudados', value: overview?.totalStudied ?? '-', icon: '📚' },
            { label: 'Retenção Global', value: overview ? `${overview.retention}%` : '-', icon: '🎯' },
          ].map(card => (
            <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
              <div className="text-2xl">{card.icon}</div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{card.label}</div>
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{loading ? '...' : card.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Carga de Revisão (Próx. 7 dias)</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={forecast}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Qualidade da Memória</h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={maturity} dataKey="count" nameKey="status" innerRadius={50} outerRadius={80} label>
                    {maturity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={MATURITY_COLORS[entry.status]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Weakest Decks & AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Decks que precisam de atenção</h3>
            {weakDecks.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum deck crítico no momento.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400">
                      <th className="py-2">Deck</th>
                      <th className="py-2">Acertos</th>
                      <th className="py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weakDecks.map(deck => (
                      <tr key={deck.deck_id} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="py-2 text-gray-800 dark:text-gray-100">{deck.deck_name}</td>
                        <td className="py-2 text-red-600 dark:text-red-300">{Math.round(deck.accuracy)}%</td>
                        <td className="py-2 text-gray-600 dark:text-gray-300">{deck.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800 shadow-sm">
            <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-200 mb-2">Dica da IA (simulado)</h3>
            <p className="text-indigo-700 dark:text-indigo-100 text-sm">{aiInsight}</p>
            {overview && (
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={[{ name: 'Retenção', value: overview.retention }]}>
                    <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} />
                    <XAxis dataKey="name" hide />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Heatmap - Moved to bottom with horizontal layout */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Atividade (últimos 365 dias)</h3>
          <div className="overflow-x-auto flex items-center justify-center">
            <div className="flex gap-1 min-w-max py-2">
              {Array.from({ length: 53 }).map((_, col) => (
                <div key={col} className="flex flex-col gap-1">
                  {Array.from({ length: 7 }).map((_, row) => {
                    const dayIndex = col * 7 + row;
                    const day = heatmapDays[dayIndex];
                    if (!day) return null;
                    return (
                      <div
                        key={day.date}
                        className={`w-3 h-3 rounded ${intensityClass(day.count)}`}
                        title={`${day.date}: ${day.count} revisões`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
