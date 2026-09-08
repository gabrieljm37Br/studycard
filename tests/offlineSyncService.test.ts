import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
    clearAllOfflineData,
    isOnline,
    cacheDecks,
    getCachedDecks,
    cacheFlashcards,
    getCachedFlashcards,
    updateCachedCard,
    queueSrsReview,
    getPendingSyncCount,
    getPendingQueue,
    syncPendingQueue
} from '../services/offlineSyncService';
import { supabase } from '../services/supabaseClient';
import * as deckService from '../services/deckService';
import { CardMode } from '../types';
import type { Deck, FlashcardData } from '../types';

describe('offlineSyncService - Persistência IndexedDB e Sincronização SM-2', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        await clearAllOfflineData();
    });

    it('deve verificar status de conectividade online', () => {
        expect(isOnline()).toBe(true);
    });

    it('deve armazenar e recuperar decks em cache no IndexedDB', async () => {
        const mockDecks: Deck[] = [
            { id: 'deck-1', name: 'Biologia Celular', user_id: 'user-1', parent_id: null, created_at: new Date().toISOString() },
            { id: 'deck-2', name: 'Histologia', user_id: 'user-1', parent_id: null, created_at: new Date().toISOString() }
        ];

        await cacheDecks(mockDecks);
        const retrieved = await getCachedDecks('user-1');

        expect(retrieved).toHaveLength(2);
        expect(retrieved[0].name).toBe('Biologia Celular');
        expect(retrieved[1].name).toBe('Histologia');
    });

    it('deve armazenar e recuperar flashcards em cache por deckId', async () => {
        const mockCards: FlashcardData[] = [
            {
                id: 'card-1',
                deckId: 'deck-1',
                mode: CardMode.QA,
                question: 'O que é mitocôndria?',
                answer: 'Organela celular.',
                interval: 1,
                repetition: 0,
                easeFactor: 2.5
            },
            {
                id: 'card-2',
                deckId: 'deck-1',
                mode: CardMode.QA,
                question: 'O que é ribossomo?',
                answer: 'Síntese proteica.',
                interval: 1,
                repetition: 0,
                easeFactor: 2.5
            }
        ];

        await cacheFlashcards('deck-1', mockCards);
        const retrieved = await getCachedFlashcards('deck-1');

        expect(retrieved).toHaveLength(2);
        expect(retrieved[0].question).toBe('O que é mitocôndria?');
        expect(retrieved[1].question).toBe('O que é ribossomo?');
    });

    it('deve atualizar o estado de um card no cache local', async () => {
        const mockCard: FlashcardData = {
            id: 'card-update-test',
            deckId: 'deck-1',
            mode: CardMode.QA,
            question: 'Questão teste',
            answer: 'Resposta teste',
            interval: 1,
            repetition: 0,
            easeFactor: 2.5
        };

        await cacheFlashcards('deck-1', [mockCard]);
        await updateCachedCard('card-update-test', { interval: 6, repetition: 2, easeFactor: 2.6 });

        const retrieved = await getCachedFlashcards('deck-1');
        expect(retrieved[0].interval).toBe(6);
        expect(retrieved[0].repetition).toBe(2);
        expect(retrieved[0].easeFactor).toBe(2.6);
    });

    it('deve enfileirar revisões SM-2 offline e incrementar o contador de pendências', async () => {
        expect(await getPendingSyncCount()).toBe(0);

        await queueSrsReview({
            cardId: 'card-123',
            srsData: {
                interval: 10,
                repetition: 3,
                ease_factor: 2.7,
                next_review: new Date().toISOString(),
                feedback: 'correct'
            },
            sessionData: {
                user_id: 'user-1',
                flashcard_id: 'card-123',
                deck_id: 'deck-1',
                result: 'correct',
                xp_earned: 10
            },
            deckId: 'deck-1'
        });

        expect(await getPendingSyncCount()).toBe(1);
        const queue = await getPendingQueue();
        expect(queue).toHaveLength(1);
        expect(queue[0].type).toBe('SRS_REVIEW');
        expect(queue[0].cardId).toBe('card-123');
    });

    it('deve processar a sincronização das revisões pendentes com Supabase', async () => {
        vi.spyOn(deckService, 'updateLastStudied').mockResolvedValue(undefined);
        // Enfileirar duas revisões offline
        await queueSrsReview({
            cardId: 'card-sync-1',
            srsData: {
                interval: 5,
                repetition: 2,
                ease_factor: 2.5,
                next_review: new Date().toISOString()
            },
            deckId: 'deck-1'
        });

        await queueSrsReview({
            cardId: 'card-sync-2',
            srsData: {
                interval: 15,
                repetition: 4,
                ease_factor: 2.8,
                next_review: new Date().toISOString()
            },
            deckId: 'deck-1'
        });

        expect(await getPendingSyncCount()).toBe(2);

        // Mock das chamadas Supabase
        const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
        const fromSpy = vi.spyOn(supabase, 'from').mockReturnValue({
            update: updateMock,
            insert: vi.fn().mockResolvedValue({ error: null })
        } as any);

        const result = await syncPendingQueue();

        expect(result.synced).toBe(2);
        expect(result.failed).toBe(0);
        expect(await getPendingSyncCount()).toBe(0);

        fromSpy.mockRestore();
    });
});
