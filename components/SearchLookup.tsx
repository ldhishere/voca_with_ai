import React, { useState } from 'react';
import { WordEntry, GroundingChunk, Language } from '../types';
import { lookupWord } from '../services/geminiService';

interface SearchLookupProps {
	onAddWord: (word: Omit<WordEntry, 'id' | 'createdAt' | 'isFavorite'>) => void;
	language: Language;
}

const SearchLookup: React.FC<SearchLookupProps> = ({ onAddWord, language }) => {
	const [query, setQuery] = useState('');
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<Partial<WordEntry> | null>(null);
	const [sources, setSources] = useState<GroundingChunk[]>([]);

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!query.trim()) return;

		setLoading(true);
		setResult(null);
		setSources([]);

		try {
			const { entry, sources } = await lookupWord(query, language);
			setResult(entry);
			setSources(sources);
		} catch (err) {
			console.error(err);
			alert('검색 중 오류가 발생했습니다.');
		} finally {
			setLoading(false);
		}
	};

	const handleAdd = () => {
		if (result && result.word && result.meaning && result.example) {
			onAddWord({
				word: result.word,
				meaning: result.meaning,
				example: result.example,
			});
			setQuery('');
			setResult(null);
			setSources([]);
			alert('단어장에 추가되었습니다!');
		}
	};

	const renderFormattedWord = (text: string) => {
		const bracketIndex = text.indexOf('[');
		if (bracketIndex !== -1) {
			const main = text.substring(0, bracketIndex).trim();
			const sub = text.substring(bracketIndex);
			return (
				<div className="flex flex-col">
					<span>{main}</span>
					<span className="text-xs min-[431px]:text-sm font-medium text-slate-400 tracking-normal mt-1">
						{sub}
					</span>
				</div>
			);
		}
		return text;
	};

	return (
		<div className="max-w-2xl mx-auto space-y-6">
			<div className="bg-white p-6 min-[431px]:p-8 rounded-2xl shadow-xl border border-slate-200">
				<h2 className="text-xl min-[431px]:text-2xl font-bold text-slate-800 mb-6 flex items-center">
					<svg
						className="w-5 h-5 min-[431px]:w-6 min-[431px]:h-6 mr-2 text-indigo-600"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
						<path
							fillRule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z"
							clipRule="evenodd"
						/>
					</svg>
					AI 단어 검색
				</h2>
				<form onSubmit={handleSearch} className="relative">
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="검색할 단어를 입력하세요"
						className="w-full pl-5 pr-28 min-[431px]:pl-6 min-[431px]:pr-32 py-3 min-[431px]:py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-base min-[431px]:text-lg"
					/>
					<button
						type="submit"
						disabled={loading}
						className="absolute right-1.5 top-1.5 bottom-1.5 px-4 min-[431px]:px-6 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-slate-300 transition-colors shadow-lg shadow-indigo-200 text-sm min-[431px]:text-base"
					>
						{loading ? '...' : '검색'}
					</button>
				</form>
			</div>

			{loading && (
				<div className="flex flex-col items-center justify-center py-12 space-y-4 px-4 text-center">
					<div className="w-10 h-10 min-[431px]:w-12 min-[431px]:h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
					<p className="text-slate-500 font-medium text-sm min-[431px]:text-base">
						실시간 검색 데이터를 분석하여 최적의 예문을 생성 중입니다...
					</p>
				</div>
			)}

			{result && (
				<div className="bg-white p-6 min-[431px]:p-8 rounded-2xl shadow-xl border border-indigo-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
					<div className="space-y-6">
						<div>
							<label className="text-[10px] min-[431px]:text-xs font-bold text-indigo-600 uppercase tracking-wider">
								단어
							</label>
							<h3 className="text-2xl min-[431px]:text-3xl font-extrabold text-slate-900 leading-tight">
								{result.word ? renderFormattedWord(result.word) : ''}
							</h3>
						</div>
						<div>
							<label className="text-[10px] min-[431px]:text-xs font-bold text-indigo-600 uppercase tracking-wider">
								뜻
							</label>
							<p className="text-lg min-[431px]:text-xl text-slate-700 font-medium leading-relaxed">
								{result.meaning}
							</p>
						</div>
						<div className="bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
							<label className="text-[10px] min-[431px]:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
								활용 문장
							</label>
							<p className="text-slate-600 leading-relaxed text-base min-[431px]:text-lg">
								"{result.example}"
							</p>
						</div>

						{sources.length > 0 && (
							<div className="pt-4 border-t border-slate-100">
								<label className="text-[10px] min-[431px]:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
									출처
								</label>
								<div className="flex flex-wrap gap-2">
									{sources.map(
										(source, idx) =>
											source.web && (
												<a
													key={idx}
													href={source.web.uri}
													target="_blank"
													rel="noopener noreferrer"
													className="text-[10px] min-[431px]:text-xs text-indigo-500 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition-colors underline truncate max-w-[150px] min-[431px]:max-w-[200px]"
												>
													{source.web.title || source.web.uri}
												</a>
											)
									)}
								</div>
							</div>
						)}

						<button
							onClick={handleAdd}
							className="w-full py-3 min-[431px]:py-4 bg-emerald-500 text-white rounded-xl font-bold text-base min-[431px]:text-lg hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-100"
						>
							단어장에 추가하기
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default SearchLookup;
