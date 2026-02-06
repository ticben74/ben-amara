
import React, { useState, useRef, useEffect } from 'react';
import { generateStory, generateSpeech, decodeAudioBuffer } from '../services/geminiService';

type ScanPhase = 'idle' | 'preparing' | 'scanning' | 'analyzing';

export const DoorIntervention: React.FC = () => {
  const [hasCamera, setHasCamera] = useState(false);
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<string | null>(null);
  const [displayedStory, setDisplayedStory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (story) {
      setDisplayedStory("");
      let i = 0;
      const interval = setInterval(() => {
        setDisplayedStory((prev) => prev + story.charAt(i));
        i++;
        if (i >= story.length) clearInterval(interval);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [story]);

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("متصفحك لا يدعم الوصول إلى الكاميرا.");
      return;
    }

    // مصفوفة من المحاولات بالتدريج من الأكثر دقة إلى الأكثر شمولاً
    const attemptConstraints = [
      { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { facingMode: 'environment' } },
      { video: true } // الخيار المضمون في معظم المتصفحات
    ];

    let success = false;
    for (const constraints of attemptConstraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasCamera(true);
          setError(null);
          success = true;
          break;
        }
      } catch (err: any) {
        console.warn(`Constraint attempt failed (${err.name}):`, constraints);
      }
    }

    if (!success) {
      setError("تعذر العثور على كاميرا متاحة. يرجى التحقق من الأذونات وتوصيل الكاميرا.");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
  };

  const handleScan = async () => {
    if (phase !== 'idle' || loading) return;
    
    setError(null);
    setStory(null);
    setDisplayedStory("");
    setIsPlaying(false);

    setPhase('preparing');
    await new Promise(resolve => setTimeout(resolve, 1000));

    setPhase('scanning');
    
    setTimeout(async () => {
      try {
        setPhase('analyzing');
        setLoading(true);

        let base64Image = undefined;
        if (canvasRef.current && videoRef.current) {
          const context = canvasRef.current.getContext('2d');
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          context?.drawImage(videoRef.current, 0, 0);
          base64Image = canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];
        }

        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 150);

        const text = await generateStory("أبواب المدينة", base64Image);
        setStory(text);
        setPhase('idle');
        
        const audioData = await generateSpeech(text);
        if (audioData) {
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          const ctx = audioContextRef.current;
          const buffer = await decodeAudioBuffer(audioData, ctx);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.onstart = () => setIsPlaying(true);
          source.onended = () => setIsPlaying(false);
          source.start();
          sourceRef.current = source;
        }
      } catch (err) {
        console.error(err);
        setError("عذراً، حدث خطأ أثناء تحليل الباب.");
        setPhase('idle');
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  return (
    <div className="p-8 bg-slate-900 rounded-3xl border border-slate-800 h-full flex flex-col items-center justify-between relative overflow-hidden">
      <div className="w-full text-center space-y-4 mb-8">
        <h4 className="text-xl font-black text-teal-300">أبواب المدينة: حكايا النكهات</h4>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          وجه الكاميرا نحو باب أثري لاستعادة ذاكرة النكهات التي عبرت من خلاله.
        </p>
      </div>

      <div className="relative w-full max-w-md aspect-[3/4] rounded-3xl overflow-hidden border-4 border-slate-800 bg-slate-950 shadow-2xl">
        {hasCamera ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className={`w-full h-full object-cover grayscale-[0.3] brightness-90 transition-all duration-500 
              ${phase !== 'idle' ? 'blur-[3px] scale-105' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-8 text-center text-slate-500 italic">
            <div className="space-y-4">
              <div className="text-3xl animate-pulse">📷</div>
              <p>{error || "جاري تهيئة العدسة الرقمية..."}</p>
              {error && (
                <button 
                  onClick={startCamera}
                  className="px-6 py-2 bg-teal-600 text-white text-xs rounded-xl font-bold hover:bg-teal-500 transition-colors"
                >
                  إعادة محاولة الوصول
                </button>
              )}
            </div>
          </div>
        )}

        {/* Viewfinder Overlay */}
        <div className="absolute inset-0 pointer-events-none border-[20px] border-slate-950/20">
          <div className="w-full h-full border-2 border-dashed border-teal-500/30 flex items-center justify-center">
             <div className={`w-40 h-56 border-2 border-teal-500/60 rounded-[3rem] relative transition-transform duration-700 ${phase === 'scanning' ? 'scale-110' : ''}`}>
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-teal-400"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-teal-400"></div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-teal-400"></div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-teal-400"></div>
             </div>
          </div>
        </div>

        {/* Scanning Line */}
        {phase === 'scanning' && (
          <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
             <div className="w-full h-1 bg-teal-400 shadow-[0_0_20px_rgba(129,140,248,1)] absolute top-0 animate-scan-move"></div>
          </div>
        )}

        <div className={`absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150 ${showFlash ? 'opacity-100' : 'opacity-0'}`}></div>
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="mt-8 w-full flex flex-col items-center gap-6">
        <button
          onClick={handleScan}
          disabled={phase !== 'idle' || !hasCamera}
          className={`px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl
            ${phase !== 'idle' 
              ? 'bg-slate-800 text-slate-500' 
              : 'bg-teal-600 text-white hover:bg-teal-500 active:scale-95'}`}
        >
          {phase === 'analyzing' ? 'جاري التحليل...' : 'امسح الباب الآن'}
        </button>

        {displayedStory && phase === 'idle' && (
          <div className="w-full max-w-lg bg-teal-950/40 backdrop-blur-xl border border-teal-500/20 p-8 rounded-[2.5rem] animate-fade-in-up">
            <p className="font-amiri text-2xl text-slate-100 leading-relaxed italic text-center">
               "{displayedStory}"
            </p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan-move {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-move {
          animation: scan-move 2s linear infinite;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};
