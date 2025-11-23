import React, { useState, useEffect } from 'react';
import { CardMode, FlashcardData, QACard, TrueFalseCard, MultipleChoiceCard, PracticalExampleCard } from '../types';

const inputBaseClass = "w-full p-2 rounded-md shadow-inner focus:ring-2 focus:ring-cyan-500 focus:outline-none transition bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100";
const labelClass = "block text-sm font-bold text-slate-600 dark:text-slate-300 mb-1";
const fieldGroupClass = "mb-4";

const QACardForm: React.FC<{ card: QACard, onChange: (updatedCard: QACard) => void }> = ({ card, onChange }) => (
    <>
        <div className={fieldGroupClass}>
            <label htmlFor="question" className={labelClass}>Pergunta</label>
            <textarea
                value={card.question}
                onChange={(e) => onChange({ ...card, question: e.target.value })}
                placeholder="Digite a pergunta..."
                className={inputBaseClass}
                rows={3}
            />
        </div>
        <div className={fieldGroupClass}>
            <label htmlFor="answer" className={labelClass}>Resposta</label>
            <textarea
                value={card.answer}
                onChange={(e) => onChange({ ...card, answer: e.target.value })}
                placeholder="Digite a resposta..."
                className={inputBaseClass}
                rows={5}
            />
        </div>
    </>
);

const TrueFalseCardForm: React.FC<{ card: TrueFalseCard, onChange: (updatedCard: TrueFalseCard) => void }> = ({ card, onChange }) => (
    <>
        <div className={fieldGroupClass}>
            <label htmlFor="statement" className={labelClass}>Afirmação</label>
            <textarea
                value={card.statement}
                onChange={(e) => onChange({ ...card, statement: e.target.value })}
                placeholder="Digite a afirmação..."
                className={inputBaseClass}
                rows={3}
            />
        </div>
        <div className={fieldGroupClass}>
            <span className={labelClass}>Resposta Correta</span>
            <div className="flex gap-4 mt-2 text-slate-800 dark:text-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="isTrue" checked={card.isTrue} onChange={() => onChange({ ...card, isTrue: true })} className="form-radio h-4 w-4 text-cyan-600" />
                    <span>Verdadeiro</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="isTrue" checked={!card.isTrue} onChange={() => onChange({ ...card, isTrue: false })} className="form-radio h-4 w-4 text-cyan-600" />
                    <span>Falso</span>
                </label>
            </div>
        </div>
        <div className={fieldGroupClass}>
            <label htmlFor="explanation" className={labelClass}>Explicação</label>
            <textarea
                value={card.explanation}
                onChange={(e) => onChange({ ...card, explanation: e.target.value })}
                placeholder="Explicação (opcional)..."
                className={inputBaseClass}
                rows={3}
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

    return (
        <>
            <div className={fieldGroupClass}>
                <label htmlFor="mc-question" className={labelClass}>Pergunta</label>
                <textarea
                    value={card.question}
                    onChange={(e) => onChange({ ...card, question: e.target.value })}
                    className={inputBaseClass}
                    placeholder="Digite a pergunta..."
                    rows={3}
                />
            </div>
            <div className={fieldGroupClass}>
                <span className={labelClass}>Opções</span>
                <div className="space-y-2 mt-2">
                    {card.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="correctAnswer"
                                checked={index === card.correctAnswerIndex}
                                onChange={() => onChange({ ...card, correctAnswerIndex: index })}
                                className="form-radio h-4 w-4 text-cyan-600 shrink-0"
                                aria-label={`Marcar como resposta correta`}
                            />
                            <input
                                type="text"
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                className={inputBaseClass}
                                aria-label={`Opção ${index + 1}`}
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className={fieldGroupClass}>
                <label htmlFor="mc-explanation" className={labelClass}>Explicação</label>
                <textarea
                    value={card.explanation}
                    onChange={(e) => onChange({ ...card, explanation: e.target.value })}
                    className={inputBaseClass}
                    placeholder="Digite a explicação (opcional)..."
                    rows={3}
                />
            </div>
        </>
    );
};

const PracticalExampleCardForm: React.FC<{ card: PracticalExampleCard, onChange: (updatedCard: PracticalExampleCard) => void }> = ({ card, onChange }) => (
    <>
        <div className={fieldGroupClass}>
            <label htmlFor="problem" className={labelClass}>Situação-Problema</label>
            <textarea
                value={card.problem}
                onChange={(e) => onChange({ ...card, problem: e.target.value })}
                placeholder="Descreva o problema ou cenário..."
                className={inputBaseClass}
                rows={4}
            />
        </div>
        <div className={fieldGroupClass}>
            <label htmlFor="question" className={labelClass}>Pergunta</label>
            <textarea
                value={card.question}
                onChange={(e) => onChange({ ...card, question: e.target.value })}
                className={inputBaseClass}
                placeholder="Digite a pergunta sobre o problema..."
                rows={3}
            />
        </div>
        <div className={fieldGroupClass}>
            <label htmlFor="solution" className={labelClass}>Solução</label>
            <textarea
                value={card.solution}
                onChange={(e) => onChange({ ...card, solution: e.target.value })}
                placeholder="Solução detalhada..."
                className={inputBaseClass}
                rows={5}
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