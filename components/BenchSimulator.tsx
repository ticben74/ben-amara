
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { generateStory, generateSpeech, decodeAudioBuffer } from '../services/geminiService';
import { createClient } from '../services/supabase';
import { trackEvent } from '../services/analyticsService';

type Atmosphere = 'quiet_park' | 'busy_market' | 'rainy_street' | 'ancient_alley';
type Neighborhood = 'الحسين' | 'الزمالك' | 'وسط البلد' | 'مصر الجديدة';

const NEIGHBORHOODS: Neighborhood[] = ['الحسين', 'الزمالك', 'وسط البلد', 'مصر الجديدة'];

const ATMOSPHERES: Record<Atmosphere, { name: string; icon: string; audioUrl: string; color: string; gradient: string }> = {
  quiet_park: { 
    name: 'حديقة هادئة', 
    icon: '🌳', 
    audioUrl: 'https://www.soundjay.com/nature/sounds/park-ambience-1.mp3', 
    color: 'emerald-500', 
    gradient: 'from-emerald-500/20' 
  },
  busy_market: { 
    name: 'سوق شعبي', 
    icon: '🛒', 
    audioUrl: 'https://www.soundjay.com/misc/sounds/street-market-1.mp3', 
    color: 'amber-500', 
    gradient: 'from-amber-500/20' 
  },
  rainy_street: { 
    name: 'شارع ممطر', 
    icon: '🌧️', 
    audioUrl: 'https://www.soundjay.com/nature/sounds/rain-07.mp3', 
    color: 'blue-500', 
    gradient: 'from-blue-500/20' 
  },
  ancient_alley: { 
    name: 'زقاق قديم', 
    icon: '🏮', 
    audioUrl: 'https://www.soundjay.com/misc/sounds/wind-chime-1.mp3', 
    color: 'orange-500', 
    gradient: 'from-orange-500/20' 
  }
};

interface CitizenMemory {
  id: string;
  text: string;
  visitor_name: string;
  neighborhood: string;
  created_at: string;
}

