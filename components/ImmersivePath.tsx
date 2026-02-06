
import React, { useState } from 'react';

const PATH_STEPS = [
  { id: 1, name: "ساحة النخيل", sound: "خفيف - حفيف سعف النخل", icon: "🌴" },
  { id: 2, name: "حارة الذكريات", sound: "أصوات أطفال بعيدة", icon: "🏘️" },
  { id: 3, name: "سوق الحرف", sound: "دقات النحاس والإيقاع المحلي", icon: "⚒️" },
  { id: 4, name: "مطل الأفق", sound: "موسيقى تراثية مدمجة", icon: "🌅" },
];

export const ImmersivePath: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <div className="p-8 bg-slate-900 rounded-3xl border border-slate-800 h-full flex flex-col justify-between">
      <div className="space-y-8 relative">
        {/* Connection Line */}
        <div className="absolute right-6 top-10 bottom-10 w-0.5 bg-slate-700"></div>

        {PATH_STEPS.map((step) => (
          <div 
            key={step.id}
            className={`relative flex items-center gap-6 transition-all duration-300 cursor-pointer
              ${currentStep === step.id ? 'opacity-100' : 'opacity-40 hover:opacity-60'}`}
            onClick={() => setCurrentStep(step.id)}
          >
            <div className={`z-10 w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all
              ${currentStep === step.id ? 'bg-teal-600 ring-4 ring-teal-500/20 scale-110' : 'bg-slate-800'}`}>
              {step.icon}
            </div>
            
            <div className="flex-1">
              <h5 className="font-bold text-lg">{step.name}</h5>
              <p className="text-xs text-teal-400 font-mono">{step.sound}</p>
            </div>

            {currentStep === step.id && (
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-1 h-3 bg-teal-500 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-teal-600/10 rounded-xl border border-teal-500/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
            </svg>
          </div>
          <span className="text-sm font-bold">تجربة صوت مجسم (Spatial Audio)</span>
        </div>
        <p className="text-xs text-slate-400">
          أنت الآن تمر في {PATH_STEPS.find(s => s.id === currentStep)?.name}. الصوت يتحرك معك بناءً على موقعك الجغرافي واتجاه هاتفك.
        </p>
      </div>
    </div>
  );
};
