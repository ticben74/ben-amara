
import React from 'react';
import { CuratedTour } from '../types';

interface Props {
  currentTourId: string;
  allTours: CuratedTour[];
  onSelectTour: (tour: CuratedTour) => void;
  primaryColor?: string;
}

export const DiscoveryHub: React.FC<Props> = ({ currentTourId, allTours, onSelectTour, primaryColor = '#4f46e5' }) => {
  const suggestedTours = allTours.filter(t => t.id !== currentTourId).slice(0, 2);

  return (
    <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-10 space-y-10 shadow-3xl text-right animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-[60px] -mr-16 -mt-16 rounded-full"></div>
      
      <div className="flex items-center justify-between relative z-10">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Discovery Hub</span>
        <h5 className="text-white font-black text-xl">استكمل <span style={{ color: primaryColor }}>الرحلة</span></h5>
      </div>

      {/* قسم الجولات الأخرى */}
      <div className="space-y-4 relative z-10">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-4 border-r-2 border-slate-700 pr-3">جولات قد تنال إعجابك</label>
        <div className="grid grid-cols-1 gap-3">
          {suggestedTours.map(tour => (
            <button 
              key={tour.id}
              onClick={() => onSelectTour(tour)}
              className="group flex items-center justify-between p-5 bg-slate-950/40 border border-slate-800 rounded-2xl hover:border-indigo-500/50 transition-all text-right"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs group-hover:bg-indigo-600 transition-colors">🧭</div>
              <div className="flex-1 px-4">
                <h6 className="text-white font-black text-sm group-hover:text-indigo-300 transition-colors">{tour.name}</h6>
                <p className="text-[10px] text-slate-500 font-bold">{tour.city} • {tour.stops.length} محطات</p>
              </div>
            </button>
          ))}
          {suggestedTours.length === 0 && <p className="text-slate-600 text-xs italic pr-4">لا توجد جولات أخرى متاحة حالياً.</p>}
        </div>
      </div>

      {/* قسم المتجر الرقمي */}
      <div className="pt-6 border-t border-slate-800 relative z-10">
        <div 
          className="relative group cursor-pointer overflow-hidden rounded-[2rem] p-8 bg-gradient-to-br from-slate-800 to-slate-950 border border-amber-500/20 shadow-2xl hover:scale-[1.02] transition-all"
          onClick={() => window.open('https://store.urbaninterventions.art', '_blank')}
        >
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.1),transparent)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-amber-500 text-white rounded-2xl flex items-center justify-center text-3xl shadow-xl rotate-3 group-hover:rotate-0 transition-transform">🛍️</div>
            <div className="flex-1">
              <h6 className="text-amber-500 font-black text-lg">متجر المدينة الإبداعي</h6>
              <p className="text-slate-400 text-xs font-medium leading-relaxed">اقتنِ تذكارات، لوحات فنية، أو كُتب سردية مستوحاة من هذه الجولة.</p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <span className="text-[10px] font-black bg-amber-500/10 text-amber-500 px-4 py-2 rounded-full uppercase tracking-widest border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white transition-all">تصفح المنتجات ←</span>
          </div>
        </div>
      </div>
    </div>
  );
};
