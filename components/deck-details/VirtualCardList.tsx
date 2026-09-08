import React, { useRef } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import type { FlashcardData } from '../../types';
import { DeckCardItem } from './DeckCardItem';

export interface VirtualCardListProps {
    cards: FlashcardData[];
    selectedCards: Set<string>;
    onToggleSelect: (cardId: string) => void;
    onEdit: (card: FlashcardData) => void;
    onMove: (card: FlashcardData) => void;
    onDelete: (cardId: string) => void;
}

export const VirtualCardList: React.FC<VirtualCardListProps> = ({
    cards,
    selectedCards,
    onToggleSelect,
    onEdit,
    onMove,
    onDelete
}) => {
    const listRef = useRef<HTMLDivElement>(null);

    const virtualizer = useWindowVirtualizer({
        count: cards.length,
        estimateSize: () => 180,
        overscan: 5,
        scrollMargin: listRef.current?.offsetTop ?? 0,
    });

    const virtualItems = virtualizer.getVirtualItems();

    return (
        <div
            ref={listRef}
            className="relative w-full"
            style={{
                height: `${virtualizer.getTotalSize()}px`,
            }}
        >
            {virtualItems.map((virtualItem) => {
                const card = cards[virtualItem.index];
                if (!card) return null;

                return (
                    <div
                        key={card.id}
                        data-index={virtualItem.index}
                        ref={virtualizer.measureElement}
                        className="absolute top-0 left-0 w-full pb-4"
                        style={{
                            transform: `translateY(${virtualItem.start - virtualizer.options.scrollMargin}px)`,
                        }}
                    >
                        <DeckCardItem
                            card={card}
                            isSelected={selectedCards.has(card.id)}
                            onToggleSelect={onToggleSelect}
                            onEdit={onEdit}
                            onMove={onMove}
                            onDelete={onDelete}
                        />
                    </div>
                );
            })}
        </div>
    );
};
