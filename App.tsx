
import React, { useState, useEffect } from 'react';
import { InterventionType, InterventionItem, CuratedTour } from './types';
import { InterventionCard } from './components/InterventionCard';
import { BenchSimulator } from './components/BenchSimulator';
import { MuralVisualizer } from './components/MuralVisualizer';
import { ImmersivePath } from './components/ImmersivePath';
import { DoorIntervention } from './components/DoorIntervention';
import { VisualArtsGallery } from './components/VisualArtsGallery';
import { MapViewer } from './components/MapViewer';
import { InterventionManagement } from './components/InterventionManagement';
import { InterventionVault } from './components/InterventionVault';
import { updateInterventionSEO } from './services/seoService';

const INITIAL_DATA: InterventionItem[] = [
  { id: '1', type: InterventionType.BENCH, mediaType: 'audio', location: 'حديقة الأزهر، القاهرة', latitude: 30.0406, longitude: 31.2635, status: 'active', lastUpdated: '2024-05-10', interactCount: 1240, mediaUrl: 'https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=800' },
  { id: '2', type: InterventionType.MURAL, mediaType: 'image', location: 'وسط البلد، بيروت', latitude: 33.8938, longitude: 35.5018, status: 'active', lastUpdated: '2024-05-12', interactCount: 850, mediaUrl: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800' },
  { id: '3', type: InterventionType.PATH, mediaType: 'audio', location: 'حي الطريف، الدرعية', latitude: 24.6854, longitude: 46.5417, status: 'active', lastUpdated: '2024-05-15', interactCount: 430, mediaUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800' },
  { id: '4', type: InterventionType.DOOR, mediaType: 'multimodal', location: 'باب الفتوح، القاهرة القديمة', latitude: 30.0543, longitude: 31.2642, status: 'active', lastUpdated: '2024-05-20', interactCount: 2100, mediaUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=800' },
  { id: '5', type: InterventionType.GALLERY, mediaType: 'image', location: 'حي الفنون، الرياض', latitude: 24.7136, longitude: 46.6753, status: 'active', lastUpdated: '2024-05-25', interactCount: 3200, mediaUrl: 'https://images.unsplash.com/photo-1554188248-986adbb73be4?auto=format&fit=crop&q=80&w=800' },
];

const INITIAL_TOURS: CuratedTour[] = [
  { id: 't1', name: 'مسار ذاكرة المدينة القديمة', description: 'جولة تجمع بين حكايا المقاعد وأسرار الأبواب التاريخية لإعادة إرساء الهوية في القلوب.', stops: ['1', '4'], theme: 'heritage', isOfficial: true },
  { id: 't2', name: 'جولة النبض الرقمي والفنون', description: 'تجربة غامرة تربط الجداريات التفاعلية بمرسم الذكاء الاصطناعي لاستكشاف مستقبل المدينة.', stops: ['2', '5'], theme: 'art', isOfficial: true }
];

type ViewType = 'platform' | 'vault' | 'management';
type ShowcaseMode = 'grid' | 'map';
type SidebarMode = 'interventions' | 'suggested_tours';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('platform');
  const [showcaseMode, setShowcaseMode] = useState<ShowcaseMode>('grid');
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('interventions');
  
  const [interventions, setInterventions] = useState<InterventionItem[]>(INITIAL_DATA);
  const [curatedTours, setCuratedTours] = useState<CuratedTour[]>(INITIAL_TOURS);
  
  const [activeIntervention, setActiveIntervention] = useState<InterventionItem>(interventions[0]);
  const [activeTour, setActiveTour] = useState<CuratedTour | null>(null);
  const [currentTourStopIndex, setCurrentTourStopIndex] = useState(0);

  // حالة للتحكم في فتح نموذج الإدارة من الخزينة
  const [pendingAnchorType, setPendingAnchorType] = useState<InterventionType | null>(null);

  useEffect(() => {
    const titles: Record<ViewType, string> = {
      platform: 'المنصة التفاعلية',
      vault: 'خزينة التدخلات',
      management: 'الإدارة والتموضع'
    };
    updateInterventionSEO(titles[currentView], 'التدخلات الإبداعية الحضرية', 'استكشف أنسنة المدن من خلال التقنية.');
  }, [currentView]);

  const handleSelectIntervention = (item: InterventionItem) => {
    setActiveIntervention(item);
    setActiveTour(null);
    if (currentView !== 'platform') setCurrentView('platform');
  };

  const handleSelectTour = (tour: CuratedTour) => {
    setActiveTour(tour);
    setCurrentTourStopIndex(0);
    const firstStopId = tour.stops[0];
    const firstStop = interventions.find(i => i.id === firstStopId) || interventions[0];
    setActiveIntervention(firstStop);
    if (currentView !== 'platform') setCurrentView('platform');
  };

  const handleNextStop = () => {
    if (activeTour && currentTourStopIndex < activeTour.stops.length - 1) {
      const nextIndex = currentTourStopIndex + 1;
      setCurrentTourStopIndex(nextIndex);
      const nextStop = interventions.find(i => i.id === activeTour.stops[nextIndex]);
      if (nextStop) setActiveIntervention(nextStop);
    }
  };

  const handlePrevStop = () => {
    if (activeTour && currentTourStopIndex > 0) {
      const prevIndex = currentTourStopIndex - 1;
      setCurrentTourStopIndex(prevIndex);
      const prevStop = interventions.find(i => i.id === activeTour.stops[prevIndex]);
      if (prevStop) setActiveIntervention(prevStop);
    }
  };

  const handleAnchorFromVault = (type: InterventionType) => {
    setPendingAnchorType(type);
    setCurrentView('management');
  };

  const renderSimulator = () => {
    switch (activeIntervention.type) {
      case InterventionType.BENCH: return <BenchSimulator />;
      case InterventionType.MURAL: return <MuralVisualizer />;
      case InterventionType.PATH: return <ImmersivePath />;
      case InterventionType.DOOR: return <DoorIntervention />;
      case InterventionType.GALLERY: return <VisualArtsGallery />;
      default: return <BenchSimulator />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-cairo overflow-x-hidden">
      <nav className="relative z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center font-black text-white shadow-xl shadow-indigo-500/20">ت</div>
            <div className="text-right hidden sm:block">
              <span className="font-black text-lg block tracking-tight">التدخلات الإبداعية</span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Urban Humanity 4.0</span>
            </div>
          </div>
          
          <div className="flex bg-slate-800/50 rounded-2xl p-1 border border-slate-700/50 shadow-inner">
            <button onClick={() => { setCurrentView('platform'); setPendingAnchorType(null); }} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${currentView === 'platform' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>المنصة</button>
            <button onClick={() => { setCurrentView('vault'); setPendingAnchorType(null); }} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${currentView === 'vault' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>خزينة التدخلات</button>
            <button onClick={() => { setCurrentView('management'); }} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${currentView === 'management' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>الإدارة والتموضع</button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {currentView === 'platform' ? (
          <>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 text-right">
              <div className="space-y-2 order-2 md:order-1">
                <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">صدى <span className="text-indigo-500">المدينة</span> التفاعلي</h1>
                <p className="text-slate-400 font-medium text-lg">استكشف كافة التدخلات الإبداعية أو اتبع المسارات المقترحة.</p>
              </div>
              <div className="bg-slate-800/40 p-1.5 rounded-2xl border border-slate-700/50 inline-flex order-1 md:order-2">
                <button onClick={() => setShowcaseMode('grid')} className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${showcaseMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>عرض المحاكي</button>
                <button onClick={() => setShowcaseMode('map')} className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${showcaseMode === 'map' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>عرض الخريطة</button>
              </div>
            </div>

            {showcaseMode === 'grid' ? (
              <div className="grid lg:grid-cols-12 gap-8 animate-fade-in items-start">
                <aside className="lg:col-span-4 space-y-4 max-h-[850px] overflow-y-auto pr-2 custom-scrollbar sticky top-32">
                  <div className="bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-800/60 shadow-2xl backdrop-blur-md">
                    <div className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-800 mb-6">
                      <button onClick={() => setSidebarMode('interventions')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${sidebarMode === 'interventions' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>تدخلات فردية</button>
                      <button onClick={() => setSidebarMode('suggested_tours')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${sidebarMode === 'suggested_tours' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>جولات مقترحة</button>
                    </div>

                    <div className="space-y-4">
                      {sidebarMode === 'interventions' ? (
                        interventions.map((item, idx) => (
                          <InterventionCard key={item.id} id={idx + 1} title={item.location} description={item.type} icon={<span>📍</span>} active={!activeTour && activeIntervention.id === item.id} onClick={() => handleSelectIntervention(item)} />
                        ))
                      ) : (
                        curatedTours.map((tour) => (
                          <button key={tour.id} onClick={() => handleSelectTour(tour)} className={`w-full p-6 rounded-3xl border text-right transition-all group ${activeTour?.id === tour.id ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-800/40 border-slate-800 hover:border-slate-600'}`}>
                            <div className="flex justify-between items-start mb-2">
                               <span className="text-[9px] font-black bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">{tour.theme}</span>
                               <span className="text-[9px] font-black text-slate-500">{tour.stops.length} محطات</span>
                            </div>
                            <h4 className="font-black text-white group-hover:text-indigo-300 transition-colors">{tour.name}</h4>
                            <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">{tour.description}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </aside>

                <section className="lg:col-span-8 space-y-6">
                   <div className="bg-slate-900/80 rounded-[4rem] border border-slate-800/50 p-4 shadow-3xl min-h-[750px] overflow-hidden backdrop-blur-sm relative">
                      {renderSimulator()}
                      
                      {activeTour && (
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] bg-slate-950/80 backdrop-blur-2xl border border-indigo-500/30 rounded-[2.5rem] p-6 flex items-center justify-between shadow-3xl animate-fade-in-up">
                           <div className="flex items-center gap-4">
                              <button onClick={handleNextStop} disabled={currentTourStopIndex === activeTour.stops.length - 1} className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-full flex items-center justify-center transition-all shadow-xl">
                                <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                              </button>
                              <div className="text-right">
                                 <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">المحطة التالية</div>
                                 <div className="text-xs font-bold text-white">{currentTourStopIndex < activeTour.stops.length - 1 ? (interventions.find(i => i.id === activeTour.stops[currentTourStopIndex + 1])?.location) : 'نهاية الجولة'}</div>
                              </div>
                           </div>
                           <div className="text-center">
                              <div className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">مسار الجولة</div>
                              <div className="flex items-center gap-2">
                                 {activeTour.stops.map((_, idx) => (
                                    <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentTourStopIndex ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-800'}`}></div>
                                 ))}
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="text-left">
                                 <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">المحطة الحالية</div>
                                 <div className="text-xs font-bold text-white">{(currentTourStopIndex + 1)} من {activeTour.stops.length}</div>
                              </div>
                              <button onClick={handlePrevStop} disabled={currentTourStopIndex === 0} className="w-12 h-12 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white rounded-full flex items-center justify-center transition-all shadow-xl">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                              </button>
                           </div>
                        </div>
                      )}
                   </div>
                </section>
              </div>
            ) : (
              <MapViewer interventions={interventions} onSelectIntervention={handleSelectIntervention} />
            )}
          </>
        ) : currentView === 'vault' ? (
          <InterventionVault onExplore={handleAnchorFromVault} />
        ) : (
          <InterventionManagement 
            interventions={interventions} 
            onUpdateInterventions={setInterventions} 
            curatedTours={curatedTours}
            onUpdateTours={setCuratedTours}
            initialAnchorType={pendingAnchorType}
            onClearPendingType={() => setPendingAnchorType(null)}
          />
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
};

export default App;
