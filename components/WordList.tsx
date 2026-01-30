import React from 'react';
import { WordEntry, VisibilityState } from '../types';
import WordItem from './WordItem';

interface WordListProps {
	words: WordEntry[];
	visibility: VisibilityState;
	onToggleFavorite: (id: string) => void;
	onDelete: (id: string) => void;
	isFilteringFavorites?: boolean;
}

const WordList: React.FC<WordListProps> = ({
	words,
	visibility,
	onToggleFavorite,
	onDelete,
	isFilteringFavorites,
}) => {
	if (words.length === 0) {
		return (
			<div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 animate-in fade-in duration-500">
				<div className="mx-auto w-20 h-20 text-slate-200 mb-6">
					{isFilteringFavorites ? (
						<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
							/>
						</svg>
					) : (
						<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
							/>
						</svg>
					)}
				</div>
				<h3 className="text-xl font-black text-slate-900 tracking-tight">
					{isFilteringFavorites ? '즐겨찾기한 단어가 없습니다.' : '단어장이 비어있습니다.'}
				</h3>
				<p className="mt-2 text-slate-500 font-medium max-w-xs mx-auto">
					{isFilteringFavorites
						? '중요한 단어에 별표를 표시하여 모아보세요.'
						: 'AI 검색을 이용하거나 대량 등록을 통해 단어를 추가해보세요.'}
				</p>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
			{/* Table Header - Desktop Only (>430px) */}
			<div className="hidden min-[431px]:grid grid-cols-[56px_1.2fr_1.2fr_3fr_56px] bg-slate-50/50 border-b border-slate-100 items-center">
				<div className="py-5"></div>
				<div className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
					단어
				</div>
				<div className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
					뜻
				</div>
				<div className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
					활용 문장
				</div>
				<div className="py-5"></div>
			</div>

			{/* Word Items */}
			<div className="divide-y divide-slate-100">
				{words.map((word) => (
					<WordItem
						key={word.id}
						word={word}
						visibility={visibility}
						onToggleFavorite={onToggleFavorite}
						onDelete={onDelete}
					/>
				))}
			</div>
		</div>
	);
};

export default WordList;
