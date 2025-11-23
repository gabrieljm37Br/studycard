import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AppView, AppState, CardMode, FeedbackStatus, Deck } from './types';
import type { FlashcardData } from './types';
import { generateFlashcards } from './services/geminiService';
import Flashcard from './components/Flashcard';
import SourceTextModal from './components/SourceTextModal';
import MoveFlashcardModal from './components/MoveFlashcardModal';
import MoveMultipleFlashcardsModal from './components/MoveMultipleFlashcardsModal';
import HelpModal from './components/HelpModal';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

type FontSize = 'small' | 'medium' | 'large';
type Theme = 'light' | 'dark';
type StudySize = 'normal' | 'large';

const LOCAL_STORAGE_KEYS = {
  DECKS: 'flashcard_ai_decks',
  FLASHCARDS: 'flashcard_ai_flashcards',
  THEME: 'flashcard_ai_theme',
  FONT_SIZE: 'flashcard_ai_font_size',
  STUDY_VIEW_SIZE: 'flashcard_ai_study_size',
};

const fontScales: Record<FontSize, number> = {
  small: 0.9,
  medium: 1.0,
  large: 1.15,
};

// --- SUB-COMPONENTS (for clarity in the main App) ---

const ErrorView: React.FC<{ error: string, onReset: () => void }> = ({ error, onReset }) => (
  <div className="w-full max-w-xl text-center p-8 bg-red-100 dark:bg-red-900/50 rounded-lg border border-red-300 dark:border-red-700">
    <h2 className="text-3xl font-bold text-red-800 dark:text-red-300">Ocorreu um Erro</h2>
    <p className="mt-4 text-red-700 dark:text-red-200">{error}</p>
    <button
      onClick={onReset}
      className="mt-6 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
    >
      Tentar Novamente
    </button>
  </div>
);

