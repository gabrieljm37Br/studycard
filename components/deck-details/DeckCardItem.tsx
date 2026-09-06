import React from 'react';
import { CardMode } from '../../types';
import type { FlashcardData } from '../../types';
import { MathContent } from '../MathContent';

interface DeckCardItemProps {
    card: FlashcardData;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    onEdit: (card: FlashcardData) => void;
    onMove: (card: FlashcardData) => void;
    onDelete: (id: string) => void;
}

export const DeckCardItem: React.FC<DeckCardItemProps> = ({
    card,
    isSelected,
    onToggleSelect,
    onEdit,
    onMove,
    onDelete
}) => {
    const getCardTypeLabel = (mode: CardMode) => {
        switch (mode) {
            case CardMode.QA: return 'Pergunta & Resposta';
            case CardMode.TrueFalse: return 'Verdadeiro ou Falso';
            case CardMode.MultipleChoice: return 'Múltipla Escolha';
            case CardMode.PracticalExample: return 'Exemplo Prático';
            case CardMode.FillInTheBlank: return 'Lacunas';
            case CardMode.Dictionary: return 'Dicionário';
            default: return mode;
        }
    };

    const getQuestionHtml = (c: FlashcardData) => {
        switch (c.mode) {
            case CardMode.QA:
            case CardMode.MultipleChoice:
            case CardMode.FillInTheBlank:
                return c.question || '';
            case CardMode.TrueFalse:
                return c.statement || '';
            case CardMode.Dictionary:
                return (c as any).term || (c as any).question || '(sem termo)';
            default:
                return '';
        }
    };

    const getAnswerHtml = (c: FlashcardData) => {
        switch (c.mode) {
            case CardMode.QA:
                return c.answer || '';
            case CardMode.TrueFalse:
                return c.isTrue ? 'Verdadeiro' : 'Falso';
            case CardMode.MultipleChoice:
                return c.options && c.correctAnswerIndex !== undefined
                    ? c.options[c.correctAnswerIndex]
                    : (c as any).answer || '';
            case CardMode.PracticalExample:
                return c.solution || '';
            case CardMode.FillInTheBlank:
                return c.answer || '';
            case CardMode.Dictionary:
                return (c as any).definition || (c as any).answer || '(sem definição)';
            default:
                return '';
        }
    };

    const attachments: string[] = (card as any).attachments || [];
    const tags: string[] = (card as any).tags || [];

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border transition-all ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-200 dark:border-gray-700'}`}>
            <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(card.id)}
                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        {getCardTypeLabel(card.mode)}
                    </span>
                    {card.needsEdit && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                            <span>⚠</span> Precisa de ajustes
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(card)}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                        title="Editar"
                    >
                        ✏️
                    </button>
                    <button
                        onClick={() => onMove(card)}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                        title="Mover"
                    >
                        📁
                    </button>
                    <button
                        onClick={() => onDelete(card.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                        title="Excluir"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            {/* Question */}
            <div className="mb-3">
                <div className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Frente / Pergunta</div>
                <div className="text-gray-800 dark:text-gray-100 font-medium">
                    <MathContent tag="div" content={getQuestionHtml(card)} />
                </div>
            </div>

            {/* Answer */}
            <div className="mb-3">
                <div className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">Verso / Resposta</div>
                <div className="text-gray-600 dark:text-gray-300 text-sm">
                    <MathContent tag="div" content={getAnswerHtml(card)} />
                </div>
            </div>

            {/* Anexos e Tags */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            #{tag}
                        </span>
                    ))}
                </div>
                {attachments.length > 0 && (
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-medium">
                        📷 {attachments.length} anexo{attachments.length > 1 ? 's' : ''}
                    </span>
                )}
            </div>
        </div>
    );
};
