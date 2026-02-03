
import React, { useState, useMemo, useEffect } from 'react';
import { InterventionItem, InterventionType, ExternalAsset, CuratedTour, TourTheme } from '../types';
import { ShareModal } from './ShareModal';
import { TourShareModal } from './TourShareModal';
import { TourBuilder } from './TourBuilder';
import { getStats } from '../services/analyticsService';

interface Props {
  interventions: InterventionItem[];
  onUpdateInterventions: (items: InterventionItem[]) => void;
  curatedTours: CuratedTour[];
  onUpdateTours: (tours: CuratedTour[]) => void;
  initialAnchorType?: InterventionType | null;
  onClearPendingType?: () => void;
}

const TYPE_LABELS: Record<InterventionType, string> = {
  [InterventionType.BENCH]: 'مقعد حكايا',
  [InterventionType.MURAL]: 'جدارية بصرية',
  [InterventionType.PATH]: 'ممر سمعي (مسار)',
  [InterventionType.DOOR]: 'أبواب المدينة',
  [InterventionType.GALLERY]: 'معرض الفنون البصرية'
};

export const InterventionManagement: React.FC<Props> = ({ 
  interventions, 
  onUpdateInterventions, 
  curatedTours, 
  onUpdateTours,
  initialAnchorType,
  onClearPendingType
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'tours' | 'stats'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTourBuilderOpen, setIsTourBuilderOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InterventionItem | null>(null);
  const [sharingItem, setSharingItem] = useState<InterventionItem | null>(null);
  const [sharingTourItems, setSharingTourItems] = useState<InterventionItem[] | null>(null);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [platformStats, setPlatformStats] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState<Partial<InterventionItem>>({
    location: '', type: InterventionType.BENCH, mediaType: 'audio', status: 'active',
    latitude: 30.0444, longitude: 31.2357, mediaUrl: '', curatorNotes: '', externalAssets: []
  });

  const [assetInput, setAssetInput] = useState({ label: '', url: '', provider: 'drive' as ExternalAsset['provider'] });

  // تفعيل الإرساء القادم من الخزينة
  useEffect(() => {
    if (initialAnchorType) {
      setEditingItem(null);
      setFormData({
        location: '', 
        type: initialAnchorType, 
        mediaType: initialAnchorType === InterventionType.BENCH ? 'audio' : 'image', 
        status: 'active', 
        latitude: 30.0444, 
        longitude: 31.2357, 
        mediaUrl: '', 
        curatorNotes: '', 
        externalAssets: [] 
      });
      setIsFormOpen(true);
      setActiveTab('list');
      if (onClearPendingType) onClearPendingType();
    }
  }, [initialAnchorType]);

  useEffect(() => {
    if (activeTab === 'stats') setPlatformStats(getStats());
  }, [activeTab]);

  const filteredInterventions = useMemo(() => {
    return interventions.filter(item => {
      const matchesSearch = item.location.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           TYPE_LABELS[item.type].includes(searchTerm);
      return matchesSearch;
    });
  }, [interventions, searchTerm]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedIds.length === filteredInterventions.length) setSelectedIds([]);
    else setSelectedIds(filteredInterventions.map(i => i.id));
  };

  const handleCreateTourFromSelection = () => {
    if (selectedIds.length < 1) return;
    const newTour: CuratedTour = {
      id: 'tour-' + Date.now(),
      name: `مسار سريع (${new Date().toLocaleDateString('ar-EG')})`,
      description: 'مسار تم إنشاؤه من خلال الاختيار المتعدد في لوحة الإدارة.',
      stops: selectedIds,
      theme: 'heritage',
      isOfficial: true
    };
    onUpdateTours([...curatedTours, newTour]);
    setSelectedIds([]);
    setActiveTab('tours');
  };

  const handleBulkDelete = () => {
    if (window.confirm(`هل أنت متأكد من حذف ${selectedIds.length} تدخلات مختارة؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      onUpdateInterventions(interventions.filter(i => !selectedIds.includes(i.id)));
      setSelectedIds([]);
    }
  };

  const deleteIntervention = (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا التدخل الميداني؟ لا يمكن التراجع عن هذه الخطوة.')) {
      onUpdateInterventions(interventions.filter(i => i.id !== id));
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleAddAsset = () => {
    if (!assetInput.url) return;
    const newAsset: ExternalAsset = {
      id: Math.random().toString(36).substr(2, 5),
      label: assetInput.label || 'ملخص المحتوى',
      url: assetInput.url,
      provider: assetInput.provider
    };
    setFormData(prev => ({ ...prev, externalAssets: [...(prev.externalAssets || []), newAsset] }));
    setAssetInput({ label: '', url: '', provider: 'drive' });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: InterventionItem = {
      id: editingItem?.id || Math.random().toString(36).substr(2, 9),
      location: formData.location || '',
      type: formData.type || InterventionType.BENCH,
      mediaType: formData.mediaType || 'audio',
      status: formData.status || 'active',
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      interactCount: editingItem?.interactCount || 0,
      lastUpdated: new Date().toISOString().split('T')[0],
      mediaUrl: formData.mediaUrl || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800',
      curatorNotes: formData.curatorNotes,
      externalAssets: formData.externalAssets
    };

    if (editingItem) {
      onUpdateInterventions(interventions.map(i => i.id === editingItem.id ? newItem : i));
    } else {
      onUpdateInterventions([newItem, ...interventions]);
    }
    setIsFormOpen(false);
  };

  const deleteTour = (id: string) => {
    if (window.confirm('هل تريد حذف هذا المسار المنسق نهائياً؟')) {
      onUpdateTours(curatedTours.filter(t => t.id !== id));
    }
  };

  return (
    <div className="animate-fade-in space-y-10 pb-24 text-right">
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-block px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">مختبر التموضع والتحكم</div>
          <h2 className="text-4xl font-black text-white">إدارة <span className="text-indigo-500">الأدوات والمحتوى</span></h2>
          <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700 w-fit mt-4 shadow-inner">
            <button onClick={() => setActiveTab('list')} className={`px-6 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>التدخلات الميدانية</button>
            <button onClick={() => setActiveTab('tours')} className={`px-6 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'tours' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>الجولات المنسقة</button>
            <button onClick={() => setActiveTab('stats')} className={`px-6 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'stats' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>إحصائيات الأداء</button>
          </div>
        </div>
        
        <div className="flex gap-4">
           {activeTab === 'list' && (
             <button 
               onClick={() => { setEditingItem(null); setFormData({ location: '', type: InterventionType.BENCH, mediaType: 'audio', status: 'active', latitude: 30.0444, longitude: 31.2357, mediaUrl: '', curatorNotes: '', externalAssets: [] }); setIsFormOpen(true); }} 
               className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20"
             >
               + إرساء تدخل جديد
             </button>
           )}
           {activeTab === 'tours' && (
             <button 
               onClick={() => setIsTourBuilderOpen(true)} 
               className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-amber-600/20"
             >
               + إنشاء مسار مقترح
             </button>
           )}
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'list' ? (
        <div className="space-y-4">
          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="bg-indigo-600 p-4 rounded-2xl flex items-center justify-between shadow-2xl animate-fade-in-up">
              <div className="flex gap-4">
                <button 
                  onClick={handleCreateTourFromSelection}
                  className="bg-white text-indigo-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-100"
                >
                  إنشاء مسار من المختار ({selectedIds.length})
                </button>
                <button 
                  onClick={handleBulkDelete}
                  className="bg-red-500 hover:bg-red-400 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg"
                >
                  حذف المحدد ({selectedIds.length})
                </button>
                <button 
                  onClick={() => setSelectedIds([])}
                  className="text-white/70 hover:text-white text-[10px] font-black uppercase"
                >
                  إلغاء التحديد
                </button>
              </div>
              <span className="text-white font-bold text-xs">تم اختيار {selectedIds.length} محطات ميدانية</span>
            </div>
          )}

          <div className="bg-slate-900/60 rounded-[3rem] border border-slate-800/50 overflow-hidden shadow-3xl backdrop-blur-md">
            <div className="p-8 border-b border-slate-800/50 flex justify-between items-center">
               <input 
                 type="text" 
                 placeholder="ابحث في المواقع أو الأدوات..." 
                 value={searchTerm} 
                 onChange={(e) => setSearchTerm(e.target.value)} 
                 className="bg-slate-800/50 border border-slate-700 rounded-xl px-6 py-2 text-sm text-white focus:border-indigo-500 outline-none w-64 text-right" 
               />
               <button 
                 onClick={selectAll}
                 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300"
               >
                 {selectedIds.length === filteredInterventions.length ? 'إلغاء اختيار الكل' : 'اختيار كل الظاهر'}
               </button>
            </div>
            
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-800/20 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-800">
                  <th className="px-8 py-5 text-center w-16">
                     <input 
                        type="checkbox" 
                        checked={selectedIds.length > 0 && selectedIds.length === filteredInterventions.length} 
                        onChange={selectAll}
                        className="w-4 h-4 accent-indigo-500 cursor-pointer"
                     />
                  </th>
                  <th className="px-8 py-5">الأداة / النوع</th>
                  <th className="px-8 py-5">الموقع الجغرافي</th>
                  <th className="px-8 py-5 text-center">المحتوى الخارجي</th>
                  <th className="px-8 py-5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredInterventions.map((item) => (
                  <tr key={item.id} className={`group hover:bg-indigo-600/5 transition-colors ${selectedIds.includes(item.id) ? 'bg-indigo-600/10' : ''}`}>
                    <td className="px-8 py-6 text-center">
                       <input 
                          type="checkbox" 
                          checked={selectedIds.includes(item.id)} 
                          onChange={() => toggleSelection(item.id)}
                          className="w-4 h-4 accent-indigo-500 cursor-pointer"
                       />
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-black text-white">{TYPE_LABELS[item.type]}</div>
                      <div className="text-[10px] text-indigo-400 font-bold uppercase">{item.mediaType}</div>
                    </td>
                    <td className="px-8 py-6 text-slate-400 font-bold text-sm">{item.location}</td>
                    <td className="px-8 py-6 text-center">
                      {item.externalAssets?.length ? (
                        <div className="flex flex-wrap justify-center gap-1">
                          {item.externalAssets.map(a => (
                            <span key={a.id} title={a.label} className="w-5 h-5 flex items-center justify-center bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-md text-[8px] font-black">
                              {a.provider === 'drive' ? 'D' : '🔗'}
                            </span>
                          ))}
                        </div>
                      ) : <span className="text-slate-600 text-[9px] uppercase">لا توجد أصول</span>}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setSharingItem(item)} className="p-3 bg-slate-800 hover:bg-indigo-600 rounded-xl text-indigo-400 hover:text-white transition-all" title="مشاركة">QR</button>
                        <button onClick={() => { setEditingItem(item); setFormData(item); setIsFormOpen(true); }} className="p-3 bg-slate-800 hover:bg-indigo-600 rounded-xl text-indigo-400 hover:text-white transition-all" title="تعديل">تعديل</button>
                        <button onClick={() => deleteIntervention(item.id)} className="p-3 bg-slate-800 hover:bg-red-600 rounded-xl text-red-400 hover:text-white transition-all" title="حذف">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'tours' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
           {curatedTours.map(tour => (
             <div key={tour.id} className="bg-slate-900/60 p-8 rounded-[2.5rem] border border-slate-800 space-y-4 hover:border-indigo-500/40 transition-all group">
                <div className="flex justify-between items-start">
                   <span className="text-[9px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-1 rounded-lg uppercase">{tour.theme}</span>
                   <button onClick={() => deleteTour(tour.id)} className="text-red-400 hover:text-red-300 transition-colors text-xs font-bold opacity-0 group-hover:opacity-100">حذف</button>
                </div>
                <h4 className="text-xl font-black text-white">{tour.name}</h4>
                <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{tour.description}</p>
                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                   <span className="text-[10px] font-bold text-slate-500">{tour.stops.length} محطات ميدانية</span>
                   <button onClick={() => setSharingTourItems(interventions.filter(i => tour.stops.includes(i.id)))} className="text-indigo-400 text-xs font-black hover:text-indigo-300">مشاركة QR المسار</button>
                </div>
             </div>
           ))}
           {curatedTours.length === 0 && (
             <div className="col-span-full py-24 bg-slate-900/40 rounded-[3rem] border border-dashed border-slate-800 text-center text-slate-500 italic">لا توجد جولات منسقة حالياً. ابدأ بإنشاء واحدة!</div>
           )}
        </div>
      ) : (
        <div className="bg-slate-900/60 p-12 rounded-[3rem] border border-slate-800 text-center">
           <h4 className="text-xl font-black text-white mb-6">سجل النشاط الميداني</h4>
           <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
             {platformStats.length > 0 ? platformStats.map((stat, idx) => (
               <div key={idx} className="bg-slate-800/40 p-4 rounded-2xl flex items-center justify-between border border-white/5">
                 <span className="text-[10px] text-slate-500">{new Date(stat.timestamp).toLocaleString('ar-EG')}</span>
                 <div className="text-right">
                    <div className="text-indigo-400 font-bold text-sm">{stat.event}</div>
                    <div className="text-[9px] text-slate-500">{JSON.stringify(stat.metadata)}</div>
                 </div>
               </div>
             )) : <div className="text-slate-600 italic">لا توجد إحصائيات مسجلة حالياً</div>}
           </div>
        </div>
      )}

      {/* Workspace Modal (Add/Edit) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-4xl animate-scale-up">
            <div className="p-8 border-b border-slate-800 flex items-center justify-between shrink-0">
              <button onClick={() => setIsFormOpen(false)} className="p-2 text-slate-500 hover:text-white text-2xl transition-colors">×</button>
              <h4 className="text-2xl font-black text-white">{editingItem ? 'تحديث التموضع' : 'تأسيس تدخل جديد'}</h4>
            </div>

            <div className="overflow-y-auto p-10 space-y-8 flex-1 custom-scrollbar text-right">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">نوع الأداة الإبداعية</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value as InterventionType})} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white text-right outline-none focus:border-indigo-500 appearance-none">
                    {Object.entries(InterventionType).map(([key, value]) => (<option key={key} value={value}>{TYPE_LABELS[value]}</option>))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">الموقع الميداني (نصي)</label>
                  <input type="text" placeholder="مثل: حارة الروم، القاهرة" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white text-right outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">رؤية القيم الفني للتموضع (Anchoring Notes)</label>
                <textarea rows={2} placeholder="الهدف الإبداعي من هذا التموضع في هذا المكان تحديداً..." value={formData.curatorNotes} onChange={(e) => setFormData({...formData, curatorNotes: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white text-right font-medium outline-none focus:border-indigo-500" />
              </div>

              {/* External Assets Feeding Section */}
              <div className="space-y-4 border-t border-slate-800 pt-8">
                <div className="flex items-center justify-between">
                   <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">تغذية المحتوى الرقمي الخارجي (درايف / سحابة)</div>
                   <span className="text-slate-600 text-[9px] italic">ربط ملفات الصوت أو الفيديو أو الوثائق</span>
                </div>
                <div className="grid grid-cols-12 gap-3 items-end bg-slate-800/40 p-6 rounded-3xl border border-slate-700/30">
                   <div className="col-span-3 space-y-1">
                      <label className="text-[8px] text-slate-500 pr-2">المزود</label>
                      <select value={assetInput.provider} onChange={e => setAssetInput({...assetInput, provider: e.target.value as any})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs text-right outline-none">
                         <option value="drive">Google Drive</option>
                         <option value="dropbox">Dropbox</option>
                         <option value="cloud">Cloud Storage</option>
                         <option value="custom">رابط مخصص</option>
                      </select>
                   </div>
                   <div className="col-span-3 space-y-1">
                      <label className="text-[8px] text-slate-500 pr-2">اسم الملف / الوصف</label>
                      <input type="text" placeholder="مثلاً: تسجيلات الحكواتي" value={assetInput.label} onChange={e => setAssetInput({...assetInput, label: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs text-right outline-none" />
                   </div>
                   <div className="col-span-4 space-y-1">
                      <label className="text-[8px] text-slate-500 pr-2">الرابط المباشر (URL)</label>
                      <input type="url" placeholder="https://drive.google.com/..." value={assetInput.url} onChange={e => setAssetInput({...assetInput, url: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs text-right outline-none" />
                   </div>
                   <div className="col-span-2">
                      <button type="button" onClick={handleAddAsset} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg">ربط</button>
                   </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4 justify-end">
                  {formData.externalAssets?.map(asset => (
                    <div key={asset.id} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 flex items-center gap-3 group animate-fade-in shadow-inner">
                       <button type="button" onClick={() => setFormData({...formData, externalAssets: formData.externalAssets?.filter(a => a.id !== asset.id)})} className="text-red-400 hover:text-red-300 transition-colors">×</button>
                       <div className="text-right">
                          <div className="text-[10px] font-black text-white">{asset.label}</div>
                          <div className="text-[8px] text-indigo-400 uppercase tracking-tighter">{asset.provider}</div>
                       </div>
                       <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center text-[10px]">
                          {asset.provider === 'drive' ? '📁' : '🔗'}
                       </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-10">
                <button onClick={handleSave} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-[2rem] font-black text-sm uppercase shadow-xl shadow-indigo-600/20 transition-all">
                  {editingItem ? 'حفظ تحديثات التموضع' : 'تثبيت الأداة ميدانياً'}
                </button>
                <button onClick={() => setIsFormOpen(false)} className="px-10 bg-slate-800 text-slate-400 py-5 rounded-[2rem] font-black text-sm uppercase hover:bg-slate-700 transition-all">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tour Builder Integration Overlay */}
      {isTourBuilderOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
           <div className="w-full max-w-5xl h-[85vh] relative overflow-hidden bg-slate-900 border border-slate-800 rounded-[3rem] flex flex-col shadow-4xl animate-scale-up">
              <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900 z-10">
                <button onClick={() => setIsTourBuilderOpen(false)} className="p-3 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-all text-xl">×</button>
                <h4 className="text-xl font-black text-white uppercase tracking-widest">محرر المسارات الإبداعي المتقدم</h4>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <TourBuilder 
                   interventions={interventions} 
                   onStartTour={(stops) => {
                      const newTour: CuratedTour = {
                        id: 'tour-' + Date.now(),
                        name: 'مسار منسق مخصص',
                        description: 'مسار مخصص تم إنشاؤه عبر محرر المسارات المتقدم.',
                        stops: stops.map(s => s.id),
                        theme: 'art',
                        isOfficial: true
                      };
                      onUpdateTours([...curatedTours, newTour]);
                      setIsTourBuilderOpen(false);
                      setActiveTab('tours');
                   }} 
                />
              </div>
           </div>
        </div>
      )}

      {sharingItem && <ShareModal item={sharingItem} isOpen={!!sharingItem} onClose={() => setSharingItem(null)} />}
      {sharingTourItems && <TourShareModal items={sharingTourItems} isOpen={!!sharingTourItems} onClose={() => setSharingTourItems(null)} />}
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-scale-up { animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
      `}} />
    </div>
  );
};
