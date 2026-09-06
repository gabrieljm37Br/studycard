import { describe, it, expect } from 'vitest';
import { parseAnkiTxtFile, validateAnkiTxtContent } from '../services/ankiTxtParser';
import { CardMode } from '../types';

describe('ankiTxtParser', () => {
  it('deve processar card com Pergunta: e Resposta:', () => {
    const text = `Pergunta: Qual a capital da França?\nResposta: Paris\nTags: geografia, europa`;
    const cards = parseAnkiTxtFile(text);
    expect(cards).toHaveLength(1);
    expect(cards[0].front).toBe('Qual a capital da França?');
    expect(cards[0].back).toBe('Paris');
    expect(cards[0].type).toBe(CardMode.QA);
    expect(cards[0].tags).toEqual(['geografia', 'europa']);
  });

  it('deve processar card Certo ou Errado', () => {
    const text = `Certo ou Errado: O sol é uma estrela\nResposta: Certo\nExplicação: O sol é classificado como uma anã amarela.`;
    const cards = parseAnkiTxtFile(text);
    expect(cards).toHaveLength(1);
    expect(cards[0].type).toBe(CardMode.TrueFalse);
    expect(cards[0].isTrue).toBe(true);
    expect(cards[0].explanation).toContain('anã amarela');
  });

  it('deve processar card de Lacuna', () => {
    const text = `Lacuna: A fotossíntese ocorre nos ____.\nResposta: cloroplastos`;
    const cards = parseAnkiTxtFile(text);
    expect(cards).toHaveLength(1);
    expect(cards[0].type).toBe(CardMode.FillInTheBlank);
    expect(cards[0].front).toContain('____');
    expect(cards[0].back).toBe('cloroplastos');
  });

  it('deve processar card de Dicionário', () => {
    const text = `Dicionário: Mitose\nSignificado: Processo de divisão celular com células-filhas idênticas`;
    const cards = parseAnkiTxtFile(text);
    expect(cards).toHaveLength(1);
    expect(cards[0].type).toBe(CardMode.Dictionary);
    expect(cards[0].term).toBe('Mitose');
    expect(cards[0].definition).toContain('divisão celular');
  });

  it('deve validar conteúdo do arquivo TXT do Anki', () => {
    expect(validateAnkiTxtContent('').valid).toBe(false);
    expect(validateAnkiTxtContent('Texto sem tags conhecidas').valid).toBe(false);
    expect(validateAnkiTxtContent('Pergunta: Teste\nResposta: OK').valid).toBe(true);
  });
});
