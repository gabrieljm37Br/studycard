import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateLastStudied, getTopicogramDecks } from '../services/deckService';

const mockSupabaseQuery = {
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  not: vi.fn().mockReturnThis(),
  order: vi.fn(),
};

vi.mock('../services/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => mockSupabaseQuery),
  },
}));

describe('deckService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseQuery.update.mockReturnThis();
    mockSupabaseQuery.eq.mockReturnThis();
    mockSupabaseQuery.select.mockReturnThis();
    mockSupabaseQuery.not.mockReturnThis();
  });

  it('deve atualizar o timestamp de last_studied_at com sucesso', async () => {
    mockSupabaseQuery.eq.mockResolvedValueOnce({ error: null });

    await expect(updateLastStudied('deck-123')).resolves.toBeUndefined();
    expect(mockSupabaseQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ last_studied_at: expect.any(String) })
    );
  });

  it('deve lançar erro se a atualização de last_studied_at falhar', async () => {
    mockSupabaseQuery.eq.mockResolvedValueOnce({ error: new Error('Database error') });

    await expect(updateLastStudied('deck-err')).rejects.toThrow('Database error');
  });

  it('deve buscar e formatar decks do topicograma ordenados por estudo recente', async () => {
    const mockDecksData = [
      { id: 'd1', name: 'Biologia', last_studied_at: '2026-09-06T10:00:00Z', flashcards: [{}, {}, {}] },
      { id: 'd2', name: 'Física', last_studied_at: '2026-09-05T10:00:00Z', flashcards: null },
    ];

    mockSupabaseQuery.order.mockResolvedValueOnce({ data: mockDecksData, error: null });

    const result = await getTopicogramDecks('user-top-1');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'd1',
      name: 'Biologia',
      last_studied_at: '2026-09-06T10:00:00Z',
      flashcard_count: 3,
    });
    expect(result[1].flashcard_count).toBe(0);
  });

  it('deve lançar erro se a busca de decks do topicograma falhar', async () => {
    mockSupabaseQuery.order.mockResolvedValueOnce({ data: null, error: new Error('Fetch failed') });

    await expect(getTopicogramDecks('user-err')).rejects.toThrow('Fetch failed');
  });
});
