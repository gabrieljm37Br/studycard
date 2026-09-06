import { describe, it, expect, vi } from 'vitest';
import {
  validateImageFileSignature,
  deleteFlashcardImage,
  MAX_IMAGE_SIZE_BYTES
} from '../services/storageService';

// Mock do supabase client para isolar testes de unidade
vi.mock('../services/supabaseClient', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/image.png' } })),
        remove: vi.fn().mockResolvedValue({ error: null })
      }))
    }
  }
}));

describe('storageService - Validações de Segurança', () => {
  describe('validateImageFileSignature (Magic Bytes)', () => {
    it('deve reconhecer assinatura autêntica de PNG', async () => {
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);
      const file = new Blob([pngBytes], { type: 'image/png' });

      const result = await validateImageFileSignature(file);
      expect(result.valid).toBe(true);
      expect(result.detectedMime).toBe('image/png');
      expect(result.extension).toBe('png');
    });

    it('deve reconhecer assinatura autêntica de JPEG', async () => {
      const jpegBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]);
      const file = new Blob([jpegBytes], { type: 'image/jpeg' });

      const result = await validateImageFileSignature(file);
      expect(result.valid).toBe(true);
      expect(result.detectedMime).toBe('image/jpeg');
      expect(result.extension).toBe('jpg');
    });

    it('deve reconhecer assinatura autêntica de GIF', async () => {
      const gifBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00]);
      const file = new Blob([gifBytes], { type: 'image/gif' });

      const result = await validateImageFileSignature(file);
      expect(result.valid).toBe(true);
      expect(result.detectedMime).toBe('image/gif');
      expect(result.extension).toBe('gif');
    });

    it('deve reconhecer assinatura autêntica de WebP', async () => {
      const webpBytes = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // "RIFF"
        0x24, 0x00, 0x00, 0x00, // tamanho
        0x57, 0x45, 0x42, 0x50  // "WEBP"
      ]);
      const file = new Blob([webpBytes], { type: 'image/webp' });

      const result = await validateImageFileSignature(file);
      expect(result.valid).toBe(true);
      expect(result.detectedMime).toBe('image/webp');
      expect(result.extension).toBe('webp');
    });

    it('deve rejeitar arquivo SVG mesmo se nomeado com extensão de imagem', async () => {
      const svgText = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
      const file = new Blob([svgText], { type: 'image/svg+xml' });

      const result = await validateImageFileSignature(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Formato de arquivo não permitido');
    });

    it('deve rejeitar arquivo HTML ou script disfarçado', async () => {
      const htmlText = '<html><script>stealTokens()</script></html>';
      const file = new Blob([htmlText], { type: 'image/jpeg' });

      const result = await validateImageFileSignature(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Formato de arquivo não permitido');
    });

    it('deve rejeitar arquivos que excedam o limite máximo de 5MB', async () => {
      // Simula arquivo de 6MB
      const oversizedBlob = {
        size: MAX_IMAGE_SIZE_BYTES + 1024,
        slice: vi.fn()
      } as unknown as Blob;

      const result = await validateImageFileSignature(oversizedBlob);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('excede o limite máximo');
    });
  });

  describe('deleteFlashcardImage - Isolamento de Caminho', () => {
    it('deve permitir exclusão se o path pertencer ao usuário autenticado', async () => {
      const ownPath = 'meu-usuario-uuid/card-123/imagem.jpg';
      const currentUserId = 'meu-usuario-uuid';

      await expect(deleteFlashcardImage(ownPath, currentUserId)).resolves.toBeUndefined();
    });
  });

  describe('uploadFlashcardImage - Upload e URL Pública', () => {
    it('deve realizar upload de imagem autêntica com caminho sanitizado', async () => {
      const { uploadFlashcardImage } = await import('../services/storageService');
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);
      const validFile = new File([pngBytes], 'teste.png', { type: 'image/png' });

      const url = await uploadFlashcardImage(validFile, 'user-123', 'card-456');
      expect(url).toBe('https://example.com/image.png');
    });

    it('deve rejeitar upload se userId for inválido ou ausente', async () => {
      const { uploadFlashcardImage } = await import('../services/storageService');
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const validFile = new File([pngBytes], 'teste.png', { type: 'image/png' });

      await expect(uploadFlashcardImage(validFile, '')).rejects.toThrow('Identificador de usuário ausente');
    });
  });
});
