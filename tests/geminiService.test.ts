import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  cleanContent,
  parseTextFile,
  parseCsvFile,
  generateFlashcardsWithSearch,
  interpretAndClassifyFlashcards
} from '../services/geminiService';
import { CardMode } from '../types';

vi.mock('../services/supabaseClient', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('geminiService - Processamento de Arquivos e Edge Function de IA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Utilitários de Limpeza e Parsing', () => {
    it('deve limpar caracteres de controle e espaços extras com cleanContent', () => {
      const dirty = '\r\n\t Olá mundo  \r\n\r\n';
      expect(cleanContent(dirty)).toBe('Olá mundo');
    });

    it('deve dividir arquivo TXT por parágrafos duplos ou linhas com parseTextFile', () => {
      const txt = 'Parágrafo 1\n\nParágrafo 2\n\nParágrafo 3';
      const records = parseTextFile(txt);
      expect(records).toHaveLength(3);
      expect(records[0]).toBe('Parágrafo 1');
    });

    it('deve processar linhas de CSV concatenando colunas com parseCsvFile', () => {
      const csv = 'Pergunta 1,Resposta 1\nPergunta 2,Resposta 2';
      const records = parseCsvFile(csv);
      expect(records).toHaveLength(2);
      expect(records[0]).toBe('Pergunta 1 | Resposta 1');
    });
  });

  describe('2. Invocação de Edge Function para Geração com Pesquisa', () => {
    it('deve invocar generate-flashcards e normalizar os cards retornados', async () => {
      const { supabase } = await import('../services/supabaseClient');
      const mockEdgeResponse = {
        flashcards: [
          { question: 'O que é Fotossíntese?', answer: 'Processo fotoquímico...' },
        ],
        sources: [{ title: 'Biologia', url: 'https://example.com' }],
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: mockEdgeResponse,
        error: null,
      } as any);

      const cards = await generateFlashcardsWithSearch('Fotossíntese', CardMode.QA);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('generate-flashcards', {
        body: { action: 'generateWithSearch', topic: 'Fotossíntese', mode: CardMode.QA },
      });
      expect(cards).toHaveLength(1);
      expect(cards[0].question).toBe('O que é Fotossíntese?');
      expect(cards[0].mode).toBe(CardMode.QA);
      expect(cards[0].sources).toEqual(mockEdgeResponse.sources);
    });

    it('deve lançar erro se a Edge Function retornar erro', async () => {
      const { supabase } = await import('../services/supabaseClient');
      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: null,
        error: { message: 'Edge Function timeout' },
      } as any);

      await expect(generateFlashcardsWithSearch('Tópico', CardMode.QA)).rejects.toThrow('Edge Function timeout');
    });
  });

  describe('3. Classificação e Interpretação de Registros', () => {
    it('deve classificar corretamente cards dos múltiplos modos suportados', async () => {
      const { supabase } = await import('../services/supabaseClient');
      const mockClassified = {
        flashcards: [
          { mode: CardMode.QA, question: 'Q1', answer: 'A1' },
          { mode: CardMode.TrueFalse, statement: 'S1', isTrue: true, explanation: 'Exp1' },
          { mode: CardMode.MultipleChoice, question: 'Q2', options: ['A', 'B'], correctAnswerIndex: 0 },
          { mode: CardMode.FillInTheBlank, sentence: 'A capital é _____.', correctAnswer: 'Brasília' },
          { mode: CardMode.Dictionary, term: 'Célula', definition: 'Unidade fundamental' },
          { mode: CardMode.PracticalExample, problem: 'Prob', question: 'Q3', solution: 'Sol' },
        ],
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
        data: mockClassified,
        error: null,
      } as any);

      const cards = await interpretAndClassifyFlashcards(['registro 1', 'registro 2']);

      expect(cards).toHaveLength(6);
      expect(cards[0].mode).toBe(CardMode.QA);
      expect(cards[1].mode).toBe(CardMode.TrueFalse);
      expect(cards[2].mode).toBe(CardMode.MultipleChoice);
      expect(cards[3].mode).toBe(CardMode.FillInTheBlank);
      expect(cards[4].mode).toBe(CardMode.Dictionary);
      expect(cards[5].mode).toBe(CardMode.PracticalExample);
    });
  });
});
