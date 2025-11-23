import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { generateFlashcards, parseTextFile, parseCsvFile, interpretAndClassifyFlashcards } from '../services/geminiService';
import { CardMode } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

const Generator: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const deckId = (location.state as any)?.deckId || null;

    const [inputType, setInputType] = useState<'topic' | 'text' | 'pdf' | 'file'>('text');
    const [topic, setTopic] = useState('');
    const [text, setText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [mode, setMode] = useState<CardMode>(CardMode.QA);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [error, setError] = useState('');

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

            if (inputType === 'topic') {
                textToGenerate = `Pesquise sobre o tópico: ${topic}`;
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
                    throw new Error('Apenas arquivos .txt e .csv são suportados.');
                }

                // Use AI to interpret and classify flashcards
                generatedCards = await interpretAndClassifyFlashcards(records);
                setIsParsing(false);
            }

            if (!textToGenerate.trim() && !generatedCards) {
                throw new Error('Por favor, forneça conteúdo para gerar flashcards.');
            }

            // Ensure we have a valid deck_id
            let targetDeckId = deckId;

            if (!targetDeckId) {
                // Create a default deck if none is selected
                const { data: newDeck, error: deckError } = await supabase
                    .from('decks')
                    .insert({
                        user_id: user!.id,
                        name: 'Flashcards Gerados',
                        parent_id: null
                    })
                    .select()
                    .single();

                if (deckError) throw deckError;
                targetDeckId = newDeck.id;
            }

            // Generate flashcards using AI (if not already generated from file)
            if (!generatedCards) {
                generatedCards = await generateFlashcards(textToGenerate, mode);
            }

            if (generatedCards.length === 0) {
                throw new Error('Não foram encontrados conceitos para criar flashcards.');
            }

            // Save to Supabase
            const cardsToInsert = generatedCards.map(card => ({
                user_id: user!.id,
                deck_id: targetDeckId,
                mode: card.mode,
                feedback: card.feedback,
                question: card.mode === CardMode.QA || card.mode === CardMode.MultipleChoice || card.mode === CardMode.FillInTheBlank ? (card as any).question : null,
                answer: card.mode === CardMode.QA || card.mode === CardMode.FillInTheBlank ? (card as any).answer : null,
                statement: card.mode === CardMode.TrueFalse ? (card as any).statement : null,
                is_true: card.mode === CardMode.TrueFalse ? (card as any).isTrue : null,
                explanation: card.mode === CardMode.TrueFalse || card.mode === CardMode.MultipleChoice ? (card as any).explanation : null,
                options: card.mode === CardMode.MultipleChoice ? (card as any).options : null,
                correct_answer_index: card.mode === CardMode.MultipleChoice ? (card as any).correctAnswerIndex : null,
                problem: card.mode === CardMode.PracticalExample ? (card as any).problem : null,
                solution: card.mode === CardMode.PracticalExample ? (card as any).solution : null,
                sources: (card as any).sources || []
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
                            'qa': 'Q&A',
                            'true_false': 'Verdadeiro/Falso',
                            'multiple_choice': 'Múltipla Escolha',
                            'practical_example': 'Exemplo Prático',
                            'fill_in_the_blank': 'Lacunas'
                        };
                        return `${count} ${modeNames[mode] || mode}`;
                    })
                    .join(', ');

                successMessage = `${generatedCards.length} flashcards criados: ${breakdownText}`;
            } else {
                successMessage = deckId
                    ? `${generatedCards.length} flashcards criados com sucesso!`
                    : `Deck "Flashcards Gerados" criado com ${generatedCards.length} flashcards!`;
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
        ((inputType === 'pdf' || inputType === 'file') && !file);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
            {/* Header */}
            <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-4 md:p-6 flex justify-between items-center shadow-md">
                <h1 className="text-xl md:text-2xl font-bold">Gerador de Flashcards</h1>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-md text-white cursor-pointer text-sm transition-colors flex items-center gap-2"
                >
                    <span>←</span> <span className="hidden sm:inline">Voltar</span>
                </button>
            </header>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto px-4 py-10">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-10 shadow-lg border border-gray-100 dark:border-gray-700">
                    <h2 className="text-2xl font-bold mb-8 text-gray-800 dark:text-gray-100 text-center md:text-left">
                        Criar Flashcards com IA
                    </h2>

                    <form onSubmit={handleSubmit}>
                        {/* Input Type Selector */}
                        <div className="mb-8">
                            <label className="block mb-4 font-semibold text-gray-700 dark:text-gray-300">
                                Como você quer criar os flashcards?
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { value: 'topic', label: '🔍 Tópico' },
                                    { value: 'text', label: '📝 Texto' },
                                    { value: 'pdf', label: '📄 PDF' },
                                    { value: 'file', label: '📁 Arquivo' }
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
                                        { value: CardMode.FillInTheBlank, label: 'Lacunas', icon: '📝' }
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

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 mb-6 flex items-center gap-3 animate-shake">
                                <span>⚠️</span>
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={buttonDisabled}
                            className={`w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white border-none rounded-xl text-lg font-bold cursor-pointer hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${isGenerating ? 'animate-pulse' : ''
                                }`}
                        >
                            {isGenerating ? (
                                <>
                                    <span className="animate-spin">⏳</span> Gerando...
                                </>
                            ) : isParsing ? (
                                <>
                                    <span className="animate-bounce">📖</span> {inputType === 'file' ? 'Interpretando arquivo...' : 'Lendo PDF...'}
                                </>
                            ) : (
                                <>
                                    ✨ Gerar Flashcards
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Generator;
