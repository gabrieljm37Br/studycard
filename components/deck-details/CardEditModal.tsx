import React, { useState, useMemo } from 'react';
import { CardMode } from '../../types';
import type { FlashcardData } from '../../types';
import FlashcardWysiwygEditor from '../FlashcardWysiwygEditor';
import { Image as ImageIcon } from 'lucide-react';
import { uploadFlashcardImage } from '../../services/storageService';
import { sanitizeHTML } from '@/utils/textUtils';
import { supabase } from '../../services/supabaseClient';

type LocalAttachment = {
    file: File;
    preview: string;
    name: string;
    size: number;
};

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_SIZE_MB = 5;

interface CardEditModalProps {
    isOpen: boolean;
    card: FlashcardData | null;
    onClose: () => void;
    onSaved: () => void;
    user: any;
}

export const CardEditModal: React.FC<CardEditModalProps> = ({
    isOpen,
    card,
    onClose,
    onSaved,
    user
}) => {
    if (!isOpen || !card) return null;

    const [editFormData, setEditFormData] = useState<any>(() => {
        const data: any = { mode: card.mode };
        switch (card.mode) {
            case CardMode.QA:
                data.question = card.question;
                data.answer = card.answer;
                break;
            case CardMode.TrueFalse:
                data.statement = card.statement;
                data.isTrue = card.isTrue;
                data.explanation = card.explanation || '';
                break;
            case CardMode.MultipleChoice:
                data.question = card.question;
                data.options = card.options ? [...card.options] : ['', '', '', ''];
                data.correctAnswerIndex = card.correctAnswerIndex ?? 0;
                data.explanation = card.explanation || '';
                break;
            case CardMode.PracticalExample:
                data.problem = card.problem;
                data.question = card.question;
                data.solution = card.solution;
                data.explanation = card.explanation || '';
                break;
            case CardMode.FillInTheBlank:
                data.question = card.question;
                data.answer = card.answer;
                data.explanation = card.explanation || '';
                break;
            case CardMode.Dictionary:
                data.term = (card as any).term || (card as any).question;
                data.definition = (card as any).definition || (card as any).answer;
                break;
        }
        data.tags = (card as any).tags ? (card as any).tags.join(', ') : '';
        data.attachments = (card as any).attachments || [];
        data.needsEdit = (card as any).needsEdit ?? false;
        return data;
    });

    const [newAttachments, setNewAttachments] = useState<LocalAttachment[]>([]);
    const [removedAttachments, setRemovedAttachments] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const [isUnmarkingEditFlag, setIsUnmarkingEditFlag] = useState(false);

    const visibleAttachments = useMemo(() => {
        const attachments: string[] = editFormData.attachments || [];
        return attachments.filter((url: string) => !removedAttachments.has(url));
    }, [editFormData, removedAttachments]);

    const handleEditChange = (field: string, value: any) => {
        setEditFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleRichChange = (field: string, html: string, json: any) => {
        setEditFormData((prev: any) => ({
            ...prev,
            [field]: html,
            [`${field}Json`]: json,
        }));
    };

    const handleEditorImageUpload = async (file: File) => {
        if (!user?.id) throw new Error('Usuário não autenticado.');
        return uploadFlashcardImage(file, user.id, card.id);
    };

    const handleAttachmentSelect = (files: FileList | null) => {
        if (!files) return;
        const currentCount = visibleAttachments.length + newAttachments.length;
        const availableSlots = MAX_ATTACHMENTS - currentCount;
        if (availableSlots <= 0) {
            alert(`Limite de ${MAX_ATTACHMENTS} imagens atingido.`);
            return;
        }
        const accepted: LocalAttachment[] = [];
        Array.from(files).slice(0, availableSlots).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            if (file.size > MAX_ATTACHMENT_SIZE_MB * 1024 * 1024) return;
            accepted.push({
                file,
                preview: URL.createObjectURL(file),
                name: file.name,
                size: file.size,
            });
        });
        setNewAttachments(prev => [...prev, ...accepted]);
    };

    const handleRemoveAttachment = (url: string) => {
        setRemovedAttachments(prev => new Set(prev).add(url));
    };

    const handleRemoveNewAttachment = (preview: string) => {
        setNewAttachments(prev => {
            const removed = prev.find(item => item.preview === preview);
            if (removed) URL.revokeObjectURL(removed.preview);
            return prev.filter(item => item.preview !== preview);
        });
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const { questionJson, answerJson, statementJson, explanationJson, problemJson, solutionJson, termJson, definitionJson, needsEdit, ...updatePayload } = editFormData;

            const sanitizeField = (field: string) => {
                if (updatePayload[field] !== undefined) updatePayload[field] = sanitizeHTML(updatePayload[field]);
            };
            ['question', 'answer', 'statement', 'explanation', 'problem', 'solution', 'term', 'definition'].forEach(sanitizeField);

            if (editFormData.mode === CardMode.Dictionary) {
                updatePayload.question = editFormData.term;
                updatePayload.answer = editFormData.definition;
                delete updatePayload.term;
                delete updatePayload.definition;
            }
            if (needsEdit !== undefined) {
                updatePayload.needs_edit = needsEdit;
                delete updatePayload.needsEdit;
            }
            if (editFormData.mode === CardMode.TrueFalse && updatePayload.isTrue !== undefined) {
                updatePayload.is_true = updatePayload.isTrue;
                delete updatePayload.isTrue;
            }
            if (editFormData.mode === CardMode.MultipleChoice && updatePayload.correctAnswerIndex !== undefined) {
                updatePayload.correct_answer_index = updatePayload.correctAnswerIndex;
                delete updatePayload.correctAnswerIndex;
            }
            if (editFormData.tags !== undefined) {
                updatePayload.tags = editFormData.tags.trim()
                    ? editFormData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
                    : [];
            }

            const existingAttachments: string[] = (card as any).attachments || [];
            const keptAttachments = existingAttachments.filter(url => !removedAttachments.has(url));
            const uploadedAttachments: string[] = [];

            if (newAttachments.length > 0 && user?.id) {
                for (const item of newAttachments) {
                    const publicUrl = await uploadFlashcardImage(item.file, user.id, card.id);
                    uploadedAttachments.push(publicUrl);
                }
            }
            updatePayload.attachments = [...keptAttachments, ...uploadedAttachments];

            const { error } = await supabase
                .from('flashcards')
                .update(updatePayload)
                .eq('id', card.id);

            if (error) throw error;
            onSaved();
            onClose();
        } catch (error) {
            console.error('Error updating flashcard:', error);
            alert('Erro ao atualizar flashcard.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUnmarkForEdit = async () => {
        if (!user) return;
        try {
            setIsUnmarkingEditFlag(true);
            const { error } = await supabase
                .from('flashcards')
                .update({ needs_edit: false })
                .eq('id', card.id)
                .eq('user_id', user.id);
            if (error) throw error;
            setEditFormData((prev: any) => ({ ...prev, needsEdit: false }));
            onSaved();
        } catch (error) {
            console.error('Erro ao desmarcar:', error);
        } finally {
            setIsUnmarkingEditFlag(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Editar Flashcard</h2>
                    <button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-semibold">
                        Fechar
                    </button>
                </div>

                <div className="space-y-4">
                    {editFormData.mode === CardMode.QA && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Pergunta *</label>
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
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Resposta *</label>
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

                    {editFormData.mode === CardMode.TrueFalse && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Afirmação</label>
                                <FlashcardWysiwygEditor
                                    valueJson={editFormData.statementJson}
                                    valueHtml={editFormData.statement || ''}
                                    onChangeJson={(json) => handleRichChange('statement', editFormData.statement || '', json)}
                                    onChangeHtml={(html) => handleRichChange('statement', html, editFormData.statementJson)}
                                    onImageUpload={handleEditorImageUpload}
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
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Esta afirmação é verdadeira</label>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Explicação</label>
                                <FlashcardWysiwygEditor
                                    valueJson={editFormData.explanationJson}
                                    valueHtml={editFormData.explanation || ''}
                                    onChangeJson={(json) => handleRichChange('explanation', editFormData.explanation || '', json)}
                                    onChangeHtml={(html) => handleRichChange('explanation', html, editFormData.explanationJson)}
                                    onImageUpload={handleEditorImageUpload}
                                    placeholder="Digite uma explicação..."
                                />
                            </div>
                        </>
                    )}

                    {editFormData.mode === CardMode.MultipleChoice && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Pergunta *</label>
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
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Opções *</label>
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
                                            className="flex-1 p-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                            placeholder={`Opção ${String.fromCharCode(65 + index)}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Tags Input */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tags (opcional)</label>
                        <input
                            type="text"
                            value={editFormData.tags || ''}
                            onChange={(e) => handleEditChange('tags', e.target.value)}
                            placeholder="Ex: matematica, algebra (separadas por vírgula)"
                            className="w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700 mt-6">
                    <button onClick={onClose} className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-semibold" disabled={isSaving}>
                        Cancelar
                    </button>
                    {card.needsEdit && (
                        <button onClick={handleUnmarkForEdit} disabled={isUnmarkingEditFlag || isSaving} className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold">
                            {isUnmarkingEditFlag ? 'Atualizando...' : 'Remover marcação'}
                        </button>
                    )}
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold">
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
};
