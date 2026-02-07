
import React, { useState, useMemo } from 'react';
import { CuratedTour, InterventionItem, StopInteraction, InterventionType, WidgetType } from '../types';
import { generateStopInteraction } from '../services/geminiService';
import { MapViewer } from './MapViewer';
import { BenchSimulator } from './BenchSimulator';
import { MuralVisualizer } from './MuralVisualizer';
import { ImmersivePath } from './ImmersivePath';
import { DoorIntervention } from './DoorIntervention';
import { MarketSimulator } from './MarketSimulator';
import { CompetitionBox } from './CompetitionBox';
import { UIFurnishingBox } from './UIFurnishingBox';
import { DiscoveryHub } from './DiscoveryHub';
import { SurpriseBox } from './SurpriseBox';
import { SmartLinkBox } from './SmartLinkBox';

interface Props {
  tour: CuratedTour;
  interventions: InterventionItem[];
  allTours?: CuratedTour[];
  onExit: () => void;
  onSwitchTour?: (tour: CuratedTour) => void;
}

export const TourPWAView: React.FC<Props> = ({ tour, interventions, allTours = [], onExit, onSwitchTour }) => {
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [showInteraction, setShowInteraction] = useState(false);
  const [interactionData, setInteractionData] = useState<StopInteraction | null>(null);
  const [loadingInteraction, setLoadingInteraction] = useState(false);
  const [quizSolved, setQuizSolved] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  const [localUI, setLocalUI] = useState(tour.ui_config || {
    primaryColor: '#4f46e5',
    accentColor: '#818cf8',
    fontFamily: 'Cairo',
    viewMode: 'map',
    buttonShape: 'rounded',
    glassEffect: true,
    cardStyle: 'elevated',
    enabledWidgets: ['map', 'competition', 'discovery', 'surprise', 'links'],
    customLinks: []
  });

  const stops = useMemo(() => {
    const loadedStops = tour.stops.map(id => interventions.find(i => i.id === id)).filter(Boolean) as InterventionItem[];
    return loadedStops.length > 0 ? loadedStops : [];
  }, [tour, interventions]);

  const currentStop = stops[currentStopIndex];

  const renderCurrentIntervention = () => {
    if (!currentStop) return null;
    switch (currentStop.type) {
      case InterventionType.BENCH: return <BenchSimulator />;
      case InterventionType.MURAL: return <MuralVisualizer />;
      case InterventionType.PATH: return <ImmersivePath />;
      case InterventionType.DOOR: return <DoorIntervention />;
      case InterventionType.MARKET: return <MarketSimulator />;
      default: return <div className="p-10 text-center text-slate-500 italic">محتوى هذه المحطة في طور التشكيل...</div>;
    }
  };

  const isWidgetEnabled = (type: WidgetType) => (localUI.enabledWidgets || []).includes(type);

  const buttonClass = useMemo(() => {
    const base = "flex-1 text-white py-5 font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95";
    const shape = localUI.buttonShape === 'pill' ? "rounded-full" : localUI.buttonShape === 'sharp' ? "rounded-none" : "rounded-2xl";
    return `${base} ${shape}`;
  }, [localUI.buttonShape]);

  const cardClass = useMemo(() => {
    const base = "border transition-all duration-700";
    const glass = localUI.glassEffect ? "backdrop-blur-3xl bg-white/5 border-white/10" : "bg-slate-900 border-slate-800";
    const shape = localUI.buttonShape === 'pill' ? "rounded-[3.5rem]" : localUI.buttonShape === 'sharp' ? "rounded-none" : "rounded-[2.5rem]";
    return `${base} ${glass} ${shape}`;
  }, [localUI.glassEffect, localUI.buttonShape]);

  const handleStartInteraction = async () => {
    if (!currentStop) return;
    setLoadingInteraction(true);
    setShowInteraction(true);
    try {
      const data = await generateStopInteraction(currentStop.location, currentStop.type);
      setInteractionData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInteraction(false);
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-[1000] bg-slate-950 text-slate-100 flex flex-col overflow-hidden`} 
      style={{ 
        fontFamily: localUI.fontFamily,
        backgroundImage: localUI.backgroundImage ? `url(${localUI.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {localUI.backgroundImage && <div className="absolute inset-0 bg-slate-950/85 pointer-events-none"></div>}

      <header className={`p-6 md:p-8 border-b border-white/5 relative z-10 flex items-center justify-between shadow-2xl ${localUI.glassEffect ? 'backdrop-blur-2xl bg-white/5' : 'bg-slate-900'}`}>
        <button onClick={onExit} className={`px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] uppercase transition-all ${localUI.buttonShape === 'pill' ? 'rounded-full' : 'rounded-xl'}`}>خروج</button>
        <div className="text-right">
          <h2 className={`text-xl font-black text-white ${localUI.fontFamily === 'Amiri' ? 'font-amiri text-2xl' : ''}`}>{tour.name}</h2>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: localUI.primaryColor }}>{tour.city || 'Heritage Hub'}</p>
        </div>
      </header>

      <div className="flex-1 relative z-10 overflow-y-auto custom-scrollbar pb-64">
        <div className="p-6 md:p-10 space-y-12">
          
          {/* Welcome Message Box */}
          {localUI.welcomeMessage && (
            <div className={`${cardClass} p-8 animate-fade-in text-right`}>
               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">رسالة من المنسق الثقافي</span>
               <p className="text-slate-200 text-sm font-bold leading-relaxed italic pr-4 border-r-2" style={{ borderColor: localUI.primaryColor }}>
                 "{localUI.welcomeMessage}"
               </p>
            </div>
          )}

          {/* 🗺️ Widget: Map */}
          {isWidgetEnabled('map') && (
            <div className={`${cardClass} overflow-hidden shadow-3xl`}>
               <div className="h-[350px] relative">
                  <MapViewer 
                    interventions={stops} 
                    selectedId={currentStop?.id}
                    onSelectIntervention={(item) => {
                      const idx = stops.findIndex(s => s.id === item.id);
                      if (idx !== -1) setCurrentStopIndex(idx);
                    }} 
                  />
               </div>
            </div>
          )}

          <div className="mt-8">
             {renderCurrentIntervention()}
          </div>

          {/* 🏆 Widget: Competition */}
          {isWidgetEnabled('competition') && (
            <div className="mt-8">
               <CompetitionBox />
            </div>
          )}

          {/* 🎁 Widget: Surprise Box */}
          {isWidgetEnabled('surprise') && (
            <div className="mt-8">
               <SurpriseBox location={currentStop?.location || 'هذا الموقع'} primaryColor={localUI.primaryColor} />
            </div>
          )}

          {/* 🛍️ Widget: Discovery (Links to other tours/store) */}
          {isWidgetEnabled('discovery') && (
            <div className="mt-8">
               <DiscoveryHub 
                 currentTourId={tour.id} 
                 allTours={allTours} 
                 onSelectTour={onSwitchTour || ((t) => window.location.search = `?tourId=${t.id}`)}
                 primaryColor={localUI.primaryColor}
               />
            </div>
          )}

          {/* 🔗 Widget: Smart External Links (Configurable) */}
          {isWidgetEnabled('links') && (
            <div className="mt-8">
               <SmartLinkBox links={localUI.customLinks} />
            </div>
          )}

          {/* 🎨 Widget: UI Furnishing */}
          {isWidgetEnabled('furnishing') && (
            <div className="mt-8">
               <UIFurnishingBox onConfigChange={(updates) => setLocalUI({ ...localUI, ...updates })} />
            </div>
          )}
        </div>
      </div>

      <div className={`${cardClass} fixed bottom-0 left-0 right-0 rounded-t-[4rem] p-10 pb-16 shadow-[0_-30px_60px_rgba(0,0,0,0.6)] animate-fade-in-up z-20`}>
        {currentStop && (
          <div className="space-y-8 text-right">
            <div className="flex justify-between items-center">
               <div className="px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: `${localUI.primaryColor}15`, color: localUI.primaryColor }}>
                  المحطة {currentStopIndex + 1}
               </div>
               <div>
                  <h3 className={`text-3xl font-black text-white leading-none ${localUI.fontFamily === 'Amiri' ? 'font-amiri text-4xl' : ''}`}>{currentStop.location}</h3>
                  <p className="text-slate-500 text-[9px] font-black uppercase mt-1">{currentStop.type}</p>
               </div>
            </div>

            <div className="flex gap-4">
               <button 
                 onClick={handleStartInteraction}
                 className={buttonClass}
                 style={{ backgroundColor: localUI.primaryColor }}
               >
                 تحدي المعرفة ✨
               </button>
               {currentStopIndex < stops.length - 1 ? (
                 <button onClick={() => setCurrentStopIndex(prev => prev + 1)} className="px-10 bg-slate-800 text-slate-300 font-black text-[10px] uppercase rounded-2xl">التالي</button>
               ) : (
                 <button onClick={onExit} className="px-10 bg-emerald-600 text-white font-black text-[10px] uppercase rounded-2xl shadow-xl">إنهاء🎉</button>
               )}
            </div>
          </div>
        )}
      </div>

      {showInteraction && (
        <div className="fixed inset-0 z-[1100] bg-slate-950/95 backdrop-blur-3xl p-6 flex items-center justify-center animate-fade-in">
           <div className={`${cardClass} w-full max-w-lg p-12 shadow-5xl space-y-10 text-right relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-full h-1.5" style={{ backgroundColor: localUI.primaryColor }}></div>
              <button onClick={() => setShowInteraction(false)} className="absolute top-8 left-8 text-slate-500 hover:text-white text-3xl">×</button>
              {loadingInteraction ? (
                <div className="py-24 flex flex-col items-center gap-8">
                   <div className="w-16 h-16 border-4 rounded-full animate-spin border-t-transparent" style={{ borderColor: localUI.primaryColor }}></div>
                   <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">جاري تحضير التحدي الإبداعي...</p>
                </div>
              ) : interactionData && (
                <div className="space-y-10 animate-scale-up">
                   <h4 className="text-3xl font-black text-white leading-tight">{interactionData.question}</h4>
                   <div className="space-y-4">
                      {interactionData.options.map((option, idx) => (
                        <button 
                          key={idx}
                          onClick={() => !quizSolved && (option === interactionData.correctAnswer ? setQuizSolved(true) : setSelectedOption(option))}
                          className={`w-full p-6 transition-all duration-300 font-black text-sm text-right border rounded-2xl
                            ${selectedOption === option ? 'bg-red-600/20 border-red-500 text-red-300' : 'bg-slate-800/40 border-slate-700 text-slate-400'}`}
                        >
                          {option}
                        </button>
                      ))}
                   </div>
                   {quizSolved && (
                     <div className="bg-emerald-500/10 p-8 rounded-[2.5rem] border border-emerald-500/20">
                        <p className="text-slate-200 text-base italic leading-relaxed font-amiri">"{interactionData.fact}"</p>
                        <button onClick={() => setShowInteraction(false)} className="w-full mt-6 py-4 bg-emerald-600 text-white font-black text-[10px] uppercase rounded-xl">متابعة المسار</button>
                     </div>
                   )}
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
