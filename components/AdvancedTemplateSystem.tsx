
import React, { useState, useMemo } from 'react';
import { DynamicTemplate, TemplateVariable, InterventionItem, CuratedTour, InterventionType } from '../types';
import { generateStory, generateSpeech, generateArt, generateStopInteraction } from '../services/geminiService';
import { createClient } from '../services/supabase';

const ADVANCED_TEMPLATES: DynamicTemplate[] = [
  {
    id: 'heritage-tour-maker',
    name: 'صانع جولات التراث الذكي',
    description: 'توليد مسار تاريخي متكامل يربط القصص بالمعالم مع تحديات ذكاء.',
    icon: '🏛️',
    category: 'tourism',
    variables: [
      { name: 'site_name', label: 'اسم المعلم التاريخي', type: 'text', required: true, default: 'شارع المعز' },
      { name: 'era', label: 'الحقبة الزمنية', type: 'select', options: ['العصر الفاطمي', 'العصر المملوكي', 'العصر الأيوبي'], required: true, default: 'العصر الفاطمي' },
      { name: 'tone', label: 'نبرة السرد', type: 'select', options: ['غامض', 'حكواتي دافئ', 'أكاديمي'], required: true, default: 'حكواتي دافئ' }
    ],
    components: [
      { id: 'c1', name: 'الاستهلال الصوتي', type: 'audio_narration', interventionType: InterventionType.BENCH, config: { duration: 120 } },
      { id: 'c2', name: 'التحدي البصري', type: 'visual_art', interventionType: InterventionType.MURAL, config: { style: 'classic' } },
      { id: 'c3', name: 'مسابقة المعرفة', type: 'interactive_quiz', interventionType: InterventionType.DOOR, config: { questions: 3 }, conditions: ['c1'] }
    ],
    logic: [
      { trigger: 'on_component_complete', action: 'unlock_next', params: { target: 'c3' } }
    ]
  },
  {
    id: 'modern-art-atelier',
    name: 'محاكي الفن الحضري المعاصر',
    description: 'تحويل الشوارع الحديثة إلى معارض فنية رقمية تفاعلية.',
    icon: '🎨',
    category: 'art_curation',
    variables: [
      { name: 'neighborhood', label: 'الحي المستهدف', type: 'text', required: true, default: 'الزمالك' },
      { name: 'art_style', label: 'المدرسة الفنية', type: 'select', options: ['سايبر بانك عربي', 'تجريد هندسي', 'سريالية مدنية'], required: true, default: 'سايبر بانك عربي' }
    ],
    components: [
      { id: 'a1', name: 'جدارية تفاعلية', type: 'visual_art', interventionType: InterventionType.MURAL, config: { palette: 'dynamic' } },
      { id: 'a2', name: 'معرض رقمي مصغر', type: 'place_info', interventionType: InterventionType.GALLERY, config: { pieces: 5 } }
    ],
    logic: []
  }
];

interface Props {
  onComplete: () => void;
}

