import React, { useState, useEffect, useMemo, useRef } from 'react';
import { WordEntry, VisibilityState, VocabList, Language } from './types';
import WordList from './components/WordList';
import Header from './components/Header';
import SearchLookup from './components/SearchLookup';
import BulkImport from './components/BulkImport';
import { generate100Words } from './services/geminiService';
import { SAMPLE_DATA_MAP } from './constants/sampleData';

const generateId = () => {
	try {
		return crypto.randomUUID();
	} catch (e) {
		return Date.now().toString(36) + Math.random().toString(36).substring(2);
	}
};

const LANGUAGES: { id: Language; flag: string; label: string; sub: string }[] = [
	{ id: 'en', flag: '🇺🇸', label: '영어', sub: 'English' },
	{ id: 'zh', flag: '🇨🇳', label: '중국어', sub: 'Chinese' },
	{ id: 'hi', flag: '🇮🇳', label: '힌디어', sub: 'Hindi' },
	{ id: 'es', flag: '🇪🇸', label: '스페인어', sub: 'Spanish' },
	{ id: 'fr', flag: '🇫🇷', label: '프랑스어', sub: 'French' },
	{ id: 'ar', flag: '🇸🇦', label: '아랍어', sub: 'Arabic' },
	{ id: 'bn', flag: '🇧🇩', label: '벵골어', sub: 'Bengali' },
	{ id: 'pt', flag: '🇧🇷', label: '포르투갈어', sub: 'Portuguese' },
	{ id: 'ru', flag: '🇷🇺', label: '러시아어', sub: 'Russian' },
	{ id: 'ja', flag: '🇯🇵', label: '일본어', sub: 'Japanese' },
];

