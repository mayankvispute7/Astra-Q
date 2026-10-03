import React, { useState, useEffect } from 'react';
import { Terminal, Cpu, Database, Activity, Scan, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { icon: <Database className="w-4 h-4" />, text: "Connecting to telemetry stream..." },
    { icon: <Scan className="w-4 h-4" />, text: "Synthesizing lot-baseline metrics..." },
    { icon: <Activity className="w-4 h-4" />, text: "Running robust screening algorithms..." },
    { icon: <Cpu className="w-4 h-4" />, text: "Calculating 168h temporal drift..." },
    { icon: <ShieldAlert className="w-4 h-4" />, text: "Performing spatial common-mode attribution..." },
    { icon: <CheckCircle2 className="w-4 h-4" />, text: "Finalizing ASTRA-Q analysis matrix..." }
  ];

  useEffect(() => {
    const totalTime = 4000;
    const interval = 50;
    const stepsCount = totalTime / interval;
    
    let current = 0;
    const timer = setInterval(() => {
      current++;
      const percent = Math.min((current / stepsCount) * 100, 100);
      setProgress(percent);
      
      const stepIndex = Math.min(Math.floor((percent / 100) * steps.length), steps.length - 1);
      setCurrentStep(stepIndex);
      
      if (current >= stepsCount) {
        clearInterval(timer);
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 z-50 overflow-hidden font-mono text-sky-500">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(14, 165, 233, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.2) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      
      <div className="w-full max-w-2xl bg-black/60 border border-sky-900 rounded-lg shadow-2xl p-8 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-3 mb-8 border-b border-sky-900 pb-4">
          <Terminal className="w-6 h-6 text-sky-400" />
          <h2 className="text-xl font-bold tracking-widest text-sky-400 uppercase">ASTRA-Q Initialization Sequence</h2>
        </div>
        
        <div className="space-y-6">
          <div className="h-40 overflow-hidden relative">
            <div className="absolute bottom-0 left-0 w-full flex flex-col gap-3 transition-transform duration-300" style={{ transform: `translateY(${Math.max(0, currentStep - 2) * -36}px)` }}>
              {steps.map((step, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                    idx < currentStep ? 'text-emerald-500 opacity-60' : 
                    idx === currentStep ? 'text-sky-400 font-bold opacity-100' : 
                    'text-slate-600 opacity-30'
                  }`}
                >
                  <div className="w-6 flex justify-center">
                    {idx < currentStep ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
                  </div>
                  <span className="tracking-wide">{step.text}</span>
                  {idx === currentStep && <span className="animate-pulse">...</span>}
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-6 border-t border-sky-900">
            <div className="flex justify-between text-xs mb-2 font-bold text-sky-400 uppercase tracking-widest">
              <span>Overall Progress</span>
              <span>{Math.floor(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-sky-950 rounded-full overflow-hidden">
              <div 
                className="h-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)] transition-all duration-75 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
