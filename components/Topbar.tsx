import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Gauge, Medal, Search, Sparkles, Trophy, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePageHeader } from '../contexts/PageHeaderContext';
import { fetchProfileOverview, fetchTodayStats, searchDecks, DeckSearchResult } from '../services/dashboardHeaderService';

type StatCardProps = {
    label: string;
    value: string;
    icon: React.ReactNode;
    helper?: string;
    accent?: string;
};

const StatCard: React.FC<StatCardProps> = ({ label, value, helper, icon, accent }) => (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/70 px-4 py-3 shadow-sm">
        <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${accent || 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200'}`}>
            {icon}
        </div>
        <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{value}</p>
            {helper && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{helper}</p>}
        </div>
    </div>
);

const Topbar: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { title, subtitle } = usePageHeader();

    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingToday, setLoadingToday] = useState(true);
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(1);
    const [streak, setStreak] = useState(0);
    const [badges, setBadges] = useState<{ id: string; name: string; icon: string }[]>([]);
    const [studiedToday, setStudiedToday] = useState(0);
    const [accuracyToday, setAccuracyToday] = useState(0);
    const [xpToday, setXpToday] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<DeckSearchResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        let isCancelled = false;

        const loadProfile = async () => {
            try {
                setLoadingProfile(true);
                const { profile, badges } = await fetchProfileOverview(user.id);
                if (isCancelled) return;
                setXp(profile.xp);
                setLevel(profile.level);
                setStreak(profile.streak);
                setBadges(badges);
            } catch (err) {
                console.error('Erro ao carregar perfil para o topo:', err);
            } finally {
                if (!isCancelled) setLoadingProfile(false);
            }
        };

        const loadToday = async () => {
            try {
                setLoadingToday(true);
                const stats = await fetchTodayStats(user.id);
                if (isCancelled) return;
                setStudiedToday(stats.studiedToday);
                setAccuracyToday(stats.accuracyToday);
                setXpToday(stats.xpToday);
            } catch (err) {
                console.error('Erro ao carregar estatísticas de hoje:', err);
            } finally {
                if (!isCancelled) setLoadingToday(false);
            }
        };

        loadProfile();
        loadToday();

        return () => {
            isCancelled = true;
        };
    }, [user]);

    useEffect(() => {
        if (!user) return;
        if (searchTerm.trim().length < 2) {
            setSearchResults([]);
            setSearchError(null);
            return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(async () => {
            try {
                setSearchLoading(true);
                setSearchError(null);
                const results = await searchDecks(searchTerm.trim(), user.id);
                setSearchResults(results);
            } catch (err) {
                console.error('Erro na busca de decks:', err);
                setSearchError('Falha na busca');
            } finally {
                setSearchLoading(false);
            }
        }, 300);

        return () => {
            controller.abort();
            clearTimeout(timeout);
        };
    }, [searchTerm, user]);

    const progressPercent = useMemo(() => {
        const progress = xp % 100;
        return Math.min(100, Math.round((progress / 100) * 100));
    }, [xp]);

    const handleSelectDeck = (deckId: string) => {
        navigate(`/deck/${deckId}`);
        setSearchTerm('');
        setSearchResults([]);
    };

    if (!user) return null;

    return (
        <div className="px-3 sm:px-4 md:px-6 pt-4 md:pt-6">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">StudyCard</p>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
                        {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
                    </div>
                    <div className="w-full md:w-96 relative">
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                            <Search className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar decks e subdecks..."
                                className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                            />
                            {searchLoading && <span className="text-xs text-gray-500">Buscando...</span>}
                        </div>
                        {searchTerm.length >= 2 && (
                            <div className="absolute mt-2 w-full max-h-72 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl z-10">
                                {searchError && <p className="px-4 py-3 text-sm text-red-500">{searchError}</p>}
                                {!searchError && searchResults.length === 0 && !searchLoading && (
                                    <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">Nenhum deck encontrado</p>
                                )}
                                {!searchError &&
                                    searchResults.map((deck) => (
                                        <button
                                            key={deck.id}
                                            onClick={() => handleSelectDeck(deck.id)}
                                            className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                                        >
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{deck.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{deck.path}</p>
                                            <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-1">
                                                {deck.flashcardsCount} flashcards
                                            </p>
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <StatCard
                        label="Level"
                        value={loadingProfile ? '...' : `Lv ${level}`}
                        helper={loadingProfile ? '' : `XP: ${xp} · Próximo nível em ${100 - (xp % 100)} XP`}
                        icon={<Trophy className="h-5 w-5" />}
                    />
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/70 px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200 flex items-center justify-center">
                                <Gauge className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Progresso</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{loadingProfile ? '...' : `${progressPercent}%`}</p>
                                <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all"
                                        style={{ width: loadingProfile ? '0%' : `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <StatCard
                        label="Streak"
                        value={loadingProfile ? '...' : `${streak} dia${streak === 1 ? '' : 's'}`}
                        helper={badges.length ? `Badges: ${badges.map((b) => b.icon || '🏅').join(' ')}` : undefined}
                        icon={<Flame className="h-5 w-5" />}
                        accent="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <StatCard
                        label="Cards estudados hoje"
                        value={loadingToday ? '...' : String(studiedToday)}
                        icon={<Sparkles className="h-5 w-5" />}
                    />
                    <StatCard
                        label="Acurácia do dia"
                        value={loadingToday ? '...' : `${accuracyToday}%`}
                        helper={studiedToday > 0 ? `${studiedToday} respostas registradas` : 'Ainda sem estudos hoje'}
                        icon={<TargetIcon />}
                        accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                    />
                    <StatCard
                        label="XP ganho hoje"
                        value={loadingToday ? '...' : `${xpToday} XP`}
                        icon={<Zap className="h-5 w-5" />}
                        accent="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                    />
                </div>
            </div>
        </div>
    );
};

const TargetIcon: React.FC = () => <span className="inline-flex items-center justify-center">🎯</span>;

export default Topbar;
