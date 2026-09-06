import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MathContent, MathErrorBoundary } from '../components/MathContent';
import { renderMathInElement } from '../utils/mathRender';

// Componente auxiliar que lança erro para testar MathErrorBoundary
const CrashingComponent = () => {
  throw new Error('Falha simulada de renderização matemática');
};

describe('MathContent & MathErrorBoundary - Blindagem contra Falhas no KaTeX', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Renderização Segura de Conteúdo Normal', () => {
    it('deve renderizar texto puro sem erros', () => {
      render(<MathContent content="Qual é o teorema de Pitágoras?" />);

      expect(screen.getByText('Qual é o teorema de Pitágoras?')).toBeDefined();
    });

    it('deve renderizar container com a tag especificada (ex: p, div, span)', () => {
      const { container } = render(
        <MathContent content="Fórmula da gravidade" tag="p" className="custom-math-class" />
      );

      const pElement = container.querySelector('p.custom-math-class');
      expect(pElement).not.toBeNull();
      expect(pElement?.textContent).toContain('Fórmula da gravidade');
    });
  });

  describe('2. MathErrorBoundary - Captura de Exceções e Fallback', () => {
    it('deve capturar erro em componente filho e renderizar fallback seguro sem travar', () => {
      // Suprime temporariamente console.error do teste para manter output limpo
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <MathErrorBoundary fallbackContent="x^2 + y^2 = z^2">
          <CrashingComponent />
        </MathErrorBoundary>
      );

      const fallback = screen.getByTestId('math-error-fallback');
      expect(fallback).toBeDefined();
      expect(fallback.textContent).toContain('x^2 + y^2 = z^2');

      consoleSpy.mockRestore();
    });

    it('deve mostrar fallback genérico quando fallbackContent for nulo ou vazio', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <MathErrorBoundary>
          <CrashingComponent />
        </MathErrorBoundary>
      );

      const fallback = screen.getByTestId('math-error-fallback');
      expect(fallback.textContent).toContain('(fórmula indisponível)');

      consoleSpy.mockRestore();
    });
  });

  describe('3. Resiliência do renderMathInElement do KaTeX', () => {
    it('não deve lançar exceção mesmo com expressões LaTeX inválidas ou malformadas', () => {
      const container = document.createElement('div');
      container.innerHTML = `<span data-latex="\\invalidCommand{abc"></span>`;

      // Execução não deve estourar erro
      expect(() => {
        renderMathInElement(container);
      }).not.toThrow();

      // Deve manter conteúdo ou fallback seguro
      expect(container.innerHTML).toBeDefined();
    });

    it('não deve quebrar quando o container for nulo ou vazio', () => {
      expect(() => {
        renderMathInElement(null as any);
      }).not.toThrow();
    });
  });
});
