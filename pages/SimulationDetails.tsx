import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import type { Simulation, SimulationItem } from '../types';
import { CardMode } from '../types';

const SimulationDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [simulation, setSimulation] = useState<Simulation | null>(null);
    const [items, setItems] = useState<SimulationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && id) {
            loadSimulationDetails();
        }
    }, [user, id]);

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

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Carregando...</div>;
    }

    if (!simulation) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Simulado não encontrado.</div>;
    }

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
                                    className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                                >
                                    ← Voltar
                                </button>
                                <span className="text-gray-300 dark:text-gray-600">|</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(simulation.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{simulation.title}</h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                {items.length} questões
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/study', { state: { simulationId: simulation.id } })}
                            className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            ▶ Iniciar Simulado
                        </button>
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
        </div>
    );
};

export default SimulationDetails;
