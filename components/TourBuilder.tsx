
import React, { useState, useMemo, useEffect } from 'react';
import { InterventionItem, TourTheme, InterventionType } from '../types';

interface Props {
  interventions: InterventionItem[];
  initialSelection?: string[];
  onStartTour: (stops: InterventionItem[]) => void;
}

const THEMES: Record<TourTheme, { name: string; icon: string; color: string; desc: string }> = {
  heritage: { name: 'مسار التراث', icon: '🏮', color: 'bg-amber-600', desc: 'رحلة عبر عبق التاريخ والأزقة القديمة.' },
  gastronomy: { name: 'دليل النكهات', icon: '🥘', color: 'bg-emerald-600', desc: 'اكتشف حكايا الأبواب والأكلات التقليدية.' },
  art: { name: 'جولة الفنون', icon: '🎨', color: 'bg-teal-600', desc: 'مسار بصري يجمع الجداريات والمعارض.' },
  architecture: { name: 'هوية المكان', icon: '🏢', color: 'bg-slate-600', desc: 'تأمل في عمارة المدينة وتدخلاتها الحضرية.' },
  custom: { name: 'مسار مخصص', icon: '✨', color: 'bg-teal-600', desc: 'صمم تجربتك الخاصة بحرية كاملة بناءً على تفضيلاتك.' }
};

export const TourBuilder: React.FC<Props> = ({ interventions, onStartTour, initialSelection = [] }) => {
  const [selectedTheme, setSelectedTheme] = useState<TourTheme>('custom');
  const [selectedStops, setSelectedStops] = useState<string[]>(initialSelection);

  useEffect(() => {
    if (initialSelection.length > 0) {
      setSelectedStops(initialSelection);
    }
  }, [initialSelection]);

  const filteredInterventions = useMemo(() => {
    if (selectedTheme === 'custom') return interventions;
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
    // الترتيب بناءً على تاريخ الاختيار أو الترتيب في القائمة
    const stops = selectedStops.map(id => interventions.find(i => i.id === id)).filter(Boolean) as InterventionItem[];
    onStartTour(stops);
  };

  return (
    <div className="p-8 md:p-12 bg-slate-900 rounded-[3rem] h-full flex flex-col space-y-10 animate-fade-in text-right">
      <div className="space-y-2">
        <h3 className="text-3xl font-black text-white">منظم الجولات <span className="text-teal-500">الثقافية</span></h3>
        <p className="text-slate-400 font-medium">قم بربط المحطات المختارة لتشكيل مسار سردي متكامل.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(THEMES).map(([id, theme]) => (
          <button
            key={id}
            onClick={() => setSelectedTheme(id as TourTheme)}
            className={`p-6 rounded-3xl border transition-all text-right space-y-3 ${selectedTheme === id ? 'bg-teal-600/20 border-teal-500 shadow-lg' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${theme.color}`}>{theme.icon}</div>
            <div>
              <div className="font-black text-white text-xs">{theme.name}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <span className="text-xs font-black text-teal-400 uppercase tracking-widest">{selectedStops.length} محطات في هذا الربط</span>
          <h4 className="font-black text-white">إضافة/إزالة محطات من المسار</h4>
        </div>
        
        <div className="grid md:grid-cols-2 gap-3 overflow-y-auto pr-2 custom-scrollbar pb-6">
          {filteredInterventions.map((item) => (
            <div 
              key={item.id}
              onClick={() => toggleStop(item.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${selectedStops.includes(item.id) ? 'bg-teal-600 border-teal-500 shadow-lg' : 'bg-slate-800 border-slate-700'}`}
            >
              <div className="flex items-center gap-3">
                 <div className={`w-3 h-3 rounded-full ${selectedStops.includes(item.id) ? 'bg-white' : 'bg-slate-700'}`}></div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-white">{item.location}</div>
                <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{item.type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-6 border-t border-slate-800">
        <button 
          onClick={handleCreateTour}
          disabled={selectedStops.length === 0}
          className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white font-black py-5 rounded-[2rem] shadow-2xl transition-all"
        >
          تأكيد ربط المحطات وانشاء الجولة 🧭
        </button>
      </div>
    </div>
  );
};
