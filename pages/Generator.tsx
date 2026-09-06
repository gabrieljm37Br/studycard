import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { generateFlashcards, generateFlashcardsWithSearch, parseTextFile, parseCsvFile, interpretAndClassifyFlashcards } from '../services/geminiService';
import { CardMode } from '../types';
import CSVImportModal from '../components/CSVImportModal';
import AnkiTxtImportModal from '../components/AnkiTxtImportModal';
import StructuredTextImportModal from '../components/StructuredTextImportModal';
import { FileDown, ClipboardList, Table } from 'lucide-react';
import { useFlashcardGenerator } from '../hooks/useFlashcardGenerator';
import { ManualCardForm } from '../components/generator/ManualCardForm';

const Generator: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const deckId = (location.state as any)?.deckId || null;

    const [showCSVImport, setShowCSVImport] = React.useState(false);
    const [showAnkiImport, setShowAnkiImport] = React.useState(false);
    const [showStructuredImport, setShowStructuredImport] = React.useState(false);

    const {
        inputType,
        setInputType,
        topic,
        setTopic,
        text,
        setText,
        file,
        setFile,
        mode,
        setMode,
        isGenerating,
        setIsGenerating,
        isParsing,
        setIsParsing,
        error,
        setError,
        decks,
        setDecks,
        selectedDeckId,
        setSelectedDeckId,
        isCreatingNewDeck,
        setIsCreatingNewDeck,
        newDeckName,
        setNewDeckName,
        tags,
        setTags,
        manualCards,
        manualFormData,
        setManualFormData,
        addManualCard,
        deleteManualCard,
        parsePdf,
        parseFile
    } = useFlashcardGenerator({ user, initialDeckId: deckId });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsGenerating(true);

        try {
            let textToGenerate = '';
            let generatedCards;
            let createdDeckName: string | null = null;

            if (inputType === 'topic') {
                textToGenerate = topic;
            } else if (inputType === 'text') {
                textToGenerate = text;
            } else if (inputType === 'pdf' && file) {
                setIsParsing(true);
                textToGenerate = await parsePdf(file);
                setIsParsing(false);
            } else if (inputType === 'file' && file) {
                setIsParsing(true);
                const fileContent = await parseFile(file);
                const fileName = file.name.toLowerCase();
                let records: string[];
                if (fileName.endsWith('.txt')) {
                    records = parseTextFile(fileContent);
                } else if (fileName.endsWith('.csv')) {
                    records = parseCsvFile(fileContent);
                } else {
                    throw new Error('Apenas arquivos .txt e .csv são suportados.');
                }
                generatedCards = await interpretAndClassifyFlashcards(records);
                setIsParsing(false);
            } else if (inputType === 'manual') {
                if (manualCards.length === 0) {
                    throw new Error('Por favor, adicione pelo menos um flashcard antes de salvar.');
                }
                generatedCards = manualCards;
            }

            if (!textToGenerate.trim() && !generatedCards) {
                throw new Error('Por favor, forneça conteúdo para gerar flashcards.');
            }

            let targetDeckId = selectedDeckId;
            if (isCreatingNewDeck) {
                if (!newDeckName.trim()) {
                    throw new Error('Por favor, digite um nome para o novo deck.');
                }
                const { data: newDeck, error: deckError } = await supabase
                    .from('decks')
                    .insert({
                        user_id: user!.id,
                        name: newDeckName.trim(),
                        parent_id: null
                    })
                    .select()
                    .single();
                if (deckError) throw deckError;
                targetDeckId = newDeck.id;
                createdDeckName = newDeck.name;
                setDecks(prev => [newDeck, ...prev]);
                setSelectedDeckId(newDeck.id);
                setIsCreatingNewDeck(false);
                setNewDeckName('');
            } else if (!targetDeckId) {
                throw new Error('Por favor, selecione um deck existente ou crie um novo deck antes de gerar os flashcards.');
            }

            if (!generatedCards) {
                generatedCards = inputType === 'topic'
                    ? await generateFlashcardsWithSearch(topic, mode)
                    : await generateFlashcards(textToGenerate, mode);
            }

            if (generatedCards.length === 0) {
                throw new Error('Não foram encontrados conceitos para criar flashcards.');
            }

            const tagsArray = tags.trim()
                ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                : [];

            const cardsToInsert = generatedCards.map(card => ({
                user_id: user!.id,
                deck_id: targetDeckId,
                mode: card.mode,
                feedback: card.feedback,
                question: card.mode === CardMode.QA || card.mode === CardMode.MultipleChoice || card.mode === CardMode.FillInTheBlank
                    ? (card as any).question
                    : card.mode === CardMode.Dictionary
                        ? (card as any).term
                        : card.mode === CardMode.PracticalExample
                            ? (card as any).question
                            : null,
                answer: card.mode === CardMode.QA || card.mode === CardMode.FillInTheBlank
                    ? (card as any).answer
                    : card.mode === CardMode.Dictionary
                        ? (card as any).definition
                        : null,
                statement: card.mode === CardMode.TrueFalse ? (card as any).statement : null,
                is_true: card.mode === CardMode.TrueFalse ? (card as any).isTrue : null,
                explanation: card.mode === CardMode.TrueFalse || card.mode === CardMode.MultipleChoice ? (card as any).explanation : null,
                options: card.mode === CardMode.MultipleChoice ? (card as any).options : null,
                correct_answer_index: card.mode === CardMode.MultipleChoice ? (card as any).correctAnswerIndex : null,
                problem: card.mode === CardMode.PracticalExample ? (card as any).problem : null,
                solution: card.mode === CardMode.PracticalExample ? (card as any).solution : null,
                sources: (card as any).sources || [],
                tags: (card as any).tags || tagsArray
            }));

            const { error: insertError } = await supabase
                .from('flashcards')
                .insert(cardsToInsert);
            if (insertError) throw insertError;

            const successMessage = createdDeckName
                ? `Deck "${createdDeckName}" criado com ${generatedCards.length} flashcards!`
                : `${generatedCards.length} flashcards criados com sucesso!`;

            navigate('/dashboard', { state: { message: successMessage } });
        } catch (err: any) {
            setError(err.message || 'Erro ao gerar flashcards.');
        } finally {
            setIsGenerating(false);
            setIsParsing(false);
        }
    };

    const buttonDisabled = isGenerating || isParsing ||
        (inputType === 'topic' && !topic.trim()) ||
        (inputType === 'text' && !text.trim()) ||
        ((inputType === 'pdf' || inputType === 'file') && !file) ||
        (inputType === 'manual' && manualCards.length === 0) ||
        (!selectedDeckId && !isCreatingNewDeck) ||
        (isCreatingNewDeck && !newDeckName.trim());

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
            <div className="max-w-3xl mx-auto px-4 py-10">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-10 shadow-lg border border-gray-100 dark:border-gray-700">
                    {/* Quick Import Buttons */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8">
                        <button
                            onClick={() => setShowAnkiImport(true)}
                            className="w-full md:w-auto px-4 py-3 bg-indigo-50 border-2 border-indigo-100 text-indigo-700 hover:bg-indigo-100 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-100"
                        >
                            <FileDown className="w-4 h-4" aria-hidden />
                            <span>Importar TXT</span>
                        </button>
                        <button
                            onClick={() => setShowStructuredImport(true)}
                            className="w-full md:w-auto px-4 py-3 bg-indigo-50 border-2 border-indigo-100 text-indigo-700 hover:bg-indigo-100 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-100"
                        >
                            <ClipboardList className="w-4 h-4" aria-hidden />
                            <span>Colar texto estruturado</span>
                        </button>
                        <button
                            onClick={() => setShowCSVImport(true)}
                            className="w-full md:w-auto px-4 py-3 bg-indigo-50 border-2 border-indigo-100 text-indigo-700 hover:bg-indigo-100 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-100"
                        >
                            <Table className="w-4 h-4" aria-hidden />
                            <span>Importar CSV</span>
                        </button>
                    </div>

                    <h2 className="text-2xl font-bold mb-8 text-gray-800 dark:text-gray-100 text-center md:text-left">
                        Criar Flashcards com IA
                    </h2>

                    <form onSubmit={handleSubmit}>
                        {/* Deck Selector */}
                        <div className="mb-8">
                            <label className="block mb-3 font-semibold text-gray-700 dark:text-gray-300">Selecione o deck</label>
                            {!isCreatingNewDeck ? (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <select
                                        value={selectedDeckId || ''}
                                        onChange={(e) => setSelectedDeckId(e.target.value || null)}
                                        className="flex-1 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-white text-base outline-none focus:border-indigo-500 text-gray-800"
                                    >
                                        <option value="">Selecione um deck...</option>
                                        {decks.map(deck => (
                                            <option key={deck.id} value={deck.id}>{deck.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingNewDeck(true)}
                                        className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-sm transition-colors whitespace-nowrap"
                                    >
                                        + Criar Deck
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="text"
                                        value={newDeckName}
                                        onChange={(e) => setNewDeckName(e.target.value)}
                                        placeholder="Nome do novo deck..."
                                        className="flex-1 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 text-gray-800 dark:text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => { setIsCreatingNewDeck(false); setNewDeckName(''); }}
                                        className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 font-semibold rounded-xl shadow-sm transition-colors whitespace-nowrap"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Input Type Selector */}
                        <div className="mb-8">
                            <label className="block mb-4 font-semibold text-gray-700 dark:text-gray-300">Como você quer criar os flashcards?</label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {[
                                    { value: 'topic', label: '🤖 🔍 Tópico' },
                                    { value: 'text', label: '🤖 📝 Texto' },
                                    { value: 'pdf', label: '🤖 📄 PDF' },
                                    { value: 'file', label: '🤖 📁 Arquivo' },
                                    { value: 'manual', label: '✍️ Manual' }
                                ].map(({ value, label }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setInputType(value as any)}
                                        className={`py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                                            inputType === value
                                                ? 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-md'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input Controls */}
                        {inputType === 'topic' && (
                            <div className="mb-8 animate-fade-in">
                                <label className="block mb-3 font-semibold text-gray-700 dark:text-gray-300">Digite o tópico</label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="Ex: Fotossíntese, Segunda Guerra Mundial..."
                                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-base outline-none focus:border-indigo-500 bg-transparent dark:text-white"
                                />
                            </div>
                        )}

                        {inputType === 'text' && (
                            <div className="mb-8 animate-fade-in">
                                <label className="block mb-3 font-semibold text-gray-700 dark:text-gray-300">Cole o texto</label>
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Cole seu texto aqui..."
                                    rows={8}
                                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-base outline-none focus:border-indigo-500 bg-transparent dark:text-white resize-y"
                                />
                            </div>
                        )}

                        {(inputType === 'pdf' || inputType === 'file') && (
                            <div className="mb-8 animate-fade-in">
                                <label className="block mb-3 font-semibold text-gray-700 dark:text-gray-300">
                                    {inputType === 'pdf' ? 'Carregar PDF' : 'Carregar Arquivo (.txt ou .csv)'}
                                </label>
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center bg-gray-50 dark:bg-gray-800/50">
                                    <input
                                        type="file"
                                        accept={inputType === 'pdf' ? '.pdf' : '.txt,.csv'}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="generator-upload"
                                    />
                                    <label htmlFor="generator-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                        <span className="text-4xl">{inputType === 'pdf' ? '📄' : '📁'}</span>
                                        <span className="font-medium text-indigo-600 dark:text-indigo-400">Clique para selecionar o arquivo</span>
                                    </label>
                                </div>
                                {file && (
                                    <div className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                        <span>✅</span>
                                        <span className="font-medium truncate">{file.name}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {inputType === 'manual' && (
                            <ManualCardForm
                                mode={mode}
                                manualFormData={manualFormData}
                                setManualFormData={setManualFormData}
                                onAddCard={addManualCard}
                                manualCards={manualCards}
                                onDeleteCard={deleteManualCard}
                            />
                        )}

                        {/* Mode Selector for AI */}
                        {inputType !== 'file' && (
                            <div className="mb-8">
                                <label className="block mb-4 font-semibold text-gray-700 dark:text-gray-300">Tipo de Flashcard</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        { value: CardMode.QA, label: 'Pergunta e Resposta', icon: '❓' },
                                        { value: CardMode.TrueFalse, label: 'Verdadeiro ou Falso', icon: '✅' },
                                        { value: CardMode.MultipleChoice, label: 'Múltipla Escolha', icon: '🔢' },
                                        { value: CardMode.PracticalExample, label: 'Exemplo Prático', icon: '💡' },
                                        { value: CardMode.FillInTheBlank, label: 'Lacunas', icon: '📝' },
                                        { value: CardMode.Dictionary, label: 'Dicionário', icon: '📖' }
                                    ].map(({ value, label, icon }) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setMode(value)}
                                            className={`p-4 rounded-xl font-medium transition-all border-2 flex items-center gap-3 text-left ${
                                                mode === value
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                                                    : 'border-gray-200 dark:border-gray-700 bg-transparent text-gray-600 dark:text-gray-400'
                                            }`}
                                        >
                                            <span className="text-xl">{icon}</span>
                                            <span>{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tags Input */}
                        {inputType !== 'manual' && (
                            <div className="mb-8">
                                <label className="block mb-3 font-semibold text-gray-700 dark:text-gray-300">Tags (opcional)</label>
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="Ex: matemática, equações (separadas por vírgula)"
                                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-base outline-none focus:border-indigo-500 bg-transparent dark:text-white"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 mb-6 flex items-center gap-3">
                                <span>⚠️</span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={buttonDisabled}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white border-none rounded-xl text-lg font-bold cursor-pointer hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {isGenerating ? (
                                <>⏳ <span>Criando seus flashcards...</span></>
                            ) : isParsing ? (
                                <>📖 <span>Lendo arquivo...</span></>
                            ) : (
                                <>{inputType === 'manual' ? '💾 Salvar Flashcards' : '✨ Gerar Flashcards'}</>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            <StructuredTextImportModal
                isOpen={showStructuredImport}
                onClose={() => setShowStructuredImport(false)}
                onImportComplete={(count) => {
                    setShowStructuredImport(false);
                    navigate('/dashboard', { state: { message: `${count} flashcards importados com sucesso!` } });
                }}
                preselectedDeckId={selectedDeckId || undefined}
            />

            <CSVImportModal
                isOpen={showCSVImport}
                onClose={() => setShowCSVImport(false)}
                onImportComplete={(count) => {
                    setShowCSVImport(false);
                    navigate('/dashboard', { state: { message: `${count} flashcards importados com sucesso do CSV!` } });
                }}
                preselectedDeckId={selectedDeckId || undefined}
            />

            <AnkiTxtImportModal
                isOpen={showAnkiImport}
                onClose={() => setShowAnkiImport(false)}
                onImportComplete={(count) => {
                    setShowAnkiImport(false);
                    navigate('/dashboard', { state: { message: `${count} flashcards importados com sucesso do TXT do Anki!` } });
                }}
                preselectedDeckId={selectedDeckId || undefined}
            />
        </div>
    );
};

export default Generator;
