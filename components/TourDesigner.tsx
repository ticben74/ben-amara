
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

  const handleSave = () => {
    onSave({ ...tour, ui_config: config });
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e] text-right font-cairo overflow-hidden">
      <div className="p-6 md:p-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl flex justify-between items-center z-50">
         <div className="flex gap-4">
           <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95">حفظ التصميم</button>
           <button onClick={onCancel} className="text-slate-500 hover:text-white px-6 font-bold text-xs uppercase">إلغاء</button>
         </div>
         <div className="text-right">
            <h3 className="text-2xl font-black text-white">استوديو <span className="text-indigo-400">تأثيث التجربة</span></h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Creative Interface Orchestration</p>
         </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="lg:w-[500px] border-l border-slate-800 p-8 space-y-12 overflow-y-auto custom-scrollbar bg-slate-900/20 shadow-2xl">
           
           {/* Section 1: Welcome Message */}
           <div className="space-y-6">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] block border-b border-slate-800 pb-3">1. رسائل الواجهة الترحيبية</label>
              <textarea 
                placeholder="اكتب رسالة ترحيب تظهر للزائر عند فتح الجولة..." 
                value={config.welcomeMessage || ''} 
                onChange={e => setConfig({...config, welcomeMessage: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white text-sm outline-none focus:border-indigo-500 h-24 resize-none"
              />
           </div>

           {/* Section 2: Widget Selection */}
           <div className="space-y-6">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] block border-b border-slate-800 pb-3">2. اختيار المربعات (Widgets)</label>
              <div className="grid grid-cols-1 gap-3">
                 {WIDGET_OPTIONS.map(widget => {
                   const isActive = (config.enabledWidgets || []).includes(widget.id);
                   return (
                     <button 
                       key={widget.id}
                       onClick={() => toggleWidget(widget.id)}
                       className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isActive ? 'bg-indigo-600/10 border-indigo-500 shadow-lg' : 'bg-slate-800/40 border-slate-800 opacity-60 hover:opacity-100'}`}
                     >
                       <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isActive ? 'bg-indigo-500 border-indigo-400' : 'border-slate-700'}`}>
                          {isActive && <span className="text-white text-[10px]">✓</span>}
                       </div>
                       <div className="flex items-center gap-3">
                          <span className="text-white font-black text-xs">{widget.name}</span>
                          <span className="text-lg">{widget.icon}</span>
                       </div>
                     </button>
                   );
                 })}
              </div>
           </div>

           {/* Section 3: Custom Links */}
           <div className="space-y-6">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] block border-b border-slate-800 pb-3">3. إضافة روابط ومعرفات (Store, IG, etc.)</label>
              <div className="space-y-4 bg-slate-950/40 p-6 rounded-[2rem] border border-slate-800">
                <input 
                   type="text" 
                   placeholder="عنوان الرابط (مثل: متجرنا)" 
                   value={newLink.title} 
                   onChange={e => setNewLink({...newLink, title: e.target.value})}
                   className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs outline-none" 
                />
                <input 
                   type="url" 
                   placeholder="الرابط الكامل (https://...)" 
                   value={newLink.url} 
                   onChange={e => setNewLink({...newLink, url: e.target.value})}
                   className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs outline-none" 
                />
                <div className="flex gap-2">
                   <select 
                     value={newLink.icon} 
                     onChange={e => setNewLink({...newLink, icon: e.target.value})}
                     className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs outline-none"
                   >
                     <option value="🔗">🔗 رابط</option>
                     <option value="🛍️">🛍️ متجر</option>
                     <option value="📸">📸 إنستغرام</option>
                     <option value="🧭">🧭 خريطة</option>
                     <option value="🎫">🎫 تذاكر</option>
                   </select>
                   <button onClick={addLink} className="flex-1 bg-indigo-600 text-white font-black text-[10px] rounded-xl uppercase">إضافة الرابط</button>
                </div>
              </div>

              <div className="space-y-3">
                 {config.customLinks?.map(link => (
                   <div key={link.id} className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                      <button onClick={() => removeLink(link.id)} className="text-red-500 text-xs">حذف</button>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                           <div className="text-white font-black text-[10px]">{link.title}</div>
                           <div className="text-[8px] text-slate-500 truncate max-w-[150px]">{link.url}</div>
                        </div>
                        <span className="text-xl">{link.icon}</span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Emulator Preview */}
        <div className="flex-1 bg-[#050810] p-10 flex items-center justify-center relative overflow-hidden">
           <div className="w-[360px] h-[720px] bg-slate-950 rounded-[4rem] border-[12px] border-slate-800 shadow-5xl overflow-hidden relative flex flex-col">
              <div className="p-6 border-b border-white/5 bg-slate-900">
                 <div className="text-right">
                    <h5 className="text-sm font-black text-white">{tour.name}</h5>
                    <p className="text-[8px] font-bold uppercase" style={{ color: config.primaryColor }}>Live Preview</p>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                 {config.welcomeMessage && (
                   <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl text-[10px] text-indigo-300 font-bold text-right italic">
                     "{config.welcomeMessage}"
                   </div>
                 )}
                 <div className="h-40 bg-slate-900 rounded-3xl border border-white/5 flex items-center justify-center text-slate-700 font-black text-[10px] uppercase">Content Viewport</div>
                 
                 {(config.enabledWidgets || []).includes('links') && config.customLinks && config.customLinks.length > 0 && (
                    <div className="p-4 border border-white/10 rounded-2xl space-y-2">
                       <span className="text-[8px] font-black text-slate-500 block text-right">Previewing Custom Links</span>
                       {config.customLinks.map(l => (
                         <div key={l.id} className="p-2 bg-white/5 rounded-lg text-[9px] text-white text-right">{l.icon} {l.title}</div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
