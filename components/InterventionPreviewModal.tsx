
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
      <div className="bg-slate-900 border border-slate-800 rounded-[3rem] max-w-4xl w-full flex flex-col md:flex-row-reverse shadow-3xl overflow-hidden max-h-[90vh] animate-scale-up">
        
        {/* Hero Section */}
        <div className="md:w-1/2 relative min-h-[250px] md:min-h-full overflow-hidden">
          <img 
            src={item.mediaUrl || "https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=800"} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[5s] hover:scale-110"
            alt={item.location}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
          <button 
            onClick={onClose}
            className="absolute top-6 left-6 p-4 bg-slate-900/50 hover:bg-slate-900/80 rounded-full text-white backdrop-blur-md border border-white/10 transition-all z-20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="absolute bottom-8 right-8 text-right z-10">
            <span className="bg-indigo-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white mb-3 inline-block">
              {item.type === InterventionType.BENCH ? 'مقعد حكايا' : item.type === InterventionType.MURAL ? 'جدارية بصرية' : 'مسار ثقافي'}
            </span>
            <h2 className="text-3xl font-black text-white">{item.location}</h2>
          </div>
        </div>

        {/* Info Content */}
        <div className="md:w-1/2 p-8 md:p-12 overflow-y-auto custom-scrollbar flex flex-col justify-between text-right">
          <div className="space-y-8">
            <div className="flex gap-4 justify-end">
              <div className="text-center">
                <div className="text-xl font-black text-white">{item.interactCount}</div>
                <div className="text-[9px] text-slate-500 font-bold uppercase">تفاعل</div>
              </div>
              <div className="w-px h-10 bg-slate-800"></div>
              <div className="text-center">
                <div className="text-xl font-black text-white">٢.٣ كم</div>
                <div className="text-[9px] text-slate-500 font-bold uppercase">المسافة</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-black text-indigo-400">عن المكان والتاريخ</h3>
              {loading ? (
                <div className="space-y-3">
                  <div className="h-3 bg-slate-800 rounded-full w-full animate-pulse"></div>
                  <div className="h-3 bg-slate-800 rounded-full w-5/6 animate-pulse"></div>
                  <div className="h-3 bg-slate-800 rounded-full w-4/6 animate-pulse"></div>
                </div>
              ) : (
                <p className="text-slate-400 leading-relaxed font-medium text-sm line-clamp-6">
                  {placeInfo?.text}
                </p>
              )}
            </div>

            {!loading && placeInfo?.links && placeInfo.links.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-end">
                {placeInfo.links.map((link, idx) => (
                  <a key={idx} href={link.uri} target="_blank" rel="noreferrer" className="text-[10px] bg-slate-800 hover:bg-slate-750 text-indigo-300 border border-slate-700 px-3 py-1.5 rounded-lg transition-all">
                    🔗 {link.title}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="pt-10 flex flex-col gap-3">
            <button 
              onClick={() => { onStartExperience(item.type); onClose(); }}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.02]"
            >
              بدء التجربة الكاملة 🎧
            </button>
            <button 
              onClick={onClose}
              className="w-full bg-slate-800 hover:bg-slate-750 text-slate-400 py-4 rounded-2xl font-black text-xs uppercase transition-all"
            >
              العودة
            </button>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-scale-up {
          animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}} />
    </div>
  );
};
