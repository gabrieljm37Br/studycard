import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

interface MoveCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMove: (targetDeckId: string) => Promise<void>;
    title: string;
    currentDeckId: string | undefined;
    user: any;
}

export const MoveCardModal: React.FC<MoveCardModalProps> = ({
    isOpen,
    onClose,
    onMove,
    title,
    currentDeckId,
    user
}) => {
    const [availableDecks, setAvailableDecks] = useState<{ id: string; name: string }[]>([]);
    const [isMoving, setIsMoving] = useState(false);

    useEffect(() => {
        const loadDecks = async () => {
            if (!isOpen || !user) return;
            try {
                const { data, error } = await supabase
                    .from('decks')
                    .select('id, name')
                    .eq('user_id', user.id)
                    .neq('id', currentDeckId || '');
                if (error) throw error;
                setAvailableDecks(data || []);
            } catch (error) {
                console.error('Error loading available decks:', error);
            }
        };
        loadDecks();
    }, [isOpen, user, currentDeckId]);

    if (!isOpen) return null;

    const handleSelect = async (targetId: string) => {
        try {
            setIsMoving(true);
            await onMove(targetId);
            onClose();
        } finally {
            setIsMoving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{title}</h3>
                <div className="max-h-60 overflow-y-auto space-y-2 mb-6">
                    {availableDecks.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">Nenhum outro deck disponível.</p>
                    ) : (
                        availableDecks.map(deck => (
                            <button
                                key={deck.id}
                                disabled={isMoving}
                                onClick={() => handleSelect(deck.id)}
                                className="w-full text-left p-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-colors text-gray-800 dark:text-gray-200 font-medium"
                            >
                                📁 {deck.name}
                            </button>
                        ))
                    )}
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};
