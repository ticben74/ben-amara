
import React, { useState, useMemo, useEffect } from 'react';
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
  const [showIntro, setShowIntro] = useState(true);
  const [showInteraction, setShowInteraction] = useState(false);
  const [showTourSwitcher, setShowTourSwitcher] = useState(false);
  const [interactionData, setInteractionData] = useState<StopInteraction | null>(null);
  const [loadingInteraction, setLoadingInteraction] = useState(false);
  const [quizSolved, setQuizSolved] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  const localUI = useMemo(() => tour.ui_config || {
    primaryColor: '#4f46e5',
    accentColor: '#818cf8',
    fontFamily: 'Cairo' as const,
    viewMode: 'map' as const,
    buttonShape: 'rounded' as const,
    glassEffect: true,
    cardStyle: 'elevated' as const,
    enabledWidgets: ['map', 'competition', 'discovery', 'surprise', 'links'] as WidgetType[],
    customLinks: []
  }, [tour.ui_config]);

  const stops = useMemo(() => {
    return tour.stops.map(id => interventions.find(i => i.id === id)).filter(Boolean) as InterventionItem[];
  }, [tour, interventions]);

  const currentStop = stops[currentStopIndex];

  // Auto-scroll to top when stop changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStopIndex]);

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
    setQuizSolved(false);
    setSelectedOption(null);
    try {
      const data = await generateStopInteraction(currentStop.location, currentStop.type);
      setInteractionData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInteraction(false);
    }
  };

  const handleSwitchTour = (newTour: CuratedTour) => {
    if (onSwitchTour) {
      onSwitchTour(newTour);
      setCurrentStopIndex(0);
      setShowTourSwitcher(false);
      setShowIntro(true); // Re-show intro for the new context
    }
  };

  if (showIntro) {
    return (
      <div className="fixed inset-0 z-[2000] bg-[#0a0f1e] text-right flex flex-col items-center justify-center p-8 animate-fade-in" style={{ fontFamily: localUI.fontFamily }}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.4),transparent)] animate-pulse"></div>
        {localUI.backgroundImage && <img src={localUI.backgroundImage} className="absolute inset-0 w-full h-full object-cover opacity-10 grayscale" />}
        
        <div className="relative z-10 max-w-md w-full space-y-12 flex flex-col items-center text-center">
          <div className="w-40 h-40 bg-white/5 rounded-[3rem] border border-white/10 flex items-center justify-center text-7xl shadow-3xl animate-bounce">
            {tour.theme === 'heritage' ? '🏛️' : tour.theme === 'art' ? '🎨' : '🧭'}
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-white leading-tight">{tour.name}</h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed italic pr-4 border-r-4" style={{ borderColor: localUI.primaryColor }}>
              {tour.description}
            </p>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <button 
              onClick={() => setShowIntro(false)}
              className="w-full py-6 bg-white text-slate-950 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-4xl hover:scale-105 active:scale-95 transition-all"
            >
              ابدأ الجولة الآن 🧭
            </button>
            <button onClick={onExit} className="text-slate-500 font-bold text-xs uppercase tracking-widest">العودة للمنصة</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`fixed inset-0 z-[1000] bg-[#050810] text-slate-100 flex flex-col overflow-hidden`} 
      style={{ 
        fontFamily: localUI.fontFamily,
        backgroundImage: localUI.backgroundImage ? `url(${localUI.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Dynamic Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-[1100] bg-white/5">
        <div 
          className="h-full transition-all duration-1000" 
          style={{ width: `${((currentStopIndex + 1) / stops.length) * 100}%`, backgroundColor: localUI.primaryColor }}
        ></div>
      </div>

      <header className={`p-6 border-b border-white/5 relative z-10 flex items-center justify-between shadow-2xl ${localUI.glassEffect ? 'backdrop-blur-2xl bg-white/5' : 'bg-slate-900'}`}>
        <div className="flex gap-2">
           <button 
             onClick={() => setShowTourSwitcher(true)}
             className={`px-4 py-2.5 bg-indigo-600 text-white font-black text-[9px] uppercase transition-all rounded-xl shadow-lg hover:bg-indigo-500`}
           >
             تبديل المسار 🧭
           </button>
           <button onClick={onExit} className={`px-5 py-2.5 bg-white/5 border border-white/10 text-slate-400 font-black text-[9px] uppercase transition-all rounded-xl hover:bg-white/10`}>خروج</button>
        </div>
        <div className="text-right">
          <h2 className={`text-lg font-black text-white leading-none ${localUI.fontFamily === 'Amiri' ? 'font-amiri text-xl' : ''}`}>{tour.name}</h2>
          <div className="flex items-center gap-2 justify-end mt-1">
             <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{currentStopIndex + 1} من {stops.length} محطات</span>
             <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: localUI.primaryColor }}></div>
          </div>
        </div>
      </header>

      <div className="flex-1 relative z-10 overflow-y-auto custom-scrollbar pb-64">
        <div className="p-6 md:p-10 space-y-12">
          
          {/* 🗺️ Widget: Map - Focused View */}
          {isWidgetEnabled('map') && (
            <div className={`${cardClass} overflow-hidden shadow-4xl animate-fade-in`}>
               <div className="h-[300px] relative">
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

          {/* Welcome Message Card */}
          {currentStopIndex === 0 && localUI.welcomeMessage && (
            <div className={`${cardClass} p-8 animate-fade-in text-right border-r-[12px]`} style={{ borderColor: localUI.primaryColor }}>
               <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-3">مرحباً بك في حي {tour.city}</span>
               <p className="text-slate-200 text-lg font-bold leading-relaxed italic font-amiri">
                 "{localUI.welcomeMessage}"
               </p>
            </div>
          )}

          <div className="mt-8 transition-all duration-1000">
             {currentStop ? (
               <div className="animate-fade-in-up" key={currentStop.id}>
                  {currentStop.type === InterventionType.BENCH && <BenchSimulator />}
                  {currentStop.type === InterventionType.MURAL && <MuralVisualizer />}
                  {currentStop.type === InterventionType.PATH && <ImmersivePath />}
                  {currentStop.type === InterventionType.DOOR && <DoorIntervention />}
                  {currentStop.type === InterventionType.MARKET && <MarketSimulator />}
               </div>
             ) : (
               <div className="p-20 text-center text-slate-500 italic border-2 border-dashed border-slate-800 rounded-[3rem]">
                 المسار قيد التحديث...
               </div>
             )}
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

          {/* 🛍️ Widget: Discovery Hub */}
          {isWidgetEnabled('discovery') && (
            <div className="mt-8">
               <DiscoveryHub 
                 currentTourId={tour.id} 
                 allTours={allTours} 
                 onSelectTour={handleSwitchTour}
                 primaryColor={localUI.primaryColor}
               />
            </div>
          )}

          {/* 🔗 Widget: Smart External Links */}
          {isWidgetEnabled('links') && localUI.customLinks && localUI.customLinks.length > 0 && (
            <div className="mt-8">
               <SmartLinkBox links={localUI.customLinks} />
            </div>
          )}
        </div>
      </div>

      {/* Persistent Navigation Bar */}
      <div className={`${cardClass} fixed bottom-0 left-0 right-0 rounded-t-[4rem] p-10 pb-16 shadow-[0_-30px_70px_rgba(0,0,0,0.8)] animate-fade-in-up z-20`}>
        {currentStop && (
          <div className="space-y-8 text-right">
            <div className="flex justify-between items-center">
               <div className="px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/5">
                  <span style={{ color: localUI.primaryColor }}>محطة:</span> {currentStop.type}
               </div>
               <div className="text-right">
                  <h3 className={`text-2xl font-black text-white leading-none ${localUI.fontFamily === 'Amiri' ? 'font-amiri text-3xl' : ''}`}>{currentStop.location}</h3>
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
                 <button 
                   onClick={() => setCurrentStopIndex(prev => prev + 1)} 
                   className="px-8 bg-slate-800 text-slate-300 font-black text-[10px] uppercase rounded-2xl hover:bg-slate-700 transition-all"
                 >
                   المحطة التالية
                 </button>
               ) : (
                 <button onClick={onExit} className="px-8 bg-emerald-600 text-white font-black text-[10px] uppercase rounded-2xl shadow-xl hover:bg-emerald-500">إنهاء الرحلة 🎉</button>
               )}
            </div>
          </div>
        )}
      </div>

      {/* Tour Switcher Modal */}
      {showTourSwitcher && (
        <div className="fixed inset-0 z-[2200] bg-slate-950/98 backdrop-blur-3xl p-6 flex items-center justify-center animate-fade-in">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[3.5rem] shadow-5xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                 <button onClick={() => setShowTourSwitcher(false)} className="p-3 bg-slate-800 hover:bg-white hover:text-slate-950 rounded-2xl transition-all">×</button>
                 <div className="text-right">
                    <h4 className="text-2xl font-black text-white">اكتشف <span className="text-indigo-400">مسارات أخرى</span></h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Experience Other Curated Narratives</p>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                 {allTours.filter(t => t.id !== tour.id).map(t => (
                   <button 
                     key={t.id}
                     onClick={() => handleSwitchTour(t)}
                     className="w-full group p-8 bg-slate-950/60 border border-slate-800 rounded-[2.5rem] text-right hover:border-indigo-500 transition-all flex items-start gap-6 relative overflow-hidden"
                   >
                     <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                        {t.theme === 'heritage' ? '🏛️' : t.theme === 'art' ? '🎨' : '🧭'}
                     </div>
                     <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-center">
                           <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{t.city} • {t.stops.length} محطات</span>
                           <span className="text-[10px] text-slate-600 font-bold">#{t.theme}</span>
                        </div>
                        <h5 className="text-xl font-black text-white group-hover:text-indigo-300 transition-colors">{t.name}</h5>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{t.description}</p>
                     </div>
                   </button>
                 ))}
                 {allTours.length <= 1 && (
                   <div className="py-20 text-center text-slate-600 italic">لا توجد جولات أخرى متاحة حالياً...</div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Interaction Modal */}
      {showInteraction && (
        <div className="fixed inset-0 z-[2100] bg-slate-950/98 backdrop-blur-3xl p-6 flex items-center justify-center animate-fade-in">
           <div className={`${cardClass} w-full max-w-lg p-12 shadow-5xl space-y-10 text-right relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-full h-2" style={{ backgroundColor: localUI.primaryColor }}></div>
              <button onClick={() => setShowInteraction(false)} className="absolute top-8 left-8 text-slate-500 hover:text-white text-3xl">×</button>
              
              {loadingInteraction ? (
                <div className="py-24 flex flex-col items-center gap-8">
                   <div className="w-16 h-16 border-4 rounded-full animate-spin border-t-transparent shadow-2xl" style={{ borderColor: localUI.primaryColor }}></div>
                   <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] animate-pulse">جاري استرجاع تحدي Gemini...</p>
                </div>
              ) : interactionData && (
                <div className="space-y-10 animate-scale-up">
                   <div className="space-y-2">
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">تحدي الذكاء المكاني</span>
                     <h4 className="text-3xl font-black text-white leading-tight">{interactionData.question}</h4>
                   </div>
                   
                   <div className="space-y-3">
                      {interactionData.options.map((option, idx) => (
                        <button 
                          key={idx}
                          onClick={() => !quizSolved && (option === interactionData.correctAnswer ? setQuizSolved(true) : setSelectedOption(option))}
                          className={`w-full p-6 transition-all duration-300 font-black text-sm text-right border rounded-3xl
                            ${quizSolved && option === interactionData.correctAnswer ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 scale-105' : 
                              selectedOption === option ? 'bg-red-600/20 border-red-500 text-red-300' : 
                              'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                        >
                          <div className="flex justify-between items-center">
                            {quizSolved && option === interactionData.correctAnswer && <span className="text-emerald-400">✓</span>}
                            {selectedOption === option && option !== interactionData.correctAnswer && <span className="text-red-400">✗</span>}
                            <span>{option}</span>
                          </div>
                        </button>
                      ))}
                   </div>

                   {quizSolved && (
                     <div className="bg-emerald-500/10 p-8 rounded-[2.5rem] border border-emerald-500/20 animate-fade-in-up">
                        <div className="flex items-center gap-3 mb-4 justify-end">
                           <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">إجابة صحيحة!</span>
                           <span className="text-xl">🏆</span>
                        </div>
                        <p className="text-slate-200 text-lg italic leading-relaxed font-amiri">"{interactionData.fact}"</p>
                        <button onClick={() => setShowInteraction(false)} className="w-full mt-8 py-5 bg-emerald-600 text-white font-black text-[10px] uppercase rounded-2xl shadow-xl hover:bg-emerald-500 transition-all">العودة للمسار</button>
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
