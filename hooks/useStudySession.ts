import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { applySm2 } from '../services/srsAlgorithm';
import { updateLastStudied } from '../services/deckService';
import { CardMode, FeedbackStatus } from '../types';
import type { FlashcardData } from '../types';

interface UseStudySessionParams {
    deckId: string | null;
    simulationId?: string | null;
    simulationMode?: boolean;
    user: any;
}

export const useStudySession = ({
    deckId,
    simulationId,
    simulationMode = false,
    user
}: UseStudySessionParams) => {
    const navigate = useNavigate();
    const [deckName, setDeckName] = useState('');
    const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
    const [loading, setLoading] = useState(true);
    const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });
    const [isDeleting, setIsDeleting] = useState(false);
    const [isMarkingForEdit, setIsMarkingForEdit] = useState(false);

    const sessionRecordsRef = useRef<Map<string, { result: 'correct' | 'incorrect'; xpEarned: number }>>(new Map());
    const isSimulatedStudy = simulationMode || Boolean(simulationId);
    const currentCard = flashcards[currentIndex];

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
        const card = {
            ...raw,
            isTrue: raw.isTrue ?? raw.is_true,
            correctAnswerIndex: raw.correctAnswerIndex ?? raw.correct_answer_index,
            deckId: raw.deckId ?? raw.deck_id,
            needsEdit: raw.needsEdit ?? raw.needs_edit ?? false,
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
                const { data: items, error } = await supabase
                    .from('simulation_items')
                    .select('*, flashcard:flashcards(*)')
                    .eq('simulation_id', simulationId);
                if (error) throw error;
                const cards = items?.map((item: any) => normalizeCard(item.flashcard)) || [];
                setFlashcards(cards);
                sessionRecordsRef.current = new Map();
                setSessionStats({ correct: 0, incorrect: 0 });
            } else if (deckId) {
                const getAllSubdeckIds = async (parentDeckId: string): Promise<string[]> => {
                    const { data: children, error } = await supabase
                        .from('decks')
                        .select('id')
                        .eq('user_id', user!.id)
                        .eq('parent_id', parentDeckId);
                    if (error || !children || children.length === 0) return [];
                    const childIds = children.map(child => child.id);
                    const nestedIds: string[] = [];
                    for (const childId of childIds) {
                        const nested = await getAllSubdeckIds(childId);
                        nestedIds.push(...nested);
                    }
                    return [...childIds, ...nestedIds];
                };

                const allSubdeckIds = await getAllSubdeckIds(deckId);
                const deckIdsToQuery = [deckId, ...allSubdeckIds];
                const { data, error } = await supabase
                    .from('flashcards')
                    .select('*')
                    .in('deck_id', deckIdsToQuery)
                    .eq('user_id', user!.id)
                    .or('next_review.is.null,next_review.lte.now()');
                if (error) throw error;
                const normalized = (data || []).map(normalizeCard);
                const shuffled = normalized.sort(() => Math.random() - 0.5);
                setFlashcards(shuffled as any);
                sessionRecordsRef.current = new Map();
                setSessionStats({ correct: 0, incorrect: 0 });
            }
        } catch (error) {
            console.error('Error loading flashcards:', error);
            alert('Erro ao carregar flashcards');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (deckId || simulationId) {
            loadFlashcards();
        }
    }, [deckId, simulationId]);

    const calculateSimilarity = (str1: string, str2: string): number => {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        if (longer.length === 0) return 1.0;
        if (str1 === str2) return 1.0;
        if (longer.includes(shorter)) return 0.7;
        const editDistance = levenshteinDistance(str1, str2);
        return (longer.length - editDistance) / longer.length;
    };

    const levenshteinDistance = (str1: string, str2: string): number => {
        const matrix: number[][] = [];
        for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
        for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
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

    const evaluateAnswer = () => {
        if (!currentCard) return;
        let evaluation: 'correct' | 'incorrect' = 'incorrect';
        if (currentCard.mode === CardMode.QA || currentCard.mode === CardMode.PracticalExample || currentCard.mode === CardMode.Dictionary) {
            setShowResult(true);
            setResult(null);
            return;
        }
        if (currentCard.mode === CardMode.TrueFalse) {
            const userSaysTrue = selectedOption === 0;
            const cardIsTrue = String(currentCard.isTrue).toLowerCase() === 'true';
            evaluation = userSaysTrue === cardIsTrue ? 'correct' : 'incorrect';
        } else if (currentCard.mode === CardMode.MultipleChoice) {
            evaluation = Number(selectedOption) === Number(currentCard.correctAnswerIndex) ? 'correct' : 'incorrect';
        } else if (currentCard.mode === CardMode.FillInTheBlank) {
            const correctAnswer = currentCard.answer;
            const similarity = calculateSimilarity(userAnswer.toLowerCase().trim(), correctAnswer.toLowerCase().trim());
            evaluation = similarity > 0.8 ? 'correct' : 'incorrect';
        }
        setResult(evaluation);
        setShowResult(true);
    };

    const qualityFromSelfEval = {
        incorrect: 0,
        almost: 3,
        correct: 5
    } as const;

    const qualityFromAuto = (isCorrect: boolean) => (isCorrect ? 5 : 0);

    const applySrsAndUpdate = async (card: FlashcardData, quality: number, feedbackOverride?: FeedbackStatus) => {
        if (isSimulatedStudy) return;
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

    const computeSessionStats = () => {
        let correct = 0;
        let incorrect = 0;
        sessionRecordsRef.current.forEach(record => {
            if (record.result === 'correct') correct += 1;
            else incorrect += 1;
        });
        return { correct, incorrect };
    };

    const recordSessionResult = async (cardId: string, resultValue: 'correct' | 'incorrect', xpEarned: number) => {
        sessionRecordsRef.current.set(cardId, { result: resultValue, xpEarned });
        setSessionStats(computeSessionStats());
        if (!user) return;
        const card = flashcards.find(fc => fc.id === cardId);
        const effectiveDeckId = (card as any)?.deckId ?? deckId;
        if (!effectiveDeckId) return;
        try {
            await supabase.from('study_sessions').insert({
                user_id: user.id,
                flashcard_id: cardId,
                deck_id: effectiveDeckId,
                result: resultValue,
                xp_earned: xpEarned
            });
            if (!isSimulatedStudy) {
                await updateLastStudied(effectiveDeckId);
            }
        } catch (error) {
            console.error('Error recording study result:', error);
        }
    };

    const saveStudySession = async (sessionResult: 'correct' | 'incorrect', customXp?: number) => {
        if (!currentCard) return;
        const xpEarned = customXp !== undefined ? customXp : sessionResult === 'correct' ? 10 : 0;
        await recordSessionResult(currentCard.id, sessionResult, xpEarned);
    };

    const flushSessionResults = async () => {
        const entries = Array.from(sessionRecordsRef.current.entries());
        const summary = computeSessionStats();
        if (isSimulatedStudy && simulationId && entries.length > 0 && user) {
            try {
                const accuracy = flashcards.length > 0 ? Math.round((summary.correct / flashcards.length) * 100) : 0;
                const { data: simSession, error: simSessionError } = await supabase
                    .from('simulation_sessions')
                    .insert({
                        simulation_id: simulationId,
                        user_id: user.id,
                        total_cards: flashcards.length,
                        correct: summary.correct,
                        incorrect: summary.incorrect,
                        accuracy
                    })
                    .select()
                    .single();
                if (simSessionError) throw simSessionError;
                if (simSession?.id) {
                    const itemsPayload = entries.map(([cardId, info]) => ({
                        simulation_session_id: simSession.id,
                        flashcard_id: cardId,
                        result: info.result
                    }));
                    const { error: itemsError } = await supabase
                        .from('simulation_session_items')
                        .insert(itemsPayload);
                    if (itemsError) throw itemsError;
                }
            } catch (error) {
                console.error('Error saving simulated session summary:', error);
            }
        }
        sessionRecordsRef.current.clear();
        setSessionStats({ correct: 0, incorrect: 0 });
        return summary;
    };

    const checkBadges = async () => {
        try {
            const { data: newBadges, error } = await supabase.rpc('sync_user_badges', { p_user_id: user!.id });
            if (error) {
                console.error('Error syncing badges via RPC:', error);
                return [];
            }
            return (newBadges || []).filter((b: any) => b.is_new);
        } catch (err) {
            console.error('Error checking badges:', err);
            return [];
        }
    };

    const handleSelfEvaluation = async (evaluation: 'correct' | 'almost' | 'incorrect') => {
        const xpMap = { correct: 10, almost: 2, incorrect: 0 };
        const xpEarned = xpMap[evaluation];
        if (!currentCard) return;
        const quality = qualityFromSelfEval[evaluation];
        await applySrsAndUpdate(currentCard, quality, evaluation === 'almost' ? FeedbackStatus.Almost : undefined);
        await saveStudySession(evaluation === 'correct' || evaluation === 'almost' ? 'correct' : 'incorrect', xpEarned);

        if (isSimulatedStudy) {
            if (currentIndex < flashcards.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setUserAnswer('');
                return;
            }
            const summary = await flushSessionResults();
            navigate(simulationId ? `/simulation/${simulationId}` : '/simulations', {
                state: {
                    message: `Sessão do simulado concluída! 🗸 ${summary.correct} corretas, ❌ ${summary.incorrect} incorretas`
                }
            });
            return;
        }

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
            const summary = await flushSessionResults();
            const newBadges = await checkBadges();
            navigate('/dashboard', {
                state: {
                    message: `Sessão concluída! 🗸 ${summary.correct} corretas, ❌ ${summary.incorrect} incorretas`,
                    newBadges: newBadges
                }
            });
        }
    };

    const handleNext = async () => {
        if (!currentCard) return;
        const quality = qualityFromAuto(result === 'correct');
        await applySrsAndUpdate(currentCard, quality);
        await saveStudySession(result === 'correct' ? 'correct' : 'incorrect');

        if (isSimulatedStudy) {
            if (currentIndex < flashcards.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setUserAnswer('');
                setSelectedOption(null);
                setShowResult(false);
                setResult(null);
                return;
            }
            const summary = await flushSessionResults();
            navigate(simulationId ? `/simulation/${simulationId}` : '/simulations', {
                state: {
                    message: `Sessão do simulado concluída! 🗸 ${summary.correct} corretas, ❌ ${summary.incorrect} incorretas`
                }
            });
            return;
        }

        if (quality < 3) {
            setCurrentIndex(prev => (prev >= flashcards.length - 1 ? 0 : prev));
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
            const summary = await flushSessionResults();
            const newBadges = await checkBadges();
            navigate('/dashboard', {
                state: {
                    message: `Sessão concluída! 🗸 ${summary.correct} corretas, ❌ ${summary.incorrect} incorretas`,
                    newBadges: newBadges
                }
            });
        }
    };

    const handleDeleteCurrentCard = async () => {
        if (!currentCard) return;
        if (!confirm('Tem certeza que deseja excluir este flashcard?')) return;
        try {
            setIsDeleting(true);
            const { error } = await supabase
                .from('flashcards')
                .delete()
                .eq('id', currentCard.id);
            if (error) throw error;
            setFlashcards(prev => {
                const updated = [...prev];
                updated.splice(currentIndex, 1);
                return updated;
            });
            const nextLength = flashcards.length - 1;
            const nextIndex = Math.max(0, Math.min(currentIndex, nextLength - 1));
            setCurrentIndex(nextIndex);
            setShowResult(false);
            setResult(null);
            setSelectedOption(null);
            setUserAnswer('');
            if (nextLength <= 0) {
                alert('Flashcard excluído. Não há mais itens neste deck para estudar.');
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Error deleting current flashcard:', error);
            alert('Erro ao excluir flashcard. Tente novamente.');
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleMarkForEdit = async () => {
        if (!currentCard || !user) return;
        const nextValue = !currentCard.needsEdit;
        try {
            setIsMarkingForEdit(true);
            const { error } = await supabase
                .from('flashcards')
                .update({ needs_edit: nextValue })
                .eq('id', currentCard.id)
                .eq('user_id', user.id);
            if (error) throw error;
            setFlashcards(prev =>
                prev.map((fc, idx) => (idx === currentIndex || fc.id === currentCard.id ? { ...fc, needsEdit: nextValue } : fc))
            );
        } catch (error) {
            console.error('Erro ao marcar/desmarcar flashcard para edição:', error);
            alert('Erro ao marcar ou desmarcar este flashcard. Tente novamente.');
        } finally {
            setIsMarkingForEdit(false);
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

    return {
        deckName,
        flashcards,
        currentCard,
        currentIndex,
        userAnswer,
        setUserAnswer,
        selectedOption,
        setSelectedOption,
        showResult,
        result,
        loading,
        sessionStats,
        isDeleting,
        isMarkingForEdit,
        evaluateAnswer,
        handleSelfEvaluation,
        handleNext,
        handleDeleteCurrentCard,
        toggleMarkForEdit,
        shuffleCards
    };
};
