import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StudyCardViewer } from '../components/study/StudyCardViewer';
import { CardMode } from '../types';
import type { FlashcardData } from '../types';

describe('StudyCardViewer - Testes de Componente React', () => {
  const mockCardQA: FlashcardData = {
    id: 'card-1',
    deckId: 'deck-1',
    mode: CardMode.QA,
    question: 'O que é mitocôndria?',
    answer: 'Organela responsável pela respiração celular.',
    interval: 1,
    repetition: 1,
    easeFactor: 2.5,
  };

  const mockCardMultipleChoice: FlashcardData = {
    id: 'card-2',
    deckId: 'deck-1',
    mode: CardMode.MultipleChoice,
    question: 'Qual o valor de Pi arredondado?',
    options: ['3.14', '2.71', '1.41', '1.61'],
    correctAnswerIndex: 0,
    interval: 1,
    repetition: 1,
    easeFactor: 2.5,
  };

  const defaultProps = {
    card: mockCardQA,
    showResult: false,
    result: null as 'correct' | 'incorrect' | null,
    userAnswer: '',
    setUserAnswer: vi.fn(),
    selectedOption: null as number | null,
    setSelectedOption: vi.fn(),
    evaluateAnswer: vi.fn(),
    handleSelfEvaluation: vi.fn(),
    handleNext: vi.fn(),
    isDeleting: false,
    isMarkingForEdit: false,
    toggleMarkForEdit: vi.fn(),
    handleDeleteCurrentCard: vi.fn(),
    isLastCard: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Revelação de Resposta e Fluxo de Exibição', () => {
    it('deve exibir a pergunta e botão de verificar antes de revelar a resposta', () => {
      render(
        <StudyCardViewer
          {...defaultProps}
          showResult={false}
          userAnswer="Minha resposta de teste"
        />
      );

      expect(screen.getByText('O que é mitocôndria?')).toBeDefined();
      expect(screen.getByPlaceholderText('Digite sua resposta...')).toBeDefined();

      const verifyBtn = screen.getByText('Verificar Resposta');
      expect(verifyBtn).toBeDefined();

      fireEvent.click(verifyBtn);
      expect(defaultProps.evaluateAnswer).toHaveBeenCalledTimes(1);
    });

    it('deve exibir resposta correta e opções de autoavaliação (SM-2) quando showResult for true', () => {
      render(
        <StudyCardViewer
          {...defaultProps}
          showResult={true}
          userAnswer="Minha resposta digitada"
        />
      );

      expect(screen.getByText(/Resposta Correta/i)).toBeDefined();
      expect(screen.getByText('Organela responsável pela respiração celular.')).toBeDefined();
      expect(screen.getByText('Minha resposta digitada')).toBeDefined();

      // Botões de notas SM-2
      expect(screen.getByText('Acertei')).toBeDefined();
      expect(screen.getByText('Quase')).toBeDefined();
      expect(screen.getByText('Errei')).toBeDefined();
    });

    it('deve exibir botão de próximo flashcard para cards avaliados automaticamente', () => {
      render(
        <StudyCardViewer
          {...defaultProps}
          card={mockCardMultipleChoice}
          showResult={true}
          result="correct"
          selectedOption={0}
        />
      );

      expect(screen.getByText(/Correto!/i)).toBeDefined();
      const nextBtn = screen.getByText(/Próximo Flashcard/i);
      expect(nextBtn).toBeDefined();

      fireEvent.click(nextBtn);
      expect(defaultProps.handleNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. Seleção de Nota SM-2 por Clique', () => {
    it('deve chamar handleSelfEvaluation("correct") ao clicar em "Acertei"', () => {
      render(<StudyCardViewer {...defaultProps} showResult={true} />);

      const correctBtn = screen.getByText('Acertei');
      fireEvent.click(correctBtn);

      expect(defaultProps.handleSelfEvaluation).toHaveBeenCalledWith('correct');
    });

    it('deve chamar handleSelfEvaluation("almost") ao clicar em "Quase"', () => {
      render(<StudyCardViewer {...defaultProps} showResult={true} />);

      const almostBtn = screen.getByText('Quase');
      fireEvent.click(almostBtn);

      expect(defaultProps.handleSelfEvaluation).toHaveBeenCalledWith('almost');
    });

    it('deve chamar handleSelfEvaluation("incorrect") ao clicar em "Errei"', () => {
      render(<StudyCardViewer {...defaultProps} showResult={true} />);

      const incorrectBtn = screen.getByText('Errei');
      fireEvent.click(incorrectBtn);

      expect(defaultProps.handleSelfEvaluation).toHaveBeenCalledWith('incorrect');
    });
  });

  describe('3. Atalhos de Teclado (Espaço, 1, 2, 3, 4, 5)', () => {
    it('deve acionar evaluateAnswer ao pressionar tecla Espaço com resposta oculta', () => {
      render(
        <StudyCardViewer
          {...defaultProps}
          showResult={false}
          userAnswer="Texto digitado"
        />
      );

      fireEvent.keyDown(window, { code: 'Space', key: ' ' });

      expect(defaultProps.evaluateAnswer).toHaveBeenCalledTimes(1);
    });

    it('deve acionar nota SM-2 "Errei" ao pressionar tecla 1 na tela de resultado', () => {
      render(<StudyCardViewer {...defaultProps} showResult={true} />);

      fireEvent.keyDown(window, { code: 'Digit1', key: '1' });

      expect(defaultProps.handleSelfEvaluation).toHaveBeenCalledWith('incorrect');
    });

    it('deve acionar nota SM-2 "Quase" ao pressionar tecla 2 ou 3 na tela de resultado', () => {
      render(<StudyCardViewer {...defaultProps} showResult={true} />);

      fireEvent.keyDown(window, { code: 'Digit2', key: '2' });
      expect(defaultProps.handleSelfEvaluation).toHaveBeenCalledWith('almost');

      fireEvent.keyDown(window, { code: 'Digit3', key: '3' });
      expect(defaultProps.handleSelfEvaluation).toHaveBeenCalledWith('almost');
    });

    it('deve acionar nota SM-2 "Acertei" ao pressionar tecla 4 ou 5 na tela de resultado', () => {
      render(<StudyCardViewer {...defaultProps} showResult={true} />);

      fireEvent.keyDown(window, { code: 'Digit4', key: '4' });
      expect(defaultProps.handleSelfEvaluation).toHaveBeenCalledWith('correct');

      fireEvent.keyDown(window, { code: 'Digit5', key: '5' });
      expect(defaultProps.handleSelfEvaluation).toHaveBeenCalledWith('correct');
    });

    it('deve selecionar opções de múltipla escolha via teclas 1 a 4 antes do resultado', () => {
      render(
        <StudyCardViewer
          {...defaultProps}
          card={mockCardMultipleChoice}
          showResult={false}
        />
      );

      // Pressiona '1' para selecionar a opção 0 (A)
      fireEvent.keyDown(window, { code: 'Digit1', key: '1' });
      expect(defaultProps.setSelectedOption).toHaveBeenCalledWith(0);

      // Pressiona '2' para selecionar a opção 1 (B)
      fireEvent.keyDown(window, { code: 'Digit2', key: '2' });
      expect(defaultProps.setSelectedOption).toHaveBeenCalledWith(1);
    });

    it('deve avançar para o próximo card via tecla Espaço em cards autoavaliados', () => {
      render(
        <StudyCardViewer
          {...defaultProps}
          card={mockCardMultipleChoice}
          showResult={true}
          result="correct"
        />
      );

      fireEvent.keyDown(window, { code: 'Space', key: ' ' });

      expect(defaultProps.handleNext).toHaveBeenCalledTimes(1);
    });
  });
});
