import React, { useState, useMemo } from 'react';
import { FlashcardData, Deck, CardMode } from '../../types';

// A small preview component for the card
const CardPreview: React.FC<{ card: FlashcardData }> = ({ card }) => {
    let title = '';
    let typeName = '';

    switch (card.mode) {
        case CardMode.QA:
            title = card.question;
            typeName = 'P/R';
            break;
        case CardMode.TrueFalse:
            title = card.statement;
            typeName = 'V/F';
            break;
        case CardMode.MultipleChoice:
            title = card.question;
            typeName = 'Múltipla Escolha';
            break;
        case CardMode.PracticalExample:
            title = card.problem;
            typeName = 'Exemplo Prático';
            break;
    }

    return (
        <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 mb-6">
            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{title}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Tipo: {typeName}
            </p>
        </div>
    );
};


const MoveFlashcardModal: React.FC<{
    card: FlashcardData,
    decks: Deck[],
    onConfirm: (newDeckId: string) => void,
    onCancel: () => void
}> = ({ card, decks, onConfirm, onCancel }) => {

    const deckOptions = useMemo(() => {
        const options: { id: string; name: string }[] = [];
        const buildOptions = (parentId: string | null, prefix: string) => {
            const children = decks.filter(d => d.parentId === parentId).sort((a, b) => a.name.localeCompare(b.name));
            for (const deck of children) {
                // Don't show the card's current deck as an option
                if (deck.id === card.deckId) {
                    buildOptions(deck.id, prefix ? `${prefix} / ${deck.name}` : deck.name); // Still need to process children
                    continue;
                };

                const label = prefix ? `${prefix} / ${deck.name}` : deck.name;
                options.push({ id: deck.id, name: label });
                buildOptions(deck.id, label);
            }
        };
        buildOptions(null, '');
        return options;
    }, [decks, card.deckId]);

    const initialDeckId = deckOptions.length > 0 ? deckOptions[0].id : '';
    const [destinationDeckId, setDestinationDeckId] = useState<string>(initialDeckId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (destinationDeckId) {
            onConfirm(destinationDeckId);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="move-modal-title"
        >
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md border dark:border-slate-700">
                <h2 id="move-modal-title" className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Mover Flashcard</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-2">
                    Selecione o novo deck para o seguinte flashcard:
                </p>
                <CardPreview card={card} />
                <select
                    name="deckLocation"
                    value={destinationDeckId}
                    onChange={(e) => setDestinationDeckId(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                    disabled={deckOptions.length === 0}
                >
                    {deckOptions.length > 0 ? (
                        deckOptions.map(deck => (
                            <option key={deck.id} value={deck.id}>{deck.name}</option>
                        ))
                    ) : (
                        <option>Nenhum outro deck disponível</option>
                    )}
                </select>
                <div className="flex justify-end gap-4 mt-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg shadow-sm hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-cyan-600 text-white font-semibold rounded-lg shadow-sm hover:bg-cyan-500 transition disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed"
                        disabled={!destinationDeckId || deckOptions.length === 0}
                    >
                        Mover
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MoveFlashcardModal;