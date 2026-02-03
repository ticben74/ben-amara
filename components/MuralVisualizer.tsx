
import React, { useState, useEffect, useRef, useMemo } from 'react';

type PaletteColor = { hex: string; glow: string };

const PALETTES: Record<string, { name: string; description: string; colors: PaletteColor [] }> = {
  neon: {
    name: 'أضواء النيون',
    description: 'أجواء صاخبة تعكس نبض المدينة المتسارع والاحتفالي',
    colors: [
      { hex: '#6366f1', glow: 'rgba(99, 102, 241, 0.6)' },
      { hex: '#a855f7', glow: 'rgba(168, 85, 247, 0.6)' },
      { hex: '#ec4899', glow: 'rgba(236, 72, 153, 0.6)' },
      { hex: '#f43f5e', glow: 'rgba(244, 63, 94, 0.6)' },
      { hex: '#f59e0b', glow: 'rgba(245, 158, 11, 0.6)' },
      { hex: '#10b981', glow: 'rgba(16, 185, 129, 0.6)' }
    ]
  },
  desert: {
    name: 'رمال الصحراء',
    description: 'ألوان ترابية دافئة مستوحاة من هدوء البادية والتراث الطيني',
    colors: [
      { hex: '#ea580c', glow: 'rgba(234, 88, 12, 0.6)' },
      { hex: '#f59e0b', glow: 'rgba(245, 158, 11, 0.6)' },
      { hex: '#b45309', glow: 'rgba(180, 83, 9, 0.6)' },
      { hex: '#78350f', glow: 'rgba(120, 53, 15, 0.6)' },
      { hex: '#fbbf24', glow: 'rgba(251, 191, 36, 0.6)' },
      { hex: '#d97706', glow: 'rgba(217, 119, 6, 0.6)' }
    ]
  },
  ocean: {
    name: 'نسيم البحر',
    description: 'ألوان باردة تحاكي انسيابية المياه ونسيم الساحل المنعش',
    colors: [
      { hex: '#0891b2', glow: 'rgba(8, 145, 178, 0.6)' },
      { hex: '#0ea5e9', glow: 'rgba(14, 165, 233, 0.6)' },
      { hex: '#2563eb', glow: 'rgba(37, 99, 235, 0.6)' },
      { hex: '#1e40af', glow: 'rgba(30, 64, 175, 0.6)' },
      { hex: '#0d9488', glow: 'rgba(13, 148, 136, 0.6)' },
      { hex: '#67e8f9', glow: 'rgba(103, 232, 249, 0.6)' }
    ]
  },
  cyber: {
    name: 'سايبر بانك',
    description: 'توليفة رقمية حادة تعكس ملامح المستقبل التقني المتطور',
    colors: [
      { hex: '#ff00ff', glow: 'rgba(255, 0, 255, 0.6)' },
      { hex: '#00ffff', glow: 'rgba(0, 255, 255, 0.6)' },
      { hex: '#ffff00', glow: 'rgba(255, 255, 0, 0.6)' },
      { hex: '#ff007f', glow: 'rgba(255, 0, 127, 0.6)' },
      { hex: '#7f00ff', glow: 'rgba(127, 0, 255, 0.6)' },
      { hex: '#00ff7f', glow: 'rgba(0, 255, 127, 0.6)' }
    ]
  }
};

