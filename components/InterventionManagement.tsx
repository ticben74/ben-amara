
import React, { useState, useEffect } from 'react';
import { InterventionItem, InterventionType, CuratedTour, MediaType, AuthorType } from '../types';
import { TourBuilder } from './TourBuilder';
import { TourDesigner } from './TourDesigner';
import { FileUploader } from './FileUploader';
import { ExperienceGenerator } from './ExperienceGenerator';
import { ExperienceLibrary } from './ExperienceLibrary';
import { AdvancedTemplateSystem } from './AdvancedTemplateSystem';
import { createClient } from '../services/supabase';
import { refineArtistNarrative, generateSpeech, decodeAudioBuffer } from '../services/geminiService';

interface Props {
  interventions: InterventionItem[];
  onUpdateInterventions: (items: InterventionItem[]) => void;
  curatedTours: CuratedTour[];
  onUpdateTours: (tours: CuratedTour[]) => void;
  initialAnchorType?: InterventionType | null;
  onClearPendingType?: () => void;
}

// Added missing InterventionType.MARKET to satisfy Record<InterventionType, string> and fix TS error
const TYPE_LABELS: Record<InterventionType, string> = {
  [InterventionType.BENCH]: 'مقعد حكايا صوتي',
  [InterventionType.MURAL]: 'جدارية بصرية',
  [InterventionType.PATH]: 'ممر غامر',
  [InterventionType.DOOR]: 'بوابة نكهات',
  [InterventionType.GALLERY]: 'معرض رقمي',
  [InterventionType.MARKET]: 'سوق تفاعلي'
};

