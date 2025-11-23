import React from 'react';

const SourceTextModal: React.FC<{ text: string, onClose: () => void }> = ({ text, onClose }) => {
    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="source-text-modal-title"
        >
            <div
                className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 id="source-text-modal-title" className="text-2xl font-bold text-slate-900 dark:text-white">
                        Texto Base
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 transition"
                        aria-label="Fechar modal"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="bg-slate-100 p-4 rounded-lg overflow-y-auto border border-slate-200 flex-grow">
                    <p className="text-slate-800 whitespace-pre-wrap font-mono text-sm">
                        {text}
                    </p>
                </div>
                 <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 bg-cyan-600 text-white font-semibold rounded-lg shadow hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SourceTextModal;