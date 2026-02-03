
import React, { useMemo } from 'react';
import { InterventionItem } from '../types';

interface Props {
  items: InterventionItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const TourShareModal: React.FC<Props> = ({ items, isOpen, onClose }) => {
  const tourUrl = useMemo(() => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('view', 'tour');
    url.searchParams.set('stops', items.map(i => i.id).join(','));
    url.searchParams.set('mode', 'curated');
    return url.toString();
  }, [items]);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(tourUrl)}&color=d97706&bgcolor=ffffff`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-[3rem] max-w-3xl w-full overflow-hidden shadow-3xl flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-800 flex items-center justify-between">
          <button onClick={onClose} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-400">إغلاق</button>
          <div className="text-right">
            <h4 className="text-2xl font-black text-white">منظم <span className="text-amber-500">الجولات المنسقة</span></h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Curated Tour QR Generator</p>
          </div>
        </div>

        <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="bg-white p-8 rounded-[3rem] shadow-2xl shrink-0 group hover:scale-105 transition-transform duration-500 relative">
              <div className="absolute -top-4 -right-4 bg-amber-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg">جولة منسقة</div>
              <img src={qrUrl} alt="Tour QR Code" className="w-56 h-56" />
            </div>

            <div className="space-y-8 flex-1 text-right">
              <div className="space-y-4">
                <h5 className="text-white font-black text-xl">ملخص الجولة المنسقة</h5>
                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                      <div className="text-2xl font-black text-amber-500">{items.length}</div>
                      <div className="text-[9px] text-slate-500 font-black uppercase">إجمالي المحطات</div>
                   </div>
                   <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                      <div className="text-2xl font-black text-amber-500">{(items.length * 15)}</div>
                      <div className="text-[9px] text-slate-500 font-black uppercase">الزمن التقديري (د)</div>
                   </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">الرابط المباشر للمسار</label>
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 font-mono text-[9px] text-amber-400 break-all select-all">
                  {tourUrl}
                </div>
              </div>

              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar border-t border-slate-800 pt-4">
                <p className="text-slate-500 text-[10px] font-black uppercase mb-2">المحطات المشمولة:</p>
                {items.map((item, idx) => (
                  <div key={item.id} className="text-slate-400 text-xs py-1 border-b border-slate-800/50">
                    {idx + 1}. {item.location}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => window.open(tourUrl, '_blank')}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-amber-600/20 transition-all flex items-center justify-center gap-3"
            >
              معاينة الجولة 🧭
            </button>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(tourUrl);
                alert("تم نسخ رابط الجولة!");
              }}
              className="px-8 bg-slate-800 hover:bg-slate-700 text-white py-5 rounded-[2rem] font-black text-xs uppercase transition-all"
            >
              نسخ الرابط
            </button>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d97706; border-radius: 10px; }
      `}} />
    </div>
  );
};
