import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface UseCardNotesParams {
    cardId: string | undefined;
    user: any;
}

export const useCardNotes = ({ cardId, user }: UseCardNotesParams) => {
    const [currentNote, setCurrentNote] = useState('');
    const [showNotesPanel, setShowNotesPanel] = useState(false);
    const [noteId, setNoteId] = useState<string | null>(null);
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [hasNote, setHasNote] = useState(false);

    useEffect(() => {
        const loadNote = async () => {
            if (!cardId || !user) return;

            try {
                const { data, error } = await supabase
                    .from('flashcard_notes')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('flashcard_id', cardId)
                    .maybeSingle();

                if (error) throw error;

                if (data) {
                    setCurrentNote(data.note_text);
                    setNoteId(data.id);
                    setHasNote(true);
                } else {
                    setCurrentNote('');
                    setNoteId(null);
                    setHasNote(false);
                }
            } catch (error) {
                console.error('Error loading note:', error);
            }
        };

        loadNote();
    }, [cardId, user]);

    const saveNote = async () => {
        if (!cardId || !user) return;

        setIsSavingNote(true);
        try {
            const noteData = {
                user_id: user.id,
                flashcard_id: cardId,
                note_text: currentNote.trim()
            };

            if (currentNote.trim() === '') {
                if (noteId) {
                    await supabase
                        .from('flashcard_notes')
                        .delete()
                        .eq('id', noteId);
                    setNoteId(null);
                    setHasNote(false);
                }
            } else if (noteId) {
                await supabase
                    .from('flashcard_notes')
                    .update({ note_text: currentNote.trim() })
                    .eq('id', noteId);
                setHasNote(true);
            } else {
                const { data, error } = await supabase
                    .from('flashcard_notes')
                    .insert(noteData)
                    .select()
                    .single();

                if (error) throw error;
                if (data) {
                    setNoteId(data.id);
                    setHasNote(true);
                }
            }
        } catch (error) {
            console.error('Error saving note:', error);
            alert('Erro ao salvar anotação');
        } finally {
            setIsSavingNote(false);
        }
    };

    return {
        currentNote,
        setCurrentNote,
        showNotesPanel,
        setShowNotesPanel,
        isSavingNote,
        hasNote,
        saveNote
    };
};
