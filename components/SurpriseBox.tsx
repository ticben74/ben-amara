
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface Props {
  location: string;
  primaryColor?: string;
}

export const SurpriseBox: React.FC<Props> = ({ location, primaryColor = '#4f46e5' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [surprise, setSurprise] = useState<string | null>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const revealSurprise = async () => {
    if (surprise) { setIsOpen(true); return; }
    setLoading(true);
    setIsOpen(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `أنت خبير في "التاريخ السري" والغرائب المدفونة. أعطني معلومة واحدة مدهشة وغير معروفة للعامة عن منطقة "${location}". 
        يجب أن يكون النص قصيراً (حوالي 30 كلمة)، مشوقاً، وبنبرة "هل كنت تعلم؟". ابدأ النص مباشرة بدون مقدمات.`,
      });
      setSurprise(response.text || "هذا المكان يخبئ أسراره جيداً.. حاول لاحقاً.");
    } catch (e) {
      setSurprise("يقال أن لهذا الزقاق حارس غير مرئي يحمي ذاكرته من المتطفلين..");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-white/10 rounded-[3rem] p-10 shadow-3xl text-right animate-fade-in relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1),transparent)] pointer-events-none"></div>
      
      {!isOpen ? (
        <div className="flex flex-col items-center gap-6 py-4">
           <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-5xl shadow-inner group-hover:scale-110 transition-transform duration-500 cursor-pointer" onClick={revealSurprise}>
             🎁
           </div>
           <div className="text-center space-y-2">
             <h5 className="text-white font-black text-xl">صندوق المفاجآت المكانية</h5>
             <p className="text-slate-400 text-xs font-medium italic">انقر لفتح معلومة نادرة عن {location.split('،')[0]}</p>
           </div>
           <button 
             onClick={revealSurprise}
             className="px-8 py-3 bg-white text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-100 transition-all"
           >
             افتح الصندوق ✨
           </button>
        </div>
      ) : (
        <div className="space-y-6 animate-scale-up">
           <div className="flex justify-between items-center">
             <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white text-xl">×</button>
             <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">هل كنت تعلم؟</span>
           </div>
           
           {loading ? (
             <div className="py-8 flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] text-slate-500 font-black animate-pulse uppercase">جاري استرجاع سر تاريخي...</p>
             </div>
           ) : (
             <p className="font-amiri text-2xl text-slate-100 leading-relaxed italic border-r-4 pr-6" style={{ borderColor: primaryColor }}>
               "{surprise}"
             </p>
           )}
           
           <div className="pt-4 flex justify-end">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">Deep History AI v1.2</span>
           </div>
        </div>
      )}
    </div>
  );
};
