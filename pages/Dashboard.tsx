import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../services/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Deck } from '../types';

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
    const { user, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [decks, setDecks] = useState<Deck[]>([]);
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

    // Deck statistics
    const [deckStats, setDeckStats] = useState<Record<string, { subdecks: number; flashcards: number }>>({});

    // Move Deck State
    const [showMoveDeckModal, setShowMoveDeckModal] = useState(false);
    const [deckToMove, setDeckToMove] = useState<Deck | null>(null);
    const [availableDecks, setAvailableDecks] = useState<Deck[]>([]);
    const [isMovingDeck, setIsMovingDeck] = useState(false);

    // Rename Deck State
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
            // Clear state to prevent showing again on refresh
            window.history.replaceState({}, document.title);
        }

        // Show success message if present
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
            // Auto-hide after 5 seconds
            setTimeout(() => setSuccessMessage(null), 5000);
            // Clear state to prevent showing again on refresh
            window.history.replaceState({}, document.title);
        }

        // Navigate to specific deck if deckId is provided
        if (location.state?.deckId !== undefined) {
            const targetDeckId = location.state.deckId;

            // If deckId is null, go to root
            if (targetDeckId === null) {
                setCurrentParentId(null);
                setNavigationPath([{ id: null, name: 'Meus Decks' }]);
            } else {
                // Navigate to the specified deck
                // We need to build the path to this deck
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

                        // Build path recursively
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
                    } catch (error) {
                        console.error('Error building path to deck:', error);
                    }
                };

                buildPathToDeck(targetDeckId);
            }

            // Clear state to prevent re-navigation on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const loadProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user!.id)
                .single();

            if (error) throw error;
            setProfile(data);
        } catch (error) {
            console.error('Error loading profile:', error);
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
        } catch (error) {
            console.error('Error loading badges:', error);
        }
    };

    const loadDecks = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('decks')
                .select('*')
                .eq('user_id', user!.id);

            if (currentParentId) {
                query = query.eq('parent_id', currentParentId);
            } else {
                query = query.is('parent_id', null);
            }

            const { data, error } = await query;

            if (error) throw error;
            setDecks(data || []);

            // Load statistics for each deck
            if (data && data.length > 0) {
                await loadDeckStats(data);
            }
        } catch (error) {
            console.error('Error loading decks:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDeckStats = async (decksList: Deck[]) => {
        if (!user) return;

        try {
            const stats: Record<string, { subdecks: number; flashcards: number }> = {};

            // Helper function to recursively get all subdeck IDs
            const getAllSubdeckIds = async (deckId: string): Promise<string[]> => {
                const { data: children, error } = await supabase
                    .from('decks')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('parent_id', deckId);

                if (error || !children || children.length === 0) {
                    return [];
                }

                const childIds = children.map(child => child.id);

                // Recursively get subdecks of each child
                const nestedIds: string[] = [];
                for (const childId of childIds) {
                    const nested = await getAllSubdeckIds(childId);
                    nestedIds.push(...nested);
                }

                return [...childIds, ...nestedIds];
            };

            for (const deck of decksList) {
                // Get all subdeck IDs recursively
                const allSubdeckIds = await getAllSubdeckIds(deck.id);
                const subdeckCount = allSubdeckIds.length;

                // Count flashcards in this deck and all subdecks
                const deckIdsToCount = [deck.id, ...allSubdeckIds];

                const { count: flashcardCount, error: flashcardError } = await supabase
                    .from('flashcards')
                    .select('*', { count: 'exact', head: true })
                    .in('deck_id', deckIdsToCount);

                if (!flashcardError) {
                    stats[deck.id] = {
                        subdecks: subdeckCount,
                        flashcards: flashcardCount || 0
                    };
                }
            }

            setDeckStats(stats);
        } catch (error) {
            console.error('Error loading deck stats:', error);
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
        } catch (error) {
            console.error('Error creating deck:', error);
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
        } catch (error: any) {
            console.error('Error deleting deck:', error);
            alert(`Erro ao excluir deck: ${error.message || 'Erro desconhecido'}`);
        }
    };

    const openMoveDeckModal = async (deck: Deck) => {
        setDeckToMove(deck);
        setShowMoveDeckModal(true);
        try {
            // Fetch all decks to list as potential parents
            // Exclude the deck itself to prevent cycles (basic check)
            const { data, error } = await supabase
                .from('decks')
                .select('*')
                .eq('user_id', user!.id)
                .neq('id', deck.id); // Exclude self

            if (error) throw error;
            setAvailableDecks(data || []);
        } catch (error) {
            console.error('Error loading available decks:', error);
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
            loadDecks(); // Reload current view
        } catch (error) {
            console.error('Error moving deck:', error);
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
        } catch (error) {
            console.error('Error renaming deck:', error);
            alert('Erro ao renomear deck.');
        } finally {
            setIsRenamingDeck(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
            <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-4 md:p-6 flex flex-col md:flex-row justify-between items-center shadow-md gap-4">
                <h1 className="text-2xl font-bold">Flashcards AI</h1>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <button
                        onClick={() => navigate('/generator', { state: { deckId: currentParentId } })}
                        className="w-full md:w-auto px-5 py-2.5 bg-white/95 hover:bg-white text-indigo-600 border-none rounded-lg cursor-pointer text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-95"
                    >
                        ✨ Gerar Flashcards
                    </button>

                    <button
                        onClick={() => navigate('/simulations')}
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-white font-semibold transition-all hover:scale-105 active:scale-95"
                    >
                        📝 Modo Simulado
                    </button>
                    <button
                        onClick={() => navigate('/calendar')}
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-white font-semibold transition-all hover:scale-105 active:scale-95"
                        title="Calendário de Estudos"
                        aria-label="Abrir calendário de estudos"
                    >
                        📅 Calendário
                    </button>
                    <button
                        onClick={() => navigate('/statistics')}
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-white font-semibold transition-all hover:scale-105 active:scale-95"
                        title="Estatísticas e Desempenho"
                        aria-label="Abrir estatísticas e desempenho"
                    >
                        📊 Estatísticas
                    </button>

                    {/* Dark Mode Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-white cursor-pointer transition-all hover:scale-105 active:scale-95"
                        title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
                        aria-label={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
                    >
                        {theme === 'dark' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 14.95l.707-.707a1 1 0 10-1.414-1.414l-.707.707a1 1 0 001.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                            </svg>
                        )}
                    </button>

                    {/* Help Button */}
                    <button
                        onClick={() => navigate('/help')}
                        className="p-2.5 bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg text-white cursor-pointer transition-all hover:scale-105 active:scale-95"
                        title="Central de Ajuda"
                        aria-label="Abrir central de ajuda"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                    </button>

                    {profile && (
                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                            <div className="text-center">
                                <div className="text-lg font-bold">🔥 {profile.streak_current || 0}</div>
                                <div className="text-[10px] opacity-80 uppercase tracking-wider">Dias</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-medium opacity-90">{profile.full_name || profile.email}</div>
                                <div className="text-xs opacity-80">Level {profile.level} • {profile.xp} XP</div>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleSignOut}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-md text-white cursor-pointer text-sm transition-colors"
                    >
                        Sair
                    </button>
                </div>
            </header>

            {/* Success Message */}
            {successMessage && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-bounce-in">
                    <span className="text-xl">✅</span>
                    <span className="font-semibold">{successMessage}</span>
                    <button
                        onClick={() => setSuccessMessage(null)}
                        className="bg-white/20 hover:bg-white/30 border-none rounded-full w-6 h-6 flex items-center justify-center cursor-pointer text-white text-base transition-colors"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8 md:px-6">

                {/* Badges Section */}
                {badges.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Minhas Conquistas</h2>
                        <div className="flex gap-3 flex-wrap">
                            {badges.map(badge => (
                                <div key={badge.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm flex items-center gap-3 min-w-[200px] border border-gray-100 dark:border-gray-700">
                                    <div className="text-2xl">{badge.icon}</div>
                                    <div>
                                        <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">{badge.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{badge.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Breadcrumb */}
                {/* Breadcrumb and Actions */}
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex gap-2 items-center flex-wrap text-base md:text-lg">
                        {navigationPath.map((item, index) => (
                            <React.Fragment key={index}>
                                {index > 0 && <span className="text-gray-400">›</span>}
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

                    {currentParentId && (
                        <button
                            onClick={() => navigate(`/deck/${currentParentId}`)}
                            className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-2"
                        >
                            <span>🗂️</span> Ver Flashcards deste Deck
                        </button>
                    )}
                </div>

                {/* Create Deck Form */}
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

                {/* Decks Grid */}
                {loading ? (
                    <div className="text-center p-10 text-gray-400 animate-pulse">Carregando...</div>
                ) : decks.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-10 text-center text-gray-400 shadow-sm border border-gray-100 dark:border-gray-700">
                        Nenhum deck encontrado. Crie seu primeiro deck acima!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {decks.map((deck) => (
                            <div
                                key={deck.id}
                                className="bg-white dark:bg-gray-800 rounded-xl p-6 pt-16 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all relative group border border-gray-100 dark:border-gray-700 min-h-[220px] flex flex-col justify-between"
                            >
                                <div onClick={() => handleNavigateToDeck(deck)} className="cursor-pointer flex-1">
                                    <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                                        {deck.name}
                                    </h3>

                                    {/* Deck Statistics */}
                                    <div className="flex gap-3 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                        <div className="flex items-center gap-1" title="Subdecks">
                                            <span>📁</span>
                                            <span>{deckStats[deck.id]?.subdecks ?? 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1" title="Flashcards">
                                            <span>🎴</span>
                                            <span>{deckStats[deck.id]?.flashcards ?? 0}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate('/study', { state: { deckId: deck.id } });
                                        }}
                                        className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-700 border-none rounded-md text-sm text-white cursor-pointer font-semibold hover:opacity-90 transition-opacity shadow-sm"
                                    >
                                        📚 Estudar
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/deck/${deck.id}`);
                                        }}
                                        className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 cursor-pointer font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        ⚙️ Gerenciar
                                    </button>
                                </div>

                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-800/90 p-1 rounded-lg backdrop-blur-sm shadow-sm border border-gray-100 dark:border-gray-700">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openRenameDeckModal(deck);
                                        }}
                                        className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-md transition-colors"
                                        title="Renomear"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openMoveDeckModal(deck);
                                        }}
                                        className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md transition-colors"
                                        title="Mover"
                                    >
                                        ➡️
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteDeck(deck.id);
                                        }}
                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md transition-colors"
                                        title="Excluir"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* New Badge Modal */}
            {showNewBadgeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl text-center max-w-md w-full animate-pop-in shadow-2xl border border-gray-100 dark:border-gray-700">
                        <div className="text-6xl mb-5 animate-bounce">🎉</div>
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

            {/* Move Deck Modal */}
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
                                <span className="text-xl">🏠</span>
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
                                    <span className="text-xl">📁</span>
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


            {/* Rename Deck Modal */}
            {
                showRenameModal && deckToRename && (
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
                )
            }
        </div >
    );
};

export default Dashboard;
