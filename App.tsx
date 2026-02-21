
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
import { TourPWAView } from './components/TourPWAView';
import { PublicLandingPage } from './components/PublicLandingPage';
import { ExperienceGenerator } from './components/ExperienceGenerator';
import { ShareModal } from './components/ShareModal';
import { updateInterventionSEO } from './services/seoService';

// Fix: Defined missing type definitions for ViewType and ShowcaseMode
type ViewType = 'platform' | 'vault' | 'management' | 'pwa-tour' | 'landing-page' | 'generator';
type ShowcaseMode = 'grid' | 'map';

const INITIAL_DATA: InterventionItem[] = [
  { id: '1', type: InterventionType.BENCH, mediaType: 'audio', location: 'حديقة الأزهر، القاهرة', latitude: 30.0406, longitude: 31.2635, status: 'active', lastUpdated: '2024-05-10', interactCount: 1240, authorType: 'artist', mediaUrl: 'https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=800' },
  { id: '2', type: InterventionType.MURAL, mediaType: 'image', location: 'وسط البلد، بيروت', latitude: 33.8938, longitude: 35.5018, status: 'active', lastUpdated: '2024-05-12', interactCount: 850, authorType: 'artist', mediaUrl: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=800' },
  { id: '3', type: InterventionType.PATH, mediaType: 'audio', location: 'حي الطريف، الدرعية', latitude: 24.6854, longitude: 46.5417, status: 'active', lastUpdated: '2024-05-15', interactCount: 430, authorType: 'artist', mediaUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800' },
  { id: '4', type: InterventionType.DOOR, mediaType: 'multimodal', location: 'باب الفتوح، القاهرة القديمة', latitude: 30.0543, longitude: 31.2642, status: 'active', lastUpdated: '2024-05-20', interactCount: 2100, authorType: 'artist', mediaUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=800' },
  { id: '5', type: InterventionType.GALLERY, mediaType: 'image', location: 'حي الفنون، الرياض', latitude: 24.7136, longitude: 46.6753, status: 'active', lastUpdated: '2024-05-25', interactCount: 3200, authorType: 'artist', mediaUrl: 'https://images.unsplash.com/photo-1554188248-986adbb73be4?auto=format&fit=crop&q=80&w=800' },
];

const INITIAL_TOURS: CuratedTour[] = [
  { id: 't1', name: 'مسار ذاكرة القاهرة القديمة', city: 'القاهرة', description: 'جولة سردية تربط المقاعد التاريخية بالأبواب العتيقة.', stops: ['1', '4'], theme: 'heritage', isOfficial: true, ui_config: { primaryColor: '#c2410c', accentColor: '#f59e0b', fontFamily: 'Amiri', viewMode: 'map', buttonShape: 'rounded', glassEffect: true, cardStyle: 'elevated', welcomeMessage: 'أهلاً بك في ذاكرة الألف عام.' } },
  { id: 't2', name: 'نبض الرياض الرقمي', city: 'الرياض', description: 'تجربة بصرية تفاعلية تستشرف مستقبل الفن الحضري.', stops: ['2', '5'], theme: 'art', isOfficial: true, ui_config: { primaryColor: '#4f46e5', accentColor: '#818cf8', fontFamily: 'Cairo', viewMode: 'map', buttonShape: 'pill', glassEffect: true, cardStyle: 'minimal', welcomeMessage: 'استكشف التداخل بين الفن والتقنية.' } }
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('platform');
  const [showcaseMode, setShowcaseMode] = useState<ShowcaseMode>('grid');
  const [sidebarMode, setSidebarMode] = useState<'interventions' | 'suggested_tours'>('interventions');
  
  const [interventions, setInterventions] = useState<InterventionItem[]>(INITIAL_DATA);
  const [curatedTours, setCuratedTours] = useState<CuratedTour[]>(INITIAL_TOURS);
  
  const [activeIntervention, setActiveIntervention] = useState<InterventionItem>(interventions[0]);
  const [landingItem, setLandingItem] = useState<InterventionItem | null>(null);
  const [activeTour, setActiveTour] = useState<CuratedTour | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [pendingAnchorType, setPendingAnchorType] = useState<InterventionType | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tourId = params.get('tourId');
    const view = params.get('view');
    const id = params.get('id');

    if (tourId) {
      const tour = curatedTours.find(t => t.id === tourId);
      if (tour) {
        setActiveTour(tour);
        setCurrentView('pwa-tour');
      }
    } else if (view === 'landing' && id) {
      const item = interventions.find(i => i.id === id);
      if (item) {
        setLandingItem(item);
        setCurrentView('landing-page');
      }
    }
  }, [curatedTours, interventions]);

  useEffect(() => {
    const titles: Record<ViewType, string> = {
      platform: 'المنصة التفاعلية',
      vault: 'خزينة التدخلات',
      management: 'الإدارة والتموضع',
      'pwa-tour': activeTour?.name || 'جولة إبداعية',
      'landing-page': landingItem?.location || 'صفحة هبوط',
      generator: 'مولّد التجارب الرقمية'
    };
    updateInterventionSEO(titles[currentView], 'التدخلات الإبداعية الحضرية', 'استكشف أنسنة المدن من خلال التقنية.');
  }, [currentView, activeTour, landingItem]);

  const handleSelectIntervention = (item: InterventionItem) => {
    setActiveIntervention(item);
    setActiveTour(null);
    if (currentView !== 'platform') setCurrentView('platform');
  };

  const handleSelectTour = (tour: CuratedTour) => {
    setActiveTour(tour);
    setCurrentView('pwa-tour');
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

  if (currentView === 'landing-page' && landingItem) {
    return (
      <PublicLandingPage 
        item={landingItem} 
        onBack={() => { setCurrentView('platform'); setLandingItem(null); window.history.replaceState({}, '', window.location.pathname); }}
        onStartExperience={(type) => {
          setActiveIntervention(landingItem);
          setCurrentView('platform');
          window.history.replaceState({}, '', window.location.pathname);
        }}
      />
    );
  }

  if (currentView === 'pwa-tour' && activeTour) {
    return (
      <TourPWAView 
        tour={activeTour} 
        interventions={interventions} 
        allTours={curatedTours} // تمرير كافة الجولات لتمكين الاكتشاف
        onExit={() => {
          setCurrentView('platform');
          setActiveTour(null);
          window.history.replaceState({}, '', window.location.pathname);
        }} 
        onSwitchTour={(tour) => {
          setActiveTour(tour);
          const url = new URL(window.location.href);
          url.searchParams.set('tourId', tour.id);
          window.history.replaceState({}, '', url.toString());
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-cairo overflow-x-hidden">
      <nav className="relative z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.2rem] flex items-center justify-center font-black text-white shadow-xl shadow-indigo-500/20 text-xl">ت</div>
            <div className="text-right hidden sm:block">
              <span className="font-black text-xl block tracking-tight">التدخلات الإبداعية</span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Urban Humanity 4.2</span>
            </div>
          </div>
          
          <div className="flex bg-slate-800/50 rounded-2xl p-1.5 border border-slate-700/50 shadow-inner">
            <button onClick={() => { setCurrentView('platform'); setPendingAnchorType(null); }} className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${currentView === 'platform' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>المنصة</button>
            <button onClick={() => { setCurrentView('vault'); setPendingAnchorType(null); }} className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${currentView === 'vault' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>خزينة التدخلات</button>
            <button onClick={() => { setCurrentView('generator'); }} className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${currentView === 'generator' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>✨ مولّد التجارب</button>
            <button onClick={() => { setCurrentView('management'); }} className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${currentView === 'management' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>الإدارة</button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {currentView === 'platform' ? (
          <>
            <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-20 text-right">
              <div className="space-y-3 order-2 md:order-1">
                <h1 className="text-5xl md:text-7xl font-black text-white leading-tight">صدى <span className="text-indigo-500 italic">المدينة</span> المتجدد</h1>
                <p className="text-slate-400 font-medium text-xl border-r-4 border-indigo-500/40 pr-6">استكشف كافة التدخلات الإبداعية أو اتبع المسارات السردية المنسقة.</p>
              </div>
              <div className="bg-slate-800/40 p-2 rounded-2xl border border-slate-700/50 inline-flex order-1 md:order-2 shadow-2xl backdrop-blur-md">
                <button onClick={() => setShowcaseMode('grid')} className={`px-10 py-3 rounded-xl text-xs font-black transition-all ${showcaseMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>عرض المحاكي</button>
                <button onClick={() => setShowcaseMode('map')} className={`px-10 py-3 rounded-xl text-xs font-black transition-all ${showcaseMode === 'map' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>عرض الخريطة</button>
              </div>
            </div>

            {showcaseMode === 'grid' ? (
              <div className="grid lg:grid-cols-12 gap-10 animate-fade-in items-start">
                <aside className="lg:col-span-4 space-y-6 max-h-[850px] overflow-y-auto pr-3 custom-scrollbar sticky top-36">
                  <div className="bg-slate-900/60 p-8 rounded-[3rem] border border-slate-800/60 shadow-3xl backdrop-blur-xl">
                    <div className="flex bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800 mb-8">
                      <button onClick={() => setSidebarMode('interventions')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${sidebarMode === 'interventions' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>تدخلات فردية</button>
                      <button onClick={() => setSidebarMode('suggested_tours')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${sidebarMode === 'suggested_tours' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>جولات منسقة</button>
                    </div>

                    <div className="space-y-5">
                      {sidebarMode === 'interventions' ? (
                        interventions.map((item, idx) => (
                          <InterventionCard 
                            key={item.id} 
                            id={idx + 1} 
                            title={item.location.split('،')[0]} 
                            location={item.location}
                            description={item.type} 
                            icon={<span>📍</span>} 
                            active={!activeTour && activeIntervention.id === item.id} 
                            onClick={() => handleSelectIntervention(item)} 
                          />
                        ))
                      ) : (
                        curatedTours.map((tour) => (
                          <button key={tour.id} onClick={() => handleSelectTour(tour)} className={`w-full p-8 rounded-[2.5rem] border text-right transition-all group relative overflow-hidden ${activeTour?.id === tour.id ? 'bg-indigo-600/20 border-indigo-500 shadow-2xl' : 'bg-slate-800/40 border-slate-800 hover:border-slate-600'}`}>
                            <div className="flex justify-between items-start mb-3 relative z-10">
                               <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full">{tour.theme}</span>
                               <span className="text-[10px] font-black text-slate-500">{tour.stops.length} محطات</span>
                            </div>
                            <h4 className="font-black text-xl text-white group-hover:text-indigo-300 transition-colors relative z-10">{tour.name}</h4>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed relative z-10">{tour.city} - {tour.description}</p>
                            {activeTour?.id === tour.id && <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-500"></div>}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </aside>

                <section className="lg:col-span-8 space-y-6 relative">
                   <div className="bg-slate-900/80 rounded-[5rem] border border-slate-800/50 p-6 shadow-4xl min-h-[750px] overflow-hidden backdrop-blur-md relative">
                      {renderSimulator()}
                      
                      <button 
                        onClick={() => setIsShareModalOpen(true)}
                        className="absolute bottom-12 right-12 w-20 h-20 bg-white text-slate-900 rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex items-center justify-center text-3xl hover:scale-110 active:scale-95 transition-all z-30 group"
                        title="عرض رمز الاستجابة السريعة ورابط المشاركة"
                      >
                        <span className="group-hover:rotate-12 transition-transform">📱</span>
                      </button>
                   </div>
                </section>
              </div>
            ) : (
              <MapViewer interventions={interventions} onSelectIntervention={handleSelectIntervention} selectedId={activeIntervention.id} />
            )}
          </>
        ) : currentView === 'vault' ? (
          <InterventionVault onExplore={(type) => { setPendingAnchorType(type); setCurrentView('management'); }} />
        ) : currentView === 'generator' ? (
          <ExperienceGenerator onComplete={(newItem) => { 
            setInterventions([newItem, ...interventions]); 
            setCurrentView('platform'); 
            setActiveIntervention(newItem);
          }} />
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

      <ShareModal 
        item={activeIntervention} 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
      />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}} />
    </div>
  );
};

export default App;
