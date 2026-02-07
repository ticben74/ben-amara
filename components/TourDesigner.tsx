
import React, { useState } from 'react';
import { CuratedTour, TourUIConfig, WidgetType, CustomLink } from '../types';
import { FileUploader } from './FileUploader';

interface Props {
  tour: CuratedTour;
  onSave: (updatedTour: CuratedTour) => void;
  onCancel: () => void;
}

const WIDGET_OPTIONS: { id: WidgetType; name: string; icon: string }[] = [
  { id: 'map', name: 'الخريطة المكانية', icon: '🗺️' },
  { id: 'competition', name: 'المسابقات والجوائز', icon: '🏆' },
  { id: 'surprise', name: 'صندوق المفاجآت', icon: '🎁' },
  { id: 'discovery', name: 'جولات أخرى والمتجر', icon: '🛍️' },
  { id: 'links', name: 'مربع الروابط المخصصة', icon: '🔗' },
  { id: 'furnishing', name: 'تخصيص الزائر (UI)', icon: '🎨' },
];

export const TourDesigner: React.FC<Props> = ({ tour, onSave, onCancel }) => {
  const [config, setConfig] = useState<TourUIConfig>(tour.ui_config || {
    primaryColor: '#4f46e5',
    accentColor: '#818cf8',
    fontFamily: 'Cairo',
    viewMode: 'map',
    buttonShape: 'rounded',
    glassEffect: true,
    cardStyle: 'elevated',
    enabledWidgets: ['map', 'competition', 'discovery'],
    customLinks: []
  });

  const [newLink, setNewLink] = useState({ title: '', url: '', icon: '🔗', color: 'bg-indigo-600' });
  const [saving, setSaving] = useState(false);

  const toggleWidget = (id: WidgetType) => {
    const current = config.enabledWidgets || [];
    const updated = current.includes(id) 
      ? current.filter(w => w !== id) 
      : [...current, id];
    setConfig({ ...config, enabledWidgets: updated });
  };

  const addLink = () => {
    if (!newLink.title || !newLink.url) return;
    const link: CustomLink = { ...newLink, id: 'link-' + Date.now() };
    setConfig({ ...config, customLinks: [...(config.customLinks || []), link] });
    setNewLink({ title: '', url: '', icon: '🔗', color: 'bg-indigo-600' });
  };

  const removeLink = (id: string) => {
    setConfig({ ...config, customLinks: (config.customLinks || []).filter(l => l.id !== id) });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ ...tour, ui_config: config });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e] text-right font-cairo overflow-hidden">
      <div className="p-6 md:p-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl flex justify-between items-center z-50 shadow-2xl">
         <div className="flex gap-4">
           <button 
             onClick={handleSave} 
             disabled={saving}
             className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-3"
           >
             {saving ? (
               <>
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 جاري الحفظ...
               </>
             ) : 'اعتماد وحفظ التصميم'}
           </button>
           <button onClick={onCancel} className="text-slate-500 hover:text-white px-6 font-bold text-xs uppercase tracking-widest">إلغاء</button>
         </div>
         <div className="text-right">
            <h3 className="text-2xl font-black text-white">استوديو <span className="text-indigo-400">تأثيث التجربة</span></h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Creative Interface Orchestration v2.5</p>
         </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="lg:w-[550px] border-l border-slate-800 p-8 space-y-12 overflow-y-auto custom-scrollbar bg-slate-900/20 shadow-2xl">
           
           {/* Section 1: Welcome & Branding */}
           <div className="space-y-6">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] block border-b border-slate-800 pb-3">1. الرسائل الترحيبية والنمط</label>
              <div className="space-y-4">
                <textarea 
                  placeholder="اكتب رسالة ترحيب تظهر للزائر عند فتح الجولة..." 
                  value={config.welcomeMessage || ''} 
                  onChange={e => setConfig({...config, welcomeMessage: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white text-sm outline-none focus:border-indigo-500 h-28 resize-none shadow-inner font-bold"
                />
                <div className="bg-slate-950/40 p-6 rounded-[2rem] border border-slate-800 space-y-4">
                  <label className="text-[9px] font-black text-slate-500 uppercase">صورة الغلاف (Intro Image)</label>
                  <FileUploader mediaType="image" label="رفع خلفية الجولة" onUploadComplete={(url) => setConfig({...config, backgroundImage: url})} />
                  {config.backgroundImage && <div className="h-20 w-full rounded-xl overflow-hidden border border-white/5 shadow-xl"><img src={config.backgroundImage} className="w-full h-full object-cover" /></div>}
                </div>
              </div>
           </div>

           {/* Section 2: Widget Selection */}
           <div className="space-y-6">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] block border-b border-slate-800 pb-3">2. إدارة المربعات الوظيفية (Widgets)</label>
              <div className="grid grid-cols-2 gap-3">
                 {WIDGET_OPTIONS.map(widget => {
                   const isActive = (config.enabledWidgets || []).includes(widget.id);
                   return (
                     <button 
                       key={widget.id}
                       onClick={() => toggleWidget(widget.id)}
                       className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isActive ? 'bg-indigo-600/10 border-indigo-500 shadow-lg' : 'bg-slate-800/40 border-slate-800 opacity-40 hover:opacity-100 hover:bg-slate-800/60'}`}
                     >
                       <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isActive ? 'bg-indigo-500 border-indigo-400' : 'border-slate-700'}`}>
                          {isActive && <span className="text-white text-[8px]">✓</span>}
                       </div>
                       <div className="flex flex-col items-end gap-1">
                          <span className="text-lg">{widget.icon}</span>
                          <span className="text-white font-black text-[9px] uppercase">{widget.name}</span>
                       </div>
                     </button>
                   );
                 })}
              </div>
           </div>

           {/* Section 3: Smart External Links */}
           <div className="space-y-6">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] block border-b border-slate-800 pb-3">3. الروابط والمعرفات المخصصة</label>
              <div className="bg-slate-950/60 p-8 rounded-[2.5rem] border border-slate-800 space-y-5">
                <input 
                   type="text" 
                   placeholder="اسم الرابط (مثلاً: حساب انستغرام)" 
                   value={newLink.title} 
                   onChange={e => setNewLink({...newLink, title: e.target.value})}
                   className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 text-white text-xs outline-none focus:border-indigo-500" 
                />
                <input 
                   type="url" 
                   placeholder="الرابط الكامل (https://...)" 
                   value={newLink.url} 
                   onChange={e => setNewLink({...newLink, url: e.target.value})}
                   className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 text-white text-xs outline-none focus:border-indigo-500" 
                />
                <div className="grid grid-cols-2 gap-3">
                   <select 
                     value={newLink.icon} 
                     onChange={e => setNewLink({...newLink, icon: e.target.value})}
                     className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs outline-none appearance-none cursor-pointer"
                   >
                     <option value="🔗">🔗 رابط عام</option>
                     <option value="🛍️">🛍️ المتجر</option>
                     <option value="📸">📸 تواصل</option>
                     <option value="🧭">🧭 خريطة</option>
                   </select>
                   <button onClick={addLink} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] rounded-xl uppercase tracking-widest transition-all shadow-xl">إضافة الرابط +</button>
                </div>
              </div>

              <div className="space-y-3">
                 {config.customLinks?.map(link => (
                   <div key={link.id} className="flex items-center justify-between p-5 bg-slate-950/80 border border-slate-800 rounded-2xl group animate-fade-in">
                      <button onClick={() => removeLink(link.id)} className="text-red-500/60 hover:text-red-500 text-[10px] font-black uppercase transition-colors">حذف</button>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                           <div className="text-white font-black text-xs">{link.title}</div>
                           <div className="text-[8px] text-slate-500 truncate max-w-[180px] font-mono">{link.url}</div>
                        </div>
                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-xl shadow-inner">{link.icon}</div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Section 4: Visual Identity */}
           <div className="space-y-6">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] block border-b border-slate-800 pb-3">4. الهوية البصرية (Theme)</label>
              <div className="flex gap-3 flex-wrap justify-end">
                 {['#4f46e5', '#f43f5e', '#10b981', '#f59e0b', '#0ea5e9', '#d946ef', '#c2410c'].map(color => (
                   <button 
                     key={color} 
                     onClick={() => setConfig({...config, primaryColor: color})}
                     className={`w-12 h-12 rounded-2xl border-4 transition-all duration-300 shadow-2xl ${config.primaryColor === color ? 'border-white scale-110 rotate-3' : 'border-white/5 opacity-50 hover:opacity-100'}`}
                     style={{ backgroundColor: color }}
                   />
                 ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => setConfig({...config, buttonShape: 'rounded'})} className={`py-4 rounded-xl border text-[10px] font-black tracking-widest uppercase transition-all ${config.buttonShape === 'rounded' ? 'bg-white text-slate-900 border-white' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>زوايا دائرية</button>
                 <button onClick={() => setConfig({...config, buttonShape: 'pill'})} className={`py-4 rounded-full border text-[10px] font-black tracking-widest uppercase transition-all ${config.buttonShape === 'pill' ? 'bg-white text-slate-900 border-white' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>نمط كبسولة</button>
              </div>
           </div>
        </div>

        {/* Live Emulated Preview */}
        <div className="flex-1 bg-[#050810] p-10 flex items-center justify-center relative overflow-hidden">
           <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
           
           <div className="w-[380px] h-[780px] bg-slate-950 rounded-[4.5rem] border-[14px] border-slate-800 shadow-6xl overflow-hidden relative flex flex-col scale-90 lg:scale-100 transition-all shadow-[0_0_100px_rgba(0,0,0,0.8)]">
              {/* Phone Status Bar */}
              <div className="h-10 bg-slate-900 flex items-center justify-between px-10 text-[9px] text-slate-500 font-black">
                <span>9:41</span>
                <div className="w-24 h-6 bg-slate-950 rounded-b-2xl absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center">
                  <div className="w-8 h-1 bg-slate-800 rounded-full"></div>
                </div>
                <div className="flex gap-1 items-center">📶 🔋</div>
              </div>

              {/* Emulated Header */}
              <div className={`p-6 border-b border-white/5 ${config.glassEffect ? 'backdrop-blur-xl bg-white/5' : 'bg-slate-900'}`}>
                 <div className="text-right">
                    <h5 className={`text-sm font-black text-white ${config.fontFamily === 'Amiri' ? 'font-amiri text-lg' : ''}`}>{tour.name}</h5>
                    <p className="text-[8px] font-bold uppercase tracking-[0.4em]" style={{ color: config.primaryColor }}>Previewing UI Design</p>
                 </div>
              </div>
              
              {/* Emulated Content Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-slate-950/50">
                 {config.welcomeMessage && (
                    <div className="p-5 bg-white/5 border border-white/5 rounded-3xl text-right animate-fade-in border-r-4 shadow-xl" style={{ borderColor: config.primaryColor }}>
                       <p className="text-[10px] text-slate-200 font-bold italic leading-relaxed">"{config.welcomeMessage}"</p>
                    </div>
                 )}
                 
                 <div className="h-44 bg-slate-900/60 rounded-[3rem] border border-white/5 flex items-center justify-center text-slate-700 font-black text-[10px] uppercase tracking-[0.2em] shadow-inner">
                   {config.backgroundImage ? <img src={config.backgroundImage} className="w-full h-full object-cover opacity-20" /> : 'Main Content Area'}
                 </div>
                 
                 {/* Widget Indicators */}
                 <div className="grid grid-cols-2 gap-3">
                    {(config.enabledWidgets || []).map(wid => (
                      <div key={wid} className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center gap-2 animate-fade-in shadow-lg">
                         <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{wid}</span>
                         <span className="text-emerald-500 text-[10px]">●</span>
                      </div>
                    ))}
                 </div>

                 {/* Custom Links Preview */}
                 {config.customLinks && config.customLinks.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-white/5">
                       <span className="text-[8px] font-black text-slate-600 block text-right uppercase tracking-widest mb-2">Smart Links Preview</span>
                       {config.customLinks.map(l => (
                         <div key={l.id} className="p-3 bg-slate-900 border border-white/5 rounded-xl text-[9px] text-white flex items-center justify-between">
                            <span className="text-slate-500">→</span>
                            <div className="flex items-center gap-2">
                               <span>{l.title}</span>
                               <span className="text-base">{l.icon}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                 )}
              </div>

              {/* Emulated Bottom Nav */}
              <div className={`p-8 ${config.glassEffect ? 'backdrop-blur-3xl bg-white/5' : 'bg-slate-950'} border-t border-white/5 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]`}>
                 <button 
                    className={`w-full py-5 text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-500/10 transition-all`} 
                    style={{ 
                      backgroundColor: config.primaryColor, 
                      color: '#fff',
                      borderRadius: config.buttonShape === 'pill' ? '999px' : '1.5rem'
                    }}
                 >
                    START TOUR 🧭
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
