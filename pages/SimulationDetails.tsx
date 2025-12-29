import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { Simulation, SimulationItem, Deck } from '../types';
import { CardMode } from '../types';
import { Home, PlusCircle } from 'lucide-react';

const SimulationDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [simulation, setSimulation] = useState<Simulation | null>(null);
    const [items, setItems] = useState<SimulationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastSessionInfo, setLastSessionInfo] = useState<{ accuracy: number; date: string } | null>(null);
    const [availableDecks, setAvailableDecks] = useState<Deck[]>([]);
    const [deckSearch, setDeckSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedDeckIds, setSelectedDeckIds] = useState<Set<string>>(new Set());
    const [selectedCardModes, setSelectedCardModes] = useState<Set<CardMode>>(new Set(Object.values(CardMode)));
    const [cardsToAdd, setCardsToAdd] = useState(5);
    const [addingCards, setAddingCards] = useState(false);

    useEffect(() => {
        if (user && id) {
            loadSimulationDetails();
        }
    }, [user, id]);

    useEffect(() => {
        if (user) {
            loadAvailableDecks();
        }
    }, [user]);

    const loadAvailableDecks = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('decks')
                .select('id, name, parent_id')
                .eq('user_id', user.id)
                .order('name', { ascending: true });

            if (error) throw error;
            const decks: Deck[] = (data || []).map(deck => ({
                id: deck.id,
                name: deck.name,
                parentId: deck.parent_id ?? null
            }));
            setAvailableDecks(decks);
        } catch (error) {
            console.error('Error loading decks:', error);
        }
    };

    const fetchLastSessionInfo = async () => {
        if (!user || !id) {
            setLastSessionInfo(null);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('simulation_sessions')
                .select('created_at, accuracy, correct, incorrect')
                .eq('simulation_id', id)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;
            const session = data?.[0];
            if (!session) {
                setLastSessionInfo(null);
                return;
            }

            setLastSessionInfo({
                accuracy: session.accuracy ?? 0,
                date: session.created_at
            });
        } catch (error) {
            console.error('Error fetching last session info:', error);
            setLastSessionInfo(null);
        }
    };

    const loadSimulationDetails = async () => {
        try {
            setLoading(true);
            // 1. Fetch Simulation Info
            const { data: simData, error: simError } = await supabase
                .from('simulations')
                .select('*')
                .eq('id', id)
                .single();

            if (simError) throw simError;
            setSimulation(simData);

            // 2. Fetch Simulation Items with Flashcard Data
            const { data: itemsData, error: itemsError } = await supabase
                .from('simulation_items')
                .select('*, flashcard:flashcards(*)')
                .eq('simulation_id', id);

            if (itemsError) throw itemsError;

            // Map the nested flashcard data to the item structure expected by the UI
            const formattedItems = itemsData?.map((item: any) => ({
                ...item,
                flashcard: item.flashcard
            })) || [];

            setItems(formattedItems);
            await fetchLastSessionInfo();

        } catch (error) {
            console.error('Error loading simulation details:', error);
            alert('Erro ao carregar detalhes do simulado.');
            navigate('/simulations');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        if (!confirm('Remover esta questão do simulado?')) return;

        try {
            const { error } = await supabase
                .from('simulation_items')
                .delete()
                .eq('id', itemId);

            if (error) throw error;

            // Update local state
            setItems(prev => prev.filter(item => item.id !== itemId));
        } catch (error) {
            console.error('Error removing item:', error);
            alert('Erro ao remover questão.');
        }
    };

    const toggleDeckSelection = (deckId: string) => {
        setSelectedDeckIds(prev => {
            const next = new Set(prev);
            if (next.has(deckId)) {
                next.delete(deckId);
            } else {
                next.add(deckId);
            }
            return next;
        });
    };

    const toggleCardMode = (mode: CardMode) => {
        setSelectedCardModes(prev => {
            const next = new Set(prev);
            if (next.has(mode)) {
                next.delete(mode);
            } else {
                next.add(mode);
            }
            return next;
        });
    };

    const modeLabel = (mode: CardMode) => {
        switch (mode) {
            case CardMode.QA:
                return 'Pergunta e Resposta';
            case CardMode.TrueFalse:
                return 'Verdadeiro ou Falso';
            case CardMode.MultipleChoice:
                return 'Multipla Escolha';
            case CardMode.PracticalExample:
                return 'Exemplo Pratico';
            case CardMode.FillInTheBlank:
                return 'Lacunas';
            case CardMode.Dictionary:
                return 'Dicionario';
            default:
                return mode;
        }
    };

    const handleAddCards = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!simulation || !user) return;

        if (selectedDeckIds.size === 0) {
            alert('Selecione ao menos um deck.');
            return;
        }

        if (selectedCardModes.size === 0) {
            alert('Selecione ao menos um tipo de card.');
            return;
        }

        if (cardsToAdd <= 0) {
            alert('Informe uma quantidade valida de cards.');
            return;
        }

        setAddingCards(true);
        try {
            const { data: cards, error: cardsError } = await supabase
                .from('flashcards')
                .select('*')
                .eq('user_id', user.id)
                .in('deck_id', Array.from(selectedDeckIds))
                .in('mode', Array.from(selectedCardModes));

            if (cardsError) throw cardsError;

            const existingFlashcardIds = new Set(items.map(item => item.flashcard_id));
            const availableCards = (cards || []).filter(card => !existingFlashcardIds.has(card.id));

            if (availableCards.length === 0) {
                alert('Nenhum card disponivel com os filtros selecionados.');
                return;
            }

            const pickCount = Math.min(cardsToAdd, availableCards.length);
            const selectedCards = [...availableCards].sort(() => Math.random() - 0.5).slice(0, pickCount);

            const { data: insertedItems, error: insertError } = await supabase
                .from('simulation_items')
                .insert(
                    selectedCards.map(card => ({
                        simulation_id: simulation.id,
                        flashcard_id: card.id
                    }))
                )
                .select('*, flashcard:flashcards(*)');

            if (insertError) throw insertError;
            if (insertedItems) {
                setItems(prev => [...prev, ...insertedItems]);
            }

            setShowAddModal(false);
            setCardsToAdd(5);
        } catch (error) {
            console.error('Error adding cards:', error);
            alert('Erro ao adicionar cards.');
        } finally {
            setAddingCards(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Carregando...</div>;
    }

    if (!simulation) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Simulado não encontrado.</div>;
    }

    const filteredDecks = availableDecks.filter(deck =>
        deck.name.toLowerCase().includes(deckSearch.trim().toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <button
                                    onClick={() => navigate('/simulations')}
                                    className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-2"
                                >
                                    <Home className="w-4 h-4" />
                                    <span>Voltar para Modo Simulado</span>
                                </button>
                                <span className="text-gray-300 dark:text-gray-600">|</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(simulation.created_at).toLocaleDateString()}
                                </span>
                                {lastSessionInfo && (
                                    <>
                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            Ultima sessao: {new Date(lastSessionInfo.date).toLocaleDateString()} - {lastSessionInfo.accuracy}% de acerto
                                        </span>
                                    </>
                                )}
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{simulation.title}</h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                {items.length} questões
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-6 py-3 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg font-semibold hover:bg-indigo-100 transition-colors shadow-sm flex items-center justify-center gap-2"
                            >
                                <PlusCircle className="w-5 h-5" />
                                Adicionar cards
                            </button>
                            <button
                                onClick={() => navigate('/simulation-study', { state: { simulationId: simulation.id } })}
                                className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                ▶ Iniciar Simulado
                            </button>
                        </div>
                    </div>
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 ml-1">Questões</h2>

                    {items.length === 0 ? (
                        <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500">
                            Este simulado não possui questões.
                        </div>
                    ) : (
                        items.map((item, index) => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex gap-4 group">
                                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-sm">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                                {item.flashcard?.mode === 'qa' ? 'Pergunta e Resposta' :
                                                    item.flashcard?.mode === 'true_false' ? 'Verdadeiro ou Falso' :
                                                        item.flashcard?.mode === 'multiple_choice' ? 'Múltipla Escolha' : item.flashcard?.mode}
                                            </span>
                                            <p className="text-gray-800 dark:text-gray-200 font-medium line-clamp-2">
                                                {(() => {
                                                    const card = item.flashcard;
                                                    if (!card) return 'Sem pergunta';
                                                    switch (card.mode) {
                                                        case CardMode.QA:
                                                        case CardMode.MultipleChoice:
                                                        case CardMode.FillInTheBlank:
                                                            return card.question;
                                                        case CardMode.TrueFalse:
                                                            return card.statement;
                                                        case CardMode.PracticalExample:
                                                            return card.problem;
                                                        default:
                                                            return 'Sem pergunta';
                                                    }
                                                })()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remover questão"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Adicionar cards</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Selecione a origem e quantos cards quer incluir neste simulado.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                Fechar
                            </button>
                        </div>

                        <form className="space-y-5" onSubmit={handleAddCards}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Quantidade de cards
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={cardsToAdd}
                                    onChange={e => setCardsToAdd(Number(e.target.value) || 0)}
                                    className="w-32 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                                />
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Decks</p>
                                <input
                                    type="text"
                                    value={deckSearch}
                                    onChange={e => setDeckSearch(e.target.value)}
                                    placeholder="Buscar deck..."
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                                />
                                <div className="grid sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                    {filteredDecks.map(deck => (
                                        <label
                                            key={deck.id}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                                                selectedDeckIds.has(deck.id)
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200'
                                                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedDeckIds.has(deck.id)}
                                                onChange={() => toggleDeckSelection(deck.id)}
                                                className="accent-indigo-600"
                                            />
                                            <span className="truncate">{deck.name}</span>
                                        </label>
                                    ))}
                                    {availableDecks.length === 0 && (
                                        <div className="col-span-full text-sm text-gray-500 dark:text-gray-400">
                                            Nenhum deck encontrado.
                                        </div>
                                    )}
                                    {availableDecks.length > 0 && filteredDecks.length === 0 && (
                                        <div className="col-span-full text-sm text-gray-500 dark:text-gray-400">
                                            Nenhum deck corresponde a busca.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Modalidades</p>
                                <div className="flex flex-wrap gap-2">
                                    {Object.values(CardMode).map((mode: CardMode) => {
                                        const active = selectedCardModes.has(mode);
                                        return (
                                            <button
                                                key={mode}
                                                type="button"
                                                onClick={() => toggleCardMode(mode)}
                                                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                                                    active
                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                        : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200'
                                                }`}
                                            >
                                                {modeLabel(mode)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                    disabled={addingCards}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    disabled={addingCards}
                                >
                                    {addingCards ? 'Adicionando...' : 'Adicionar cards'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SimulationDetails;

