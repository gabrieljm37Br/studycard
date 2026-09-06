import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchHeatmap,
  fetchCardMaturity,
  fetchReviewForecast,
  fetchWeakestDecks,
  fetchDeckRecursiveMetrics
} from '../services/statsService';

vi.mock('../services/supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('statsService - Funções de Estatísticas e Análise', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve buscar pontos de heatmap via RPC get_study_heatmap', async () => {
    const { supabase } = await import('../services/supabaseClient');
    const mockPoints = [
      { date: '2026-09-01', count: 5 },
      { date: '2026-09-02', count: 12 },
    ];
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: mockPoints, error: null } as any);

    const result = await fetchHeatmap('user-stats-1');
    expect(result).toEqual(mockPoints);
  });

  it('deve buscar fatias de maturidade de cards mapeando categorias', async () => {
    const { supabase } = await import('../services/supabaseClient');
    const mockMaturity = [
      { status: 'Novos', count: 10 },
      { status: 'Aprendendo', count: 15 },
      { status: 'Jovens', count: 8 },
      { status: 'Maduros', count: 20 },
      { status: 'Outro', count: 5 }, // Cai no default 'Maduros'
    ];
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: mockMaturity, error: null } as any);

    const result = await fetchCardMaturity('user-stats-1');
    expect(result).toHaveLength(5);
    expect(result[0].status).toBe('Novos');
    expect(result[4].status).toBe('Maduros');
  });

  it('deve buscar previsão de revisões para os próximos dias', async () => {
    const { supabase } = await import('../services/supabaseClient');
    const mockForecast = [
      { date: '2026-09-07', count: 15 },
      { date: '2026-09-08', count: 22 },
    ];
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: mockForecast, error: null } as any);

    const result = await fetchReviewForecast('user-stats-1');
    expect(result).toEqual(mockForecast);
  });

  it('deve buscar os decks mais fracos com base na acurácia', async () => {
    const { supabase } = await import('../services/supabaseClient');
    const mockWeak = [
      { deck_id: 'd1', deck_name: 'Física Moderna', accuracy: 45.5, total: 20 },
    ];
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: mockWeak, error: null } as any);

    const result = await fetchWeakestDecks('user-stats-1');
    expect(result).toEqual(mockWeak);
  });

  it('deve buscar métricas recursivas completas do deck', async () => {
    const { supabase } = await import('../services/supabaseClient');
    const mockRecursive = {
      total_cards: 40,
      counts: { unseen: 5, learning: 10, reviewing: 20, almost: 5 },
      study_history: [],
      total_reviews: 35,
      total_correct: 30,
    };
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: mockRecursive, error: null } as any);

    const result = await fetchDeckRecursiveMetrics('deck-1');
    expect(result.total_cards).toBe(40);
    expect(result.total_correct).toBe(30);
  });
});
