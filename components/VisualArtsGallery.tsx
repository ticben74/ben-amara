
import React, { useState } from 'react';
import { ArtPiece } from '../types';
import { generateArt } from '../services/geminiService';
import { uploadFile, base64ToFile } from '../services/storage';
import { createClient } from '../services/supabase';

const ART_DATA: ArtPiece[] = [
  {
    id: '1',
    title: 'تداخلات النور والظل',
    artistName: 'د. ليلى العثمان',
    imageUrl: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800',
    artistWord: 'الفن هو محاولة القبض على اللحظة الهاربة من أزقة المدينة القديمة، حيث يتكسر الضوء على الجدران الطينية ليحكي قصة جيل مضى.',
    exhibitionText: 'يستعرض هذا العمل فلسفة الانعكاسات الحضرية وتأثير الضوء الطبيعي على الذاكرة البصرية للمواطن العربي.',
    dimensions: '120x100 سم',
    year: '2024'
  },
  {
    id: '2',
    title: 'روح الزقاق',
    artistName: 'ياسين الفارس',
    imageUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=800',
    artistWord: 'كل جدار في المدينة هو لوحة لم يكتمل رسمها بعد، وكل زاوية تحمل في طياتها صدى لضحكات قديمة.',
    exhibitionText: 'جزء من مجموعة "أصداء حضرية"، يركز العمل على التفاصيل المهملة في العمارة التقليدية.',
    dimensions: '80x80 سم',
    year: '2023'
  }
];

