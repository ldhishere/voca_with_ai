
import React, { useRef } from 'react';
import { WordEntry } from '../types';

interface BulkImportProps {
  onImport: (words: Omit<WordEntry, 'id' | 'createdAt' | 'isFavorite'>[]) => void;
}

const BulkImport: React.FC<BulkImportProps> = ({ onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const parsedWords: Omit<WordEntry, 'id' | 'createdAt' | 'isFavorite'>[] = [];

      lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length >= 2) {
          parsedWords.push({
            word: parts[0].trim(),
            meaning: parts[1].trim(),
            example: parts[2]?.trim() || 'No example provided.',
          });
        }
      });

      if (parsedWords.length > 0) {
        onImport(parsedWords);
        alert(`${parsedWords.length}개의 단어가 성공적으로 등록되었습니다!`);
      } else {
        alert('올바른 CSV 형식이 아닙니다. (단어,뜻,문장)');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex items-center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv,.txt"
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-semibold"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span>CSV 일괄 등록</span>
      </button>
      <div className="ml-2 group relative">
        <svg className="w-5 h-5 text-slate-300 cursor-help" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-50">
          CSV 파일 형식: <br/> 
          <code className="bg-slate-700 px-1 rounded">단어,뜻,예문</code> <br/>
          형식으로 각 줄에 작성해주세요.
        </div>
      </div>
    </div>
  );
};

export default BulkImport;
