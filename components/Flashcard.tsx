import React, { useState, useEffect } from 'react';
import { renderHTML } from '../utils/textUtils';
import { CardMode } from '../types';
import type { FlashcardData, QACard, TrueFalseCard, MultipleChoiceCard, PracticalExampleCard, WebSource } from '../types';

const SourcesView: React.FC<{ sources?: WebSource[] }> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-slate-300 w-full">
      <h4 className="font-bold text-slate-600 text-sm mb-2 text-left">Fontes:</h4>
      <ul className="list-disc list-inside text-left space-y-1">
        {sources.map((source, index) => (
          <li key={index} className="text-xs break-all">
            <a
              href={source.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-600 hover:underline"
              onClick={e => e.stopPropagation()} // Prevent card flip when clicking link
            >
              {source.title || source.uri}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};


const QACardView: React.FC<{ card: QACard }> = ({ card }) => (
  <>
    {/* Front */}
    <div className="absolute inset-0 flex h-full w-full flex-col rounded-xl p-6 text-center [backface-visibility:hidden] bg-white text-slate-900 border-2 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">
      <p className="flex-shrink-0 text-xs font-semibold uppercase text-cyan-500 dark:text-cyan-400">Pergunta e Resposta</p>
      <div className="flex-grow my-2 overflow-y-auto flex items-center justify-center p-2">
        <h3 className="text-xl font-bold" dangerouslySetInnerHTML={renderHTML(card.question)} />
      </div>
      <p className="mt-auto flex-shrink-0 text-sm text-slate-500 dark:text-slate-400">Clique para virar</p>
    </div>
    {/* Back */}
    <div className="absolute inset-0 flex h-full w-full flex-col rounded-xl bg-slate-100 p-6 text-slate-800 [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-y-auto">
      <div className="flex-grow w-full flex flex-col justify-center items-center">
        <p className="text-md whitespace-pre-wrap text-center" dangerouslySetInnerHTML={renderHTML(card.answer)} />
      </div>
      <SourcesView sources={card.sources} />
    </div>
  </>
);

const TrueFalseCardView: React.FC<{ card: TrueFalseCard }> = ({ card }) => (
  <>
    {/* Front */}
    <div className="absolute inset-0 flex h-full w-full flex-col rounded-xl p-6 text-center [backface-visibility:hidden] bg-white text-slate-900 border-2 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">
      <p className="flex-shrink-0 text-xs font-semibold uppercase text-cyan-500 dark:text-cyan-400">Verdadeiro ou Falso</p>
      <div className="flex-grow my-2 overflow-y-auto flex items-center justify-center p-2">
        <h3 className="text-xl font-bold" dangerouslySetInnerHTML={renderHTML(card.statement)} />
      </div>
      <p className="mt-auto flex-shrink-0 text-sm text-slate-500 dark:text-slate-400">Clique para ver a resposta</p>
    </div>
    {/* Back */}
    <div className="absolute inset-0 h-full w-full rounded-xl bg-slate-100 p-6 text-slate-800 [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-y-auto flex flex-col items-center">
      <div className="flex-grow flex flex-col justify-center items-center text-center">
        <h3 className={`text-2xl font-bold ${card.isTrue ? 'text-green-600' : 'text-red-600'}`}>
          {card.isTrue ? 'Verdadeiro' : 'Falso'}
        </h3>
        <p className="mt-4 text-md whitespace-pre-wrap" dangerouslySetInnerHTML={renderHTML(card.explanation)} />
      </div>
      <SourcesView sources={card.sources} />
    </div>
  </>
);

const MultipleChoiceCardView: React.FC<{ card: MultipleChoiceCard }> = ({ card }) => (
  <>
    {/* Front */}
    <div className="absolute inset-0 flex h-full w-full flex-col rounded-xl p-6 text-center [backface-visibility:hidden] border-2 bg-white text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">
      <p className="flex-shrink-0 text-xs font-semibold uppercase text-cyan-500 dark:text-cyan-400">Múltipla Escolha</p>
      <div className="flex-grow my-2 overflow-y-auto text-left">
        <h3 className="text-lg font-bold text-center" dangerouslySetInnerHTML={renderHTML(card.question)} />
        <ul className="mt-4 w-full space-y-2">
          {card.options.map((option, index) => (
            <li key={index} className="rounded-md bg-slate-100 dark:bg-slate-700 p-2 text-sm">
              <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span> {option}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-auto pt-2 flex-shrink-0 text-xs text-slate-500 dark:text-slate-400">Clique para ver a resposta</p>
    </div>
    {/* Back */}
    <div className="absolute inset-0 h-full w-full rounded-xl bg-slate-100 p-6 text-slate-800 [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-y-auto flex flex-col">
      <div className="flex-grow">
        <h3 className="text-lg font-bold text-slate-900" dangerouslySetInnerHTML={renderHTML(card.question)} />
        <ul className="mt-4 space-y-2">
          {card.options.map((option, index) => (
            <li key={index} className={`p-2 rounded-md text-sm ${index === card.correctAnswerIndex
              ? 'bg-green-200 font-bold text-green-900'
              : 'bg-slate-200'
              }`}>
              <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span> {option}
            </li>
          ))}
        </ul>
        <div className="mt-4 pt-4 border-t border-slate-300">
          <h4 className="font-bold text-slate-600">Explicação:</h4>
          <p className="text-md whitespace-pre-wrap" dangerouslySetInnerHTML={renderHTML(card.explanation)} />
        </div>
      </div>
      <SourcesView sources={card.sources} />
    </div>
  </>
);

const PracticalExampleCardView: React.FC<{ card: PracticalExampleCard, phase: number }> = ({ card, phase }) => {
  const [sourcesVisible, setSourcesVisible] = useState(false);

  // Phase 0: Problem
  if (phase === 0) {
    return (
      <div className="absolute inset-0 flex h-full w-full flex-col rounded-xl p-6 text-center bg-white text-slate-900 border-2 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">
        <p className="flex-shrink-0 text-xs font-semibold uppercase text-cyan-500 dark:text-cyan-400">Exemplo Prático (1/3)</p>
        <div className="flex-grow my-2 overflow-y-auto flex items-center justify-center p-2">
          <h3 className="text-xl font-bold" dangerouslySetInnerHTML={renderHTML(card.problem)} />
        </div>
        <p className="mt-auto flex-shrink-0 text-sm text-slate-500 dark:text-slate-400">Clique para ver a pergunta</p>
      </div>
    );
  }

  // Phase 1: Question
  if (phase === 1) {
    return (
      <div className="absolute inset-0 flex h-full w-full flex-col rounded-xl p-6 text-center bg-white text-slate-900 border-2 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">
        <p className="flex-shrink-0 text-xs font-semibold uppercase text-cyan-500 dark:text-cyan-400">Pergunta (2/3)</p>
        <div className="flex-grow my-2 overflow-y-auto flex items-center justify-center p-2">
          <h3 className="text-xl font-bold" dangerouslySetInnerHTML={renderHTML(card.question)} />
        </div>
        <p className="mt-auto flex-shrink-0 text-sm text-slate-500 dark:text-slate-400">Clique para ver a solução</p>
      </div>
    );
  }

  // Phase 2: Solution
  return (
    <div className="absolute inset-0 flex h-full w-full flex-col rounded-xl bg-slate-100 p-6 text-slate-800">
      <p className="flex-shrink-0 text-xs font-semibold uppercase text-cyan-500 dark:text-cyan-400 text-center mb-2">Solução (3/3)</p>
      <div className="flex-grow w-full overflow-y-auto">
        <div className="text-left">
          <h4 className="font-bold text-slate-600 mb-2">Solução:</h4>
          <p className="text-md whitespace-pre-wrap" dangerouslySetInnerHTML={renderHTML(card.solution)} />
        </div>
        {card.sources && card.sources.length > 0 && (
          <div className="mt-4 pt-2 border-t border-slate-300 w-full">
            <button
              onClick={(e) => { e.stopPropagation(); setSourcesVisible(!sourcesVisible); }}
              className="flex items-center gap-1.5 text-sm font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors w-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 001.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l-1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
              </svg>
              <span>{sourcesVisible ? 'Ocultar Fontes' : 'Mostrar Fontes'}</span>
            </button>
            {sourcesVisible && <div className="mt-2"><SourcesView sources={card.sources} /></div>}
          </div>
        )}
      </div>
    </div>
  );
};

interface FlashcardProps {
  card: FlashcardData;
  onDelete?: () => void;
  onMove?: () => void;
  isSelectionModeActive?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (cardId: string) => void;
  onFlipStateChange?: (isFlipped: boolean) => void;
  onPhaseChange?: (phase: number) => void;
}

const Flashcard: React.FC<FlashcardProps> = ({
  card,
  onDelete,
  onMove,
  isSelectionModeActive,
  isSelected,
  onToggleSelection,
  onFlipStateChange,
  onPhaseChange,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [phase, setPhase] = useState(0);
  const isStudyMode = !!onFlipStateChange;

  useEffect(() => {
    setIsFlipped(false);
    setPhase(0);
    if (isStudyMode) {
      onFlipStateChange?.(false);
      onPhaseChange?.(0);
    }
  }, [card.id]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent activation if clicking specific interactive elements
    if ((e.target as HTMLElement).closest('a, button')) {
      return;
    }

    // Critical Fix: Stop propagation to ensure the click is handled strictly here 
    // and doesn't conflict with other potential listeners or double-fire.
    e.stopPropagation();

    if (isSelectionModeActive) {
      onToggleSelection?.(card.id);
      return;
    }

    if (card.mode === CardMode.PracticalExample) {
      const nextPhase = (phase + 1) % 3;
      setPhase(nextPhase);
      onFlipStateChange?.(nextPhase > 0);
      onPhaseChange?.(nextPhase);
    } else {
      const newFlippedState = !isFlipped;
      setIsFlipped(newFlippedState);
      onFlipStateChange?.(newFlippedState);
    }
  };

  const renderCardContent = () => {
    switch (card.mode) {
      case CardMode.QA:
        return <QACardView card={card} />;
      case CardMode.TrueFalse:
        return <TrueFalseCardView card={card} />;
      case CardMode.MultipleChoice:
        return <MultipleChoiceCardView card={card} />;
      case CardMode.PracticalExample:
        return <PracticalExampleCardView card={card} phase={phase} />;
      default:
        return <div>Tipo de card desconhecido.</div>;
    }
  };

  const isFlippable = card.mode !== CardMode.PracticalExample;
  const currentFlipState = isFlippable ? isFlipped : false;

  return (
    <div
      className={`relative group w-full min-h-64 max-h-96 rounded-xl shadow-md transition-all duration-300 ${isSelectionModeActive ? 'cursor-pointer' : ''} ${isSelected ? 'ring-4 ring-cyan-500 shadow-lg scale-105' : ''}`}
      onClick={handleCardClick}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') handleCardClick(e as any); }}
      role="button"
      aria-pressed={isSelected || isFlipped}
      tabIndex={0}
    >
      {isSelectionModeActive && (
        <div className="absolute top-2 left-2 z-10 bg-white dark:bg-slate-800 p-1 rounded-full pointer-events-none">
          <input
            type="checkbox"
            readOnly
            checked={isSelected}
            className="h-5 w-5 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700"
          />
        </div>
      )}
      <div
        className={`relative w-full h-full cursor-pointer [transform-style:preserve-3d] transition-transform duration-500 ${currentFlipState ? '[transform:rotateY(180deg)]' : ''}`}
      >
        {renderCardContent()}
      </div>
      {!isStudyMode && !isSelectionModeActive && (
        <div className="absolute top-2 right-2 z-20 flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
          <button onClick={(e) => { e.stopPropagation(); onMove?.(); }} className="p-3 sm:p-2 rounded-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0" aria-label="Mover card"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="p-3 sm:p-2 rounded-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0" aria-label="Excluir card"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
        </div>
      )}
    </div>
  );
};

export default Flashcard;