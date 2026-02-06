
import React, { useState, useEffect } from 'react';
import { ExperiencePackage, InterventionItem, CuratedTour, InterventionType } from '../types';
import { createClient } from '../services/supabase';

const MOCK_PACKAGES: ExperiencePackage[] = [
  {
    id: 'pkg-1',
    name: 'حزمة عبق الياسمين الدمشقي',
    description: 'مجموعة متكاملة تحاكي حياة الحارات القديمة، تشمل مقاعد حكايا تروي قصص الحكواتي وبوابات تتحدث عن نكهات المطبخ الشامي.',
    creator: 'مختبر العمران التشاركي',
    downloads: 1240,
    rating: 4.9,
    category: 'heritage',
    tags: ['تراث', 'دمشق', 'حكايات'],
    isOfficial: true,
    thumbnail: 'https://images.unsplash.com/photo-1590603740183-980e7f98e29f?auto=format&fit=crop&q=80&w=800',
    interventions: [
      // Fix: Added missing authorType to satisfy InterventionItem interface
      { id: 'int-d1', type: InterventionType.BENCH, mediaType: 'audio', location: 'ساحة النجمة', latitude: 33.5138, longitude: 36.2964, status: 'active', lastUpdated: '2024-01-01', interactCount: 0, authorType: 'artist', mediaUrl: 'https://images.unsplash.com/photo-1548013146-72479768bbaa?q=80&w=400' },
      { id: 'int-d2', type: InterventionType.DOOR, mediaType: 'multimodal', location: 'باب توما', latitude: 33.5150, longitude: 36.3100, status: 'active', lastUpdated: '2024-01-01', interactCount: 0, authorType: 'artist', mediaUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=400' }
    ],
    tours: [
      { id: 'tour-d1', name: 'مسار الحكواتي الشامي', description: 'رحلة من الساحة إلى الباب.', stops: ['int-d1', 'int-d2'], theme: 'heritage', city: 'دمشق' }
    ]
  },
  {
    id: 'pkg-2',
    name: 'نبض كازابلانكا البصري',
    description: 'تجربة فنية غامرة تركز على الجداريات التفاعلية التي تستجيب لأصوات المحيط في شوارع الدار البيضاء الحيوية.',
    creator: 'أكاديمية الفنون الرقمية',
    downloads: 850,
    rating: 4.7,
    category: 'art',
    tags: ['فن شارع', 'مغرب', 'تفاعلي'],
    isOfficial: false,
    thumbnail: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&q=80&w=800',
    interventions: [
      // Fix: Added missing authorType to satisfy InterventionItem interface
      { id: 'int-c1', type: InterventionType.MURAL, mediaType: 'image', location: 'شارع محمد الخامس', latitude: 33.5889, longitude: -7.6114, status: 'active', lastUpdated: '2024-01-01', interactCount: 0, authorType: 'artist', mediaUrl: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=400' }
    ],
    tours: []
  }
];

interface Props {
  onImportComplete: () => void;
}

export const ExperienceLibrary: React.FC<Props> = ({ onImportComplete }) => {
  const [packages] = useState<ExperiencePackage[]>(MOCK_PACKAGES);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cloningId, setCloningId] = useState<string | null>(null);

  const supabase = createClient();

  const handleClone = async (pkg: ExperiencePackage) => {
    setCloningId(pkg.id);
    try {
      const timestamp = Date.now();
      
      // 1. استنساخ التدخلات مع معرفات فريدة جديدة
      const idMapping: Record<string, string> = {};
      const clonedInterventions = pkg.interventions.map(int => {
        const newId = `clone-${timestamp}-${int.id}`;
        idMapping[int.id] = newId;
        return {
          ...int,
          id: newId,
          interactCount: 0,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
      });

      // 2. استنساخ الجولات وتحديث مراجع المحطات
      const clonedTours = pkg.tours.map(tour => ({
        ...tour,
        id: `clone-${timestamp}-${tour.id}`,
        stops: tour.stops.map(oldId => idMapping[oldId] || oldId)
      }));

      // 3. الحفظ في Supabase
      if (clonedInterventions.length > 0) {
        await supabase.from('interventions').insert(clonedInterventions);
      }
      if (clonedTours.length > 0) {
        await supabase.from('curated_tours').insert(clonedTours);
      }

      alert(`تم استنساخ حزمة "${pkg.name}" بنجاح في نظامك! 🎊`);
      onImportComplete();
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء استنساخ التجربة.");
    } finally {
      setCloningId(null);
    }
  };

  const filteredPackages = packages.filter(pkg => {
    const matchesFilter = filter === 'all' || pkg.category === filter;
    const matchesSearch = pkg.name.includes(searchQuery) || pkg.tags.some(t => t.includes(searchQuery));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-12 animate-fade-in text-right">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-6 bg-slate-900/40 p-8 rounded-[3rem] border border-slate-800 backdrop-blur-xl">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن تجربة بالاسم أو الوسم..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-12 py-4 text-white text-sm outline-none focus:border-teal-500 transition-all text-right"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
        </div>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-2xl px-8 py-4 text-white text-xs font-black uppercase appearance-none cursor-pointer hover:border-teal-500 transition-all text-right"
        >
          <option value="all">جميع الفئات</option>
          <option value="heritage">تراث وثقافة</option>
          <option value="art">فنون بصرية</option>
          <option value="gastronomy">تراث الطهي</option>
          <option value="education">تعليمي</option>
        </select>
      </div>

      {/* Package Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPackages.map(pkg => (
          <div
            key={pkg.id}
            className="bg-slate-900/60 rounded-[3.5rem] border border-slate-800 overflow-hidden group hover:border-teal-500/50 transition-all duration-500 shadow-2xl flex flex-col"
          >
            <div className="aspect-[16/10] bg-slate-800 relative overflow-hidden">
              <img
                src={pkg.thumbnail}
                alt={pkg.name}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
              {pkg.isOfficial && (
                <div className="absolute top-6 right-6 bg-teal-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                  <span>المستودع الرسمي</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                </div>
              )}
              <div className="absolute bottom-6 right-8 left-8 flex justify-between items-end">
                 <div className="bg-slate-950/80 backdrop-blur-md border border-white/5 px-3 py-1 rounded-lg flex items-center gap-1">
                    <span className="text-amber-400 text-xs">⭐</span>
                    <span className="text-white text-[10px] font-bold">{pkg.rating}</span>
                 </div>
                 <span className="text-white font-black text-xs uppercase opacity-60 tracking-widest">{pkg.creator}</span>
              </div>
            </div>

            <div className="p-8 space-y-6 flex-1 flex flex-col">
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-white leading-tight group-hover:text-teal-400 transition-colors">{pkg.name}</h3>
                <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed font-medium">
                  {pkg.description}
                </p>
              </div>

              <div className="flex items-center gap-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <span className="flex items-center gap-1.5">
                   <span className="text-teal-400 text-base">📍</span> {pkg.interventions.length} محطات
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-800"></span>
                <span className="flex items-center gap-1.5">
                   <span className="text-teal-400 text-base">🧭</span> {pkg.tours.length} جولات
                </span>
              </div>

              <div className="flex gap-2 flex-wrap justify-end">
                {pkg.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-[9px] px-3 py-1.5 bg-slate-950 text-teal-300 rounded-xl border border-teal-500/10 font-bold"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-800/50 mt-auto">
                <button
                  onClick={() => handleClone(pkg)}
                  disabled={cloningId === pkg.id}
                  className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-3xl shadow-teal-600/20 active:scale-95 flex items-center justify-center gap-3"
                >
                  {cloningId === pkg.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      جاري الاستنساخ السحابي...
                    </>
                  ) : (
                    <>
                      📦 استنساخ واستخدام التجربة
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPackages.length === 0 && (
        <div className="py-40 text-center space-y-4">
          <div className="text-6xl opacity-10">🏜️</div>
          <p className="text-slate-500 italic font-medium">لا توجد حزم تطابق بحثك حالياً...</p>
        </div>
      )}
    </div>
  );
};
