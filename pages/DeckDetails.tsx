import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { CardMode } from '../types';
import type { FlashcardData } from '../types';
import CSVImportModal from '../components/CSVImportModal';

const DeckDetails: React.FC = () => {
    const { deckId } = useParams<{ deckId: string }>();
    const navigate = useNavigate();
    const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
    const [deckName, setDeckName] = useState('');
    const [loading, setLoading] = useState(true);
    const [subdecks, setSubdecks] = useState<{ id: string; name: string }[]>([]);

    // Move Card State
    const [showMoveCardModal, setShowMoveCardModal] = useState(false);
    const [cardToMove, setCardToMove] = useState<FlashcardData | null>(null);
    const [availableDecks, setAvailableDecks] = useState<{ id: string; name: string }[]>([]);
    const [isMovingCard, setIsMovingCard] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Rename Deck State
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempDeckName, setTempDeckName] = useState('');
    const [parentId, setParentId] = useState<string | null>(null);

    // Bulk Selection State
    const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
    const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [isBulkMoving, setIsBulkMoving] = useState(false);

    // Edit Card State
    const [showEditModal, setShowEditModal] = useState(false);
    const [cardToEdit, setCardToEdit] = useState<FlashcardData | null>(null);
    const [editFormData, setEditFormData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);

    // CSV Import State
    const [showCSVImport, setShowCSVImport] = useState(false);

    useEffect(() => {
        // Get current user
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
        });
    }, []);

    useEffect(() => {
        if (deckId && user) {
            loadDeckDetails();
            loadFlashcards();
            loadSubdecks();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deckId, user]);

    const loadDeckDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('decks')
                .select('name, parent_id')
                .eq('id', deckId)
                .single();

            if (error) throw error;
            setDeckName(data.name);
            setTempDeckName(data.name);
            setParentId(data.parent_id);
        } catch (error) {
            console.error('Error loading deck details:', error);
        }
    };

    const handleUpdateDeckName = async () => {
        if (!tempDeckName.trim() || tempDeckName === deckName) {
            setIsEditingName(false);
            setTempDeckName(deckName);
            return;
        }

        try {
            const { error } = await supabase
                .from('decks')
                .update({ name: tempDeckName.trim() })
                .eq('id', deckId);

            if (error) throw error;
            setDeckName(tempDeckName);
            setIsEditingName(false);
        } catch (error) {
            console.error('Error updating deck name:', error);
            alert('Erro ao atualizar nome do deck');
        }
    };

    const loadFlashcards = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('flashcards')
                .select('*')
                .eq('deck_id', deckId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            const normalized = (data || []).map((card: any) =>
                card.mode === CardMode.Dictionary
                    ? {
                        ...card,
                        term: card.term || card.question || '',
                        definition: card.definition || card.answer || '',
                    }
                    : card
            );
            setFlashcards(normalized as any);
        } catch (error) {
            console.error('Error loading flashcards:', error);
            alert('Erro ao carregar flashcards');
        } finally {
            setLoading(false);
        }
    };

    const loadSubdecks = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('decks')
                .select('id, name')
                .eq('parent_id', deckId)
                .eq('user_id', user.id)
                .order('name', { ascending: true });

            if (error) throw error;
            setSubdecks(data || []);
        } catch (error) {
            console.error('Error loading subdecks:', error);
        }
    };

    const handleDeleteCard = async (cardId: string) => {
        if (!confirm('Tem certeza que deseja excluir este flashcard?')) return;

        try {
            console.log('Tentando excluir flashcard:', cardId);

            const { data, error } = await supabase
                .from('flashcards')
                .delete()
                .eq('id', cardId)
                .select(); // Add select to get confirmation

            if (error) {
                console.error('Erro do Supabase ao excluir:', error);
                throw error;
            }

            console.log('Flashcard excluído com sucesso:', data);
            await loadFlashcards(); // Reload list
        } catch (error: any) {
            console.error('Error deleting flashcard:', error);
            alert(`Erro ao excluir flashcard: ${error.message || 'Erro desconhecido'}. Verifique o console para mais detalhes.`);
        }
    };

    const openMoveCardModal = async (card: FlashcardData) => {
        setCardToMove(card);
        setShowMoveCardModal(true);

        if (!user) return;

        try {
            // Fetch all decks to list as potential destinations
            const { data, error } = await supabase
                .from('decks')
                .select('id, name')
                .eq('user_id', user.id)
                .neq('id', deckId); // Exclude current deck

            if (error) throw error;
            setAvailableDecks(data || []);
        } catch (error) {
            console.error('Error loading available decks:', error);
            alert('Erro ao carregar decks disponíveis.');
        }
    };

    const handleMoveCard = async (targetDeckId: string) => {
        if (!cardToMove) return;

        try {
            setIsMovingCard(true);
            const { error } = await supabase
                .from('flashcards')
                .update({ deck_id: targetDeckId })
                .eq('id', cardToMove.id);

            if (error) throw error;

            setShowMoveCardModal(false);
            setCardToMove(null);
            loadFlashcards(); // Reload list to remove moved card
        } catch (error) {
            console.error('Error moving card:', error);
            alert('Erro ao mover flashcard.');
        } finally {
            setIsMovingCard(false);
        }
    };

    // Bulk Selection Handlers
    const toggleCardSelection = (cardId: string) => {
        const newSelected = new Set(selectedCards);
        if (newSelected.has(cardId)) {
            newSelected.delete(cardId);
        } else {
            newSelected.add(cardId);
        }
        setSelectedCards(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedCards.size === flashcards.length) {
            setSelectedCards(new Set());
        } else {
            setSelectedCards(new Set(flashcards.map(card => card.id)));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedCards.size === 0) return;

        const count = selectedCards.size;
        if (!confirm(`Tem certeza que deseja excluir ${count} flashcard${count > 1 ? 's' : ''}?`)) return;

        try {
            setIsBulkDeleting(true);
            const { error } = await supabase
                .from('flashcards')
                .delete()
                .in('id', Array.from(selectedCards));

            if (error) throw error;

            setSelectedCards(new Set());
            loadFlashcards();
        } catch (error) {
            console.error('Error deleting flashcards:', error);
            alert('Erro ao excluir flashcards');
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const openBulkMoveModal = async () => {
        if (selectedCards.size === 0) return;

        setShowBulkMoveModal(true);

        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('decks')
                .select('id, name')
                .eq('user_id', user.id)
                .neq('id', deckId);

            if (error) throw error;
            setAvailableDecks(data || []);
        } catch (error) {
            console.error('Error loading available decks:', error);
            alert('Erro ao carregar decks disponíveis.');
        }
    };

    const handleBulkMove = async (targetDeckId: string) => {
        if (selectedCards.size === 0) return;

        try {
            setIsBulkMoving(true);
            const { error } = await supabase
                .from('flashcards')
                .update({ deck_id: targetDeckId })
                .in('id', Array.from(selectedCards));

            if (error) throw error;

            setShowBulkMoveModal(false);
            setSelectedCards(new Set());
            loadFlashcards();
        } catch (error) {
            console.error('Error moving flashcards:', error);
            alert('Erro ao mover flashcards.');
        } finally {
            setIsBulkMoving(false);
        }
    };

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

    const openEditModal = (card: FlashcardData) => {
        setCardToEdit(card);
        // Initialize form data based on card type
        const formData: any = {
            mode: card.mode
        };

        switch (card.mode) {
            case CardMode.QA:
                formData.question = card.question;
                formData.answer = card.answer;
                break;
            case CardMode.TrueFalse:
                formData.statement = card.statement;
                formData.isTrue = card.isTrue;
                formData.explanation = card.explanation || '';
                break;
            case CardMode.MultipleChoice:
                formData.question = card.question;
                formData.options = [...card.options];
                formData.correctAnswerIndex = card.correctAnswerIndex;
                formData.explanation = card.explanation || '';
                break;
            case CardMode.PracticalExample:
                formData.problem = card.problem;
                formData.question = card.question;
                formData.solution = card.solution;
                break;
            case CardMode.FillInTheBlank:
                formData.question = card.question;
                formData.answer = card.answer;
                break;
            case CardMode.Dictionary:
                formData.term = (card as any).term || card.question;
                formData.definition = (card as any).definition || card.answer;
                break;
        }

        setEditFormData(formData);
        setShowEditModal(true);
    };

    const handleEditChange = (field: string, value: any) => {
        setEditFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveEdit = async () => {
        if (!cardToEdit) return;

        try {
            setIsSaving(true);

            // Validate required fields
            if (editFormData.mode === CardMode.QA) {
                if (!editFormData.question?.trim() || !editFormData.answer?.trim()) {
                    alert('Pergunta e resposta são obrigatórias');
                    return;
                }
            } else if (editFormData.mode === CardMode.TrueFalse) {
                if (!editFormData.statement?.trim()) {
                    alert('Afirmação é obrigatória');
                    return;
                }
            } else if (editFormData.mode === CardMode.MultipleChoice) {
                if (!editFormData.question?.trim() || editFormData.options.some((opt: string) => !opt?.trim())) {
                    alert('Pergunta e todas as opções são obrigatórias');
                    return;
                }
            } else if (editFormData.mode === CardMode.PracticalExample) {
                if (!editFormData.problem?.trim() || !editFormData.question?.trim() || !editFormData.solution?.trim()) {
                    alert('Problema, pergunta e solução são obrigatórios');
                    return;
                }
            } else if (editFormData.mode === CardMode.FillInTheBlank) {
                if (!editFormData.question?.trim() || !editFormData.answer?.trim()) {
                    alert('Pergunta e resposta são obrigatórias');
                    return;
                }
            } else if (editFormData.mode === CardMode.Dictionary) {
                if (!editFormData.term?.trim() || !editFormData.definition?.trim()) {
                    alert('Termo e definição são obrigatórios');
                    return;
                }
            }

            // Update flashcard in database
            const updatePayload = { ...editFormData } as any;
            if (editFormData.mode === CardMode.Dictionary) {
                updatePayload.question = editFormData.term;
                updatePayload.answer = editFormData.definition;
                delete updatePayload.term;
                delete updatePayload.definition;
            }

            const { error } = await supabase
                .from('flashcards')
                .update(updatePayload)
                .eq('id', cardToEdit.id);

            if (error) throw error;

            // Reload flashcards to show updated data
            await loadFlashcards();
            setShowEditModal(false);
            setCardToEdit(null);
            setEditFormData({});
        } catch (error) {
            console.error('Error updating flashcard:', error);
            alert('Erro ao atualizar flashcard');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setShowEditModal(false);
        setCardToEdit(null);
        setEditFormData({});
    };

    // Text formatting helper
    const applyFormatting = (textareaRef: HTMLTextAreaElement, tag: 'b' | 'i' | 'u') => {
        const start = textareaRef.selectionStart;
        const end = textareaRef.selectionEnd;
        const selectedText = textareaRef.value.substring(start, end);

        if (selectedText) {
            const beforeText = textareaRef.value.substring(0, start);
            const afterText = textareaRef.value.substring(end);
            const formattedText = `<${tag}>${selectedText}</${tag}>`;

            return beforeText + formattedText + afterText;
        }
        return textareaRef.value;
    };

    const handleFormat = (field: string, tag: 'b' | 'i' | 'u', textareaId: string) => {
        const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
        if (textarea) {
            const newValue = applyFormatting(textarea, tag);
            handleEditChange(field, newValue);
            // Restore focus
            setTimeout(() => textarea.focus(), 0);
        }
    };

    // Formatting toolbar component
    const TextFormatToolbar = ({ field, textareaId }: { field: string; textareaId: string }) => (
        <div className="flex gap-1 mb-2">
            <button
                type="button"
                onClick={() => handleFormat(field, 'b', textareaId)}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm font-bold transition-colors"
                title="Negrito"
            >
                B
            </button>
            <button
                type="button"
                onClick={() => handleFormat(field, 'i', textareaId)}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm italic transition-colors"
                title="Itálico"
            >
                I
            </button>
            <button
                type="button"
                onClick={() => handleFormat(field, 'u', textareaId)}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm underline transition-colors"
                title="Sublinhado"
            >
                U
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400 self-center ml-2">
                Selecione o texto e clique para formatar
            </span>
        </div>
    );

    const handleBackToDeck = () => {
        // Navigate to dashboard with the current deck's parent context
        navigate('/dashboard', { state: { deckId: parentId } });
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
            <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-4 md:p-6 flex justify-between items-center shadow-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBackToDeck}
                        className="text-white/80 hover:text-white transition-colors text-2xl p-1 rounded-full hover:bg-white/10"
                        title="Voltar para o deck"
                    >
                        ←
                    </button>

                    {isEditingName ? (
                        <input
                            type="text"
                            value={tempDeckName}
                            onChange={(e) => setTempDeckName(e.target.value)}
                            onBlur={handleUpdateDeckName}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateDeckName();
                                if (e.key === 'Escape') {
                                    setIsEditingName(false);
                                    setTempDeckName(deckName);
                                }
                            }}
                            className="text-xl md:text-2xl font-bold bg-white/20 text-white border border-white/30 rounded px-2 py-1 outline-none w-full max-w-[300px]"
                            autoFocus
                        />
                    ) : (
                        <h1
                            className="text-xl md:text-2xl font-bold truncate max-w-[200px] md:max-w-md cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={handleBackToDeck}
                            title="Clique para voltar ao deck"
                        >
                            {deckName || 'Carregando...'}
                        </h1>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {flashcards.length > 0 && (
                        <button
                            onClick={() => navigate('/study', { state: { deckId } })}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-md text-white cursor-pointer text-sm font-semibold transition-all shadow-md flex items-center gap-2"
                        >
                            <span className="text-lg">🎯</span> <span className="hidden sm:inline">Modo Estudo</span>
                        </button>
                    )}
                    <button
                        onClick={() => setShowCSVImport(true)}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-md text-white cursor-pointer text-sm font-semibold transition-colors flex items-center gap-2"
                    >
                        <span>📥</span> <span className="hidden sm:inline">Importar CSV</span>
                    </button>
                    <button
                        onClick={() => navigate('/generator', { state: { deckId } })}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 rounded-md text-white cursor-pointer text-sm font-semibold transition-colors flex items-center gap-2"
                    >
                        <span className="text-lg">+</span> <span className="hidden sm:inline">Adicionar Flashcard</span>
                    </button>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p>Carregando flashcards...</p>
                    </div>
                ) : flashcards.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-10 text-center shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="text-5xl mb-4">📭</div>
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                            Nenhum flashcard encontrado neste deck.
                        </p>
                        <button
                            onClick={() => navigate('/generator', { state: { deckId } })}
                            className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Criar Primeiro Flashcard
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Bulk Actions Bar */}
                        {selectedCards.size > 0 && (
                            <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 flex flex-wrap items-center justify-between gap-3 sticky top-20 z-10 shadow-md">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-indigo-700 dark:text-indigo-300">
                                        {selectedCards.size} selecionado{selectedCards.size > 1 ? 's' : ''}
                                    </span>
                                    <button
                                        onClick={() => setSelectedCards(new Set())}
                                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        Limpar seleção
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={openBulkMoveModal}
                                        disabled={isBulkMoving}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <span>➡️</span> Mover
                                    </button>
                                    <button
                                        onClick={handleBulkDelete}
                                        disabled={isBulkDeleting}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <span>🗑️</span> Excluir
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Select All Button */}
                        <div className="mb-4 flex justify-between items-center">
                            <button
                                onClick={toggleSelectAll}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-semibold transition-colors"
                            >
                                {selectedCards.size === flashcards.length ? '☑️ Desselecionar Todos' : '☐ Selecionar Todos'}
                            </button>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {flashcards.length} flashcard{flashcards.length > 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Flashcards List */}
                        <div className="flex flex-col gap-4">
                            {flashcards.map((card) => (
                                <div
                                    key={card.id}
                                    className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-2 transition-all hover:shadow-md group ${selectedCards.has(card.id)
                                        ? 'border-indigo-500 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10'
                                        : 'border-gray-100 dark:border-gray-700'
                                        }`}
                                >
                                    <div className="flex gap-4">
                                        {/* Checkbox */}
                                        <div className="flex items-start pt-1">
                                            <input
                                                type="checkbox"
                                                checked={selectedCards.has(card.id)}
                                                onChange={() => toggleCardSelection(card.id)}
                                                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                        </div>

                                        {/* Card Content */}
                                        <div className="flex-1">
                                            <div className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-semibold mb-3">
                                                {getCardTypeLabel(card.mode)}
                                            </div>

                                            <div className="mb-4">
                                                <strong className="block text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                                    Pergunta/Frente
                                                </strong>
                                                <p className="text-gray-800 dark:text-gray-200 font-medium">
                                                    {card.mode === CardMode.QA && card.question}
                                                    {card.mode === CardMode.TrueFalse && card.statement}
                                                    {card.mode === CardMode.MultipleChoice && card.question}
                                                    {card.mode === CardMode.PracticalExample && (
                                                        <>
                                                            <div className="font-semibold mb-1">Problema: {card.problem}</div>
                                                            <div>Pergunta: {card.question}</div>
                                                        </>
                                                    )}
                                                    {card.mode === CardMode.FillInTheBlank && card.question}
                                                    {card.mode === CardMode.Dictionary ? ((card as any).term || card.question || '(sem termo)') : null}
                                                </p>
                                            </div>

                                            <div>
                                                <strong className="block text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                                    Resposta/Verso
                                                </strong>
                                                <p className="text-gray-600 dark:text-gray-400">
                                                    {card.mode === CardMode.QA && card.answer}
                                                    {card.mode === CardMode.TrueFalse && (card.isTrue ? 'Verdadeiro' : 'Falso')}
                                                    {card.mode === CardMode.MultipleChoice && card.options[card.correctAnswerIndex]}
                                                    {card.mode === CardMode.PracticalExample && card.solution}
                                                    {card.mode === CardMode.FillInTheBlank && card.answer}
                                                    {card.mode === CardMode.Dictionary ? ((card as any).definition || card.answer || '(sem definição)') : null}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Individual Actions */}
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => openEditModal(card)}
                                                className="px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex items-center justify-center gap-2"
                                                title="Editar flashcard"
                                            >
                                                <span>✏️</span>
                                            </button>
                                            <button
                                                onClick={() => openMoveCardModal(card)}
                                                className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-2"
                                                title="Mover flashcard"
                                            >
                                                <span>➡️</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCard(card.id)}
                                                className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2"
                                                title="Excluir flashcard"
                                            >
                                                <span>🗑️</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Subdecks Section */}
                {subdecks.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <span>📂</span> Subdecks
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {subdecks.map((subdeck) => (
                                <div
                                    key={subdeck.id}
                                    onClick={() => navigate(`/deck/${subdeck.id}`)}
                                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-2 border-gray-100 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-600 transition-all cursor-pointer group hover:shadow-md"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl group-hover:scale-110 transition-transform">
                                            📁
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {subdeck.name}
                                            </h3>
                                        </div>
                                        <div className="text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            →
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Move Single Card Modal */}
            {
                showMoveCardModal && cardToMove && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                                Mover Flashcard para...
                            </h2>

                            <div className="max-h-60 overflow-y-auto mb-4 space-y-2">
                                {availableDecks.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">Nenhum outro deck disponível.</p>
                                ) : (
                                    availableDecks.map(deck => (
                                        <button
                                            key={deck.id}
                                            onClick={() => handleMoveCard(deck.id)}
                                            className="w-full text-left p-3 rounded-lg transition-colors flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent"
                                        >
                                            <span className="text-xl">📁</span>
                                            <span className="font-medium text-gray-700 dark:text-gray-200">{deck.name}</span>
                                        </button>
                                    ))
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={() => setShowMoveCardModal(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    disabled={isMovingCard}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Bulk Move Modal */}
            {
                showBulkMoveModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                                Mover {selectedCards.size} flashcard{selectedCards.size > 1 ? 's' : ''} para...
                            </h2>

                            <div className="max-h-60 overflow-y-auto mb-4 space-y-2">
                                {availableDecks.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">Nenhum outro deck disponível.</p>
                                ) : (
                                    availableDecks.map(deck => (
                                        <button
                                            key={deck.id}
                                            onClick={() => handleBulkMove(deck.id)}
                                            disabled={isBulkMoving}
                                            className="w-full text-left p-3 rounded-lg transition-colors flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent disabled:opacity-50"
                                        >
                                            <span className="text-xl">📁</span>
                                            <span className="font-medium text-gray-700 dark:text-gray-200">{deck.name}</span>
                                        </button>
                                    ))
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={() => setShowBulkMoveModal(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    disabled={isBulkMoving}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit Card Modal */}
            {
                showEditModal && cardToEdit && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
                                Editar Flashcard - {getCardTypeLabel(cardToEdit.mode)}
                            </h2>

                            <div className="space-y-4">
                                {/* Q&A Mode Fields */}
                                {editFormData.mode === CardMode.QA && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Pergunta *
                                            </label>
                                            <TextFormatToolbar field="question" textareaId="edit-qa-question" />
                                            <textarea
                                                id="edit-qa-question"
                                                value={editFormData.question || ''}
                                                onChange={(e) => handleEditChange('question', e.target.value)}
                                                rows={3}
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                                placeholder="Digite a pergunta..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Resposta *
                                            </label>
                                            <TextFormatToolbar field="answer" textareaId="edit-qa-answer" />
                                            <textarea
                                                id="edit-qa-answer"
                                                value={editFormData.answer || ''}
                                                onChange={(e) => handleEditChange('answer', e.target.value)}
                                                rows={3}
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                                placeholder="Digite a resposta..."
                                            />
                                        </div>
                                    </>
                                )}

                                {/* True/False Mode Fields */}
                                {editFormData.mode === CardMode.TrueFalse && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Afirmação *
                                            </label>
                                            <TextFormatToolbar field="statement" textareaId="edit-tf-statement" />
                                            <textarea
                                                id="edit-tf-statement"
                                                value={editFormData.statement || ''}
                                                onChange={(e) => handleEditChange('statement', e.target.value)}
                                                rows={3}
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                                placeholder="Digite a afirmação..."
                                            />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={editFormData.isTrue || false}
                                                onChange={(e) => handleEditChange('isTrue', e.target.checked)}
                                                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Esta afirmação é verdadeira
                                            </label>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Explicação
                                            </label>
                                            <TextFormatToolbar field="explanation" textareaId="edit-tf-explanation" />
                                            <textarea
                                                id="edit-tf-explanation"
                                                value={editFormData.explanation || ''}
                                                onChange={(e) => handleEditChange('explanation', e.target.value)}
                                                rows={2}
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                                placeholder="Digite uma explicação..."
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Multiple Choice Mode Fields */}
                                {editFormData.mode === CardMode.MultipleChoice && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Pergunta *
                                            </label>
                                            <TextFormatToolbar field="question" textareaId="edit-mc-question" />
                                            <textarea
                                                id="edit-mc-question"
                                                value={editFormData.question || ''}
                                                onChange={(e) => handleEditChange('question', e.target.value)}
                                                rows={3}
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                                placeholder="Digite a pergunta..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Opções *
                                            </label>
                                            {editFormData.options?.map((option: string, index: number) => (
                                                <div key={index} className="flex items-center gap-3 mb-2">
                                                    <input
                                                        type="radio"
                                                        name="correct_answer"
                                                        checked={editFormData.correctAnswerIndex === index}
                                                        onChange={() => handleEditChange('correctAnswerIndex', index)}
                                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={option}
                                                        onChange={(e) => {
                                                            const newOptions = [...editFormData.options];
                                                            newOptions[index] = e.target.value;
                                                            handleEditChange('options', newOptions);
                                                        }}
                                                        className="flex-1 p-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                                        placeholder={`Opção ${String.fromCharCode(65 + index)}`}
                                                    />
                                                </div>
                                            ))}
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                Selecione o círculo da opção correta
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Explicação
                                            </label>
                                            <TextFormatToolbar field="explanation" textareaId="edit-mc-explanation" />
                                            <textarea
                                                id="edit-mc-explanation"
                                                value={editFormData.explanation || ''}
                                                onChange={(e) => handleEditChange('explanation', e.target.value)}
                                                rows={2}
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                                placeholder="Digite uma explicação..."
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Practical Example Mode Fields */}
                                {editFormData.mode === CardMode.PracticalExample && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Problema *
                                            </label>
                                            <TextFormatToolbar field="problem" textareaId="edit-pe-problem" />
                                            <textarea
                                                id="edit-pe-problem"
                                                value={editFormData.problem || ''}
                                                onChange={(e) => handleEditChange('problem', e.target.value)}
                                                rows={3}
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                                placeholder="Digite o problema..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Pergunta *
                                            </label>
                                            <TextFormatToolbar field="question" textareaId="edit-pe-question" />
                                            <textarea
                                                id="edit-pe-question"
                                                value={editFormData.question || ''}
                                                onChange={(e) => handleEditChange('question', e.target.value)}
                                                rows={2}
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                                placeholder="Digite a pergunta..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Solução *
                                            </label>
                                            <TextFormatToolbar field="solution" textareaId="edit-pe-solution" />
                                            <textarea
                                                id="edit-pe-solution"
                                                value={editFormData.solution || ''}
                                                onChange={(e) => handleEditChange('solution', e.target.value)}
                                                rows={3}
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                                placeholder="Digite a solução..."
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Fill in the Blank Mode Fields */}
                                {editFormData.mode === CardMode.FillInTheBlank && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Pergunta *
                                            </label>
                                            <TextFormatToolbar field="question" textareaId="edit-fib-question" />
                                            <textarea
                                                id="edit-fib-question"
                                                value={editFormData.question || ''}
                                                onChange={(e) => handleEditChange('question', e.target.value)}
                                                rows={3}
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                                placeholder="Digite a pergunta com lacunas..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Resposta *
                                            </label>
                                            <TextFormatToolbar field="answer" textareaId="edit-fib-answer" />
                                            <textarea
                                                id="edit-fib-answer"
                                                value={editFormData.answer || ''}
                                                onChange={(e) => handleEditChange('answer', e.target.value)}
                                                rows={2}
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                                placeholder="Digite a resposta..."
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Dictionary Mode Fields */}
                                {editFormData.mode === CardMode.Dictionary && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Termo *
                                            </label>
                                            <TextFormatToolbar field="term" textareaId="edit-dict-term" />
                                            <textarea
                                                id="edit-dict-term"
                                                value={editFormData.term || ''}
                                                onChange={(e) => handleEditChange('term', e.target.value)}
                                                rows={2}
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                                placeholder="Digite o termo..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Definição *
                                            </label>
                                            <TextFormatToolbar field="definition" textareaId="edit-dict-definition" />
                                            <textarea
                                                id="edit-dict-definition"
                                                value={editFormData.definition || ''}
                                                onChange={(e) => handleEditChange('definition', e.target.value)}
                                                rows={3}
                                                className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                                placeholder="Digite a definição..."
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700 mt-6">
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-semibold"
                                    disabled={isSaving}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={isSaving}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Salvando...
                                        </>
                                    ) : (
                                        'Salvar Alterações'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* CSV Import Modal */}
            <CSVImportModal
                isOpen={showCSVImport}
                onClose={() => setShowCSVImport(false)}
                onImportComplete={(count) => {
                    setShowCSVImport(false);
                    loadFlashcards(); // Reload flashcards to show imported ones
                    alert(`${count} flashcards importados com sucesso!`);
                }}
                preselectedDeckId={deckId}
            />
        </div>
    );
};

export default DeckDetails;
