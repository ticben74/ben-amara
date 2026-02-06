
import React, { useState, useEffect } from 'react';
import { InterventionType } from '../types';

interface ToolModule {
  id: string;
  type: InterventionType;
  title: string;
  subtitle: string;
  capability: string;
  techStack: string[];
  description: string;
  icon: string;
  anchoringStatus: 'ready' | 'active' | 'configuring';
}

const DEFAULT_TOOLS: ToolModule[] = [
  {
    id: 'm1',
    type: InterventionType.BENCH,
    title: 'وحدة مقعد الحكايا',
    subtitle: 'الذاكرة السمعية الموضعية',
    capability: 'توليد سرديات مكانية تفاعلية بناءً على روح الحي',
    techStack: ['Gemini 2.5 TTS', 'Spatial Audio', 'NLP Local Dialects'],
    description: 'أداة لإحياء الأرصفة والميادين من خلال قصص يرويها المكان لزواره، تعزز الارتباط العاطفي بالموقع.',
    icon: '🎙️',
    anchoringStatus: 'ready'
  },
  {
    id: 'm2',
    type: InterventionType.PATH,
    title: 'نظام المسار الغامر',
    subtitle: 'السرد الحركي المتسلسل',
    capability: 'ربط النقاط الجغرافية بتدفق صوتي درامي متزامن',
    techStack: ['Geolocation API', 'Ambisonic Audio', 'Real-time Grounding'],
    description: 'تحويل الزقاق إلى مسرح صوتي يتحرك مع خطى الزائر، مما يجعل "المشي" فعلاً ثقافياً وتوثيقياً.',
    icon: '🛤️',
    anchoringStatus: 'active'
  },
  {
    id: 'm3',
    type: InterventionType.DOOR,
    title: 'بوابة الذاكرة الرقمية',
    subtitle: 'تموضع الحواس (النكهات)',
    capability: 'استعادة تاريخ النكهات والروائح المرتبطة بالأبواب الأثرية',
    techStack: ['Gemini Vision API', 'Multimodal LLM', 'Augmented Memory'],
    description: 'أداة لفك شفرة الأبواب القديمة وربطها بالهوية الغذائية والتراث الشفهي الذي مر من خلالها.',
    icon: '🚪',
    anchoringStatus: 'configuring'
  }
];

interface Props {
  onExplore: (type: InterventionType) => void;
}

