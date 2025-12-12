export enum Language {
  ENGLISH = 'en',
  PERSIAN = 'fa'
}

export interface TranslationHistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  direction: 'en-to-fa' | 'fa-to-en';
  timestamp: number;
}

export interface TranslationState {
  sourceText: string;
  translatedText: string;
  isLoading: boolean;
  error: string | null;
  direction: 'en-to-fa' | 'fa-to-en';
}