import { GoogleGenAI, Type, Modality, GenerateContentResponse } from '@google/genai';
import { WordEntry, Language } from '../types';

const API_KEY = process.env.API_KEY || '';

export const getAI = () => new GoogleGenAI({ apiKey: API_KEY });

const langNames: Record<string, string> = {
	en: 'English',
	zh: 'Chinese',
	hi: 'Hindi',
	es: 'Spanish',
	fr: 'French',
	ar: 'Arabic',
	bn: 'Bengali',
	pt: 'Portuguese',
	ru: 'Russian',
	ja: 'Japanese',
};

/**
 * Generate 100 essential words for a specific language
 */
export async function generate100Words(
	language: Language
): Promise<Omit<WordEntry, 'id' | 'createdAt' | 'isFavorite'>[]> {
	const ai = getAI();
	const targetLang = langNames[language] || language;

	const response = await ai.models.generateContent({
		model: 'gemini-3-flash-preview',
		contents: `Generate a list of exactly 100 most essential and frequently used words for learning ${targetLang}. 
    For each word, provide:
    1. "word": The word in ${targetLang}. 
       - For logographic or non-Latin scripts (Chinese, Japanese, Hindi, Arabic, Russian, Bengali), include the Romanized pronunciation (Pinyin, Romaji, etc.) in brackets using only Latin alphabet/English letters.
       - IMPORTANT: NEVER use Korean characters (Hangul) for pronunciation. Always use lowercase for the Romanization inside brackets.
    2. "meaning": The primary meaning in Korean.
    3. "example": A simple, natural example sentence in ${targetLang}.
    
    Format the response as a JSON array of objects with keys: "word", "meaning", "example".`,
		config: {
			responseMimeType: 'application/json',
			responseSchema: {
				type: Type.ARRAY,
				items: {
					type: Type.OBJECT,
					properties: {
						word: { type: Type.STRING },
						meaning: { type: Type.STRING },
						example: { type: Type.STRING },
					},
					required: ['word', 'meaning', 'example'],
				},
			},
		},
	});

	try {
		return JSON.parse(response.text || '[]');
	} catch (e) {
		console.error('Failed to parse AI response', e);
		return [];
	}
}

/**
 * Search for word details using Google Search grounding
 */
export async function lookupWord(
	word: string,
	language: Language
): Promise<{ entry: Partial<WordEntry>; sources: any[] }> {
	const ai = getAI();
	const targetLangName = langNames[language] || 'English';

	const response = await ai.models.generateContent({
		model: 'gemini-3-flash-preview',
		contents: `Give me the primary Korean meaning and one natural ${targetLangName} example sentence for the word: "${word}". 
    The example sentence MUST be in ${targetLangName}. 
    If you provide pronunciation for the word, the lowercase Latin alphabet (Romanization) in brackets. 
    NEVER use Korean characters for pronunciation.
    Format your response as JSON with "meaning" and "example" keys.`,
		config: {
			tools: [{ googleSearch: {} }],
			responseMimeType: 'application/json',
			responseSchema: {
				type: Type.OBJECT,
				properties: {
					meaning: { type: Type.STRING },
					example: { type: Type.STRING },
				},
				required: ['meaning', 'example'],
			},
		},
	});

	const data = JSON.parse(response.text || '{}');
	const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

	return {
		entry: {
			word,
			meaning: data.meaning,
			example: data.example,
		},
		sources,
	};
}

/**
 * Generate Speech for a word or sentence
 */
export async function generateSpeech(text: string): Promise<Uint8Array> {
	const ai = getAI();
	const response = await ai.models.generateContent({
		model: 'gemini-2.5-flash-preview-tts',
		contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
		config: {
			responseModalities: [Modality.AUDIO],
			speechConfig: {
				voiceConfig: {
					prebuiltVoiceConfig: { voiceName: 'Kore' },
				},
			},
		},
	});

	const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
	if (!base64Audio) throw new Error('No audio data received');

	return decodeBase64ToUint8(base64Audio);
}

// Helper: Encode Uint8Array to Base64 following manual implementation guidelines
export function encodeUint8ToBase64(bytes: Uint8Array): string {
	let binary = '';
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

// Helper: Decode Base64 to Uint8Array following manual implementation guidelines
export function decodeBase64ToUint8(base64: string): Uint8Array {
	const binaryString = atob(base64);
	const len = binaryString.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
}

// Helper: Decode PCM Audio
export async function decodeAudioData(
	data: Uint8Array,
	ctx: AudioContext,
	sampleRate: number = 24000,
	numChannels: number = 1
): Promise<AudioBuffer> {
	const dataInt16 = new Int16Array(data.buffer);
	const frameCount = dataInt16.length / numChannels;
	const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

	for (let channel = 0; channel < numChannels; channel++) {
		const channelData = buffer.getChannelData(channel);
		for (let i = 0; i < frameCount; i++) {
			channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
		}
	}
	return buffer;
}
