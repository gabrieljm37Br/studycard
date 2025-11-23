export interface Deck {
  id: string;
  name: string;
  parentId: string | null;
}

export enum AppView {
  Decks = 'decks',
  Generator = 'generator',
}

export enum AppState {
  Idle,
  Generating,
  Studying,
  Error,
}

export enum CardMode {
  QA = 'qa',
  TrueFalse = 'true_false',
  MultipleChoice = 'multiple_choice',
  PracticalExample = 'practical_example',
  FillInTheBlank = 'fill_in_the_blank',
}

export enum FeedbackStatus {
  Unseen = 'unseen',
  Incorrect = 'incorrect',
  Almost = 'almost',
  Correct = 'correct',
}

export interface WebSource {
  uri: string;
  title: string;
}

export interface QACard {
  mode: CardMode.QA;
  id: string;
  question: string;
  answer: string;
  feedback: FeedbackStatus;
  deckId: string;
  sources?: WebSource[];
}

export interface TrueFalseCard {
  mode: CardMode.TrueFalse;
  id: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
  feedback: FeedbackStatus;
  deckId: string;
  sources?: WebSource[];
}

export interface MultipleChoiceCard {
  mode: CardMode.MultipleChoice;
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number; // 0-based index
  explanation: string;
  feedback: FeedbackStatus;
  deckId: string;
  sources?: WebSource[];
}

export interface PracticalExampleCard {
  mode: CardMode.PracticalExample;
  id: string;
  problem: string;
  question: string;
  solution: string;
  sources: WebSource[];
  feedback: FeedbackStatus;
  deckId: string;
}

export interface FillInTheBlankCard {
  mode: CardMode.FillInTheBlank;
  id: string;
  question: string; // The sentence with blanks
  answer: string;   // The correct answer
  feedback: FeedbackStatus;
  deckId: string;
  sources?: WebSource[];
}

export type FlashcardData = QACard | TrueFalseCard | MultipleChoiceCard | PracticalExampleCard | FillInTheBlankCard;

// File upload types
export interface FileParseResult {
  records: string[];
  fileType: 'txt' | 'csv';
  totalRecords: number;
}

export interface ClassificationResult {
  flashcards: FlashcardData[];
  breakdown: {
    qa: number;
    true_false: number;
    multiple_choice: number;
    practical_example: number;
    fill_in_the_blank: number;
  };
}