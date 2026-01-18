
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Gauge, Search, Sparkles, Trophy, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePageHeader } from '../contexts/PageHeaderContext';
import { fetchProfileOverview, fetchTodayStats, searchDecks, DeckSearchResult } from '../services/dashboardHeaderService';
import { supabase } from '../services/supabaseClient';

type StatCardProps = {
    label: string;
    value: string;
    icon: React.ReactNode;
    helper?: string;
    accent?: string;
};

const StatCard: React.FC<StatCardProps> = ({ label, value, helper, icon, accent }) => (
    <div className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/70 px-3 py-2.5 shadow-sm transition-transform duration-150 hover:-translate-y-[1px] min-h-[88px]">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm shrink-0 ${accent || 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200'}`}>
            {icon}
        </div>
        <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{value}</p>
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
    const [profileError, setProfileError] = useState<string | null>(null);
    const [todayError, setTodayError] = useState<string | null>(null);

    const loadProfile = useCallback(async () => {
        if (!user) return;
        try {
            setLoadingProfile(true);
            const { profile, badges } = await fetchProfileOverview(user.id);
            setXp(profile.xp);
            setLevel(profile.level);
            setStreak(profile.streak);
            setBadges(badges);
            setProfileError(null);
        } catch (err) {
            console.error('Erro ao carregar perfil para o topo:', err);
            setProfileError('Perfil indispon?vel');
        } finally {
            setLoadingProfile(false);
        }
    }, [user]);

    const loadToday = useCallback(async () => {
        if (!user) return;
        try {
            setLoadingToday(true);
            const stats = await fetchTodayStats(user.id);
            setStudiedToday(stats.studiedToday);
            setAccuracyToday(stats.accuracyToday);
            setXpToday(stats.xpToday);
            setTodayError(null);
        } catch (err) {
            console.error('Erro ao carregar estatisticas de hoje:', err);
            setTodayError('Estat?sticas de hoje indispon?veis');
        } finally {
            setLoadingToday(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        loadProfile();
        loadToday();
    }, [user, loadProfile, loadToday]);

    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`topbar-stats-${user.id}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'study_sessions', filter: `user_id=eq.${user.id}` },
                () => loadToday()
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
                () => loadProfile()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, loadProfile, loadToday]);

    useEffect(() => {
        if (!user) return;
        if (searchTerm.trim().length < 2) {
            setSearchResults([]);
            setSearchError(null);
            return;
        }

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
            <div className="flex flex-col gap-3 md:gap-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 md:gap-3">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">StudyCard</p>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
                        {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
                    </div>
                    <div className="w-full md:w-96 relative">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
                            <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar decks..."
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
                                            <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-1">{deck.flashcardsCount} flashcards</p>
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile: carrossel de KPIs */}
                <div className="md:hidden -mx-3 px-3 overflow-x-auto pb-1 flex gap-3 snap-x snap-mandatory">
                    <div className="min-w-[220px] snap-start">
                        <StatCard
                            label="Level"
                            value={loadingProfile ? '...' : `Lv ${level}`}
                            helper={loadingProfile ? '' : `XP: ${xp} ? Pr?x.: ${100 - (xp % 100)} XP`}
                            icon={<Trophy className="h-5 w-5" />}
                        />
                    </div>
                    <div className="min-w-[220px] snap-start">
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/70 px-3 py-2.5 shadow-sm flex items-start gap-3 min-h-[88px]">
                            <div className="h-9 w-9 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200 flex items-center justify-center text-sm shrink-0">
                                <Gauge className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Progresso</p>
                                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{loadingProfile ? '...' : `${progressPercent}%`}</p>
                                <div className="mt-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all"
                                        style={{ width: loadingProfile ? '0%' : `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="min-w-[220px] snap-start">
                        <StatCard
                            label="Cards estudados hoje"
                            value={loadingToday ? '...' : String(studiedToday)}
                            icon={<Sparkles className="h-5 w-5" />}
                            helper={todayError || undefined}
                        />
                    </div>
                    <div className="min-w-[220px] snap-start">
                        <StatCard
                            label="Acur?cia do dia"
                            value={loadingToday ? '...' : `${accuracyToday}%`}
                            helper={todayError ? todayError : studiedToday > 0 ? `${studiedToday} resp.` : 'Ainda sem estudos hoje'}
                            icon={<TargetIcon />}
                            accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                        />
                    </div>
                    <div className="min-w-[220px] snap-start">
                        <StatCard
                            label="XP ganho hoje"
                            value={loadingToday ? '...' : `${xpToday} XP`}
                            helper={todayError || undefined}
                            icon={<Zap className="h-5 w-5" />}
                            accent="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                        />
                    </div>
                    <div className="min-w-[220px] snap-start">
                        <StatCard
                            label="Streak"
                            value={loadingProfile ? '...' : `${streak} dia${streak === 1 ? '' : 's'}`}
                            helper={badges.length ? `Badges: ${badges.map((b) => b.icon || '??').join(' ')}` : undefined}
                            icon={<Flame className="h-5 w-5" />}
                            accent="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                        />
                    </div>
                </div>

                {/* Desktop/Tablet grid */}
                <div className="hidden md:grid grid-cols-3 xl:grid-cols-6 gap-3">
                    <StatCard
                        label="Level"
                        value={loadingProfile ? '...' : `Lv ${level}`}
                        helper={loadingProfile ? '' : `XP: ${xp} ? Pr?x.: ${100 - (xp % 100)} XP`}
                        icon={<Trophy className="h-5 w-5" />}
                    />
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/70 px-3 py-2.5 shadow-sm flex items-start gap-3 min-h-[88px]">
                        <div className="h-9 w-9 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200 flex items-center justify-center text-sm shrink-0">
                            <Gauge className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Progresso</p>
                            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{loadingProfile ? '...' : `${progressPercent}%`}</p>
                            <div className="mt-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all"
                                    style={{ width: loadingProfile ? '0%' : `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                    <StatCard
                        label="Streak"
                        value={loadingProfile ? '...' : `${streak} dia${streak === 1 ? '' : 's'}`}
                        helper={badges.length ? `Badges: ${badges.map((b) => b.icon || '??').join(' ')}` : undefined}
                        icon={<Flame className="h-5 w-5" />}
                        accent="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                    />
                    <StatCard
                        label="Cards estudados hoje"
                        value={loadingToday ? '...' : String(studiedToday)}
                        icon={<Sparkles className="h-5 w-5" />}
                        helper={todayError || undefined}
                    />
                    <StatCard
                        label="Acur?cia do dia"
                        value={loadingToday ? '...' : `${accuracyToday}%`}
                        helper={todayError ? todayError : studiedToday > 0 ? `${studiedToday} resp.` : 'Ainda sem estudos hoje'}
                        icon={<TargetIcon />}
                        accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                    />
                    <StatCard
                        label="XP ganho hoje"
                        value={loadingToday ? '...' : `${xpToday} XP`}
                        helper={todayError || undefined}
                        icon={<Zap className="h-5 w-5" />}
                        accent="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                    />
                </div>

                {(profileError || todayError) && (
                    <div className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
                        {profileError && <p>{profileError}</p>}
                        {todayError && <p>{todayError}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

const TargetIcon: React.FC = () => <span className="inline-flex items-center justify-center">??</span>;

export default Topbar;
