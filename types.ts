
export interface WordEntry {
  id: string;
  word: string;
  meaning: string;
  example: string;
  isFavorite: boolean;
  createdAt: number;
}

export type Language = 'en' | 'zh' | 'hi' | 'es' | 'fr' | 'ar' | 'bn' | 'pt' | 'ru' | 'ja' | 'custom';

export interface VocabList {
  id: string;
  name: string;
  language: Language;
  words: WordEntry[];
  createdAt: number;
}

export interface VisibilityState {
  word: boolean;
  meaning: boolean;
  example: boolean;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}