export const InterventionManagement: React.FC<Props> = ({ 
  interventions, 
  onUpdateInterventions, 
  curatedTours, 
  onUpdateTours,
  initialAnchorType,
  onClearPendingType
}) => {
  const [activeTab, setActiveTab] = useState<'stations' | 'tours' | 'install' | 'generate' | 'library' | 'advanced'>('stations');
  const [editingItem, setEditingItem] = useState<InterventionItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isTourBuilderOpen, setIsTourBuilderOpen] = useState(false);
  const [designingTour, setDesigningTour] = useState<CuratedTour | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [refiningText, setRefiningText] = useState(false);

  const [formData, setFormData] = useState<Partial<InterventionItem>>({
    type: InterventionType.BENCH,
    mediaType: 'audio',
    status: 'active',
    authorType: 'artist',
    artistName: ''
  });

  const supabase = createClient();

  // Fix: Defined refreshDataAfterImport to handle refreshing state from Supabase
  const refreshDataAfterImport = async () => {
    setSyncing(true);
    try {
      const { data: intvData } = await supabase.from('interventions').select('*').order('lastUpdated', { ascending: false });
      if (intvData) onUpdateInterventions(intvData as InterventionItem[]);
      const { data: tourData } = await supabase.from('curated_tours').select('*');
      if (tourData) onUpdateTours(tourData as CuratedTour[]);
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (initialAnchorType) handleStartInstall(initialAnchorType);
  }, [initialAnchorType]);

  const handleStartInstall = (type: InterventionType) => {
    setEditingItem(null);
    setFormData({ 
      type, 
      mediaType: type === InterventionType.BENCH ? 'audio' : 'image', 
      status: 'active', 
      location: '', 
      latitude: 30.0444, 
      longitude: 31.2357,
      authorType: 'artist' 
    });
    setActiveTab('install');
  };

  const handleEditItem = (item: InterventionItem) => {
    setEditingItem(item);
    setFormData(item);
    setActiveTab('install');
  };

  const handleAISmoothText = async () => {
    if (!formData.rawArtistNotes) return;
    setRefiningText(true);
    try {
      const refined = await refineArtistNarrative(formData.rawArtistNotes, formData.location || 'هذا الموقع');
      setFormData({ ...formData, curatorNote: refined });
    } finally {
      setRefiningText(false);
    }
  };

  const handleSaveStation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    
    const stationData: InterventionItem = {
      id: editingItem?.id || 'station-' + Date.now(),
      location: formData.location || '',
      type: formData.type as InterventionType,
      mediaType: formData.mediaType as MediaType,
      latitude: Number(formData.latitude) || 30.0,
      longitude: Number(formData.longitude) || 31.0,
      status: formData.status as any || 'active',
      mediaUrl: formData.mediaUrl || '',
      audioUrl: formData.audioUrl || '',
      interactCount: editingItem?.interactCount || 0,
      lastUpdated: new Date().toISOString().split('T')[0],
      authorType: formData.authorType || 'artist',
      artistName: formData.artistName,
      curatorNote: formData.curatorNote,
      rawArtistNotes: formData.rawArtistNotes
    };

    try {
      if (editingItem) {
        onUpdateInterventions(interventions.map(i => i.id === stationData.id ? stationData : i));
        await supabase.from('interventions').upsert(stationData);
      } else {
        onUpdateInterventions([stationData, ...interventions]);
        await supabase.from('interventions').insert(stationData);
      }
      
      setEditingItem(null);
      setActiveTab('stations');
      if (onClearPendingType) onClearPendingType();
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-10 pb-24 text-right">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-slate-900/40 p-10 rounded-[4rem] border border-slate-800 backdrop-blur-xl">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="bg-indigo-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-xl">بيئة التنسيق والتركيب</span>
            {syncing && <span className="text-[10px] text-emerald-400 font-bold animate-pulse">مزامنة سحابية...</span>}
          </div>
          <h2 className="text-4xl font-black text-white">استوديو <span className="text-indigo-500">المنسق الثقافي</span></h2>
          <p className="text-slate-500 font-medium max-w-lg">أدوات لدمج لمسات الفنانين البشريين مع ذكاء Gemini لتشييد تجارب حضرية خالدة.</p>
          
          <div className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-white/5 w-fit mt-6 flex-wrap gap-2">
            <button onClick={() => setActiveTab('stations')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'stations' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500'}`}>التدخلات الحالية</button>
            <button onClick={() => setActiveTab('advanced')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'advanced' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>النماذج المنطقية 🧩</button>
            <button onClick={() => setActiveTab('library')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'library' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>مستودع الأصول 📦</button>
            <button onClick={() => handleStartInstall(InterventionType.BENCH)} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'install' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>+ تركيب فني جديد</button>
          </div>
        </div>

        {activeTab === 'stations' && selectedIds.length > 1 && (
          <button onClick={() => setIsTourBuilderOpen(true)} className="bg-amber-600 hover:bg-amber-500 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-3xl animate-fade-in-up">ربط {selectedIds.length} أعمال فنية في مسار سردي 🧭</button>
        )}
      </div>

      {activeTab === 'install' ? (
        <form onSubmit={handleSaveStation} className="bg-slate-900/60 p-12 rounded-[4rem] border border-slate-800 space-y-12 max-w-6xl mx-auto shadow-4xl backdrop-blur-md animate-fade-in-up">
           <div className="flex justify-between items-center border-b border-slate-800 pb-8">
              <button type="button" onClick={() => setActiveTab('stations')} className="text-slate-500 hover:text-white transition-colors">إلغاء التركيب ×</button>
              <div className="text-right">
                <h4 className="text-2xl font-black text-white">{editingItem ? 'تعديل خصائص العمل الفني' : 'إرساء عمل فني جديد في الميدان'}</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Manual Installation & AI Collaboration</p>
              </div>
           </div>

           <div className="grid lg:grid-cols-12 gap-12">
              {/* Column 1: Attribution & Identity */}
              <div className="lg:col-span-4 space-y-8 border-l border-slate-800/50 pl-12">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">1. نسب العمل الإبداعي</label>
                    <div className="grid grid-cols-3 gap-2">
                       {['artist', 'ai', 'hybrid'].map((type) => (
                         <button 
                           key={type}
                           type="button"
                           onClick={() => setFormData({...formData, authorType: type as AuthorType})}
                           className={`py-3 rounded-xl border text-[9px] font-black uppercase transition-all ${formData.authorType === type ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'}`}
                         >
                           {type === 'artist' ? 'فنان بشري' : type === 'ai' ? 'ذكاء اصطناعي' : 'تعاون مشترك'}
                         </button>
                       ))}
                    </div>
                 </div>

                 {formData.authorType !== 'ai' && (
                   <div className="space-y-3 animate-fade-in">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">اسم الفنان المتعاون</label>
                      <input type="text" placeholder="مثلاً: د. ليلى العثمان" value={formData.artistName || ''} onChange={e => setFormData({...formData, artistName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white text-right outline-none focus:border-indigo-500" />
                   </div>
                 )}

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">نوع التدخل الميداني</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as InterventionType})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-indigo-500 appearance-none text-right">
                       {Object.entries(TYPE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                    </select>
                 </div>
              </div>

              {/* Column 2: Narrative & Curation */}
              <div className="lg:col-span-8 space-y-10">
                 <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">الموقع الجغرافي</label>
                       <input type="text" required placeholder="مثال: باب زويلة، القاهرة" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white text-right outline-none focus:border-indigo-500 shadow-inner" />
                    </div>
                    <div className="flex gap-4">
                       <div className="space-y-3 flex-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">خط العرض</label>
                          <input type="number" step="any" value={formData.latitude || ''} onChange={e => setFormData({...formData, latitude: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 text-xs" />
                       </div>
                       <div className="space-y-3 flex-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">خط الطول</label>
                          <input type="number" step="any" value={formData.longitude || ''} onChange={e => setFormData({...formData, longitude: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 text-xs" />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6 bg-slate-950/40 p-8 rounded-[2.5rem] border border-slate-800 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500/20"></div>
                    <div className="flex justify-between items-center mb-2">
                       <button type="button" onClick={handleAISmoothText} disabled={refiningText || !formData.rawArtistNotes} className="text-[10px] font-black bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">
                          {refiningText ? 'جاري الصقل ذكياً...' : '✨ صقل بلمسة Gemini'}
                       </button>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ملاحظات الفنان (الخام)</label>
                    </div>
                    <textarea 
                       placeholder="اكتب هنا ما يصفه الفنان عن العمل أو الحكاية التي يريد سردها..." 
                       value={formData.rawArtistNotes || ''} 
                       onChange={e => setFormData({...formData, rawArtistNotes: e.target.value})}
                       className="w-full bg-transparent border-none text-white text-right text-sm outline-none resize-none h-24 placeholder:text-slate-700 font-medium"
                    />
                    
                    <div className="pt-6 border-t border-slate-800 space-y-4">
                       <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">السرد الثقافي المصقول (النص النهائي)</label>
                       <textarea 
                          placeholder="هذا النص هو ما سيظهر للجمهور..." 
                          value={formData.curatorNote || ''} 
                          onChange={e => setFormData({...formData, curatorNote: e.target.value})}
                          className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-white text-right font-amiri text-lg outline-none focus:border-indigo-600/40 min-h-[120px]"
                       />
                    </div>
                 </div>

                 <div className="grid md:grid-cols-2 gap-10 pt-6">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">الأصول البصرية للفنان</label>
                       <FileUploader mediaType="image" label="رفع عمل الفنان" onUploadComplete={(url) => setFormData({...formData, mediaUrl: url})} />
                       {formData.mediaUrl && <div className="h-20 w-32 rounded-xl overflow-hidden border border-indigo-500/30 shadow-2xl animate-fade-in"><img src={formData.mediaUrl} className="w-full h-full object-cover" /></div>}
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">التسجيل الصوتي</label>
                       <FileUploader mediaType="audio" label="رفع ملف صوتي" onUploadComplete={(url) => setFormData({...formData, audioUrl: url})} />
                       <p className="text-[9px] text-slate-600 font-bold leading-relaxed">* يمكن رفع تسجيل الفنان البشري، أو استخدام محرك Gemini TTS في وقت لاحق بناءً على النص المصقول.</p>
                    </div>
                 </div>
              </div>
           </div>

           <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-3xl shadow-indigo-600/40 transition-all active:scale-[0.98]">
             {editingItem ? 'اعتماد التحديثات المنسقة' : 'تأكيد إرساء العمل في الموقع الميداني'}
           </button>
        </form>
      ) : activeTab === 'stations' ? (
        <div className="bg-slate-900/60 rounded-[4rem] border border-slate-800 overflow-hidden shadow-4xl relative">
          <table className="w-full text-right">
            <thead className="bg-slate-800/40 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-10 py-6">الربط</th>
                <th className="px-10 py-6">المبدع / الهوية</th>
                <th className="px-10 py-6">التدخل والموقع</th>
                <th className="px-10 py-6">الأصول</th>
                <th className="px-10 py-6 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {interventions.map(item => (
                <tr key={item.id} className={`hover:bg-indigo-600/5 transition-colors ${selectedIds.includes(item.id) ? 'bg-indigo-600/10' : ''}`}>
                  <td className="px-10 py-8">
                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => setSelectedIds(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id])} className="w-5 h-5 accent-indigo-500 cursor-pointer" />
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex flex-col gap-1">
                       <span className="font-black text-white">{item.artistName || 'غير مسمى'}</span>
                       <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border w-fit uppercase tracking-tighter 
                         ${item.authorType === 'artist' ? 'border-emerald-500/30 text-emerald-400' : item.authorType === 'ai' ? 'border-indigo-500/30 text-indigo-400' : 'border-amber-500/30 text-amber-400'}`}>
                         {item.authorType === 'artist' ? 'بشري' : item.authorType === 'ai' ? 'AI' : 'هجين'}
                       </span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className="font-black text-indigo-300 block text-sm">{TYPE_LABELS[item.type]}</span>
                    <div className="text-[11px] text-slate-500 font-bold">{item.location}</div>
                  </td>
                  <td className="px-10 py-8">
                     <div className="flex gap-2">
                        {item.mediaUrl && <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/5 overflow-hidden"><img src={item.mediaUrl} className="w-full h-full object-cover" /></div>}
                        {item.audioUrl && <div className="w-10 h-10 rounded-xl bg-indigo-950 flex items-center justify-center text-xs shadow-inner">🎙️</div>}
                     </div>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <div className="flex justify-center gap-3">
                      <button onClick={() => handleEditItem(item)} className="p-3 bg-slate-800 hover:bg-indigo-600 text-white rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                      <button onClick={async () => { if(window.confirm('حذف نهائي؟')) { onUpdateInterventions(interventions.filter(i => i.id !== item.id)); await supabase.from('interventions').delete().eq('id', item.id); } }} className="p-3 bg-slate-800 hover:bg-red-600 text-white rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {interventions.length === 0 && <div className="p-32 text-center text-slate-600 italic space-y-4">
             <div className="text-6xl opacity-10">🏛️</div>
             <p className="text-lg">لا توجد أعمال فنية مرساة حالياً. ابدأ بإضافة عمل جديد أو استيراد حزمة فنية.</p>
          </div>}
        </div>
      ) : activeTab === 'advanced' ? (
        <AdvancedTemplateSystem onComplete={refreshDataAfterImport} />
      ) : activeTab === 'library' ? (
        <ExperienceLibrary onImportComplete={refreshDataAfterImport} />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
           {curatedTours.map(tour => (
             <div key={tour.id} className="bg-slate-900/60 p-10 rounded-[3.5rem] border border-slate-800 space-y-6 relative group overflow-hidden shadow-2xl flex flex-col">
                <div className="absolute top-0 right-0 w-full h-1.5 bg-indigo-500 opacity-50"></div>
                <div className="flex justify-between items-start">
                   <span className="text-[10px] font-black text-indigo-400 bg-indigo-950 px-3 py-1 rounded-full border border-indigo-500/20">{tour.theme}</span>
                   <span className="text-[10px] font-black text-slate-500 uppercase">{tour.stops.length} أعمال مرساة</span>
                </div>
                <h4 className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors">{tour.name}</h4>
                <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed flex-1">{tour.description}</p>
                <div className="pt-8 border-t border-slate-800 flex gap-2">
                   <button onClick={() => setDesigningTour(tour)} className="flex-1 bg-slate-800 hover:bg-indigo-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase transition-all shadow-xl">الهوية البصرية 🎨</button>
                   <button className="bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase transition-all">QR 🧭</button>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Builder Modals (Unchanged Logic, keeping consistent with design) */}
      {isTourBuilderOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
           <div className="w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-800 rounded-[3.5rem] overflow-hidden flex flex-col shadow-4xl animate-scale-up">
              <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                <button onClick={() => setIsTourBuilderOpen(false)} className="p-3 bg-slate-800 text-white rounded-full">×</button>
                <h4 className="text-xl font-black text-white uppercase tracking-widest">منظم المسارات المنسقة</h4>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <TourBuilder interventions={interventions} initialSelection={selectedIds} onStartTour={async (stops) => {
                   const newTour: CuratedTour = { 
                     id: 'tour-' + Date.now(), 
                     name: `مسار منسق جديد في ${stops[0].location.split('،')[0]}`, 
                     description: 'رحلة فنية تم اختيارها بعناية من قبل المنسق الثقافي.', 
                     stops: stops.map(s => s.id), 
                     theme: 'art', 
                     city: 'القاهرة',
                     ui_config: { primaryColor: '#4f46e5', accentColor: '#818cf8', fontFamily: 'Cairo', viewMode: 'map', buttonShape: 'rounded', glassEffect: true, cardStyle: 'elevated' }
                   };
                   onUpdateTours([...curatedTours, newTour]);
                   await supabase.from('curated_tours').insert(newTour);
                   setIsTourBuilderOpen(false);
                   setActiveTab('tours');
                   setSelectedIds([]);
                }} />
              </div>
           </div>
        </div>
      )}

      {designingTour && (
        <div className="fixed inset-0 z-[700] bg-slate-950">
          <TourDesigner tour={designingTour} onSave={async (t) => {
            onUpdateTours(curatedTours.map(tour => tour.id === t.id ? t : tour));
            setDesigningTour(null);
            await supabase.from('curated_tours').upsert(t);
          }} onCancel={() => setDesigningTour(null)} />
        </div>
      )}
    </div>
  );
};
