import { describe, it, expect } from 'vitest';
import { parseNotebookLMCSV, detectCardType, validateCSVContent } from '../services/csvParser';
import { CardMode } from '../types';

describe('csvParser', () => {
  it('deve detectar tipo FillInTheBlank quando o front contém underscores', () => {
    expect(detectCardType('A capital do Brasil é _____')).toBe(CardMode.FillInTheBlank);
    expect(detectCardType('Qual é a capital do Brasil?')).toBe(CardMode.QA);
  });

  it('deve fazer parsing correto de CSV simples com 2 colunas via parseNotebookLMCSV', () => {
    const csvContent = `O que é HTML?,Linguagem de marcação\nO que é CSS?,Folhas de estilo`;
    const cards = parseNotebookLMCSV(csvContent);
    expect(cards).toHaveLength(2);
    expect(cards[0].front).toBe('O que é HTML?');
    expect(cards[0].back).toBe('Linguagem de marcação');
    expect(cards[0].type).toBe(CardMode.QA);
  });

  it('deve respeitar campos com aspas e vírgulas internas', () => {
    const csvContent = `"Pergunta, com vírgula","Resposta, também com vírgula"`;
    const cards = parseNotebookLMCSV(csvContent);
    expect(cards).toHaveLength(1);
    expect(cards[0].front).toBe('Pergunta, com vírgula');
    expect(cards[0].back).toBe('Resposta, também com vírgula');
  });

  it('deve extrair tags da 3ª coluna quando presente', () => {
    const csvContent = `Pergunta,Resposta,"tag1, tag2"`;
    const cards = parseNotebookLMCSV(csvContent);
    expect(cards[0].tags).toEqual(['tag1', 'tag2']);
  });

  it('deve validar conteúdo de CSV', () => {
    expect(validateCSVContent('').valid).toBe(false);
    expect(validateCSVContent('Pergunta,Resposta').valid).toBe(true);
  });
});
