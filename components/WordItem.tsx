
import React, { useState } from 'react';
import { WordEntry, VisibilityState } from '../types';
import { generateSpeech, decodeAudioData } from '../services/geminiService';

interface WordItemProps {
  word: WordEntry;
  visibility: VisibilityState;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

const WordItem: React.FC<WordItemProps> = ({ word, visibility, onToggleFavorite, onDelete }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayTTS = async (text: string) => {
    if (isPlaying) return;
    try {
      setIsPlaying(true);
      const audioBytes = await generateSpeech(text);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const buffer = await decodeAudioData(audioBytes, audioCtx);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
    } catch (err) {
      console.error("TTS Error", err);
      setIsPlaying(false);
    }
  };

  // 발음기호 분리 로직
  const renderFormattedWord = (text: string) => {
    const bracketIndex = text.indexOf('[');
    if (bracketIndex !== -1) {
      const main = text.substring(0, bracketIndex).trim();
      const sub = text.substring(bracketIndex);
      return (
        <div className="flex flex-col md:flex-row md:items-baseline">
          <span className="break-all">{main}</span>
          <span className="text-[0.7rem] font-medium text-slate-400 md:ml-2 tracking-normal leading-tight">
            {sub}
          </span>
        </div>
      );
    }
    return <span className="break-all">{text}</span>;
  };

  return (
    <tr className="hover:bg-indigo-50/30 transition-colors group">
      <td className="px-4 py-4 whitespace-nowrap text-center">
        <button 
          onClick={() => onToggleFavorite(word.id)}
          className={`transition-all transform active:scale-150 p-1.5 rounded-full hover:bg-slate-100 ${word.isFavorite ? 'text-amber-500' : 'text-slate-300 hover:text-slate-400'}`}
          title={word.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 drop-shadow-sm" fill={word.isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <div className={`text-lg md:text-xl font-bold md:font-black tracking-tight ${visibility.word ? 'text-slate-900' : 'text-transparent bg-slate-200 rounded animate-pulse w-24 select-none'}`}>
            {visibility.word ? renderFormattedWord(word.word) : '••••'}
          </div>
          {visibility.word && (
            <button 
              onClick={() => handlePlayTTS(word.word)}
              disabled={isPlaying}
              className={`p-1.5 transition-colors rounded-full hover:bg-white shadow-sm flex-shrink-0 ${isPlaying ? 'text-indigo-600 animate-pulse' : 'text-slate-400 hover:text-indigo-600'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`text-base font-bold break-all block ${visibility.meaning ? 'text-slate-700' : 'text-transparent bg-slate-200 rounded animate-pulse w-32 select-none'}`}>
          {word.meaning}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-start space-x-2">
          <span className={`text-sm leading-relaxed break-words whitespace-normal ${visibility.example ? 'text-slate-500 italic' : 'text-transparent bg-slate-100 rounded animate-pulse w-full select-none'}`}>
            {word.example}
          </span>
          {visibility.example && (
            <button 
              onClick={() => handlePlayTTS(word.example)}
              disabled={isPlaying}
              className={`mt-0.5 p-1.5 transition-colors rounded-full hover:bg-white shadow-sm flex-shrink-0 ${isPlaying ? 'text-indigo-600 animate-pulse' : 'text-slate-400 hover:text-indigo-600'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-4 text-right">
        <button 
          onClick={() => onDelete(word.id)}
          className="md:opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all rounded-lg hover:bg-red-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </td>
    </tr>
  );
};

export default WordItem;
