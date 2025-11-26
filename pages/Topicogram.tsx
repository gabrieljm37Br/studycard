import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getTopicogramDecks, TopicogramDeck } from '../services/deckService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, BookOpen, Play, TrendingUp } from 'lucide-react';

const Topicogram: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [decks, setDecks] = useState<TopicogramDeck[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            loadTopicogram();
        }
    }, [user]);

    const loadTopicogram = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getTopicogramDecks(user!.id);
            setDecks(data);
        } catch (err) {
            console.error('Error loading topicogram:', err);
            setError('Erro ao carregar a Linha do Tempo. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const formatRelativeTime = (timestamp: string): string => {
        try {
            return formatDistanceToNow(new Date(timestamp), {
                addSuffix: true,
                locale: ptBR
            });
        } catch (err) {
            return 'data inválida';
        }
    };

    const handleStudy = (deckId: string) => {
        navigate(`/study?deck=${deckId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="font-medium text-gray-600 dark:text-gray-400">Carregando Linha do Tempo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
            {/* Header */}
            <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-md">
                <div className="max-w-6xl mx-auto w-full px-4 py-6 md:px-6 md:py-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3 md:gap-4 text-center md:text-left">
                            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs uppercase tracking-widest text-white/80">Linha do Tempo</p>
                                <h1 className="text-3xl font-bold leading-tight">Linha do Tempo</h1>
                                <p className="text-white/80 text-sm">Sua jornada de estudos em ordem cronológica.</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full sm:w-auto px-4 py-2 bg-white text-indigo-700 hover:shadow-lg rounded-lg text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span>{'\u21a9'}</span>
                                <span>Voltar</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 py-8">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
                    </div>
                )}

                {decks.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-20 px-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-xl border border-gray-200 dark:border-gray-700 max-w-2xl text-center">
                            <div className="mb-6">
                                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full mb-4">
                                    <Clock className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                                Sua Linha do Tempo está vazia
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                                A <strong>Linha do Tempo</strong> mostra os decks que você estudou recentemente,
                                organizados do mais recente para o mais antigo. É uma forma visual de acompanhar seu progresso e manter
                                a consistência nos estudos.
                            </p>
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-6 mb-6">
                                <h3 className="font-bold text-indigo-800 dark:text-indigo-200 mb-3 flex items-center justify-center gap-2">
                                    <span>💡</span> Como funciona?
                                </h3>
                                <ul className="text-left text-sm text-indigo-700 dark:text-indigo-300 space-y-2">
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 dark:text-indigo-400 mt-0.5">✓</span>
                                        <span>Estude qualquer deck do seu Dashboard</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 dark:text-indigo-400 mt-0.5">✓</span>
                                        <span>Ele aparecerá automaticamente aqui com a data do estudo</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 dark:text-indigo-400 mt-0.5">✓</span>
                                        <span>Os decks mais recentes ficam no topo da lista</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-indigo-600 dark:text-indigo-400 mt-0.5">✓</span>
                                        <span>Você pode estudar novamente com um clique!</span>
                                    </li>
                                </ul>
                            </div>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-none rounded-xl cursor-pointer font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                Ir para o Dashboard
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Timeline */
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                Linha do Tempo de Estudos
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {decks.length} {decks.length === 1 ? 'deck estudado' : 'decks estudados'}
                            </p>
                        </div>

                        <div className="relative">
                            {/* Timeline connector line */}
                            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 via-purple-200 to-transparent dark:from-indigo-800 dark:via-purple-800"></div>

                            {/* Timeline items */}
                            <div className="space-y-6">
                                {decks.map((deck, index) => (
                                    <div
                                        key={deck.id}
                                        className="relative pl-20 group"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        {/* Timeline dot */}
                                        <div className="absolute left-6 top-6 w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full border-4 border-white dark:border-gray-900 shadow-lg group-hover:scale-125 transition-transform z-10"></div>

                                        {/* Card */}
                                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 group-hover:translate-x-2">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                                            {deck.name}
                                                        </h3>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="w-4 h-4" />
                                                            <span className="font-medium">
                                                                {formatRelativeTime(deck.last_studied_at)}
                                                            </span>
                                                        </div>
                                                        {deck.flashcard_count !== undefined && (
                                                            <div className="flex items-center gap-1.5">
                                                                <span>📚</span>
                                                                <span>
                                                                    {deck.flashcard_count} {deck.flashcard_count === 1 ? 'flashcard' : 'flashcards'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleStudy(deck.id)}
                                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-none rounded-lg cursor-pointer font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                                                >
                                                    <Play className="w-4 h-4" />
                                                    Estudar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer hint */}
                        <div className="mt-12 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                                💡 Dica: Continue estudando para manter sua Linha do Tempo atualizada!
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Topicogram;
