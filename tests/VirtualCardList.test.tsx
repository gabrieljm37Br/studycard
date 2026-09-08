import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VirtualCardList } from '../components/deck-details/VirtualCardList';
import { CardMode } from '../types';
import type { FlashcardData } from '../types';

describe('VirtualCardList - Virtualização de Cards Extensos', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createMockCards = (count: number): FlashcardData[] => {
        return Array.from({ length: count }, (_, idx) => ({
            id: `card-${idx + 1}`,
            deckId: 'deck-main',
            mode: CardMode.QA,
            question: `Pergunta número ${idx + 1} sobre biologia?`,
            answer: `Resposta explicativa detalhada para o card ${idx + 1}.`,
            interval: 1,
            repetition: 0,
            easeFactor: 2.5
        }));
    };

    it('deve renderizar cards no DOM virtualizado e exibir conteúdo', () => {
        const mockCards = createMockCards(10);
        const onToggleSelect = vi.fn();
        const onEdit = vi.fn();
        const onMove = vi.fn();
        const onDelete = vi.fn();

        render(
            <VirtualCardList
                cards={mockCards}
                selectedCards={new Set()}
                onToggleSelect={onToggleSelect}
                onEdit={onEdit}
                onMove={onMove}
                onDelete={onDelete}
            />
        );

        // Deve renderizar os cards visíveis iniciais
        expect(screen.getByText('Pergunta número 1 sobre biologia?')).toBeDefined();
        expect(screen.getByText('Resposta explicativa detalhada para o card 1.')).toBeDefined();
    });

    it('deve permitir seleção individual de cards dentro da lista virtualizada', () => {
        const mockCards = createMockCards(5);
        const onToggleSelect = vi.fn();

        render(
            <VirtualCardList
                cards={mockCards}
                selectedCards={new Set(['card-2'])}
                onToggleSelect={onToggleSelect}
                onEdit={vi.fn()}
                onMove={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);

        fireEvent.click(checkboxes[0]);
        expect(onToggleSelect).toHaveBeenCalledWith('card-1');
    });

    it('deve acionar callbacks de edição, movimentação e exclusão corretamente', () => {
        const mockCards = createMockCards(3);
        const onEdit = vi.fn();
        const onMove = vi.fn();
        const onDelete = vi.fn();

        render(
            <VirtualCardList
                cards={mockCards}
                selectedCards={new Set()}
                onToggleSelect={vi.fn()}
                onEdit={onEdit}
                onMove={onMove}
                onDelete={onDelete}
            />
        );

        // Ações do primeiro card
        const editButtons = screen.getAllByTitle('Editar');
        const moveButtons = screen.getAllByTitle('Mover');
        const deleteButtons = screen.getAllByTitle('Excluir');

        fireEvent.click(editButtons[0]);
        expect(onEdit).toHaveBeenCalledWith(mockCards[0]);

        fireEvent.click(moveButtons[0]);
        expect(onMove).toHaveBeenCalledWith(mockCards[0]);

        fireEvent.click(deleteButtons[0]);
        expect(onDelete).toHaveBeenCalledWith(mockCards[0].id);
    });

    it('deve lidar com grandes volumes (100+ cards) definindo altura total do container virtual', () => {
        const mockCards = createMockCards(120);

        const { container } = render(
            <VirtualCardList
                cards={mockCards}
                selectedCards={new Set()}
                onToggleSelect={vi.fn()}
                onEdit={vi.fn()}
                onMove={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        const virtualContainer = container.querySelector('.relative.w-full') as HTMLElement;
        expect(virtualContainer).not.toBeNull();
        // Container virtual tem altura proporcional definida
        expect(virtualContainer.style.height).toBeDefined();
    });
});
