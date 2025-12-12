import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRightLeft, Copy, Check, Sparkles, AlertCircle, RotateCcw } from 'lucide-react';
import { translateText } from './services/geminiService';
import { Language, TranslationState, TranslationHistoryItem } from './types';
import HistoryPanel from './components/HistoryPanel';

// Utility for generating unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function App() {
  const [state, setState] = useState<TranslationState>({
    sourceText: '',
    translatedText: '',
    isLoading: false,
    error: null,
    direction: 'en-to-fa'
  });

  const [history, setHistory] = useState<TranslationHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('translationHistory');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [copied, setCopied] = useState(false);

  // Persist history
  useEffect(() => {
    localStorage.setItem('translationHistory', JSON.stringify(history));
  }, [history]);

  const handleTranslate = async () => {
    if (!state.sourceText.trim()) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const targetLang = state.direction === 'en-to-fa' ? Language.PERSIAN : Language.ENGLISH;
      const result = await translateText(state.sourceText, targetLang);

      setState(prev => ({ ...prev, translatedText: result, isLoading: false }));

      // Add to history
      const newItem: TranslationHistoryItem = {
        id: generateId(),
        sourceText: state.sourceText,
        translatedText: result,
        direction: state.direction,
        timestamp: Date.now()
      };
      
      setHistory(prev => [newItem, ...prev].slice(0, 50)); // Keep last 50
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: "خطا در برقراری ارتباط با هوش مصنوعی. لطفا مجددا تلاش کنید." 
      }));
    }
  };

  const handleSwapLanguages = () => {
    setState(prev => ({
      ...prev,
      sourceText: prev.translatedText, // Swap text if user wants to refine back-translation
      translatedText: prev.sourceText,
      direction: prev.direction === 'en-to-fa' ? 'fa-to-en' : 'en-to-fa',
      error: null
    }));
  };

  const handleCopy = async () => {
    if (!state.translatedText) return;
    try {
      await navigator.clipboard.writeText(state.translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleHistorySelect = (item: TranslationHistoryItem) => {
    setState(prev => ({
      ...prev,
      sourceText: item.sourceText,
      translatedText: item.translatedText,
      direction: item.direction,
      error: null
    }));
  };

  const handleClearHistory = () => {
    if (confirm('آیا مطمئن هستید که می‌خواهید تاریخچه را پاک کنید؟')) {
      setHistory([]);
    }
  };

  const handleClearInput = () => {
    setState(prev => ({ ...prev, sourceText: '', translatedText: '', error: null }));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Sparkles size={18} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              مترجم <span className="text-indigo-600">هوشمند</span>
            </h1>
          </div>
          <div className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
            Powered by Gemini Flash 2.5
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Translator Area */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Controls */}
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
             <div className="flex items-center flex-1 justify-center gap-4">
                <span className={`text-sm font-medium transition-colors ${state.direction === 'en-to-fa' ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
                  English
                </span>
                
                <button 
                  onClick={handleSwapLanguages}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-all active:scale-95"
                  title="جابجایی زبان"
                >
                  <ArrowRightLeft size={18} />
                </button>

                <span className={`text-sm font-medium transition-colors ${state.direction === 'fa-to-en' ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
                  فارسی
                </span>
             </div>
          </div>

          {/* Input/Output Container */}
          <div className="flex flex-col md:flex-row gap-4 h-[500px] md:h-[400px]">
            
            {/* Source Input */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden focus-within:ring-2 focus-within:ring-indigo-100 transition-shadow relative">
              <div className="p-3 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  {state.direction === 'en-to-fa' ? 'Source (English)' : 'ورودی (فارسی)'}
                </span>
                {state.sourceText && (
                  <button onClick={handleClearInput} className="text-slate-400 hover:text-slate-600">
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>
              <textarea
                className="flex-1 w-full p-4 resize-none outline-none text-slate-700 bg-transparent text-lg leading-relaxed placeholder:text-slate-300"
                placeholder={state.direction === 'en-to-fa' ? "Type something to translate..." : "متنی برای ترجمه بنویسید..."}
                dir={state.direction === 'en-to-fa' ? 'ltr' : 'rtl'}
                value={state.sourceText}
                onChange={(e) => setState(prev => ({ ...prev, sourceText: e.target.value }))}
              />
              <div className="p-3 bg-white flex justify-between items-center">
                <span className="text-xs text-slate-300">
                  {state.sourceText.length} کاراکتر
                </span>
                <button
                  onClick={handleTranslate}
                  disabled={!state.sourceText.trim() || state.isLoading}
                  className={`px-6 py-2 rounded-xl text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all
                    ${!state.sourceText.trim() || state.isLoading 
                      ? 'bg-slate-300 shadow-none cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-300 active:scale-95'
                    }`}
                >
                  {state.isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      در حال ترجمه...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      ترجمه کن
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Target Output */}
            <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col overflow-hidden relative group">
               <div className="p-3 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  {state.direction === 'en-to-fa' ? 'ترجمه (فارسی)' : 'Translation (English)'}
                </span>
                <button 
                  onClick={handleCopy}
                  disabled={!state.translatedText}
                  className={`text-slate-400 hover:text-indigo-600 transition-colors ${copied ? 'text-emerald-500' : ''}`}
                  title="کپی متن"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              
              <div className="flex-1 w-full p-4 relative overflow-y-auto">
                 {state.isLoading ? (
                   <div className="space-y-3 animate-pulse mt-2">
                     <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                     <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                     <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                   </div>
                 ) : state.error ? (
                   <div className="h-full flex flex-col items-center justify-center text-red-500 gap-2 p-4 text-center">
                     <AlertCircle size={24} />
                     <p className="text-sm">{state.error}</p>
                   </div>
                 ) : state.translatedText ? (
                   <p 
                    className="text-lg leading-relaxed text-slate-800 whitespace-pre-wrap"
                    dir={state.direction === 'en-to-fa' ? 'rtl' : 'ltr'}
                   >
                     {state.translatedText}
                   </p>
                 ) : (
                   <div className="h-full flex items-center justify-center text-slate-300 text-sm select-none">
                     {state.direction === 'en-to-fa' ? 'ترجمه اینجا نمایش داده می‌شود' : 'Translation will appear here'}
                   </div>
                 )}
              </div>
            </div>

          </div>

          {/* Quick Info */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
            <div className="bg-white p-2 rounded-full text-indigo-600 shadow-sm mt-1">
              <Sparkles size={16} />
            </div>
            <div>
              <h4 className="font-bold text-indigo-900 text-sm mb-1">ترجمه هوشمند با جمینای</h4>
              <p className="text-indigo-700/80 text-sm leading-relaxed">
                این مترجم از مدل زبانی پیشرفته Gemini 2.5 Flash استفاده می‌کند تا نه‌تنها کلمات، بلکه مفهوم جملات را با دقت بالا و لحن طبیعی ترجمه کند.
                <span className="block mt-1 opacity-70 text-xs text-left" dir="ltr">
                  (Uses advanced Gemini AI for context-aware translations)
                </span>
              </p>
            </div>
          </div>

        </div>

        {/* Sidebar (History) */}
        <div className="lg:col-span-4 h-[500px] lg:h-auto">
          <HistoryPanel 
            history={history}
            onClearHistory={handleClearHistory}
            onSelectHistory={handleHistorySelect}
          />
        </div>

      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} ParsTranslate AI. Made with ❤️ and Google Gemini.</p>
      </footer>
    </div>
  );
}