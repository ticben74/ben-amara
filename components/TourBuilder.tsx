
import React, { useState, useMemo } from 'react';
import { InterventionItem, TourTheme, InterventionType } from '../types';

interface Props {
  interventions: InterventionItem[];
  onStartTour: (stops: InterventionItem[]) => void;
}

const THEMES: Record<TourTheme, { name: string; icon: string; color: string; desc: string }> = {
  heritage: { name: 'مسار التراث', icon: '🏮', color: 'bg-amber-600', desc: 'رحلة عبر عبق التاريخ والأزقة القديمة.' },
  gastronomy: { name: 'دليل النكهات', icon: '🥘', color: 'bg-emerald-600', desc: 'اكتشف حكايا الأبواب والأكلات التقليدية.' },
  art: { name: 'جولة الفنون', icon: '🎨', color: 'bg-indigo-600', desc: 'مسار بصري يجمع الجداريات والمعارض.' },
  architecture: { name: 'هوية المكان', icon: '🏢', color: 'bg-slate-600', desc: 'تأمل في عمارة المدينة وتدخلاتها الحضرية.' }
};

export const TourBuilder: React.FC<Props> = ({ interventions, onStartTour }) => {
  const [selectedTheme, setSelectedTheme] = useState<TourTheme | null>(null);
  const [selectedStops, setSelectedStops] = useState<string[]>([]);

  const filteredInterventions = useMemo(() => {
    if (!selectedTheme) return interventions;
    // محاكاة الفلترة بناءً على نوع التدخل إذا لم تكن السمة موجودة صراحة
    if (selectedTheme === 'gastronomy') return interventions.filter(i => i.type === InterventionType.DOOR);
    if (selectedTheme === 'art') return interventions.filter(i => i.type === InterventionType.MURAL || i.type === InterventionType.GALLERY);
    if (selectedTheme === 'heritage') return interventions.filter(i => i.type === InterventionType.BENCH || i.type === InterventionType.DOOR);
    return interventions;
  }, [selectedTheme, interventions]);

  const toggleStop = (id: string) => {
    setSelectedStops(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleCreateTour = () => {
    const stops = interventions.filter(i => selectedStops.includes(i.id));
    onStartTour(stops);
  };

  return (
    <div className="p-8 md:p-12 bg-slate-900 rounded-[3rem] border border-slate-800 h-full flex flex-col space-y-10 animate-fade-in">
      <div className="text-right space-y-2">
        <h3 className="text-3xl font-black text-white">منظم الجولات <span className="text-indigo-500">الثقافية</span></h3>
        <p className="text-slate-400 font-medium">صمم مسارك الخاص بناءً على اهتماماتك الفنية والتاريخية.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(THEMES).map(([id, theme]) => (
          <button
            key={id}
            onClick={() => setSelectedTheme(id as TourTheme)}
            className={`p-6 rounded-3xl border transition-all text-right space-y-3 ${selectedTheme === id ? 'bg-indigo-600/20 border-indigo-500 shadow-lg' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${theme.color} shadow-lg`}>{theme.icon}</div>
            <div>
              <div className="font-black text-white text-sm">{theme.name}</div>
              <div className="text-[10px] text-slate-500 font-bold leading-tight mt-1">{theme.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">{selectedStops.length} محطات مختارة</span>
          <h4 className="font-black text-white">اختر المحطات من الدليل</h4>
        </div>
        
        <div className="grid md:grid-cols-2 gap-3 overflow-y-auto pr-2 custom-scrollbar pb-6">
          {filteredInterventions.map((item) => (
            <div 
              key={item.id}
              onClick={() => toggleStop(item.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${selectedStops.includes(item.id) ? 'bg-indigo-600 border-indigo-500 shadow-indigo-600/20 shadow-lg' : 'bg-slate-800 border-slate-700'}`}
            >
              <div className="flex items-center gap-3">
                 <div className={`w-3 h-3 rounded-full ${selectedStops.includes(item.id) ? 'bg-white' : 'bg-slate-700'}`}></div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-white">{item.location}</div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{item.type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-6 border-t border-slate-800 flex flex-col md:flex-row-reverse gap-4">
        <button 
          onClick={handleCreateTour}
          disabled={selectedStops.length === 0}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-black py-5 rounded-[2rem] shadow-2xl transition-all"
        >
          تأكيد وانشاء الجولة 🧭
        </button>
        <div className="flex items-center gap-6 px-4">
          <div className="text-right">
             <div className="text-[9px] text-slate-500 font-black uppercase">الزمن المقدر</div>
             <div className="text-white font-bold">{selectedStops.length * 15} دقيقة</div>
          </div>
          <div className="w-px h-8 bg-slate-800"></div>
          <div className="text-right">
             <div className="text-[9px] text-slate-500 font-black uppercase">إجمالي المسافة</div>
             <div className="text-white font-bold">{selectedStops.length * 0.8} كم</div>
          </div>
        </div>
      </div>
    </div>
  );
};