export const InterventionVault: React.FC<Props> = ({ onExplore }) => {
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const [modules, setModules] = useState<ToolModule[]>(() => {
    const saved = localStorage.getItem('vault_modules');
    return saved ? JSON.parse(saved) : DEFAULT_TOOLS;
  });
  
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<ToolModule>>({});
  const [techInput, setTechInput] = useState("");
  const [editingModule, setEditingModule] = useState<ToolModule | null>(null);

  // Code Editor State
  const [jsonCode, setJsonCode] = useState(JSON.stringify(modules, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('vault_modules', JSON.stringify(modules));
    setJsonCode(JSON.stringify(modules, null, 2));
  }, [modules]);

  const handleEdit = (module: ToolModule) => {
    setEditingModule(module);
    setFormData(module);
    setIsFormOpen(true);
  };

  const handleSaveJson = () => {
    try {
      const parsed = JSON.parse(jsonCode);
      if (!Array.isArray(parsed)) throw new Error("يجب أن تكون البيانات مصفوفة [ ]");
      setModules(parsed);
      setJsonError(null);
      setViewMode('visual');
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingModule) {
      setModules(modules.map(m => m.id === editingModule.id ? { ...m, ...formData } as ToolModule : m));
    } else {
      const newModule = { ...formData, id: 'm' + Date.now() } as ToolModule;
      setModules([...modules, newModule]);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="animate-fade-in space-y-12 pb-24 text-right">
      {/* Header with View Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-teal-600/5 p-10 rounded-[4rem] border border-teal-500/10 backdrop-blur-sm">
        <div className="space-y-3">
          <h2 className="text-5xl font-black text-white leading-tight">
            خزينة <span className="text-teal-500">التدخلات</span>
          </h2>
          <p className="text-slate-400 font-medium">إدارة وتطوير "ترسانة" القدرات الإبداعية للمنصة.</p>
        </div>
        
        <div className="flex gap-4 items-center bg-slate-900/50 p-2 rounded-[2rem] border border-slate-800">
           <button 
             onClick={() => setViewMode('visual')}
             className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'visual' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500'}`}
           >
             الواجهة المرئية
           </button>
           <button 
             onClick={() => setViewMode('code')}
             className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'code' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500'}`}
           >
             وضع المطور (JSON)
           </button>
        </div>
      </div>

      {viewMode === 'visual' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {modules.map((tool) => (
            <div 
              key={tool.id}
              onMouseEnter={() => setActiveModule(tool.id)}
              onMouseLeave={() => setActiveModule(null)}
              className={`group relative p-10 rounded-[3.5rem] border transition-all duration-500 overflow-hidden
                ${activeModule === tool.id ? 'bg-teal-600/10 border-teal-500/40 shadow-3xl' : 'bg-slate-900/40 border-slate-800'}`}
            >
              <div className="relative z-10 flex gap-8">
                <div className="flex-1 space-y-6">
                  <div className="flex justify-between items-start">
                    <button onClick={() => handleEdit(tool)} className="text-[10px] font-black text-teal-400 uppercase tracking-widest hover:text-white transition-colors">تعديل</button>
                    <div className="text-right">
                      <h3 className="text-2xl font-black text-white">{tool.title}</h3>
                      <p className="text-teal-400 font-bold text-[10px] uppercase tracking-widest">{tool.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{tool.description}</p>
                  <div className="flex flex-wrap justify-end gap-2">
                    {tool.techStack.map(tech => (
                      <span key={tech} className="bg-slate-800 px-3 py-1 rounded-lg text-[9px] font-mono text-slate-500 border border-slate-700/50">{tech}</span>
                    ))}
                  </div>
                  <button 
                    onClick={() => onExplore(tool.type)}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl"
                  >
                    إرساء في المكان الآن
                  </button>
                </div>
                <div className="shrink-0 flex flex-col items-center">
                   <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl transition-all duration-500
                     ${activeModule === tool.id ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-500 rotate-12'}`}>
                     {tool.icon}
                   </div>
                </div>
              </div>
            </div>
          ))}
          <button 
            onClick={() => { setEditingModule(null); setFormData({}); setIsFormOpen(true); }}
            className="group relative p-10 rounded-[3.5rem] border border-dashed border-slate-800 hover:border-teal-500/50 hover:bg-teal-500/5 transition-all flex flex-col items-center justify-center gap-4 text-slate-600 hover:text-teal-400"
          >
            <span className="text-5xl group-hover:scale-110 transition-transform">+</span>
            <span className="font-black text-[10px] uppercase tracking-[0.3em]">إضافة وحدة جديدة للخزينة</span>
          </button>
        </div>
      ) : (
        <div className="animate-scale-up space-y-6">
           <div className="relative rounded-[2.5rem] border border-slate-800 bg-[#0d1117] p-8 overflow-hidden shadow-4xl group">
              <div className="absolute top-4 right-8 text-[10px] font-black text-slate-600 uppercase tracking-widest pointer-events-none">RAW_VAULT_SCHEMA.json</div>
              <textarea 
                value={jsonCode}
                onChange={(e) => setJsonCode(e.target.value)}
                spellCheck={false}
                className="w-full h-[600px] bg-transparent text-teal-300 font-mono text-sm outline-none resize-none custom-scrollbar leading-relaxed"
                placeholder="// قم بلصق أو تعديل مصفوفة التدخلات هنا..."
              />
              {jsonError && (
                <div className="absolute bottom-6 left-6 right-6 p-4 bg-red-600/90 text-white rounded-2xl text-xs font-black animate-bounce shadow-2xl">
                  ⚠️ خطأ في التنسيق: {jsonError}
                </div>
              )}
           </div>
           <div className="flex gap-4">
              <button 
                onClick={handleSaveJson}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all"
              >
                تطبيق وحفظ التغييرات البرمجية
              </button>
              <button 
                onClick={() => { setJsonCode(JSON.stringify(modules, null, 2)); setViewMode('visual'); }}
                className="px-12 bg-slate-800 text-slate-400 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest"
              >
                تجاهل
              </button>
           </div>
        </div>
      )}

      {/* Existing Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] max-w-2xl w-full shadow-4xl overflow-hidden flex flex-col animate-scale-up">
            <div className="p-8 border-b border-slate-800 flex items-center justify-between shrink-0">
               <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-500 hover:text-white text-2xl">×</button>
               <h4 className="text-xl font-black text-white uppercase tracking-widest">
                 {editingModule ? 'تحديث خصائص التدخل' : 'تعريف قدرة فنية جديدة'}
               </h4>
            </div>
            
            <form onSubmit={handleSaveForm} className="overflow-y-auto p-10 space-y-6 flex-1 custom-scrollbar text-right">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">اسم الوحدة</label>
                  <input type="text" required value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-right outline-none focus:border-teal-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">العنوان الفرعي</label>
                  <input type="text" value={formData.subtitle || ''} onChange={e => setFormData({...formData, subtitle: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-right outline-none focus:border-teal-500" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase">القدرة التقنية</label>
                <textarea required value={formData.capability || ''} onChange={e => setFormData({...formData, capability: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-right outline-none focus:border-teal-500 h-24 resize-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase">الأيقونة</label>
                <input type="text" value={formData.icon || '✨'} onChange={e => setFormData({...formData, icon: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-center text-2xl" />
              </div>
              <div className="flex gap-4 pt-10">
                <button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-5 rounded-[2rem] font-black text-sm uppercase shadow-xl">حفظ</button>
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-10 bg-slate-800 text-slate-400 py-5 rounded-[2rem] font-black text-sm uppercase">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scale-up { animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
};
