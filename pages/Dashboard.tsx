import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Deck } from '../types';
import { BookOpenCheck } from 'lucide-react';

interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    xp: number;
    level: number;
    streak_current: number;
    streak_last_study_date: string | null;
}

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
}

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [decks, setDecks] = useState<Deck[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const [newDeckName, setNewDeckName] = useState('');
    const [currentParentId, setCurrentParentId] = useState<string | null>(null);
    const [navigationPath, setNavigationPath] = useState<Array<{ id: string | null; name: string }>>([
        { id: null, name: 'Meus Decks' }
    ]);
    const [showNewBadgeModal, setShowNewBadgeModal] = useState(false);
    const [newBadges, setNewBadges] = useState<Badge[]>([]);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [currentDeckFlashcardCount, setCurrentDeckFlashcardCount] = useState<number | null>(null);
    const [statsModalOpen, setStatsModalOpen] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);
    const [statsData, setStatsData] = useState<{
        deckName: string;
        subdecks: number;
        flashcards: number;
        studiedPercent: number | null;
        accuracyPercent: number | null;
    } | null>(null);

    const [showMoveDeckModal, setShowMoveDeckModal] = useState(false);
    const [deckToMove, setDeckToMove] = useState<Deck | null>(null);
    const [availableDecks, setAvailableDecks] = useState<Deck[]>([]);
    const [isMovingDeck, setIsMovingDeck] = useState(false);

    const [showRenameModal, setShowRenameModal] = useState(false);
    const [deckToRename, setDeckToRename] = useState<Deck | null>(null);
    const [renameDeckName, setRenameDeckName] = useState('');
    const [isRenamingDeck, setIsRenamingDeck] = useState(false);
    useEffect(() => {
        if (user) {
            loadProfile();
            loadDecks();
            loadBadges();
        }
    }, [user, currentParentId]);

    useEffect(() => {
        if (location.state?.newBadges && location.state.newBadges.length > 0) {
            setNewBadges(location.state.newBadges);
            setShowNewBadgeModal(true);
            window.history.replaceState({}, document.title);
        }

        if (location.state?.message) {
            setSuccessMessage(location.state.message);
            setTimeout(() => setSuccessMessage(null), 5000);
            window.history.replaceState({}, document.title);
        }

        if (location.state?.deckId !== undefined) {
            const targetDeckId = location.state.deckId;
            if (targetDeckId === null) {
                setCurrentParentId(null);
                setNavigationPath([{ id: null, name: 'Meus Decks' }]);
            } else {
                const buildPathToDeck = async (deckId: string) => {
                    try {
                        const { data: deck, error } = await supabase
                            .from('decks')
                            .select('id, name, parent_id')
                            .eq('id', deckId)
                            .single();

                        if (error || !deck) {
                            console.error('Error loading deck for navigation:', error);
                            return;
                        }

                        const path: Array<{ id: string | null; name: string }> = [{ id: null, name: 'Meus Decks' }];

                        const buildPath = async (currentDeckId: string): Promise<void> => {
                            const { data, error } = await supabase
                                .from('decks')
                                .select('id, name, parent_id')
                                .eq('id', currentDeckId)
                                .single();
                            if (error || !data) return;
                            if (data.parent_id) {
                                await buildPath(data.parent_id);
                            }
                            path.push({ id: data.id, name: data.name });
                        };

                        await buildPath(deckId);
                        setNavigationPath(path);
                        setCurrentParentId(deckId);
                    } catch (err) {
                        console.error('Error building path to deck:', err);
                    }
                };
                buildPathToDeck(targetDeckId);
            }
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const loadCurrentDeckFlashcardCount = async (deckId: string) => {
        if (!user) return;
        try {
            const { count, error } = await supabase
                .from('flashcards')
                .select('*', { count: 'exact', head: true })
                .eq('deck_id', deckId);
            if (error) throw error;
            setCurrentDeckFlashcardCount(count ?? 0);
        } catch (err) {
            console.error('Error loading flashcard count for deck:', err);
        }
    };

    useEffect(() => {
        if (currentParentId) {
            loadCurrentDeckFlashcardCount(currentParentId);
        } else {
            setCurrentDeckFlashcardCount(null);
        }
    }, [currentParentId, user]);
    const loadProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user!.id)
                .single();
            if (error) throw error;
            setProfile(data);
        } catch (err) {
            console.error('Error loading profile:', err);
        }
    };

    const loadBadges = async () => {
        try {
            const { data, error } = await supabase
                .from('user_badges')
                .select('badges(*)')
                .eq('user_id', user!.id);
            if (error) throw error;
            setBadges(data?.map((item: any) => item.badges) || []);
        } catch (err) {
            console.error('Error loading badges:', err);
        }
    };

    const loadDecks = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('decks')
                .select('id, name, parent_id, updated_at')
                .eq('user_id', user!.id);

            if (currentParentId) {
                query = query.eq('parent_id', currentParentId);
            } else {
                query = query.is('parent_id', null);
            }

            const { data, error } = await query;
            if (error) throw error;

            const mappedDecks: Deck[] = (data || []).map((deck: any) => ({
                id: deck.id,
                name: deck.name,
                parentId: deck.parent_id ?? null,
            }));
            setDecks(mappedDecks);
        } catch (err) {
            console.error('Error loading decks:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadDeckStatsOnDemand = async (deck: Deck) => {
        if (!user) return;
        try {
            setStatsLoading(true);
            setStatsError(null);
            setStatsData(null);

            const { data: allDecks, error: decksError } = await supabase
                .from('decks')
                .select('id, parent_id, name')
                .eq('user_id', user.id);
            if (decksError) throw decksError;

            const childrenMap = new Map<string | null, string[]>();
            (allDecks || []).forEach((d: any) => {
                const list = childrenMap.get(d.parent_id) || [];
                list.push(d.id);
                childrenMap.set(d.parent_id, list);
            });

            const collectDescendants = (rootId: string): string[] => {
                const stack = [...(childrenMap.get(rootId) || [])];
                const acc: string[] = [];
                while (stack.length) {
                    const child = stack.pop()!;
                    acc.push(child);
                    const next = childrenMap.get(child);
                    if (next && next.length) stack.push(...next);
                }
                return acc;
            };

            const descendantIds = collectDescendants(deck.id);
            const idsToQuery = [deck.id, ...descendantIds];

            const getCount = async (configure: (query: any) => any) => {
                let query = supabase
                    .from('flashcards')
                    .select('*', { count: 'exact', head: true })
                    .in('deck_id', idsToQuery)
                    .eq('user_id', user.id);
                query = configure(query);
                const { count, error } = await query;
                if (error) throw error;
                return count || 0;
            };

            const [totalFlashcards, studied, correct, incorrect] = await Promise.all([
                getCount(q => q),
                getCount(q => q.neq('feedback', 'unseen')),
                getCount(q => q.eq('feedback', 'correct')),
                getCount(q => q.eq('feedback', 'incorrect')),
            ]);

            const studiedPercent = totalFlashcards > 0 ? Math.round((studied / totalFlashcards) * 100) : null;
            const accuracyDen = correct + incorrect;
            const accuracyPercent = accuracyDen > 0 ? Math.round((correct / accuracyDen) * 100) : null;

            setStatsData({
                deckName: deck.name,
                subdecks: descendantIds.length,
                flashcards: totalFlashcards,
                studiedPercent,
                accuracyPercent,
            });
        } catch (err) {
            console.error('Error loading deck stats on demand:', err);
            setStatsError('Não foi possível carregar as estatísticas.');
        } finally {
            setStatsLoading(false);
        }
    };
    const handleCreateDeck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDeckName.trim()) return;
        try {
            const { error } = await supabase
                .from('decks')
                .insert({
                    user_id: user!.id,
                    name: newDeckName,
                    parent_id: currentParentId
                });
            if (error) throw error;
            setNewDeckName('');
            loadDecks();
        } catch (err) {
            console.error('Error creating deck:', err);
            alert('Erro ao criar deck');
        }
    };

    const handleNavigateToDeck = (deck: Deck) => {
        if (currentParentId === deck.id) return;
        setCurrentParentId(deck.id);
        setNavigationPath([...navigationPath, { id: deck.id, name: deck.name }]);
    };

    const handleNavigateToPath = (index: number) => {
        const newPath = navigationPath.slice(0, index + 1);
        setNavigationPath(newPath);
        setCurrentParentId(newPath[newPath.length - 1].id);
    };

    const handleDeleteDeck = async (deckId: string) => {
        if (!confirm('Tem certeza que deseja excluir este deck?')) return;
        try {
            const { error } = await supabase
                .from('decks')
                .delete()
                .eq('id', deckId);
            if (error) throw error;
            loadDecks();
        } catch (err: any) {
            console.error('Error deleting deck:', err);
            alert(`Erro ao excluir deck: ${err.message || 'Erro desconhecido'}`);
        }
    };

    const openMoveDeckModal = async (deck: Deck) => {
        setDeckToMove(deck);
        setShowMoveDeckModal(true);
        try {
            const { data, error } = await supabase
                .from('decks')
                .select('*')
                .eq('user_id', user!.id)
                .neq('id', deck.id);
            if (error) throw error;
            setAvailableDecks(data || []);
        } catch (err) {
            console.error('Error loading available decks:', err);
            alert('Erro ao carregar decks disponíveis para mover.');
        }
    };

    const handleMoveDeck = async (targetParentId: string | null) => {
        if (!deckToMove) return;
        try {
            setIsMovingDeck(true);
            const { error } = await supabase
                .from('decks')
                .update({ parent_id: targetParentId })
                .eq('id', deckToMove.id);
            if (error) throw error;
            setSuccessMessage(`Deck "${deckToMove.name}" movido com sucesso!`);
            setShowMoveDeckModal(false);
            setDeckToMove(null);
            loadDecks();
        } catch (err) {
            console.error('Error moving deck:', err);
            alert('Erro ao mover deck.');
        } finally {
            setIsMovingDeck(false);
        }
    };

    const openRenameDeckModal = (deck: Deck) => {
        setDeckToRename(deck);
        setRenameDeckName(deck.name);
        setShowRenameModal(true);
    };

    const handleRenameDeck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deckToRename || !renameDeckName.trim()) return;
        try {
            setIsRenamingDeck(true);
            const { error } = await supabase
                .from('decks')
                .update({ name: renameDeckName.trim() })
                .eq('id', deckToRename.id);
            if (error) throw error;
            setSuccessMessage(`Deck renomeado para "${renameDeckName}" com sucesso!`);
            setShowRenameModal(false);
            setDeckToRename(null);
            loadDecks();
        } catch (err) {
            console.error('Error renaming deck:', err);
            alert('Erro ao renomear deck.');
        } finally {
            setIsRenamingDeck(false);
        }
    };

    const normalizedSearchTerm = searchTerm.trim().toLowerCase();
    const filteredDecks = normalizedSearchTerm
        ? decks.filter(deck => deck.name.toLowerCase().includes(normalizedSearchTerm))
        : decks;
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
            

            {successMessage && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-bounce-in">
                    <span className="text-xl">??</span>
                    <span className="font-semibold">{successMessage}</span>
                    <button
                        onClick={() => setSuccessMessage(null)}
                        className="bg-white/20 hover:bg-white/30 border-none rounded-full w-6 h-6 flex items-center justify-center cursor-pointer text-white text-base transition-colors"
                    >
                        ×
                    </button>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 py-8 md:px-6">
                {currentParentId && (
                    <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 flex flex-wrap items-center justify-center gap-3">
                        <button
                            onClick={() => navigate('/generator', { state: { deckId: currentParentId } })}
                            className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all whitespace-nowrap min-w-[160px]"
                        >
                            Criar Flashcards
                        </button>
                        <button
                            onClick={() => navigate(`/deck/${currentParentId}`)}
                            className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all whitespace-nowrap min-w-[200px] flex items-center justify-center gap-2"
                        >
                            <BookOpenCheck className="w-5 h-5" aria-hidden />
                            <span>
                                Ver {currentDeckFlashcardCount === null ? '...' : currentDeckFlashcardCount} flashcard{currentDeckFlashcardCount === 1 ? '' : 's'} deste deck
                            </span>
                        </button>
                    </div>
                )}

                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex gap-2 items-center flex-wrap text-base md:text-lg">
                        {navigationPath.map((item, index) => (
                            <React.Fragment key={index}>
                                {index > 0 && <span className="text-gray-400">|</span>}
                                <button
                                    onClick={() => handleNavigateToPath(index)}
                                    className={`bg-transparent border-none cursor-pointer hover:underline ${index === navigationPath.length - 1
                                        ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                                        : 'text-gray-500 dark:text-gray-400'
                                        }`}
                                >
                                    {item.name}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Criar Novo Deck</h2>
                    <form onSubmit={handleCreateDeck} className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={newDeckName}
                            onChange={(e) => setNewDeckName(e.target.value)}
                            placeholder="Nome do deck..."
                            className="flex-1 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-transparent dark:text-white"
                        />
                        <button
                            type="submit"
                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white border-none rounded-lg text-base font-semibold cursor-pointer hover:opacity-90 transition-opacity shadow-md active:scale-95"
                        >
                            Criar
                        </button>
                    </form>
                </div>
                {loading ? (
                    <div className="text-center p-10 text-gray-400 animate-pulse">Carregando...</div>
                ) : filteredDecks.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-10 text-center text-gray-400 shadow-sm border border-gray-100 dark:border-gray-700">
                        {normalizedSearchTerm
                            ? `Nenhum deck encontrado para "${searchTerm}".`
                            : 'Nenhum deck encontrado. Crie seu primeiro deck acima!'}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredDecks.map((deck) => (
                            <div
                                key={deck.id}
                                className="bg-white dark:bg-gray-800 rounded-xl p-6 pt-20 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all relative group border border-gray-100 dark:border-gray-700 min-h-[240px] flex flex-col justify-between"
                            >
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                                        {deck.name}
                                    </h3>
                                </div>

                                <div className="flex gap-2 mt-4 flex-wrap">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate('/study', { state: { deckId: deck.id } });
                                        }}
                                        className="flex-1 min-w-[120px] py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-700 border-none rounded-md text-sm text-white cursor-pointer font-semibold hover:opacity-90 transition-opacity shadow-sm"
                                    >
                                        Estudar
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/deck/${deck.id}`);
                                        }}
                                        className="flex-1 min-w-[120px] py-2.5 px-4 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 cursor-pointer font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span aria-hidden>??</span>
                                        <span>Flashcards</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleNavigateToDeck(deck);
                                        }}
                                        className="flex-1 min-w-[120px] py-2.5 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-200 cursor-pointer font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Subdecks
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setStatsModalOpen(true);
                                            loadDeckStatsOnDemand(deck);
                                        }}
                                        className="flex-1 min-w-[120px] py-2.5 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-200 cursor-pointer font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Estatísticas
                                    </button>
                                </div>

                                <div className="absolute top-4 right-4 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-800/90 p-1 rounded-lg backdrop-blur-sm shadow-sm border border-gray-100 dark:border-gray-700">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openRenameDeckModal(deck);
                                        }}
                                        className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-md transition-colors"
                                        title="Renomear"
                                    >
                                        Renomear
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openMoveDeckModal(deck);
                                        }}
                                        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md transition-colors"
                                        title="Mover"
                                    >
                                        Mover
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteDeck(deck.id);
                                        }}
                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md transition-colors"
                                        title="Excluir"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {statsModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Estatísticas do Deck</h2>
                            <button
                                onClick={() => setStatsModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                ×
                            </button>
                        </div>

                        {statsLoading && (
                            <div className="py-6 text-center text-gray-500 dark:text-gray-300">Carregando estatísticas...</div>
                        )}

                        {statsError && (
                            <div className="py-4 text-center text-red-500 dark:text-red-400">{statsError}</div>
                        )}

                        {!statsLoading && !statsError && statsData && (
                            <div className="space-y-3 text-gray-800 dark:text-gray-200">
                                <p className="text-lg font-semibold">{statsData.deckName}</p>
                                <div className="flex justify-between">
                                    <span>Subdecks</span>
                                    <span className="font-bold">{statsData.subdecks}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total de flashcards</span>
                                    <span className="font-bold">{statsData.flashcards}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>% estudados (= 1 vez)</span>
                                    <span className="font-bold">
                                        {statsData.studiedPercent === null ? '-' : `${statsData.studiedPercent}%`}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>% acerto (último estudo)</span>
                                    <span className="font-bold">
                                        {statsData.accuracyPercent === null ? '-' : `${statsData.accuracyPercent}%`}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showNewBadgeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl text-center max-w-md w-full animate-pop-in shadow-2xl border border-gray-100 dark:border-gray-700">
                        <div className="text-6xl mb-5 animate-bounce">??</div>
                        <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">Nova Conquista Desbloqueada!</h2>
                        {newBadges.map(badge => (
                            <div key={badge.id} className="mb-5">
                                <div className="text-5xl mb-2">{badge.icon}</div>
                                <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">{badge.name}</h3>
                                <p className="text-gray-500 dark:text-gray-400">{badge.description}</p>
                            </div>
                        ))}
                        <button
                            onClick={() => setShowNewBadgeModal(false)}
                            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white border-none rounded-lg text-base font-semibold cursor-pointer mt-5 hover:shadow-lg hover:scale-105 transition-all"
                        >
                            Incrível!
                        </button>
                    </div>
                </div>
            )}

            {showMoveDeckModal && deckToMove && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                            Mover "{deckToMove.name}" para...
                        </h2>

                        <div className="max-h-60 overflow-y-auto mb-4 space-y-2">
                            <button
                                onClick={() => handleMoveDeck(null)}
                                className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-2 ${deckToMove.parentId === null
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                                    }`}
                            >
                                <span className="text-xl">??</span>
                                <span className="font-medium text-gray-700 dark:text-gray-200">Raiz (Meus Decks)</span>
                                {deckToMove.parentId === null && <span className="ml-auto text-indigo-600 dark:text-indigo-400">Atual</span>}
                            </button>

                            {availableDecks.map(deck => (
                                <button
                                    key={deck.id}
                                    onClick={() => handleMoveDeck(deck.id)}
                                    className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-2 ${deckToMove.parentId === deck.id
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                                        }`}
                                >
                                    <span className="text-xl">??</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-200">{deck.name}</span>
                                    {deckToMove.parentId === deck.id && <span className="ml-auto text-indigo-600 dark:text-indigo-400">Atual</span>}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={() => setShowMoveDeckModal(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                disabled={isMovingDeck}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showRenameModal && deckToRename && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                            Renomear Deck
                        </h2>

                        <form onSubmit={handleRenameDeck}>
                            <input
                                type="text"
                                value={renameDeckName}
                                onChange={(e) => setRenameDeckName(e.target.value)}
                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-transparent dark:text-white mb-4"
                                placeholder="Novo nome do deck"
                                autoFocus
                            />

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowRenameModal(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    disabled={isRenamingDeck}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                    disabled={isRenamingDeck || !renameDeckName.trim()}
                                >
                                    {isRenamingDeck ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;

