
import React, { useState, useMemo } from 'react';
import { InterventionItem, InterventionType, MediaType } from '../types';
import { generateStory, generateSpeech, generateArt } from '../services/geminiService';
import { createClient } from '../services/supabase';
import { trackEvent } from '../services/analyticsService';

interface TemplateField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  placeholder?: string;
  required: boolean;
  options?: string[];
  helpText?: string;
}

interface ExperienceTemplate {
  id: string;
  name: string;
  nameEn: string;
  type: InterventionType;
  icon: string;
  description: string;
  defaultConfig: Partial<InterventionItem>;
  customizableFields: TemplateField[];
  aiPromptTemplate: string;
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'advanced';
  category: 'heritage' | 'art' | 'gastronomy' | 'education';
}

const EXPERIENCE_TEMPLATES: ExperienceTemplate[] = [
  {
    id: 'quick-bench',
    name: 'مقعد حكايا ذكي',
    nameEn: 'Smart Story Bench',
    type: InterventionType.BENCH,
    icon: '🎙️',
    description: 'توليد حكاية صوتية غامرة مرتبطة بروح المكان باستخدام Gemini AI',
    defaultConfig: { mediaType: 'audio', status: 'active' },
    customizableFields: [
      { name: 'location', label: 'الموقع الدقيق', type: 'text', placeholder: 'مثال: حديقة الأزهر، القاهرة', required: true, helpText: 'أدخل اسم المكان بدقة لتوليد محتوى سياقي' },
      { name: 'neighborhood', label: 'الحي/المنطقة', type: 'select', required: true, options: ['الحسين', 'الزمالك', 'وسط البلد', 'مصر الجديدة', 'المعادي', 'الدرعية', 'جدة التاريخية', 'دمشق القديمة', 'المدينة القديمة - تونس'], helpText: 'اختر الحي الذي يقع فيه المكان' },
      { name: 'theme', label: 'موضوع الحكاية', type: 'select', required: true, options: ['ذكريات المكان', 'الحرف التقليدية', 'الطعام والمأكولات', 'الشخصيات التاريخية', 'الأساطير المحلية', 'الحياة اليومية'], helpText: 'اختر الموضوع الذي تريد الحكاية عنه' },
      { name: 'duration', label: 'مدة الحكاية (بالدقائق)', type: 'select', required: true, options: ['2', '3', '5'], helpText: 'كم دقيقة تريد أن تكون مدة الحكاية؟' },
      { name: 'latitude', label: 'خط العرض', type: 'number', placeholder: '30.0444', required: true },
      { name: 'longitude', label: 'خط الطول', type: 'number', placeholder: '31.2357', required: true }
    ],
    aiPromptTemplate: 'أنت حكواتي محترف. اكتب حكاية صوتية مدتها {duration} دقائق عن {theme} في {neighborhood} - {location}. اجعل الحكاية شيقة وغنية بالتفاصيل المحلية.',
    estimatedTime: '2-3 دقائق',
    difficulty: 'easy',
    category: 'heritage'
  },
  {
    id: 'ai-mural',
    name: 'جدارية بصرية مولدة',
    nameEn: 'AI-Generated Mural',
    type: InterventionType.MURAL,
    icon: '🎨',
    description: 'تصميم جدارية فنية وتوليد صورتها باستخدام Gemini Flash Image',
    defaultConfig: { mediaType: 'image', status: 'active' },
    customizableFields: [
      { name: 'location', label: 'موقع الجدارية', type: 'text', placeholder: 'مثال: شارع المعز، القاهرة', required: true },
      { name: 'style', label: 'النمط الفني', type: 'select', required: true, options: ['هندسي إسلامي', 'واقعي معاصر', 'تجريدي', 'شعبي تراثي', 'كاريكاتيري', 'رقمي حديث'], helpText: 'اختر الأسلوب الفني للجدارية' },
      { name: 'theme', label: 'الموضوع الرئيسي', type: 'textarea', placeholder: 'مثال: صخب المدينة وتداخل الوجوه والحياة اليومية', required: true, helpText: 'صف الموضوع الذي تريد أن تمثله الجدارية بالتفصيل' },
      { name: 'colors', label: 'الألوان المفضلة', type: 'text', placeholder: 'مثال: أزرق، ذهبي، أبيض', required: false, helpText: 'اختياري - حدد الألوان التي تريدها' },
      { name: 'latitude', label: 'خط العرض', type: 'number', placeholder: '30.0444', required: true },
      { name: 'longitude', label: 'خط الطول', type: 'number', placeholder: '31.2357', required: true }
    ],
    aiPromptTemplate: 'صمم جدارية فنية بأسلوب {style} تمثل {theme} في {location}. الألوان المفضلة: {colors}. صف المشهد بدقة فنية.',
    estimatedTime: '3-4 دقائق',
    difficulty: 'easy',
    category: 'art'
  }
];

