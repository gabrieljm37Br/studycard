import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { parseNotebookLMCSV, validateCSVContent, ParsedCard } from '../services/csvParser';
import { CardMode, FeedbackStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface CSVImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportComplete: (count: number) => void;
    preselectedDeckId?: string;
}

const CSVImportModal: React.FC<CSVImportModalProps> = ({
    isOpen,
    onClose,
    onImportComplete,
    preselectedDeckId,
}) => {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [parsedCards, setParsedCards] = useState<ParsedCard[]>([]);
    const [selectedDeckId, setSelectedDeckId] = useState<string>(preselectedDeckId || '');
    const [newDeckName, setNewDeckName] = useState('');
    const [isCreatingNewDeck, setIsCreatingNewDeck] = useState(false);
    const [availableDecks, setAvailableDecks] = useState<{ id: string; name: string }[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'upload' | 'preview'>('upload');

    React.useEffect(() => {
        if (isOpen && user) {
            loadDecks();
        }
    }, [isOpen, user]);

    React.useEffect(() => {
        if (preselectedDeckId) {
            setSelectedDeckId(preselectedDeckId);
        }
    }, [preselectedDeckId]);

    const loadDecks = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('decks')
                .select('id, name')
                .eq('user_id', user.id)
                .order('name', { ascending: true });

            if (error) throw error;
            setAvailableDecks(data || []);
        } catch (err) {
            console.error('Error loading decks:', err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.csv')) {
                setError('Por favor, selecione um arquivo CSV válido');
                return;
            }
            setFile(selectedFile);
            setError(null);
            parseFile(selectedFile);
        }
    };

    const parseFile = async (file: File) => {
        try {
            const text = await file.text();

            // Validate CSV content
            const validation = validateCSVContent(text);
            if (!validation.valid) {
                setError(validation.error || 'Arquivo CSV inválido');
                setParsedCards([]);
                return;
            }

            // Parse CSV
            const cards = parseNotebookLMCSV(text);

            if (cards.length === 0) {
                setError('Nenhum flashcard válido encontrado no arquivo');
                setParsedCards([]);
                return;
            }

            setParsedCards(cards);
            setStep('preview');
        } catch (err) {
            console.error('Error parsing CSV:', err);
            setError('Erro ao processar o arquivo CSV');
            setParsedCards([]);
        }
    };

    const handleImport = async () => {
        if (!user || parsedCards.length === 0) return;

        let targetDeckId = selectedDeckId;

        // Create new deck if needed
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
            // Prepare flashcards for insertion
            const flashcardsToInsert = parsedCards.map(card => ({
                user_id: user.id,
                deck_id: targetDeckId,
                mode: card.type,
                question: card.front,
                answer: card.back,
                feedback: FeedbackStatus.Unseen,
                interval: 0,
                repetition: 0,
                ease_factor: 2.5,
            }));

            // Batch insert
            const { error: insertError } = await supabase
                .from('flashcards')
                .insert(flashcardsToInsert);

            if (insertError) throw insertError;

            // Success!
            onImportComplete(parsedCards.length);
            handleClose();
        } catch (err) {
            console.error('Error importing flashcards:', err);
            setError('Erro ao importar flashcards. Tente novamente.');
        } finally {
            setIsImporting(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setParsedCards([]);
        setSelectedDeckId(preselectedDeckId || '');
        setNewDeckName('');
        setIsCreatingNewDeck(false);
        setError(null);
        setStep('upload');
        onClose();
    };

    const getCardTypeLabel = (type: CardMode): string => {
        switch (type) {
            case CardMode.FillInTheBlank:
                return 'Lacunas';
            case CardMode.QA:
                return 'Pergunta e Resposta';
            default:
                return type;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-700">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                Importar CSV do NotebookLM
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {step === 'upload' ? 'Selecione um arquivo CSV' : `${parsedCards.length} flashcards encontrados`}
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                            disabled={isImporting}
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200">
                            {error}
                        </div>
                    )}

                    {step === 'upload' && (
                        <div className="space-y-6">
                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Arquivo CSV
                                </label>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Formato esperado: 2 colunas (Frente, Verso) sem cabeçalho
                                </p>
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                                    <span>ℹ️</span> Detecção Automática de Tipo
                                </h3>
                                <ul className="text-sm text-blue-700 dark:text-blue-100 space-y-1">
                                    <li>• Cards com <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">_____</code> → Preencher Lacunas</li>
                                    <li>• Cards sem underscores → Pergunta e Resposta</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="space-y-6">
                            {/* Deck Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Deck de Destino
                                </label>

                                <div className="flex items-center gap-3 mb-3">
                                    <button
                                        onClick={() => setIsCreatingNewDeck(false)}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${!isCreatingNewDeck
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        Deck Existente
                                    </button>
                                    <button
                                        onClick={() => setIsCreatingNewDeck(true)}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${isCreatingNewDeck
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        Criar Novo Deck
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

                            {/* Preview Table */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                    Preview dos Flashcards
                                </h3>
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Tipo</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Frente</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Verso</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedCards.map((card, index) => (
                                                <tr key={index} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${card.type === CardMode.FillInTheBlank
                                                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                            }`}>
                                                            {getCardTypeLabel(card.type)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-xs truncate">
                                                        {card.front}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                                                        {card.back}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                            {parsedCards.filter(c => c.type === CardMode.FillInTheBlank).length}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Lacunas</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            {parsedCards.filter(c => c.type === CardMode.QA).length}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Pergunta e Resposta</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex justify-between gap-3">
                    {step === 'preview' && (
                        <button
                            onClick={() => setStep('upload')}
                            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            disabled={isImporting}
                        >
                            ← Voltar
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
                                    <>
                                        Importar {parsedCards.length} Flashcards
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CSVImportModal;
