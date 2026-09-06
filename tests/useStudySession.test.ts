import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStudySession } from '../hooks/useStudySession';
import { useStopwatch } from '../hooks/useStopwatch';
import { CardMode, FeedbackStatus } from '../types';

// Mock do react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock do deckService
vi.mock('../services/deckService', () => ({
  updateLastStudied: vi.fn().mockResolvedValue(undefined),
}));

// Mock do Supabase Client
const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({ data: { name: 'Deck de Testes' }, error: null }),
  single: vi.fn().mockResolvedValue({ data: { id: 'sim-session-1' }, error: null }),
};

vi.mock('../services/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => mockSupabaseQuery),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  },
}));

describe('useStudySession Hook - Automação de Testes de Estudo', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  const sampleCards = [
    {
      id: 'card-1',
      deckId: 'deck-1',
      mode: CardMode.MultipleChoice,
      question: 'Qual é a capital do Brasil?',
      options: ['São Paulo', 'Brasília', 'Rio de Janeiro', 'Salvador'],
      correctAnswerIndex: 1,
      interval: 0,
      repetition: 0,
      easeFactor: 2.5,
    },
    {
      id: 'card-2',
      deckId: 'deck-1',
      mode: CardMode.TrueFalse,
      question: 'O Sol é um planeta.',
      isTrue: false,
      interval: 1,
      repetition: 1,
      easeFactor: 2.5,
    },
    {
      id: 'card-3',
      deckId: 'deck-1',
      mode: CardMode.FillInTheBlank,
      question: 'A capital da França é _____.',
      answer: 'Paris',
      interval: 6,
      repetition: 2,
      easeFactor: 2.5,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    mockSupabaseQuery.select.mockReturnThis();
    mockSupabaseQuery.eq.mockReturnThis();
    mockSupabaseQuery.in.mockReturnThis();
    mockSupabaseQuery.or.mockResolvedValue({
      data: [...sampleCards],
      error: null,
    });
  });

  describe('1. Avanço de Cards e Fila de Estudo', () => {
    it('deve inicializar com o primeiro card e currentIndex zero', async () => {
      const { result } = renderHook(() =>
        useStudySession({ deckId: 'deck-1', user: mockUser })
      );

      await act(async () => {
        // Aguarda resolução dos useEffects de carga
      });

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.currentCard?.id).toBe('card-1');
      expect(result.current.sessionStats).toEqual({ correct: 0, incorrect: 0 });
    });

    it('deve avançar para o próximo card ao avaliar como correto', async () => {
      const { result } = renderHook(() =>
        useStudySession({ deckId: 'deck-1', user: mockUser })
      );

      await act(async () => {});

      await act(async () => {
        await result.current.handleSelfEvaluation('correct');
      });

      expect(result.current.currentIndex).toBe(1);
      expect(result.current.currentCard?.id).toBe('card-2');
      expect(result.current.sessionStats.correct).toBe(1);
      expect(result.current.sessionStats.incorrect).toBe(0);
    });

    it('deve reordenar e enviar card com erro para o final da fila quando falhar', async () => {
      const { result } = renderHook(() =>
        useStudySession({ deckId: 'deck-1', user: mockUser })
      );

      await act(async () => {});

      const firstCardId = result.current.currentCard?.id;

      await act(async () => {
        await result.current.handleSelfEvaluation('incorrect');
      });

      // O card que errou deve ir para o fim da fila
      const lastCard = result.current.flashcards[result.current.flashcards.length - 1];
      expect(lastCard.id).toBe(firstCardId);
      expect(result.current.sessionStats.incorrect).toBe(1);
    });

    it('deve concluir a sessão e redirecionar ao responder o último card', async () => {
      const { result } = renderHook(() =>
        useStudySession({ deckId: 'deck-1', user: mockUser })
      );

      await act(async () => {});

      // Responde os 3 cards
      await act(async () => {
        await result.current.handleSelfEvaluation('correct');
      });
      await act(async () => {
        await result.current.handleSelfEvaluation('correct');
      });
      await act(async () => {
        await result.current.handleSelfEvaluation('correct');
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        '/dashboard',
        expect.objectContaining({
          state: expect.objectContaining({
            message: expect.stringContaining('Sessão concluída!'),
          }),
        })
      );
    });
  });

  describe('2. Avaliação e Cálculo de Acertos (evaluateAnswer)', () => {
    it('deve validar acerto em card de Múltipla Escolha quando a opção selecionada for correta', async () => {
      const { result } = renderHook(() =>
        useStudySession({ deckId: 'deck-1', user: mockUser })
      );

      await act(async () => {});

      // card-1 tem correctAnswerIndex = 1 ('Brasília')
      act(() => {
        result.current.setSelectedOption(1);
      });

      act(() => {
        result.current.evaluateAnswer();
      });

      expect(result.current.showResult).toBe(true);
      expect(result.current.result).toBe('correct');
    });

    it('deve validar erro em card de Múltipla Escolha quando a opção for incorreta', async () => {
      const { result } = renderHook(() =>
        useStudySession({ deckId: 'deck-1', user: mockUser })
      );

      await act(async () => {});

      act(() => {
        result.current.setSelectedOption(0); // São Paulo (incorreto)
      });

      act(() => {
        result.current.evaluateAnswer();
      });

      expect(result.current.showResult).toBe(true);
      expect(result.current.result).toBe('incorrect');
    });

    it('deve validar acerto em card Certo/Errado (TrueFalse)', async () => {
      const { result } = renderHook(() =>
        useStudySession({ deckId: 'deck-1', user: mockUser })
      );

      await act(async () => {});

      // Avança para card-2 (isTrue = false)
      await act(async () => {
        await result.current.handleSelfEvaluation('correct');
      });

      expect(result.current.currentCard?.id).toBe('card-2');

      // Opção 1 = Errado, Opção 0 = Certo
      act(() => {
        result.current.setSelectedOption(1);
      });

      act(() => {
        result.current.evaluateAnswer();
      });

      expect(result.current.result).toBe('correct');
    });

    it('deve validar acerto em Lacuna com correspondência Levenshtein aproximada (>80%)', async () => {
      const { result } = renderHook(() =>
        useStudySession({ deckId: 'deck-1', user: mockUser })
      );

      await act(async () => {});

      // Avança para card-3 (answer = 'Paris')
      await act(async () => {
        await result.current.handleSelfEvaluation('correct');
      });
      await act(async () => {
        await result.current.handleSelfEvaluation('correct');
      });

      expect(result.current.currentCard?.id).toBe('card-3');

      // Resposta digitada com pequena variação: 'paris'
      act(() => {
        result.current.setUserAnswer('paris');
      });

      act(() => {
        result.current.evaluateAnswer();
      });

      expect(result.current.result).toBe('correct');
    });

    it('deve alternar marcação de needsEdit via toggleMarkForEdit', async () => {
      mockSupabaseQuery.update.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValueOnce({ error: null }),
        }),
      } as any);

      const { result } = renderHook(() =>
        useStudySession({ deckId: 'deck-1', user: mockUser })
      );

      await act(async () => {});

      expect(result.current.currentCard?.needsEdit).toBe(false);

      await act(async () => {
        await result.current.toggleMarkForEdit();
      });

      expect(result.current.currentCard?.needsEdit).toBe(true);
    });

    it('deve reembaralhar cards com shuffleCards', async () => {
      const { result } = renderHook(() =>
        useStudySession({ deckId: 'deck-1', user: mockUser })
      );

      await act(async () => {});

      act(() => {
        result.current.shuffleCards();
      });

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.showResult).toBe(false);
    });
  });

  describe('3. Controle de Timer de Estudo (useStopwatch)', () => {
    beforeEach(() => {
      localStorage.clear();
      vi.useFakeTimers();
    });

    it('deve inicializar em estado pausado com 0ms decorridos', () => {
      const { result } = renderHook(() => useStopwatch());

      expect(result.current.status).toBe('paused');
      expect(result.current.elapsedMs).toBe(0);
      expect(result.current.formattedTime).toBe('00:00');
    });

    it('deve iniciar a contagem do cronômetro quando start() for chamado', () => {
      const { result } = renderHook(() => useStopwatch());

      act(() => {
        result.current.start();
      });

      expect(result.current.status).toBe('running');

      // Avança 5 segundos no relógio simulado
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.elapsedMs).toBeGreaterThanOrEqual(5000);
      expect(result.current.formattedTime).toBe('00:05');
    });

    it('deve pausar a contagem quando pause() for chamado mantendo o tempo decorrido', () => {
      const { result } = renderHook(() => useStopwatch());

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      act(() => {
        result.current.pause();
      });

      expect(result.current.status).toBe('paused');
      const timeWhenPaused = result.current.elapsedMs;

      // Avança mais 5 segundos com cronômetro pausado
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.elapsedMs).toBe(timeWhenPaused);
    });

    it('deve zerar o tempo e status ao chamar reset()', () => {
      const { result } = renderHook(() => useStopwatch());

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('paused');
      expect(result.current.elapsedMs).toBe(0);
      expect(result.current.formattedTime).toBe('00:00');
    });
  });
});
