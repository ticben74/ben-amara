
import React, { useState } from 'react';

export const CompetitionBox: React.FC = () => {
  const [score, setScore] = useState(0);
  const [voted, setVoted] = useState(false);

  return (
    <div className="bg-slate-900/80 border border-indigo-500/30 rounded-[2.5rem] p-8 space-y-6 shadow-3xl animate-fade-in relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
      
      <div className="flex justify-between items-center">
        <div className="bg-indigo-600 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">تحدي حي!</div>
        <h5 className="text-white font-black text-lg">مربع المسابقة المكانية</h5>
      </div>

      <div className="space-y-4">
        <p className="text-slate-400 text-xs leading-relaxed text-right">أي من هذه العناصر المعمارية كان يشتهر به هذا الزقاق في العصر المملوكي؟</p>
        <div className="grid grid-cols-1 gap-2">
           {['المشربيات الخشبية', 'العقود المدببة', 'الأبواب المصفحة'].map((opt, i) => (
             <button 
               key={i} 
               onClick={() => { setVoted(true); if(i===0) setScore(s => s+10); }}
               className={`w-full p-4 rounded-2xl text-right text-xs font-bold transition-all border ${voted ? 'opacity-50 pointer-events-none' : 'bg-slate-800 border-slate-700 hover:border-indigo-500'}`}
             >
               {opt}
             </button>
           ))}
        </div>
      </div>

      {voted && (
        <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
           <span className="text-emerald-400 font-black text-xs">رصيدك: {score} نقطة</span>
           <span className="text-slate-500 text-[9px] font-bold uppercase">المركز: #12 في الحي</span>
        </div>
      )}
    </div>
  );
};
