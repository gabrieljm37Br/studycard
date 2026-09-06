import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeckData } from '../hooks/useDeckData';
import { fetchDeckRecursiveMetrics, fetchOverview } from '../services/statsService';

// Mock do Supabase Client
const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
};

vi.mock('../services/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => mockSupabaseQuery),
    rpc: vi.fn(),
  },
}));

describe('useDeckData Hook - Automação de Linhagem e Métricas de Decks', () => {
  const mockUser = { id: 'user-abc-123', email: 'gabriel@example.com' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseQuery.select.mockReturnThis();
    mockSupabaseQuery.update.mockReturnThis();
    mockSupabaseQuery.eq.mockReturnThis();
    mockSupabaseQuery.order.mockReturnThis();
  });

  describe('1. Linhagem de Subdecks e Breadcrumb Trail', () => {
    it('deve montar breadcrumb básico para um deck raiz (sem pai)', async () => {
      // Retorno do deck atual (raiz: parent_id = null)
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: { name: 'Biologia Geral', parent_id: null },
        error: null,
      });

      // Retorno dos subdecks filhos imediatos
      mockSupabaseQuery.order.mockResolvedValueOnce({
        data: [
          { id: 'sub-1', name: 'Citologia' },
          { id: 'sub-2', name: 'Genética' },
        ],
        error: null,
      });

      const { result } = renderHook(() =>
        useDeckData({ deckId: 'deck-root', user: mockUser })
      );

      await act(async () => {});

      expect(result.current.deckName).toBe('Biologia Geral');
      expect(result.current.parentId).toBeNull();
      expect(result.current.breadcrumb).toEqual([
        { id: null, name: 'Meus Decks' },
        { id: 'deck-root', name: 'Biologia Geral' },
      ]);
      expect(result.current.subdecks).toHaveLength(2);
      expect(result.current.subdecks[0].name).toBe('Citologia');
    });

    it('deve rastrear a linhagem completa para subdecks aninhados (hierarquia pai -> filho)', async () => {
      // Deck atual: 'Citologia' cujo parent_id é 'deck-root'
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: { name: 'Citologia', parent_id: 'deck-root' },
        error: null,
      });

      // Subdecks de Citologia (vazio)
      mockSupabaseQuery.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Busca recursiva da linhagem: acha 'deck-root' (Ciências da Natureza) com parent_id null
      mockSupabaseQuery.maybeSingle.mockResolvedValueOnce({
        data: { id: 'deck-root', name: 'Ciências da Natureza', parent_id: null },
        error: null,
      });

      const { result } = renderHook(() =>
        useDeckData({ deckId: 'deck-child', user: mockUser })
      );

      await act(async () => {});

      expect(result.current.deckName).toBe('Citologia');
      expect(result.current.parentId).toBe('deck-root');
      expect(result.current.breadcrumb).toEqual([
        { id: null, name: 'Meus Decks' },
        { id: 'deck-root', name: 'Ciências da Natureza' },
        { id: 'deck-child', name: 'Citologia' },
      ]);
    });

    it('deve reconstruir corretamente hierarquias profundas de 3 níveis', async () => {
      // Deck: 'Divisão Celular' (parent: 'deck-citologia')
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: { name: 'Divisão Celular', parent_id: 'deck-citologia' },
        error: null,
      });
      mockSupabaseQuery.order.mockResolvedValueOnce({ data: [], error: null });

      // Nível 1 pai: 'deck-citologia' (parent: 'deck-biologia')
      mockSupabaseQuery.maybeSingle.mockResolvedValueOnce({
        data: { id: 'deck-citologia', name: 'Citologia', parent_id: 'deck-biologia' },
        error: null,
      });

      // Nível 2 pai: 'deck-biologia' (parent: null)
      mockSupabaseQuery.maybeSingle.mockResolvedValueOnce({
        data: { id: 'deck-biologia', name: 'Biologia', parent_id: null },
        error: null,
      });

      const { result } = renderHook(() =>
        useDeckData({ deckId: 'deck-deep', user: mockUser })
      );

      await act(async () => {});

      expect(result.current.breadcrumb).toEqual([
        { id: null, name: 'Meus Decks' },
        { id: 'deck-biologia', name: 'Biologia' },
        { id: 'deck-citologia', name: 'Citologia' },
        { id: 'deck-deep', name: 'Divisão Celular' },
      ]);
    });
  });

  describe('2. Edição e Renomeação do Deck (handleUpdateDeckName)', () => {
    it('deve atualizar o nome do deck com sucesso quando houver alteração válida', async () => {
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: { name: 'Nome Antigo', parent_id: null },
        error: null,
      });
      mockSupabaseQuery.order.mockResolvedValueOnce({ data: [], error: null });

      const { result } = renderHook(() =>
        useDeckData({ deckId: 'deck-10', user: mockUser })
      );

      await act(async () => {});

      // Simula alteração do nome
      act(() => {
        result.current.setTempDeckName('Nome Atualizado');
        result.current.setIsEditingName(true);
      });

      // Configura mock do update
      mockSupabaseQuery.update.mockReturnValueOnce({
        eq: vi.fn().mockResolvedValueOnce({ error: null }),
      } as any);

      await act(async () => {
        await result.current.handleUpdateDeckName();
      });

      expect(result.current.deckName).toBe('Nome Atualizado');
      expect(result.current.isEditingName).toBe(false);
    });

    it('não deve fazer chamada ao banco se o nome não tiver sido modificado', async () => {
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: { name: 'Nome Inalterado', parent_id: null },
        error: null,
      });
      mockSupabaseQuery.order.mockResolvedValueOnce({ data: [], error: null });

      const { result } = renderHook(() =>
        useDeckData({ deckId: 'deck-10', user: mockUser })
      );

      await act(async () => {});

      act(() => {
        result.current.setTempDeckName('Nome Inalterado');
        result.current.setIsEditingName(true);
      });

      await act(async () => {
        await result.current.handleUpdateDeckName();
      });

      expect(mockSupabaseQuery.update).not.toHaveBeenCalled();
      expect(result.current.isEditingName).toBe(false);
    });
  });

  describe('3. Cálculo de Métricas Recursivas de Decks', () => {
    it('deve processar métricas de deck com agrupamento de maturidade e retenção', async () => {
      const { supabase } = await import('../services/supabaseClient');
      const mockMetricsData = {
        total_cards: 50,
        counts: {
          unseen: 10,
          learning: 15,
          reviewing: 20,
          almost: 5,
        },
        study_history: [
          { date: '2026-09-01', count: 12, correct_count: 10 },
          { date: '2026-09-02', count: 8, correct_count: 7 },
        ],
        total_reviews: 20,
        total_correct: 17,
      };

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: mockMetricsData,
        error: null,
      } as any);

      const metrics = await fetchDeckRecursiveMetrics('deck-10');

      expect(metrics.total_cards).toBe(50);
      expect(metrics.counts.unseen).toBe(10);
      expect(metrics.counts.learning).toBe(15);
      expect(metrics.counts.reviewing).toBe(20);
      expect(metrics.total_reviews).toBe(20);
      expect(metrics.total_correct).toBe(17);

      // Validação do cálculo de acurácia histórica
      const accuracy = (metrics.total_correct / metrics.total_reviews) * 100;
      expect(accuracy).toBe(85);
    });

    it('deve calcular a taxa de retenção global no overview sem divisão por zero para decks vazios', async () => {
      const { supabase } = await import('../services/supabaseClient');
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { streak_current: 7 }, error: null }),
            }),
          } as any;
        }
        if (table === 'study_sessions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          } as any;
        }
        return mockSupabaseQuery as any;
      });

      const overview = await fetchOverview(mockUser.id);

      expect(overview.streak).toBe(7);
      expect(overview.totalStudied).toBe(0);
      expect(overview.retention).toBe(0); // Evita NaN / divisão por zero
    });
  });
});
