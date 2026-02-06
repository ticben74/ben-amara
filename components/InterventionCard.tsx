
import React from 'react';

interface Props {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

export const InterventionCard: React.FC<Props> = ({ id, title, description, icon, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-500 text-right w-full border border-slate-700
        ${active ? 'bg-teal-600/20 ring-2 ring-teal-500 shadow-lg shadow-teal-500/20' : 'bg-slate-800/40 hover:bg-slate-800/60'}`}
    >
      <div className="flex items-center gap-4 mb-3">
        <div className={`p-3 rounded-xl transition-colors ${active ? 'bg-teal-500 text-white' : 'bg-slate-700 text-teal-300'}`}>
          {icon}
        </div>
        <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">التدخل {id}</span>
      </div>
      <h3 className="text-xl font-bold mb-2 group-hover:text-teal-300 transition-colors">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
      
      {active && (
        <div className="absolute top-2 left-2">
          <div className="flex space-x-1 rtl:space-x-reverse">
             <div className="w-1 h-3 bg-teal-400 animate-bounce [animation-delay:-0.3s]"></div>
             <div className="w-1 h-5 bg-teal-400 animate-bounce [animation-delay:-0.15s]"></div>
             <div className="w-1 h-4 bg-teal-400 animate-bounce"></div>
          </div>
        </div>
      )}
    </button>
  );
};
