
import React, { useState, useRef } from 'react';
import { InterventionType, MediaType } from '../types';
import { uploadFile } from '../services/storage';

interface GalleryItem {
  id: string;
  type: InterventionType;
  mediaType: MediaType;
  title: string;
  visitorName: string;
  mediaUrl: string;
  audioUrl?: string;
  stat: string;
  quote: string;
}

const INITIAL_GALLERY_DATA: GalleryItem[] = [
  {
    id: 'g1',
    type: InterventionType.BENCH,
    mediaType: 'audio',
    title: 'حكاية من زمن الفن الجميل',
    visitorName: 'أحمد محمود',
    mediaUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=400',
    stat: '١.٢ ألف استماع',
    quote: 'شعرت وكأن المقعد يهمس لي بأسرار المدينة القديمة.'
  },
  {
    id: 'g2',
    type: InterventionType.MURAL,
    mediaType: 'video',
    title: 'نبض القاهرة البصري',
    visitorName: 'سارة خالد',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-urban-street-lights-at-night-4244-large.mp4',
    stat: '٨٥٠ تفاعل بومضة',
    quote: 'الألوان كانت تتحرك مع صوت خطواتي، تجربة ساحرة!'
  }
];

interface Props {
  onExplore: (type: InterventionType) => void;
}

export const VisitorGallery: React.FC<Props> = ({ onExplore }) => {
  const [items, setItems] = useState<GalleryItem[]>(INITIAL_GALLERY_DATA);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    visitorName: '',
    quote: '',
    mediaFile: null as File | null,
    audioFile: null as File | null,
    previewUrl: '',
    type: InterventionType.BENCH,
    mediaType: 'image' as MediaType
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ 
        ...formData, 
        mediaFile: file, 
        previewUrl: URL.createObjectURL(file) 
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mediaFile) return;

    setIsSubmitting(true);
    setUploadProgress(10);

    try {
      // 1. Upload to Supabase Storage
      const uploadResult = await uploadFile(
        formData.mediaFile, 
        formData.mediaType === 'video' ? 'video' : 'image',
        { 
          folder: 'visitor-gallery',
          onProgress: (p) => setUploadProgress(10 + (p * 0.8))
        }
      );

      setUploadProgress(95);

      // 2. Add to local state (In production, this would save to a Database table)
      const newItem: GalleryItem = {
        id: Math.random().toString(36).substr(2, 9),
        title: formData.title,
        visitorName: formData.visitorName,
        quote: formData.quote,
        mediaUrl: uploadResult.url,
        type: formData.type,
        mediaType: formData.mediaType,
        stat: 'الآن'
      };

      setItems([newItem, ...items]);
      setIsModalOpen(false);
      setFormData({
        title: '',
        visitorName: '',
        quote: '',
        mediaFile: null,
        audioFile: null,
        previewUrl: '',
        type: InterventionType.BENCH,
        mediaType: 'image'
      });
    } catch (err) {
      alert("فشل رفع الوسائط. يرجى المحاولة مرة أخرى.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="animate-fade-in space-y-12 pb-20">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-white">معرض <span className="text-indigo-500">الزوار الرقمي</span></h2>
        <p className="text-slate-400 max-w-2xl mx-auto font-medium">
          نحتفي هنا بالمساهمات الإبداعية لزوارنا التي توثق روح المكان.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((item) => (
          <div 
            key={item.id}
            onClick={() => onExplore(item.type)}
            className="group relative h-[450px] rounded-[3rem] overflow-hidden cursor-pointer bg-slate-800 border border-slate-700/50 transition-all duration-500 hover:scale-[1.02]"
          >
            {item.mediaType === 'video' ? (
              <video src={item.mediaUrl} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100" />
            ) : (
              <img src={item.mediaUrl} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
            <div className="absolute inset-0 p-8 flex flex-col justify-end text-right">
              <h3 className="text-xl font-black text-white mb-1">{item.title}</h3>
              <p className="text-indigo-400 text-xs font-bold mb-4">بواسطة: {item.visitorName}</p>
              <p className="text-slate-200 text-sm italic font-amiri opacity-0 group-hover:opacity-100 transition-all duration-500">
                "{item.quote}"
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-600/5 border border-indigo-500/10 rounded-[4rem] p-16 text-center space-y-6">
         <h3 className="text-2xl font-black text-white">شاركنا تجربتك الإبداعية</h3>
         <button 
           onClick={() => setIsModalOpen(true)}
           className="bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl transition-all"
         >
           نشر وسائط جديدة
         </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] max-w-xl w-full overflow-hidden shadow-3xl">
            <div className="p-8 border-b border-slate-800 flex items-center justify-between">
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-500 hover:text-white">×</button>
              <h4 className="text-xl font-black text-white">إضافة <span className="text-indigo-500">مشاركة</span></h4>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <input type="text" required placeholder="عنوان المشاركة" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-right" />
              <input type="text" required placeholder="اسمك" value={formData.visitorName} onChange={e => setFormData({ ...formData, visitorName: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-right" />
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50"
              >
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                {formData.previewUrl ? (
                  <img src={formData.previewUrl} className="w-20 h-20 object-cover rounded-lg" />
                ) : (
                  <span className="text-xs text-slate-500 font-bold uppercase">اضغط لرفع صورة أو فيديو</span>
                )}
              </div>

              <textarea required placeholder="اكتب تعليقك هنا..." value={formData.quote} onChange={e => setFormData({ ...formData, quote: e.target.value })} rows={2} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-right font-amiri text-lg" />

              <button 
                type="submit" 
                disabled={isSubmitting || !formData.mediaFile}
                className="w-full py-4 rounded-xl bg-indigo-600 text-white font-black text-sm uppercase flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    جاري الرفع... {Math.round(uploadProgress)}%
                  </>
                ) : "نشر المشاركة"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}} />
    </div>
  );
};
