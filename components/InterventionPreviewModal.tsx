
import React, { useEffect, useState } from 'react';
import { InterventionItem, InterventionType } from '../types';
import { getPlaceInfo } from '../services/geminiService';

interface Props {
  item: InterventionItem;
  isOpen: boolean;
  onClose: () => void;
  onStartExperience: (type: InterventionType) => void;
}

export const InterventionPreviewModal: React.FC<Props> = ({ item, isOpen, onClose, onStartExperience }) => {
  const [placeInfo, setPlaceInfo] = useState<{ text: string; links: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchInfo = async () => {
        setLoading(true);
        const info = await getPlaceInfo(item.location);
        setPlaceInfo(info);
        setLoading(false);
      };
      fetchInfo();
    }
  }, [item.location, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-6 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-[4rem] max-w-5xl w-full flex flex-col md:flex-row shadow-3xl overflow-hidden max-h-[90vh] animate-scale-up">
        
        {/* hero Section */}
        <div className="md:w-5/12 relative min-h-[300px] md:min-h-full overflow-hidden">
          <img 
            src={item.mediaUrl || "https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=800"} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[5s] hover:scale-110"
            alt={item.location}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
          
          <div className="absolute top-8 left-8 flex gap-2">
             <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md border 
               ${item.authorType === 'artist' ? 'bg-emerald-600/80 border-emerald-500/30' : item.authorType === 'ai' ? 'bg-teal-600/80 border-teal-500/30' : 'bg-amber-600/80 border-amber-500/30'}`}>
               {item.authorType === 'artist' ? 'ريشة فنان' : item.authorType === 'ai' ? 'ذكاء اصطناعي' : 'إبداع هجين ✨'}
             </span>
          </div>

          <div className="absolute bottom-10 right-10 text-right z-10 space-y-2">
            <h2 className="text-4xl font-black text-white leading-tight">{item.location.split('،')[0]}</h2>
            {item.artistName && (
              <p className="text-teal-300 font-bold text-lg">بواسطة الفنان: {item.artistName}</p>
            )}
          </div>
        </div>

        {/* Info Content */}
        <div className="md:w-7/12 p-10 md:p-16 overflow-y-auto custom-scrollbar flex flex-col justify-between text-right space-y-12">
          <div className="space-y-10">
            <div className="flex justify-between items-start">
               <button onClick={onClose} className="p-3 bg-slate-800 hover:bg-white hover:text-slate-950 rounded-2xl transition-all shadow-xl">×</button>
               <div className="text-right">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-2">رؤية المنسق الثقافي</span>
                  <div className="h-1 w-12 bg-teal-500 mr-0 ml-auto rounded-full"></div>
               </div>
            </div>

            {item.curatorNote ? (
              <div className="space-y-4 animate-fade-in">
                 <p className="font-amiri text-3xl text-slate-100 leading-relaxed italic pr-6 border-r-2 border-teal-500/20">
                   "{item.curatorNote}"
                 </p>
              </div>
            ) : (
              <p className="text-slate-400 font-medium italic">لم يتم إدراج سرد ثقافي لهذا الموقع بعد.</p>
            )}

            <div className="space-y-6 pt-10 border-t border-slate-800/50">
              <h3 className="text-lg font-black text-white flex items-center gap-3 justify-end">
                خلفية تاريخية ومكانية 
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              </h3>
              {loading ? (
                <div className="space-y-3">
                  <div className="h-3 bg-slate-800 rounded-full w-full animate-pulse"></div>
                  <div className="h-3 bg-slate-800 rounded-full w-5/6 animate-pulse"></div>
                </div>
              ) : (
                <p className="text-slate-400 leading-relaxed font-medium text-sm">
                  {placeInfo?.text}
                </p>
              )}
            </div>
          </div>

          <div className="pt-10 flex flex-col sm:flex-row-reverse gap-4">
            <button 
              onClick={() => { onStartExperience(item.type); onClose(); }}
              className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-3xl shadow-teal-600/30 transition-all active:scale-95"
            >
              دخول التجربة الغامرة 🎧
            </button>
            <button 
              onClick={onClose}
              className="px-12 bg-slate-800 hover:bg-slate-750 text-slate-400 py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all"
            >
              العودة
            </button>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scale-up { animation: scaleUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}} />
    </div>
  );
};
