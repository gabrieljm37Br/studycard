import { supabase } from './supabaseClient';

const FLASHCARD_BUCKET = 'flashcard-images';
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const randomSuffix = () => Math.random().toString(36).slice(2, 8);

/**
 * Validação rigorosa de assinatura binária (Magic Bytes) de arquivos de imagem.
 * Impede extensões falsificadas e uploads de arquivos HTML, SVG ou executáveis disfarçados.
 */
export const validateImageFileSignature = async (
    file: File | Blob
): Promise<{ valid: boolean; detectedMime?: string; extension?: string; error?: string }> => {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return {
            valid: false,
            error: `O arquivo excede o limite máximo permitido de 5MB (tamanho atual: ${(file.size / (1024 * 1024)).toFixed(2)}MB).`
        };
    }

    if (file.size < 4) {
        return { valid: false, error: 'Arquivo inválido ou corrompido.' };
    }

    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
        bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A) {
        return { valid: true, detectedMime: 'image/png', extension: 'png' };
    }

    // JPEG / JPG: FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        return { valid: true, detectedMime: 'image/jpeg', extension: 'jpg' };
    }

    // GIF: 47 49 46 38 (GIF87a / GIF89a)
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
        return { valid: true, detectedMime: 'image/gif', extension: 'gif' };
    }

    // WebP: RIFF (52 49 46 46) .... WEBP (57 45 42 50)
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
        return { valid: true, detectedMime: 'image/webp', extension: 'webp' };
    }

    return {
        valid: false,
        error: 'Formato de arquivo não permitido. Apenas imagens estáticas autênticas (PNG, JPEG, WebP ou GIF) são aceitas.'
    };
};

/**
 * Faz upload de imagem de flashcard com validação rigorosa de assinatura, sanitização de caminho e isolamento por usuário.
 */
export const uploadFlashcardImage = async (file: File, userId: string, cardId?: string): Promise<string> => {
    if (!userId || typeof userId !== 'string') {
        throw new Error('Identificador de usuário ausente ou inválido.');
    }

    // 1. Validação de assinatura binária e tipo MIME real
    const validation = await validateImageFileSignature(file);
    if (!validation.valid || !validation.extension || !validation.detectedMime) {
        throw new Error(validation.error || 'Arquivo de imagem inválido.');
    }

    // 2. Sanitização de caminho para prevenir Path Traversal
    const cleanUserId = userId.replace(/[^a-zA-Z0-9-]/g, '');
    const cleanCardId = (cardId || 'new-card').replace(/[^a-zA-Z0-9-]/g, '');
    const fileExt = validation.extension;
    const path = `${cleanUserId}/${cleanCardId}/${Date.now()}-${randomSuffix()}.${fileExt}`;

    // 3. Upload no Supabase Storage com tipo MIME real validado
    const { error: uploadError } = await supabase.storage
        .from(FLASHCARD_BUCKET)
        .upload(path, file, {
            upsert: false, // Previne sobrescrita indevida
            contentType: validation.detectedMime
        });

    if (uploadError) {
        console.error('Erro no upload de imagem:', uploadError);
        throw new Error(uploadError.message || 'Falha ao salvar a imagem no servidor.');
    }

    const { data } = supabase.storage.from(FLASHCARD_BUCKET).getPublicUrl(path);
    return data.publicUrl;
};

/**
 * Remove imagem de flashcard do storage, validando que o caminho pertença ao usuário.
 */
export const deleteFlashcardImage = async (path: string, userId?: string): Promise<void> => {
    if (!path || typeof path !== 'string') return;

    // Se o userId for informado, valida se o path pertence à pasta do usuário
    if (userId) {
        const cleanUserId = userId.replace(/[^a-zA-Z0-9-]/g, '');
        if (!path.startsWith(`${cleanUserId}/`)) {
            throw new Error('Acesso negado: Não é permitido excluir imagens de outros usuários.');
        }
    }

    const { error } = await supabase.storage.from(FLASHCARD_BUCKET).remove([path]);
    if (error) {
        console.error('Erro ao excluir imagem:', error);
        throw error;
    }
};
