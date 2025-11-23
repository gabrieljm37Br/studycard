import React, { useState, useEffect } from 'react';
import { FlashcardData, CardMode, QACard, TrueFalseCard, MultipleChoiceCard, PracticalExampleCard, FeedbackStatus } from '../types';
import RichTextEditor from './RichTextEditor';

const labelClass = "block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1";
const fieldGroupClass = "mb-4";

// Reverted to textarea as per user request
const QACardForm: React.FC<{ card: QACard, onChange: (updatedCard: QACard) => void }> = ({ card, onChange }) => (
    <>
        <div className={fieldGroupClass}>
            <label className={labelClass}>Pergunta</label>
            <RichTextEditor
                value={card.question}
                onChange={(val) => onChange({ ...card, question: val })}
                className="min-h-[6rem]"
                placeholder="Digite a pergunta..."
            />
        </div>
        <div className={fieldGroupClass}>
            <label className={labelClass}>Resposta</label>
            <RichTextEditor
                value={card.answer}
                onChange={(val) => onChange({ ...card, answer: val })}
                className="min-h-[8rem]"
                placeholder="Digite a resposta..."
            />
        </div>
    </>
);

const TrueFalseCardForm: React.FC<{ card: TrueFalseCard, onChange: (updatedCard: TrueFalseCard) => void }> = ({ card, onChange }) => (
    <>
        <div className={fieldGroupClass}>
            <label className={labelClass}>Afirmação</label>
            <RichTextEditor
                value={card.statement}
                onChange={(val) => onChange({ ...card, statement: val })}
                className="min-h-[6rem]"
                placeholder="Digite a afirmação..."
            />
        </div>
        <div className={fieldGroupClass}>
            <label className={labelClass}>É Verdadeiro?</label>
            <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="radio"
                        checked={card.isTrue}
                        onChange={() => onChange({ ...card, isTrue: true })}
                        className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">Verdadeiro</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="radio"
                        checked={!card.isTrue}
                        onChange={() => onChange({ ...card, isTrue: false })}
                        className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">Falso</span>
                </label>
            </div>
        </div>
        <div className={fieldGroupClass}>
            <label className={labelClass}>Explicação</label>
            <RichTextEditor
                value={card.explanation}
                onChange={(val) => onChange({ ...card, explanation: val })}
                className="min-h-[6rem]"
                placeholder="Explique por que é verdadeiro ou falso..."
            />
        </div>
    </>
);

