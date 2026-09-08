import { supabase } from './supabaseClient';
import * as deckService from './deckService';
import type { Deck, FlashcardData } from '../types';

export interface SyncQueueItem {
    id?: number;
    type: 'SRS_REVIEW';
    cardId: string;
    payload: {
        srsData: {
            interval: number;
            repetition: number;
            ease_factor: number;
            next_review: string;
            feedback?: string;
        };
        sessionData?: {
            user_id: string;
            flashcard_id: string;
            deck_id: string;
            result: 'correct' | 'incorrect';
            xp_earned: number;
        };
        deckId?: string;
    };
    timestamp: number;
}

const DB_NAME = 'studycard_offline_db';
const DB_VERSION = 1;
let cachedDb: IDBDatabase | null = null;

/**
 * Open or return cached IndexedDB instance
 */
export function openDb(): Promise<IDBDatabase> {
    if (cachedDb) {
        return Promise.resolve(cachedDb);
    }

    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            return reject(new Error('IndexedDB not supported in this environment'));
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains('decks')) {
                db.createObjectStore('decks', { keyPath: 'id' });
            }

            if (!db.objectStoreNames.contains('flashcards')) {
                const cardStore = db.createObjectStore('flashcards', { keyPath: 'id' });
                cardStore.createIndex('deckId', 'deckId', { unique: false });
            }

            if (!db.objectStoreNames.contains('offline_sync_queue')) {
                const queueStore = db.createObjectStore('offline_sync_queue', {
                    keyPath: 'id',
                    autoIncrement: true
                });
                queueStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };

        request.onsuccess = () => {
            cachedDb = request.result;
            cachedDb.onclose = () => {
                cachedDb = null;
            };
            resolve(cachedDb);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Close database connection
 */
export function closeDb(): void {
    if (cachedDb) {
        cachedDb.close();
        cachedDb = null;
    }
}

/**
 * Check if the browser currently reports online connectivity
 */
export function isOnline(): boolean {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
        return navigator.onLine;
    }
    return true;
}

/**
 * Cache decks locally in IndexedDB
 */
export async function cacheDecks(decks: Deck[]): Promise<void> {
    try {
        const db = await openDb();
        const tx = db.transaction('decks', 'readwrite');
        const store = tx.objectStore('decks');

        for (const deck of decks) {
            store.put(deck);
        }

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (err) {
        console.warn('Failed to cache decks in IndexedDB:', err);
    }
}

/**
 * Retrieve cached decks from IndexedDB
 */
export async function getCachedDecks(userId?: string): Promise<Deck[]> {
    try {
        const db = await openDb();
        const tx = db.transaction('decks', 'readonly');
        const store = tx.objectStore('decks');
        const request = store.getAll();

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const all = (request.result as Deck[]) || [];
                if (userId) {
                    resolve(all.filter(d => d.user_id === userId));
                } else {
                    resolve(all);
                }
            };
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.warn('Failed to read cached decks from IndexedDB:', err);
        return [];
    }
}

/**
 * Cache flashcards for a specific deck in IndexedDB
 */
export async function cacheFlashcards(deckId: string, cards: FlashcardData[]): Promise<void> {
    try {
        const db = await openDb();
        const tx = db.transaction('flashcards', 'readwrite');
        const store = tx.objectStore('flashcards');

        for (const card of cards) {
            store.put({ ...card, deckId });
        }

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (err) {
        console.warn('Failed to cache flashcards in IndexedDB:', err);
    }
}

/**
 * Retrieve cached flashcards for a deck from IndexedDB
 */
export async function getCachedFlashcards(deckId: string): Promise<FlashcardData[]> {
    try {
        const db = await openDb();
        const tx = db.transaction('flashcards', 'readonly');
        const store = tx.objectStore('flashcards');
        const index = store.index('deckId');
        const request = index.getAll(IDBKeyRange.only(deckId));

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve((request.result as FlashcardData[]) || []);
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.warn('Failed to read cached flashcards from IndexedDB:', err);
        return [];
    }
}

/**
 * Update a single flashcard in local cache
 */
export async function updateCachedCard(cardId: string, updates: Partial<FlashcardData>): Promise<void> {
    try {
        const db = await openDb();
        const tx = db.transaction('flashcards', 'readwrite');
        const store = tx.objectStore('flashcards');
        const getReq = store.get(cardId);

        getReq.onsuccess = () => {
            if (getReq.result) {
                const updated = { ...getReq.result, ...updates };
                store.put(updated);
            }
        };

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (err) {
        console.warn('Failed to update cached card in IndexedDB:', err);
    }
}

/**
 * Enqueue an SM-2 review and study session to be synchronized when back online
 */
export async function queueSrsReview(params: {
    cardId: string;
    srsData: {
        interval: number;
        repetition: number;
        ease_factor: number;
        next_review: string;
        feedback?: string;
    };
    sessionData?: {
        user_id: string;
        flashcard_id: string;
        deck_id: string;
        result: 'correct' | 'incorrect';
        xp_earned: number;
    };
    deckId?: string;
}): Promise<void> {
    try {
        const db = await openDb();

        const queueItem: SyncQueueItem = {
            type: 'SRS_REVIEW',
            cardId: params.cardId,
            payload: {
                srsData: params.srsData,
                sessionData: params.sessionData,
                deckId: params.deckId
            },
            timestamp: Date.now()
        };

        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction('offline_sync_queue', 'readwrite');
            const store = tx.objectStore('offline_sync_queue');
            store.add(queueItem);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });

        // Also update local cached card state immediately
        await updateCachedCard(params.cardId, {
            interval: params.srsData.interval,
            repetition: params.srsData.repetition,
            easeFactor: params.srsData.ease_factor,
            nextReview: params.srsData.next_review,
            feedback: params.srsData.feedback as any
        });
    } catch (err) {
        console.warn('Failed to queue offline SRS review in IndexedDB:', err);
    }
}

/**
 * Count the number of pending items in the offline queue
 */
export async function getPendingSyncCount(): Promise<number> {
    try {
        const db = await openDb();
        const tx = db.transaction('offline_sync_queue', 'readonly');
        const store = tx.objectStore('offline_sync_queue');
        const countReq = store.count();

        return new Promise((resolve, reject) => {
            countReq.onsuccess = () => resolve(countReq.result);
            countReq.onerror = () => reject(countReq.error);
        });
    } catch (err) {
        return 0;
    }
}

/**
 * Retrieve all pending sync items
 */
export async function getPendingQueue(): Promise<SyncQueueItem[]> {
    try {
        const db = await openDb();
        const tx = db.transaction('offline_sync_queue', 'readonly');
        const store = tx.objectStore('offline_sync_queue');
        const request = store.getAll();

        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve((request.result as SyncQueueItem[]) || []);
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        return [];
    }
}

/**
 * Clear all data from stores (useful for test resets and logout)
 */
export async function clearAllOfflineData(): Promise<void> {
    try {
        const db = await openDb();
        const tx = db.transaction(['decks', 'flashcards', 'offline_sync_queue'], 'readwrite');
        tx.objectStore('decks').clear();
        tx.objectStore('flashcards').clear();
        tx.objectStore('offline_sync_queue').clear();
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (err) {
        console.warn('Failed to clear offline data:', err);
    }
}

/**
 * Process and flush the pending offline queue to Supabase
 */
export async function syncPendingQueue(): Promise<{ synced: number; failed: number }> {
    if (!isOnline()) {
        return { synced: 0, failed: 0 };
    }

    const items = await getPendingQueue();
    if (items.length === 0) {
        return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;
    const db = await openDb();

    const syncedIds: number[] = [];

    for (const item of items) {
        try {
            if (item.type === 'SRS_REVIEW') {
                // 1. Update flashcard SRS state in Supabase
                const { error: srsError } = await supabase
                    .from('flashcards')
                    .update(item.payload.srsData)
                    .eq('id', item.cardId);

                if (srsError) throw srsError;

                // 2. Insert study session record in Supabase
                if (item.payload.sessionData) {
                    const { error: sessionError } = await supabase
                        .from('study_sessions')
                        .insert(item.payload.sessionData);
                    if (sessionError) throw sessionError;
                }

                // 3. Update last studied timestamp
                if (item.payload.deckId) {
                    await deckService.updateLastStudied(item.payload.deckId).catch(() => {});
                }

                if (item.id !== undefined) {
                    syncedIds.push(item.id);
                }

                synced++;
            }
        } catch (err) {
            console.error('Failed to sync offline item to Supabase:', err);
            failed++;
        }
    }

    if (syncedIds.length > 0) {
        const deleteTx = db.transaction('offline_sync_queue', 'readwrite');
        const store = deleteTx.objectStore('offline_sync_queue');
        for (const id of syncedIds) {
            store.delete(id);
        }
        await new Promise<void>((res, rej) => {
            deleteTx.oncomplete = () => res();
            deleteTx.onerror = () => rej(deleteTx.error);
        });
    }

    return { synced, failed };
}