export const BenchSimulator: React.FC = () => {
  const [isSitting, setIsSitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<string | null>(null);
  const [memories, setMemories] = useState<CitizenMemory[]>([]);
  const [atmosphere, setAtmosphere] = useState<Atmosphere>('quiet_park');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood>('وسط البلد');
  const [volume, setVolume] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  
  const [newMemory, setNewMemory] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [isSubmittingMemory, setIsSubmittingMemory] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const storySourceRef = useRef<AudioBufferSourceNode | null>(null);
  const ambientSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<number | null>(null);

  const supabase = createClient();

  const cleanupAudio = () => {
    try {
      if (storySourceRef.current) { 
        try { storySourceRef.current.stop(); } catch(e) {}
        storySourceRef.current.disconnect(); 
        storySourceRef.current = null; 
      }
      if (ambientSourceRef.current) { 
        try { ambientSourceRef.current.stop(); } catch(e) {}
        ambientSourceRef.current.disconnect(); 
        ambientSourceRef.current = null; 
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') { 
        audioContextRef.current.close(); 
        audioContextRef.current = null; 
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    } catch (e) { console.warn("Audio cleanup error:", e); }
  };

  useEffect(() => {
    fetchMemories();
    return () => cleanupAudio();
  }, []);

  const fetchMemories = async () => {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('memories').select('*').order('created_at', { ascending: false });
        if (!error && data) setMemories(data as CitizenMemory[]);
      } catch (e) { console.warn("Memories fetch error:", e); }
    }
  };

  useEffect(() => {
    const updateVolume = () => {
      if (analyzerRef.current) {
        const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
        analyzerRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVolume(average);
      }
      animationFrameRef.current = requestAnimationFrame(updateVolume);
    };
    if (isSitting) updateVolume();
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [isSitting]);

  const handleStartSitting = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (isSitting || loading) return;
    setHoldProgress(0);
    holdIntervalRef.current = window.setInterval(() => {
      setHoldProgress(prev => {
        if (prev >= 100) {
          if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
          startExperience();
          return 100;
        }
        return prev + 2; 
      });
    }, 20);
  };

  const handleStopSitting = () => {
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    if (!isSitting) {
      setHoldProgress(0);
    }
  };

  const startExperience = async () => {
    setIsSitting(true);
    setLoading(true);
    trackEvent('start_tour', { neighborhood: selectedNeighborhood, intervention: 'BENCH' });
    
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioContextRef.current;

      await playAmbient(atmosphere);

      const text = await generateStory("مقعد الحكايا الصوتية", selectedNeighborhood);
      setStory(text);
      
      const audioData = await generateSpeech(text);
      if (audioData && ctx.state !== 'closed') {
        const buffer = await decodeAudioBuffer(audioData, ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const analyzer = ctx.createAnalyser();
        analyzer.fftSize = 128;
        source.connect(analyzer);
        analyzer.connect(ctx.destination);
        analyzerRef.current = analyzer;
        source.start();
        storySourceRef.current = source;
      }
    } catch (err) {
      console.error(err);
      handleExit();
    } finally {
      setLoading(false);
    }
  };

  const handleExit = () => {
    cleanupAudio();
    setIsSitting(false);
    setVolume(0);
    setStory(null);
    setHoldProgress(0);
  };

  const playAmbient = async (type: Atmosphere) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    try {
      const response = await fetch(ATMOSPHERES[type].audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      if (ambientSourceRef.current) {
        try { ambientSourceRef.current.stop(); } catch(e) {}
      }
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.15; 
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start();
      ambientSourceRef.current = source;
    } catch (e) { console.warn("Ambient play error:", e); }
  };

  const handlePostMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemory || !visitorName) return;
    setIsSubmittingMemory(true);
    try {
      if (supabase) {
        const { error } = await supabase.from('memories').insert([{ 
          text: newMemory, 
          visitor_name: visitorName,
          neighborhood: selectedNeighborhood 
        }]);
        if (!error) { 
          setNewMemory(""); 
          setVisitorName(""); 
          fetchMemories();
          trackEvent('post_memory', { neighborhood: selectedNeighborhood });
        }
      }
    } catch (err) { console.error(err); } finally { setIsSubmittingMemory(false); }
  };

  const filteredMemories = useMemo(() => {
    return memories.filter(m => m.neighborhood === selectedNeighborhood);
  }, [memories, selectedNeighborhood]);

  return (
    <div className="flex flex-col items-center space-y-12 p-6 md:p-12 h-full animate-fade-in text-right overflow-y-auto custom-scrollbar">
      {/* Immersive Header */}
      <div className="w-full flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="flex flex-col gap-6 items-end order-2 md:order-1">
          <div className="flex bg-slate-800/40 p-2 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl shadow-2xl">
            {Object.entries(ATMOSPHERES).map(([key, data]) => (
              <button
                key={key}
                onClick={() => { setAtmosphere(key as Atmosphere); if (isSitting) playAmbient(key as Atmosphere); }}
                className={`w-14 h-14 rounded-3xl flex flex-col items-center justify-center transition-all duration-500 relative group
                  ${atmosphere === key ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110 z-10' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <span className="text-2xl">{data.icon}</span>
                <span className="text-[7px] font-black uppercase mt-1 opacity-60 group-hover:opacity-100">{data.name}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2 justify-end flex-wrap max-w-xs">
            {NEIGHBORHOODS.map(n => (
              <button 
                key={n}
                onClick={() => setSelectedNeighborhood(n)}
                className={`text-[9px] px-6 py-3 rounded-2xl border-2 transition-all duration-300 font-black uppercase tracking-widest
                  ${selectedNeighborhood === n ? 'bg-indigo-500 text-white border-indigo-400 shadow-xl scale-105' : 'bg-slate-800/80 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="text-right order-1 md:order-2">
          <div className="flex items-center gap-3 justify-end mb-4">
            <span className={`w-3 h-3 rounded-full bg-indigo-500 ${isSitting ? 'animate-ping' : ''}`}></span>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">صوت ذاكرة المدينة v2.8</span>
          </div>
          <h4 className="text-5xl md:text-6xl font-black text-white tracking-tight leading-none mb-4">مقعد <span className="text-indigo-500 italic">الحكايا</span></h4>
          <p className="text-slate-400 max-w-md text-sm font-medium leading-relaxed italic border-r-2 border-indigo-500/30 pr-4">
            "توقف قليلاً، اجلس، وأنصت لصدى الأقدام والهمسات التي سكنت هذا الركن عبر السنين."
          </p>
        </div>
      </div>

      {/* The Central Artifact: The Interactive Bench */}
      <div className={`relative w-full max-w-5xl aspect-[21/9] rounded-[5rem] overflow-hidden border-2 transition-all duration-1000 bg-slate-950 shadow-3xl flex items-center justify-center group
        ${isSitting ? 'border-indigo-500/40 shadow-indigo-500/20' : 'border-slate-800 shadow-black'}`}>
         
         {/* Atmospheric Effects Layer */}
         <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-[2s] ${ATMOSPHERES[atmosphere].gradient} to-transparent opacity-40`}></div>
         <div className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.12),transparent_70%)] transition-opacity duration-1000 ${isSitting ? 'opacity-100' : 'opacity-0'}`}></div>
         
         {/* Stylized Visual Bench */}
         <div className={`relative transition-all duration-[1.5s] cubic-bezier(0.16,1,0.3,1) transform ${isSitting ? 'scale-110 -translate-y-12' : 'scale-100 translate-y-6'}`}>
            <div className="w-[580px] h-44 bg-slate-900/60 rounded-[4.5rem] border border-white/10 relative flex items-center justify-center overflow-hidden backdrop-blur-3xl shadow-inner">
               <div className="absolute inset-0 flex items-center justify-center gap-3 px-16">
                  {[...Array(44)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-1 rounded-full transition-all duration-150 ${isSitting ? 'bg-indigo-400' : 'bg-slate-800'}`}
                      style={{ 
                        height: isSitting ? `${12 + (volume * (0.5 + Math.sin(i * 0.25) * 1.5))}px` : '4px',
                        opacity: isSitting ? 0.9 : 0.08,
                        boxShadow: isSitting ? '0 0 25px rgba(99, 102, 241, 0.5)' : 'none'
                      }}
                    ></div>
                  ))}
               </div>
               
               {isSitting && (
                 <div className="absolute top-8 left-1/2 -translate-x-1/2 text-[8px] font-black text-indigo-400/30 uppercase tracking-[0.8em] animate-pulse">
                   MEMORIAL FREQUENCY TUNED
                 </div>
               )}
            </div>
            {/* Artistic Bench Legs */}
            <div className="absolute -bottom-14 left-28 w-5 h-16 bg-gradient-to-b from-slate-800 to-black rounded-b-3xl shadow-2xl"></div>
            <div className="absolute -bottom-14 right-28 w-5 h-16 bg-gradient-to-b from-slate-800 to-black rounded-b-3xl shadow-2xl"></div>
            <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-[85%] h-1 bg-indigo-500/15 blur-2xl"></div>
         </div>

         {/* Sit/Interaction Interaction Layer */}
         {!isSitting && !loading && (
           <div className="absolute inset-0 flex flex-col items-center justify-center z-20 space-y-10 bg-slate-950/20 backdrop-blur-[1px] cursor-default">
             <div className="relative group/sit">
                <div className={`absolute -inset-12 bg-indigo-500/25 blur-[70px] rounded-full transition-opacity duration-700 ${holdProgress > 0 ? 'opacity-100 scale-125' : 'opacity-0 scale-90'}`}></div>
                <button 
                  onMouseDown={handleStartSitting}
                  onMouseUp={handleStopSitting}
                  onMouseLeave={handleStopSitting}
                  onTouchStart={handleStartSitting}
                  onTouchEnd={handleStopSitting}
                  className="relative w-44 h-44 flex items-center justify-center transition-transform active:scale-95"
                >
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="88" cy="88" r="82" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-900" />
                      <circle 
                        cx="88" 
                        cy="88" 
                        r="82" 
                        stroke="currentColor" 
                        strokeWidth="6" 
                        fill="transparent" 
                        className="text-indigo-500 transition-all duration-150"
                        strokeDasharray="515"
                        strokeDashoffset={515 - (515 * holdProgress) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="w-36 h-36 bg-white rounded-full flex flex-col items-center justify-center shadow-4xl transform transition-all group-hover/sit:scale-105">
                       <span className="text-slate-950 text-[10px] font-black uppercase text-center leading-[1.3] tracking-widest">تثبيت<br/>للجلوس</span>
                       <div className={`mt-3 h-1.5 bg-indigo-500 rounded-full transition-all duration-300 ${holdProgress > 0 ? 'w-12' : 'w-5 animate-bounce'}`}></div>
                    </div>
                </button>
             </div>
             <div className="text-center space-y-3">
               <p className="text-[11px] text-slate-300 font-black uppercase tracking-[0.6em] animate-pulse">استشعار الحضور الجسدي...</p>
               <p className="text-[10px] text-slate-500 font-medium italic">سيروي لك مقعد حي {selectedNeighborhood} فصلاً من تاريخه المنسي.</p>
             </div>
           </div>
         )}

         {isSitting && (
           <div className="absolute top-12 left-12 flex items-center gap-6 z-30">
             <div className="flex bg-indigo-950/40 backdrop-blur-2xl border border-indigo-500/20 px-8 py-4 rounded-3xl items-center gap-4 shadow-2xl">
               <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
               <span className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em]">اتصال بذاكرة الحي نشط</span>
             </div>
             <button 
               onClick={handleExit}
               className="bg-red-600 hover:bg-red-500 px-10 py-4 rounded-3xl text-[10px] font-black text-white shadow-2xl transition-all hover:scale-105 active:scale-95"
             >
               مغادرة المقعد 🚪
             </button>
           </div>
         )}

         {loading && (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/98 z-40 backdrop-blur-3xl space-y-12">
              <div className="relative w-40 h-40">
                <div className="absolute inset-0 border-[6px] border-indigo-500/5 rounded-full"></div>
                <div className="absolute inset-0 border-t-[6px] border-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute inset-10 border-2 border-indigo-400/20 rounded-full animate-pulse"></div>
              </div>
              <div className="text-center space-y-4">
                <h6 className="text-4xl font-black text-white italic tracking-tighter">الحي يستجمع أنفاسه ليروي...</h6>
                <div className="flex gap-2 justify-center">
                  {[...Array(3)].map((_, i) => <div key={i} className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce shadow-lg" style={{animationDelay: `${i * 0.25}s`}}></div>)}
                </div>
                <span className="text-[10px] text-indigo-400/50 font-black uppercase tracking-[0.8em] block pt-6">Gemini Narrative Engine v3.0</span>
              </div>
           </div>
         )}
      </div>

      {/* Main Narrative Display and Memory Journal */}
      <div className="w-full grid lg:grid-cols-12 gap-12 flex-1 min-h-[650px] items-stretch">
        {/* Storytelling Canvas */}
        <div className="lg:col-span-8 bg-slate-900/60 p-16 md:p-24 rounded-[5rem] border border-slate-800/50 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl group/story transition-all hover:border-indigo-500/20">
           {/* Background Grid Accent */}
           <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1.5px, transparent 1.5px)', backgroundSize: '50px 50px' }}></div>
           
           {story ? (
             <div className="relative z-10 space-y-16 animate-fade-in-up">
                <div className="w-24 h-24 bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-indigo-400 shadow-inner border border-indigo-500/10">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M14 17h6v2h-6v-2zm-2-4h8v2h-8v-2zm-2-4h10v2h-10v-2zm-2-4h12v2h-12v-2zM2 13.069V21h7.069l8.473-8.473-7.069-7.069L2 13.069zm1.414-1.414l7.069 7.069-7.069-7.069z" /></svg>
                </div>
                <p className="font-amiri text-4xl md:text-5xl text-slate-100 leading-[1.9] italic font-medium px-8 transition-all group-hover/story:text-white">
                  "{story}"
                </p>
                <div className="pt-16 flex items-center justify-center gap-8">
                  <div className="h-px w-32 bg-gradient-to-l from-transparent to-slate-800"></div>
                  <span className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.3em]">راوي حي {selectedNeighborhood}</span>
                  <div className="h-px w-32 bg-gradient-to-r from-transparent to-slate-800"></div>
                </div>
             </div>
           ) : (
             <div className="space-y-12 animate-fade-in max-w-lg">
                <div className="w-32 h-32 bg-slate-800/40 rounded-[3rem] flex items-center justify-center mx-auto text-6xl shadow-inner group-hover/story:scale-110 transition-transform duration-1000">🕯️</div>
                <div className="space-y-6">
                  <h5 className="text-4xl font-black text-white tracking-tight leading-tight">مقعد حكايا {selectedNeighborhood} المنسق</h5>
                  <p className="text-slate-400 font-medium text-lg leading-relaxed italic">
                    هذا المقعد ليس صامتاً؛ إنه كبسولة زمنية. كل من جلس هنا ترك أثراً، والآن جاء دورك لتسمع وتُسمع.
                  </p>
                </div>
                <div className="pt-8 flex justify-center gap-3">
                   {[...Array(5)].map((_, i) => <div key={i} className="w-2.5 h-2.5 rounded-full bg-indigo-500/20 animate-pulse" style={{animationDelay: `${i * 0.4}s`}}></div>)}
                </div>
             </div>
           )}
        </div>

        {/* Neighborhood Memory Journal */}
        <div className="lg:col-span-4 bg-slate-900/60 p-12 rounded-[5rem] border border-slate-800/50 flex flex-col shadow-2xl relative overflow-hidden transition-all hover:border-indigo-500/20">
           {/* Abstract Decorative Light */}
           <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none"></div>
           
           <div className="flex justify-between items-end mb-14 relative z-10">
             <div className="text-right">
                <h5 className="text-2xl font-black text-white tracking-tight">سجل الزيارات</h5>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{selectedNeighborhood} Living Archive</span>
             </div>
             <div className="bg-slate-800/80 p-5 rounded-[2rem] text-3xl shadow-2xl shadow-black/30 border border-white/5">🖋️</div>
           </div>
           
           {/* Filtered Memory List */}
           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-10 mb-14 pr-6 text-right relative z-10">
              {filteredMemories.map(m => (
                <div key={m.id} className="bg-slate-950/40 p-10 rounded-[3rem] border border-white/5 space-y-5 hover:border-indigo-500/40 transition-all group/mem shadow-xl">
                   <div className="flex justify-between items-center">
                      <span className="text-[9px] text-slate-600 font-mono tracking-tighter uppercase">{new Date(m.created_at).toLocaleDateString('ar-EG')}</span>
                      <div className="text-sm font-black text-indigo-300 group-hover/mem:text-indigo-200">{m.visitor_name}</div>
                   </div>
                   <p className="text-base text-slate-200 leading-relaxed font-medium italic group-hover/mem:text-white font-amiri">"{m.text}"</p>
                </div>
              ))}
              {filteredMemories.length === 0 && (
                <div className="text-slate-600 text-center py-32 italic space-y-6">
                  <div className="text-6xl opacity-10">📖</div>
                  <p className="text-base max-w-[220px] mx-auto leading-relaxed">بادر بتدوين حضورك في ذاكرة حي {selectedNeighborhood} العريق...</p>
                </div>
              )}
           </div>
           
           {/* New Memory Submission Form */}
           <form onSubmit={handlePostMemory} className="space-y-5 pt-12 border-t border-slate-800/50 relative z-10">
              <div className="flex flex-col gap-4">
                <input 
                  type="text" 
                  placeholder="اسمك (أو لقبك الفني)" 
                  required 
                  value={visitorName} 
                  onChange={e => setVisitorName(e.target.value)} 
                  className="bg-slate-950/90 border border-slate-800 rounded-2xl px-8 py-5 text-sm text-white text-right outline-none focus:border-indigo-600 transition-all placeholder:text-slate-700 font-bold shadow-inner" 
                />
                <textarea 
                  placeholder="ما الذي يهمس به هذا المكان لروحك؟" 
                  required 
                  value={newMemory} 
                  onChange={e => setNewMemory(e.target.value)} 
                  rows={3}
                  className="bg-slate-950/90 border border-slate-800 rounded-2xl px-8 py-5 text-sm text-white text-right outline-none focus:border-indigo-600 transition-all placeholder:text-slate-700 font-bold resize-none shadow-inner font-amiri text-lg" 
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmittingMemory || !visitorName || !newMemory}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white py-6 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl shadow-indigo-600/30 active:scale-95"
              >
                {isSubmittingMemory ? 'جاري تخليد الأثر...' : 'إضافة بصمتي للمقعد'}
              </button>
           </form>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 25px; }
        .animate-fade-in { animation: fadeIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in-up { animation: fadeInUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
};
