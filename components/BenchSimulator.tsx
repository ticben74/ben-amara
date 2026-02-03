
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
        return prev + 2.5; 
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
      gainNode.gain.value = 0.12; 
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
        <div className="flex flex-col gap-6 items-end">
          <div className="flex bg-slate-800/40 p-1.5 rounded-[2rem] border border-white/5 backdrop-blur-3xl shadow-2xl">
            {Object.entries(ATMOSPHERES).map(([key, data]) => (
              <button
                key={key}
                onClick={() => { setAtmosphere(key as Atmosphere); if (isSitting) playAmbient(key as Atmosphere); }}
                className={`w-14 h-14 rounded-[1.4rem] flex flex-col items-center justify-center transition-all duration-500 relative group
                  ${atmosphere === key ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <span className="text-2xl">{data.icon}</span>
                <span className="text-[7px] font-black uppercase mt-1 opacity-60 group-hover:opacity-100">{data.name}</span>
                {atmosphere === key && <span className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"></span>}
              </button>
            ))}
          </div>
          <div className="flex gap-2 justify-end flex-wrap max-w-xs">
            {NEIGHBORHOODS.map(n => (
              <button 
                key={n}
                onClick={() => setSelectedNeighborhood(n)}
                className={`text-[9px] px-6 py-2.5 rounded-full border-2 transition-all duration-300 font-black uppercase tracking-widest
                  ${selectedNeighborhood === n ? 'bg-indigo-500 text-white border-indigo-400 shadow-xl' : 'bg-slate-800/80 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-3 justify-end mb-3">
            <span className={`w-2.5 h-2.5 rounded-full bg-indigo-500 ${isSitting ? 'animate-ping' : ''}`}></span>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">صوت ذاكرة المدينة v2.5</span>
          </div>
          <h4 className="text-5xl font-black text-white tracking-tight leading-none mb-4">مقعد <span className="text-indigo-500 italic">الحكايا</span></h4>
          <p className="text-slate-400 max-w-sm text-sm font-medium leading-relaxed italic">"اجلس لتسمع همسات من مروا من هنا، وتاريخاً لم يكتبه سوى أصحابه."</p>
        </div>
      </div>

      {/* The Central Artifact: The Interactive Bench */}
      <div className={`relative w-full max-w-5xl aspect-[21/10] rounded-[5rem] overflow-hidden border-2 transition-all duration-1000 bg-slate-950 shadow-3xl flex items-center justify-center group
        ${isSitting ? 'border-indigo-500/40 shadow-indigo-500/10' : 'border-slate-800 shadow-black'}`}>
         
         {/* Atmospheric Effects Layer */}
         <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-[2s] ${ATMOSPHERES[atmosphere].gradient} to-transparent opacity-30`}></div>
         <div className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.08),transparent_70%)] transition-opacity duration-1000 ${isSitting ? 'opacity-100' : 'opacity-0'}`}></div>
         
         {/* Stylized Visual Bench */}
         <div className={`relative transition-all duration-[1.5s] cubic-bezier(0.16,1,0.3,1) transform ${isSitting ? 'scale-110 -translate-y-10' : 'scale-100 translate-y-4'}`}>
            <div className="w-[520px] h-40 bg-slate-900/60 rounded-[4rem] border border-white/10 relative flex items-center justify-center overflow-hidden backdrop-blur-2xl shadow-inner">
               <div className="absolute inset-0 flex items-center justify-center gap-3 px-14">
                  {[...Array(40)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-1 rounded-full transition-all duration-150 ${isSitting ? 'bg-indigo-400' : 'bg-slate-800'}`}
                      style={{ 
                        height: isSitting ? `${10 + (volume * (0.4 + Math.sin(i * 0.2) * 1.2))}px` : '4px',
                        opacity: isSitting ? 0.8 : 0.05,
                        boxShadow: isSitting ? '0 0 20px rgba(99, 102, 241, 0.4)' : 'none'
                      }}
                    ></div>
                  ))}
               </div>
               
               {/* Bench Texture Detail */}
               <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
               
               {isSitting && (
                 <div className="absolute top-6 left-1/2 -translate-x-1/2 text-[7px] font-black text-white/20 uppercase tracking-[0.8em] animate-pulse">
                   MEMORIAM CHANNEL CONNECTED
                 </div>
               )}
            </div>
            {/* Artistic Bench Legs */}
            <div className="absolute -bottom-12 left-24 w-4 h-14 bg-gradient-to-b from-slate-800 to-black rounded-b-3xl shadow-2xl"></div>
            <div className="absolute -bottom-12 right-24 w-4 h-14 bg-gradient-to-b from-slate-800 to-black rounded-b-3xl shadow-2xl"></div>
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-[80%] h-1 bg-indigo-500/10 blur-xl"></div>
         </div>

         {/* Sit/Interaction Interaction Layer */}
         {!isSitting && !loading && (
           <div className="absolute inset-0 flex flex-col items-center justify-center z-20 space-y-8 bg-slate-950/20 backdrop-blur-[2px] cursor-default">
             <div className="relative group/sit">
                <div className={`absolute -inset-10 bg-indigo-500/20 blur-[60px] rounded-full transition-opacity duration-700 ${holdProgress > 0 ? 'opacity-100 scale-110' : 'opacity-0 scale-90'}`}></div>
                <button 
                  onMouseDown={handleStartSitting}
                  onMouseUp={handleStopSitting}
                  onMouseLeave={handleStopSitting}
                  onTouchStart={handleStartSitting}
                  onTouchEnd={handleStopSitting}
                  className="relative w-40 h-40 flex items-center justify-center transition-transform active:scale-95"
                >
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="80" cy="80" r="76" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-900" />
                      <circle 
                        cx="80" 
                        cy="80" 
                        r="76" 
                        stroke="currentColor" 
                        strokeWidth="6" 
                        fill="transparent" 
                        className="text-indigo-500 transition-all duration-150"
                        strokeDasharray="478"
                        strokeDashoffset={478 - (478 * holdProgress) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center shadow-3xl transform transition-transform group-hover/sit:scale-105">
                       <span className="text-slate-950 text-xs font-black uppercase text-center leading-[1.2]">اضغط<br/>للجلوس</span>
                       <div className={`mt-2 h-1 bg-indigo-500 rounded-full transition-all duration-300 ${holdProgress > 0 ? 'w-10' : 'w-4 animate-bounce'}`}></div>
                    </div>
                </button>
             </div>
             <div className="text-center space-y-2">
               <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.5em] animate-pulse">ثبّت إصبعك لتفعيل الذاكرة</p>
               <p className="text-[9px] text-slate-500 font-medium italic">سيروي لك مقعد حي {selectedNeighborhood} حكاية خفية...</p>
             </div>
           </div>
         )}

         {isSitting && (
           <div className="absolute top-12 left-12 flex items-center gap-6 z-30">
             <div className="flex bg-indigo-950/40 backdrop-blur-xl border border-indigo-500/20 px-6 py-3 rounded-2xl items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">مستغرق في الحكاية</span>
             </div>
             <button 
               onClick={handleExit}
               className="bg-red-600 hover:bg-red-500 px-8 py-3 rounded-2xl text-[10px] font-black text-white shadow-2xl transition-all hover:scale-105 active:scale-95"
             >
               مغادرة المقعد
             </button>
           </div>
         )}

         {loading && (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/98 z-40 backdrop-blur-3xl space-y-10">
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 border-4 border-indigo-500/5 rounded-full"></div>
                <div className="absolute inset-0 border-t-4 border-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute inset-8 border-2 border-indigo-400/20 rounded-full animate-pulse"></div>
              </div>
              <div className="text-center space-y-3">
                <h6 className="text-3xl font-black text-white italic tracking-tighter">الحي يتنفس حكاياته...</h6>
                <div className="flex gap-1 justify-center">
                  {[...Array(3)].map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: `${i * 0.2}s`}}></div>)}
                </div>
                <span className="text-[10px] text-indigo-400/60 font-black uppercase tracking-[0.6em] block pt-4">Gemini 3 Pro Listening to Echoes</span>
              </div>
           </div>
         )}
      </div>

      {/* Main Narrative Display and Memory Input */}
      <div className="w-full grid lg:grid-cols-12 gap-12 flex-1 min-h-[600px] items-stretch">
        {/* Storytelling Canvas */}
        <div className="lg:col-span-8 bg-slate-900/60 p-16 md:p-24 rounded-[5rem] border border-slate-800/50 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl group/story">
           {/* Background Grid Accent */}
           <div className="absolute top-0 right-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1.5px, transparent 1.5px)', backgroundSize: '45px 45px' }}></div>
           
           {story ? (
             <div className="relative z-10 space-y-12 animate-fade-in-up">
                <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M14 17h6v2h-6v-2zm-2-4h8v2h-8v-2zm-2-4h10v2h-10v-2zm-2-4h12v2h-12v-2zM2 13.069V21h7.069l8.473-8.473-7.069-7.069L2 13.069zm1.414-1.414l7.069 7.069-7.069-7.069z" /></svg>
                </div>
                <p className="font-amiri text-3xl md:text-5xl text-slate-100 leading-[1.8] italic font-medium px-4 transition-all group-hover/story:text-white">
                  "{story}"
                </p>
                <div className="pt-12 flex items-center justify-center gap-6">
                  <div className="h-px w-24 bg-gradient-to-l from-transparent to-slate-800"></div>
                  <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">راوي حي {selectedNeighborhood}</span>
                  <div className="h-px w-24 bg-gradient-to-r from-transparent to-slate-800"></div>
                </div>
             </div>
           ) : (
             <div className="space-y-10 animate-fade-in max-w-md">
                <div className="w-28 h-28 bg-slate-800/40 rounded-[2.5rem] flex items-center justify-center mx-auto text-5xl shadow-inner group-hover/story:scale-110 transition-transform duration-700">🏛️</div>
                <div className="space-y-4">
                  <h5 className="text-3xl font-black text-white tracking-tight">مقعد حكايا {selectedNeighborhood}</h5>
                  <p className="text-slate-400 font-medium leading-relaxed italic">
                    هذا المقعد ليس جماداً؛ بل هو شاهد على الزمن. اجلس بهدوء ودعه يقرأ لك صفحات من ذاكرة هذا الحي العريق.
                  </p>
                </div>
                <div className="pt-6 flex justify-center gap-2">
                   {[...Array(4)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-indigo-500/20 animate-pulse" style={{animationDelay: `${i * 0.4}s`}}></div>)}
                </div>
             </div>
           )}
        </div>

        {/* Neighborhood Memory Journal */}
        <div className="lg:col-span-4 bg-slate-900/60 p-12 rounded-[5rem] border border-slate-800/50 flex flex-col shadow-2xl relative overflow-hidden">
           {/* Abstract Decorative Light */}
           <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none"></div>
           
           <div className="flex justify-between items-end mb-12 relative z-10">
             <div className="text-right">
                <h5 className="text-2xl font-black text-white tracking-tight">أصداء الحي</h5>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{selectedNeighborhood} Living Journal</span>
             </div>
             <div className="bg-slate-800/80 p-4 rounded-3xl text-2xl shadow-xl shadow-black/20">📜</div>
           </div>
           
           {/* Filtered Memory List */}
           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 mb-12 pr-4 text-right relative z-10">
              {filteredMemories.map(m => (
                <div key={m.id} className="bg-slate-800/40 p-8 rounded-[2.5rem] border border-white/5 space-y-4 hover:border-indigo-500/30 transition-all group/mem">
                   <div className="flex justify-between items-center">
                      <span className="text-[9px] text-slate-600 font-mono tracking-tighter uppercase">{new Date(m.created_at).toLocaleDateString('ar-EG')}</span>
                      <div className="text-xs font-black text-indigo-300 group-hover/mem:text-indigo-200">{m.visitor_name}</div>
                   </div>
                   <p className="text-sm text-slate-200 leading-relaxed font-medium italic group-hover/mem:text-white">"{m.text}"</p>
                </div>
              ))}
              {filteredMemories.length === 0 && (
                <div className="text-slate-600 text-center py-28 italic space-y-5">
                  <div className="text-5xl opacity-10">🕯️</div>
                  <p className="text-sm max-w-[200px] mx-auto leading-relaxed">كن أول من يوثق أثراً في ذاكرة حي {selectedNeighborhood}...</p>
                </div>
              )}
           </div>
           
           {/* New Memory Submission Form */}
           <form onSubmit={handlePostMemory} className="space-y-4 pt-10 border-t border-slate-800/50 relative z-10">
              <div className="flex flex-col gap-3">
                <input 
                  type="text" 
                  placeholder="اسمك الكريم" 
                  required 
                  value={visitorName} 
                  onChange={e => setVisitorName(e.target.value)} 
                  className="bg-slate-950/80 border border-slate-800 rounded-2xl px-6 py-4 text-xs text-white text-right outline-none focus:border-indigo-600 transition-all placeholder:text-slate-700 font-bold" 
                />
                <textarea 
                  placeholder="اترك ذكراك هنا لتسمعها الأجيال القادمة..." 
                  required 
                  value={newMemory} 
                  onChange={e => setNewMemory(e.target.value)} 
                  rows={3}
                  className="bg-slate-950/80 border border-slate-800 rounded-2xl px-6 py-4 text-xs text-white text-right outline-none focus:border-indigo-600 transition-all placeholder:text-slate-700 font-bold resize-none" 
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmittingMemory || !visitorName || !newMemory}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white py-5 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
              >
                {isSubmittingMemory ? 'جاري توثيق الأثر...' : 'تخليد ذكرى في هذا المقعد'}
              </button>
           </form>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 20px; }
        .animate-fade-in { animation: fadeIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in-up { animation: fadeInUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
};
