
import React from 'react';

interface Props {
  onConfigChange: (updates: any) => void;
}

export const UIFurnishingBox: React.FC<Props> = ({ onConfigChange }) => {
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl text-right">
      <div className="flex items-center gap-3 justify-end">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Personalize UI</span>
        <h5 className="text-white font-black text-sm">مربع تأثيث الواجهة</h5>
        <span className="text-xl">🎨</span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[9px] font-black text-slate-500 uppercase block mb-3">هوية اللون الرئيسية</label>
          <div className="flex gap-2 justify-end">
            {['#4f46e5', '#f43f5e', '#10b981', '#f59e0b'].map(c => (
              <button 
                key={c} 
                onClick={() => onConfigChange({ primaryColor: c })}
                className="w-8 h-8 rounded-full border border-white/10 shadow-lg transition-transform hover:scale-110" 
                style={{ backgroundColor: c }} 
              />
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-800">
           <button 
             onClick={() => onConfigChange({ glassEffect: true })}
             className="px-4 py-2 bg-slate-800 rounded-xl text-[9px] font-black text-slate-400 hover:text-white"
           >
             نمط زجاجي
           </button>
           <button 
             onClick={() => onConfigChange({ fontFamily: 'Amiri' })}
             className="px-4 py-2 bg-slate-800 rounded-xl text-[9px] font-black text-slate-400 hover:text-white"
           >
             خط تراثي
           </button>
        </div>
      </div>
    </div>
  );
};
