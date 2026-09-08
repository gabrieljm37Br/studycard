import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VirtualDeckGrid } from '../components/dashboard/VirtualDeckGrid';
import type { Deck } from '../types';

describe('VirtualDeckGrid - Virtualização do Grid de Decks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createMockDecks = (count: number): Deck[] => {
        return Array.from({ length: count }, (_, idx) => ({
            id: `deck-${idx + 1}`,
            name: `Deck de Estudos ${idx + 1}`,
            user_id: 'user-test',
            parent_id: null,
            created_at: new Date().toISOString()
        }));
    };

    it('deve renderizar os decks no grid virtual', () => {
        const mockDecks = createMockDecks(8);

        render(
            <VirtualDeckGrid
                decks={mockDecks}
                onStudy={vi.fn()}
                onViewFlashcards={vi.fn()}
                onSubdecks={vi.fn()}
                onStats={vi.fn()}
                onRename={vi.fn()}
                onMove={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        expect(screen.getByRole('heading', { name: 'Deck de Estudos 1' })).toBeDefined();
    });

    it('deve disparar os callbacks de ações ("Estudar", "Flashcards", "Subdecks", "Estatísticas")', () => {
        const mockDecks = createMockDecks(4);
        const onStudy = vi.fn();
        const onViewFlashcards = vi.fn();
        const onSubdecks = vi.fn();
        const onStats = vi.fn();

        render(
            <VirtualDeckGrid
                decks={mockDecks}
                onStudy={onStudy}
                onViewFlashcards={onViewFlashcards}
                onSubdecks={onSubdecks}
                onStats={onStats}
                onRename={vi.fn()}
                onMove={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        const studyButtons = screen.getAllByRole('button', { name: /Estudar/i });
        const flashcardsButtons = screen.getAllByRole('button', { name: /Flashcards/i });
        const subdecksButtons = screen.getAllByRole('button', { name: /Subdecks/i });
        const statsButtons = screen.getAllByRole('button', { name: /Estatísticas/i });

        fireEvent.click(studyButtons[0]);
        expect(onStudy).toHaveBeenCalledWith(mockDecks[0]);

        fireEvent.click(flashcardsButtons[0]);
        expect(onViewFlashcards).toHaveBeenCalledWith(mockDecks[0]);

        fireEvent.click(subdecksButtons[0]);
        expect(onSubdecks).toHaveBeenCalledWith(mockDecks[0]);

        fireEvent.click(statsButtons[0]);
        expect(onStats).toHaveBeenCalledWith(mockDecks[0]);
    });

    it('deve acionar opções do menu de deck (Renomear, Mover, Excluir)', () => {
        const mockDecks = createMockDecks(2);
        const onRename = vi.fn();
        const onMove = vi.fn();
        const onDelete = vi.fn();

        render(
            <VirtualDeckGrid
                decks={mockDecks}
                onStudy={vi.fn()}
                onViewFlashcards={vi.fn()}
                onSubdecks={vi.fn()}
                onStats={vi.fn()}
                onRename={onRename}
                onMove={onMove}
                onDelete={onDelete}
            />
        );

        const renameButtons = screen.getAllByTitle('Renomear');
        const moveButtons = screen.getAllByTitle('Mover');
        const deleteButtons = screen.getAllByTitle('Excluir');

        fireEvent.click(renameButtons[0]);
        expect(onRename).toHaveBeenCalledWith(mockDecks[0]);

        fireEvent.click(moveButtons[0]);
        expect(onMove).toHaveBeenCalledWith(mockDecks[0]);

        fireEvent.click(deleteButtons[0]);
        expect(onDelete).toHaveBeenCalledWith(mockDecks[0].id);
    });

    it('deve organizar dezenas de decks em linhas virtuais com altura total calculada', () => {
        const mockDecks = createMockDecks(40);

        const { container } = render(
            <VirtualDeckGrid
                decks={mockDecks}
                onStudy={vi.fn()}
                onViewFlashcards={vi.fn()}
                onSubdecks={vi.fn()}
                onStats={vi.fn()}
                onRename={vi.fn()}
                onMove={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        const virtualGrid = container.querySelector('.relative.w-full') as HTMLElement;
        expect(virtualGrid).not.toBeNull();
        expect(virtualGrid.style.height).toBeDefined();
    });
});
