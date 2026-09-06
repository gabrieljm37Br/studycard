import React from 'react';

interface StudyNotesDrawerProps {
    showNotesPanel: boolean;
    setShowNotesPanel: (val: boolean) => void;
    hasNote: boolean;
    currentNote: string;
    setCurrentNote: (val: string) => void;
    saveNote: () => void;
    isSavingNote: boolean;
}

export const StudyNotesDrawer: React.FC<StudyNotesDrawerProps> = ({
    showNotesPanel,
    setShowNotesPanel,
    hasNote,
    currentNote,
    setCurrentNote,
    saveNote,
    isSavingNote
}) => {
    return (
        <>
            <div className="mb-6 animate-fade-in">
                <button
                    onClick={() => setShowNotesPanel(!showNotesPanel)}
                    className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                        showNotesPanel
                            ? 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-400'
                            : 'bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                    <span className="text-xl">🗒️</span>
                    <span>Anotações</span>
                    {hasNote && (
                        <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                            ●
                        </span>
                    )}
                    <span className="ml-auto text-sm">
                        {showNotesPanel ? '▲' : '▼'}
                    </span>
                </button>
            </div>

            {showNotesPanel && (
                <div className="mb-8 bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-6 animate-slide-down">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                            <span>✏️</span> Suas Anotações
                        </h3>
                        <span className={`text-sm font-medium ${
                            currentNote.length > 1000
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-gray-500 dark:text-gray-400'
                        }`}>
                            {currentNote.length}/1000
                        </span>
                    </div>

                    <textarea
                        value={currentNote}
                        onChange={(e) => {
                            if (e.target.value.length <= 1000) {
                                setCurrentNote(e.target.value);
                            }
                        }}
                        placeholder="Digite suas anotações sobre este flashcard... (máximo 1000 caracteres)"
                        rows={6}
                        className="w-full p-4 border-2 border-amber-200 dark:border-amber-700 rounded-lg text-base outline-none focus:border-amber-400 dark:focus:border-amber-500 transition-colors bg-white dark:bg-gray-800 dark:text-white resize-y"
                    />

                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={saveNote}
                            disabled={isSavingNote}
                            className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white border-none rounded-lg font-semibold cursor-pointer transition-all shadow-sm disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSavingNote ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    <span>Salvando...</span>
                                </>
                            ) : (
                                <>
                                    <span>💾</span>
                                    <span>Salvar Anotação</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => {
                                setCurrentNote('');
                                setShowNotesPanel(false);
                            }}
                            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-none rounded-lg font-semibold cursor-pointer transition-all"
                        >
                            Cancelar
                        </button>
                    </div>

                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-3 flex items-start gap-2">
                        <span>💡</span>
                        <span>Suas anotações são privadas e vinculadas a este flashcard específico.</span>
                    </p>
                </div>
            )}
        </>
    );
};
