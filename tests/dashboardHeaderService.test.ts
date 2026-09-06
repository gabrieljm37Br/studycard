import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchProfileOverview,
  fetchTodayStats,
  searchDecks
} from '../services/dashboardHeaderService';

const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn(),
  single: vi.fn(),
};

vi.mock('../services/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => mockSupabaseQuery),
    rpc: vi.fn(),
  },
}));

describe('dashboardHeaderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseQuery.select.mockReturnThis();
    mockSupabaseQuery.eq.mockReturnThis();
    mockSupabaseQuery.order.mockReturnThis();
  });

  it('deve carregar visão geral do perfil e badges do usuário', async () => {
    mockSupabaseQuery.single.mockResolvedValueOnce({
      data: { xp: 350, level: 4, streak_current: 5 },
      error: null,
    });

    mockSupabaseQuery.limit.mockResolvedValueOnce({
      data: [
        { badges: { id: 'b1', name: 'Iniciante', icon: '🏆' } },
        { badges: { id: 'b2', name: '7 Dias', icon: '🔥' } },
      ],
      error: null,
    });

    const result = await fetchProfileOverview('user-dash-1');

    expect(result.profile).toEqual({ xp: 350, level: 4, streak: 5 });
    expect(result.badges).toHaveLength(2);
    expect(result.badges[0].name).toBe('Iniciante');
  });

  it('deve consultar estatísticas do dia via RPC get_today_stats', async () => {
    const { supabase } = await import('../services/supabaseClient');
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [{ studied_today: 10, correct_today: 8, xp_today: 80 }],
      error: null,
    } as any);

    const stats = await fetchTodayStats('user-dash-1');

    expect(stats.studiedToday).toBe(10);
    expect(stats.correctToday).toBe(8);
    expect(stats.xpToday).toBe(80);
    expect(stats.accuracyToday).toBe(80);
  });

  it('deve buscar decks via RPC search_decks', async () => {
    const { supabase } = await import('../services/supabaseClient');
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [
        { id: 'deck-1', name: 'Biologia Celular', path: 'Ciências / Biologia', flashcards_count: 15 },
      ],
      error: null,
    } as any);

    const decks = await searchDecks('bio', 'user-dash-1');

    expect(decks).toHaveLength(1);
    expect(decks[0].name).toBe('Biologia Celular');
    expect(decks[0].flashcardsCount).toBe(15);
  });
});
