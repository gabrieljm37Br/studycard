import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeckCardItem } from '../components/deck-details/DeckCardItem';
import { CardMode } from '../types';
import type { FlashcardData } from '../types';

describe('DeckCardItem - Testes de Componente React', () => {
  const baseCard: FlashcardData = {
    id: 'card-123',
    deckId: 'deck-1',
    mode: CardMode.QA,
    question: 'Qual é a capital do Brasil?',
    answer: 'Brasília',
    interval: 1,
    repetition: 1,
    easeFactor: 2.5,
  };

  const defaultProps = {
    card: baseCard,
    isSelected: false,
    onToggleSelect: vi.fn(),
    onEdit: vi.fn(),
    onMove: vi.fn(),
    onDelete: vi.fn(),
  };

  describe('1. Alternância entre Modos de Flashcards', () => {
    it('deve renderizar corretamente card no modo QA (Pergunta & Resposta)', () => {
      render(<DeckCardItem {...defaultProps} />);

      expect(screen.getByText('Pergunta & Resposta')).toBeDefined();
      expect(screen.getByText('Qual é a capital do Brasil?')).toBeDefined();
      expect(screen.getByText('Brasília')).toBeDefined();
    });

    it('deve renderizar corretamente card no modo Lacunas (FillInTheBlank)', () => {
      const lacunaCard: FlashcardData = {
        ...baseCard,
        id: 'card-lacuna',
        mode: CardMode.FillInTheBlank,
        question: 'A mitocôndria é responsável pela _____ celular.',
        answer: 'respiração',
      };

      render(<DeckCardItem {...defaultProps} card={lacunaCard} />);

      expect(screen.getByText('Lacunas')).toBeDefined();
      expect(screen.getByText(/A mitocôndria é responsável/i)).toBeDefined();
      expect(screen.getByText('respiração')).toBeDefined();
    });

    it('deve renderizar corretamente card no modo Dicionário (Dictionary)', () => {
      const dictCard: any = {
        ...baseCard,
        id: 'card-dict',
        mode: CardMode.Dictionary,
        term: 'Sinapse',
        definition: 'Região de comunicação entre dois neurônios.',
      };

      render(<DeckCardItem {...defaultProps} card={dictCard} />);

      expect(screen.getByText('Dicionário')).toBeDefined();
      expect(screen.getByText('Sinapse')).toBeDefined();
      expect(screen.getByText('Região de comunicação entre dois neurônios.')).toBeDefined();
    });

    it('deve renderizar badge "Precisa de ajustes" quando needsEdit for true', () => {
      const editCard: FlashcardData = {
        ...baseCard,
        needsEdit: true,
      };

      render(<DeckCardItem {...defaultProps} card={editCard} />);

      expect(screen.getByText(/Precisa de ajustes/i)).toBeDefined();
    });

    it('deve renderizar tags do card com prefixo #', () => {
      const taggedCard: any = {
        ...baseCard,
        tags: ['biologia', 'citologia'],
      };

      render(<DeckCardItem {...defaultProps} card={taggedCard} />);

      expect(screen.getByText('#biologia')).toBeDefined();
      expect(screen.getByText('#citologia')).toBeDefined();
    });
  });

  describe('2. Ações do Usuário (Edição, Exclusão, Movimentação e Seleção)', () => {
    it('deve disparar onEdit com o objeto do card ao clicar no botão de edição', () => {
      const onEditMock = vi.fn();
      render(<DeckCardItem {...defaultProps} onEdit={onEditMock} />);

      const editButton = screen.getByTitle('Editar');
      fireEvent.click(editButton);

      expect(onEditMock).toHaveBeenCalledTimes(1);
      expect(onEditMock).toHaveBeenCalledWith(baseCard);
    });

    it('deve disparar onDelete com o id do card ao clicar no botão de exclusão', () => {
      const onDeleteMock = vi.fn();
      render(<DeckCardItem {...defaultProps} onDelete={onDeleteMock} />);

      const deleteButton = screen.getByTitle('Excluir');
      fireEvent.click(deleteButton);

      expect(onDeleteMock).toHaveBeenCalledTimes(1);
      expect(onDeleteMock).toHaveBeenCalledWith('card-123');
    });

    it('deve disparar onMove com o objeto do card ao clicar no botão de mover', () => {
      const onMoveMock = vi.fn();
      render(<DeckCardItem {...defaultProps} onMove={onMoveMock} />);

      const moveButton = screen.getByTitle('Mover');
      fireEvent.click(moveButton);

      expect(onMoveMock).toHaveBeenCalledTimes(1);
      expect(onMoveMock).toHaveBeenCalledWith(baseCard);
    });

    it('deve disparar onToggleSelect ao clicar no checkbox de seleção', () => {
      const onToggleMock = vi.fn();
      render(<DeckCardItem {...defaultProps} onToggleSelect={onToggleMock} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(onToggleMock).toHaveBeenCalledTimes(1);
      expect(onToggleMock).toHaveBeenCalledWith('card-123');
    });
  });
});