const MultipleChoiceCardForm: React.FC<{ card: MultipleChoiceCard, onChange: (updatedCard: MultipleChoiceCard) => void }> = ({ card, onChange }) => {
    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...card.options];
        newOptions[index] = value;
        onChange({ ...card, options: newOptions });
    };

    const addOption = () => {
        onChange({ ...card, options: [...card.options, ''] });
    };

    const removeOption = (index: number) => {
        if (card.options.length <= 2) return; // Min 2 options
        const newOptions = card.options.filter((_, i) => i !== index);
        // Adjust correct answer index if needed
        let newCorrectIndex = card.correctAnswerIndex;
        if (index < card.correctAnswerIndex) {
            newCorrectIndex--;
        } else if (index === card.correctAnswerIndex) {
            newCorrectIndex = 0; // Reset to first if correct one is deleted
        }
        onChange({ ...card, options: newOptions, correctAnswerIndex: newCorrectIndex });
    };

    return (
        <>
            <div className={fieldGroupClass}>
                <label className={labelClass}>Pergunta</label>
                <RichTextEditor
                    value={card.question}
                    onChange={(val) => onChange({ ...card, question: val })}
                    className="min-h-[6rem]"
                    placeholder="Digite a pergunta..."
                />
            </div>
            <div className={fieldGroupClass}>
                <label className={labelClass}>Opções</label>
                <div className="space-y-3">
                    {card.options.map((option, index) => (
                        <div key={index} className="flex items-start gap-2">
                            <input
                                type="radio"
                                name="correct-answer"
                                checked={card.correctAnswerIndex === index}
                                onChange={() => onChange({ ...card, correctAnswerIndex: index })}
                                className="mt-3 w-4 h-4 text-cyan-600 focus:ring-cyan-500 flex-shrink-0 cursor-pointer"
                                title="Marcar como correta"
                            />
                            <div className="flex-grow">
                                <RichTextEditor
                                    value={option}
                                    onChange={(val) => handleOptionChange(index, val)}
                                    className="min-h-[3rem]"
                                    placeholder={`Opção ${index + 1}`}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => removeOption(index)}
                                disabled={card.options.length <= 2}
                                className="mt-2 p-1 text-red-500 hover:bg-red-100 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                title="Remover opção"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={addOption}
                    className="mt-2 text-sm font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 flex items-center gap-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Adicionar Opção
                </button>
            </div>
            <div className={fieldGroupClass}>
                <label className={labelClass}>Explicação</label>
                <RichTextEditor
                    value={card.explanation}
                    onChange={(val) => onChange({ ...card, explanation: val })}
                    className="min-h-[6rem]"
                    placeholder="Explique a resposta correta..."
                />
            </div>
        </>
    );
};

const PracticalExampleCardForm: React.FC<{ card: PracticalExampleCard, onChange: (updatedCard: PracticalExampleCard) => void }> = ({ card, onChange }) => (
    <>
        <div className={fieldGroupClass}>
            <label className={labelClass}>Problema (Fase 1)</label>
            <RichTextEditor
                value={card.problem}
                onChange={(val) => onChange({ ...card, problem: val })}
                className="min-h-[6rem]"
                placeholder="Descreva o cenário ou problema..."
            />
        </div>
        <div className={fieldGroupClass}>
            <label className={labelClass}>Pergunta (Fase 2)</label>
            <RichTextEditor
                value={card.question}
                onChange={(val) => onChange({ ...card, question: val })}
                className="min-h-[6rem]"
                placeholder="Qual é a pergunta sobre este cenário?"
            />
        </div>
        <div className={fieldGroupClass}>
            <label className={labelClass}>Solução (Fase 3)</label>
            <RichTextEditor
                value={card.solution}
                onChange={(val) => onChange({ ...card, solution: val })}
                className="min-h-[8rem]"
                placeholder="Qual é a solução ou resposta esperada?"
            />
        </div>
    </>
);


const EditFlashcardModal: React.FC<{ card: FlashcardData, onSave: (card: FlashcardData) => void, onCancel: () => void }> = ({ card, onSave, onCancel }) => {
    const [editedCard, setEditedCard] = useState(card);

    useEffect(() => {
        setEditedCard(card);
    }, [card]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(editedCard);
    };

    const renderForm = () => {
        switch (editedCard.mode) {
            case CardMode.QA:
                return <QACardForm card={editedCard} onChange={setEditedCard as any} />;
            case CardMode.TrueFalse:
                return <TrueFalseCardForm card={editedCard} onChange={setEditedCard as any} />;
            case CardMode.MultipleChoice:
                return <MultipleChoiceCardForm card={editedCard} onChange={setEditedCard as any} />;
            case CardMode.PracticalExample:
                return <PracticalExampleCardForm card={editedCard as PracticalExampleCard} onChange={setEditedCard as any} />;
            default:
                return null;
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
            onClick={onCancel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-modal-title"
        >
            <div
                className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700"
                onClick={e => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit} noValidate>
                    <h2 id="edit-modal-title" className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Editar Flashcard</h2>
                    {renderForm()}
                    <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2 bg-slate-500 text-white font-semibold rounded-lg shadow hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-slate-600 dark:hover:bg-slate-700 dark:focus:ring-slate-500 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-cyan-600 text-white font-semibold rounded-lg shadow hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                        >
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditFlashcardModal;