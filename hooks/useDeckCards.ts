import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { CardMode } from '../types';
import type { FlashcardData } from '../types';

interface UseDeckCardsParams {
    deckId: string | undefined;
}

export const useDeckCards = ({ deckId }: UseDeckCardsParams) => {
    const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [modeFilter, setModeFilter] = useState<CardMode | 'all'>('all');
    const [tagFilter, setTagFilter] = useState<string[]>([]);
    const [showAllTags, setShowAllTags] = useState(false);
    const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [isBulkMoving, setIsBulkMoving] = useState(false);

    const loadFlashcards = async () => {
        if (!deckId) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('flashcards')
                .select('*')
                .eq('deck_id', deckId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            const normalized = (data || []).map((card: any) => {
                const camelCard = {
                    ...card,
                    attachments: card.attachments || [],
                    isTrue: card.isTrue ?? card.is_true,
                    correctAnswerIndex: card.correctAnswerIndex ?? card.correct_answer_index,
                    needsEdit: (card as any).needsEdit ?? (card as any).needs_edit ?? false,
                };
                return camelCard.mode === CardMode.Dictionary
                    ? {
                        ...camelCard,
                        term: camelCard.term || camelCard.question || '',
                        definition: camelCard.definition || camelCard.answer || '',
                    }
                    : camelCard;
            });
            setFlashcards(normalized as any);
        } catch (error) {
            console.error('Error loading flashcards:', error);
            alert('Erro ao carregar flashcards');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (deckId) loadFlashcards();
    }, [deckId]);

    const availableTags = useMemo(() => {
        const tags = new Set<string>();
        flashcards.forEach(card => {
            const cardTags = (card as any).tags as string[] | undefined;
            cardTags?.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort((a, b) => a.localeCompare(b));
    }, [flashcards]);

    const filteredFlashcards = useMemo(() => {
        const activeTags = tagFilter.map(tag => tag.toLowerCase());
        return flashcards.filter(card => {
            const modeMatches = modeFilter === 'all' || card.mode === modeFilter;
            if (!modeMatches) return false;
            if (activeTags.length === 0) return true;
            const cardTags = ((card as any).tags as string[] | undefined) ?? [];
            const normalized = cardTags.map(tag => tag.toLowerCase());
            const hasAll = activeTags.every(tag => normalized.includes(tag));
            const hasAny = activeTags.some(tag => normalized.includes(tag));
            return hasAll || hasAny;
        });
    }, [flashcards, modeFilter, tagFilter]);

    const allVisibleSelected = filteredFlashcards.length > 0 && filteredFlashcards.every(card => selectedCards.has(card.id));

    useEffect(() => {
        setSelectedCards(prev => {
            const visibleIds = new Set(filteredFlashcards.map(card => card.id));
            return new Set([...prev].filter(id => visibleIds.has(id)));
        });
    }, [filteredFlashcards]);

    const handleTagToggle = (tag: string) => {
        setTagFilter(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const handleClearFilters = () => {
        setModeFilter('all');
        setTagFilter([]);
        setSelectedCards(new Set());
    };

    const toggleCardSelection = (cardId: string) => {
        const newSelected = new Set(selectedCards);
        if (newSelected.has(cardId)) newSelected.delete(cardId);
        else newSelected.add(cardId);
        setSelectedCards(newSelected);
    };

    const toggleSelectAll = () => {
        if (filteredFlashcards.length === 0) return;
        const newSelected = new Set(selectedCards);
        if (allVisibleSelected) {
            filteredFlashcards.forEach(card => newSelected.delete(card.id));
        } else {
            filteredFlashcards.forEach(card => newSelected.add(card.id));
        }
        setSelectedCards(newSelected);
    };

    const handleDeleteCard = async (cardId: string) => {
        if (!confirm('Tem certeza que deseja excluir este flashcard?')) return;
        try {
            const { error } = await supabase
                .from('flashcards')
                .delete()
                .eq('id', cardId);
            if (error) throw error;
            await loadFlashcards();
        } catch (error: any) {
            console.error('Error deleting flashcard:', error);
            alert(`Erro ao excluir flashcard: ${error.message || 'Erro desconhecido'}`);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedCards.size === 0) return;
        const count = selectedCards.size;
        if (!confirm(`Tem certeza que deseja excluir ${count} flashcard${count > 1 ? 's' : ''}?`)) return;
        try {
            setIsBulkDeleting(true);
            const { error } = await supabase
                .from('flashcards')
                .delete()
                .in('id', Array.from(selectedCards));
            if (error) throw error;
            setSelectedCards(new Set());
            await loadFlashcards();
        } catch (error) {
            console.error('Error deleting flashcards:', error);
            alert('Erro ao excluir flashcards');
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const handleBulkMove = async (targetDeckId: string) => {
        if (selectedCards.size === 0) return;
        try {
            setIsBulkMoving(true);
            const { error } = await supabase
                .from('flashcards')
                .update({ deck_id: targetDeckId })
                .in('id', Array.from(selectedCards));
            if (error) throw error;
            setSelectedCards(new Set());
            await loadFlashcards();
        } catch (error) {
            console.error('Error moving flashcards:', error);
            alert('Erro ao mover flashcards.');
        } finally {
            setIsBulkMoving(false);
        }
    };

    return {
        flashcards,
        loading,
        modeFilter,
        setModeFilter,
        tagFilter,
        availableTags,
        showAllTags,
        setShowAllTags,
        selectedCards,
        filteredFlashcards,
        allVisibleSelected,
        isBulkDeleting,
        isBulkMoving,
        handleTagToggle,
        handleClearFilters,
        toggleCardSelection,
        toggleSelectAll,
        handleDeleteCard,
        handleBulkDelete,
        handleBulkMove,
        reloadFlashcards: loadFlashcards
    };
};
