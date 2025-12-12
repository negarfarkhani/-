import React from 'react';
import { TranslationHistoryItem } from '../types';
import { Clock, ArrowLeft, Trash2 } from 'lucide-react';

interface HistoryPanelProps {
  history: TranslationHistoryItem[];
  onClearHistory: () => void;
  onSelectHistory: (item: TranslationHistoryItem) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onClearHistory, onSelectHistory }) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>هنوز تاریخچه‌ای وجود ندارد</p>
        <p className="text-sm opacity-60">(No history yet)</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          تاریخچه ترجمه
        </h3>
        <button 
          onClick={onClearHistory}
          className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          پاک کردن
        </button>
      </div>
      
      <div className="overflow-y-auto flex-1 p-2 space-y-2">
        {history.map((item) => (
          <div 
            key={item.id}
            onClick={() => onSelectHistory(item)}
            className="group p-3 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-indigo-50/50 cursor-pointer transition-all duration-200"
          >
            <div className="flex justify-between items-start mb-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                item.direction === 'en-to-fa' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {item.direction === 'en-to-fa' ? 'انگلیسی به فارسی' : 'فارسی به انگلیسی'}
              </span>
              <span className="text-xs text-slate-400">
                {new Date(item.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            <p className="text-sm text-slate-600 line-clamp-1 mb-1 font-medium" dir={item.direction === 'en-to-fa' ? 'ltr' : 'rtl'}>
              {item.sourceText}
            </p>
            <div className="flex items-center gap-2 text-slate-400">
                <ArrowLeft className="w-3 h-3 rotate-[-90deg] md:rotate-0" /> 
            </div>
            <p className="text-sm text-slate-800 line-clamp-1 mt-1" dir={item.direction === 'en-to-fa' ? 'rtl' : 'ltr'}>
              {item.translatedText}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryPanel;