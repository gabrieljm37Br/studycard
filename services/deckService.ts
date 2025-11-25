import { supabase } from './supabaseClient';

/**
 * Interface for Topicogram deck data
 */
export interface TopicogramDeck {
    id: string;
    name: string;
    last_studied_at: string;
    flashcard_count?: number;
}

/**
 * Updates the last_studied_at timestamp for a deck to the current time
 * Called when a study session is completed
 * 
 * @param deckId - The UUID of the deck to update
 */
export async function updateLastStudied(deckId: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('decks')
            .update({ last_studied_at: new Date().toISOString() })
            .eq('id', deckId);

        if (error) {
            console.error('Error updating last_studied_at:', error);
            throw error;
        }
    } catch (err) {
        console.error('Failed to update deck timestamp:', err);
        throw err;
    }
}

/**
 * Fetches all decks that have been studied (last_studied_at is not null)
 * Ordered by most recently studied first
 * 
 * @param userId - The UUID of the user
 * @returns Array of TopicogramDeck objects
 */
export async function getTopicogramDecks(userId: string): Promise<TopicogramDeck[]> {
    try {
        const { data, error } = await supabase
            .from('decks')
            .select(`
                id,
                name,
                last_studied_at,
                flashcards:flashcards(count)
            `)
            .eq('user_id', userId)
            .not('last_studied_at', 'is', null)
            .order('last_studied_at', { ascending: false });

        if (error) {
            console.error('Error fetching topicogram decks:', error);
            throw error;
        }

        // Transform the data to include flashcard count
        const decks: TopicogramDeck[] = (data || []).map(deck => ({
            id: deck.id,
            name: deck.name,
            last_studied_at: deck.last_studied_at,
            flashcard_count: Array.isArray(deck.flashcards) ? deck.flashcards.length : 0
        }));

        return decks;
    } catch (err) {
        console.error('Failed to fetch topicogram decks:', err);
        throw err;
    }
}