export const VisualArtsGallery: React.FC = () => {
  const [selectedPiece, setSelectedPiece] = useState<ArtPiece | null>(null);
  const [viewMode, setViewMode] = useState<'gallery' | 'atelier'>('gallery');
  
  // AI Atelier State
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);
  const [dynamicArt, setDynamicArt] = useState<ArtPiece[]>([]);

  const supabase = createClient();

  const handleGenerateArt = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGeneratedImageBase64(null);
    try {
      const imageUrl = await generateArt(prompt);
      setGeneratedImageBase64(imageUrl);
    } catch (err) {
      alert("تعذر توليد اللوحة حالياً. يرجى المحاولة لاحقاً.");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveGeneratedToGallery = async () => {
    if (!generatedImageBase64) return;
    setIsSaving(true);
    try {
      // 1. تحويل base64 إلى ملف ورفعه إلى السحابة للاستدامة
      const file = base64ToFile(generatedImageBase64, `ai-art-${Date.now()}.jpg`);
      const uploadResult = await uploadFile(file, 'image', { folder: 'ai-atelier' });

      const newPiece: ArtPiece = {
        id: Math.random().toString(36).substr(2, 9),
        title: prompt,
        artistName: "زائر مبدع (AI)",
        imageUrl: uploadResult.url, // استخدام الرابط الدائم
        artistWord: "هذه اللوحة ولدت من خيال مشترك بين الزائر والذكاء الاصطناعي.",
        exhibitionText: "عمل فني رقمي فوري تم رفعه للمعرض السحابي.",
        dimensions: "1024x1024",
        year: "2025"
      };

      // 2. تحديث الحالة المحلية (ويمكن هنا إضافة حفظ في جدول Supabase إذا توفر)
      setDynamicArt([newPiece, ...dynamicArt]);
      setViewMode('gallery');
      setGeneratedImageBase64(null);
      setPrompt("");
      alert("تمت إضافة لوحتك للمعرض العام بنجاح!");
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء حفظ اللوحة.");
    } finally {
      setIsSaving(false);
    }
  };

  const allArt = [...dynamicArt, ...ART_DATA];

  return (
    <div className="p-4 md:p-10 bg-slate-900 rounded-[3rem] border border-slate-800 h-full overflow-hidden flex flex-col min-h-[800px] relative">
      <div className="mb-10 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-8 z-10">
        <div className="text-right space-y-2">
          <h4 className="text-3xl font-black text-white">معرض <span className="text-indigo-500">الفنون البصرية</span></h4>
          <p className="text-slate-400 font-medium italic">"رؤى فنية تعيد تشكيل وعينا المكاني"</p>
        </div>
        
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/5">
          <button 
            onClick={() => setViewMode('gallery')}
            className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${viewMode === 'gallery' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
          >
            المعرض العام
          </button>
          <button 
            onClick={() => setViewMode('atelier')}
            className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${viewMode === 'atelier' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
          >
            مرسم الذكاء الاصطناعي ✨
          </button>
        </div>
      </div>

      {viewMode === 'gallery' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-10 z-10">
          {allArt.map((piece) => (
            <div 
              key={piece.id}
              onClick={() => setSelectedPiece(piece)}
              className="group relative aspect-[3/4] bg-slate-800 rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.03] shadow-xl border border-slate-700/50"
            >
              <img src={piece.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6 text-right">
                <h5 className="text-white font-black text-sm mb-1 line-clamp-1">{piece.title}</h5>
                <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest">{piece.artistName}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center space-y-12 animate-fade-in z-10">
          <div className="max-w-xl w-full text-center space-y-6">
            <h5 className="text-2xl font-black text-white">اصنع لوحتك الخاصة للمدينة</h5>
            <p className="text-slate-400">صف مشهداً عمرانياً تتخيله، وسيقوم نموذج Gemini الفني بتحويله إلى لوحة احترافية.</p>
            
            <div className="relative group">
              <textarea 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="مثلاً: غروب الشمس فوق مآذن المدينة بأسلوب الفن التجريدي المعاصر..."
                className="w-full bg-slate-800 border-2 border-slate-700 focus:border-indigo-500 rounded-[2.5rem] p-8 text-right text-white text-lg outline-none transition-all h-32 resize-none shadow-inner"
              />
              <button 
                onClick={handleGenerateArt}
                disabled={isGenerating || !prompt.trim()}
                className="absolute left-4 bottom-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all"
              >
                {isGenerating ? 'جاري الرسم...' : 'ابدأ الرسم'}
              </button>
            </div>
          </div>

          {isGenerating && (
            <div className="flex flex-col items-center gap-6 animate-pulse">
               <div className="w-64 h-64 bg-slate-800 rounded-[3rem] border-2 border-dashed border-indigo-500/30 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
               </div>
               <span className="text-indigo-400 font-bold">الذكاء الاصطناعي يمزج الألوان...</span>
            </div>
          )}

          {generatedImageBase64 && !isGenerating && (
            <div className="flex flex-col items-center gap-8 animate-fade-in-up">
               <div className="relative group">
                  <div className="absolute -inset-4 bg-indigo-500/20 blur-2xl rounded-full animate-pulse"></div>
                  <img src={generatedImageBase64} className="relative w-80 h-80 object-cover rounded-[3rem] border-4 border-indigo-600 shadow-3xl" />
               </div>
               <div className="flex gap-4">
                  <button 
                    onClick={saveGeneratedToGallery} 
                    disabled={isSaving}
                    className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {isSaving ? 'جاري الرفع...' : 'تبرع بها للمعرض'}
                  </button>
                  <button onClick={() => setGeneratedImageBase64(null)} className="bg-slate-800 text-slate-400 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all">
                    إلغاء
                  </button>
               </div>
            </div>
          )}
        </div>
      )}

      {selectedPiece && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-10 bg-slate-950/98 backdrop-blur-2xl animate-fade-in">
          <div className="max-w-6xl w-full bg-slate-900 border border-slate-800 rounded-[4rem] overflow-hidden shadow-3xl flex flex-col lg:flex-row-reverse h-full max-h-[90vh]">
            <div className="lg:w-3/5 bg-slate-950 relative flex items-center justify-center p-6 md:p-12 overflow-hidden group">
               <img src={selectedPiece.imageUrl} className="max-h-full max-w-full object-contain shadow-4xl rounded-lg transition-transform duration-[2s] group-hover:scale-105" />
               <button onClick={() => setSelectedPiece(null)} className="absolute top-8 left-8 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white backdrop-blur-md border border-white/10 transition-all">×</button>
            </div>
            <div className="lg:w-2/5 p-8 md:p-16 flex flex-col justify-between text-right overflow-y-auto custom-scrollbar">
              <div className="space-y-12">
                <div className="space-y-4">
                  <h2 className="text-4xl font-black text-white">{selectedPiece.title}</h2>
                  <p className="text-xl text-indigo-400 font-bold">{selectedPiece.artistName}</p>
                </div>
                <div className="space-y-6">
                  <h6 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] border-b border-slate-800 pb-2">كلمة الفنان</h6>
                  <p className="font-amiri text-2xl text-slate-200 leading-relaxed italic pr-4 border-r-2 border-indigo-500/30 italic">
                    "{selectedPiece.artistWord}"
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedPiece(null)} className="mt-12 w-full bg-indigo-600 text-white font-black py-5 rounded-[2.5rem] shadow-2xl">العودة للمعرض</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
      `}} />
    </div>
  );
};
