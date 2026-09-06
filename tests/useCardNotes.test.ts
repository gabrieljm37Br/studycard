import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCardNotes } from '../hooks/useCardNotes';

// Mock do supabase
const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(),
  single: vi.fn(),
};

vi.mock('../services/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => mockSupabaseQuery),
  },
}));

describe('useCardNotes Hook', () => {
  const mockUser = { id: 'user-note-1', email: 'test@example.com' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseQuery.select.mockReturnThis();
    mockSupabaseQuery.insert.mockReturnThis();
    mockSupabaseQuery.update.mockReturnThis();
    mockSupabaseQuery.delete.mockReturnThis();
    mockSupabaseQuery.eq.mockReturnThis();
  });

  it('deve carregar anotação existente do card', async () => {
    mockSupabaseQuery.maybeSingle.mockResolvedValueOnce({
      data: { id: 'note-100', note_text: 'Lembrar de revisar este ponto.' },
      error: null,
    });

    const { result } = renderHook(() =>
      useCardNotes({ cardId: 'card-1', user: mockUser })
    );

    await act(async () => {});

    expect(result.current.currentNote).toBe('Lembrar de revisar este ponto.');
    expect(result.current.hasNote).toBe(true);
  });

  it('deve inicializar com nota vazia se não houver anotação salva', async () => {
    mockSupabaseQuery.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const { result } = renderHook(() =>
      useCardNotes({ cardId: 'card-2', user: mockUser })
    );

    await act(async () => {});

    expect(result.current.currentNote).toBe('');
    expect(result.current.hasNote).toBe(false);
  });

  it('deve salvar nova anotação via insert', async () => {
    mockSupabaseQuery.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    mockSupabaseQuery.single.mockResolvedValueOnce({
      data: { id: 'new-note-id', note_text: 'Nova nota de estudo' },
      error: null,
    });

    const { result } = renderHook(() =>
      useCardNotes({ cardId: 'card-3', user: mockUser })
    );

    await act(async () => {});

    act(() => {
      result.current.setCurrentNote('Nova nota de estudo');
    });

    await act(async () => {
      await result.current.saveNote();
    });

    expect(mockSupabaseQuery.insert).toHaveBeenCalledWith({
      user_id: 'user-note-1',
      flashcard_id: 'card-3',
      note_text: 'Nova nota de estudo',
    });
    expect(result.current.hasNote).toBe(true);
  });

  it('deve excluir nota existente se o texto for limpo para vazio', async () => {
    mockSupabaseQuery.maybeSingle.mockResolvedValueOnce({
      data: { id: 'note-existing', note_text: 'Nota antiga' },
      error: null,
    });

    const { result } = renderHook(() =>
      useCardNotes({ cardId: 'card-4', user: mockUser })
    );

    await act(async () => {});

    act(() => {
      result.current.setCurrentNote('');
    });

    await act(async () => {
      await result.current.saveNote();
    });

    expect(mockSupabaseQuery.delete).toHaveBeenCalled();
    expect(result.current.hasNote).toBe(false);
  });
});