export const AdvancedTemplateSystem: React.FC<Props> = ({ onComplete }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<DynamicTemplate | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");

  const supabase = createClient();

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    setIsGenerating(true);
    setProgress(5);
    setStatusText("جاري استنهاض " + selectedTemplate.name + "...");

    try {
      const stops: string[] = [];
      const generatedInterventions: InterventionItem[] = [];

      // 1. توليد المكونات تسلسلياً
      for (let i = 0; i < selectedTemplate.components.length; i++) {
        const comp = selectedTemplate.components[i];
        const stepProgress = Math.floor(10 + (i / selectedTemplate.components.length) * 80);
        setProgress(stepProgress);
        setStatusText(`توليد مكون: ${comp.name}...`);

        let mediaUrl = '';
        let audioUrl = '';

        // محاكاة منطق التوليد بناءً على نوع المكون
        if (comp.type === 'audio_narration') {
          const story = await generateStory("مقعد الحكايا", values.site_name || values.neighborhood);
          const speech = await generateSpeech(story);
          if (speech) {
            const blob = new Blob([speech], { type: 'audio/mpeg' });
            audioUrl = URL.createObjectURL(blob);
          }
        } else if (comp.type === 'visual_art') {
          const art = await generateArt(`A mural in style of ${values.art_style || 'traditional'} representing ${values.site_name || 'urban life'}`);
          if (art) mediaUrl = art;
        }

        const newItem: InterventionItem = {
          id: `adv-${Date.now()}-${i}`,
          type: comp.interventionType,
          mediaType: comp.type === 'audio_narration' ? 'audio' : 'image',
          location: values.site_name || values.neighborhood || 'موقع ذكي',
          latitude: 30.0444 + (Math.random() * 0.01),
          longitude: 31.2357 + (Math.random() * 0.01),
          status: 'active',
          lastUpdated: new Date().toISOString().split('T')[0],
          interactCount: 0,
          // Fix: Added missing authorType for advanced template items
          authorType: 'hybrid',
          mediaUrl: mediaUrl || 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=400',
          audioUrl: audioUrl
        };

        generatedInterventions.push(newItem);
        stops.push(newItem.id);
      }

      // 2. إنشاء الجولة المنسقة التي تربط المكونات
      setStatusText("تنسيق المسار السردي...");
      const newTour: CuratedTour = {
        id: `tour-adv-${Date.now()}`,
        name: `جولة ${values.site_name || values.neighborhood} الاستكشافية`,
        description: `مسار مولد آلياً بنظام القوالب المتقدم لفئة ${selectedTemplate.category}.`,
        stops: stops,
        theme: 'heritage',
        city: 'القاهرة',
        ui_config: {
          primaryColor: '#4f46e5',
          accentColor: '#818cf8',
          fontFamily: 'Cairo',
          viewMode: 'map',
          buttonShape: 'pill',
          glassEffect: true,
          cardStyle: 'elevated'
        }
      };

      // 3. الحفظ في Supabase
      await supabase.from('interventions').insert(generatedInterventions);
      await supabase.from('curated_tours').insert(newTour);

      setProgress(100);
      setStatusText("تم اكتمال المسار بنجاح! 🎊");
      setTimeout(() => onComplete(), 1500);

    } catch (err) {
      console.error(err);
      setStatusText("عذراً، تعثر النظام أثناء التوليد.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-12 animate-fade-in text-right">
      {/* Template Selection */}
      <div className="grid md:grid-cols-2 gap-8">
        {ADVANCED_TEMPLATES.map(t => (
          <button
            key={t.id}
            onClick={() => { setSelectedTemplate(t); setValues({}); }}
            className={`p-10 rounded-[3.5rem] border-2 text-right transition-all group relative overflow-hidden
              ${selectedTemplate?.id === t.id ? 'border-indigo-500 bg-indigo-500/10 shadow-3xl' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'}`}
          >
            <div className="flex justify-between items-start mb-6">
              <span className="text-5xl">{t.icon}</span>
              <span className="bg-indigo-950 text-indigo-400 text-[8px] font-black uppercase px-3 py-1 rounded-full border border-indigo-500/20">{t.category}</span>
            </div>
            <h4 className="text-2xl font-black text-white mb-3">{t.name}</h4>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">{t.description}</p>
            
            <div className="mt-8 flex gap-2">
               {t.components.map(c => (
                 <div key={c.id} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-xs opacity-50" title={c.name}>
                   {c.interventionType === InterventionType.BENCH ? '🎙️' : c.interventionType === InterventionType.MURAL ? '🎨' : '🚪'}
                 </div>
               ))}
            </div>
          </button>
        ))}
      </div>

      {/* Variable Configuration Form */}
      {selectedTemplate && !isGenerating && (
        <div className="bg-slate-900/60 p-12 rounded-[4rem] border border-slate-800 shadow-4xl space-y-10 animate-fade-in-up">
           <div className="flex justify-between items-center border-b border-slate-800 pb-6">
              <div className="text-right">
                 <h3 className="text-2xl font-black text-white">تخصيص متغيرات النظام</h3>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Configure Logic Variables</p>
              </div>
              <button onClick={() => setSelectedTemplate(null)} className="text-slate-500 hover:text-white transition-colors">تغيير القالب ×</button>
           </div>

           <div className="grid md:grid-cols-2 gap-10">
              {selectedTemplate.variables.map(v => (
                <div key={v.name} className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {v.label} {v.required && <span className="text-red-500">*</span>}
                  </label>
                  {v.type === 'select' ? (
                    <select 
                      value={values[v.name] || v.default}
                      onChange={e => setValues({...values, [v.name]: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                      {v.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      placeholder={v.default}
                      value={values[v.name] || ''}
                      onChange={e => setValues({...values, [v.name]: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-indigo-500 transition-all shadow-inner text-right"
                    />
                  )}
                </div>
              ))}
           </div>

           <button 
             onClick={handleGenerate}
             className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-3xl shadow-indigo-600/30 transition-all active:scale-95"
           >
             🚀 إطلاق معالج التوليد الذكي
           </button>
        </div>
      )}

      {/* Progress & Generation Overlay */}
      {isGenerating && (
        <div className="bg-slate-900/80 p-20 rounded-[5rem] border border-indigo-500/20 text-center space-y-12 backdrop-blur-3xl animate-pulse">
           <div className="relative w-40 h-40 mx-auto">
              <svg className="w-full h-full -rotate-90">
                 <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                 <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-indigo-500 transition-all duration-500" strokeDasharray="440" strokeDashoffset={440 - (440 * progress) / 100} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                 <span className="text-3xl font-black text-white">{progress}%</span>
              </div>
           </div>
           
           <div className="space-y-4">
              <h4 className="text-3xl font-black text-white italic">{statusText}</h4>
              <p className="text-slate-500 text-xs font-medium">يقوم Gemini بمعالجة المتغيرات وتصميم المحطات وتنسيق المسار السردي...</p>
           </div>

           <div className="flex gap-2 justify-center">
              {[...Array(5)].map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-500" style={{ animation: `bounce 1s infinite ${i * 0.1}s` }}></div>)}
           </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce { 0%, 100% { transform: translateY(0); opacity: 0.3; } 50% { transform: translateY(-10px); opacity: 1; } }
      `}} />
    </div>
  );
};