const App: React.FC = () => {
	const [lists, setLists] = useState<VocabList[]>([]);
	const [activeListId, setActiveListId] = useState<string>('');
	const [isEditingListName, setIsEditingListName] = useState<string | null>(null);
	const [editNameValue, setEditNameValue] = useState('');
	const [isLoaded, setIsLoaded] = useState(false);

	// Wizard State
	const [isCreatingList, setIsCreatingList] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [genMessage, setGenMessage] = useState('AI가 단어를 선별하고 있습니다');
	const [newListName, setNewListName] = useState('');
	const [nameError, setNameError] = useState(false);
	const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
	const [shouldLoadSamples, setShouldLoadSamples] = useState(true);

	const nameInputRef = useRef<HTMLInputElement>(null);

	const [visibility, setVisibility] = useState<VisibilityState>({
		word: true,
		meaning: true,
		example: true,
	});
	const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
	const [activeTab, setActiveTab] = useState<'list' | 'search'>('list');

	useEffect(() => {
		const saved = localStorage.getItem('vocab_master_data');
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				if (parsed && Array.isArray(parsed.lists)) {
					setLists(parsed.lists);
					if (parsed.activeListId && parsed.lists.some((l: any) => l.id === parsed.activeListId)) {
						setActiveListId(parsed.activeListId);
					} else if (parsed.lists.length > 0) {
						setActiveListId(parsed.lists[0].id);
					}
				}
			} catch (e) {
				console.error('Failed to load data', e);
			}
		}
		setIsLoaded(true);
	}, []);

	useEffect(() => {
		if (isLoaded) {
			localStorage.setItem('vocab_master_data', JSON.stringify({ lists, activeListId }));
		}
	}, [lists, activeListId, isLoaded]);

	const activeList = useMemo(
		() => lists.find((l) => l.id === activeListId) || null,
		[lists, activeListId]
	);

	const filteredWords = useMemo(() => {
		const list = activeList;
		if (!list) return [];
		if (showFavoritesOnly) {
			return list.words.filter((w) => w.isFavorite);
		}
		return list.words;
	}, [activeList, showFavoritesOnly]);

	const handleStartCreate = () => {
		setIsCreatingList(true);
		setNewListName('');
		setNameError(false);
		setSelectedLanguage('en');
		setShouldLoadSamples(true);
		setIsGenerating(false);
	};

	const handleConfirmCreate = async () => {
		const trimmedName = newListName.trim();
		if (!trimmedName) {
			setNameError(true);
			nameInputRef.current?.focus();
			return;
		}

		setNameError(false);
		setIsGenerating(true);
		let initialWords: WordEntry[] = [];

		try {
			if (shouldLoadSamples) {
				const localData = SAMPLE_DATA_MAP[selectedLanguage];
				if (localData && localData.length > 0) {
					setGenMessage('로컬 저장소에서 단어를 즉시 불러오는 중입니다');
					initialWords = localData.map((w) => ({
						...w,
						id: generateId(),
						createdAt: Date.now(),
						isFavorite: false,
					}));
					await new Promise((resolve) => setTimeout(resolve, 600));
				} else {
					setGenMessage('AI가 단어를 선별하고 있습니다');
					const aiWords = await generate100Words(selectedLanguage);
					initialWords = aiWords.map((w) => ({
						...w,
						id: generateId(),
						createdAt: Date.now(),
						isFavorite: false,
					}));
				}
			}

			const newList: VocabList = {
				id: generateId(),
				name: trimmedName,
				language: selectedLanguage,
				words: initialWords,
				createdAt: Date.now(),
			};

			setLists((prev) => [...prev, newList]);
			setActiveListId(newList.id);
			setIsCreatingList(false);
			setActiveTab('list');
		} catch (error) {
			console.error(error);
			alert('단어 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
		} finally {
			setIsGenerating(false);
		}
	};

	const deleteList = (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		if (confirm('이 단어장과 포함된 모든 단어를 삭제하시겠습니까?')) {
			const updated = lists.filter((l) => l.id !== id);
			setLists(updated);
			if (activeListId === id) {
				setActiveListId(updated.length > 0 ? updated[0].id : '');
			}
		}
	};

	const startEditListName = (id: string, name: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setIsEditingListName(id);
		setEditNameValue(name);
	};

	const saveListName = (id: string) => {
		if (!editNameValue.trim()) {
			setIsEditingListName(null);
			return;
		}
		setLists((prev) => prev.map((l) => (l.id === id ? { ...l, name: editNameValue.trim() } : l)));
		setIsEditingListName(null);
	};

	const updateActiveListWords = (updater: (prevWords: WordEntry[]) => WordEntry[]) => {
		setLists((prev) =>
			prev.map((l) => (l.id === activeListId ? { ...l, words: updater(l.words) } : l))
		);
	};

	const addWord = (newWord: Omit<WordEntry, 'id' | 'createdAt' | 'isFavorite'>) => {
		if (!activeListId) return;
		const entry: WordEntry = {
			...newWord,
			id: generateId(),
			createdAt: Date.now(),
			isFavorite: false,
		};
		updateActiveListWords((words) => [entry, ...words]);
	};

	const toggleFavorite = (id: string) => {
		updateActiveListWords((words) =>
			words.map((w) => (w.id === id ? { ...w, isFavorite: !w.isFavorite } : w))
		);
	};

	const deleteWord = (id: string) => {
		if (confirm('정말로 삭제하시겠습니까?')) {
			updateActiveListWords((words) => words.filter((w) => w.id !== id));
		}
	};

	const handleBulkImport = (
		importedWords: Omit<WordEntry, 'id' | 'createdAt' | 'isFavorite'>[]
	) => {
		if (!activeListId) return;
		const newEntries: WordEntry[] = importedWords.map((w) => ({
			...w,
			id: generateId(),
			createdAt: Date.now(),
			isFavorite: false,
		}));
		updateActiveListWords((words) => [...newEntries, ...words]);
	};

	// currentList 상수를 통해 TypeScript에게 null 체크가 끝났음을 알림
	const currentList = activeList;

	return (
		<div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
			<style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>

			{isCreatingList && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
					<div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
						{isGenerating ? (
							<div className="p-16 flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in">
								<div className="relative">
									<div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
									<div className="absolute inset-0 flex items-center justify-center">
										<span className="text-2xl">
											{LANGUAGES.find((l) => l.id === selectedLanguage)?.flag}
										</span>
									</div>
								</div>
								<div>
									<h2 className="text-2xl font-black text-slate-900">{genMessage}</h2>
									<p className="text-slate-500 mt-2 font-medium">
										선택하신 언어의 핵심 필수 단어를 채우는 중입니다.
										<br />
										잠시만 기다려주세요...
									</p>
								</div>
								<div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
									<div className="bg-indigo-600 h-full w-2/3 animate-pulse rounded-full"></div>
								</div>
							</div>
						) : (
							<>
								<div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white relative">
									<button
										onClick={() => setIsCreatingList(false)}
										className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors"
									>
										<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2.5"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
									<h2 className="text-3xl font-black tracking-tight">새 단어장 만들기</h2>
									<p className="text-indigo-100 mt-2 font-medium">
										학습할 언어를 선택하고 기초 단어를 즉시 로드하세요.
									</p>
								</div>

								<div className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
									<div className="space-y-3">
										<label
											className={`text-[10px] font-black uppercase tracking-widest ml-1 ${
												nameError ? 'text-red-500' : 'text-slate-400'
											}`}
										>
											단어장 이름
										</label>
										<input
											ref={nameInputRef}
											autoFocus
											placeholder="예: 영어 기초 100단어 마스터"
											className={`w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 text-lg font-bold outline-none transition-all shadow-inner ${
												nameError
													? 'border-red-500 ring-4 ring-red-100 animate-shake'
													: 'border-slate-100 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500'
											}`}
											value={newListName}
											onChange={(e) => {
												setNewListName(e.target.value);
												if (nameError) setNameError(false);
											}}
										/>
										{nameError && (
											<p className="text-red-500 text-xs font-bold ml-1 animate-in fade-in slide-in-from-top-1">
												⚠️ 단어장 이름을 입력해 주세요.
											</p>
										)}
									</div>

									<div className="space-y-4">
										<label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
											학습 언어
										</label>
										<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
											{LANGUAGES.map((lang) => (
												<button
													key={lang.id}
													onClick={() => setSelectedLanguage(lang.id)}
													className={`relative p-4 rounded-3xl border-2 transition-all flex flex-col items-center justify-center space-y-2 group ${
														selectedLanguage === lang.id
															? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100'
															: 'border-slate-100 hover:border-slate-300 bg-white'
													}`}
												>
													<span className="text-3xl group-hover:scale-110 transition-transform">
														{lang.flag}
													</span>
													<div className="text-center">
														<span className="block font-black text-slate-800 text-xs">
															{lang.label}
														</span>
													</div>
													{selectedLanguage === lang.id && (
														<div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
															<svg
																className="w-3 h-3 text-white"
																fill="currentColor"
																viewBox="0 0 20 20"
															>
																<path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
															</svg>
														</div>
													)}
												</button>
											))}
										</div>
									</div>

									<div className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100">
										<div className="flex items-center space-x-3">
											<div
												className={`p-2 rounded-xl ${
													shouldLoadSamples
														? 'bg-indigo-100 text-indigo-600'
														: 'bg-slate-200 text-slate-400'
												}`}
											>
												<svg
													className="w-5 h-5"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth="2.5"
														d="M13 10V3L4 14h7v7l9-11h-7z"
													/>
												</svg>
											</div>
											<div>
												<h4 className="font-black text-slate-800 text-xs">
													필수 기초 단어 실시간 로드
												</h4>
												<p className="text-[10px] text-slate-500 font-medium">
													준비된 핵심 데이터{SAMPLE_DATA_MAP[selectedLanguage] ? '' : '(AI 생성)'}를
													즉시 채워줍니다.
												</p>
											</div>
										</div>
										<button
											onClick={() => setShouldLoadSamples(!shouldLoadSamples)}
											className={`w-12 h-7 rounded-full transition-all relative p-1 ${
												shouldLoadSamples ? 'bg-indigo-600' : 'bg-slate-300'
											}`}
										>
											<div
												className={`w-5 h-5 bg-white rounded-full shadow-md transition-all transform ${
													shouldLoadSamples ? 'translate-x-5' : 'translate-x-0'
												}`}
											/>
										</button>
									</div>

									<div className="flex space-x-4 pt-2 sticky bottom-0 bg-white">
										<button
											onClick={() => setIsCreatingList(false)}
											className="flex-1 py-4 rounded-2xl border-2 border-slate-200 text-slate-500 font-black hover:bg-slate-50 transition-all"
										>
											취소
										</button>
										<button
											onClick={handleConfirmCreate}
											className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all"
										>
											생성 및 학습 시작
										</button>
									</div>
								</div>
							</>
						)}
					</div>
				</div>
			)}

			{/* Sidebar */}
			<aside className="w-full md:w-72 bg-white border-r border-slate-200 flex flex-col md:h-screen sticky top-0 z-30 shadow-xl shadow-slate-200/50">
				<div className="p-6 border-b border-slate-100 flex items-center space-x-3">
					<div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200 text-xl">
						V
					</div>
					<h1 className="font-extrabold text-slate-900 text-lg tracking-tight">My Vocab</h1>
				</div>

				<div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[40vh] md:max-h-none">
					<div className="flex items-center justify-between mb-2 px-2">
						<span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
							Vocabulary Lists
						</span>
						<button
							onClick={handleStartCreate}
							className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-xl transition-all active:scale-95"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fillRule="evenodd"
									d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
									clipRule="evenodd"
								/>
							</svg>
						</button>
					</div>

					<div className="space-y-1.5">
						{lists.map((list) => {
							const langInfo = LANGUAGES.find((l) => l.id === list.language);
							return (
								<div
									key={list.id}
									onClick={() => {
										setActiveListId(list.id);
										setIsCreatingList(false);
									}}
									className={`group flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all ${
										activeListId === list.id
											? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100'
											: 'hover:bg-slate-50 text-slate-600'
									}`}
								>
									<div className="flex items-center space-x-3 truncate flex-1">
										<div
											className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
												activeListId === list.id
													? 'bg-white/20'
													: 'bg-slate-100 group-hover:bg-white'
											}`}
										>
											<span className="text-xs">{langInfo?.flag || '📚'}</span>
										</div>
										{isEditingListName === list.id ? (
											<input
												autoFocus
												className="bg-transparent border-b border-white outline-none w-full text-sm font-bold py-0"
												value={editNameValue}
												onChange={(e) => setEditNameValue(e.target.value)}
												onBlur={() => saveListName(list.id)}
												onKeyDown={(e) => e.key === 'Enter' && saveListName(list.id)}
												onClick={(e) => e.stopPropagation()}
											/>
										) : (
											<span className="truncate text-sm font-bold tracking-tight">{list.name}</span>
										)}
									</div>
									<div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
										<button
											onClick={(e) => startEditListName(list.id, list.name, e)}
											className={`p-1.5 rounded-lg hover:bg-black/10 ${
												activeListId === list.id ? 'text-white' : 'text-slate-400'
											}`}
										>
											<svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
												<path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
											</svg>
										</button>
										<button
											onClick={(e) => deleteList(list.id, e)}
											className={`p-1.5 rounded-lg hover:bg-black/10 ${
												activeListId === list.id
													? 'text-white'
													: 'text-slate-400 hover:text-red-500'
											}`}
										>
											<svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
												<path
													fillRule="evenodd"
													d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
													clipRule="evenodd"
												/>
											</svg>
										</button>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</aside>

			{/* Main Area */}
			<div className="flex-1 flex flex-col h-screen overflow-y-auto">
				<Header />

				<main className="max-w-6xl w-full mx-auto px-4 py-10">
					{!currentList ? (
						<div className="text-center py-32 animate-in fade-in zoom-in duration-500">
							<div className="mx-auto w-24 h-24 bg-indigo-50 text-indigo-400 rounded-[2rem] flex items-center justify-center mb-8 shadow-sm border border-indigo-100/50">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-12 w-12"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
									/>
								</svg>
							</div>
							<h2 className="text-3xl font-black text-slate-900 tracking-tight">
								글로벌 학습을 시작하세요
							</h2>
							<p className="text-slate-500 mt-3 max-w-sm mx-auto font-medium leading-relaxed text-lg">
								핵심 공용어 단어장으로 시작하거나 나만의 리스트를 만드세요.
							</p>
							<button
								onClick={handleStartCreate}
								className="mt-10 px-10 py-5 bg-indigo-600 text-white rounded-[1.25rem] font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:translate-y-0 active:scale-95"
							>
								첫 단어장 만들기
							</button>
						</div>
					) : (
						<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
							<div className="flex flex-wrap items-center justify-between mb-10 gap-6">
								<div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-8">
									<div className="flex items-center space-x-4">
										<span className="text-5xl drop-shadow-lg">
											{LANGUAGES.find((l) => l.id === currentList.language)?.flag || '📚'}
										</span>
										<h2 className="text-4xl font-black text-slate-900 tracking-tighter">
											{currentList.name}
										</h2>
									</div>
									<div className="flex space-x-1.5 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
										<button
											onClick={() => setActiveTab('list')}
											className={`px-6 py-2.5 rounded-xl transition-all text-xs font-black uppercase tracking-widest ${
												activeTab === 'list'
													? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
													: 'hover:bg-slate-50 text-slate-400'
											}`}
										>
											단어 리스트
										</button>
										<button
											onClick={() => setActiveTab('search')}
											className={`px-6 py-2.5 rounded-xl transition-all text-xs font-black uppercase tracking-widest ${
												activeTab === 'search'
													? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
													: 'hover:bg-slate-50 text-slate-400'
											}`}
										>
											AI 검색 추가
										</button>
									</div>
								</div>
								{activeTab === 'list' && (
									<div className="flex items-center space-x-3">
										<BulkImport onImport={handleBulkImport} />
									</div>
								)}
							</div>

							{activeTab === 'list' && (
								<div className="space-y-8">
									<div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
										<span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-2">
											Visibility Filters
										</span>
										<div className="flex flex-wrap gap-3">
											<button
												onClick={() => setVisibility((v) => ({ ...v, word: !v.word }))}
												className={`px-5 py-2.5 rounded-2xl text-xs font-black border transition-all ${
													visibility.word
														? 'bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm'
														: 'bg-slate-50 border-slate-100 text-slate-300 line-through opacity-50'
												}`}
											>
												단어 {visibility.word ? '숨기기' : '보이기'}
											</button>
											<button
												onClick={() => setVisibility((v) => ({ ...v, meaning: !v.meaning }))}
												className={`px-5 py-2.5 rounded-2xl text-xs font-black border transition-all ${
													visibility.meaning
														? 'bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm'
														: 'bg-slate-50 border-slate-100 text-slate-300 line-through opacity-50'
												}`}
											>
												뜻 {visibility.meaning ? '숨기기' : '보이기'}
											</button>
											<button
												onClick={() => setVisibility((v) => ({ ...v, example: !v.example }))}
												className={`px-5 py-2.5 rounded-2xl text-xs font-black border transition-all ${
													visibility.example
														? 'bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm'
														: 'bg-slate-50 border-slate-100 text-slate-300 line-through opacity-50'
												}`}
											>
												예문 {visibility.example ? '숨기기' : '보이기'}
											</button>
											<div className="w-px h-8 bg-slate-200 mx-1 self-center" />
											<button
												onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
												className={`px-5 py-2.5 rounded-2xl text-xs font-black border transition-all flex items-center space-x-2 ${
													showFavoritesOnly
														? 'bg-amber-50 border-amber-200 text-amber-600 shadow-md ring-2 ring-amber-100'
														: 'bg-white border-slate-200 text-slate-400 hover:border-amber-200 hover:text-amber-500'
												}`}
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current' : 'fill-none'}`}
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
													/>
												</svg>
												<span>즐겨찾기만 보기</span>
											</button>
										</div>
									</div>
									<WordList
										words={filteredWords}
										visibility={visibility}
										onToggleFavorite={toggleFavorite}
										onDelete={deleteWord}
										isFilteringFavorites={showFavoritesOnly}
									/>
								</div>
							)}

							{activeTab === 'search' && (
								<SearchLookup onAddWord={addWord} language={currentList.language} />
							)}
						</div>
					)}
				</main>

				<footer className="mt-auto bg-white border-t border-slate-100 py-8 px-4 text-center text-[10px] text-slate-400 uppercase tracking-[0.4em] font-medium">
					AI Vocabulary Master • Global Edition
				</footer>
			</div>
		</div>
	);
};

export default App;