export const MuralVisualizer: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [bandEnergies, setBandEnergies] = useState<number[]>(new Array(48).fill(1));
  const [activePalette, setActivePalette] = useState<keyof typeof PALETTES>('neon');
  const [hoveredPalette, setHoveredPalette] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'shared'>('idle');
  
  const [speedMode, setSpeedMode] = useState<'dynamic' | 'manual'>('dynamic');
  const [manualDuration, setManualDuration] = useState(1.2); 
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const requestRef = useRef<number>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('palette');
    if (p && PALETTES[p]) {
      setActivePalette(p as keyof typeof PALETTES);
    }
  }, []);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('palette', activePalette);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      console.warn("Could not update address bar URL:", e);
    }
  }, [activePalette]);

  const shareUrl = useMemo(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('palette', activePalette);
      return url.toString();
    } catch (e) {
      return window.location.href;
    }
  }, [activePalette]);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Increased fftSize for better frequency resolution
      analyserRef.current.fftSize = 512; 
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      setIsListening(true);
    } catch (err) {
      console.warn("Audio analysis fallback to simulation mode.", err);
      setIsListening(true);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'جدارية الترددات البصرية للمدينة',
      text: `اكتشف كيف يبدو صوت مدينتك عبر هذه الجدارية الفنية التفاعلية بلوحة ${PALETTES[activePalette].name}!`,
      url: shareUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareStatus('shared');
        setTimeout(() => setShareStatus('idle'), 2000);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') copyToClipboard(shareData.url);
      }
    } else {
      copyToClipboard(shareData.url);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    } catch (err) {
      console.error('Could not copy text: ', err);
    }
  };

  const animate = (time: number) => {
    const newEnergies = new Array(48).fill(1);
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      const bufferLength = dataArrayRef.current.length;
      
      // Granular Analysis: Mapping 48 tiles to specific frequency bands
      // Tiles 0-11: Bass (Low-end frequencies)
      // Tiles 12-35: Mids (Vocals, instrumentation)
      // Tiles 36-47: Treble (High-end frequencies, sparkles)
      
      for (let i = 0; i < 48; i++) {
        let bandStart = 0;
        let bandEnd = bufferLength;
        
        if (i < 12) { // Bass
          bandStart = 0;
          bandEnd = Math.floor(bufferLength * 0.08);
        } else if (i < 36) { // Mids
          bandStart = Math.floor(bufferLength * 0.08);
          bandEnd = Math.floor(bufferLength * 0.45);
        } else { // Treble
          bandStart = Math.floor(bufferLength * 0.45);
          bandEnd = bufferLength;
        }

        const bandSize = bandEnd - bandStart;
        const subIndex = (i % 12) * Math.floor(bandSize / 12);
        const dataIndex = Math.min(bandStart + subIndex, bufferLength - 1);
        
        const val = dataArrayRef.current[dataIndex] || 0;
        // Normalize value based on typical range and band sensitivity
        const sensitivity = i < 12 ? 1.2 : i < 36 ? 1.0 : 1.8;
        newEnergies[i] = 0.4 + (val / 150) * sensitivity; 
      }
    } else {
      // Simulation mode with organic variations
      for (let i = 0; i < 48; i++) {
        const row = Math.floor(i / 12);
        const col = i % 12;
        newEnergies[i] = 1 + 
          0.4 * Math.sin(time / (500 + row * 100) + i * 0.2) + 
          0.2 * Math.cos(time / 800 + row * 0.5) +
          0.1 * Math.sin(time / 300 + col * 0.8);
      }
    }
    setBandEnergies(newEnergies);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isListening) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isListening]);

  const currentColors = PALETTES[activePalette].colors;
  const currentInfo = PALETTES[hoveredPalette || activePalette];

  return (
    <div className={`p-8 bg-slate-900 rounded-3xl border transition-all duration-700 h-full flex flex-col items-center overflow-hidden relative
      ${isListening 
        ? 'border-indigo-500/50 shadow-[0_0_80px_-20px_rgba(99,102,241,0.6)] ring-2 ring-indigo-500/10' 
        : 'border-slate-800 shadow-none'}`}
    >
      <div className={`absolute top-4 left-4 z-50 flex items-center gap-2 bg-slate-800/80 backdrop-blur-md border px-3 py-1.5 rounded-full transition-all duration-500 ${isListening ? 'border-indigo-500/40 opacity-100' : 'border-slate-700 opacity-0 translate-y-[-10px]'}`}>
         <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
         <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">تحليل مباشر</span>
      </div>

      <div className="grid grid-cols-8 md:grid-cols-12 gap-3 w-full mb-10">
        {bandEnergies.map((energy, i) => {
          const colorObj = currentColors[i % currentColors.length];
          const individualDelay = (i * 0.07) % 2;
          
          // Behavior based on band
          // Bass (0-11): Heavy scale, slow intensity shifts
          // Mids (12-35): Responsive flickering, color shifts
          // Treble (36-47): High-speed sparkling, sharp blurs
          
          const bandType = i < 12 ? 'bass' : i < 36 ? 'mid' : 'treble';
          
          const calculatedSpeed = bandType === 'bass' 
            ? Math.max(0.4, 1.0 / (energy + 0.1)) 
            : bandType === 'mid' 
              ? Math.max(0.2, 0.8 / (energy + 0.1))
              : Math.max(0.1, 0.4 / (energy + 0.15));
          
          const finalSpeed = speedMode === 'manual' ? manualDuration : calculatedSpeed;
          
          const intensity = Math.pow(energy, bandType === 'bass' ? 1.8 : 1.5) * (bandType === 'treble' ? 2.0 : 1.5);
          const maxScale = bandType === 'bass' ? 1.1 + (energy * 0.8) : 1.05 + (energy * 0.45);
          const minScale = 0.8 + (energy * 0.1);
          const brightness = bandType === 'treble' ? 0.8 + (energy * 1.5) : 0.7 + (energy * 1.1);
          const opacity = isListening ? 0.6 + (energy * 0.4) : 0.15;
          
          // Color shift based on energy (Subtle hue rotation for mid/treble)
          const hueShift = bandType !== 'bass' ? (energy * 40) - 20 : 0;
          const blurVal = bandType === 'treble' ? Math.max(0, 3 - energy * 4) : 0;

          return (
            <div 
              key={i} 
              className={`aspect-square rounded-xl transition-all duration-700 cursor-pointer 
                hover:scale-125 hover:z-20 hover:opacity-100 hover:shadow-2xl hover:shadow-indigo-500/40
                ${isListening ? 'animate-mural-active' : 'hover:bg-slate-700'}`}
              style={{ 
                backgroundColor: isListening ? colorObj.hex : '#1e293b',
                filter: isListening ? `brightness(${brightness}) contrast(${1.2 + energy * 0.4}) hue-rotate(${hueShift}deg) blur(${blurVal}px)` : 'none',
                ['--mural-glow-color' as any]: colorObj.glow,
                ['--mural-speed' as any]: `${finalSpeed}s`,
                ['--mural-intensity' as any]: intensity,
                ['--mural-max-scale' as any]: maxScale,
                ['--mural-min-scale' as any]: minScale,
                ['--mural-brightness' as any]: brightness,
                ['--mural-min-opacity' as any]: isListening ? 0.4 : 0.1,
                animationDelay: isListening ? `${individualDelay}s` : '0s',
                opacity: opacity,
              }}
            />
          );
        })}
      </div>

      <div className="text-center space-y-8 w-full max-w-2xl relative z-10">
        <div className="space-y-3">
          <h4 className="text-xl font-black text-white">جدارية الترددات البصرية</h4>
          <p className="text-sm text-slate-400 leading-relaxed px-4 font-medium">
            تتفاعل كل قطعة في الجدارية مع تردد صوتي محدد؛ الصف السفلي (Bass) يعكس الإيقاعات العميقة، الوسط (Mids) يتفاعل مع الألحان، والقمة (Treble) تلمع مع الترددات الحادة.
          </p>
        </div>

        <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50 w-full relative space-y-10">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 justify-center py-2 border-b border-slate-700/30 mb-2 group/master">
              {Object.entries(PALETTES).map(([key, p]) => (
                <div 
                  key={key} 
                  onMouseEnter={() => setHoveredPalette(key)}
                  onMouseLeave={() => setHoveredPalette(null)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-help border
                    ${(hoveredPalette === key || (activePalette === key && !hoveredPalette))
                      ? 'bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20' 
                      : 'bg-transparent border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <div className="flex -space-x-1 rtl:space-x-reverse">
                    {p.colors.slice(0, 3).map((c, i) => (
                      <div key={i} className="w-2.5 h-2.5 rounded-full border border-slate-900 shadow-sm" style={{backgroundColor: c.hex}} />
                    ))}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${hoveredPalette === key || activePalette === key ? 'text-indigo-300' : 'text-slate-500'}`}>
                    {p.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right px-1">
                تخصيص لوحة الألوان
              </label>
              
              <div className="flex items-center gap-2 justify-end animate-fade-in" key={hoveredPalette || activePalette}>
                <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border shadow-sm transition-all duration-300
                  ${hoveredPalette ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40 animate-pulse' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'}`}>
                  {currentInfo.description}
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3">
              {Object.entries(PALETTES).map(([key, palette]) => (
                <button
                  key={key}
                  onMouseEnter={() => setHoveredPalette(key)}
                  onMouseLeave={() => setHoveredPalette(null)}
                  onClick={() => setActivePalette(key as keyof typeof PALETTES)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all duration-300
                    ${activePalette === key 
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/10 scale-105' 
                      : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-800/60'}`}
                >
                  <div className="flex -space-x-1.5 rtl:space-x-reverse">
                    {palette.colors.slice(0, 3).map((c, idx) => (
                      <div 
                        key={idx} 
                        className="w-3.5 h-3.5 rounded-full border border-slate-900 shadow-sm"
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold">{palette.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-700/30 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right px-1">
                التحكم في سرعة النبض
              </label>
              
              <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700/50 backdrop-blur-sm self-end">
                <button 
                  onClick={() => setSpeedMode('dynamic')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all
                    ${speedMode === 'dynamic' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  تفاعل صوتي
                </button>
                <button 
                  onClick={() => setSpeedMode('manual')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all
                    ${speedMode === 'manual' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  يدوي ثابت
                </button>
              </div>
            </div>

            <div className={`transition-all duration-500 ${speedMode === 'manual' ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
              <div className="flex items-center gap-6">
                <span className="text-[10px] font-black text-slate-500 uppercase">سريع</span>
                <div className="flex-1 relative group py-4">
                  <input 
                    type="range" 
                    min="0.1" 
                    max="5.0" 
                    step="0.1" 
                    value={manualDuration}
                    onChange={(e) => setManualDuration(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500 outline-none hover:bg-slate-600 transition-all"
                  />
                  <div 
                    className="absolute top-0 px-2 py-1 bg-indigo-600 text-white text-[9px] font-black rounded-md -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ left: `calc(${(manualDuration - 0.1) / 4.9 * 100}% - 15px)` }}
                  >
                    {manualDuration}s
                  </div>
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase">هادئ</span>
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={isListening ? stopListening : startListening}
          className={`px-10 py-5 rounded-2xl flex items-center gap-3 mx-auto transition-all shadow-xl group relative overflow-hidden font-black uppercase tracking-widest
            ${isListening 
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.3)]' 
              : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95'}`}
        >
          {isListening ? (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" />
              إيقاف التحليل الطيفي
            </>
          ) : (
            <>
              <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              بدء الاستماع للحي
            </>
          )}
        </button>

        <div className="mt-8 p-10 bg-slate-800/60 rounded-[3rem] border border-slate-700/50 flex flex-col md:flex-row items-center gap-12 text-right group hover:border-indigo-500/40 transition-all duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] -mr-32 -mt-32 rounded-full pointer-events-none"></div>
          
          <div className="shrink-0 relative">
            <div className="absolute -inset-10 bg-indigo-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
            <div className="bg-white p-4 rounded-[2.5rem] relative shadow-2xl transform transition-transform group-hover:rotate-1 group-hover:scale-105 overflow-hidden">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(shareUrl)}&color=0f172a`} 
                alt="QR Code for Audio Map"
                className="w-56 h-56 md:w-64 md:h-64 lg:w-72 lg:h-72"
              />
            </div>
          </div>
          
          <div className="space-y-6 flex-1">
            <div className="space-y-3">
              <h5 className="text-indigo-300 font-black text-2xl flex items-center gap-2 justify-end">
                استكشف الطيف الصوتي الرقمي
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </h5>
              <p className="text-base text-slate-400 leading-relaxed font-medium">
                امسح الرمز ضوئياً للوصول المباشر إلى لوحة التحكم الصوتية المتقدمة ومشاركة المشهد السمعي الحي لمدينتك. تم تكبير الرمز لضمان تجربة مسح سريعة وموثوقة.
              </p>
            </div>
            
            <div className="pt-8 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-4">
              <button 
                onClick={handleShare}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl transition-all text-sm font-black uppercase tracking-[0.15em] relative overflow-hidden group/btn active:scale-95
                  ${shareStatus !== 'idle' 
                    ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30'}`}
              >
                {shareStatus === 'copied' ? (
                  <span className="flex items-center gap-2 animate-fade-in">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    تم نسخ الرابط!
                  </span>
                ) : shareStatus === 'shared' ? (
                  <span className="flex items-center gap-2 animate-fade-in">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    تمت المشاركة
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    مشاركة الجدارية
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #6366f1;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
          border: 2px solid white;
          margin-top: -7px;
          transition: all 0.2s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.6);
        }
        input[type=range]::-webkit-slider-runnable-track {
          width: 100%;
          height: 6px;
          cursor: pointer;
          background: #1e293b;
          border-radius: 3px;
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};
