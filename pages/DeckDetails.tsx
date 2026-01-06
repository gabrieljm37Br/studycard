import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { CardMode } from '../types';
import type { FlashcardData } from '../types';
import CSVImportModal from '../components/CSVImportModal';
import AnkiTxtImportModal from '../components/AnkiTxtImportModal';
import FlashcardWysiwygEditor from '../components/FlashcardWysiwygEditor';
import { sanitizeHTML, renderHTML } from '@/utils/textUtils';
import { Home, BookOpenCheck, Library, Folder, BookX, Image as ImageIcon } from 'lucide-react';
import { render as renderKatex } from 'katex';
import 'katex/contrib/mhchem';
import { useRef } from 'react';
import { uploadFlashcardImage } from '../services/storageService';

type LocalAttachment = {
    file: File;
    preview: string;
    name: string;
    size: number;
};

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_SIZE_MB = 5;

const DeckDetails: React.FC = () => {
    const { deckId } = useParams<{ deckId: string }>();
    const navigate = useNavigate();
    const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
    const [deckName, setDeckName] = useState('');
    const [loading, setLoading] = useState(true);
    const [subdecks, setSubdecks] = useState<{ id: string; name: string }[]>([]);
    const [breadcrumb, setBreadcrumb] = useState<{ id: string | null; name: string }[]>([]);

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
    const [newAttachments, setNewAttachments] = useState<LocalAttachment[]>([]);
    const [removedAttachments, setRemovedAttachments] = useState<Set<string>>(new Set());
    const [isUnmarkingEditFlag, setIsUnmarkingEditFlag] = useState(false);

    // CSV Import State
    const [showCSVImport, setShowCSVImport] = useState(false);
    const [showAnkiImport, setShowAnkiImport] = useState(false);

    // Filters
    const [modeFilter, setModeFilter] = useState<CardMode | 'all'>('all');
    const [tagFilter, setTagFilter] = useState<string[]>([]);
    const [showAllTags, setShowAllTags] = useState(false);
    const cardListRef = useRef<HTMLDivElement | null>(null);
    const visibleAttachments = useMemo(() => {
        const attachments: string[] = (editFormData as any).attachments || [];
        return attachments.filter((url: string) => !removedAttachments.has(url));
    }, [editFormData, removedAttachments]);

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
            await buildBreadcrumbTrail(deckId, data.name, data.parent_id);
        } catch (error) {
            console.error('Error loading deck details:', error);
        }
    };

    const buildBreadcrumbTrail = async (id: string, name: string, parent: string | null) => {
        if (!user) return;

        const trail: { id: string | null; name: string }[] = [{ id: null, name: 'Meus Decks' }];
        const lineage: { id: string; name: string; parent_id: string | null }[] = [];

        let currentParent = parent;
        while (currentParent) {
            const { data, error } = await supabase
                .from('decks')
                .select('id, name, parent_id')
                .eq('id', currentParent)
                .eq('user_id', user.id)
                .maybeSingle();

            if (error || !data) break;
            lineage.push(data);
            currentParent = data.parent_id;
        }

        lineage.reverse().forEach(d => trail.push({ id: d.id, name: d.name }));
        trail.push({ id, name });
        setBreadcrumb(trail);
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
            const normalized = (data || []).map((card: any) => {
                const camelCard = {
                    ...card,
                    attachments: card.attachments || [],
                    isTrue: card.isTrue ?? card.is_true,
                    correctAnswerIndex: card.correctAnswerIndex ?? card.correct_answer_index,
                    needsEdit: (card as any).needsEdit ?? (card as any).needs_edit ?? false,
                };

                return camelCard.mode === CardMode.Dictionary
                    ? {
                        ...camelCard,
                        term: camelCard.term || camelCard.question || '',
                        definition: camelCard.definition || camelCard.answer || '',
                    }
                    : camelCard;
            });
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

    const handleViewSubdecks = () => {
        if (subdecks.length === 0) return;
        navigate('/dashboard', { state: { deckId } });
    };

    const availableTags = useMemo(() => {
        const tags = new Set<string>();
        flashcards.forEach(card => {
            const cardTags = (card as any).tags as string[] | undefined;
            cardTags?.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort((a, b) => a.localeCompare(b));
    }, [flashcards]);

    const filteredFlashcards = useMemo(() => {
        const activeTags = tagFilter.map(tag => tag.toLowerCase());
        return flashcards.filter(card => {
            const modeMatches = modeFilter === 'all' || card.mode === modeFilter;
            if (!modeMatches) return false;

            if (activeTags.length === 0) return true;
            const cardTags = ((card as any).tags as string[] | undefined) ?? [];
            const normalized = cardTags.map(tag => tag.toLowerCase());
            // Mostrar cards que tenham todas as tags ou qualquer uma das selecionadas
            const hasAll = activeTags.every(tag => normalized.includes(tag));
            const hasAny = activeTags.some(tag => normalized.includes(tag));
            return hasAll || hasAny;
        });
    }, [flashcards, modeFilter, tagFilter]);

    const allVisibleSelected = filteredFlashcards.length > 0 && filteredFlashcards.every(card => selectedCards.has(card.id));

    useEffect(() => {
        setSelectedCards(prev => {
            const visibleIds = new Set(filteredFlashcards.map(card => card.id));
            return new Set([...prev].filter(id => visibleIds.has(id)));
        });
    }, [filteredFlashcards]);

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

            console.log('Flashcard exclu├â┬¡do com sucesso:', data);
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
            alert('Erro ao carregar decks dispon├â┬¡veis.');
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
    const handleTagToggle = (tag: string) => {
        setTagFilter(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const handleClearFilters = () => {
        setModeFilter('all');
        setTagFilter([]);
        setSelectedCards(new Set());
    };

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
        if (filteredFlashcards.length === 0) return;

        const newSelected = new Set(selectedCards);
        if (allVisibleSelected) {
            filteredFlashcards.forEach(card => newSelected.delete(card.id));
        } else {
            filteredFlashcards.forEach(card => newSelected.add(card.id));
        }
        setSelectedCards(newSelected);
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
            alert('Erro ao carregar decks dispon├â┬¡veis.');
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
            case CardMode.MultipleChoice: return 'Multipla Escolha';
            case CardMode.PracticalExample: return 'Exemplo Pratico';
            case CardMode.FillInTheBlank: return 'Lacunas';
            case CardMode.Dictionary: return 'Dicionario';
            default: return mode;
        }
    };

    const getQuestionHtml = (card: FlashcardData) => {
        switch (card.mode) {
            case CardMode.QA:
            case CardMode.MultipleChoice:
            case CardMode.FillInTheBlank:
                return card.question || '';
            case CardMode.TrueFalse:
                return card.statement || '';
            case CardMode.Dictionary:
                return (card as any).term || (card as any).question || '(sem termo)';
            default:
                return '';
        }
    };

    const getAnswerHtml = (card: FlashcardData) => {
        switch (card.mode) {
            case CardMode.QA:
                return card.answer || '';
            case CardMode.TrueFalse:
                return card.isTrue ? 'Verdadeiro' : 'Falso';
            case CardMode.MultipleChoice:
                return card.options && card.correctAnswerIndex !== undefined
                    ? card.options[card.correctAnswerIndex]
                    : (card as any).answer || '';
            case CardMode.PracticalExample:
                return card.solution || '';
            case CardMode.FillInTheBlank:
                return card.answer || '';
            case CardMode.Dictionary:
                return (card as any).definition || (card as any).answer || '(sem definicao)';
            default:
                return '';
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
                formData.options = card.options ? [...card.options] : ['', '', '', '']; // Fallback options
                formData.correctAnswerIndex = card.correctAnswerIndex ?? 0;
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
                formData.explanation = card.explanation || '';
                break;
            case CardMode.Dictionary:
                formData.term = (card as any).term || (card as any).question;
                formData.definition = (card as any).definition || (card as any).answer;
                break;
        }

        // Add tags (common for all card types)
        formData.tags = (card as any).tags ? (card as any).tags.join(', ') : '';
        formData.attachments = (card as any).attachments || [];
        formData.needsEdit = (card as any).needsEdit ?? false;

        setEditFormData(formData);
        setNewAttachments([]);
        setRemovedAttachments(new Set());
        setShowEditModal(true);
    };

    const handleEditChange = (field: string, value: any) => {
        setEditFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAttachmentSelect = (files: FileList | null) => {
        if (!files) return;

        const currentCount = ((cardToEdit as any)?.attachments || []).filter((url: string) => !removedAttachments.has(url)).length + newAttachments.length;
        const availableSlots = MAX_ATTACHMENTS - currentCount;
        if (availableSlots <= 0) {
            alert(`Limite de ${MAX_ATTACHMENTS} imagens atingido.`);
            return;
        }

        const accepted: LocalAttachment[] = [];
        Array.from(files)
            .slice(0, availableSlots)
            .forEach(file => {
                if (!file.type.startsWith('image/')) {
                    return;
                }
                if (file.size > MAX_ATTACHMENT_SIZE_MB * 1024 * 1024) {
                    return;
                }
                accepted.push({
                    file,
                    preview: URL.createObjectURL(file),
                    name: file.name,
                    size: file.size,
                });
            });

        if (accepted.length === 0) {
            alert(`Nenhuma imagem valida. Tipos: image/*; tamanho maximo ${MAX_ATTACHMENT_SIZE_MB}MB.`);
            return;
        }

        setNewAttachments(prev => [...prev, ...accepted]);
    };

    const handleRemoveAttachment = (url: string) => {
        setRemovedAttachments(prev => {
            const next = new Set(prev);
            next.add(url);
            return next;
        });
    };

    const handleRemoveNewAttachment = (preview: string) => {
        setNewAttachments(prev => {
            const next = prev.filter(item => item.preview !== preview);
            const removed = prev.find(item => item.preview === preview);
            if (removed) {
                URL.revokeObjectURL(removed.preview);
            }
            return next;
        });
    };

    const resetAttachmentsState = () => {
        newAttachments.forEach(item => URL.revokeObjectURL(item.preview));
        setNewAttachments([]);
        setRemovedAttachments(new Set());
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
            const {
                questionJson,
                answerJson,
                statementJson,
                explanationJson,
                problemJson,
                solutionJson,
                termJson,
                definitionJson,
                needsEdit,
                ...updatePayload
            } = editFormData as any;

            const sanitizeField = (field: string) => {
                if (updatePayload[field] !== undefined) {
                    updatePayload[field] = sanitizeHTML(updatePayload[field]);
                }
            };

            // Sanitizar campos ricos antes de salvar (defesa em profundidade)
            sanitizeField('question');
            sanitizeField('answer');
            sanitizeField('statement');
            sanitizeField('explanation');
            sanitizeField('problem');
            sanitizeField('solution');
            sanitizeField('term');
            sanitizeField('definition');
            if (editFormData.mode === CardMode.Dictionary) {
                updatePayload.question = editFormData.term;
                updatePayload.answer = editFormData.definition;
                delete updatePayload.term;
                delete updatePayload.definition;
            }
            // Normalize flag to snake_case for DB
            if (needsEdit !== undefined) {
                updatePayload.needs_edit = needsEdit;
                delete updatePayload.needsEdit;
            }
            // Align payload keys with DB column names
            if (editFormData.mode === CardMode.TrueFalse && updatePayload.isTrue !== undefined) {
                updatePayload.is_true = updatePayload.isTrue;
                delete updatePayload.isTrue;
            }
            if (editFormData.mode === CardMode.MultipleChoice && updatePayload.correctAnswerIndex !== undefined) {
                updatePayload.correct_answer_index = updatePayload.correctAnswerIndex;
                delete updatePayload.correctAnswerIndex;
            }

            // Process tags from string to array
            if (editFormData.tags !== undefined) {
                updatePayload.tags = editFormData.tags.trim()
                    ? editFormData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0)
                    : [];
            }

            const existingAttachments: string[] = (cardToEdit as any).attachments || [];
            const keptAttachments = existingAttachments.filter(url => !removedAttachments.has(url));
            const uploadedAttachments: string[] = [];

            if (newAttachments.length > 0) {
                if (!user?.id) {
                    throw new Error('Usuario nao encontrado para upload de imagens.');
                }
                for (const item of newAttachments) {
                    const publicUrl = await uploadFlashcardImage(item.file, user.id, cardToEdit.id);
                    uploadedAttachments.push(publicUrl);
                }
            }

            if (keptAttachments.length > 0 || uploadedAttachments.length > 0) {
                updatePayload.attachments = [...keptAttachments, ...uploadedAttachments];
            } else {
                updatePayload.attachments = [];
            }

            const { error } = await supabase
                .from('flashcards')
                .update(updatePayload)
                .eq('id', cardToEdit.id);

            if (error) {
                console.error('Supabase update error:', error);
                console.error('Update payload:', updatePayload);
                throw error;
            }

            // Reload flashcards to show updated data
            await loadFlashcards();
            setShowEditModal(false);
            setCardToEdit(null);
            setEditFormData({});
            resetAttachmentsState();
        } catch (error) {
            console.error('Error updating flashcard:', error);
            alert('Erro ao atualizar flashcard. Verifique se as colunas tags/attachments existem no banco e se o upload esta configurado.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUnmarkForEdit = async () => {
        if (!cardToEdit || !user) return;

        try {
            setIsUnmarkingEditFlag(true);
            const { error } = await supabase
                .from('flashcards')
                .update({ needs_edit: false })
                .eq('id', cardToEdit.id)
                .eq('user_id', user.id);

            if (error) throw error;

            setFlashcards(prev => prev.map(fc => (fc.id === cardToEdit.id ? { ...fc, needsEdit: false } : fc)));
            setCardToEdit(prev => (prev ? { ...prev, needsEdit: false } : prev));
            setEditFormData((prev: any) => ({ ...prev, needsEdit: false }));
        } catch (error) {
            console.error('Erro ao desmarcar flashcard para edição:', error);
            alert('Erro ao desmarcar este flashcard. Tente novamente.');
        } finally {
            setIsUnmarkingEditFlag(false);
        }
    };

    const handleCancelEdit = () => {
        setShowEditModal(false);
        setCardToEdit(null);
        setEditFormData({});
        resetAttachmentsState();
    };

    const handleRichChange = (field: string, html: string, json: any) => {
        setEditFormData((prev: any) => ({
            ...prev,
            [field]: html,
            [`${field}Json`]: json,
        }));
    };

    const handleEditorImageUpload = async (file: File) => {
        if (!user?.id) {
            throw new Error('Usuário não autenticado para upload de imagem.');
        }
        return uploadFlashcardImage(file, user.id, cardToEdit?.id);
    };

    const handleBackHome = () => {
        // Voltar sempre para a página inicial
        navigate('/dashboard', { state: { deckId } });
    };

    useEffect(() => {
        const container = cardListRef.current;
        if (!container) return;

        // Aguarda o DOM pintar e aplica KaTeX nos spans gerados pelo editor (data-latex / data-type)
        requestAnimationFrame(() => {
            try {
                const latexNodes = container.querySelectorAll<HTMLElement>('span[data-latex], span[data-type="inline-math"], span[data-type="block-math"]');
                latexNodes.forEach(node => {
                    const latex = node.getAttribute('data-latex') || node.textContent || '';
                    if (!latex) return;
                    renderKatex(latex, node, { throwOnError: false, displayMode: node.getAttribute('data-type') === 'block-math' });
                });
            } catch (error) {
                console.error('Erro ao renderizar LaTeX no card:', error);
            }
        });
    }, [filteredFlashcards, showEditModal, selectedCards]);

    const handleGoHome = () => {
        navigate('/home');
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
            <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto w-full px-4 py-6 md:px-6 md:py-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="space-y-1 text-center lg:text-left">
                            <p className="text-xs uppercase tracking-widest text-white/70">Deck</p>
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
                                    className="text-3xl md:text-4xl font-bold bg-white/20 text-white border border-white/30 rounded px-2 py-1 outline-none w-full max-w-md"
                                    autoFocus
                                />
                            ) : (
                                <h1
                                    className="text-3xl md:text-4xl font-bold leading-tight truncate max-w-full lg:max-w-md cursor-pointer hover:opacity-85 transition-opacity"
                                    onClick={handleBackHome}
                                    title="Clique para ir para a Home"
                                >
                                    {deckName || 'Carregando...'}
                                </h1>
                            )}
                        </div>

                        <div className="flex items-center justify-center lg:justify-end gap-2 md:gap-3 flex-wrap">
                            <button
                                onClick={handleGoHome}
                                className="p-2.5 bg-white/15 hover:bg-white/25 border border-white/25 rounded-lg text-white cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                title="Voltar para Home"
                                aria-label="Voltar para Home"
                            >
                                <Home className="w-5 h-5" />
                                <span className="hidden md:inline text-sm font-semibold">Home</span>
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-2.5 bg-white/15 hover:bg-white/25 border border-white/25 rounded-lg text-white cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                title="Meus Decks"
                                aria-label="Meus Decks"
                            >
                                <Folder className="w-5 h-5" />
                                <span className="hidden md:inline text-sm font-semibold">Meus Decks</span>
                            </button>

                            <button
                                onClick={() => navigate('/help')}
                                className="p-2.5 bg-white/15 hover:bg-white/25 border border-white/25 rounded-lg text-white cursor-pointer transition-all hover:scale-105 active:scale-95"
                                title="Central de Ajuda"
                                aria-label="Abrir central de ajuda"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>



            <div className="max-w-4xl mx-auto px-4 py-8">
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
                                onClick={handleViewSubdecks}
                                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all whitespace-nowrap min-w-[160px]"
                            >
                                Ver subdecks
                            </button>
                        )}
                    </div>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                    {breadcrumb.map((item, idx) => {
                        const isLast = idx === breadcrumb.length - 1;
                        const handleClick = () => {
                            if (isLast) return;
                            if (item.id) {
                                navigate(`/deck/${item.id}`);
                            } else {
                                navigate('/dashboard');
                            }
                        };

                        return (
                            <React.Fragment key={`${item.id ?? 'root'}-${idx}`}>
                                {idx > 0 && <span className="text-xs text-gray-400 dark:text-gray-500">/</span>}
                                <button
                                    onClick={handleClick}
                                    disabled={isLast}
                                    className={`inline-flex items-center gap-1 transition-colors ${isLast
                                        ? 'text-gray-500 dark:text-gray-400 cursor-default'
                                        : 'hover:text-indigo-700 dark:hover:text-indigo-200'}`}
                                >
                                    {idx === 0 && <Library className="w-4 h-4" aria-hidden />}
                                    <span>{item.name}</span>
                                </button>
                            </React.Fragment>
                        );
                    })}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p>Carregando flashcards...</p>
                    </div>
                ) : flashcards.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 text-center shadow-sm border border-gray-100 dark:border-gray-700">
                        <BookX className="w-12 h-12 mx-auto text-indigo-500 mb-4" aria-hidden />
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
                        {/* Filters */}
                        <div className="mb-5 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-end gap-4">
                                <div className="flex-1 min-w-[240px]">
                                    <label className="sr-only" htmlFor="mode-filter-select">
                                        Modalidade do flashcard
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                                            Modalidade do flashcard
                                        </span>
                                        <select
                                            id="mode-filter-select"
                                            value={modeFilter}
                                            onChange={(e) => setModeFilter(e.target.value as CardMode | 'all')}
                                            className="w-full h-11 pt-4 px-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none"
                                        >
                                            <option value="all">Todas as modalidades</option>
                                            <option value={CardMode.QA}>Pergunta &amp; Resposta</option>
                                            <option value={CardMode.TrueFalse}>Verdadeiro ou Falso</option>
                                            <option value={CardMode.MultipleChoice}>Múltipla Escolha</option>
                                            <option value={CardMode.PracticalExample}>Exemplo Prático</option>
                                            <option value={CardMode.FillInTheBlank}>Lacunas</option>
                                            <option value={CardMode.Dictionary}>Dicionário</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                        Tags
                                    </label>
                                    {availableTags.length > 0 ? (
                                        <>
                                            <div className={`flex flex-wrap gap-2 ${showAllTags ? 'max-h-40' : 'max-h-24'} overflow-y-auto pr-1`}>
                                                {(showAllTags ? availableTags : availableTags.slice(0, 8)).map(tag => {
                                                    const isActive = tagFilter.includes(tag);
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={tag}
                                                            onClick={() => handleTagToggle(tag)}
                                                            className={`px-3 py-1 rounded-full border text-sm transition-colors ${isActive
                                                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-transparent hover:border-gray-300 dark:hover:border-gray-500'}`}
                                                        >
                                                            {tag}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {availableTags.length > 8 && (
                                                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAllTags(prev => !prev)}
                                                        className="text-indigo-600 dark:text-indigo-300 font-semibold hover:underline"
                                                    >
                                                        {showAllTags ? 'Mostrar menos' : 'Mostrar todas'}
                                                    </button>
                                                    <span>
                                                        {showAllTags
                                                            ? `Exibindo ${availableTags.length} tags`
                                                            : `Exibindo 8 de ${availableTags.length} tags`}
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma tag cadastrada neste deck.</p>
                                    )}
                                </div>

                                <div className="flex md:w-auto gap-2">
                                    <button
                                        onClick={handleClearFilters}
                                        className="h-11 px-4 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-indigo-400 dark:hover:border-indigo-400 transition-colors"
                                    >
                                        Limpar filtros
                                    </button>
                                </div>
                            </div>
                            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                Filtre por modalidade e combine multiplas tags para focar nos flashcards certos.
                            </p>
                        </div>

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
                                        Limpar selecao
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={openBulkMoveModal}
                                        disabled={isBulkMoving}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        Mover
                                    </button>
                                    <button
                                        onClick={handleBulkDelete}
                                        disabled={isBulkDeleting}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Select All Button */}
                        <div className="mb-4 flex justify-between items-center">
                            <button
                                onClick={toggleSelectAll}
                                disabled={filteredFlashcards.length === 0}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                {allVisibleSelected ? 'Desselecionar visiveis' : 'Selecionar visiveis'}
                            </button>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Mostrando {filteredFlashcards.length} de {flashcards.length} flashcard{flashcards.length > 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Flashcards List */}
                        {filteredFlashcards.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center border border-gray-100 dark:border-gray-700">
                                <p className="text-gray-600 dark:text-gray-300">Nenhum flashcard corresponde aos filtros selecionados.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4" ref={cardListRef}>
                                {filteredFlashcards.map((card) => (
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

                                                {card.needsEdit && (
                                                    <div className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm font-semibold mb-3">
                                                        <span className="text-lg leading-none">⚠ Precisa de ajustes</span>
                                                    </div>
                                                )}

                                                <div className="mb-4">
                                                    <strong className="block text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                                        Pergunta/Frente
                                                    </strong>
                                                    {card.mode === CardMode.PracticalExample ? (
                                                        <div className="space-y-2 text-gray-800 dark:text-gray-200 font-medium">
                                                            <div>
                                                                <div className="font-semibold mb-1">Problema:</div>
                                                                <div dangerouslySetInnerHTML={renderHTML(card.problem)} />
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold mb-1">Pergunta:</div>
                                                                <div dangerouslySetInnerHTML={renderHTML(card.question)} />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p
                                                            className="text-gray-800 dark:text-gray-200 font-medium"
                                                            dangerouslySetInnerHTML={renderHTML(getQuestionHtml(card))}
                                                        />
                                                    )}
                                                </div>

                                                <div>
                                                    <strong className="block text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                                        Resposta/Verso
                                                    </strong>
                                                    <p
                                                        className="text-gray-600 dark:text-gray-400"
                                                        dangerouslySetInnerHTML={renderHTML(getAnswerHtml(card))}
                                                    />
                                                    {card.explanation && (
                                                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                                            <span className="font-semibold block">Explicação</span>
                                                            <div dangerouslySetInnerHTML={renderHTML(card.explanation)} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Individual Actions */}
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => openEditModal(card)}
                                                    className="px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex items-center justify-center gap-2"
                                                    title="Editar flashcard"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => openMoveCardModal(card)}
                                                    className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-2"
                                                    title="Mover flashcard"
                                                >
                                                    Mover
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCard(card.id)}
                                                    className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2"
                                                    title="Excluir flashcard"
                                                >
                                                    Excluir
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
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
                                    <p className="text-gray-500 text-center py-4">Nenhum outro deck dispon├â┬¡vel.</p>
                                ) : (
                                    availableDecks.map(deck => (
                                        <button
                                            key={deck.id}
                                            onClick={() => handleMoveCard(deck.id)}
                                            className="w-full text-left p-3 rounded-lg transition-colors flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent"
                                        >
                                            <Folder className="w-5 h-5" aria-hidden />
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
                                    <p className="text-gray-500 text-center py-4">Nenhum outro deck dispon├â┬¡vel.</p>
                                ) : (
                                    availableDecks.map(deck => (
                                        <button
                                            key={deck.id}
                                            onClick={() => handleBulkMove(deck.id)}
                                            disabled={isBulkMoving}
                                            className="w-full text-left p-3 rounded-lg transition-colors flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent disabled:opacity-50"
                                        >
                                            <Folder className="w-5 h-5" aria-hidden />
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
                                            <FlashcardWysiwygEditor
                                                valueJson={editFormData.questionJson}
                                                valueHtml={editFormData.question || ''}
                                                onChangeJson={(json) => handleRichChange('question', editFormData.question || '', json)}
                                                onChangeHtml={(html) => handleRichChange('question', html, editFormData.questionJson)}
                                                onImageUpload={handleEditorImageUpload}
                                                placeholder="Digite a pergunta..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Resposta *
                                            </label>
                                            <FlashcardWysiwygEditor
                                                valueJson={editFormData.answerJson}
                                                valueHtml={editFormData.answer || ''}
                                                onChangeJson={(json) => handleRichChange('answer', editFormData.answer || '', json)}
                                                onChangeHtml={(html) => handleRichChange('answer', html, editFormData.answerJson)}
                                                onImageUpload={handleEditorImageUpload}
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
                                            <FlashcardWysiwygEditor
                                                valueJson={editFormData.statementJson}
                                                valueHtml={editFormData.statement || ''}
                                                onChangeJson={(json) => handleRichChange('statement', editFormData.statement || '', json)}
                                                onChangeHtml={(html) => handleRichChange('statement', html, editFormData.statementJson)}
                                                onImageUpload={handleEditorImageUpload}
                                                placeholder="Digite a afirmacao..."
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
                                                Esta afirmação e verdadeira
                                            </label>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Explicação
                                            </label>
                                            <FlashcardWysiwygEditor
                                                valueJson={editFormData.explanationJson}
                                                valueHtml={editFormData.explanation || ''}
                                                onChangeJson={(json) => handleRichChange('explanation', editFormData.explanation || '', json)}
                                                onChangeHtml={(html) => handleRichChange('explanation', html, editFormData.explanationJson)}
                                                onImageUpload={handleEditorImageUpload}
                                                placeholder="Digite uma explicacao..."
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
                                            <FlashcardWysiwygEditor
                                                valueJson={editFormData.questionJson}
                                                valueHtml={editFormData.question || ''}
                                                onChangeJson={(json) => handleRichChange('question', editFormData.question || '', json)}
                                                onChangeHtml={(html) => handleRichChange('question', html, editFormData.questionJson)}
                                                onImageUpload={handleEditorImageUpload}
                                                placeholder="Digite a pergunta..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Op├º├Áes *
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
                                                        placeholder={`Op├º├Áes ${String.fromCharCode(65 + index)}`}
                                                    />
                                                </div>
                                            ))}
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                Selecione o circulo da op├º├úo correta
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Explicação
                                            </label>
                                            <FlashcardWysiwygEditor
                                                valueJson={editFormData.explanationJson}
                                                valueHtml={editFormData.explanation || ''}
                                                onChangeJson={(json) => handleRichChange('explanation', editFormData.explanation || '', json)}
                                                onChangeHtml={(html) => handleRichChange('explanation', html, editFormData.explanationJson)}
                                                onImageUpload={handleEditorImageUpload}
                                                placeholder="Digite uma explicacao..."
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
                                            <FlashcardWysiwygEditor
                                                valueJson={editFormData.problemJson}
                                                valueHtml={editFormData.problem || ''}
                                                onChangeJson={(json) => handleRichChange('problem', editFormData.problem || '', json)}
                                                onChangeHtml={(html) => handleRichChange('problem', html, editFormData.problemJson)}
                                                onImageUpload={handleEditorImageUpload}
                                                placeholder="Digite o problema..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Pergunta *
                                            </label>
                                            <FlashcardWysiwygEditor
                                                valueJson={editFormData.questionJson}
                                                valueHtml={editFormData.question || ''}
                                                onChangeJson={(json) => handleRichChange('question', editFormData.question || '', json)}
                                                onChangeHtml={(html) => handleRichChange('question', html, editFormData.questionJson)}
                                                onImageUpload={handleEditorImageUpload}
                                                placeholder="Digite a pergunta..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Solução *
                                            </label>
                                            <FlashcardWysiwygEditor
                                                valueJson={editFormData.solutionJson}
                                                valueHtml={editFormData.solution || ''}
                                                onChangeJson={(json) => handleRichChange('solution', editFormData.solution || '', json)}
                                                onChangeHtml={(html) => handleRichChange('solution', html, editFormData.solutionJson)}
                                                onImageUpload={handleEditorImageUpload}
                                                placeholder="Digite a solucao..."
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
                                            <FlashcardWysiwygEditor
                                                valueJson={editFormData.questionJson}
                                                valueHtml={editFormData.question || ''}
                                                onChangeJson={(json) => handleRichChange('question', editFormData.question || '', json)}
                                                onChangeHtml={(html) => handleRichChange('question', html, editFormData.questionJson)}
                                                onImageUpload={handleEditorImageUpload}
                                                placeholder="Digite a pergunta com lacunas..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Resposta *
                                            </label>
                                            <FlashcardWysiwygEditor
                                                valueJson={editFormData.answerJson}
                                                valueHtml={editFormData.answer || ''}
                                                onChangeJson={(json) => handleRichChange('answer', editFormData.answer || '', json)}
                                                onChangeHtml={(html) => handleRichChange('answer', html, editFormData.answerJson)}
                                                onImageUpload={handleEditorImageUpload}
                                                placeholder="Digite a resposta..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Explicação
                                            </label>
                                            <FlashcardWysiwygEditor
                                                valueJson={editFormData.explanationJson}
                                                valueHtml={editFormData.explanation || ''}
                                                onChangeJson={(json) => handleRichChange('explanation', editFormData.explanation || '', json)}
                                                onChangeHtml={(html) => handleRichChange('explanation', html, editFormData.explanationJson)}
                                                onImageUpload={handleEditorImageUpload}
                                                placeholder="Opcional: detalhe a resposta ou dÃª contexto..."
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
                                            <FlashcardWysiwygEditor
                                                valueJson={editFormData.termJson}
                                                valueHtml={editFormData.term || ''}
                                                onChangeJson={(json) => handleRichChange('term', editFormData.term || '', json)}
                                                onChangeHtml={(html) => handleRichChange('term', html, editFormData.termJson)}
                                                onImageUpload={handleEditorImageUpload}
                                                placeholder="Digite o termo..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Definição *
                                            </label>
                                            <FlashcardWysiwygEditor
                                                valueJson={editFormData.definitionJson}
                                                valueHtml={editFormData.definition || ''}
                                                onChangeJson={(json) => handleRichChange('definition', editFormData.definition || '', json)}
                                                onChangeHtml={(html) => handleRichChange('definition', html, editFormData.definitionJson)}
                                                onImageUpload={handleEditorImageUpload}
                                                placeholder="Digite a definicao..."
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Attachments */}
                                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ImageIcon className="w-4 h-4 text-indigo-600" aria-hidden />
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Imagens (opcional)
                                        </label>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => handleAttachmentSelect(e.target.files)}
                                            className="text-sm text-gray-700 dark:text-gray-200"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Ate {MAX_ATTACHMENTS} imagens, {MAX_ATTACHMENT_SIZE_MB}MB cada. Aceita apenas formatos de imagem.
                                        </p>
                                    </div>

                                    {(visibleAttachments.length > 0 || newAttachments.length > 0) && (
                                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {visibleAttachments.map((url: string) => (
                                                <div key={url} className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                                    <img src={url} alt="Anexo" className="w-full h-24 object-cover" loading="lazy" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveAttachment(url)}
                                                        className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded"
                                                    >
                                                        Remover
                                                    </button>
                                                </div>
                                            ))}
                                            {newAttachments.map((item) => (
                                                <div key={item.preview} className="relative rounded-lg overflow-hidden border border-dashed border-indigo-300">
                                                    <img src={item.preview} alt={item.name} className="w-full h-24 object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveNewAttachment(item.preview)}
                                                        className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-2 py-1 truncate">
                                                        {item.name}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Tags Input - Common for all card types */}
                                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Tags (opcional)
                                    </label>
                                    <input
                                        type="text"
                                        value={editFormData.tags || ""}
                                        onChange={(e) => handleEditChange("tags", e.target.value)}
                                        placeholder="Ex: matematica, algebra (separadas por vírgula)"
                                        className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Adicione tags separadas por vírgula para organizar seus flashcards
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700 mt-6">
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-semibold"
                                    disabled={isSaving}
                                >
                                    Cancelar
                                </button>
                                {cardToEdit?.needsEdit && (
                                    <button
                                        onClick={handleUnmarkForEdit}
                                        disabled={isUnmarkingEditFlag || isSaving}
                                        className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isUnmarkingEditFlag ? 'Atualizando...' : 'Remover marcação'}
                                    </button>
                                )}
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

            <AnkiTxtImportModal
                isOpen={showAnkiImport}
                onClose={() => setShowAnkiImport(false)}
                onImportComplete={(count) => {
                    setShowAnkiImport(false);
                    loadFlashcards();
                    alert(`${count} flashcards importados com sucesso do TXT do Anki!`);
                }}
                preselectedDeckId={deckId}
            />
        </div>
    );
};

export default DeckDetails;















