import { describe, it, expect, beforeEach } from 'vitest';
import {
  mockSupabaseClient,
  mockTableResponse,
  mockRpcResponse,
  resetSupabaseMock,
  createSupabaseQueryMock
} from './mocks/supabaseMock';

describe('supabaseMock - Mock Compartilhado de Chamadas Supabase', () => {
  beforeEach(() => {
    resetSupabaseMock();
  });

  describe('1. Fluent Query Builder (from / select / filters)', () => {
    it('deve encadear métodos de consulta sem falhas e resolver dados da tabela', async () => {
      const mockDecks = [
        { id: '1', name: 'Biologia', user_id: 'user-1' },
        { id: '2', name: 'História', user_id: 'user-1' },
      ];

      mockTableResponse('decks', mockDecks);

      const response = await mockSupabaseClient
        .from('decks')
        .select('*')
        .eq('user_id', 'user-1')
        .order('name', { ascending: true });

      expect(response.data).toEqual(mockDecks);
      expect(response.error).toBeNull();
    });

    it('deve extrair primeiro elemento com single() e maybeSingle()', async () => {
      const mockDeck = { id: 'deck-10', name: 'Física Clássica' };
      mockTableResponse('decks', [mockDeck]);

      const singleRes = await mockSupabaseClient
        .from('decks')
        .select('*')
        .eq('id', 'deck-10')
        .single();

      expect(singleRes.data).toEqual(mockDeck);

      const maybeRes = await mockSupabaseClient
        .from('decks')
        .select('*')
        .eq('id', 'deck-10')
        .maybeSingle();

      expect(maybeRes.data).toEqual(mockDeck);
    });

    it('deve suportar operações de mutação insert, update e delete', async () => {
      mockTableResponse('flashcards', { id: 'card-1', question: 'Teste' });

      const insertRes = await mockSupabaseClient
        .from('flashcards')
        .insert({ question: 'Teste', answer: 'OK' });

      expect(insertRes.error).toBeNull();

      const updateRes = await mockSupabaseClient
        .from('flashcards')
        .update({ question: 'Novo Teste' })
        .eq('id', 'card-1');

      expect(updateRes.error).toBeNull();

      const deleteRes = await mockSupabaseClient
        .from('flashcards')
        .delete()
        .eq('id', 'card-1');

      expect(deleteRes.error).toBeNull();
    });
  });

  describe('2. Funções RPC (Remote Procedure Call)', () => {
    it('deve retornar a resposta mockada para funções RPC específicas', async () => {
      const badgesMock = [
        { id: 'badge-1', name: 'Primeiro Estudo', is_new: true },
      ];

      mockRpcResponse('sync_user_badges', badgesMock);

      const rpcResult = await mockSupabaseClient.rpc('sync_user_badges', { p_user_id: 'user-1' });

      expect(rpcResult.data).toEqual(badgesMock);
      expect(rpcResult.error).toBeNull();
    });

    it('deve retornar array vazio por padrão para RPCs não explicitamente configuradas', async () => {
      const result = await mockSupabaseClient.rpc('funcao_qualquer');
      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });
  });

  describe('3. Supabase Storage', () => {
    it('deve gerar URLs públicas e simular upload e remoção de arquivos', async () => {
      const storage = mockSupabaseClient.storage.from('flashcard-images');

      const uploadRes = await storage.upload('user-1/card-1/photo.png', new Blob());
      expect(uploadRes.error).toBeNull();
      expect(uploadRes.data.path).toBe('mocked/path.png');

      const urlRes = storage.getPublicUrl('user-1/card-1/photo.png');
      expect(urlRes.data.publicUrl).toBe('https://example.com/storage/user-1/card-1/photo.png');

      const removeRes = await storage.remove(['user-1/card-1/photo.png']);
      expect(removeRes.error).toBeNull();
    });
  });

  describe('4. Supabase Auth', () => {
    it('deve retornar usuário autenticado e sessão padrão', async () => {
      const { data: userData } = await mockSupabaseClient.auth.getUser();
      expect(userData.user.id).toBe('mock-user-id');
      expect(userData.user.email).toBe('user@studycard.app');

      const { data: sessionData } = await mockSupabaseClient.auth.getSession();
      expect(sessionData.session.access_token).toBe('mock-jwt-token');
    });
  });
});
