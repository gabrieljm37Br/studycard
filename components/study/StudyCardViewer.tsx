import React from 'react';
import { CardMode } from '../../types';
import type { FlashcardData } from '../../types';
import { MathContent } from '../MathContent';

interface StudyCardViewerProps {
    card: FlashcardData;
    showResult: boolean;
    result: 'correct' | 'incorrect' | null;
    userAnswer: string;
    setUserAnswer: (val: string) => void;
    selectedOption: number | null;
    setSelectedOption: (val: number | null) => void;
    evaluateAnswer: () => void;
    handleSelfEvaluation: (evalType: 'correct' | 'almost' | 'incorrect') => void;
    handleNext: () => void;
    isDeleting: boolean;
    isMarkingForEdit: boolean;
    toggleMarkForEdit: () => void;
    handleDeleteCurrentCard: () => void;
    isLastCard: boolean;
}

export const StudyCardViewer: React.FC<StudyCardViewerProps> = ({
    card,
    showResult,
    result,
    userAnswer,
    setUserAnswer,
    selectedOption,
    setSelectedOption,
    evaluateAnswer,
    handleSelfEvaluation,
    handleNext,
    isDeleting,
    isMarkingForEdit,
    toggleMarkForEdit,
    handleDeleteCurrentCard,
    isLastCard
}) => {
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeElement = document.activeElement;
            const isTyping = activeElement instanceof HTMLTextAreaElement || activeElement instanceof HTMLInputElement;

            if (e.code === 'Space') {
                if (isTyping) return;
                e.preventDefault();
                if (!showResult) {
                    evaluateAnswer();
                } else if (result !== null) {
                    handleNext();
                }
                return;
            }

            if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5'].includes(e.code)) {
                if (isTyping) return;
                const keyNum = parseInt(e.key, 10);
                if (showResult && (card.mode === CardMode.QA || card.mode === CardMode.PracticalExample || card.mode === CardMode.Dictionary)) {
                    e.preventDefault();
                    if (keyNum === 1) {
                        handleSelfEvaluation('incorrect');
                    } else if (keyNum === 2 || keyNum === 3) {
                        handleSelfEvaluation('almost');
                    } else if (keyNum >= 4) {
                        handleSelfEvaluation('correct');
                    }
                } else if (!showResult && card.mode === CardMode.MultipleChoice && card.options) {
                    const optIndex = keyNum - 1;
                    if (optIndex >= 0 && optIndex < card.options.length) {
                        e.preventDefault();
                        setSelectedOption(optIndex);
                    }
                } else if (!showResult && card.mode === CardMode.TrueFalse) {
                    if (keyNum === 1) {
                        e.preventDefault();
                        setSelectedOption(0);
                    } else if (keyNum === 2) {
                        e.preventDefault();
                        setSelectedOption(1);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showResult, result, card, evaluateAnswer, handleNext, handleSelfEvaluation, setSelectedOption]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-10 shadow-lg border border-gray-100 dark:border-gray-700 mb-8 transition-all duration-300">
            {card.needsEdit && (
                <div className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm font-semibold mb-4">
                    <span className="text-lg">⚠ Precisa de ajustes</span>
                </div>
            )}

            <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 leading-relaxed">
                {card.mode === CardMode.Dictionary && (
                    <div className="flex flex-col gap-2">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-500 dark:text-indigo-300 uppercase tracking-wide">
                            <span className="text-sm">📖</span>
                            <span>Dicionário</span>
                        </div>
                        <MathContent tag="div" className="text-2xl font-bold text-gray-900 dark:text-gray-100" content={card.term || '(sem termo)'} />
                    </div>
                )}
                {card.mode === CardMode.QA && <MathContent tag="span" content={card.question} />}
                {card.mode === CardMode.TrueFalse && <MathContent tag="span" content={card.statement} />}
                {card.mode === CardMode.MultipleChoice && <MathContent tag="span" content={card.question} />}
                {card.mode === CardMode.FillInTheBlank && <MathContent tag="span" content={card.question} />}
                {card.mode === CardMode.PracticalExample && (
                    <div className="space-y-4">
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border-l-4 border-indigo-500">
                            <span className="font-bold text-indigo-700 dark:text-indigo-300 block mb-1">Problema:</span>
                            <MathContent tag="span" className="text-gray-700 dark:text-gray-300" content={card.problem} />
                        </div>
                        <div>
                            <span className="font-bold text-gray-900 dark:text-white block mb-2">Pergunta:</span>
                            <MathContent tag="span" className="text-gray-700 dark:text-gray-300" content={card.question} />
                        </div>
                    </div>
                )}
            </h2>

            {!showResult && (
                <div className="animate-fade-in">
                    {(card.mode === CardMode.QA || card.mode === CardMode.PracticalExample || card.mode === CardMode.FillInTheBlank || card.mode === CardMode.Dictionary) && (
                        <textarea
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="Digite sua resposta..."
                            rows={4}
                            className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-transparent dark:text-white mb-6 resize-y"
                        />
                    )}

                    {card.mode === CardMode.TrueFalse && (
                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            <button
                                onClick={() => setSelectedOption(0)}
                                className={`flex-1 p-4 rounded-xl text-lg font-semibold transition-all duration-200 border-2 flex items-center justify-center gap-2 ${
                                    selectedOption === 0
                                        ? 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-400'
                                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                <span>✓</span> Verdadeiro
                            </button>
                            <button
                                onClick={() => setSelectedOption(1)}
                                className={`flex-1 p-4 rounded-xl text-lg font-semibold transition-all duration-200 border-2 flex items-center justify-center gap-2 ${
                                    selectedOption === 1
                                        ? 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-400'
                                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                <span>✗</span> Falso
                            </button>
                        </div>
                    )}

                    {card.mode === CardMode.MultipleChoice && card.options && (
                        <div className="flex flex-col gap-3 mb-8">
                            {card.options.map((option: string, index: number) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedOption(index)}
                                    className={`w-full p-4 rounded-xl text-left text-base transition-all duration-200 border-2 flex items-center gap-3 ${
                                        selectedOption === index
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm'
                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-indigo-300'
                                    }`}
                                >
                                    <span className={`w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] rounded-full flex items-center justify-center text-base font-bold border shrink-0 leading-none ${
                                        selectedOption === index
                                            ? 'bg-indigo-600 border-indigo-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-500 dark:text-gray-400'
                                    }`}>
                                        {String.fromCharCode(65 + index)}
                                    </span>
                                    <MathContent tag="span" content={option} />
                                </button>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={evaluateAnswer}
                        disabled={
                            ((card.mode === CardMode.QA || card.mode === CardMode.PracticalExample || card.mode === CardMode.FillInTheBlank || card.mode === CardMode.Dictionary) && !userAnswer.trim()) ||
                            ((card.mode === CardMode.TrueFalse || card.mode === CardMode.MultipleChoice) && selectedOption === null)
                        }
                        className="w-full py-4 bg-indigo-600 text-white border-none rounded-xl text-lg font-bold cursor-pointer hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform active:scale-[0.99]"
                    >
                        Verificar Resposta
                    </button>
                </div>
            )}

            {showResult && (
                <div className="animate-slide-up">
                    <div className="flex justify-end gap-3 mb-4">
                        <button
                            onClick={toggleMarkForEdit}
                            disabled={isMarkingForEdit}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors border disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 ${
                                card.needsEdit
                                    ? 'bg-amber-100 border-amber-500 text-amber-800 hover:bg-amber-200'
                                    : 'bg-amber-50 border-amber-400 text-amber-700 hover:bg-amber-100'
                            }`}
                        >
                            <span>⚠</span>
                            {isMarkingForEdit ? 'Atualizando...' : card.needsEdit ? 'Desmarcar' : 'Marcar card'}
                        </button>
                        <button
                            onClick={handleDeleteCurrentCard}
                            disabled={isDeleting}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors border border-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isDeleting ? 'Excluindo...' : 'Excluir'}
                        </button>
                    </div>

                    {card.mode === CardMode.QA || card.mode === CardMode.PracticalExample || card.mode === CardMode.Dictionary ? (
                        <div>
                            <div className="p-6 rounded-xl border-2 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 mb-6">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                    📖 Resposta Correta
                                </h3>

                                <div className="space-y-4">
                                    <div className="bg-white/50 dark:bg-black/20 p-4 rounded-lg">
                                        <MathContent
                                            tag="p"
                                            className="text-lg text-gray-800 dark:text-gray-200 font-medium leading-relaxed"
                                            content={
                                                card.mode === CardMode.QA
                                                    ? card.answer
                                                    : card.mode === CardMode.Dictionary
                                                        ? (card as any).definition || ''
                                                        : (card as any).solution || ''
                                            }
                                        />
                                    </div>

                                    {card.mode === CardMode.PracticalExample && (card as any).explanation && (
                                        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Explicação</p>
                                            <MathContent
                                                tag="p"
                                                className="text-gray-700 dark:text-gray-300 leading-relaxed"
                                                content={(card as any).explanation}
                                            />
                                        </div>
                                    )}

                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                                        <p className="text-sm font-bold text-yellow-800 dark:text-yellow-300 mb-2">
                                            💬 Sua Resposta:
                                        </p>
                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                            {userAnswer || "(vazio)"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">
                                    Como você avalia sua resposta?
                                </p>

                                <button
                                    onClick={() => handleSelfEvaluation('correct')}
                                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-none rounded-xl text-lg font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-3 group transform active:scale-[0.98]"
                                >
                                    <span className="text-2xl">🗸</span>
                                    <span>Acertei</span>
                                    <span className="text-sm opacity-90 bg-white/20 px-2 py-1 rounded-full">+10 XP</span>
                                </button>

                                <button
                                    onClick={() => handleSelfEvaluation('almost')}
                                    className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-none rounded-xl text-lg font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-3 group transform active:scale-[0.98]"
                                >
                                    <span className="text-2xl">⚠️</span>
                                    <span>Quase</span>
                                    <span className="text-sm opacity-90 bg-white/20 px-2 py-1 rounded-full">+2 XP</span>
                                </button>

                                <button
                                    onClick={() => handleSelfEvaluation('incorrect')}
                                    className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white border-none rounded-xl text-lg font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-3 group transform active:scale-[0.98]"
                                >
                                    <span className="text-2xl">x</span>
                                    <span>Errei</span>
                                    <span className="text-sm opacity-90 bg-white/20 px-2 py-1 rounded-full">0 XP</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className={`p-6 rounded-xl border-2 mb-6 ${
                                result === 'correct'
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            }`}>
                                <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                                    result === 'correct' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                                }`}>
                                    {result === 'correct' ? '🗸 Correto!' : '❌ Incorreto'}
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            Resposta correta
                                        </p>
                                        <p className="text-lg text-gray-800 dark:text-gray-200 font-medium">
                                            {card.mode === CardMode.TrueFalse && (card.isTrue ? 'Verdadeiro' : 'Falso')}
                                            {card.mode === CardMode.MultipleChoice && <MathContent tag="span" content={card.options[card.correctAnswerIndex]} />}
                                            {card.mode === CardMode.FillInTheBlank && <MathContent tag="span" content={card.answer} />}
                                        </p>
                                    </div>

                                    {((card.mode === CardMode.TrueFalse || card.mode === CardMode.MultipleChoice || card.mode === CardMode.FillInTheBlank) && card.explanation) && (
                                        <div className="bg-white/50 dark:bg-black/20 p-4 rounded-lg">
                                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                                Explicação
                                            </p>
                                            <MathContent
                                                tag="p"
                                                className="text-gray-700 dark:text-gray-300 leading-relaxed"
                                                content={card.explanation || "Veja a solucao acima."}
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700/50">
                                        <span>XP Ganho:</span>
                                        <span className={result === 'correct' ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-400'}>
                                            {result === 'correct' ? '+10 XP' : '0 XP'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleNext}
                                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white border-none rounded-xl text-lg font-bold cursor-pointer hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2 group"
                            >
                                {!isLastCard ? (
                                    <>Próximo Flashcard <span className="group-hover:translate-x-1 transition-transform">➜</span></>
                                ) : (
                                    'Finalizar Sessão'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
