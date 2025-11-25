import { parseAnkiTxtFile, validateAnkiTxtContent } from './ankiTxtParser';
import { CardMode } from '../types';

/**
 * Test file for Anki TXT Parser
 * This demonstrates the parser working with the sample data provided
 */

const sampleAnkiTxt = `Pergunta:    O que é uma transação sem contraprestação segundo o MCASP?      Resposta:    É a situação em que a entidade recebe ativos...    Explicação:    A essência é a ausência...

Certo ou Errado:    No setor público, a maioria das variações...      Resposta:    Errado.    Explicação:    No setor público...

Questão:                                O que caracteriza uma transação sem contraprestação?                                                                             Quando a entidade paga valor justo                                                                             Quando a entidade recebe ativos...                                                                             Resposta:                            B) Quando a entidade recebe ativos...                              Explicação:                            A essência está na ausência...

 Dicionário:    Transação sem contraprestação      Significado:    Operação em que a entidade recebe ativos...

Situação-Problema:    O Estado X arrecadou ICMS...                                                    Questão:    Como o ente arrecadador deve reconhecer?      Explicação:    O Estado reconhece receita bruta...

Hipótese:   A empresa Alpha Ltda apresenta um ativo total de R$ 25.000 e um passivo exigível de R$ 10.000.   Questão:   Qual é a situação líquida dessa empresa e o que isso representa?	Resposta:   Situação líquida: R$ 15.000 (positiva).   Explicação:   Calculada por Ativo − Passivo = 25.000 − 10.000 = 15.000. Indica estrutura financeira saudável, com capital próprio suficiente para cobrir obrigações e gerar valor aos sócios.`;

// Run test
console.log('🧪 Testing Anki TXT Parser...\n');

// Validate
const validation = validateAnkiTxtContent(sampleAnkiTxt);
console.log('✅ Validation:', validation);

// Parse
const cards = parseAnkiTxtFile(sampleAnkiTxt);
console.log(`\n📊 Parsed ${cards.length} cards:\n`);

cards.forEach((card, index) => {
    console.log(`Card #${index + 1}:`);
    console.log(`  Type: ${card.type}`);
    console.log(`  Front: ${card.front.substring(0, 50)}...`);
    console.log(`  Back: ${card.back.substring(0, 50)}...`);
    console.log(`  Has Explanation: ${!!card.explanation}`);
    console.log('');
});

// Type breakdown
const typeBreakdown = cards.reduce((acc, card) => {
    acc[card.type] = (acc[card.type] || 0) + 1;
    return acc;
}, {} as Record<string, number>);

console.log('📈 Type Breakdown:');
Object.entries(typeBreakdown).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
});

// Expected results
const expectedTypes = {
    [CardMode.QA]: 2, // Pergunta + Dicionário
    [CardMode.TrueFalse]: 1, // Certo ou Errado
    [CardMode.MultipleChoice]: 1, // Questão
    [CardMode.PracticalExample]: 2, // Situação-Problema + Hipótese
};

console.log('\n✅ Expected vs Actual:');
Object.entries(expectedTypes).forEach(([type, expected]) => {
    const actual = typeBreakdown[type] || 0;
    const status = actual === expected ? '✅' : '❌';
    console.log(`  ${status} ${type}: Expected ${expected}, Got ${actual}`);
});
