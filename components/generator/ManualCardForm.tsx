import React from 'react';
import { CardMode } from '../../types';

interface ManualCardFormProps {
    mode: CardMode;
    manualFormData: any;
    setManualFormData: (data: any) => void;
    onAddCard: () => void;
    manualCards: any[];
    onDeleteCard: (id: string) => void;
}

export const ManualCardForm: React.FC<ManualCardFormProps> = ({
    mode,
    manualFormData,
    setManualFormData,
    onAddCard,
    manualCards,
    onDeleteCard
}) => {
    return (
        <div className="mb-8 animate-fade-in">
            <label className="block mb-3 font-semibold text-gray-700 dark:text-gray-300">
                Criar Flashcard Manualmente
            </label>

            {mode === CardMode.QA && (
                <div className="space-y-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Pergunta</label>
                        <input
                            type="text"
                            value={manualFormData.question}
                            onChange={(e) => setManualFormData({ ...manualFormData, question: e.target.value })}
                            placeholder="Digite a pergunta..."
                            className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Resposta</label>
                        <textarea
                            value={manualFormData.answer}
                            onChange={(e) => setManualFormData({ ...manualFormData, answer: e.target.value })}
                            placeholder="Digite a resposta..."
                            rows={4}
                            className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:text-white resize-y"
                        />
                    </div>
                </div>
            )}

            {mode === CardMode.TrueFalse && (
                <div className="space-y-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Afirmação</label>
                        <textarea
                            value={manualFormData.statement}
                            onChange={(e) => setManualFormData({ ...manualFormData, statement: e.target.value })}
                            placeholder="Digite a afirmação..."
                            rows={3}
                            className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:text-white resize-y"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Esta afirmação é:</label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setManualFormData({ ...manualFormData, isTrue: true })}
                                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${manualFormData.isTrue ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                            >
                                ✅ Verdadeira
                            </button>
                            <button
                                type="button"
                                onClick={() => setManualFormData({ ...manualFormData, isTrue: false })}
                                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${!manualFormData.isTrue ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                            >
                                ❌ Falsa
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Explicação</label>
                        <textarea
                            value={manualFormData.explanation}
                            onChange={(e) => setManualFormData({ ...manualFormData, explanation: e.target.value })}
                            placeholder="Explique por que a afirmação é verdadeira ou falsa..."
                            rows={3}
                            className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:text-white resize-y"
                        />
                    </div>
                </div>
            )}

            {mode === CardMode.MultipleChoice && (
                <div className="space-y-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Pergunta</label>
                        <input
                            type="text"
                            value={manualFormData.question}
                            onChange={(e) => setManualFormData({ ...manualFormData, question: e.target.value })}
                            placeholder="Digite a pergunta..."
                            className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Opções</label>
                        {manualFormData.options.map((option: string, index: number) => (
                            <div key={index} className="flex items-center gap-2 mb-2">
                                <input
                                    type="radio"
                                    name="correctAnswer"
                                    checked={manualFormData.correctAnswerIndex === index}
                                    onChange={() => setManualFormData({ ...manualFormData, correctAnswerIndex: index })}
                                    className="w-4 h-4"
                                />
                                <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => {
                                        const newOptions = [...manualFormData.options];
                                        newOptions[index] = e.target.value;
                                        setManualFormData({ ...manualFormData, options: newOptions });
                                    }}
                                    placeholder={`Opção ${String.fromCharCode(65 + index)}...`}
                                    className="flex-1 p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:text-white"
                                />
                            </div>
                        ))}
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Explicação</label>
                        <textarea
                            value={manualFormData.explanation}
                            onChange={(e) => setManualFormData({ ...manualFormData, explanation: e.target.value })}
                            placeholder="Explique por que essa é a resposta correta..."
                            rows={3}
                            className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:text-white resize-y"
                        />
                    </div>
                </div>
            )}

            {mode === CardMode.PracticalExample && (
                <div className="space-y-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Problema / Cenário</label>
                        <textarea
                            value={manualFormData.problem}
                            onChange={(e) => setManualFormData({ ...manualFormData, problem: e.target.value })}
                            placeholder="Descreva o problema ou cenário prático..."
                            rows={4}
                            className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:text-white resize-y"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Pergunta</label>
                        <input
                            type="text"
                            value={manualFormData.question}
                            onChange={(e) => setManualFormData({ ...manualFormData, question: e.target.value })}
                            placeholder="Qual é a pergunta sobre este cenário?"
                            className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Solução</label>
                        <textarea
                            value={manualFormData.solution}
                            onChange={(e) => setManualFormData({ ...manualFormData, solution: e.target.value })}
                            placeholder="Descreva a solução para o problema..."
                            rows={4}
                            className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:text-white resize-y"
                        />
                    </div>
                </div>
            )}

            {mode === CardMode.FillInTheBlank && (
                <div className="space-y-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Frase com Lacuna</label>
                        <textarea
                            value={manualFormData.sentence}
                            onChange={(e) => setManualFormData({ ...manualFormData, sentence: e.target.value })}
                            placeholder="Digite a frase usando ____ para indicar a lacuna..."
                            rows={3}
                            className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:text-white resize-y"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Resposta Correta</label>
                        <input
                            type="text"
                            value={manualFormData.correctAnswer}
                            onChange={(e) => setManualFormData({ ...manualFormData, correctAnswer: e.target.value })}
                            placeholder="Palavra ou expressão que preenche a lacuna..."
                            className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:text-white"
                        />
                    </div>
                </div>
            )}

            {mode === CardMode.Dictionary && (
                <div className="space-y-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Termo</label>
                        <input
                            type="text"
                            value={manualFormData.term}
                            onChange={(e) => setManualFormData({ ...manualFormData, term: e.target.value })}
                            placeholder="Digite o termo ou conjunto de termos..."
                            className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Definição</label>
                        <textarea
                            value={manualFormData.definition}
                            onChange={(e) => setManualFormData({ ...manualFormData, definition: e.target.value })}
                            placeholder="Digite a definição do termo..."
                            rows={3}
                            className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:text-white resize-y"
                        />
                    </div>
                </div>
            )}

            {/* Tags */}
            <div className="mt-4">
                <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Tags (opcional)</label>
                <input
                    type="text"
                    value={manualFormData.tags}
                    onChange={(e) => setManualFormData({ ...manualFormData, tags: e.target.value })}
                    placeholder="Ex: matemática, álgebra (separadas por vírgula)"
                    className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-transparent text-base outline-none focus:border-indigo-500 dark:text-white"
                />
            </div>

            <button
                type="button"
                onClick={onAddCard}
                className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
                <span>➕</span> Adicionar Flashcard
            </button>

            {manualCards.length > 0 && (
                <div className="mt-6">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Flashcards Criados ({manualCards.length})
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {manualCards.map((card, index) => (
                            <div key={card.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <span className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1">#{index + 1}</span>
                                <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                                    <p className="font-medium">{card.question || card.statement || card.term}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onDeleteCard(card.id)}
                                    className="text-red-500 hover:text-red-700 font-bold text-lg"
                                    title="Remover flashcard"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
