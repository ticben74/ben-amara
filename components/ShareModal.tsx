
import React, { useMemo, useState } from 'react';
import { InterventionItem } from '../types';

interface Props {
  item: InterventionItem;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<Props> = ({ item, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  const landingUrl = useMemo(() => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('view', 'landing');
    url.searchParams.set('id', item.id);
    return url.toString();
  }, [item.id]);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(landingUrl)}&color=4f46e5&bgcolor=ffffff&margin=10`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(landingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-[3rem] max-w-2xl w-full overflow-hidden shadow-3xl flex flex-col animate-scale-up">
        <div className="p-8 border-b border-slate-800 flex items-center justify-between">
          <button onClick={onClose} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-400 transition-colors">
            إغلاق
          </button>
          <div className="text-right">
            <h4 className="text-2xl font-black text-white">مركز <span className="text-indigo-500">الترويج الرقمي</span></h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Landing Page & QR Generator</p>
          </div>
        </div>

        <div className="p-10 space-y-10">
          <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl shrink-0 group hover:rotate-2 transition-transform duration-500 border border-indigo-100">
              <img src={qrUrl} alt="QR Code" className="w-48 h-48" crossOrigin="anonymous" />
              <div className="mt-4 text-center">
                <a 
                  href={qrUrl} 
                  target="_blank"
                  rel="noreferrer"
                  download={`QR_${item.id}.png`}
                  className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                >
                  فتح الرمز كصورة مستقلة
                </a>
              </div>
            </div>

            <div className="space-y-6 flex-1 text-right">
              <div>
                <h5 className="text-white font-black text-lg mb-2">رابط صفحة الهبوط الذكية</h5>
                <div 
                  onClick={copyToClipboard}
                  className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 font-mono text-[10px] text-indigo-400 break-all select-all shadow-inner relative group cursor-pointer hover:bg-slate-900 transition-colors"
                >
                  {landingUrl}
                  <div className={`absolute inset-0 bg-emerald-500/90 flex items-center justify-center rounded-2xl transition-opacity ${copied ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                     <span className="text-white font-black text-xs uppercase tracking-widest">تم النسخ بنجاح! ✓</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-slate-400 text-sm leading-relaxed">
                  هذا الرابط سيوجه الزوار إلى صفحة مخصصة لهذا التدخل ({item.location}) تحتوي على كافة التفاصيل التفاعلية وبدء التجربة فوراً.
                </p>
                <div className="flex gap-2 justify-end">
                   <button onClick={copyToClipboard} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[10px] font-black text-white transition-all">نسخ الرابط</button>
                   <span className="px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[10px] font-black text-indigo-400 uppercase">متوافق مع الهواتف</span>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => window.open(landingUrl, '_blank')}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[2rem] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <span>معاينة صفحة الهبوط الحية</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
