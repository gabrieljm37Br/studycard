import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { generateFlashcards, generateFlashcardsWithSearch, parseTextFile, parseCsvFile, interpretAndClassifyFlashcards } from '../services/geminiService';
import { CardMode } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
import CSVImportModal from '../components/CSVImportModal';
import AnkiTxtImportModal from '../components/AnkiTxtImportModal';
import { Home } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

const Generator: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const deckId = (location.state as any)?.deckId || null;

    const [inputType, setInputType] = useState<'topic' | 'text' | 'pdf' | 'file' | 'manual'>('text');
    const [topic, setTopic] = useState('');
    const [text, setText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [mode, setMode] = useState<CardMode>(CardMode.QA);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [error, setError] = useState('');
    const [decks, setDecks] = useState<{ id: string; name: string }[]>([]);
    const [selectedDeckId, setSelectedDeckId] = useState<string | null>(deckId);
    const [isCreatingNewDeck, setIsCreatingNewDeck] = useState(false);
    const [newDeckName, setNewDeckName] = useState('');
    const [showCSVImport, setShowCSVImport] = useState(false);
    const [showAnkiImport, setShowAnkiImport] = useState(false);
    const [tags, setTags] = useState<string>('');

    // Manual flashcard creation state
    const [manualCards, setManualCards] = useState<any[]>([]);
    const [manualFormData, setManualFormData] = useState<any>({
        // Q&A
        question: '',
        answer: '',
        // True/False
        statement: '',
        isTrue: true,
        explanation: '',
        // Multiple Choice
        options: ['', '', '', ''],
        correctAnswerIndex: 0,
        // Practical Example
        problem: '',
        solution: '',
        // Fill in the Blank
        sentence: '',
        correctAnswer: '',
        // Dictionary
        term: '',
        definition: '',
        // Tags
        tags: ''
    });

    useEffect(() => {
        const loadDecks = async () => {
            try {
                const { data, error } = await supabase
                    .from('decks')
                    .select('id, name')
                    .eq('user_id', user!.id)
                    .is('parent_id', null)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setDecks(data || []);
            } catch (error) {
                console.error('Error loading decks:', error);
            }
        };

        if (user) {
            loadDecks();
        }
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const parsePdf = async (fileToParse: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                if (!event.target?.result) {
                    return reject(new Error('Falha ao ler o arquivo.'));
                }
                try {
                    const pdf = await pdfjsLib.getDocument(event.target.result as ArrayBuffer).promise;
                    let fullText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
                        fullText += pageText + '\n\n';
                    }
                    resolve(fullText);
                } catch (error) {
                    console.error('Erro ao processar o PDF:', error);
                    reject(new Error('Não foi possível processar o arquivo PDF.'));
                }
            };
            reader.onerror = () => reject(new Error('Ocorreu um erro ao ler o arquivo.'));
            reader.readAsArrayBuffer(fileToParse);
        });
    };

    // Manual flashcard helper functions
    const addManualCard = () => {
        try {
            let newCard: any = {
                id: crypto.randomUUID(),
                mode: mode,
                feedback: 'unseen'
            };

            // Validate and build card based on mode
            switch (mode) {
                case CardMode.QA:
                    if (!manualFormData.question.trim() || !manualFormData.answer.trim()) {
                        throw new Error('Por favor, preencha a pergunta e a resposta.');
                    }
                    newCard.question = manualFormData.question.trim();
                    newCard.answer = manualFormData.answer.trim();
                    break;

                case CardMode.TrueFalse:
                    if (!manualFormData.statement.trim() || !manualFormData.explanation.trim()) {
                        throw new Error('Por favor, preencha a afirmação e a explicação.');
                    }
                    newCard.statement = manualFormData.statement.trim();
                    newCard.isTrue = manualFormData.isTrue;
                    newCard.explanation = manualFormData.explanation.trim();
                    break;

                case CardMode.MultipleChoice:
                    if (!manualFormData.question.trim() || !manualFormData.explanation.trim()) {
                        throw new Error('Por favor, preencha a pergunta e a explicação.');
                    }
                    const filledOptions = manualFormData.options.filter((opt: string) => opt.trim());
                    if (filledOptions.length < 2) {
                        throw new Error('Por favor, preencha pelo menos 2 opções.');
                    }
                    newCard.question = manualFormData.question.trim();
                    newCard.options = manualFormData.options.map((opt: string) => opt.trim());
                    newCard.correctAnswerIndex = manualFormData.correctAnswerIndex;
                    newCard.explanation = manualFormData.explanation.trim();
                    break;

                case CardMode.PracticalExample:
                    if (!manualFormData.problem.trim() || !manualFormData.question.trim() || !manualFormData.solution.trim()) {
                        throw new Error('Por favor, preencha o problema, a pergunta e a solução.');
                    }
                    newCard.problem = manualFormData.problem.trim();
                    newCard.question = manualFormData.question.trim();
                    newCard.solution = manualFormData.solution.trim();
                    newCard.sources = [];
                    break;

                case CardMode.FillInTheBlank:
                    if (!manualFormData.sentence.trim() || !manualFormData.correctAnswer.trim()) {
                        throw new Error('Por favor, preencha a frase e a resposta correta.');
                    }
                    if (!manualFormData.sentence.includes('____')) {
                        throw new Error('A frase deve conter ____ (quatro sublinhados) para indicar a lacuna.');
                    }
                    newCard.question = manualFormData.sentence.trim();
                    newCard.answer = manualFormData.correctAnswer.trim();
                    break;

                case CardMode.Dictionary:
                    if (!manualFormData.term.trim() || !manualFormData.definition.trim()) {
                        throw new Error('Por favor, preencha o termo e a definição.');
                    }
                    newCard.term = manualFormData.question.trim();
                    newCard.definition = manualFormData.definition.trim();
                    break;
            }

            // Process tags (common for all card types)
            if (manualFormData.tags.trim()) {
                newCard.tags = manualFormData.tags
                    .split(',')
                    .map((tag: string) => tag.trim())
                    .filter((tag: string) => tag.length > 0);
            }

            setManualCards(prev => [...prev, newCard]);
            resetManualForm();
            setError('');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const deleteManualCard = (cardId: string) => {
        setManualCards(prev => prev.filter(card => card.id !== cardId));
    };

    const resetManualForm = () => {
        setManualFormData({
            question: '',
            answer: '',
            statement: '',
            isTrue: true,
            explanation: '',
            options: ['', '', '', ''],
            correctAnswerIndex: 0,
            problem: '',
            solution: '',
            sentence: '',
            correctAnswer: '',
            term: '',
            definition: '',
            tags: ''
        });
    };

    const parseFile = async (fileToParse: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (!event.target?.result) {
                    return reject(new Error('Falha ao ler o arquivo.'));
                }
                resolve(event.target.result as string);
            };
            reader.onerror = () => reject(new Error('Ocorreu um erro ao ler o arquivo.'));
            reader.readAsText(fileToParse);
        });
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
                // Handle .txt and .csv files with AI interpretation
                setIsParsing(true);
                const fileContent = await parseFile(file);
                const fileName = file.name.toLowerCase();

                let records: string[];
                if (fileName.endsWith('.txt')) {
                    records = parseTextFile(fileContent);
                } else if (fileName.endsWith('.csv')) {
                    records = parseCsvFile(fileContent);
                } else {
                    throw new Error('Apenas arquivos .txt e .csv s\u00e3o suportados.');
                }

                // Use AI to interpret and classify flashcards
                generatedCards = await interpretAndClassifyFlashcards(records);
                setIsParsing(false);
            } else if (inputType === 'manual') {
                // Use manually created flashcards
                if (manualCards.length === 0) {
                    throw new Error('Por favor, adicione pelo menos um flashcard antes de salvar.');
                }
                generatedCards = manualCards;
            }

            if (!textToGenerate.trim() && !generatedCards) {
                throw new Error('Por favor, forne\u00e7a conte\u00fado para gerar flashcards.');
            }

            // Ensure we have a valid deck_id
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

            // Generate flashcards using AI (if not already generated from file)
            if (!generatedCards) {
                generatedCards = inputType === 'topic'
                    ? await generateFlashcardsWithSearch(topic, mode)
                    : await generateFlashcards(textToGenerate, mode);
            }

            if (generatedCards.length === 0) {
                throw new Error('N\u00e3o foram encontrados conceitos para criar flashcards.');
            }

            // Save to Supabase
            // Process tags from input
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

            // Calculate breakdown by mode for file uploads
            let successMessage = '';
            if (inputType === 'file') {
                const breakdown = generatedCards.reduce((acc, card) => {
                    acc[card.mode] = (acc[card.mode] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const breakdownText = Object.entries(breakdown)
                    .map(([mode, count]) => {
                        const modeNames: Record<string, string> = {
                            qa: 'Q&A',
                            true_false: 'Verdadeiro/Falso',
                            multiple_choice: 'Múltipla Escolha',
                            practical_example: 'Exemplo Prático',
                            fill_in_the_blank: 'Lacunas',
                            dictionary: 'Dicionário'
                        };
                        return `${count} ${modeNames[mode as keyof typeof modeNames] || mode}`;
                    })
                    .join(', ');

                successMessage = `${generatedCards.length} flashcards criados: ${breakdownText}`;
            } else {
                successMessage = createdDeckName
                    ? `Deck "${createdDeckName}" criado com ${generatedCards.length} flashcards!`
                    : `${generatedCards.length} flashcards criados com sucesso!`;
            }

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
            {/* Header */}
            <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-md">
                <div className="max-w-6xl mx-auto w-full px-4 py-6 md:px-6 md:py-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="text-center md:text-left space-y-1">
                            <p className="text-xs uppercase tracking-widest text-white/80">Gerador</p>
                            <h1 className="text-3xl font-bold leading-tight">Gerador de Flashcards</h1>
                            <p className="text-white/80 text-sm">Crie flashcards via texto, PDF, CSV ou digitação manual.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full md:w-auto">
                            <button
                                onClick={() => setShowAnkiImport(true)}
                                className="w-full sm:w-auto px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/25 rounded-lg text-white cursor-pointer text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                <span>{'\U0001f4c4'}</span>
                                <span>TXT Anki</span>
                            </button>
                            <button
                                onClick={() => setShowCSVImport(true)}
                                className="w-full sm:w-auto px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/25 rounded-lg text-white cursor-pointer text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                <span>{'\U0001f5c2'}</span>
                                <span>Importar CSV</span>
                            </button>
                            <button
                                onClick={() => navigate('/help')}
                                className="w-full sm:w-auto p-2.5 bg-white/15 hover:bg-white/25 border border-white/25 rounded-lg text-white cursor-pointer text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                title="Central de Ajuda"
                                aria-label="Abrir central de ajuda"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span className="hidden sm:inline">Ajuda</span>
                            </button>
                            <button
                                onClick={() => navigate('/home')}
                                className="w-full sm:w-auto px-4 py-2 bg-white text-indigo-700 hover:shadow-lg rounded-lg text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Home className="w-4 h-4" />
                                <span>Voltar</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto px-4 py-10">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-10 shadow-lg border border-gray-100 dark:border-gray-700">
                    <h2 className="text-2xl font-bold mb-8 text-gray-800 dark:text-gray-100 text-center md:text-left">
                        Criar Flashcards com IA
                    </h2>

                    <form onSubmit={handleSubmit}>
                        {/* Deck Selection */}
                        <div className="mb-8">
                            <label className="block mb-3 font-semibold text-gray-700 dark:text-gray-300">
                                Selecione o deck
                            </label>
                            {!isCreatingNewDeck ? (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <select
                                        value={selectedDeckId || ''}
                                        onChange={(e) => setSelectedDeckId(e.target.value || null)}
                                        className="flex-1 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-white text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-gray-800"
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
                                        className="flex-1 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-gray-800 dark:text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => { setIsCreatingNewDeck(false); setNewDeckName(''); }}
                                        className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 font-semibold rounded-xl shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Input Type Selector */}
                        <div className="mb-8">
                            <label className="block mb-4 font-semibold text-gray-700 dark:text-gray-300">
                                Como você quer criar os flashcards?
                            </label>
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
                                        className={`py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${inputType === value
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-md transform scale-[1.02]'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input Fields */}
                        {inputType === 'topic' && (
                            <div className="mb-8 animate-fade-in">
                                <label className="block mb-3 font-semibold text-gray-700 dark:text-gray-300">
                                    Digite o tópico
                                </label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="Ex: Fotossíntese, Segunda Guerra Mundial..."
                                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-transparent dark:text-white"
                                />
                            </div>
                        )}

                        {inputType === 'text' && (
                            <div className="mb-8 animate-fade-in">
                                <label className="block mb-3 font-semibold text-gray-700 dark:text-gray-300">
                                    Cole o texto
                                </label>
                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Cole seu texto aqui..."
                                    rows={8}
                                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-transparent dark:text-white resize-y"
                                />
                            </div>
                        )}

                        {inputType === 'pdf' && (
                            <div className="mb-8 animate-fade-in">
                                <label className="block mb-3 font-semibold text-gray-700 dark:text-gray-300">
                                    Carregar PDF
                                </label>
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors bg-gray-50 dark:bg-gray-800/50">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="pdf-upload"
                                    />
                                    <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                        <span className="text-4xl">📄</span>
                                        <span className="font-medium text-indigo-600 dark:text-indigo-400">Clique para selecionar um arquivo PDF</span>
                                        <span className="text-sm text-gray-500">ou arraste e solte aqui</span>
                                    </label>
                                </div>
                                {file && (
                                    <div className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                        <span>✅</span>
                                        <span className="font-medium truncate">{file.name}</span>
                                        <span className="opacity-70">({Math.round(file.size / 1024)} KB)</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {inputType === 'file' && (
                            <div className="mb-8 animate-fade-in">
                                <label className="block mb-3 font-semibold text-gray-700 dark:text-gray-300">
                                    Carregar Arquivo (.txt ou .csv)
                                </label>
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors bg-gray-50 dark:bg-gray-800/50">
                                    <input
                                        type="file"
                                        accept=".txt,.csv"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                        <span className="text-4xl">📁</span>
                                        <span className="font-medium text-indigo-600 dark:text-indigo-400">Clique para selecionar arquivo .txt ou .csv</span>
                                        <span className="text-sm text-gray-500">A IA classificará automaticamente cada registro</span>
                                    </label>
                                </div>
                                {file && (
                                    <div className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                        <span>✅</span>
                                        <span className="font-medium truncate">{file.name}</span>
                                        <span className="opacity-70">({Math.round(file.size / 1024)} KB)</span>
                                    </div>
                                )}
                                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                    <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">💡 Como funciona:</p>
                                    <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                                        <li>A IA analisará cada linha/registro do arquivo</li>
                                        <li>Classificará automaticamente em: Q&A, Verdadeiro/Falso, Múltipla Escolha, etc.</li>
                                        <li>Limpará HTML e formatação desnecessária</li>
                                        <li>Um arquivo pode gerar flashcards de diferentes tipos</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Manual Flashcard Creation */}
                        {inputType === 'manual' && (
                            <div className="mb-8 animate-fade-in">
                                <label className="block mb-3 font-semibold text-gray-700 dark:text-gray-300">
                                    Criar Flashcard Manualmente
                                </label>

                                {/* Q&A Form */}
                                {mode === CardMode.QA && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Pergunta</label>
                                            <input
                                                type="text"
                                                value={manualFormData.question}
                                                onChange={(e) => setManualFormData({ ...manualFormData, question: e.target.value })}
                                                placeholder="Digite a pergunta..."
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Resposta</label>
                                            <textarea
                                                value={manualFormData.answer}
                                                onChange={(e) => setManualFormData({ ...manualFormData, answer: e.target.value })}
                                                placeholder="Digite a resposta..."
                                                rows={4}
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 dark:text-white resize-y"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* True/False Form */}
                                {mode === CardMode.TrueFalse && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Afirmação</label>
                                            <textarea
                                                value={manualFormData.statement}
                                                onChange={(e) => setManualFormData({ ...manualFormData, statement: e.target.value })}
                                                placeholder="Digite a afirmação..."
                                                rows={3}
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 dark:text-white resize-y"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Esta afirmação é:</label>
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setManualFormData({ ...manualFormData, isTrue: true })}
                                                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${manualFormData.isTrue
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                                        }`}
                                                >
                                                    ✅ Verdadeira
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setManualFormData({ ...manualFormData, isTrue: false })}
                                                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${!manualFormData.isTrue
                                                        ? 'bg-red-500 text-white'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                                        }`}
                                                >
                                                    ❌ Falsa
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Explicação</label>
                                            <textarea
                                                value={manualFormData.explanation}
                                                onChange={(e) => setManualFormData({ ...manualFormData, explanation: e.target.value })}
                                                placeholder="Explique por que a afirmação é verdadeira ou falsa..."
                                                rows={3}
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 dark:text-white resize-y"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Multiple Choice Form */}
                                {mode === CardMode.MultipleChoice && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Pergunta</label>
                                            <input
                                                type="text"
                                                value={manualFormData.question}
                                                onChange={(e) => setManualFormData({ ...manualFormData, question: e.target.value })}
                                                placeholder="Digite a pergunta..."
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Opções</label>
                                            {manualFormData.options.map((option: string, index: number) => (
                                                <div key={index} className="flex items-center gap-2 mb-2">
                                                    <input
                                                        type="radio"
                                                        name="correctAnswer"
                                                        checked={manualFormData.correctAnswerIndex === index}
                                                        onChange={() => setManualFormData({ ...manualFormData, correctAnswerIndex: index })}
                                                        className="w-4 h-4"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={option}
                                                        onChange={(e) => {
                                                            const newOptions = [...manualFormData.options];
                                                            newOptions[index] = e.target.value;
                                                            setManualFormData({ ...manualFormData, options: newOptions });
                                                        }}
                                                        placeholder={`Opção ${String.fromCharCode(65 + index)}...`}
                                                        className="flex-1 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 dark:text-white"
                                                    />
                                                </div>
                                            ))}
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">💡 Selecione a opção correta marcando o círculo</p>
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Explicação</label>
                                            <textarea
                                                value={manualFormData.explanation}
                                                onChange={(e) => setManualFormData({ ...manualFormData, explanation: e.target.value })}
                                                placeholder="Explique por que essa é a resposta correta..."
                                                rows={3}
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 dark:text-white resize-y"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Practical Example Form */}
                                {mode === CardMode.PracticalExample && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Problema / Cenário</label>
                                            <textarea
                                                value={manualFormData.problem}
                                                onChange={(e) => setManualFormData({ ...manualFormData, problem: e.target.value })}
                                                placeholder="Descreva o problema ou cenário prático..."
                                                rows={4}
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 dark:text-white resize-y"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Pergunta</label>
                                            <input
                                                type="text"
                                                value={manualFormData.question}
                                                onChange={(e) => setManualFormData({ ...manualFormData, question: e.target.value })}
                                                placeholder="Qual é a pergunta sobre este cenário?"
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Solução</label>
                                            <textarea
                                                value={manualFormData.solution}
                                                onChange={(e) => setManualFormData({ ...manualFormData, solution: e.target.value })}
                                                placeholder="Descreva a solução para o problema..."
                                                rows={4}
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 dark:text-white resize-y"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Fill in the Blank Form */}
                                {mode === CardMode.FillInTheBlank && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Frase com Lacuna</label>
                                            <textarea
                                                value={manualFormData.sentence}
                                                onChange={(e) => setManualFormData({ ...manualFormData, sentence: e.target.value })}
                                                placeholder="Digite a frase usando ____ para indicar a lacuna..."
                                                rows={3}
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 dark:text-white resize-y"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">💡 Use ____ (quatro sublinhados) para marcar a lacuna</p>
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Resposta Correta</label>
                                            <input
                                                type="text"
                                                value={manualFormData.correctAnswer}
                                                onChange={(e) => setManualFormData({ ...manualFormData, correctAnswer: e.target.value })}
                                                placeholder="Palavra ou expressão que preenche a lacuna..."
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 dark:text-white"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Dictionary Form */}
                                {mode === CardMode.Dictionary && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Termo</label>
                                            <input
                                                type="text"
                                                value={manualFormData.term}
                                                onChange={(e) => setManualFormData({ ...manualFormData, term: e.target.value })}
                                                placeholder="Digite o termo ou conjunto de termos..."
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Definição</label>
                                            <textarea
                                                value={manualFormData.definition}
                                                onChange={(e) => setManualFormData({ ...manualFormData, definition: e.target.value })}
                                                placeholder="Digite a definição do termo..."
                                                rows={3}
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 dark:text-white resize-y"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Tags Input for Manual Cards */}
                                <div className="mt-4">
                                    <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Tags (opcional)</label>
                                    <input
                                        type="text"
                                        value={manualFormData.tags}
                                        onChange={(e) => setManualFormData({ ...manualFormData, tags: e.target.value })}
                                        placeholder="Ex: matemática, álgebra (separadas por vírgula)"
                                        className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 dark:text-white"
                                    />
                                </div>

                                {/* Add Flashcard Button */}
                                <button
                                    type="button"
                                    onClick={addManualCard}
                                    className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>➕</span> Adicionar Flashcard
                                </button>

                                {/* Preview of Created Cards */}
                                {manualCards.length > 0 && (
                                    <div className="mt-6">
                                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                            Flashcards Criados ({manualCards.length})
                                        </h3>
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {manualCards.map((card, index) => (
                                                <div key={card.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1">#{index + 1}</span>
                                                    <div className="flex-1 text-sm">
                                                        {card.mode === CardMode.QA && (
                                                            <div>
                                                                <p className="font-medium text-gray-700 dark:text-gray-300">Q: {card.question}</p>
                                                                <p className="text-gray-600 dark:text-gray-400 mt-1">A: {card.answer}</p>
                                                            </div>
                                                        )}
                                                        {card.mode === CardMode.TrueFalse && (
                                                            <div>
                                                                <p className="font-medium text-gray-700 dark:text-gray-300">{card.statement}</p>
                                                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                                                    {card.isTrue ? '✅ Verdadeiro' : '❌ Falso'}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {card.mode === CardMode.MultipleChoice && (
                                                            <div>
                                                                <p className="font-medium text-gray-700 dark:text-gray-300">{card.question}</p>
                                                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                                                    Resposta: {String.fromCharCode(65 + card.correctAnswerIndex)}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {card.mode === CardMode.PracticalExample && (
                                                            <div>
                                                                <p className="font-medium text-gray-700 dark:text-gray-300">{card.question}</p>
                                                                <p className="text-gray-600 dark:text-gray-400 mt-1 truncate">{card.problem}</p>
                                                            </div>
                                                        )}
                                                        {card.mode === CardMode.FillInTheBlank && (
                                                            <div>
                                                                <p className="font-medium text-gray-700 dark:text-gray-300">{card.question}</p>
                                                                <p className="text-gray-600 dark:text-gray-400 mt-1">Resposta: {card.answer}</p>
                                                            </div>
                                                        )}
                                                        {card.mode === CardMode.Dictionary && (
                                                            <div>
                                                                <p className="font-medium text-gray-700 dark:text-gray-300">Termo: {card.term}</p>
                                                                <p className="text-gray-600 dark:text-gray-400 mt-1">Definição: {card.definition}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteManualCard(card.id)}
                                                        className="text-red-500 hover:text-red-700 font-bold text-lg"
                                                        title="Remover flashcard"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Mode Selector - Only show for non-file inputs */}
                        {inputType !== 'file' && (
                            <div className="mb-8">
                                <label className="block mb-4 font-semibold text-gray-700 dark:text-gray-300">
                                    Tipo de Flashcard
                                </label>
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
                                            className={`p-4 rounded-xl font-medium transition-all duration-200 border-2 flex items-center gap-3 text-left ${mode === value
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                                                : 'border-gray-200 dark:border-gray-700 bg-transparent text-gray-600 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-700'
                                                }`}
                                        >
                                            <span className="text-xl">{icon}</span>
                                            <span>{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tags Input - Common for all input types */}
                        {inputType !== 'manual' && (
                            <div className="mb-8">
                                <label className="block mb-3 font-semibold text-gray-700 dark:text-gray-300">
                                    Tags (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="Ex: matemática, álgebra, equações (separadas por vírgula)"
                                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-transparent dark:text-white"
                                />
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    💡 Adicione tags separadas por vírgula para organizar seus flashcards
                                </p>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 mb-6 flex items-center gap-3 animate-shake">
                                <span>⚠️</span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={buttonDisabled}
                            className={`w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white border-none rounded-xl text-lg font-bold cursor-pointer hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${isGenerating ? 'animate-pulse' : ''
                                }`}
                        >
                            {isGenerating ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    <span>Criando seus flashcards... Isso pode levar alguns segundos!</span>
                                </>
                            ) : isParsing ? (
                                <>
                                    <span className="animate-bounce">📖</span> {inputType === 'file' ? 'Interpretando arquivo...' : 'Lendo PDF...'}
                                </>
                            ) : (
                                <>
                                    {inputType === 'manual' ? '💾 Salvar Flashcards' : '✨ Gerar Flashcards'}
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* CSV Import Modal */}
            <CSVImportModal
                isOpen={showCSVImport}
                onClose={() => setShowCSVImport(false)}
                onImportComplete={(count) => {
                    setShowCSVImport(false);
                    navigate('/dashboard', {
                        state: { message: `${count} flashcards importados com sucesso do CSV!` }
                    });
                }}
                preselectedDeckId={selectedDeckId || undefined}
            />

            <AnkiTxtImportModal
                isOpen={showAnkiImport}
                onClose={() => setShowAnkiImport(false)}
                onImportComplete={(count) => {
                    setShowAnkiImport(false);
                    navigate('/dashboard', {
                        state: { message: `${count} flashcards importados com sucesso do TXT do Anki!` }
                    });
                }}
                preselectedDeckId={selectedDeckId || undefined}
            />
        </div>
    );
};

export default Generator;
