
import React, { useState } from 'react';
import { CuratedTour, TourUIConfig } from '../types';
import { FileUploader } from './FileUploader';

interface Props {
  tour: CuratedTour;
  onSave: (updatedTour: CuratedTour) => void;
  onCancel: () => void;
}

export const TourDesigner: React.FC<Props> = ({ tour, onSave, onCancel }) => {
  const [config, setConfig] = useState<TourUIConfig>(tour.ui_config || {
    primaryColor: '#4f46e5',
    accentColor: '#818cf8',
    fontFamily: 'Cairo',
    viewMode: 'map',
    buttonShape: 'rounded',
    glassEffect: true,
    cardStyle: 'elevated'
  });

  const handleSave = () => {
    onSave({ ...tour, ui_config: config });
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e] text-right font-cairo overflow-hidden">
      {/* Top Bar */}
      <div className="p-6 md:p-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl flex justify-between items-center z-50">
         <div className="flex gap-4">
           <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-600/20 transition-all active:scale-95">اعتماد التصميم</button>
           <button onClick={onCancel} className="text-slate-500 hover:text-white px-6 font-bold text-xs uppercase">إلغاء</button>
         </div>
         <div className="text-right">
            <h3 className="text-2xl font-black text-white">استوديو <span className="text-indigo-400">تأثيث الواجهة</span></h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Live Mobile UI Design Studio</p>
         </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Editor Sidebar */}
        <div className="lg:w-[450px] border-l border-slate-800 p-8 space-y-10 overflow-y-auto custom-scrollbar bg-slate-900/20 shadow-2xl">
           
           {/* Section 1: Assets */}
           <div className="space-y-6">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] block border-b border-slate-800 pb-3">1. تأثيث الأصول البصرية (GIFs)</label>
              
              <div className="space-y-4">
                <span className="text-[11px] font-bold text-slate-300">أيقونة الجولة المتحركة (GIF URL)</span>
                <div className="space-y-3">
                  <input 
                    type="url" 
                    placeholder="رابط GIF مباشر (أو ارفعه بالأسفل)..." 
                    value={config.introGifUrl || ''} 
                    onChange={e => setConfig({...config, introGifUrl: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-[10px] outline-none focus:border-indigo-500 transition-all"
                  />
                  <FileUploader 
                    mediaType="image" 
                    label="رفع GIF مخصص" 
                    accept="image/gif"
                    onUploadComplete={(url) => setConfig({...config, introGifUrl: url})} 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-[11px] font-bold text-slate-300">خلفية التطبيق المخصصة</span>
                <FileUploader 
                  mediaType="image" 
                  label="تغيير نمط الخلفية" 
                  onUploadComplete={(url) => setConfig({...config, backgroundImage: url})} 
                />
              </div>
           </div>

           {/* Section 2: UI Geometry */}
           <div className="space-y-6">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] block border-b border-slate-800 pb-3">2. هندسة المكونات (Geometry)</label>
              
              <div className="space-y-4">
                 <span className="text-[11px] font-bold text-slate-300 block">شكل الأزرار والعناصر التفاعلية</span>
                 <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'rounded', label: 'دائري ناعم' },
                      { id: 'pill', label: 'بيضاوي كامل' },
                      { id: 'sharp', label: 'حاد الزوايا' }
                    ].map(shape => (
                      <button 
                        key={shape.id} 
                        onClick={() => setConfig({...config, buttonShape: shape.id as any})}
                        className={`py-3 text-[10px] font-black uppercase rounded-xl border transition-all ${config.buttonShape === shape.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                      >
                        {shape.label}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="p-5 bg-slate-800/40 rounded-3xl border border-slate-700 flex items-center justify-between group transition-all hover:border-indigo-500/30">
                 <div className="text-right">
                    <span className="text-[11px] font-bold text-white block">تأثير الزجاج (Glassmorphism)</span>
                    <span className="text-[8px] text-slate-500 uppercase font-black">Transparency & Blur</span>
                 </div>
                 <button 
                    onClick={() => setConfig({...config, glassEffect: !config.glassEffect})}
                    className={`w-14 h-7 rounded-full transition-all relative ${config.glassEffect ? 'bg-indigo-600' : 'bg-slate-700'}`}
                 >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${config.glassEffect ? 'right-8' : 'right-1'}`}></div>
                 </button>
              </div>
           </div>

           {/* Section 3: Identity & Colors */}
           <div className="space-y-6">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] block border-b border-slate-800 pb-3">3. ألوان الهوية والخطوط</label>
              <div className="flex gap-2 flex-wrap justify-end">
                 {['#4f46e5', '#f43f5e', '#10b981', '#f59e0b', '#0ea5e9', '#d946ef', '#ffffff'].map(color => (
                   <button 
                     key={color} 
                     onClick={() => setConfig({...config, primaryColor: color})}
                     className={`w-10 h-10 rounded-full border-2 transition-all ${config.primaryColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60'}`}
                     style={{ backgroundColor: color }}
                   />
                 ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setConfig({...config, fontFamily: 'Cairo'})} className={`py-3.5 rounded-xl border text-[10px] font-black ${config.fontFamily === 'Cairo' ? 'bg-white text-slate-900 border-white shadow-lg' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>خط القاهرة</button>
                 <button onClick={() => setConfig({...config, fontFamily: 'Amiri'})} className={`py-3.5 rounded-xl border text-[10px] font-black ${config.fontFamily === 'Amiri' ? 'bg-white text-slate-900 border-white shadow-lg' : 'bg-slate-800 text-slate-400 border-slate-700 font-amiri text-sm'}`}>خط أميري (تراثي)</button>
              </div>
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] block border-b border-slate-800 pb-3">4. رسائل الواجهة</label>
              <textarea 
                value={config.welcomeMessage}
                onChange={e => setConfig({...config, welcomeMessage: e.target.value})}
                placeholder="اكتب رسالة ترحيبية تظهر في بداية المسار..."
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 text-white text-xs text-right outline-none focus:border-indigo-500 h-32 resize-none shadow-inner"
              />
           </div>
        </div>

        {/* Live Preview Emulator */}
        <div className="flex-1 bg-[#050810] p-10 flex items-center justify-center relative overflow-hidden">
           <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
           
           <div className="w-[360px] h-[720px] bg-slate-950 rounded-[4rem] border-[12px] border-slate-800 shadow-[0_0_120px_rgba(0,0,0,0.8)] overflow-hidden relative flex flex-col animate-scale-up">
              
              {/* Fake Notch */}
              <div className="h-8 bg-slate-900 flex items-center justify-between px-10 text-[8px] text-slate-500 font-black">
                <span>9:41</span>
                <div className="w-16 h-4 bg-slate-800 rounded-b-xl absolute top-0 left-1/2 -translate-x-1/2"></div>
                <span>📶 🔋</span>
              </div>

              {/* Header Emulator */}
              <div className={`p-8 flex justify-between items-center transition-all duration-700 ${config.glassEffect ? 'backdrop-blur-2xl bg-white/5' : 'bg-slate-900'} border-b border-white/5`}>
                 <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xs">≡</div>
                 <div className="text-right">
                    <h5 className={`text-sm font-black text-white ${config.fontFamily === 'Amiri' ? 'font-amiri text-lg' : ''}`}>{tour.name}</h5>
                    <p className="text-[8px] font-bold uppercase tracking-[0.3em]" style={{ color: config.primaryColor }}>{tour.city || 'Heritage Tour'}</p>
                 </div>
              </div>
              
              {/* Content Emulator */}
              <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center p-10 text-center">
                 {config.backgroundImage && (
                   <img src={config.backgroundImage} className="absolute inset-0 w-full h-full object-cover opacity-10 blur-[2px] pointer-events-none" />
                 )}
                 
                 {/* Intro GIF Preview */}
                 {config.introGifUrl ? (
                   <div className="relative mb-10 group">
                      <div className="absolute -inset-6 bg-indigo-500/10 blur-3xl rounded-full animate-pulse"></div>
                      <img src={config.introGifUrl} className="relative w-48 h-48 object-contain rounded-3xl shadow-3xl" alt="Tour Asset GIF" />
                   </div>
                 ) : (
                   <div className="w-48 h-48 rounded-[3rem] bg-slate-900/50 border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-600 mb-10">
                     <span className="text-4xl mb-2">🎞️</span>
                     <span className="text-[10px] font-black uppercase tracking-widest">GIF Preview</span>
                   </div>
                 )}

                 <div className="space-y-6 relative z-10">
                    <h6 className={`text-2xl font-black text-white leading-tight ${config.fontFamily === 'Amiri' ? 'font-amiri text-3xl italic' : ''}`}>
                       {config.welcomeMessage || 'مرحباً بك في تجربة المدينة المنسقة'}
                    </h6>
                    <div className="h-1.5 w-20 mx-auto rounded-full" style={{ backgroundColor: config.primaryColor }}></div>
                    <p className="text-[11px] text-slate-500 leading-relaxed max-w-[240px] mx-auto font-medium">ابدأ رحلتك لاستكشاف التدخلات الحضرية الموزعة في الحي.</p>
                 </div>
              </div>

              {/* Bottom Actions Emulator */}
              <div className={`p-10 relative z-10 transition-all ${config.glassEffect ? 'backdrop-blur-3xl bg-white/5 border-t border-white/5' : 'bg-slate-950 border-t border-slate-900'}`}>
                 <button 
                    className={`w-full py-6 text-xs font-black uppercase tracking-widest shadow-3xl transition-all active:scale-95
                      ${config.buttonShape === 'pill' ? 'rounded-full' : config.buttonShape === 'sharp' ? 'rounded-none' : 'rounded-3xl'}`} 
                    style={{ backgroundColor: config.primaryColor, color: config.primaryColor === '#ffffff' ? '#000' : '#fff' }}
                 >
                    بدء المسار المنسق 🧭
                 </button>
              </div>
           </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-scale-up { animation: scaleUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
};
