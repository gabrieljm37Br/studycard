import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { Deck, Simulation } from '../types';
import { CardMode } from '../types';

const SimulatedMode: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [simulations, setSimulations] = useState<Simulation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create Modal State
    const [newSimTitle, setNewSimTitle] = useState('');
    const [selectedDeckIds, setSelectedDeckIds] = useState<Set<string>>(new Set());
    const [questionCount, setQuestionCount] = useState<number>(10);
    const [availableDecks, setAvailableDecks] = useState<Deck[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedCardModes, setSelectedCardModes] = useState<Set<CardMode>>(new Set(Object.values(CardMode)));

    useEffect(() => {
        if (user) {
            loadSimulations();
            loadDecks();
        }
    }, [user]);

    const loadSimulations = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('simulations')
                .select('*, simulation_items(count)')
                .eq('user_id', user!.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedSimulations = data?.map(sim => ({
                ...sim,
                item_count: sim.simulation_items[0]?.count || 0
            })) || [];

            setSimulations(formattedSimulations);
        } catch (error) {
            console.error('Error loading simulations:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDecks = async () => {
        try {
            const { data, error } = await supabase
                .from('decks')
                .select('*')
                .eq('user_id', user!.id);

            if (error) throw error;
            setAvailableDecks(data || []);
        } catch (error) {
            console.error('Error loading decks:', error);
        }
    };

    const handleCreateSimulation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSimTitle.trim() || selectedDeckIds.size === 0 || selectedCardModes.size === 0) return;

        setIsCreating(true);
        try {
            // 1. Create Simulation
            const { data: simData, error: simError } = await supabase
                .from('simulations')
                .insert({
                    user_id: user!.id,
                    title: newSimTitle.trim()
                })
                .select()
                .single();

            if (simError) throw simError;

            // 2. Fetch Flashcards from selected decks
            // We need to get all flashcards from the selected decks (and potentially subdecks if we wanted to be fancy, but let's stick to direct selection for now or recursive if easy)
            // Let's stick to direct deck selection for simplicity first, or fetch all cards where deck_id IN selectedDeckIds

            const { data: cards, error: cardsError } = await supabase
                .from('flashcards')
                .select('id')
                .in('deck_id', Array.from(selectedDeckIds))
                .in('mode', Array.from(selectedCardModes));

            if (cardsError) throw cardsError;

            if (!cards || cards.length === 0) {
                throw new Error('Nenhum flashcard encontrado nos decks selecionados.');
            }

            // 3. Randomize and Limit
            const shuffled = cards.sort(() => 0.5 - Math.random());
            const selectedCards = shuffled.slice(0, questionCount);

            // 4. Insert Simulation Items
            const itemsToInsert = selectedCards.map(card => ({
                simulation_id: simData.id,
                flashcard_id: card.id
            }));

            const { error: itemsError } = await supabase
                .from('simulation_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;

            // Success
            setShowCreateModal(false);
            setNewSimTitle('');
            setSelectedDeckIds(new Set());
            setSelectedCardModes(new Set(Object.values(CardMode)));
            setQuestionCount(10);
            loadSimulations();

        } catch (error: any) {
            console.error('Error creating simulation:', error);
            alert(`Erro ao criar simulado: ${error.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteSimulation = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este simulado?')) return;

        try {
            const { error } = await supabase
                .from('simulations')
                .delete()
                .eq('id', id);

            if (error) throw error;
            loadSimulations();
        } catch (error) {
            console.error('Error deleting simulation:', error);
        }
    };

    const toggleDeckSelection = (deckId: string) => {
        const newSelection = new Set(selectedDeckIds);
        if (newSelection.has(deckId)) {
            newSelection.delete(deckId);
        } else {
            newSelection.add(deckId);
        }
        setSelectedDeckIds(newSelection);
    };

    const toggleCardMode = (mode: CardMode) => {
        const newSelection = new Set(selectedCardModes);
        if (newSelection.has(mode)) {
            newSelection.delete(mode);
        } else {
            newSelection.add(mode);
        }
        setSelectedCardModes(newSelection);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Modo Simulado</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Crie e gerencie seus simulados personalizados</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Voltar
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md"
                        >
                            + Novo Simulado
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center p-10 text-gray-500">Carregando simulados...</div>
                ) : simulations.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-10 text-center shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Nenhum simulado criado</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Crie seu primeiro simulado combinando flashcards de diferentes decks.</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                        >
                            Criar Simulado Agora
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {simulations.map(sim => (
                            <div key={sim.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{sim.title}</h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                        <span className="flex items-center gap-1">
                                            📅 {new Date(sim.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            ❓ {sim.item_count} questões
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <button
                                        onClick={() => navigate('/study', { state: { simulationId: sim.id } })}
                                        className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
                                    >
                                        ▶ Iniciar
                                    </button>
                                    <button
                                        onClick={() => navigate(`/simulation/${sim.id}`)}
                                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                                    >
                                        Detalhes
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSimulation(sim.id)}
                                        className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                        title="Excluir"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Novo Simulado</h2>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                <form id="create-sim-form" onSubmit={handleCreateSimulation} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Nome do Simulado
                                        </label>
                                        <input
                                            type="text"
                                            value={newSimTitle}
                                            onChange={(e) => setNewSimTitle(e.target.value)}
                                            placeholder="Ex: Revisão de História, Simulado Geral..."
                                            className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-indigo-500 dark:focus:border-indigo-400 bg-transparent dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Quantidade de Questões
                                        </label>
                                        <input
                                            type="number"
                                            value={questionCount}
                                            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                                            min="1"
                                            max="100"
                                            className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-indigo-500 dark:focus:border-indigo-400 bg-transparent dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Tipos de Flashcards
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {Object.values(CardMode).map((mode) => (
                                                <div
                                                    key={mode}
                                                    onClick={() => toggleCardMode(mode)}
                                                    className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 transition-colors border ${selectedCardModes.has(mode)
                                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700'
                                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600'
                                                        }`}
                                                >
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedCardModes.has(mode)
                                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                                        : 'border-gray-400'
                                                        }`}>
                                                        {selectedCardModes.has(mode) && '✓'}
                                                    </div>
                                                    <span className="text-gray-800 dark:text-gray-200 text-sm">
                                                        {mode === CardMode.QA ? 'Pergunta e Resposta' :
                                                            mode === CardMode.TrueFalse ? 'Verdadeiro ou Falso' :
                                                                mode === CardMode.MultipleChoice ? 'Múltipla Escolha' :
                                                                    mode === CardMode.PracticalExample ? 'Exemplo Prático' :
                                                                        mode === CardMode.FillInTheBlank ? 'Lacunas' : mode}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Selecione os Decks ({selectedDeckIds.size} selecionados)
                                        </label>
                                        <div className="border-2 border-gray-200 dark:border-gray-600 rounded-lg max-h-60 overflow-y-auto p-2 space-y-1">
                                            {availableDecks.length === 0 ? (
                                                <p className="text-gray-500 p-4 text-center">Nenhum deck disponível.</p>
                                            ) : (
                                                availableDecks.map(deck => (
                                                    <div
                                                        key={deck.id}
                                                        onClick={() => toggleDeckSelection(deck.id)}
                                                        className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${selectedDeckIds.has(deck.id)
                                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700'
                                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                                                            }`}
                                                    >
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedDeckIds.has(deck.id)
                                                            ? 'bg-indigo-600 border-indigo-600 text-white'
                                                            : 'border-gray-400'
                                                            }`}>
                                                            {selectedDeckIds.has(deck.id) && '✓'}
                                                        </div>
                                                        <span className="text-gray-800 dark:text-gray-200">{deck.name}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    form="create-sim-form"
                                    disabled={isCreating || !newSimTitle.trim() || selectedDeckIds.size === 0 || selectedCardModes.size === 0}
                                    className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isCreating ? (
                                        <>
                                            <span className="animate-spin">⏳</span> Criando...
                                        </>
                                    ) : (
                                        'Criar Simulado'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SimulatedMode;