const GeneratorView: React.FC<{
  onGenerate: (text: string, mode: CardMode, destinationDeckId: string | 'new') => void,
  isGenerating: boolean,
  onError: (message: string) => void,
  decks: Deck[],
  initialTargetDeckId: string | null,
  onBack: () => void
}> = ({ onGenerate, isGenerating, onError, decks, initialTargetDeckId, onBack }) => {
  const [inputType, setInputType] = useState<'text' | 'pdf'>('text');
  const [text, setText] = useState('');
  const [mode, setMode] = useState<CardMode>(CardMode.QA);
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [destinationDeckId, setDestinationDeckId] = useState<string | 'new'>(initialTargetDeckId || 'new');

  const deckOptions = useMemo(() => {
    const options: { id: string; name: string }[] = [];
    const buildOptions = (parentId: string | null, prefix: string) => {
      const children = decks.filter(d => d.parentId === parentId).sort((a, b) => a.name.localeCompare(b.name));
      for (const deck of children) {
        const label = prefix ? `${prefix} / ${deck.name}` : deck.name;
        options.push({ id: deck.id, name: label });
        buildOptions(deck.id, label);
      }
    };
    buildOptions(null, '');
    return options;
  }, [decks]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const parsePdf = async (fileToParse: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (!event.target?.result) {
          return reject(new Error("Falha ao ler o arquivo."));
        }
        try {
          const pdf = await pdfjsLib.getDocument(event.target.result as ArrayBuffer).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
            fullText += pageText + '\n\n';
          }
          resolve(fullText);
        } catch (error) {
          console.error("Erro ao processar o PDF:", error);
          reject(new Error("Não foi possível processar o arquivo PDF. Verifique se é um PDF válido."));
        }
      };
      reader.onerror = () => reject(new Error("Ocorreu um erro ao ler o arquivo."));
      reader.readAsArrayBuffer(fileToParse);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating || isParsing) return;

    if (inputType === 'text') {
      if (text.trim()) {
        onGenerate(text, mode, destinationDeckId);
      }
    } else if (inputType === 'pdf') {
      if (file) {
        setIsParsing(true);
        try {
          const pdfText = await parsePdf(file);
          if (!pdfText.trim()) {
            throw new Error("Não foi possível extrair texto do PDF ou o PDF está vazio.");
          }
          onGenerate(pdfText, mode, destinationDeckId);
        } catch (err: any) {
          onError(err.message || "Ocorreu um erro ao processar o PDF.");
        } finally {
          setIsParsing(false);
        }
      }
    }
  };

  const buttonDisabled = isGenerating || isParsing || (inputType === 'text' && !text.trim()) || (inputType === 'pdf' && !file);
  const buttonText = isGenerating ? 'Gerando...' : isParsing ? 'Lendo PDF...' : 'Gerar Flashcards';

  const ModeButton: React.FC<{
    currentMode: CardMode,
    selectedMode: CardMode,
    onClick: (mode: CardMode) => void,
    children: React.ReactNode
  }> = ({ currentMode, selectedMode, onClick, children }) => (
    <button
      type="button"
      onClick={() => onClick(currentMode)}
      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${selectedMode === currentMode
        ? 'bg-cyan-600 text-white shadow-md'
        : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
        }`}
    >
      {children}
    </button>
  );

  return (
    <div className="w-full max-w-2xl">
      <div className="relative mb-6 text-left">
        <button onClick={onBack} className="absolute -top-2 left-0 flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          Voltar
        </button>
      </div>
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-100">Gerador de Flashcards com IA</h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          Cole um texto ou carregue um PDF para criar um novo conjunto de estudo.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="mt-8">
        <div role="tablist" aria-label="Tipo de entrada" className="bg-slate-200 dark:bg-slate-800 p-1 rounded-lg flex max-w-sm mx-auto mb-6 shadow-inner">
          <button type="button" role="tab" aria-selected={inputType === 'text'} onClick={() => setInputType('text')} className={`w-1/2 p-2 rounded-md font-semibold transition-all duration-300 ${inputType === 'text' ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow' : 'text-slate-600 dark:text-slate-300'}`}>
            Colar Texto
          </button>
          <button type="button" role="tab" aria-selected={inputType === 'pdf'} onClick={() => setInputType('pdf')} className={`w-1/2 p-2 rounded-md font-semibold transition-all duration-300 ${inputType === 'pdf' ? 'bg-white dark:bg-slate-700 text-cyan-600 shadow' : 'text-slate-600 dark:text-slate-300'}`}>
            Carregar PDF
          </button>
        </div>

        <div role="tabpanel" hidden={inputType !== 'text'}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Cole seu texto aqui..." className="w-full h-64 p-4 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 rounded-lg shadow-inner focus:ring-4 focus:ring-cyan-500 focus:outline-none transition border border-slate-200 dark:border-slate-700" disabled={isGenerating} aria-label="Texto para gerar flashcards" />
        </div>

        <div role="tabpanel" hidden={inputType !== 'pdf'}>
          <div className="w-full h-64 p-4 rounded-lg bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col justify-center items-center text-center transition-colors">
            <input type="file" id="pdf-upload" accept=".pdf" onChange={handleFileChange} className="hidden" disabled={isGenerating || isParsing} />
            {file ? (
              <div className="text-slate-700 dark:text-slate-300 flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <p className="font-semibold mt-2 break-all">{file.name}</p>
                <p className="text-sm text-slate-500">{Math.round(file.size / 1024)} KB</p>
                <button type="button" onClick={() => setFile(null)} className="mt-4 px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 transition" disabled={isGenerating || isParsing}>
                  Remover
                </button>
              </div>
            ) : (
              <label htmlFor="pdf-upload" className="cursor-pointer text-slate-600 dark:text-slate-400 p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="font-semibold mt-2">Arraste e solte um arquivo PDF</p>
                <p className="text-sm">ou <span className="text-cyan-500 font-bold">clique para selecionar</span></p>
              </label>
            )}
          </div>
        </div>

        <div className="my-8 flex justify-center items-center gap-2 md:gap-4 flex-wrap" role="radiogroup" aria-labelledby="card-mode-label">
          <p id="card-mode-label" className="sr-only">Escolha o modo do flashcard</p>
          <ModeButton currentMode={CardMode.QA} selectedMode={mode} onClick={setMode}>Pergunta e Resposta</ModeButton>
          <ModeButton currentMode={CardMode.TrueFalse} selectedMode={mode} onClick={setMode}>Verdadeiro ou Falso</ModeButton>
          <ModeButton currentMode={CardMode.MultipleChoice} selectedMode={mode} onClick={setMode}>Múltipla Escolha</ModeButton>
          <ModeButton currentMode={CardMode.PracticalExample} selectedMode={mode} onClick={setMode}>Exemplo Prático</ModeButton>
        </div>

        <div className="mt-4 max-w-sm mx-auto text-left">
          <label htmlFor="deck-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Salvar em:
          </label>
          <select
            id="deck-select"
            value={destinationDeckId}
            onChange={e => setDestinationDeckId(e.target.value)}
            className="w-full p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
          >
            <option value="new">-- Criar novo deck na raiz --</option>
            {deckOptions.map(deck => (
              <option key={deck.id} value={deck.id}>{deck.name}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className={`mt-8 w-full md:w-auto mx-auto px-8 py-4 bg-cyan-600 text-white font-bold rounded-lg shadow-lg hover:bg-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-500 focus:ring-opacity-50 transition-transform transform hover:scale-105 disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed flex items-center justify-center ${isGenerating || isParsing ? 'animate-pulse' : ''}`}
          disabled={buttonDisabled}
        >
          {(isGenerating || isParsing) && (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {buttonText}
        </button>
      </form>
    </div>
  );
};

const StudyView: React.FC<{
  cards: FlashcardData[],
  onExit: () => void,
  onUpdateFeedback: (cardId: string, status: FeedbackStatus) => void,
  size: StudySize,
  onSizeChange: (size: StudySize) => void
}> = ({ cards, onExit, onUpdateFeedback, size, onSizeChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [practicalExamplePhase, setPracticalExamplePhase] = useState(0);
  const currentCard = cards[currentIndex];

  useEffect(() => {
    setIsFlipped(false);
    setPracticalExamplePhase(0);
  }, [currentIndex]);

  const handleFeedback = (status: FeedbackStatus) => {
    onUpdateFeedback(currentCard.id, status);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onExit(); // Exit study session after the last card
    }
  };

  const goToNext = () => {
    setCurrentIndex(prevIndex => Math.min(prevIndex + 1, cards.length - 1));
  };

  const goToPrevious = () => {
    setCurrentIndex(prevIndex => Math.max(prevIndex - 1, 0));
  };

  const renderActionButtons = () => {
    if (currentCard.mode === CardMode.PracticalExample) {
      if (practicalExamplePhase === 2) { // Solution phase
        return (
          <>
            <button onClick={() => handleFeedback(FeedbackStatus.Incorrect)} className="px-6 py-3 flex-1 bg-red-500 text-white font-bold rounded-lg shadow-lg hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-300 transition-transform transform hover:scale-105 active:scale-95">Errei</button>
            <button onClick={() => handleFeedback(FeedbackStatus.Correct)} className="px-6 py-3 flex-1 bg-green-500 text-white font-bold rounded-lg shadow-lg hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 transition-transform transform hover:scale-105 active:scale-95">Acertei</button>
          </>
        );
      }
      // Problem or Question phase - show nothing, but reserve space
      return <div className="h-[54px] w-full" />;
    }

    // Default logic for other card types
    if (isFlipped) {
      return (
        <>
          <button onClick={() => handleFeedback(FeedbackStatus.Incorrect)} className="px-6 py-3 flex-1 bg-red-500 text-white font-bold rounded-lg shadow-lg hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-300 transition-transform transform hover:scale-105 active:scale-95">Errei</button>
          <button onClick={() => handleFeedback(FeedbackStatus.Correct)} className="px-6 py-3 flex-1 bg-green-500 text-white font-bold rounded-lg shadow-lg hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 transition-transform transform hover:scale-105 active:scale-95">Acertei</button>
        </>
      );
    } else {
      return (
        <div className="flex w-full justify-between">
          <button onClick={goToPrevious} disabled={currentIndex === 0} className="px-8 py-3 bg-slate-500 text-white font-bold rounded-lg shadow-lg hover:bg-slate-600 transition dark:bg-slate-600 dark:hover:bg-slate-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed">Anterior</button>
          <button onClick={goToNext} disabled={currentIndex === cards.length - 1} className="px-8 py-3 bg-cyan-600 text-white font-bold rounded-lg shadow-lg hover:bg-cyan-500 transition disabled:bg-slate-400 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed">Próximo</button>
        </div>
      );
    }
  };

  return (
    <div className={`w-full mx-auto px-4 flex flex-col items-center transition-all duration-300 ${size === 'normal' ? 'max-w-2xl' : 'max-w-4xl'}`}>
      <div className="w-full flex justify-between items-center mb-6">
        <button
          onClick={onExit}
          className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 transition dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          &larr; Voltar ao Deck
        </button>
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
          {currentIndex + 1} / {cards.length}
        </p>
        <button
          onClick={() => onSizeChange(size === 'normal' ? 'large' : 'normal')}
          className="p-2 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-colors"
          aria-label={size === 'normal' ? "Aumentar tamanho" : "Diminuir tamanho"}
        >
          {size === 'normal' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm2-1a1 1 0 00-1 1v2a1 1 0 002 0V6h2a1 1 0 000-2H6zm8 0a1 1 0 00-1 1v2a1 1 0 102 0V6h-1zm-1 8a1 1 0 001-1v-2a1 1 0 10-2 0v2h-2a1 1 0 100 2h3zM6 14a1 1 0 001-1v-2a1 1 0 10-2 0v2a1 1 0 001 1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 2a1 1 0 00-1 1v2a1 1 0 002 0V3h2a1 1 0 100-2H5zm10 0a1 1 0 00-1 1v2a1 1 0 102 0V3h-1zM5 15a1 1 0 00-1 1v2a1 1 0 102 0v-2H5zm10 0a1 1 0 00-1 1v2a1 1 0 102 0v-2h-1z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      <div className={`w-full mb-6 transition-all duration-300 ${size === 'normal' ? 'max-w-lg' : 'max-w-2xl'}`}>
        <Flashcard
          key={currentCard.id}
          card={currentCard}
          onFlipStateChange={setIsFlipped}
          onPhaseChange={setPracticalExamplePhase}
        />
      </div>

      <div className={`flex w-full justify-center gap-4 transition-all duration-300 ${size === 'normal' ? 'max-w-lg' : 'max-w-2xl'}`}>
        {renderActionButtons()}
      </div>
    </div>
  );
};

const FontSizeControl: React.FC<{ currentSize: FontSize; onChangeSize: (size: FontSize) => void; }> = ({ currentSize, onChangeSize }) => {
  const sizes: FontSize[] = ['small', 'medium', 'large'];
  const currentIdx = sizes.indexOf(currentSize);
  const decreaseSize = () => { if (currentIdx > 0) onChangeSize(sizes[currentIdx - 1]); };
  const increaseSize = () => { if (currentIdx < sizes.length - 1) onChangeSize(sizes[currentIdx + 1]); };
  return (
    <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-full">
      <button onClick={decreaseSize} disabled={currentIdx === 0} className="p-2 text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-full dark:text-slate-400 dark:hover:bg-slate-700" aria-label="Diminuir tamanho da fonte">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
      </button>
      <span className="px-3 text-sm font-medium text-slate-700 border-x border-slate-300 select-none dark:text-slate-200 dark:border-slate-600">A</span>
      <button onClick={increaseSize} disabled={currentIdx === sizes.length - 1} className="p-2 text-slate-500 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-r-full dark:text-slate-400 dark:hover:bg-slate-700" aria-label="Aumentar tamanho da fonte">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
      </button>
    </div>
  );
};

const ThemeControl: React.FC<{ currentTheme: Theme; onChangeTheme: (theme: Theme) => void; }> = ({ currentTheme, onChangeTheme }) => {
  const toggleTheme = () => { onChangeTheme(currentTheme === 'dark' ? 'light' : 'dark'); };
  return (
    <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors" aria-label={`Mudar para modo ${currentTheme === 'dark' ? 'claro' : 'escuro'}`}>
      {currentTheme === 'dark' ? (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 14.95l.707-.707a1 1 0 10-1.414-1.414l-.707.707a1 1 0 001.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" /></svg>)
        : (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>)}
    </button>
  );
};

const HelpButton: React.FC<{ onClick: () => void; }> = ({ onClick }) => (
  <button onClick={onClick} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors" aria-label="Abrir ajuda">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  </button>
);


// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  const [appView, setAppView] = useState<AppView>(AppView.Decks);
  const [appState, setAppState] = useState<AppState>(AppState.Idle);
  const [error, setError] = useState<string | null>(null);

  const [decks, setDecks] = useState<Deck[]>([]);
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);

  const [deckPath, setDeckPath] = useState<string[]>([]);
  const [targetDeckId, setTargetDeckId] = useState<string | null>(null);

  const [cardToMove, setCardToMove] = useState<FlashcardData | null>(null);
  const [isSourceTextVisible, setIsSourceTextVisible] = useState<boolean>(false);
  const [sourceText, setSourceText] = useState<string>('');

  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [theme, setTheme] = useState<Theme>('dark');
  const [studySize, setStudySize] = useState<StudySize>('normal');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
  const [deckToRename, setDeckToRename] = useState<Deck | null>(null);
  const [deckToMove, setDeckToMove] = useState<Deck | null>(null);
  const [openMenuDeckId, setOpenMenuDeckId] = useState<string | null>(null);

  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [showDeleteMultipleConfirm, setShowDeleteMultipleConfirm] = useState(false);
  const [showMoveMultipleConfirm, setShowMoveMultipleConfirm] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashcardData | null>(null);

  // --- Data Persistence ---
  useEffect(() => {
    try {
      const savedDecks = localStorage.getItem(LOCAL_STORAGE_KEYS.DECKS);
      const savedCards = localStorage.getItem(LOCAL_STORAGE_KEYS.FLASHCARDS);
      if (savedDecks) setDecks(JSON.parse(savedDecks));
      if (savedCards) setFlashcards(JSON.parse(savedCards));
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
    }
  }, []);

  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEYS.DECKS, JSON.stringify(decks)); }, [decks]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEYS.FLASHCARDS, JSON.stringify(flashcards)); }, [flashcards]);

  // --- UI Preferences ---
  useEffect(() => {
    const savedTheme = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME) as Theme | null;
    const savedFontSize = localStorage.getItem(LOCAL_STORAGE_KEYS.FONT_SIZE) as FontSize | null;
    const savedStudySize = localStorage.getItem(LOCAL_STORAGE_KEYS.STUDY_VIEW_SIZE) as StudySize | null;
    if (savedTheme) setTheme(savedTheme);
    if (savedFontSize) setFontSize(savedFontSize);
    if (savedStudySize) setStudySize(savedStudySize);
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * fontScales[fontSize]}px`;
    localStorage.setItem(LOCAL_STORAGE_KEYS.FONT_SIZE, fontSize);
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.STUDY_VIEW_SIZE, studySize);
  }, [studySize]);

  // --- Derived State & Helpers ---
  const currentDeckId = useMemo(() => deckPath[deckPath.length - 1] ?? null, [deckPath]);
  const currentDeck = useMemo(() => decks.find(d => d.id === currentDeckId) ?? null, [decks, currentDeckId]);
  const pathDecks = useMemo(() => deckPath.map(id => decks.find(d => d.id === id)).filter(Boolean) as Deck[], [deckPath, decks]);

  useEffect(() => {
    setSearchQuery('');
    // Exit selection mode when navigating
    setIsSelectionModeActive(false);
    setSelectedCardIds(new Set());
  }, [currentDeckId]);

  const subDecks = useMemo(() => decks.filter(d => d.parentId === currentDeckId), [decks, currentDeckId]);
  const cardsInDeck = useMemo(() => flashcards.filter(c => c.deckId === currentDeckId), [flashcards, currentDeckId]);

  const filteredSubDecks = useMemo(() => {
    if (!searchQuery.trim()) return subDecks;
    return subDecks.filter(deck =>
      deck.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [subDecks, searchQuery]);

  const filteredCardsInDeck = useMemo(() => {
    if (!searchQuery.trim()) return cardsInDeck;
    const lowercasedQuery = searchQuery.toLowerCase();
    return cardsInDeck.filter(card => {
      switch (card.mode) {
        case CardMode.QA:
          return card.question.toLowerCase().includes(lowercasedQuery) ||
            card.answer.toLowerCase().includes(lowercasedQuery);
        case CardMode.TrueFalse:
          return card.statement.toLowerCase().includes(lowercasedQuery) ||
            card.explanation.toLowerCase().includes(lowercasedQuery);
        case CardMode.MultipleChoice:
          return card.question.toLowerCase().includes(lowercasedQuery) ||
            card.explanation.toLowerCase().includes(lowercasedQuery) ||
            card.options.some(opt => opt.toLowerCase().includes(lowercasedQuery));
        case CardMode.PracticalExample:
          return card.problem.toLowerCase().includes(lowercasedQuery) ||
            card.solution.toLowerCase().includes(lowercasedQuery);
        default:
          return false;
      }
    });
  }, [cardsInDeck, searchQuery]);

  const getRecursiveCardIds = useCallback((deckId: string | null): string[] => {
    const directCardIds = flashcards.filter(c => c.deckId === deckId).map(c => c.id);
    const childDecks = decks.filter(d => d.parentId === deckId);
    const childCardIds = childDecks.flatMap(d => getRecursiveCardIds(d.id));
    return [...directCardIds, ...childCardIds];
  }, [decks, flashcards]);

  const getDeckStats = useCallback((deckId: string) => {
    const cardIds = getRecursiveCardIds(deckId);
    const relevantCards = flashcards.filter(c => cardIds.includes(c.id) && c.feedback !== FeedbackStatus.Unseen);

    const stats = {
      correct: 0,
      incorrect: 0,
      total: relevantCards.length,
    };

    for (const card of relevantCards) {
      if (card.feedback === FeedbackStatus.Correct) stats.correct++;
      else if (card.feedback === FeedbackStatus.Incorrect) stats.incorrect++;
    }

    return stats;
  }, [getRecursiveCardIds, flashcards]);

  const studyCards = useMemo(() => {
    if (appState !== AppState.Studying) return [];
    const cardIdsToStudy = getRecursiveCardIds(currentDeckId);
    return flashcards.filter(c => cardIdsToStudy.includes(c.id));
  }, [appState, currentDeckId, getRecursiveCardIds, flashcards]);

  const availableParentDecks = useMemo(() => {
    if (!deckToMove) return [];

    const getDescendantIds = (parentId: string): string[] => {
      const children = decks.filter(d => d.parentId === parentId);
      const childIds = children.map(d => d.id);
      return [...childIds, ...children.flatMap(child => getDescendantIds(child.id))];
    };

    const forbiddenIds = new Set([deckToMove.id, ...getDescendantIds(deckToMove.id)]);
    const validDecks = decks.filter(d => !forbiddenIds.has(d.id));

    const options: { id: string; name: string }[] = [];
    const buildOptions = (parentId: string | null, prefix: string) => {
      const children = validDecks.filter(d => d.parentId === parentId).sort((a, b) => a.name.localeCompare(b.name));
      for (const deck of children) {
        const label = prefix ? `${prefix} / ${deck.name}` : deck.name;
        options.push({ id: deck.id, name: label });
        buildOptions(deck.id, label);
      }
    };
    buildOptions(null, '');
    return options;
  }, [deckToMove, decks]);

  // --- Handlers ---
  const navigateToDeck = (deckId: string) => setDeckPath(prev => [...prev, deckId]);
  const navigateToPath = (pathIndex: number) => setDeckPath(prev => prev.slice(0, pathIndex + 1));
  const navigateToRoot = () => setDeckPath([]);

  const handleAddDeck = (name: string) => {
    if (!name.trim()) return;
    const newDeck: Deck = { id: crypto.randomUUID(), name: name.trim(), parentId: currentDeckId };
    setDecks(prev => [...prev, newDeck]);
  };

  const handleRequestDelete = (deck: Deck) => {
    setDeckToDelete(deck);
  };

  const handleRequestRename = (deck: Deck) => {
    setDeckToRename(deck);
  };

  const handleRequestMove = (deck: Deck) => {
    setDeckToMove(deck);
  };

  const handleConfirmRename = (newName: string) => {
    if (!deckToRename || !newName.trim()) {
      setDeckToRename(null);
      return;
    };
    setDecks(prev => prev.map(d =>
      d.id === deckToRename.id ? { ...d, name: newName.trim() } : d
    ));
    setDeckToRename(null);
  };

  const handleConfirmMove = (newParentId: string | null) => {
    if (!deckToMove) return;

    if (deckToMove.id === newParentId) {
      setDeckToMove(null);
      return;
    }

    setDecks(prev => prev.map(d =>
      d.id === deckToMove.id ? { ...d, parentId: newParentId } : d
    ));

    setDeckToMove(null);
  };

  const handleConfirmDelete = () => {
    if (!deckToDelete) return;

    const getDescendantIds = (parentId: string): string[] => {
      const children = decks.filter(d => d.parentId === parentId);
      const childIds = children.map(d => d.id);
      return [...childIds, ...children.flatMap(child => getDescendantIds(child.id))];
    };

    const allDeckIdsToDelete = [deckToDelete.id, ...getDescendantIds(deckToDelete.id)];

    setDecks(prev => prev.filter(deck => !allDeckIdsToDelete.includes(deck.id)));
    setFlashcards(prev => prev.filter(card => card.deckId && !allDeckIdsToDelete.includes(card.deckId)));

    if (deckPath.includes(deckToDelete.id)) {
      navigateToPath(deckPath.indexOf(deckToDelete.id) - 1);
    }

    setDeckToDelete(null);
  };

  const handleGenerateRequest = (deckId: string | null) => {
    setTargetDeckId(deckId);
    setAppView(AppView.Generator);
  };

  const handleGenerateAndAddCards = async (text: string, mode: CardMode, destinationDeckId: string | 'new') => {
    setAppState(AppState.Generating);
    setError(null);
    setSourceText(text);

    try {
      const generatedCards = await generateFlashcards(text, mode);
      if (generatedCards.length === 0) {
        throw new Error("Não foram encontrados conceitos para criar flashcards. Tente com um texto diferente ou mais detalhado.");
      }

      let finalDeckId = destinationDeckId;
      let newDeckPath: string[];

      if (finalDeckId === 'new') {
        const newDeckName = `Novo Estudo - ${new Date().toLocaleDateString()}`;
        const newDeck: Deck = { id: crypto.randomUUID(), name: newDeckName, parentId: null };
        setDecks(prev => [...prev, newDeck]);
        finalDeckId = newDeck.id;
        newDeckPath = [finalDeckId];
      } else {
        const getPathForDeck = (deckId: string): string[] => {
          const deck = decks.find(d => d.id === deckId);
          if (!deck) return [];
          if (deck.parentId === null) return [deck.id];
          return [...getPathForDeck(deck.parentId), deck.id];
        };
        newDeckPath = getPathForDeck(finalDeckId);
      }

      const newFlashcards = generatedCards.map(card => ({
        ...card,
        deckId: finalDeckId!,
      }));

      setFlashcards(prev => [...prev, ...newFlashcards]);
      setDeckPath(newDeckPath);
      setAppView(AppView.Decks);
      setAppState(AppState.Idle);

    } catch (err: any) {
      setError(err.message || 'Um erro inesperado ocorreu.');
      setAppState(AppState.Error);
    }
  };

  const handleDeleteCard = useCallback((cardId: string) => {
    setFlashcards(prev => prev.filter(c => c.id !== cardId));
  }, []);

  const handleConfirmCardMove = (newDeckId: string) => {
    if (!cardToMove) return;
    setFlashcards(prev => prev.map(c =>
      c.id === cardToMove.id ? { ...c, deckId: newDeckId } : c
    ));
    setCardToMove(null);
  };

  const handleUpdateFeedback = useCallback((cardId: string, status: FeedbackStatus) => {
    setFlashcards(prev => prev.map(c => (c.id === cardId ? { ...c, feedback: status } : c)));
  }, []);

  const handleErrorReset = () => {
    setError(null);
    setAppState(AppState.Idle);
    setAppView(AppView.Decks);
  };

  const handleToggleCardSelection = (cardId: string) => {
    setSelectedCardIds(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(cardId)) {
        newSelection.delete(cardId);
      } else {
        newSelection.add(cardId);
      }
      // If the last card is deselected, exit selection mode.
      if (isSelectionModeActive && newSelection.size === 0) {
        setIsSelectionModeActive(false);
      }
      return newSelection;
    });
  };

  const handleSelectAllCards = () => {
    setSelectedCardIds(new Set(filteredCardsInDeck.map(c => c.id)));
  };

  const handleExitSelectionMode = () => {
    setSelectedCardIds(new Set());
    setIsSelectionModeActive(false);
  };

  const handleConfirmBulkDelete = () => {
    setFlashcards(prev => prev.filter(c => !selectedCardIds.has(c.id)));
    handleExitSelectionMode();
    setShowDeleteMultipleConfirm(false);
  };

  const handleConfirmBulkMove = (newDeckId: string) => {
    setFlashcards(prev => prev.map(c =>
      selectedCardIds.has(c.id) ? { ...c, deckId: newDeckId } : c
    ));
    handleExitSelectionMode();
    setShowMoveMultipleConfirm(false);
  };

  // --- Render Logic ---
  const renderContent = () => {
    if (appState === AppState.Error) {
      return <ErrorView error={error!} onReset={handleErrorReset} />;
    }

    if (appState === AppState.Studying) {
      return <StudyView cards={studyCards} onExit={() => setAppState(AppState.Idle)} onUpdateFeedback={handleUpdateFeedback} size={studySize} onSizeChange={setStudySize} />;
    }

    if (appView === AppView.Generator) {
      return <GeneratorView onGenerate={handleGenerateAndAddCards} isGenerating={appState === AppState.Generating} onError={(msg) => { setError(msg); setAppState(AppState.Error); }} decks={decks} initialTargetDeckId={targetDeckId} onBack={() => setAppView(AppView.Decks)} />;
    }

    // Default to Decks view
    return (
      <div className="w-full max-w-7xl mx-auto px-4">
        {/* Breadcrumbs */}
        <nav className="mb-6 text-2xl text-slate-500 dark:text-slate-400 flex items-center flex-wrap gap-2">
          <button onClick={navigateToRoot} className="hover:underline flex items-center gap-1.5 transition-colors hover:text-slate-800 dark:hover:text-slate-200" title="Ir para o início">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span>Todos os Decks</span>
          </button>
          {pathDecks.map((deck, i) => (
            <React.Fragment key={deck.id}>
              <span>/</span>
              <button onClick={() => navigateToPath(i)} className="hover:underline">{deck.name}</button>
            </React.Fragment>
          ))}
        </nav>

        {/* Header and Actions */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <span>{currentDeck?.name || "Meus Decks"}</span>
            {currentDeck && !isSelectionModeActive && (
              <button onClick={() => handleRequestRename(currentDeck)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Renomear deck">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2-2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </h2>
          <div className="flex gap-2 sm:gap-4 flex-wrap">
            {!isSelectionModeActive && (
              <>
                <button onClick={() => handleGenerateRequest(currentDeckId)} className="px-4 py-2 text-sm sm:text-base bg-slate-200 text-slate-700 font-semibold rounded-lg shadow hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 transition dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                  Gerar Flashcards
                </button>
                {cardsInDeck.length > 0 && (
                  <button onClick={() => setIsSelectionModeActive(true)} className="px-4 py-2 text-sm sm:text-base bg-slate-200 text-slate-700 font-semibold rounded-lg shadow hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 transition dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                    Selecionar
                  </button>
                )}
                <button onClick={() => setAppState(AppState.Studying)} disabled={getRecursiveCardIds(currentDeckId).length === 0} className="px-4 py-2 text-sm sm:text-base bg-cyan-600 text-white font-semibold rounded-lg shadow hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed">
                  Iniciar Estudo
                </button>
                {currentDeck && (
                  <>
                    <button onClick={() => handleRequestMove(currentDeck)} className="px-4 py-2 text-sm sm:text-base bg-slate-100 text-slate-700 font-semibold rounded-lg shadow hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 transition dark:bg-slate-700/80 dark:text-slate-300 dark:hover:bg-slate-700">
                      Mover Deck
                    </button>
                    <button onClick={() => handleRequestDelete(currentDeck)} className="px-4 py-2 text-sm sm:text-base bg-red-100 text-red-700 font-semibold rounded-lg shadow hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-300 transition dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60">
                      Excluir Deck
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar decks ou flashcards neste local..."
              className="w-full p-3 pl-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Sub-Decks */}
        {(filteredSubDecks.length > 0 || !searchQuery.trim()) && (
          <section className="mb-12">
            <h3 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-300">Sub-Decks</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredSubDecks.map(deck => {
                const stats = getDeckStats(deck.id);
                const totalCardsCount = getRecursiveCardIds(deck.id).length;
                const answeredCardsCount = stats.total;
                const percentageAnswered = totalCardsCount > 0 ? Math.round((answeredCardsCount / totalCardsCount) * 100) : 0;

                let performanceColorClass = '';
                let performanceTitle = '';

                if (stats.total > 0) {
                  const maxStat = Math.max(stats.correct, stats.incorrect);

                  if (maxStat > 0) {
                    if (stats.correct > stats.incorrect) {
                      performanceColorClass = 'bg-green-500';
                    } else if (stats.incorrect > stats.correct) {
                      performanceColorClass = 'bg-red-500';
                    } else {
                      // Tie: equal correct and incorrect
                      performanceColorClass = 'bg-yellow-500';
                    }
                  }

                  performanceTitle = `Desempenho: ${stats.correct} acerto(s), ${stats.incorrect} erro(s).`;
                }

                return (
                  <div key={deck.id} className="relative group">
                    <button onClick={() => navigateToDeck(deck.id)} className="w-full h-full p-4 bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transition-shadow text-left border dark:border-slate-700 flex flex-col justify-between">
                      <div>
                        <span className="text-2xl">📁</span>
                        <p className="mt-2 font-bold text-slate-800 dark:text-slate-100 break-words">{deck.name}</p>
                      </div>
                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center flex-wrap">
                        <span>{totalCardsCount} card{totalCardsCount !== 1 ? 's' : ''}</span>
                        {totalCardsCount > 0 && (
                          <>
                            <span className="mx-1.5 text-slate-300 dark:text-slate-600">•</span>
                            <span>{percentageAnswered}% respondido</span>
                          </>
                        )}
                      </div>
                    </button>
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                      {performanceColorClass && (
                        <span title={performanceTitle} className={`w-4 h-4 rounded-full ${performanceColorClass} shrink-0`}></span>
                      )}
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuDeckId(openMenuDeckId === deck.id ? null : deck.id)}
                          className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"
                          aria-label={`Opções para o deck ${deck.name}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                        </button>
                        {openMenuDeckId === deck.id && (
                          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20"
                            onMouseLeave={() => setOpenMenuDeckId(null)}>
                            <div className="py-1" role="menu" aria-orientation="vertical">
                              <button onClick={() => { handleRequestRename(deck); setOpenMenuDeckId(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600" role="menuitem">Renomear</button>
                              <button onClick={() => { handleRequestMove(deck); setOpenMenuDeckId(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600" role="menuitem">Mover</button>
                              <button onClick={() => { handleRequestDelete(deck); setOpenMenuDeckId(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" role="menuitem">Excluir</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {!searchQuery.trim() && (
                <form onSubmit={(e) => { e.preventDefault(); handleAddDeck(e.currentTarget.deckName.value); e.currentTarget.reset(); }} className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg flex items-center gap-2 border border-dashed dark:border-slate-700">
                  <input name="deckName" type="text" placeholder="Novo deck..." className="w-full bg-transparent focus:outline-none text-slate-800 dark:text-slate-200" />
                  <button type="submit" className="px-3 py-1 bg-cyan-600 text-white text-sm font-bold rounded-md hover:bg-cyan-500">+</button>
                </form>
              )}
            </div>
          </section>
        )}

        {/* Flashcards in current deck */}
        {(filteredCardsInDeck.length > 0 || !searchQuery.trim()) && (
          <section>
            <h3 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-300">Flashcards</h3>
            {filteredCardsInDeck.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCardsInDeck.map(card => (
                  <Flashcard
                    key={card.id}
                    card={card}
                    onDelete={() => handleDeleteCard(card.id)}
                    onMove={() => setCardToMove(card)}
                    isSelectionModeActive={isSelectionModeActive}
                    isSelected={selectedCardIds.has(card.id)}
                    onToggleSelection={handleToggleCardSelection}
                  />
                ))}
              </div>
            ) : (!searchQuery.trim() && <p className="text-slate-500 dark:text-slate-400">Nenhum flashcard neste deck. Gere novos ou mova-os de outros decks.</p>)}
          </section>
        )}

        {searchQuery.trim() && filteredSubDecks.length === 0 && filteredCardsInDeck.length === 0 && (
          <div className="text-center py-16">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-2xl font-semibold text-slate-700 dark:text-slate-300 mt-4">Nenhum resultado encontrado</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Tente uma busca diferente para encontrar seus decks ou flashcards.</p>
          </div>
        )}
      </div>
    );
  };

  const handleRenameSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newName = (e.currentTarget.elements.namedItem('deckName') as HTMLInputElement).value;
    handleConfirmRename(newName);
  };

  const handleMoveSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newParentId = (e.currentTarget.elements.namedItem('deckLocation') as HTMLSelectElement).value;
    handleConfirmMove(newParentId === 'root' ? null : newParentId);
  }; // Added missing semicolon

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 pt-24 pb-32 font-sans text-slate-900 bg-slate-50 dark:text-white dark:bg-slate-900 transition-colors duration-300 overflow-auto">
      <div className="absolute inset-0 -z-0 h-full w-full bg-white dark:bg-slate-900 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-slate-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="font-bold text-xl text-slate-800 dark:text-slate-100">Flashcards AI</span>
            </div>
            {/* Desktop Nav */}
            <div className="hidden md:flex md:items-center md:gap-2">
              <button onClick={() => setAppView(AppView.Decks)} className={`px-4 py-2 rounded-md font-semibold transition-colors ${appView === AppView.Decks ? 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                Gerenciar Decks
              </button>
              <button onClick={() => handleGenerateRequest(null)} className={`px-4 py-2 rounded-md font-semibold transition-colors ${appView === AppView.Generator ? 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                Gerar Flashcards
              </button>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
              <ThemeControl currentTheme={theme} onChangeTheme={setTheme} />
              <FontSizeControl currentSize={fontSize} onChangeSize={setFontSize} />
              <HelpButton onClick={() => setIsHelpVisible(true)} />
            </div>
            {/* Mobile Nav */}
            <div className="md:hidden flex items-center">
              <HelpButton onClick={() => setIsHelpVisible(true)} />
              <ThemeControl currentTheme={theme} onChangeTheme={setTheme} />
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="ml-2 p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none" aria-controls="mobile-menu" aria-expanded={isMenuOpen}>
                <span className="sr-only">Abrir menu</span>
                {isMenuOpen ? (
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <button onClick={() => { setAppView(AppView.Decks); setIsMenuOpen(false); }} className={`block w-full text-left px-3 py-2 rounded-md font-semibold transition-colors ${appView === AppView.Decks ? 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                Gerenciar Decks
              </button>
              <button onClick={() => { handleGenerateRequest(null); setIsMenuOpen(false); }} className={`block w-full text-left px-3 py-2 rounded-md font-semibold transition-colors ${appView === AppView.Generator ? 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                Gerar Flashcards
              </button>
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700 mt-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 pl-3">Tamanho da Fonte:</span>
                <FontSizeControl currentSize={fontSize} onChangeSize={setFontSize} />
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="z-10 w-full flex items-center justify-center my-10">
        {renderContent()}
      </div>

      {isSelectionModeActive && selectedCardIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-40 p-4 border-t dark:border-slate-700 animate-fade-in-up">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                <span className="bg-cyan-600 text-white rounded-full px-3 py-1 mr-2">{selectedCardIds.size}</span>
                selecionado(s)
              </p>
              <button onClick={handleSelectAllCards} className="text-sm font-semibold text-cyan-600 hover:underline">
                Selecionar Todos
              </button>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={() => setShowMoveMultipleConfirm(true)} className="px-4 py-2 text-sm sm:text-base bg-slate-200 text-slate-700 font-semibold rounded-lg shadow hover:bg-slate-300 transition dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">Mover</button>
              <button onClick={() => setShowDeleteMultipleConfirm(true)} className="px-4 py-2 text-sm sm:text-base bg-red-500 text-white font-semibold rounded-lg shadow hover:bg-red-600 transition">Excluir</button>
              <button onClick={handleExitSelectionMode} className="px-4 py-2 text-sm sm:text-base font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition">Concluído</button>
            </div>
          </div>
        </div>
      )}

      {isHelpVisible && <HelpModal onClose={() => setIsHelpVisible(false)} />}
      {isSourceTextVisible && <SourceTextModal text={sourceText} onClose={() => setIsSourceTextVisible(false)} />}
      {cardToMove && (
        <MoveFlashcardModal
          card={cardToMove}
          decks={decks}
          onConfirm={handleConfirmCardMove}
          onCancel={() => setCardToMove(null)}
        />
      )}
      {showMoveMultipleConfirm && (
        <MoveMultipleFlashcardsModal
          count={selectedCardIds.size}
          decks={decks}
          currentDeckId={currentDeckId}
          onConfirm={handleConfirmBulkMove}
          onCancel={() => setShowMoveMultipleConfirm(false)}
        />
      )}
      {showDeleteMultipleConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-multiple-confirm-title"
        >
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md text-center border dark:border-slate-700">
            <h2 id="delete-multiple-confirm-title" className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Confirmar Exclusão</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Você tem certeza que deseja excluir <span className="font-bold">{selectedCardIds.size}</span> flashcard{selectedCardIds.size !== 1 ? 's' : ''}?
              <br />
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowDeleteMultipleConfirm(false)}
                className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg shadow-sm hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 transition"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
      {deckToDelete && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
        >
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md text-center border dark:border-slate-700">
            <h2 id="delete-confirm-title" className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Confirmar Exclusão</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Você tem certeza que deseja excluir o deck <span className="font-bold">"{deckToDelete.name}"</span>?
              <br />
              Todos os sub-decks e flashcards contidos nele serão permanentemente removidos.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setDeckToDelete(null)}
                className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg shadow-sm hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 transition"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
      {deckToRename && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rename-modal-title"
        >
          <form onSubmit={handleRenameSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md border dark:border-slate-700">
            <h2 id="rename-modal-title" className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Renomear Deck</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Insira o novo nome para o deck "{deckToRename.name}".
            </p>
            <input
              name="deckName"
              type="text"
              defaultValue={deckToRename.name}
              required
              autoFocus
              onFocus={e => e.target.select()}
              className="w-full p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
            />
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => setDeckToRename(null)}
                className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg shadow-sm hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-cyan-600 text-white font-semibold rounded-lg shadow-sm hover:bg-cyan-500 transition"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
      {deckToMove && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="move-modal-title"
        >
          <form onSubmit={handleMoveSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md border dark:border-slate-700">
            <h2 id="move-modal-title" className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Mover Deck</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Selecione o novo local para o deck "{deckToMove.name}".
            </p>
            <select
              name="deckLocation"
              defaultValue={deckToMove.parentId || 'root'}
              className="w-full p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
            >
              <option value="root">-- Raiz (Todos os Decks) --</option>
              {availableParentDecks.map(deck => (
                <option key={deck.id} value={deck.id}>{deck.name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => setDeckToMove(null)}
                className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg shadow-sm hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-cyan-600 text-white font-semibold rounded-lg shadow-sm hover:bg-cyan-500 transition"
              >
                Mover
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};

export default App;