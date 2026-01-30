
import React, { useState, useRef, useEffect } from 'react';
import { WordEntry } from '../types';
import { getAI, encodeUint8ToBase64, decodeAudioData } from '../services/geminiService';
import { LiveServerMessage, Modality } from '@google/genai';

interface LiveStudyBuddyProps {
  words: WordEntry[];
  listName: string;
}

const LiveStudyBuddy: React.FC<LiveStudyBuddyProps> = ({ words, listName }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcriptions, setTranscriptions] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('대기 중...');
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startSession = async () => {
    try {
      setStatus('연결 중...');
      const ai = getAI();
      
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioCtxRef.current = outputAudioContext;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setStatus('연결됨! 대화해보세요.');
            
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBase64 = encodeUint8ToBase64(new Uint8Array(int16.buffer));
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: { data: pcmBase64, mimeType: 'audio/pcm;rate=16000' } });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle transcriptions
            if (message.serverContent?.outputTranscription) {
               setTranscriptions(prev => [...prev.slice(-10), `🤖: ${message.serverContent!.outputTranscription!.text}`]);
            } else if (message.serverContent?.inputTranscription) {
               setTranscriptions(prev => [...prev.slice(-10), `👤: ${message.serverContent!.inputTranscription!.text}`]);
            }

            // Handle audio output
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const bytes = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const buffer = await decodeAudioData(bytes, outputAudioContext);
              const source = outputAudioContext.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAudioContext.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error(e);
            setStatus('오류가 발생했습니다.');
            stopSession();
          },
          onclose: () => {
            setStatus('세션이 종료되었습니다.');
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: `당신은 친절한 영어 학습 도우미입니다. 
          사용자의 "${listName}" 단어장에는 다음과 같은 단어들이 있습니다: ${words.map(w => w.word).join(', ')}. 
          이 단어들을 활용해서 대화를 나누거나, 퀴즈를 내거나, 예문을 만들어보세요. 
          한국어로 친절하게 대화하되 영어 학습을 장려하세요.`
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus('마이크 접근 권한이 필요하거나 연결에 실패했습니다.');
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch(e) {}
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
    setStatus('대기 중...');
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">AI Study Buddy</h2>
            <p className="text-indigo-100 text-sm">{status}</p>
          </div>
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-400'}`}></div>
        </div>

        <div className="h-96 overflow-y-auto p-6 space-y-4 bg-slate-50 flex flex-col-reverse">
          <div className="flex flex-col space-y-4">
            {transcriptions.length === 0 && !isActive && (
              <div className="text-center text-slate-400 py-12">
                <p>마이크 버튼을 눌러 학습 도우미와 대화를 시작하세요!</p>
                <p className="text-xs mt-2">"{listName}" 단어장의 단어들로 퀴즈를 내거나 대화할 수 있습니다.</p>
              </div>
            )}
            {transcriptions.map((t, i) => (
              <div key={i} className={`p-3 rounded-xl max-w-[85%] ${t.startsWith('🤖') ? 'bg-indigo-100 text-indigo-800 self-start rounded-tl-none' : 'bg-white shadow-sm border border-slate-200 self-end rounded-tr-none'}`}>
                {t}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-center bg-white">
          {!isActive ? (
            <button
              onClick={startSession}
              className="flex items-center space-x-3 px-8 py-4 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>대화 시작하기</span>
            </button>
          ) : (
            <button
              onClick={stopSession}
              className="flex items-center space-x-3 px-8 py-4 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 transition-all shadow-lg hover:shadow-red-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>대화 종료하기</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="mt-6 bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start space-x-3">
        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>팁:</strong> "{listName}" 단어장에 있는 단어들을 소리내어 읽어보거나, 그 단어가 무슨 뜻인지 AI에게 물어보세요. 
        </p>
      </div>
    </div>
  );
};

export default LiveStudyBuddy;
