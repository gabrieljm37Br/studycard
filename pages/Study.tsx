import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import 'katex/contrib/mhchem';
import StudyTimerBar from '../components/StudyTimerBar';
import { useStudySession } from '../hooks/useStudySession';
import { useCardNotes } from '../hooks/useCardNotes';
import { StudyCardViewer } from '../components/study/StudyCardViewer';
import { StudyNotesDrawer } from '../components/study/StudyNotesDrawer';

interface StudyProps {
    simulationMode?: boolean;
}

const Study: React.FC<StudyProps> = ({ simulationMode = false }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const deckId = (location.state as any)?.deckId ?? searchParams.get('deck');
    const simulationId = (location.state as any)?.simulationId;
    const [timerActive, setTimerActive] = useState(false);

    const {
        deckName,
        flashcards,
        currentCard,
        currentIndex,
        userAnswer,
        setUserAnswer,
        selectedOption,
        setSelectedOption,
        showResult,
        result,
        loading,
        sessionStats,
        isDeleting,
        isMarkingForEdit,
        evaluateAnswer,
        handleSelfEvaluation,
        handleNext,
        handleDeleteCurrentCard,
        toggleMarkForEdit,
        shuffleCards
    } = useStudySession({
        deckId,
        simulationId,
        simulationMode,
        user
    });

    const {
        currentNote,
        setCurrentNote,
        showNotesPanel,
        setShowNotesPanel,
        isSavingNote,
        hasNote,
        saveNote
    } = useCardNotes({
        cardId: currentCard?.id,
        user
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="font-medium">Carregando flashcards...</p>
                </div>
            </div>
        );
    }

    if (flashcards.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-100 dark:bg-gray-900 p-4">
                <div className="text-6xl">🗸</div>
                <p className="text-xl text-gray-600 dark:text-gray-400 font-medium text-center">
                    Tudo em dia! Nenhum flashcard para revisar agora.
                </p>
                <button
                    onClick={() => navigate('/home')}
                    className="px-6 py-3 bg-indigo-600 text-white border-none rounded-lg cursor-pointer font-semibold hover:bg-indigo-700 transition-colors shadow-md flex items-center gap-2"
                >
                    <Home className="w-5 h-5" />
                    <span>Voltar para Home</span>
                </button>
            </div>
        );
    }

    const answeredCount = Math.min(flashcards.length, sessionStats.correct + sessionStats.incorrect);
    const progressPercent = flashcards.length === 0
        ? 0
        : Math.min(100, Math.round((answeredCount / flashcards.length) * 100));

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
            <div className="max-w-6xl mx-auto px-4 pt-4 flex justify-center">
                <button
                    onClick={shuffleCards}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 rounded-lg text-sm font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-md"
                    title="Embaralhar cards"
                >
                    <span aria-hidden>🔀</span>
                    <span>Embaralhar</span>
                </button>
            </div>

            <div className={`max-w-6xl mx-auto px-4 pt-4 flex justify-center ${timerActive ? 'sticky top-4 z-30' : ''}`}>
                <StudyTimerBar variant="inline" onActiveChange={setTimerActive} />
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
                {deckId && deckName && (
                    <button
                        onClick={() => navigate(`/deck/${deckId}`)}
                        className="mb-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200 font-semibold text-sm transition-colors"
                    >
                        <span aria-hidden>🢢</span>
                        <span>Voltar para "{deckName}"</span>
                    </button>
                )}

                {/* Progresso */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 mb-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-0.5">Progresso</p>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{answeredCount} / {flashcards.length}</div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Flashcards vistos</p>
                        </div>
                        <div className="w-full sm:w-1/2">
                            <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <p className="mt-1.5 text-right text-[11px] font-semibold text-indigo-600 dark:text-indigo-300">{progressPercent}%</p>
                        </div>
                    </div>
                </div>

                {/* Estatísticas da Sessão */}
                <div className="flex gap-4 mb-8">
                    <div className="flex-1 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-4 rounded-xl text-center shadow-sm transition-all hover:scale-105">
                        <div className="text-3xl font-bold text-green-700 dark:text-green-400 mb-1">{sessionStats.correct}</div>
                        <div className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-500">Corretas</div>
                    </div>
                    <div className="flex-1 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-xl text-center shadow-sm transition-all hover:scale-105">
                        <div className="text-3xl font-bold text-red-700 dark:text-red-400 mb-1">{sessionStats.incorrect}</div>
                        <div className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-500">Incorretas</div>
                    </div>
                </div>

                {/* Card Viewer */}
                {currentCard && (
                    <StudyCardViewer
                        card={currentCard}
                        showResult={showResult}
                        result={result}
                        userAnswer={userAnswer}
                        setUserAnswer={setUserAnswer}
                        selectedOption={selectedOption}
                        setSelectedOption={setSelectedOption}
                        evaluateAnswer={evaluateAnswer}
                        handleSelfEvaluation={handleSelfEvaluation}
                        handleNext={handleNext}
                        isDeleting={isDeleting}
                        isMarkingForEdit={isMarkingForEdit}
                        toggleMarkForEdit={toggleMarkForEdit}
                        handleDeleteCurrentCard={handleDeleteCurrentCard}
                        isLastCard={currentIndex >= flashcards.length - 1}
                    />
                )}

                {/* Drawer de Anotações */}
                {showResult && (
                    <StudyNotesDrawer
                        showNotesPanel={showNotesPanel}
                        setShowNotesPanel={setShowNotesPanel}
                        hasNote={hasNote}
                        currentNote={currentNote}
                        setCurrentNote={setCurrentNote}
                        saveNote={saveNote}
                        isSavingNote={isSavingNote}
                    />
                )}
            </div>
        </div>
    );
};

export default Study;
