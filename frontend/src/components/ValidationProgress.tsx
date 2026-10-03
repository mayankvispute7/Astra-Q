import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, Loader2, Server, Terminal, Cpu, Database, Activity, Scan } from 'lucide-react';

interface ValidationProgressProps {
  isComplete: boolean;
  onComplete: () => void;
}

export const ValidationProgress: React.FC<ValidationProgressProps> = ({ isComplete, onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    { label: 'Initializing Telemetry Interface', sub: 'ESTABLISHING HANDSHAKE...', icon: Server },
    { label: 'Loading Dataset LOT-A17', sub: '4,035 MEASUREMENTS LOADED', icon: Database },
    { label: 'Validating Timestamp Sequence', sub: 'SEQUENCE VERIFIED', icon: CheckCircle2 },
    { label: 'Evaluating Signal Integrity', sub: '7 ANOMALIES INTERPOLATED', warn: true, icon: AlertTriangle },
    { label: 'Running Physics Constraints', sub: 'ALL CHECKS NOMINAL', icon: Cpu },
    { label: 'Calibrating Test Bench', sub: 'SYSTEM STABLE', icon: Activity },
  ];

  useEffect(() => {
    if (!isComplete) return;
    
    // Simulate step-by-step progress
    const interval = setInterval(() => {
      setStep(s => {
        if (s >= steps.length) {
          clearInterval(interval);
          setTimeout(onComplete, 200); // Wait a bit before moving to overview
          return s;
        }
        return s + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isComplete, onComplete, steps.length]);

  return (
    <div className="absolute inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center p-6 overflow-hidden font-mono text-sky-600 animate-in fade-in duration-500">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(14, 165, 233, 0.4) 0%, transparent 70%), linear-gradient(rgba(14, 165, 233, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.1) 1px, transparent 1px)', backgroundSize: '100% 100%, 40px 40px, 40px 40px' }} />
      
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-lg shadow-xl p-8 relative z-10">
        <div className="flex items-center gap-3 mb-8 border-b border-slate-200 pb-4">
          <Terminal className="w-6 h-6 text-sky-600" />
          <h2 className="text-xl font-bold tracking-widest text-sky-600 uppercase">ASTRA-Q Lab Environment Boot Sequence</h2>
        </div>
        
        <div className="space-y-6">
          <div className="h-48 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full flex flex-col gap-4 transition-transform duration-300" style={{ transform: `translateY(${Math.max(0, step - 3) * -44}px)` }}>
              {steps.map((s, i) => {
                const isActive = step === i;
                const isDone = step > i;
                const isWaiting = step < i;

                return (
                  <div key={i} className={`flex items-start gap-4 transition-all duration-300 ${isWaiting ? 'opacity-20' : isActive ? 'opacity-100 translate-x-2' : 'opacity-60'}`}>
                    <div className={`mt-0.5 flex-shrink-0 ${isDone ? (s.warn ? 'text-amber-500 shadow-amber-500' : 'text-emerald-500') : isActive ? 'text-sky-500' : 'text-slate-400'}`}>
                      {isActive ? (
                        <Scan className="h-5 w-5 animate-pulse" />
                      ) : isDone ? (
                        <s.icon className="h-5 w-5" />
                      ) : (
                        <div className="h-5 w-5 rounded-sm border border-slate-300"></div>
                      )}
                    </div>
                    <div>
                      <h4 className={`text-sm tracking-wide ${isActive ? 'text-sky-600 font-bold' : isDone ? 'text-slate-800' : 'text-slate-500'}`}>
                        {s.label}
                      </h4>
                      {isDone && (
                        <p className={`text-[10px] mt-1 tracking-widest uppercase ${s.warn ? 'text-amber-500' : 'text-emerald-500'}`}>
                          &gt; {s.sub}
                        </p>
                      )}
                      {isActive && (
                        <p className="text-[10px] mt-1 tracking-widest text-sky-600 uppercase animate-pulse">
                          &gt; PROCESSING...
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-200">
            <div className="flex justify-between text-xs mb-2 font-bold text-sky-600 uppercase tracking-widest">
              <span>System Initialization</span>
              <span>{Math.floor((step / steps.length) * 100)}%</span>
            </div>
            <div className="w-full h-1 bg-slate-100 overflow-hidden">
              <div 
                className="h-full bg-sky-500 transition-all duration-300 ease-out"
                style={{ width: `${(step / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
