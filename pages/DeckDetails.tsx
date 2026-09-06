import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CardMode } from '../types';
import type { FlashcardData } from '../types';
import CSVImportModal from '../components/CSVImportModal';
import AnkiTxtImportModal from '../components/AnkiTxtImportModal';
import { DeckMetricsModal } from '../components/DeckMetricsModal';
import { Library, Folder, BookX, BarChart2 } from 'lucide-react';
import { useDeckData } from '../hooks/useDeckData';
import { useDeckCards } from '../hooks/useDeckCards';
import { DeckCardItem } from '../components/deck-details/DeckCardItem';
import { MoveCardModal } from '../components/deck-details/MoveCardModal';
import { CardEditModal } from '../components/deck-details/CardEditModal';

const DeckDetails: React.FC = () => {
    const { deckId } = useParams<{ deckId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const {
        deckName,
        tempDeckName,
        setTempDeckName,
        isEditingName,
        setIsEditingName,
        subdecks,
        breadcrumb,
        handleUpdateDeckName
    } = useDeckData({ deckId, user });

    const {
        flashcards,
        loading,
        modeFilter,
        setModeFilter,
        tagFilter,
        availableTags,
        showAllTags,
        setShowAllTags,
        selectedCards,
        filteredFlashcards,
        allVisibleSelected,
        isBulkDeleting,
        isBulkMoving,
        handleTagToggle,
        handleClearFilters,
        toggleCardSelection,
        toggleSelectAll,
        handleDeleteCard,
        handleBulkDelete,
        handleBulkMove,
        reloadFlashcards
    } = useDeckCards({ deckId });

    // Modal states
    const [showMoveCardModal, setShowMoveCardModal] = useState(false);
    const [cardToMove, setCardToMove] = useState<FlashcardData | null>(null);
    const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [cardToEdit, setCardToEdit] = useState<FlashcardData | null>(null);
    const [showCSVImport, setShowCSVImport] = useState(false);
    const [showAnkiImport, setShowAnkiImport] = useState(false);
    const [showMetricsModal, setShowMetricsModal] = useState(false);

    const handleMoveSingleCard = async (targetDeckId: string) => {
        if (!cardToMove) return;
        await handleBulkMove(targetDeckId);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Quick Action Bar */}
                <div className="mb-4">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 flex items-center justify-center gap-3 flex-wrap">
                        <button
                            onClick={() => navigate('/generator', { state: { deckId } })}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all whitespace-nowrap min-w-[160px]"
                        >
                            Criar Flashcards
                        </button>
                        {flashcards.length > 0 && (
                            <button
                                onClick={() => navigate('/study', { state: { deckId } })}
                                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all whitespace-nowrap min-w-[160px]"
                            >
                                Estudar Flashcards
                            </button>
                        )}
                        {subdecks.length > 0 && (
                            <button
                                onClick={() => navigate('/dashboard', { state: { deckId } })}
                                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all whitespace-nowrap min-w-[160px]"
                            >
                                Ver subdecks ({subdecks.length})
                            </button>
                        )}
                        <button
                            onClick={() => setShowMetricsModal(true)}
                            className="px-4 py-2 bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 dark:hover:bg-gray-600 hover:shadow-md transition-all whitespace-nowrap min-w-[160px] flex items-center justify-center gap-2"
                        >
                            <BarChart2 className="w-4 h-4" />
                            Meus Resultados
                        </button>
                    </div>
                </div>

                {/* Breadcrumb */}
                <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                    {breadcrumb.map((item, idx) => {
                        const isLast = idx === breadcrumb.length - 1;
                        return (
                            <React.Fragment key={`${item.id ?? 'root'}-${idx}`}>
                                {idx > 0 && <span className="text-xs text-gray-400 dark:text-gray-500">/</span>}
                                <button
                                    onClick={() => item.id ? navigate(`/deck/${item.id}`) : navigate('/dashboard')}
                                    disabled={isLast}
                                    className={`inline-flex items-center gap-1 transition-colors ${isLast ? 'text-gray-500 dark:text-gray-400 cursor-default' : 'hover:text-indigo-700'}`}
                                >
                                    {idx === 0 && <Library className="w-4 h-4" aria-hidden />}
                                    <span>{item.name}</span>
                                </button>
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Header with Title */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {isEditingName ? (
                            <div className="flex items-center gap-2 flex-1">
                                <input
                                    type="text"
                                    value={tempDeckName}
                                    onChange={(e) => setTempDeckName(e.target.value)}
                                    className="flex-1 text-2xl font-bold px-3 py-1 border-2 border-indigo-500 rounded-lg dark:bg-gray-700 dark:text-white"
                                    autoFocus
                                />
                                <button onClick={handleUpdateDeckName} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">Salvar</button>
                                <button onClick={() => setIsEditingName(false)} className="px-4 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400">Cancelar</button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{deckName}</h1>
                                <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-indigo-600" title="Renomear deck">✏️</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content: Cards List or Empty State */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p>Carregando flashcards...</p>
                    </div>
                ) : flashcards.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 text-center shadow-sm border border-gray-100 dark:border-gray-700">
                        <BookX className="w-12 h-12 mx-auto text-indigo-500 mb-4" aria-hidden />
                        <p className="text-gray-500 dark:text-gray-400 text-lg">Nenhum flashcard encontrado neste deck.</p>
                        <button
                            onClick={() => navigate('/generator', { state: { deckId } })}
                            className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Criar Primeiro Flashcard
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Filters & Bulk Actions */}
                        <div className="mb-5 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-end gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Modalidade</label>
                                <select
                                    value={modeFilter}
                                    onChange={(e) => setModeFilter(e.target.value as CardMode | 'all')}
                                    className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 outline-none"
                                >
                                    <option value="all">Todas as modalidades</option>
                                    <option value={CardMode.QA}>Pergunta & Resposta</option>
                                    <option value={CardMode.TrueFalse}>Verdadeiro ou Falso</option>
                                    <option value={CardMode.MultipleChoice}>Múltipla Escolha</option>
                                    <option value={CardMode.PracticalExample}>Exemplo Prático</option>
                                    <option value={CardMode.FillInTheBlank}>Lacunas</option>
                                    <option value={CardMode.Dictionary}>Dicionário</option>
                                </select>
                            </div>
                            {selectedCards.size > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{selectedCards.size} selecionado(s)</span>
                                    <button onClick={() => setShowBulkMoveModal(true)} disabled={isBulkMoving} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">Mover</button>
                                    <button onClick={handleBulkDelete} disabled={isBulkDeleting} className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">Excluir</button>
                                </div>
                            )}
                        </div>

                        {/* Flashcards List */}
                        <div className="space-y-4">
                            {filteredFlashcards.map(card => (
                                <DeckCardItem
                                    key={card.id}
                                    card={card}
                                    isSelected={selectedCards.has(card.id)}
                                    onToggleSelect={toggleCardSelection}
                                    onEdit={(c) => { setCardToEdit(c); setShowEditModal(true); }}
                                    onMove={(c) => { setCardToMove(c); setShowMoveCardModal(true); }}
                                    onDelete={handleDeleteCard}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            <MoveCardModal
                isOpen={showMoveCardModal}
                onClose={() => { setShowMoveCardModal(false); setCardToMove(null); }}
                onMove={handleMoveSingleCard}
                title="Mover Flashcard"
                currentDeckId={deckId}
                user={user}
            />

            <MoveCardModal
                isOpen={showBulkMoveModal}
                onClose={() => setShowBulkMoveModal(false)}
                onMove={handleBulkMove}
                title={`Mover ${selectedCards.size} Flashcard(s)`}
                currentDeckId={deckId}
                user={user}
            />

            <CardEditModal
                isOpen={showEditModal}
                card={cardToEdit}
                onClose={() => { setShowEditModal(false); setCardToEdit(null); }}
                onSaved={reloadFlashcards}
                user={user}
            />

            <DeckMetricsModal
                isOpen={showMetricsModal}
                onClose={() => setShowMetricsModal(false)}
                deckName={deckName}
                deckId={deckId!}
            />
        </div>
    );
};

export default DeckDetails;
