
import React, { useState, useMemo } from 'react';
import { CuratedTour, InterventionItem, StopInteraction } from '../types';
import { generateStopInteraction } from '../services/geminiService';
import { MapViewer } from './MapViewer';

interface Props {
  tour: CuratedTour;
  interventions: InterventionItem[];
  onExit: () => void;
}

export const TourPWAView: React.FC<Props> = ({ tour, interventions, onExit }) => {
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [showInteraction, setShowInteraction] = useState(false);
  const [interactionData, setInteractionData] = useState<StopInteraction | null>(null);
  const [loadingInteraction, setLoadingInteraction] = useState(false);
  const [quizSolved, setQuizSolved] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const stops = useMemo(() => {
    return tour.stops.map(id => interventions.find(i => i.id === id)).filter(Boolean) as InterventionItem[];
  }, [tour, interventions]);

  const currentStop = stops[currentStopIndex];

  // UI Configuration with defaults
  const ui = tour.ui_config || {
    primaryColor: '#4f46e5',
    accentColor: '#818cf8',
    fontFamily: 'Cairo',
    viewMode: 'map',
    buttonShape: 'rounded',
    glassEffect: true,
    cardStyle: 'elevated'
  };

  const buttonClass = useMemo(() => {
    const base = "flex-1 text-white py-5 font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95";
    const shape = ui.buttonShape === 'pill' ? 'rounded-full' : ui.buttonShape === 'sharp' ? 'rounded-none' : 'rounded-[1.5rem]';
    return `${base} ${shape}`;
  }, [ui.buttonShape]);

  const cardClass = useMemo(() => {
    const base = "border transition-all duration-700";
    const glass = ui.glassEffect ? "backdrop-blur-3xl bg-white/5 border-white/10" : "bg-slate-900 border-slate-800";
    const shape = ui.buttonShape === 'pill' ? 'rounded-[3.5rem]' : ui.buttonShape === 'sharp' ? 'rounded-none' : 'rounded-[2.5rem]';
    return `${base} ${glass} ${shape}`;
  }, [ui.glassEffect, ui.buttonShape]);

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

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    if (option === interactionData?.correctAnswer) {
      setQuizSolved(true);
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-[1000] bg-slate-950 text-slate-100 flex flex-col overflow-hidden`} 
      style={{ 
        fontFamily: ui.fontFamily,
        backgroundImage: ui.backgroundImage ? `url(${ui.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {ui.backgroundImage && <div className="absolute inset-0 bg-slate-950/85 pointer-events-none"></div>}

      <header className={`p-6 md:p-8 border-b border-white/5 relative z-10 flex items-center justify-between shadow-2xl ${ui.glassEffect ? 'backdrop-blur-2xl bg-white/5' : 'bg-slate-900'}`}>
        <button onClick={onExit} className={`px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] uppercase transition-all ${ui.buttonShape === 'pill' ? 'rounded-full' : 'rounded-xl'}`}>خروج</button>
        <div className="text-right">
          <h2 className={`text-xl font-black text-white ${ui.fontFamily === 'Amiri' ? 'font-amiri text-2xl' : ''}`}>{tour.name}</h2>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: ui.primaryColor }}>{tour.city || 'Heritage Hub'}</p>
        </div>
      </header>

      <div className="flex-1 relative z-10">
        {ui.viewMode === 'map' ? (
          <MapViewer 
            interventions={stops} 
            selectedId={currentStop?.id}
            onSelectIntervention={(item) => {
              const idx = stops.findIndex(s => s.id === item.id);
              if (idx !== -1) setCurrentStopIndex(idx);
            }} 
          />
        ) : (
          <div className="h-full overflow-y-auto p-8 space-y-6 custom-scrollbar pb-32">
             {stops.map((stop, idx) => (
               <div 
                key={stop.id} 
                onClick={() => setCurrentStopIndex(idx)}
                className={`${cardClass} p-6 overflow-hidden group ${idx === currentStopIndex ? 'ring-2' : ''}`}
                style={{ ringColor: idx === currentStopIndex ? ui.primaryColor : 'transparent' }}
               >
                 <div className="relative h-48 rounded-2xl overflow-hidden mb-6">
                    <img src={stop.mediaUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                 </div>
                 <h4 className="font-black text-white text-xl text-right">{stop.location}</h4>
               </div>
             ))}
          </div>
        )}
        
        {/* Animated Badge (GIF) */}
        {ui.introGifUrl && (
          <div className="absolute top-8 right-8 w-16 h-16 z-20 pointer-events-none drop-shadow-2xl">
             <div className="absolute -inset-2 bg-indigo-500/10 blur-xl rounded-full animate-pulse"></div>
             <img src={ui.introGifUrl} className="w-full h-full object-contain rounded-2xl" alt="UI Furniture GIF" />
          </div>
        )}
      </div>

      <div className={`${cardClass} rounded-t-[4rem] p-10 pb-16 shadow-[0_-30px_60px_rgba(0,0,0,0.6)] animate-fade-in-up relative z-20`}>
        {currentStop && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
               <div className="px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: `${ui.primaryColor}15`, color: ui.primaryColor }}>
                  المحطة {currentStopIndex + 1}
               </div>
               <div className="text-right">
                  <h3 className={`text-3xl font-black text-white leading-none ${ui.fontFamily === 'Amiri' ? 'font-amiri text-4xl' : ''}`}>{currentStop.location}</h3>
                  <p className="text-slate-500 text-[9px] font-black uppercase mt-1">{currentStop.type}</p>
               </div>
            </div>

            {ui.welcomeMessage && currentStopIndex === 0 && (
              <p className="text-slate-400 text-sm italic font-medium text-right border-r-2 pr-4" style={{ borderColor: ui.primaryColor }}>
                "{ui.welcomeMessage}"
              </p>
            )}

            <div className="flex gap-4">
               <button 
                 onClick={handleStartInteraction}
                 className={buttonClass}
                 style={{ backgroundColor: ui.primaryColor, color: ui.primaryColor === '#ffffff' ? '#000' : '#fff' }}
               >
                 تفعيل التجربة ✨
               </button>
               {currentStopIndex < stops.length - 1 && (
                 <button 
                   onClick={() => setCurrentStopIndex(prev => prev + 1)}
                   className={`px-10 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] uppercase transition-all ${ui.buttonShape === 'pill' ? 'rounded-full' : 'rounded-2xl'}`}
                 >
                   التالي
                 </button>
               )}
            </div>
          </div>
        )}
      </div>

      {/* Interaction Modal */}
      {showInteraction && (
        <div className="fixed inset-0 z-[1100] bg-slate-950/95 backdrop-blur-3xl p-6 flex items-center justify-center animate-fade-in">
           <div className={`${cardClass} w-full max-w-lg p-12 shadow-5xl space-y-10 text-right relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-full h-1.5" style={{ backgroundColor: ui.primaryColor }}></div>
              <button onClick={() => setShowInteraction(false)} className="absolute top-8 left-8 text-slate-500 hover:text-white text-3xl">×</button>

              {loadingInteraction ? (
                <div className="py-24 flex flex-col items-center gap-8">
                   <div className="w-16 h-16 border-4 rounded-full animate-spin border-t-transparent" style={{ borderColor: ui.primaryColor }}></div>
                   <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">جاري تحضير التحدي الإبداعي...</p>
                </div>
              ) : interactionData && (
                <div className="space-y-10 animate-scale-up">
                   <h4 className="text-3xl font-black text-white leading-tight">{interactionData.question}</h4>
                   <div className="space-y-4">
                      {interactionData.options.map((option, idx) => (
                        <button 
                          key={idx}
                          onClick={() => !quizSolved && handleOptionSelect(option)}
                          className={`w-full p-6 transition-all duration-300 font-black text-sm text-right border
                            ${ui.buttonShape === 'pill' ? 'rounded-full' : ui.buttonShape === 'sharp' ? 'rounded-none' : 'rounded-2xl'}
                            ${selectedOption === option 
                              ? option === interactionData.correctAnswer 
                                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-lg' 
                                : 'bg-red-600/20 border-red-500 text-red-300'
                              : 'bg-slate-800/40 border-slate-700 text-slate-400'}`}
                        >
                          {option}
                        </button>
                      ))}
                   </div>
                   {quizSolved && (
                     <div className="bg-emerald-500/10 p-8 rounded-[2.5rem] border border-emerald-500/20 space-y-4">
                        <p className="text-slate-200 text-base italic leading-relaxed font-amiri">"{interactionData.fact}"</p>
                        <button onClick={() => setShowInteraction(false)} className="w-full mt-6 py-4 bg-emerald-600 text-white font-black text-[10px] uppercase rounded-xl">متابعة</button>
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
