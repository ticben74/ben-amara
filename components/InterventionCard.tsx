
import React from 'react';
import { Info } from 'lucide-react';

interface Props {
  id: number;
  title: string;
  description: string;
  location: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

export const InterventionCard: React.FC<Props> = ({ id, title, description, location, icon, active, onClick }) => {
  return (
    <div className="relative group/card w-full">
      <button
        onClick={onClick}
        className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-500 text-right w-full border border-slate-700
          ${active ? 'bg-indigo-600/20 ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-slate-800/40 hover:bg-slate-800/60'}`}
      >
        <div className="flex items-center gap-4 mb-3">
          <div className={`p-3 rounded-xl transition-colors ${active ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-indigo-300'}`}>
            {icon}
          </div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">التدخل {id}</span>
        </div>
        <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-300 transition-colors">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
        
        {active && (
          <div className="absolute top-2 left-2">
            <div className="flex space-x-1 rtl:space-x-reverse">
               <div className="w-1 h-3 bg-indigo-400 animate-bounce [animation-delay:-0.3s]"></div>
               <div className="w-1 h-5 bg-indigo-400 animate-bounce [animation-delay:-0.15s]"></div>
               <div className="w-1 h-4 bg-indigo-400 animate-bounce"></div>
            </div>
          </div>
        )}

        {/* Helper text for active state */}
        {active && (
          <div className="mt-4 pt-4 border-t border-slate-700/50 text-[10px] text-indigo-400 font-bold animate-pulse">
            جاري عرض المحاكاة التفاعلية...
          </div>
        )}
      </button>

      {/* Info Icon and Tooltip */}
      <div className="absolute top-4 left-4 z-20 group/tooltip">
        <div className="w-8 h-8 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:bg-indigo-500 hover:text-white hover:border-indigo-400 cursor-help transition-all shadow-lg backdrop-blur-sm">
          <Info size={14} />
        </div>
        
        {/* Tooltip Content */}
        <div className="absolute bottom-full left-0 mb-3 w-56 p-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl opacity-0 scale-90 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100 transition-all duration-300 origin-bottom-left z-30">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></div>
            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">تفاصيل الموقع</div>
          </div>
          <div className="text-xs text-white leading-relaxed font-bold mb-2">{location}</div>
          <div className="text-[9px] text-slate-500 leading-tight">
            انقر على البطاقة لتفعيل تجربة المحاكاة في هذا الموقع.
          </div>
          {/* Tooltip Arrow */}
          <div className="absolute top-full left-3 w-3 h-3 bg-slate-900 border-r border-b border-slate-700 rotate-45 -translate-y-1.5"></div>
        </div>
      </div>
    </div>
  );
};
