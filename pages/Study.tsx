import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { applySm2 } from '../services/srsAlgorithm';
import { updateLastStudied } from '../services/deckService';
import { CardMode, FeedbackStatus } from '../types';
import type { FlashcardData } from '../types';
import { renderHTML } from '../utils/textUtils';
import { Home } from 'lucide-react';

type EditFormData = {
    mode: CardMode;
    question?: string;
    answer?: string;
    statement?: string;
    isTrue?: boolean;
    explanation?: string;
    options?: string[];
    correctAnswerIndex?: number;
    problem?: string;
    solution?: string;
    term?: string;
    definition?: string;
};

type UpdatePayload = {
    question?: string;
    answer?: string;
    statement?: string;
    is_true?: boolean;
    explanation?: string | null;
    options?: string[];
    correct_answer_index?: number;
    problem?: string;
    solution?: string;
};

const Study: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const deckId = (location.state as any)?.deckId ?? searchParams.get('deck'); // fallback for ?deck=
    const simulationId = (location.state as any)?.simulationId;
    const [deckName, setDeckName] = useState('');

    const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
    const [loading, setLoading] = useState(true);
    const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });
    const [pomodoroPos, setPomodoroPos] = useState<{ top: number; left: number } | null>(null);
    const [isDraggingPomodoro, setIsDraggingPomodoro] = useState(false);
    const [isPomodoroVisible, setIsPomodoroVisible] = useState(false);
    const pomodoroRef = useRef<HTMLDivElement | null>(null);
    const pomodoroDragOffset = useRef({ x: 0, y: 0 });
    const [defaultPomodoroBottom, setDefaultPomodoroBottom] = useState(112);

    // Pomodoro Timer State
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [initialTime, setInitialTime] = useState(25 * 60);
    const [showTimerSettings, setShowTimerSettings] = useState(false);

    // Notes State
    const [currentNote, setCurrentNote] = useState('');
    const [showNotesPanel, setShowNotesPanel] = useState(false);
    const [noteId, setNoteId] = useState<string | null>(null);
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [hasNote, setHasNote] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState<EditFormData | null>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prevTime) => prevTime - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (interval) clearInterval(interval);
            // Optional: Play a sound or show a notification here
            alert('Tempo esgotado! Hora de uma pausa.');
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(initialTime);
    };

    const handleTimeChange = (minutes: number) => {
        const newTime = minutes * 60;
        setInitialTime(newTime);
        setTimeLeft(newTime);
        setIsActive(false);
        setShowTimerSettings(false);
    };

    // Load note when flashcard changes
    useEffect(() => {
        if (flashcards.length > 0 && currentIndex >= 0) {
            loadNote();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, flashcards]);

    useEffect(() => {
        if (deckId || simulationId) {
            loadFlashcards();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deckId, simulationId]);

    useEffect(() => {
        const loadDeckName = async () => {
            if (!deckId || !user) {
                setDeckName('');
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('decks')
                    .select('name')
                    .eq('id', deckId)
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (error) throw error;
                setDeckName(data?.name || '');
            } catch (error) {
                console.error('Error loading deck name:', error);
                setDeckName('');
            }
        };

        loadDeckName();
    }, [deckId, user]);

    const normalizeCard = (raw: any): FlashcardData => {
        // Normalize snake_case fields returned by Supabase
        const card = {
            ...raw,
            isTrue: raw.isTrue ?? raw.is_true,
            correctAnswerIndex: raw.correctAnswerIndex ?? raw.correct_answer_index,
            deckId: raw.deckId ?? raw.deck_id,
        };

        if (card.mode === CardMode.Dictionary) {
            return {
                ...card,
                term: (card as any).term || card.question || '',
                definition: (card as any).definition || card.answer || '',
            } as any;
        }
        if (card.mode === CardMode.PracticalExample) {
            return {
                ...card,
                question: card.question || (card as any).problem || '',
            } as any;
        }
        return card as FlashcardData;
    };

    const loadFlashcards = async () => {
        try {
            setLoading(true);

            if (simulationId) {
                // Load from simulation
                const { data: items, error } = await supabase
                    .from('simulation_items')
                    .select('*, flashcard:flashcards(*)')
                    .eq('simulation_id', simulationId);

                if (error) throw error;

                // Map items to flashcards and shuffle if needed (though simulations are usually fixed order, let's keep them as is or shuffle if requested. 
                // The requirement said "random sequence... for the simulation", which implies the sequence is fixed at creation.
                // So we should probably respect the order they come back, or if we stored an order index.
                // For now, let's just use them as they come.
                const cards = items?.map((item: any) => normalizeCard(item.flashcard)) || [];
                setFlashcards(cards);

            } else if (deckId) {
                // Helper function to recursively get all subdeck IDs
                const getAllSubdeckIds = async (parentDeckId: string): Promise<string[]> => {
                    const { data: children, error } = await supabase
                        .from('decks')
                        .select('id')
                        .eq('user_id', user!.id)
                        .eq('parent_id', parentDeckId);

                    if (error || !children || children.length === 0) {
                        return [];
                    }

                    const childIds = children.map(child => child.id);

                    // Recursively get subdecks of each child
                    const nestedIds: string[] = [];
                    for (const childId of childIds) {
                        const nested = await getAllSubdeckIds(childId);
                        nestedIds.push(...nested);
                    }

                    return [...childIds, ...nestedIds];
                };

                // Get all subdeck IDs recursively
                const allSubdeckIds = await getAllSubdeckIds(deckId);
                const deckIdsToQuery = [deckId, ...allSubdeckIds];

                // Load flashcards from this deck and all nested subdecks
                const { data, error } = await supabase
                    .from('flashcards')
                    .select('*')
                    .in('deck_id', deckIdsToQuery)
                    .eq('user_id', user!.id)
                    .or('next_review.is.null,next_review.lte.now()');

                if (error) throw error;

                const normalized = (data || []).map(normalizeCard);
                // Shuffle flashcards
                const shuffled = normalized.sort(() => Math.random() - 0.5);
                setFlashcards(shuffled as any);
            }
        } catch (error) {
            console.error('Error loading flashcards:', error);
            alert('Erro ao carregar flashcards');
        } finally {
            setLoading(false);
        }
    };

    const loadNote = async () => {
        if (!flashcards[currentIndex]) return;

        try {
            const { data, error } = await supabase
                .from('flashcard_notes')
                .select('*')
                .eq('user_id', user!.id)
                .eq('flashcard_id', flashcards[currentIndex].id)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setCurrentNote(data.note_text);
                setNoteId(data.id);
                setHasNote(true);
            } else {
                setCurrentNote('');
                setNoteId(null);
                setHasNote(false);
            }
        } catch (error) {
            console.error('Error loading note:', error);
        }
    };

    const saveNote = async () => {
        if (!flashcards[currentIndex]) return;

        setIsSavingNote(true);
        try {
            const noteData = {
                user_id: user!.id,
                flashcard_id: flashcards[currentIndex].id,
                note_text: currentNote.trim()
            };

            if (currentNote.trim() === '') {
                // Delete note if empty
                if (noteId) {
                    await supabase
                        .from('flashcard_notes')
                        .delete()
                        .eq('id', noteId);
                    setNoteId(null);
                    setHasNote(false);
                }
            } else if (noteId) {
                // Update existing note
                await supabase
                    .from('flashcard_notes')
                    .update({ note_text: currentNote.trim() })
                    .eq('id', noteId);
                setHasNote(true);
            } else {
                // Insert new note
                const { data, error } = await supabase
                    .from('flashcard_notes')
                    .insert(noteData)
                    .select()
                    .single();

                if (error) throw error;
                if (data) {
                    setNoteId(data.id);
                    setHasNote(true);
                }
            }
        } catch (error) {
            console.error('Error saving note:', error);
            alert('Erro ao salvar anotação');
        } finally {
            setIsSavingNote(false);
        }
    };


    const evaluateAnswer = () => {
        const card = flashcards[currentIndex];
        let evaluation: 'correct' | 'incorrect' = 'incorrect';

        // For Q&A, Exemplo Prático e Dicionário, use self-evaluation
        if (card.mode === CardMode.QA || card.mode === CardMode.PracticalExample || card.mode === CardMode.Dictionary) {
            setShowResult(true);
            setResult(null); // No automatic result for Q&A
            return;
        }

        if (card.mode === CardMode.TrueFalse) {
            // True/False: selectedOption 0 = True, 1 = False
            const userSaysTrue = selectedOption === 0;
            // Handle potential string/boolean mismatch from DB
            const cardIsTrue = String(card.isTrue).toLowerCase() === 'true';
            evaluation = userSaysTrue === cardIsTrue ? 'correct' : 'incorrect';
        } else if (card.mode === CardMode.MultipleChoice) {
            // Multiple Choice: check if selected option matches correct index
            // Handle potential string/number mismatch
            evaluation = Number(selectedOption) === Number(card.correctAnswerIndex) ? 'correct' : 'incorrect';
        } else if (card.mode === CardMode.FillInTheBlank) {
            // Fill-in-the-Blank: Use fuzzy matching
            const correctAnswer = card.answer;
            const similarity = calculateSimilarity(userAnswer.toLowerCase().trim(), correctAnswer.toLowerCase().trim());
            evaluation = similarity > 0.8 ? 'correct' : 'incorrect';
        }

        setResult(evaluation);
        setShowResult(true);

        // Update session stats
        setSessionStats(prev => ({
            ...prev,
            [evaluation]: prev[evaluation] + 1
        }));
    };

    const calculateSimilarity = (str1: string, str2: string): number => {
        // Simple similarity calculation (Levenshtein-like)
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) return 1.0;

        // Check for exact match first
        if (str1 === str2) return 1.0;

        // Check if shorter is contained in longer
        if (longer.includes(shorter)) return 0.7;

        const editDistance = levenshteinDistance(str1, str2);
        return (longer.length - editDistance) / longer.length;
    };

    const levenshteinDistance = (str1: string, str2: string): number => {
        const matrix: number[][] = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    };

    const qualityFromSelfEval = {
        incorrect: 0,
        almost: 3,
        correct: 5
    } as const;

    const qualityFromAuto = (isCorrect: boolean) => (isCorrect ? 5 : 0);

    const applySrsAndUpdate = async (card: FlashcardData, quality: number, feedbackOverride?: FeedbackStatus) => {
        const { interval, repetition, easeFactor, nextReview } = applySm2(card, quality);

        await supabase
            .from('flashcards')
            .update({
                interval,
                repetition,
                ease_factor: easeFactor,
                next_review: nextReview,
                feedback: feedbackOverride ?? (quality >= 3 ? FeedbackStatus.Correct : FeedbackStatus.Incorrect)
            })
            .eq('id', card.id);

        // If failed, keep the card in the queue for this session
        if (quality < 3) {
            setFlashcards(prev => {
                const copy = [...prev];
                const idx = copy.findIndex(fc => fc.id === card.id);
                if (idx >= 0) {
                    const [failed] = copy.splice(idx, 1);
                    copy.push(failed);
                }
                return copy;
            });
        }
    };

    const saveStudySession = async (customXp?: number) => {
        const card = flashcards[currentIndex];

        // For Q&A self-evaluation, use custom XP; otherwise use result-based XP
        let xpEarned: number;
        if (customXp !== undefined) {
            xpEarned = customXp;
        } else if (result === 'correct') {
            xpEarned = 10;
        } else {
            xpEarned = 0;
        }

        // Determine result for database (for Q&A self-eval, use XP to infer result)
        let sessionResult: 'correct' | 'incorrect';
        if (card.mode === CardMode.QA && customXp !== undefined) {
            sessionResult = customXp >= 10 ? 'correct' : 'incorrect';
        } else {
            sessionResult = result || 'incorrect';
        }

        try {
            // Save study session
            await supabase.from('study_sessions').insert({
                user_id: user!.id,
                flashcard_id: card.id,
                deck_id: deckId,
                result: sessionResult,
                xp_earned: xpEarned
            });

            // Update user XP
            if (xpEarned > 0) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('xp, level')
                    .eq('id', user!.id)
                    .single();

                if (profile) {
                    const newXp = profile.xp + xpEarned;
                    const newLevel = Math.floor(newXp / 100) + 1;


                    await supabase
                        .from('profiles')
                        .update({ xp: newXp, level: newLevel })
                        .eq('id', user!.id);
                }
            }

            // Update deck's last_studied_at timestamp for Topicogram
            if (deckId) {
                await updateLastStudied(deckId);
            }
        } catch (error) {
            console.error('Error saving study session:', error);
        }
    };

    const updateStreak = async () => {
        const today = new Date().toISOString().split('T')[0];

        const { data: profile } = await supabase
            .from('profiles')
            .select('streak_current, streak_last_study_date')
            .eq('id', user!.id)
            .single();

        if (!profile) return;

        const lastDate = profile.streak_last_study_date;
        let newStreak = profile.streak_current;

        if (lastDate === today) {
            return; // Already studied today
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastDate === yesterdayStr) {
            newStreak += 1;
        } else {
            newStreak = 1;
        }

        await supabase.from('profiles').update({
            streak_current: newStreak,
            streak_last_study_date: today
        }).eq('id', user!.id);
    };

    const checkBadges = async () => {
        // Get user stats
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
        const { count: cardsStudied } = await supabase.from('study_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user!.id);

        // Get all badges
        const { data: allBadges } = await supabase.from('badges').select('*');
        // Get user badges
        const { data: userBadges } = await supabase.from('user_badges').select('badge_id').eq('user_id', user!.id);

        const userBadgeIds = new Set(userBadges?.map(b => b.badge_id));
        const newBadges = [];

        for (const badge of (allBadges || [])) {
            if (userBadgeIds.has(badge.id)) continue;

            let earned = false;
            if (badge.condition_type === 'study_sessions' && (cardsStudied || 0) >= badge.condition_value) earned = true;
            if (badge.condition_type === 'level' && profile.level >= badge.condition_value) earned = true;
            if (badge.condition_type === 'streak' && profile.streak_current >= badge.condition_value) earned = true;

            if (earned) {
                await supabase.from('user_badges').insert({ user_id: user!.id, badge_id: badge.id });
                newBadges.push(badge);
            }
        }

        return newBadges;
    };

    const handleSelfEvaluation = async (evaluation: 'correct' | 'almost' | 'incorrect') => {
        const xpMap = {
            'correct': 10,
            'almost': 2,
            'incorrect': 0
        };

        const xpEarned = xpMap[evaluation];
        const card = flashcards[currentIndex];
        const quality = qualityFromSelfEval[evaluation];

        await applySrsAndUpdate(card, quality, evaluation === 'almost' ? FeedbackStatus.Almost : undefined);

        // Update session stats
        if (evaluation === 'correct' || evaluation === 'almost') {
            setSessionStats(prev => ({ ...prev, correct: prev.correct + 1 }));
        } else {
            setSessionStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
        }

        // Save session with custom XP
        await saveStudySession(xpEarned);

        // If failed (<3), keep studying within this session
        if (quality < 3) {
            const nextIndex = currentIndex < flashcards.length - 1 ? currentIndex + 1 : 0;
            setCurrentIndex(nextIndex);
            setUserAnswer('');
            setSelectedOption(null);
            setShowResult(false);
            setResult(null);
            return;
        }

        // Move to next card
        if (currentIndex < flashcards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setUserAnswer('');
            setSelectedOption(null);
            setShowResult(false);
            setResult(null);
        } else {
            // End of session
            await updateStreak();
            const newBadges = await checkBadges();

            navigate('/dashboard', {
                state: {
                    message: `Sessão concluída! ✅ ${sessionStats.correct + (evaluation === 'correct' || evaluation === 'almost' ? 1 : 0)} corretas, ❌ ${sessionStats.incorrect + (evaluation === 'incorrect' ? 1 : 0)} incorretas`,
                    newBadges: newBadges
                }
            });
        }
    };

    const handleNext = async () => {
        const card = flashcards[currentIndex];
        const quality = qualityFromAuto(result === 'correct');
        await applySrsAndUpdate(card, quality);
        await saveStudySession();

        if (quality < 3) {
            const nextIndex = currentIndex < flashcards.length - 1 ? currentIndex + 1 : 0;
            setCurrentIndex(nextIndex);
            setUserAnswer('');
            setSelectedOption(null);
            setShowResult(false);
            setResult(null);
            return;
        }

        if (currentIndex < flashcards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setUserAnswer('');
            setSelectedOption(null);
            setShowResult(false);
            setResult(null);
        } else {
            // End of session
            await updateStreak();
            const newBadges = await checkBadges();

            navigate('/dashboard', {
                state: {
                    message: `Sessão concluída! ✅ ${sessionStats.correct} corretas, ❌ ${sessionStats.incorrect} incorretas`,
                    newBadges: newBadges
                }
            });
        }
    };

    const openEditModal = () => {
        if (!currentCard) return;
        const data: EditFormData = { mode: currentCard.mode };

        switch (currentCard.mode) {
            case CardMode.QA:
                data.question = currentCard.question || '';
                data.answer = currentCard.answer || '';
                break;
            case CardMode.TrueFalse:
                data.statement = currentCard.statement || '';
                data.isTrue = currentCard.isTrue ?? false;
                data.explanation = currentCard.explanation || '';
                break;
            case CardMode.MultipleChoice:
                data.question = currentCard.question || '';
                data.options = currentCard.options ? [...currentCard.options] : ['', '', '', ''];
                data.correctAnswerIndex = Number(currentCard.correctAnswerIndex ?? 0);
                data.explanation = currentCard.explanation || '';
                break;
            case CardMode.PracticalExample:
                data.problem = (currentCard as any).problem || '';
                data.question = currentCard.question || '';
                data.solution = (currentCard as any).solution || '';
                break;
            case CardMode.FillInTheBlank:
                data.question = currentCard.question || '';
                data.answer = currentCard.answer || '';
                break;
            case CardMode.Dictionary:
                data.term = (currentCard as any).term || (currentCard as any).question || '';
                data.definition = (currentCard as any).definition || (currentCard as any).answer || '';
                break;
        }
        setEditData(data);
        setShowEditModal(true);
    };

    const handleEditChange = (field: string, value: any) => {
        setEditData((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const saveEdit = async () => {
        if (!currentCard || !editData) return;

        const payload: UpdatePayload = {};
        try {
            setIsSavingEdit(true);
            switch (currentCard.mode) {
                case CardMode.QA:
                    if (!editData.question?.trim() || !editData.answer?.trim()) throw new Error('Preencha pergunta e resposta.');
                    payload.question = editData.question.trim();
                    payload.answer = editData.answer.trim();
                    break;
                case CardMode.TrueFalse:
                    if (!editData.statement?.trim()) throw new Error('Preencha a afirmação.');
                    payload.statement = editData.statement.trim();
                    payload.is_true = !!editData.isTrue;
                    payload.explanation = editData.explanation?.trim() || null;
                    break;
                case CardMode.MultipleChoice:
                    if (!editData.question?.trim()) throw new Error('Preencha a pergunta.');
                    if (!editData.options || editData.options.some((o: string) => !o?.trim())) throw new Error('Todas as opções são obrigatórias.');
                    payload.question = editData.question.trim();
                    payload.options = editData.options.map((o: string) => o.trim());
                    payload.correct_answer_index = Number(editData.correctAnswerIndex ?? 0);
                    payload.explanation = editData.explanation?.trim() || null;
                    break;
                case CardMode.PracticalExample:
                    if (!editData.problem?.trim() || !editData.question?.trim() || !editData.solution?.trim()) throw new Error('Preencha problema, pergunta e solução.');
                    payload.problem = editData.problem.trim();
                    payload.question = editData.question.trim();
                    payload.solution = editData.solution.trim();
                    break;
                case CardMode.FillInTheBlank:
                    if (!editData.question?.trim() || !editData.answer?.trim()) throw new Error('Preencha pergunta e resposta.');
                    payload.question = editData.question.trim();
                    payload.answer = editData.answer.trim();
                    break;
                case CardMode.Dictionary:
                    if (!editData.term?.trim() || !editData.definition?.trim()) throw new Error('Preencha termo e definição.');
                    payload.question = editData.term.trim();
                    payload.answer = editData.definition.trim();
                    break;
            }

            await supabase.from('flashcards').update(payload).eq('id', currentCard.id);

            setFlashcards(prev => {
                const updated = [...prev];
                const updatedCard: any = {
                    ...updated[currentIndex],
                    ...(payload as any),
                };

                // Update specific properties based on payload
                if (payload.is_true !== undefined) {
                    updatedCard.isTrue = payload.is_true;
                }
                if (payload.correct_answer_index !== undefined) {
                    updatedCard.correctAnswerIndex = payload.correct_answer_index;
                }

                // Handle Dictionary mode
                if (currentCard.mode === CardMode.Dictionary) {
                    if (payload.question !== undefined) updatedCard.term = payload.question;
                    if (payload.answer !== undefined) updatedCard.definition = payload.answer;
                }

                // Handle PracticalExample mode
                if (currentCard.mode === CardMode.PracticalExample) {
                    if (payload.solution !== undefined) updatedCard.solution = payload.solution;
                    if (payload.problem !== undefined) updatedCard.problem = payload.problem;
                }

                updated[currentIndex] = updatedCard;
                return updated;
            });

            setShowEditModal(false);
        } catch (err: any) {
            alert(err.message || 'Erro ao atualizar flashcard.');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const renderEditFields = () => {
        if (!editData) return null;
        switch (editData.mode) {
            case CardMode.QA:
                return (
                    <div className="space-y-3">
                        <textarea
                            className="w-full border rounded-lg p-3"
                            placeholder="Pergunta"
                            value={editData.question || ''}
                            onChange={(e) => handleEditChange('question', e.target.value)}
                        />
                        <textarea
                            className="w-full border rounded-lg p-3"
                            placeholder="Resposta"
                            value={editData.answer || ''}
                            onChange={(e) => handleEditChange('answer', e.target.value)}
                        />
                    </div>
                );
            case CardMode.TrueFalse:
                return (
                    <div className="space-y-3">
                        <textarea
                            className="w-full border rounded-lg p-3"
                            placeholder="Afirmação"
                            value={editData.statement || ''}
                            onChange={(e) => handleEditChange('statement', e.target.value)}
                        />
                        <div className="flex gap-3 items-center">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    checked={!!editData.isTrue}
                                    onChange={() => handleEditChange('isTrue', true)}
                                />
                                Verdadeiro
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    checked={!editData.isTrue}
                                    onChange={() => handleEditChange('isTrue', false)}
                                />
                                Falso
                            </label>
                        </div>
                        <textarea
                            className="w-full border rounded-lg p-3"
                            placeholder="Explicação (opcional)"
                            value={editData.explanation || ''}
                            onChange={(e) => handleEditChange('explanation', e.target.value)}
                        />
                    </div>
                );
            case CardMode.MultipleChoice:
                return (
                    <div className="space-y-3">
                        <textarea
                            className="w-full border rounded-lg p-3"
                            placeholder="Pergunta"
                            value={editData.question || ''}
                            onChange={(e) => handleEditChange('question', e.target.value)}
                        />
                        <div className="space-y-2">
                            {(editData.options || []).map((opt: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="correct-option"
                                        checked={Number(editData.correctAnswerIndex) === idx}
                                        onChange={() => handleEditChange('correctAnswerIndex', idx)}
                                    />
                                    <input
                                        className="flex-1 border rounded-lg p-2"
                                        value={opt}
                                        onChange={(e) => {
                                            const newOpts = [...(editData.options || [])];
                                            newOpts[idx] = e.target.value;
                                            handleEditChange('options', newOpts);
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                        <textarea
                            className="w-full border rounded-lg p-3"
                            placeholder="Explicação (opcional)"
                            value={editData.explanation || ''}
                            onChange={(e) => handleEditChange('explanation', e.target.value)}
                        />
                    </div>
                );
            case CardMode.PracticalExample:
                return (
                    <div className="space-y-3">
                        <textarea
                            className="w-full border rounded-lg p-3"
                            placeholder="Problema"
                            value={editData.problem || ''}
                            onChange={(e) => handleEditChange('problem', e.target.value)}
                        />
                        <textarea
                            className="w-full border rounded-lg p-3"
                            placeholder="Pergunta"
                            value={editData.question || ''}
                            onChange={(e) => handleEditChange('question', e.target.value)}
                        />
                        <textarea
                            className="w-full border rounded-lg p-3"
                            placeholder="Solução"
                            value={editData.solution || ''}
                            onChange={(e) => handleEditChange('solution', e.target.value)}
                        />
                    </div>
                );
            case CardMode.FillInTheBlank:
                return (
                    <div className="space-y-3">
                        <textarea
                            className="w-full border rounded-lg p-3"
                            placeholder="Pergunta"
                            value={editData.question || ''}
                            onChange={(e) => handleEditChange('question', e.target.value)}
                        />
                        <textarea
                            className="w-full border rounded-lg p-3"
                            placeholder="Resposta"
                            value={editData.answer || ''}
                            onChange={(e) => handleEditChange('answer', e.target.value)}
                        />
                    </div>
                );
            case CardMode.Dictionary:
                return (
                    <div className="space-y-3">
                        <input
                            className="w-full border rounded-lg p-3"
                            placeholder="Termo"
                            value={editData.term || ''}
                            onChange={(e) => handleEditChange('term', e.target.value)}
                        />
                        <textarea
                            className="w-full border rounded-lg p-3"
                            placeholder="Definição"
                            value={editData.definition || ''}
                            onChange={(e) => handleEditChange('definition', e.target.value)}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    const shuffleCards = () => {
        const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
        setFlashcards(shuffled);
        setCurrentIndex(0);
        setUserAnswer('');
        setSelectedOption(null);
        setShowResult(false);
        setResult(null);
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setDefaultPomodoroBottom(window.innerWidth < 768 ? 112 : 24);
        }
    }, []);

    const startPomodoroDrag = (clientX: number, clientY: number) => {
        if (!pomodoroRef.current) return;
        const rect = pomodoroRef.current.getBoundingClientRect();
        pomodoroDragOffset.current = { x: clientX - rect.left, y: clientY - rect.top };
        setPomodoroPos({ top: rect.top, left: rect.left });
        setIsDraggingPomodoro(true);
    };

    const handlePomodoroMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        startPomodoroDrag(e.clientX, e.clientY);
    };

    const handlePomodoroTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        const touch = e.touches[0];
        startPomodoroDrag(touch.clientX, touch.clientY);
    };

    useEffect(() => {
        if (!isDraggingPomodoro) return;

        const handleMove = (event: MouseEvent | TouchEvent) => {
            const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
            const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
            if ('touches' in event) {
                event.preventDefault();
            }
            setPomodoroPos({
                top: clientY - pomodoroDragOffset.current.y,
                left: clientX - pomodoroDragOffset.current.x
            });
        };

        const handleUp = () => setIsDraggingPomodoro(false);

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchend', handleUp);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchend', handleUp);
        };
    }, [isDraggingPomodoro]);



    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="font-medium">Carregando flashcards...</p>
                </div>
            </div>
        );
    }

    if (flashcards.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-100 dark:bg-gray-900 p-4">
                <div className="text-6xl">✅</div>
                <p className="text-xl text-gray-600 dark:text-gray-400 font-medium text-center">
                    Tudo em dia! Nenhum flashcard para revisar agora.
                </p>
                <button
                    onClick={() => navigate('/home')}
                    className="px-6 py-3 bg-indigo-600 text-white border-none rounded-lg cursor-pointer font-semibold hover:bg-indigo-700 transition-colors shadow-md flex items-center gap-2"
                >
                    <Home className="w-5 h-5" />
                    <span>Voltar para Home</span>
                </button>
            </div>
        );
    }

    const currentCard = flashcards[currentIndex];
    const progressPercent = Math.min(100, Math.round(((currentIndex + 1) / flashcards.length) * 100));
    const pomodoroStyle = pomodoroPos
        ? { top: pomodoroPos.top, left: pomodoroPos.left, right: 'auto', bottom: 'auto' }
        : { right: 24, bottom: defaultPomodoroBottom };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
            {/* Header */}
            <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-md">
                <div className="max-w-6xl mx-auto w-full px-4 py-6 md:px-6 md:py-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-1 text-center md:text-left">
                            <p className="text-xs uppercase tracking-widest text-white/70">Estudos</p>
                            <h1 className="text-3xl md:text-4xl font-bold leading-tight">Modo Estudo</h1>
                        </div>
                        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2">
                            <button
                                onClick={shuffleCards}
                                className="px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/25 rounded-lg text-white cursor-pointer text-sm font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                title="Embaralhar cards"
                            >
                                <span aria-hidden>🔀</span>
                                <span className="hidden sm:inline">Embaralhar</span>
                            </button>
                            <button
                                onClick={() => navigate('/help')}
                                className="p-2.5 bg-white/15 hover:bg-white/25 border border-white/25 rounded-lg text-white cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
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
                            </button>
                            <button
                                onClick={() => setIsPomodoroVisible((prev) => !prev)}
                                className="px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/25 rounded-lg text-white cursor-pointer text-sm font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                aria-pressed={isPomodoroVisible}
                                title="Mostrar/ocultar Pomodoro"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 2a1 1 0 011 1v1h2.5a1 1 0 110 2H6.5a1 1 0 110-2H9V3a1 1 0 011-1z" />
                                    <path fillRule="evenodd" d="M5 8a5 5 0 1110 0 5 5 0 01-10 0zm5-3a1 1 0 00-1 1v2.586l1.707 1.707a1 1 0 101.414-1.414L11 8.586V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span className="hidden sm:inline">{isPomodoroVisible ? 'Ocultar Pomodoro' : 'Pomodoro'}</span>
                            </button>
                            <button
                                onClick={() => navigate('/home')}
                                className="px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/25 rounded-lg text-white cursor-pointer text-sm font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                            >
                                <Home className="w-4 h-4" />
                                <span className="hidden sm:inline">Voltar</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Pomodoro Timer Floating Component */}
            {isPomodoroVisible && (
                <div
                    ref={pomodoroRef}
                    style={pomodoroStyle}
                    className="fixed z-50 flex flex-col items-end gap-2"
                >
                <div
                    className="absolute -top-2 right-2 w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full border border-white/70 shadow cursor-move"
                    onMouseDown={handlePomodoroMouseDown}
                    onTouchStart={handlePomodoroTouchStart}
                    title="Arraste para reposicionar"
                />
                <button
                    onClick={() => setIsPomodoroVisible(false)}
                    className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-white text-gray-600 shadow border border-gray-200 hover:bg-gray-100 text-xs font-bold"
                    title="Fechar Pomodoro"
                    aria-label="Fechar Pomodoro"
                >
                    x
                </button>
                {showTimerSettings && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 mb-2 animate-fade-in">
                        <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-3">Definir Tempo</h4>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleTimeChange(25)}
                                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                            >
                                25 min
                            </button>
                            <button
                                onClick={() => handleTimeChange(50)}
                                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                            >
                                50 min
                            </button>
                            <button
                                onClick={() => handleTimeChange(15)}
                                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                            >
                                15 min
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-xl border-2 border-indigo-100 dark:border-indigo-900/50 flex items-center gap-4 pl-6 pr-2 transition-all hover:scale-105">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pomodoro</span>
                        <span className={`text-2xl font-mono font-bold ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    <div className="flex gap-1">
                        <button
                            onClick={toggleTimer}
                            className={`p-3 rounded-full text-white shadow-md transition-all active:scale-95 ${isActive
                                ? 'bg-yellow-500 hover:bg-yellow-600'
                                : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            title={isActive ? "Pausar" : "Iniciar"}
                        >
                            {isActive ? '⏸️' : '▶️'}
                        </button>

                        <button
                            onClick={resetTimer}
                            className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title="Reiniciar"
                        >
                            🔄
                        </button>

                        <button
                            onClick={() => setShowTimerSettings(!showTimerSettings)}
                            className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title="Configurações"
                        >
                            ⚙️
                        </button>
                    </div>
                </div>
            </div>
            )}

            {/* Main Content */}
            <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
                {deckId && deckName && (
                    <button
                        onClick={() => navigate(`/deck/${deckId}`)}
                        className="mb-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200 font-semibold text-sm transition-colors"
                    >
                        <span aria-hidden>←</span>
                        <span>Voltar para "{deckName}"</span>
                    </button>
                )}

                {/* Progress */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 mb-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-0.5">Progresso</p>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{currentIndex + 1} / {flashcards.length}</div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Flashcards vistos</p>
                        </div>
                        <div className="w-full sm:w-1/2">
                            <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <p className="mt-1.5 text-right text-[11px] font-semibold text-indigo-600 dark:text-indigo-300">{progressPercent}%</p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 mb-8">
                    <div className="flex-1 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-4 rounded-xl text-center shadow-sm transition-all hover:scale-105">
                        <div className="text-3xl font-bold text-green-700 dark:text-green-400 mb-1">{sessionStats.correct}</div>
                        <div className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-500">Corretas</div>
                    </div>
                    <div className="flex-1 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-xl text-center shadow-sm transition-all hover:scale-105">
                        <div className="text-3xl font-bold text-red-700 dark:text-red-400 mb-1">{sessionStats.incorrect}</div>
                        <div className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-500">Incorretas</div>
                    </div>
                </div>

                {/* Flashcard */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-10 shadow-lg border border-gray-100 dark:border-gray-700 mb-8 transition-all duration-300">
                    <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 leading-relaxed">
                        {currentCard.mode === CardMode.Dictionary && (
                            <div className="flex flex-col gap-2">
                                <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-300 uppercase tracking-wide">
                                    <span className="text-sm">📖</span>
                                    <span>Dicionário</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-100">{currentCard.term || '(sem termo)'}</div>
                            </div>
                        )}
                        {currentCard.mode === CardMode.QA && <span dangerouslySetInnerHTML={renderHTML(currentCard.question)} />}
                        {currentCard.mode === CardMode.TrueFalse && <span dangerouslySetInnerHTML={renderHTML(currentCard.statement)} />}
                        {currentCard.mode === CardMode.MultipleChoice && <span dangerouslySetInnerHTML={renderHTML(currentCard.question)} />}
                        {currentCard.mode === CardMode.FillInTheBlank && <span dangerouslySetInnerHTML={renderHTML(currentCard.question)} />}
                        {currentCard.mode === CardMode.PracticalExample && (
                            <div className="space-y-4">
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border-l-4 border-indigo-500">
                                    <span className="font-bold text-indigo-700 dark:text-indigo-300 block mb-1">Problema:</span>
                                    <span className="text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={renderHTML(currentCard.problem)} />
                                </div>
                                <div>
                                    <span className="font-bold text-gray-900 dark:text-white block mb-2">Pergunta:</span>
                                    <span className="text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={renderHTML(currentCard.question)} />
                                </div>
                            </div>
                        )}
                    </h2>
                </div>

                {/* Notes Button - Only visible after answering */}
                {showResult && (
                    <>
                        <div className="mb-6 animate-fade-in">
                            <button
                                onClick={() => setShowNotesPanel(!showNotesPanel)}
                                className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${showNotesPanel
                                    ? 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-400'
                                    : 'bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <span className="text-xl">📝</span>
                                <span>Anotações</span>
                                {hasNote && (
                                    <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        ●
                                    </span>
                                )}
                                <span className="ml-auto text-sm">
                                    {showNotesPanel ? '▲' : '▼'}
                                </span>
                            </button>
                        </div>

                        {/* Notes Panel */}
                        {showNotesPanel && (
                            <div className="mb-8 bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-6 animate-slide-down">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                        <span>📝</span> Suas Anotações
                                    </h3>
                                    <span className={`text-sm font-medium ${currentNote.length > 1000
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-gray-500 dark:text-gray-400'
                                        }`}>
                                        {currentNote.length}/1000
                                    </span>
                                </div>

                                <textarea
                                    value={currentNote}
                                    onChange={(e) => {
                                        if (e.target.value.length <= 1000) {
                                            setCurrentNote(e.target.value);
                                        }
                                    }}
                                    placeholder="Digite suas anotações sobre este flashcard... (máximo 1000 caracteres)"
                                    rows={6}
                                    className="w-full p-4 border-2 border-amber-200 dark:border-amber-700 rounded-lg text-base outline-none focus:border-amber-400 dark:focus:border-amber-500 transition-colors bg-white dark:bg-gray-800 dark:text-white resize-y"
                                />

                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={saveNote}
                                        disabled={isSavingNote}
                                        className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white border-none rounded-lg font-semibold cursor-pointer transition-all shadow-sm disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSavingNote ? (
                                            <>
                                                <span className="animate-spin">⏳</span>
                                                <span>Salvando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>💾</span>
                                                <span>Salvar Anotação</span>
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => {
                                            setCurrentNote('');
                                            setShowNotesPanel(false);
                                        }}
                                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-none rounded-lg font-semibold cursor-pointer transition-all"
                                    >
                                        Cancelar
                                    </button>
                                </div>

                                <p className="text-xs text-amber-700 dark:text-amber-400 mt-3 flex items-start gap-2">
                                    <span>💡</span>
                                    <span>Suas anotações são privadas e vinculadas a este flashcard específico.</span>
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* Answer Input */}
                {
                    !showResult && (
                        <div className="animate-fade-in">
                            {(currentCard.mode === CardMode.QA || currentCard.mode === CardMode.PracticalExample || currentCard.mode === CardMode.FillInTheBlank || currentCard.mode === CardMode.Dictionary) && (
                                <textarea
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    placeholder="Digite sua resposta..."
                                    rows={4}
                                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-transparent dark:text-white mb-6 resize-y"
                                />
                            )}

                            {currentCard.mode === CardMode.TrueFalse && (
                                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                    <button
                                        onClick={() => setSelectedOption(0)}
                                        className={`flex-1 p-4 rounded-xl text-lg font-semibold transition-all duration-200 border-2 flex items-center justify-center gap-2 ${selectedOption === 0
                                            ? 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-400'
                                            : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <span>✓</span> Verdadeiro
                                    </button>
                                    <button
                                        onClick={() => setSelectedOption(1)}
                                        className={`flex-1 p-4 rounded-xl text-lg font-semibold transition-all duration-200 border-2 flex items-center justify-center gap-2 ${selectedOption === 1
                                            ? 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-400'
                                            : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <span>✗</span> Falso
                                    </button>
                                </div>
                            )}

                            {currentCard.mode === CardMode.MultipleChoice && currentCard.options && (
                                <div className="flex flex-col gap-3 mb-8">
                                    {currentCard.options.map((option: string, index: number) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedOption(index)}
                                            className={`w-full p-4 rounded-xl text-left text-base transition-all duration-200 border-2 flex items-center gap-3 ${selectedOption === index
                                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm'
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-indigo-300'
                                                }`}
                                        >
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${selectedOption === index
                                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-500 dark:text-gray-400'
                                                }`}>
                                                {String.fromCharCode(65 + index)}
                                            </span>
                                            <span dangerouslySetInnerHTML={renderHTML(option)} />
                                        </button>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={evaluateAnswer}
                                disabled={
                                    (currentCard.mode === CardMode.QA || currentCard.mode === CardMode.PracticalExample || currentCard.mode === CardMode.FillInTheBlank || currentCard.mode === CardMode.Dictionary) && !userAnswer.trim() ||
                                    (currentCard.mode === CardMode.TrueFalse || currentCard.mode === CardMode.MultipleChoice) && selectedOption === null
                                }
                                className={`w-full py-4 bg-indigo-600 text-white border-none rounded-xl text-lg font-bold cursor-pointer hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform active:scale-[0.99]`}
                            >
                                Verificar Resposta
                            </button>
                        </div>
                    )
                }

                {/* Result */}
                {
                    showResult && (
                        <div className="animate-slide-up">
                            {/* Q&A Self-Evaluation */}
                            {currentCard.mode === CardMode.QA || currentCard.mode === CardMode.PracticalExample || currentCard.mode === CardMode.Dictionary ? (
                                <div>
                                    <div className="p-6 rounded-xl border-2 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 mb-6">
                                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                            📖 Resposta Correta
                                        </h3>

                                        <div className="space-y-4">
                                            <div className="bg-white/50 dark:bg-black/20 p-4 rounded-lg">
                                                <p
                                                    className="text-lg text-gray-800 dark:text-gray-200 font-medium leading-relaxed"
                                                    dangerouslySetInnerHTML={renderHTML(
                                                        currentCard.mode === CardMode.QA
                                                            ? currentCard.answer
                                                            : currentCard.mode === CardMode.Dictionary
                                                                ? (currentCard as any).definition || ''
                                                                : (currentCard as any).solution || ''
                                                    )}
                                                />
                                            </div>

                                            {currentCard.mode === CardMode.PracticalExample && (currentCard as any).explanation && (
                                                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Explica��ǜo</p>
                                                    <p
                                                        className="text-gray-700 dark:text-gray-300 leading-relaxed"
                                                        dangerouslySetInnerHTML={renderHTML((currentCard as any).explanation)}
                                                    />
                                                </div>
                                            )}

                                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                                                <p className="text-sm font-bold text-yellow-800 dark:text-yellow-300 mb-2">
                                                    💭 Sua Resposta:
                                                </p>
                                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                                    {userAnswer || "(vazio)"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Self-Evaluation Buttons */}
                                    <div className="space-y-3">
                                        <p className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">
                                            Como você avalia sua resposta?
                                        </p>

                                        <button
                                            onClick={() => handleSelfEvaluation('correct')}
                                            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-none rounded-xl text-lg font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-3 group transform active:scale-[0.98]"
                                        >
                                            <span className="text-2xl">✅</span>
                                            <span>Acertei</span>
                                            <span className="text-sm opacity-90 bg-white/20 px-2 py-1 rounded-full">+10 XP</span>
                                        </button>

                                        <button
                                            onClick={() => handleSelfEvaluation('almost')}
                                            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-none rounded-xl text-lg font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-3 group transform active:scale-[0.98]"
                                        >
                                            <span className="text-2xl">⚠️</span>
                                            <span>Quase</span>
                                            <span className="text-sm opacity-90 bg-white/20 px-2 py-1 rounded-full">+2 XP</span>
                                        </button>

                                        <button
                                            onClick={() => handleSelfEvaluation('incorrect')}
                                            className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white border-none rounded-xl text-lg font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-3 group transform active:scale-[0.98]"
                                        >
                                            <span className="text-2xl">❌</span>
                                            <span>Errei</span>
                                            <span className="text-sm opacity-90 bg-white/20 px-2 py-1 rounded-full">0 XP</span>
                                        </button>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={openEditModal}
                                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 cursor-pointer text-sm font-semibold transition-colors"
                                        >
                                            Editar Flashcard
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Automatic Evaluation for other modes */
                                <div>
                                    <div className={`p-6 rounded-xl border-2 mb-6 ${result === 'correct'
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                        }`}>
                                        <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${result === 'correct' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                                            }`}>
                                            {result === 'correct' ? '✅ Correto!' : '❌ Incorreto'}
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                                    Resposta correta
                                                </p>
                                                <p className="text-lg text-gray-800 dark:text-gray-200 font-medium">
                                                    {currentCard.mode === CardMode.TrueFalse && (currentCard.isTrue ? 'Verdadeiro' : 'Falso')}
                                                    {currentCard.mode === CardMode.MultipleChoice && <span dangerouslySetInnerHTML={renderHTML(currentCard.options[currentCard.correctAnswerIndex])} />}
                                                    {currentCard.mode === CardMode.FillInTheBlank && <span dangerouslySetInnerHTML={renderHTML(currentCard.answer)} />}
                                                </p>
                                            </div>

                                            {(
                                                ((currentCard.mode === CardMode.TrueFalse || currentCard.mode === CardMode.MultipleChoice) && currentCard.explanation)
                                            ) && (
                                                    <div className="bg-white/50 dark:bg-black/20 p-4 rounded-lg">
                                                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                                            Explicação
                                                        </p>
                                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed" dangerouslySetInnerHTML={renderHTML((currentCard.mode === CardMode.TrueFalse || currentCard.mode === CardMode.MultipleChoice) && currentCard.explanation ? currentCard.explanation : "Veja a solução acima.")} />
                                                    </div>
                                                )}

                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700/50">
                                                <span>XP Ganho:</span>
                                                <span className={result === 'correct' ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-400'}>
                                                    {result === 'correct' ? '+10 XP' : '0 XP'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleNext}
                                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white border-none rounded-xl text-lg font-bold cursor-pointer hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2 group"
                                    >
                                        {currentIndex < flashcards.length - 1 ? (
                                            <>Próximo Flashcard <span className="group-hover:translate-x-1 transition-transform">→</span></>
                                        ) : (
                                            'Finalizar Sessão'
                                        )}
                                    </button>
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={openEditModal}
                                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 cursor-pointer text-sm font-semibold transition-colors"
                                        >
                                            Editar Flashcard
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }
            </div>

            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative border border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setShowEditModal(false)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                            aria-label="Fechar edição"
                        >
                            X
                        </button>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Editar flashcard</h3>
                        <div className="space-y-4">
                            {renderEditFields()}
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                disabled={isSavingEdit}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={saveEdit}
                                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors disabled:opacity-70"
                                disabled={isSavingEdit}
                            >
                                {isSavingEdit ? 'Salvando...' : 'Salvar alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
};

export default Study;