interface Props {
  onComplete: (item: InterventionItem) => void;
}

export const ExperienceGenerator: React.FC<Props> = ({ onComplete }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ExperienceTemplate | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<string>('');
  const [generatedItem, setGeneratedItem] = useState<InterventionItem | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  const landingUrl = useMemo(() => {
    if (!generatedItem) return '';
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('view', 'landing');
    url.searchParams.set('id', generatedItem.id);
    return url.toString();
  }, [generatedItem]);

  const qrUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(landingUrl)}&color=8b5cf6&bgcolor=ffffff&margin=10`;
  }, [landingUrl]);

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    setGenerating(true);
    setGenerationStage('جاري استدعاء Gemini...');

    try {
      let prompt = selectedTemplate.aiPromptTemplate;
      Object.entries(params).forEach(([key, val]) => {
        prompt = prompt.replace(`{${key}}`, val || '');
      });

      const storyText = await generateStory(
        selectedTemplate.name,
        params.neighborhood || params.location || 'حي عريق'
      );

      let mediaUrl = '';
      let audioUrl = '';

      if (selectedTemplate.type === InterventionType.BENCH) {
        setGenerationStage('تحويل الحكاية إلى صوت...');
        const audioData = await generateSpeech(storyText);
        if (audioData) {
          const blob = new Blob([audioData], { type: 'audio/mpeg' });
          audioUrl = URL.createObjectURL(blob);
        }
      } else if (selectedTemplate.type === InterventionType.MURAL) {
        setGenerationStage('رسم الجدارية بالذكاء الاصطناعي...');
        const artUrl = await generateArt(prompt);
        if (artUrl) mediaUrl = artUrl;
      }

      const newItem: InterventionItem = {
        id: `gen-${Date.now()}`,
        type: selectedTemplate.type,
        mediaType: selectedTemplate.defaultConfig.mediaType as MediaType,
        location: params.location || 'موقع مولد ذكياً',
        latitude: parseFloat(params.latitude) || 30.0444,
        longitude: parseFloat(params.longitude) || 31.2357,
        status: 'active',
        lastUpdated: new Date().toISOString().split('T')[0],
        interactCount: 0,
        authorType: 'ai',
        curatorNote: storyText,
        mediaUrl: mediaUrl || 'https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=800',
        audioUrl: audioUrl
      };

      if (supabase) {
        await supabase.from('interventions').insert(newItem);
      }

      setGeneratedItem(newItem);
      trackEvent('generate_art', { template: selectedTemplate.id, location: newItem.location });
    } catch (err) {
      console.error(err);
      alert('حدث خطأ في التوليد.');
    } finally {
      setGenerating(false);
      setGenerationStage('');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(landingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (generatedItem) {
    return (
      <div className="max-w-4xl mx-auto p-12 bg-slate-900/80 rounded-[4rem] border border-teal-500/30 text-right animate-fade-in shadow-4xl backdrop-blur-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-500 to-teal-600"></div>
        
        <div className="flex flex-col items-center gap-10">
          <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center text-4xl shadow-2xl animate-bounce">✓</div>
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black text-white">تم إنشاء <span className="text-teal-400">التجربة بنجاح</span></h2>
            <p className="text-slate-400">التدخل الفني الآن حيّ وجاهز للإرساء الميداني.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 w-full items-center bg-slate-950/50 p-10 rounded-[3rem] border border-slate-800">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl group hover:rotate-2 transition-transform cursor-pointer" onClick={() => window.open(qrUrl, '_blank')}>
              <img src={qrUrl} alt="QR Code" className="w-56 h-56 mx-auto" />
              <p className="text-[10px] font-black text-slate-400 mt-4 text-center uppercase tracking-widest">اضغط لتكبير الرمز للمسح</p>
            </div>

            <div className="space-y-6 text-right">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">رابط صفحة الهبوط العامة</label>
                <div 
                  onClick={copyLink}
                  className="bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono text-[9px] text-teal-400 break-all select-all hover:bg-slate-800 transition-colors cursor-pointer relative overflow-hidden"
                >
                  {landingUrl}
                  {copied && <div className="absolute inset-0 bg-emerald-500 flex items-center justify-center text-white font-black">تم النسخ!</div>}
                </div>
              </div>

              <div className="p-6 bg-teal-500/10 rounded-2xl border border-teal-500/20">
                <h4 className="font-black text-white mb-2 text-xs">معاينة السرد</h4>
                <p className="text-sm text-slate-300 font-amiri leading-relaxed line-clamp-3 italic">"{generatedItem.curatorNote}"</p>
              </div>
              
              <button onClick={copyLink} className="w-full bg-slate-800 text-slate-300 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-slate-700 transition-all">نسخ الرابط للمشاركة</button>
            </div>
          </div>

          <div className="flex gap-4 w-full">
            <button 
              onClick={() => onComplete(generatedItem)}
              className="flex-1 bg-gradient-to-r from-teal-600 to-teal-600 hover:from-teal-500 hover:to-teal-500 text-white py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl"
            >
              عرض في المنصة 🏛️
            </button>
            <button 
              onClick={() => window.open(landingUrl, '_blank')}
              className="px-10 bg-slate-800 hover:bg-slate-700 text-slate-300 py-6 rounded-[2rem] font-black text-xs uppercase"
            >
              فتح الرابط 🔗
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in text-right max-w-6xl mx-auto">
      <div className="bg-slate-900/60 p-10 rounded-[4rem] border border-slate-800 text-center space-y-4 shadow-3xl">
        <h2 className="text-5xl font-black text-white">مولّد <span className="text-teal-500 italic">التجارب الذكي</span></h2>
        <p className="text-slate-400 font-medium text-lg">اختر قالباً ودع ذكاء Gemini يشكل ملامح التدخل الحضري القادم.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {EXPERIENCE_TEMPLATES.map(t => (
          <button
            key={t.id}
            onClick={() => { setSelectedTemplate(t); setParams({}); }}
            className={`p-10 rounded-[3.5rem] border-2 text-right transition-all group relative overflow-hidden
              ${selectedTemplate?.id === t.id 
                ? 'border-teal-500 bg-teal-500/10 shadow-3xl' 
                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:scale-[1.02]'}`}
          >
            <div className="flex justify-between items-start mb-6">
              <span className="text-6xl group-hover:scale-110 transition-transform">{t.icon}</span>
              <div className={`w-4 h-4 rounded-full ${selectedTemplate?.id === t.id ? 'bg-teal-500 animate-pulse' : 'bg-slate-800'}`}></div>
            </div>
            <h4 className="text-3xl font-black text-white mb-2">{t.name}</h4>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">{t.description}</p>
          </button>
        ))}
      </div>

      {selectedTemplate && (
        <div className="bg-slate-900/60 p-12 rounded-[4rem] border border-slate-800 space-y-10 animate-fade-in shadow-4xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-teal-500 to-transparent"></div>
          
          <div className="flex justify-between items-center border-b border-slate-800/50 pb-8">
             <button onClick={() => setSelectedTemplate(null)} className="text-slate-500 hover:text-white font-black text-xs uppercase tracking-widest transition-colors">إلغاء ×</button>
             <h3 className="text-2xl font-black text-white">تخصيص القالب: {selectedTemplate.name}</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-10">
            {selectedTemplate.customizableFields.map(field => (
              <div key={field.name} className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    value={params[field.name] || ''}
                    onChange={e => setParams({ ...params, [field.name]: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white text-right outline-none focus:border-teal-500 font-bold"
                  >
                    <option value="">اختر {field.label}</option>
                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    placeholder={field.placeholder}
                    value={params[field.name] || ''}
                    onChange={e => setParams({ ...params, [field.name]: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-8 py-5 text-white text-right outline-none focus:border-teal-500 font-bold h-32"
                  />
                ) : (
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={params[field.name] || ''}
                    onChange={e => setParams({ ...params, [field.name]: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-8 py-5 text-white text-right outline-none focus:border-teal-500 font-bold"
                  />
                )}
                {field.helpText && <p className="text-[9px] text-slate-600 font-bold pr-2">{field.helpText}</p>}
              </div>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full mt-12 bg-gradient-to-r from-teal-600 to-teal-600 text-white py-8 rounded-[2.5rem] font-black text-lg uppercase tracking-[0.3em] shadow-3xl shadow-teal-600/30 transition-all active:scale-95 disabled:opacity-50 group overflow-hidden relative"
          >
            {generating ? (
              <span className="flex items-center justify-center gap-4 relative z-10">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {generationStage || 'جاري التنسيق مع Gemini...'}
              </span>
            ) : (
              <span className="relative z-10 flex items-center justify-center gap-3">
                ✨ تشكيل التجربة الإبداعية الآن
              </span>
            )}
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>
      )}
    </div>
  );
};
