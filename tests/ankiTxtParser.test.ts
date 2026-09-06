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

  it('deve processar card de Questão de Múltipla Escolha', () => {
    const text = `Questão: Quanto é 2 + 2?\nOpções:\nA) 3\nB) 4\nC) 5\nResposta: B\nExplicação: Soma básica.`;
    const cards = parseAnkiTxtFile(text);
    expect(cards).toHaveLength(1);
    expect(cards[0].type).toBe(CardMode.MultipleChoice);
    expect(cards[0].options?.filter(Boolean)).toHaveLength(3);
    expect(cards[0].correctAnswerIndex).toBe(1);
    expect(cards[0].explanation).toContain('Soma básica');
  });

  it('deve processar card de Situação-Problema (Exemplo Prático)', () => {
    const text = `Situação-Problema: Um carro viaja a 60 km/h por 2 horas.\nProblema: Qual a distância percorrida?\nResposta: 120 km\nExplicação: d = v * t`;
    const cards = parseAnkiTxtFile(text);
    expect(cards).toHaveLength(1);
    expect(cards[0].type).toBe(CardMode.PracticalExample);
    expect(cards[0].problem).toContain('viaja a 60 km/h');
    expect(cards[0].solution).toBe('120 km');
  });

  it('deve converter expressões LaTeX $..$ e $$..$$ em spans com data-latex', () => {
    const text = `Pergunta: O que é a equação $$E = mc^2$$?\nResposta: Energia em repouso com $c$ sendo a velocidade da luz.`;
    const cards = parseAnkiTxtFile(text);
    expect(cards).toHaveLength(1);
    expect(cards[0].front).toContain('data-type="block-math"');
    expect(cards[0].front).toContain('data-latex="E = mc^2"');
    expect(cards[0].back).toContain('data-latex="c"');
  });

  it('deve validar conteúdo do arquivo TXT do Anki', () => {
    expect(validateAnkiTxtContent('').valid).toBe(false);
    expect(validateAnkiTxtContent('Texto sem tags conhecidas').valid).toBe(false);
    expect(validateAnkiTxtContent('Pergunta: Teste\nResposta: OK').valid).toBe(true);
  });
});
