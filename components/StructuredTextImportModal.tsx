import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { CardMode, FeedbackStatus } from '../types';
import { parseAnkiTxtFile, validateAnkiTxtContent, type ParsedAnkiCard } from '../services/ankiTxtParser';

interface StructuredTextImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportComplete: (count: number) => void;
    preselectedDeckId?: string;
}

const StructuredTextImportModal: React.FC<StructuredTextImportModalProps> = ({
    isOpen,
    onClose,
    onImportComplete,
    preselectedDeckId,
}) => {
    const { user } = useAuth();
    const [rawText, setRawText] = useState('');
    const [parsedCards, setParsedCards] = useState<ParsedAnkiCard[]>([]);
    const [selectedDeckId, setSelectedDeckId] = useState(preselectedDeckId || '');
    const [newDeckName, setNewDeckName] = useState('');
    const [isCreatingNewDeck, setIsCreatingNewDeck] = useState(false);
    const [availableDecks, setAvailableDecks] = useState<{ id: string; name: string }[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'paste' | 'preview'>('paste');

    useEffect(() => {
        if (isOpen && user) {
            loadDecks();
        }
    }, [isOpen, user]);

    useEffect(() => {
        if (preselectedDeckId) {
            setSelectedDeckId(preselectedDeckId);
        }
    }, [preselectedDeckId]);

    const loadDecks = async () => {
        if (!user) return;

        try {
            const { data, error: decksError } = await supabase
                .from('decks')
                .select('id, name')
                .eq('user_id', user.id)
                .order('name', { ascending: true });

            if (decksError) throw decksError;
            setAvailableDecks(data || []);
        } catch (err) {
            console.error('Error loading decks:', err);
        }
    };

    const resetState = () => {
        setRawText('');
        setParsedCards([]);
        setSelectedDeckId(preselectedDeckId || '');
        setNewDeckName('');
        setIsCreatingNewDeck(false);
        setError(null);
        setStep('paste');
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleParse = () => {
        if (!rawText.trim()) {
            setError('Cole o texto estruturado para continuar');
            return;
        }

        const validation = validateAnkiTxtContent(rawText);
        if (!validation.valid) {
            setError(validation.error || 'Texto inv\u00e1lido');
            setParsedCards([]);
            return;
        }

        const cards = parseAnkiTxtFile(rawText);
        if (cards.length === 0) {
            setError('Nenhum flashcard v\u00e1lido encontrado');
            setParsedCards([]);
            return;
        }

        setParsedCards(cards);
        setError(null);
        setStep('preview');
    };

    const mapCardToInsert = (card: ParsedAnkiCard, targetDeckId: string) => {
        const base = {
            user_id: user!.id,
            deck_id: targetDeckId,
            mode: card.type,
            feedback: FeedbackStatus.Unseen,
            interval: 0,
            repetition: 0,
            ease_factor: 2.5,
            tags: card.tags || [],
        };

        switch (card.type) {
            case CardMode.QA:
                return { ...base, question: card.front, answer: card.back, explanation: card.explanation || null };
            case CardMode.FillInTheBlank:
                return { ...base, question: card.front, answer: card.back, explanation: card.explanation || null };
            case CardMode.TrueFalse:
                return {
                    ...base,
                    statement: card.front,
                    is_true: card.isTrue ?? null,
                    explanation: card.explanation || card.back || null,
                };
            case CardMode.MultipleChoice:
                return {
                    ...base,
                    question: card.front,
                    options: card.options || [],
                    correct_answer_index: card.correctAnswerIndex ?? 0,
                    explanation: card.explanation || card.back || null,
                };
            case CardMode.PracticalExample:
                return {
                    ...base,
                    problem: card.problem || card.front,
                    question: card.practicalQuestion || card.problem || card.solution || card.back || '',
                    solution: card.solution || card.back,
                    explanation: card.explanation || null,
                };
            case CardMode.Dictionary:
                return {
                    ...base,
                    question: card.front,
                    answer: card.back,
                    explanation: card.explanation || null,
                };
            default:
                return {
                    ...base,
                    question: card.front,
                    answer: card.back,
                };
        }
    };

    const handleImport = async () => {
        if (!user || parsedCards.length === 0) return;

        let targetDeckId = selectedDeckId;

        if (isCreatingNewDeck && newDeckName.trim()) {
            try {
                const { data: newDeck, error: deckError } = await supabase
                    .from('decks')
                    .insert({
                        user_id: user.id,
                        name: newDeckName.trim(),
                        parent_id: null,
                    })
                    .select()
                    .single();

                if (deckError) throw deckError;
                targetDeckId = newDeck.id;
            } catch (err) {
                console.error('Error creating deck:', err);
                setError('Erro ao criar novo deck');
                return;
            }
        }

        if (!targetDeckId) {
            setError('Por favor, selecione ou crie um deck');
            return;
        }

        setIsImporting(true);
        setError(null);

        try {
            const flashcardsToInsert = parsedCards.map(card => mapCardToInsert(card, targetDeckId!));
            const { error: insertError } = await supabase.from('flashcards').insert(flashcardsToInsert);
            if (insertError) throw insertError;

            onImportComplete(parsedCards.length);
            handleClose();
        } catch (err) {
            console.error('Error importing flashcards:', err);
            setError('Erro ao importar flashcards. Tente novamente.');
        } finally {
            setIsImporting(false);
        }
    };

    const getCardTypeLabel = (type: CardMode): string => {
        switch (type) {
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
                return type;
        }
    };

    const renderCardBack = (card: ParsedAnkiCard) => {
        if (card.type === CardMode.TrueFalse) {
            return card.isTrue ? 'Verdadeiro' : 'Falso';
        }

        if (card.type === CardMode.MultipleChoice && card.options && card.options.length > 0) {
            const index = card.correctAnswerIndex ?? 0;
            return `Correta: ${card.options[index] || '(opcao nao encontrada)'}`;
        }

        return card.back;
    };

    const typeCounts = parsedCards.reduce<Record<string, number>>((acc, card) => {
        acc[card.type] = (acc[card.type] || 0) + 1;
        return acc;
    }, {});

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-700">
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Colar texto estruturado</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {step === 'paste'
                                    ? 'Cole o conteudo seguindo as palavras-chave para detectar o tipo do card'
                                    : `${parsedCards.length} flashcards reconhecidos`}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => window.open('/help', '_blank')}
                                className="px-3 py-1.5 text-sm font-semibold rounded-md border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                            >
                                Central de Ajuda
                            </button>
                            <button
                                onClick={handleClose}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                                disabled={isImporting}
                            >
                                ×
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200">
                            {error}
                        </div>
                    )}

                    {step === 'paste' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Cole aqui seu texto estruturado
                                </label>
                                <textarea
                                    value={rawText}
                                    onChange={(e) => setRawText(e.target.value)}
                                    rows={10}
                                    className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                    placeholder="Exemplo:\nPergunta: ...\nResposta: ...\nExplicacao: ...\nTags: ..."
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Use o mesmo padrao aceito pelo importador TXT (Pergunta:, Resposta:, Certo ou Errado:, Dicionario:, Situacao Problema:, etc.).
                                </p>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={handleParse}
                                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                                >
                                    Analisar texto
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {Object.entries(typeCounts).map(([type, count]) => (
                                    <div
                                        key={type}
                                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                                    >
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Tipo</div>
                                        <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{getCardTypeLabel(type as CardMode)}</div>
                                        <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{count}</div>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Deck de destino
                                </label>

                                <div className="flex items-center gap-3 mb-3">
                                    <button
                                        onClick={() => setIsCreatingNewDeck(false)}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${!isCreatingNewDeck
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        Deck existente
                                    </button>
                                    <button
                                        onClick={() => setIsCreatingNewDeck(true)}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${isCreatingNewDeck
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        Criar novo deck
                                    </button>
                                </div>

                                {isCreatingNewDeck ? (
                                    <input
                                        type="text"
                                        value={newDeckName}
                                        onChange={(e) => setNewDeckName(e.target.value)}
                                        placeholder="Nome do novo deck"
                                        className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                    />
                                ) : (
                                    <select
                                        value={selectedDeckId}
                                        onChange={(e) => setSelectedDeckId(e.target.value)}
                                        className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                    >
                                        <option value="">Selecione um deck</option>
                                        {availableDecks.map(deck => (
                                            <option key={deck.id} value={deck.id}>
                                                {deck.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Preview dos flashcards</h3>
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                    {parsedCards.map((card, index) => (
                                        <div
                                            key={`${card.front}-${index}`}
                                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50/60 dark:bg-gray-800/60"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200">
                                                    {getCardTypeLabel(card.type)}
                                                </span>
                                                {card.explanation && (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">Com explicacao</span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-700 dark:text-gray-200">
                                                <div className="font-semibold mb-1">Frente</div>
                                                <div className="line-clamp-2 whitespace-pre-wrap">{card.front}</div>
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                                <div className="font-semibold mb-1">
                                                    {card.type === CardMode.TrueFalse ? 'Resposta esperada' : 'Verso'}
                                                </div>
                                                <div className="line-clamp-2 whitespace-pre-wrap">{renderCardBack(card)}</div>
                                            </div>
                                            {card.options && card.options.length > 0 && (
                                                <div className="mt-3 text-sm text-gray-700 dark:text-gray-200">
                                                    <div className="font-semibold mb-1">Alternativas</div>
                                                    <ul className="list-disc list-inside space-y-1">
                                                        {card.options.map((opt, idx) => (
                                                            <li key={idx} className={idx === card.correctAnswerIndex ? 'font-semibold text-green-700 dark:text-green-300' : ''}>
                                                                {opt}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex justify-between gap-3">
                    {step === 'preview' && (
                        <button
                            onClick={() => setStep('paste')}
                            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            disabled={isImporting}
                        >
                            Voltar
                        </button>
                    )}

                    <div className="flex gap-3 ml-auto">
                        <button
                            onClick={handleClose}
                            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            disabled={isImporting}
                        >
                            Cancelar
                        </button>

                        {step === 'preview' && (
                            <button
                                onClick={handleImport}
                                disabled={isImporting || (!selectedDeckId && !isCreatingNewDeck) || (isCreatingNewDeck && !newDeckName.trim())}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isImporting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Importando...
                                    </>
                                ) : (
                                    <>Importar {parsedCards.length} flashcards</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StructuredTextImportModal;

