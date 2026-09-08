import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import type { Deck } from '../../types';

export interface VirtualDeckGridProps {
    decks: Deck[];
    onStudy: (deck: Deck) => void;
    onViewFlashcards: (deck: Deck) => void;
    onSubdecks: (deck: Deck) => void;
    onStats: (deck: Deck) => void;
    onRename: (deck: Deck) => void;
    onMove: (deck: Deck) => void;
    onDelete: (deckId: string) => void;
}

const getColumnCount = (width: number): number => {
    if (width >= 1280) return 4;
    if (width >= 1024) return 3;
    if (width >= 640) return 2;
    return 1;
};

export const VirtualDeckGrid: React.FC<VirtualDeckGridProps> = ({
    decks,
    onStudy,
    onViewFlashcards,
    onSubdecks,
    onStats,
    onRename,
    onMove,
    onDelete
}) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const [columns, setColumns] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            return getColumnCount(window.innerWidth);
        }
        return 4;
    });

    useEffect(() => {
        const handleResize = () => {
            setColumns(getColumnCount(window.innerWidth));
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Partition decks into rows of columns
    const rows = useMemo(() => {
        const result: Deck[][] = [];
        for (let i = 0; i < decks.length; i += columns) {
            result.push(decks.slice(i, i + columns));
        }
        return result;
    }, [decks, columns]);

    const virtualizer = useWindowVirtualizer({
        count: rows.length,
        estimateSize: () => 260,
        overscan: 3,
        scrollMargin: gridRef.current?.offsetTop ?? 0,
    });

    const virtualRows = virtualizer.getVirtualItems();

    return (
        <div
            ref={gridRef}
            className="relative w-full"
            style={{
                height: `${virtualizer.getTotalSize()}px`,
            }}
        >
            {virtualRows.map((virtualRow) => {
                const rowDecks = rows[virtualRow.index];
                if (!rowDecks) return null;

                return (
                    <div
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        ref={virtualizer.measureElement}
                        className="absolute top-0 left-0 w-full pb-5"
                        style={{
                            transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
                        }}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {rowDecks.map((deck) => (
                                <div
                                    key={deck.id}
                                    className="bg-white dark:bg-gray-800 rounded-xl p-6 pt-20 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all relative group border border-gray-100 dark:border-gray-700 min-h-[240px] flex flex-col justify-between"
                                >
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                                            {deck.name}
                                        </h3>
                                    </div>

                                    <div className="flex gap-2 mt-4 flex-wrap">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onStudy(deck);
                                            }}
                                            className="flex-1 min-w-[120px] py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-700 border-none rounded-md text-sm text-white cursor-pointer font-semibold hover:opacity-90 transition-opacity shadow-sm"
                                        >
                                            Estudar
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onViewFlashcards(deck);
                                            }}
                                            className="flex-1 min-w-[120px] py-2.5 px-4 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 cursor-pointer font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span aria-hidden>🃏</span>
                                            <span>Flashcards</span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSubdecks(deck);
                                            }}
                                            className="flex-1 min-w-[120px] py-2.5 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-200 cursor-pointer font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Subdecks
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onStats(deck);
                                            }}
                                            className="flex-1 min-w-[120px] py-2.5 px-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-200 cursor-pointer font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Estatísticas
                                        </button>
                                    </div>

                                    <div className="absolute top-4 right-4 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-800/90 p-1 rounded-lg backdrop-blur-sm shadow-sm border border-gray-100 dark:border-gray-700">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRename(deck);
                                            }}
                                            className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-md transition-colors"
                                            title="Renomear"
                                        >
                                            Renomear
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onMove(deck);
                                            }}
                                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md transition-colors"
                                            title="Mover"
                                        >
                                            Mover
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(deck.id);
                                            }}
                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md transition-colors"
                                            title="Excluir"
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
