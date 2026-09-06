import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { generateFlashcards, generateFlashcardsWithSearch, parseTextFile, parseCsvFile, interpretAndClassifyFlashcards } from '../services/geminiService';
import { CardMode } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

interface UseFlashcardGeneratorParams {
    user: any;
    initialDeckId?: string | null;
}

export const useFlashcardGenerator = ({ user, initialDeckId }: UseFlashcardGeneratorParams) => {
    const [inputType, setInputType] = useState<'topic' | 'text' | 'pdf' | 'file' | 'manual'>('text');
    const [topic, setTopic] = useState('');
    const [text, setText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [mode, setMode] = useState<CardMode>(CardMode.QA);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [error, setError] = useState('');
    const [decks, setDecks] = useState<{ id: string; name: string }[]>([]);
    const [selectedDeckId, setSelectedDeckId] = useState<string | null>(initialDeckId || null);
    const [isCreatingNewDeck, setIsCreatingNewDeck] = useState(false);
    const [newDeckName, setNewDeckName] = useState('');
    const [tags, setTags] = useState<string>('');
    const [manualCards, setManualCards] = useState<any[]>([]);

    const [manualFormData, setManualFormData] = useState<any>({
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

    useEffect(() => {
        const loadDecks = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('decks')
                    .select('id, name')
                    .eq('user_id', user.id)
                    .is('parent_id', null)
                    .order('created_at', { ascending: false });
                if (error) throw error;
                setDecks(data || []);
            } catch (err) {
                console.error('Error loading decks:', err);
            }
        };
        loadDecks();
    }, [user]);

    const parsePdf = async (fileToParse: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                if (!event.target?.result) return reject(new Error('Falha ao ler o arquivo.'));
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
                } catch (err) {
                    reject(new Error('Não foi possível processar o arquivo PDF.'));
                }
            };
            reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
            reader.readAsArrayBuffer(fileToParse);
        });
    };

    const parseFile = async (fileToParse: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (!event.target?.result) return reject(new Error('Falha ao ler o arquivo.'));
                resolve(event.target.result as string);
            };
            reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
            reader.readAsText(fileToParse);
        });
    };

    const addManualCard = () => {
        try {
            let newCard: any = {
                id: crypto.randomUUID(),
                mode,
                feedback: 'unseen'
            };

            switch (mode) {
                case CardMode.QA:
                    if (!manualFormData.question.trim() || !manualFormData.answer.trim()) throw new Error('Preencha a pergunta e a resposta.');
                    newCard.question = manualFormData.question.trim();
                    newCard.answer = manualFormData.answer.trim();
                    break;
                case CardMode.TrueFalse:
                    if (!manualFormData.statement.trim() || !manualFormData.explanation.trim()) throw new Error('Preencha a afirmação e a explicação.');
                    newCard.statement = manualFormData.statement.trim();
                    newCard.isTrue = manualFormData.isTrue;
                    newCard.explanation = manualFormData.explanation.trim();
                    break;
                case CardMode.MultipleChoice:
                    if (!manualFormData.question.trim() || !manualFormData.explanation.trim()) throw new Error('Preencha a pergunta e a explicação.');
                    const filled = manualFormData.options.filter((o: string) => o.trim());
                    if (filled.length < 2) throw new Error('Preencha pelo menos 2 opções.');
                    newCard.question = manualFormData.question.trim();
                    newCard.options = manualFormData.options.map((o: string) => o.trim());
                    newCard.correctAnswerIndex = manualFormData.correctAnswerIndex;
                    newCard.explanation = manualFormData.explanation.trim();
                    break;
                case CardMode.PracticalExample:
                    if (!manualFormData.problem.trim() || !manualFormData.question.trim() || !manualFormData.solution.trim()) throw new Error('Preencha o problema, pergunta e solução.');
                    newCard.problem = manualFormData.problem.trim();
                    newCard.question = manualFormData.question.trim();
                    newCard.solution = manualFormData.solution.trim();
                    break;
                case CardMode.FillInTheBlank:
                    if (!manualFormData.sentence.trim() || !manualFormData.correctAnswer.trim()) throw new Error('Preencha a frase e a resposta.');
                    if (!manualFormData.sentence.includes('____')) throw new Error('Use ____ (quatro sublinhados) para indicar a lacuna.');
                    newCard.question = manualFormData.sentence.trim();
                    newCard.answer = manualFormData.correctAnswer.trim();
                    break;
                case CardMode.Dictionary:
                    if (!manualFormData.term.trim() || !manualFormData.definition.trim()) throw new Error('Preencha o termo e a definição.');
                    newCard.term = manualFormData.term.trim();
                    newCard.definition = manualFormData.definition.trim();
                    break;
            }

            if (manualFormData.tags.trim()) {
                newCard.tags = manualFormData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
            }

            setManualCards(prev => [...prev, newCard]);
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
            setError('');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const deleteManualCard = (cardId: string) => {
        setManualCards(prev => prev.filter(c => c.id !== cardId));
    };

    return {
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
        setManualCards,
        manualFormData,
        setManualFormData,
        addManualCard,
        deleteManualCard,
        parsePdf,
        parseFile
    };
};
