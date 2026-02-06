
import React, { useEffect, useState } from 'react';
import { InterventionItem, InterventionType } from '../types';
import { getPlaceInfo } from '../services/geminiService';

interface Props {
  item: InterventionItem;
  onBack: () => void;
  onStartExperience: (type: InterventionType) => void;
}

export const PublicLandingPage: React.FC<Props> = ({ item, onBack, onStartExperience }) => {
  const [placeInfo, setPlaceInfo] = useState<{ text: string; links: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      const info = await getPlaceInfo(item.location);
      setPlaceInfo(info);
      setLoading(false);
    };
    fetchInfo();
  }, [item.location]);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-200 animate-fade-in relative overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[80%] h-[500px] bg-gradient-to-b from-teal-600/10 to-transparent blur-[120px] -rotate-12 translate-x-1/2"></div>
      
      <div className="max-w-5xl mx-auto px-6 py-20 relative z-10">
        <button onClick={onBack} className="mb-12 flex items-center gap-2 text-slate-400 hover:text-white font-black text-xs uppercase tracking-widest transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5M12 19l-7-7 7-7" /></svg>
          العودة للمنصة الرئيسية
        </button>

        <div className="grid lg:grid-cols-2 gap-20 items-center mb-24">
          <div className="space-y-8 text-right order-2 lg:order-1">
            <div className="inline-block px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-black tracking-widest uppercase">
              تدخل حضري تفاعلي
            </div>
            <h1 className="text-6xl md:text-8xl font-black leading-tight text-white">
              {item.location.split('،')[0]}
            </h1>
            <p className="text-slate-400 text-xl leading-relaxed font-medium">
              استكشف روح المكان عبر مشروع "{item.type === InterventionType.PATH ? 'ممرات المشي السمعية' : 'مقاعد الحكايا'}". تجربة رقمية تعيد صياغة علاقتك بالمدينة.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-end">
              <div className="bg-slate-800/50 p-6 rounded-[2rem] border border-slate-700/50 text-center min-w-[120px]">
                <div className="text-2xl font-black text-white">{item.interactCount}</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">تفاعل حي</div>
              </div>
              <div className="bg-slate-800/50 p-6 rounded-[2rem] border border-slate-700/50 text-center min-w-[120px]">
                <div className="text-2xl font-black text-white">{item.type === InterventionType.PATH ? item.pathPoints?.length : '1'}</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">محطات ثقافية</div>
              </div>
            </div>

            <button 
              onClick={() => onStartExperience(item.type)}
              className="w-full lg:w-auto bg-teal-600 hover:bg-teal-500 text-white px-12 py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-teal-600/40 transition-all hover:scale-105"
            >
              بدء التجربة الرقمية الآن
            </button>
          </div>

          <div className="order-1 lg:order-2 relative">
             <div className="absolute inset-0 bg-teal-500/20 blur-[100px] rounded-full"></div>
             <div className="relative aspect-square rounded-[4rem] overflow-hidden border-2 border-slate-800 shadow-3xl group">
               <img 
                 src={item.mediaUrl || "https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=800"} 
                 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>
               <div className="absolute bottom-10 left-10 right-10 flex items-end justify-between">
                  <div className="text-right">
                    <div className="text-xs text-teal-400 font-bold uppercase tracking-widest">الموقع الجغرافي</div>
                    <div className="text-lg font-black text-white">{item.location}</div>
                  </div>
               </div>
             </div>
          </div>
        </div>

        {/* Gemini Spatial Intelligence Section */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-[4rem] p-12 md:p-20 relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent"></div>
           <div className="flex flex-col md:flex-row gap-12 items-start justify-between">
             <div className="flex-1 space-y-6 text-right order-2 md:order-1">
                <h3 className="text-3xl font-black text-white">عن المكان <span className="text-teal-500">& تاريخه</span></h3>
                {loading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-slate-800 rounded w-full"></div>
                    <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                    <div className="h-4 bg-slate-800 rounded w-4/6"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-slate-400 leading-relaxed font-medium text-lg whitespace-pre-line">
                      {placeInfo?.text}
                    </p>
                    {placeInfo?.links && placeInfo.links.length > 0 && (
                      <div className="pt-6 border-t border-slate-800 flex flex-wrap gap-3 justify-end">
                        {placeInfo.links.map((link, idx) => (
                          <a key={idx} href={link.uri} target="_blank" rel="noreferrer" className="bg-teal-600/10 hover:bg-teal-600/20 border border-teal-500/30 px-4 py-2 rounded-xl text-xs font-bold text-teal-400 transition-all">
                            🔗 {link.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                )}
             </div>
             <div className="w-20 h-20 bg-teal-600 rounded-3xl flex items-center justify-center shrink-0 order-1 md:order-2 shadow-2xl shadow-teal-600/20 rotate-3 group-hover:rotate-0 transition-transform">
               <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
             </div>
           </div>
        </div>

        <div className="mt-24 text-center">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">Creative Urban Interventions Initiative 2025</p>
        </div>
      </div>
    </div>
  );
};
