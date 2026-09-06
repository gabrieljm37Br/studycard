import { describe, it, expect } from 'vitest';
import { sanitizeHTML, ensureMathDataType, renderHTML } from '../utils/textUtils';

describe('textUtils', () => {
  describe('sanitizeHTML', () => {
    it('deve remover tags perigosas como <script> e <iframe>', () => {
      const malicious = '<p>Texto seguro</p><script>alert("hack")</script><iframe src="x"></iframe>';
      const clean = sanitizeHTML(malicious);
      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('<iframe>');
      expect(clean).toContain('Texto seguro');
    });

    it('deve remover manipuladores de evento on* (onclick, onload, etc.)', () => {
      const malicious = '<b onclick="doSomething()" onmouseover="alert(1)">Clique aqui</b>';
      const clean = sanitizeHTML(malicious);
      expect(clean).not.toContain('onclick');
      expect(clean).not.toContain('onmouseover');
      expect(clean).toContain('Clique aqui');
    });

    it('deve preservar tags e atributos permitidos como <b>, <i>, <code>, <span>', () => {
      const safe = '<p>Este é um <b>texto em negrito</b> e <i>itálico</i> com <code>código</code>.</p>';
      const clean = sanitizeHTML(safe);
      expect(clean).toContain('<b>texto em negrito</b>');
      expect(clean).toContain('<i>itálico</i>');
      expect(clean).toContain('<code>código</code>');
    });

    it('deve forçar target="_blank" e rel="noopener noreferrer" em links <a>', () => {
      const htmlWithLink = '<a href="https://google.com">Link</a>';
      const clean = sanitizeHTML(htmlWithLink);
      expect(clean).toContain('target="_blank"');
      expect(clean).toContain('rel="noopener noreferrer"');
    });
  });

  describe('ensureMathDataType', () => {
    it('deve adicionar data-type="inline-math" em spans com data-latex sem data-type', () => {
      const input = '<span data-latex="x^2"></span>';
      const output = ensureMathDataType(input);
      expect(output).toContain('data-type="inline-math"');
      expect(output).toContain('data-latex="x^2"');
    });

    it('deve preservar data-type="block-math" se já existir', () => {
      const input = '<span data-latex="\\frac{1}{2}" data-type="block-math"></span>';
      const output = ensureMathDataType(input);
      expect(output).toContain('data-type="block-math"');
    });
  });

  describe('renderHTML', () => {
    it('deve converter delimitadores LaTeX $...$ e $$...$$ para spans com data-latex', () => {
      const input = 'Equação $x + y = z$ e bloco $${E = mc^2}$$';
      const rendered = renderHTML(input);
      expect(rendered.__html).toContain('data-latex="x + y = z"');
      expect(rendered.__html).toContain('data-latex="{E = mc^2}"');
    });

    it('deve tratar strings vazias ou nulas graciosamente', () => {
      expect(renderHTML('').__html).toBe('');
      expect(renderHTML(null).__html).toBe('');
      expect(renderHTML(undefined).__html).toBe('');
    });
  });
});
