import { supabase } from './supabaseClient';

const FLASHCARD_BUCKET = 'flashcard-images';

const randomSuffix = () => Math.random().toString(36).slice(2, 8);

export const uploadFlashcardImage = async (file: File, userId: string, cardId?: string) => {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/${cardId || 'new-card'}/${Date.now()}-${randomSuffix()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from(FLASHCARD_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
        throw uploadError;
    }

    const { data } = supabase.storage.from(FLASHCARD_BUCKET).getPublicUrl(path);
    return data.publicUrl;
};

export const deleteFlashcardImage = async (path: string) => {
    await supabase.storage.from(FLASHCARD_BUCKET).remove([path]);
};
