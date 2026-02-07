
import React from 'react';
import { CustomLink } from '../types';

interface Props {
  links?: CustomLink[];
}

const FALLBACK_LINKS: CustomLink[] = [
  { id: 'f1', title: 'دليل النكهات المحلي', url: '#', icon: '🍜', color: 'bg-orange-600' },
  { id: 'f2', title: 'المتجر الإلكتروني', url: 'https://store.urbaninterventions.art', icon: '🛍️', color: 'bg-amber-600' }
];

export const SmartLinkBox: React.FC<Props> = ({ links = [] }) => {
  const displayLinks = links.length > 0 ? links : FALLBACK_LINKS;

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 space-y-8 shadow-3xl text-right animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl -mr-12 -mt-12 rounded-full"></div>
      
      <div className="flex items-center justify-between border-b border-white/10 pb-6 relative z-10">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Contextual Resources</span>
        <h5 className="text-white font-black text-lg">روابط وتوصيات الجولة</h5>
      </div>

      <div className="grid grid-cols-1 gap-4 relative z-10">
        {displayLinks.map(link => (
          <button 
            key={link.id}
            onClick={() => window.open(link.url, '_blank')}
            className="flex items-center gap-5 p-5 bg-slate-950/60 border border-slate-800/50 rounded-[2rem] hover:border-white/20 transition-all group shadow-xl"
          >
            <div className={`w-14 h-14 ${link.color || 'bg-indigo-600'} rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-black/40 group-hover:scale-110 group-hover:rotate-3 transition-transform`}>
              {link.icon || '🔗'}
            </div>
            <div className="flex-1 text-right">
              <h6 className="text-white font-black text-sm group-hover:text-indigo-300 transition-colors">{link.title}</h6>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">اضغط للتوجيه الخارجي</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
              ←
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
