import React from 'react';
import { Activity, Database, Zap, Microchip, Clock, LineChart, Crosshair, HelpCircle, Network, Terminal, Scan } from 'lucide-react';
import { motion } from 'framer-motion';

interface LandingProps {
  onStart: () => void;
  onViewLogs?: () => void;
  isAnalyzing?: boolean;
}

export const Landing: React.FC<LandingProps> = ({ onStart, onViewLogs, isAnalyzing }) => {
  return (
    <div className="w-full pb-20 relative overflow-hidden bg-white min-h-screen text-slate-700 font-sans">
      
      {/* Cool Lab Grid Background */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(14, 165, 233, 0.15) 0%, transparent 70%), linear-gradient(rgba(14, 165, 233, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.05) 1px, transparent 1px)', backgroundSize: '100% 100%, 40px 40px, 40px 40px' }}></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500/20 via-sky-400 to-sky-500/20"></div>

      <div className="max-w-[1450px] mx-auto px-6 lg:px-8 relative z-10">
        
        {/* HERO SECTION */}
        <section className="pt-16 pb-12 md:pt-24 md:pb-20 border-b border-sky-900/30">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column (7) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-8"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded bg-sky-50 border border-sky-100">
                  <Terminal className="w-4 h-4 text-sky-600" />
                  <span className="text-[11px] font-mono font-bold tracking-widest text-sky-700 uppercase">ASTRA-Q / SIH 26170 / LAB TERMINAL</span>
                </div>
                
                <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.15] tracking-tight max-w-[650px]">
                  Turn burn-in telemetry into{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">
                    engineering evidence.
                  </span>
                </h1>
                
                <p className="text-lg text-slate-600 leading-relaxed max-w-[550px]">
                  Robust screening, drift analysis and evidence-based attribution for aerospace burn-in telemetry. Initialize test sequence to detect anomalous behavior.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <button
                  onClick={onStart}
                  disabled={isAnalyzing}
                  className="w-full sm:w-auto px-8 py-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded font-bold shadow-[0_0_20px_rgba(14,165,233,0.4)] hover:shadow-[0_0_30px_rgba(14,165,233,0.6)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 group font-mono uppercase tracking-wider"
                >
                  <Activity className={`h-5 w-5 text-slate-950 ${!isAnalyzing && 'group-hover:animate-pulse'}`} />
                  {isAnalyzing ? 'INITIALIZING...' : 'START ANALYSIS'}
                </button>
                <button onClick={onViewLogs} className="w-full sm:w-auto px-8 py-3.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 rounded font-bold transition-all flex items-center justify-center gap-3 font-mono uppercase tracking-wider">
                  VIEW LOGS
                </button>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 pt-4 text-[10px] font-mono font-bold text-sky-600 uppercase tracking-widest">
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> ENGINES NOMINAL</span>
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> TELEMETRY SYNCED</span>
              </div>
            </motion.div>

            {/* Right Column (5) */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <div className="rounded-lg overflow-hidden border border-slate-200 bg-white relative shadow-xl">
                
                <div className="p-6 relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-sky-600 uppercase">System Monitor</span>
                    <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-600 border border-emerald-200 bg-emerald-50 px-2 py-1 rounded">STANDBY</span>
                  </div>
                  
                  {/* Abstract PCB / Visualization */}
                  <div className="h-[280px] rounded border border-slate-100 bg-slate-50 p-4 flex flex-col justify-between relative overflow-hidden shadow-inner">
                    {/* Traces */}
                    <div className="absolute top-10 left-0 w-full h-[1px] bg-slate-200"></div>
                    <div className="absolute top-20 left-0 w-full h-[1px] bg-slate-200"></div>
                    <div className="absolute top-30 left-0 w-full h-[1px] bg-slate-200"></div>
                    <div className="absolute bottom-20 left-0 w-full h-[1px] bg-slate-300 border-t border-dashed border-slate-200"></div>
                    
                    {/* Data Visualization */}
                    <div className="relative w-full h-full mt-4">
                      {/* Normal Population Band */}
                      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                        <path d="M 0,120 Q 50,115 100,100 T 200,80 T 300,50 L 300,150 L 0,150 Z" fill="rgba(14, 165, 233, 0.05)" />
                        <path d="M 0,120 Q 50,115 100,100 T 200,80 T 300,50" fill="none" stroke="#0EA5E9" strokeWidth="1" strokeDasharray="2 4" strokeOpacity="0.5" />
                        
                        {/* Component Trajectory */}
                        <path d="M 0,130 Q 50,125 100,105 T 180,60 T 220,30" fill="none" stroke="#38BDF8" strokeWidth="2" filter="drop-shadow(0 0 3px rgba(56,189,248,0.8))" />
                        
                        {/* Data Points */}
                        <circle cx="100" cy="105" r="3" fill="#38BDF8" />
                        <circle cx="180" cy="60" r="3" fill="#38BDF8" />
                        <circle cx="220" cy="30" r="4" fill="#F43F5E" className="animate-pulse" filter="drop-shadow(0 0 5px rgba(244,63,94,1))" />
                        
                        {/* Forecast Region */}
                        <path d="M 220,30 L 300,10 L 300,60 L 220,30 Z" fill="rgba(244, 63, 94, 0.1)" />
                        <path d="M 220,30 L 300,10" fill="none" stroke="#F43F5E" strokeWidth="1" strokeDasharray="2 2" strokeOpacity="0.8" />
                        
                      </svg>
                      
                      {/* Labels */}
                      <div className="absolute bottom-6 right-2 text-[10px] font-mono text-slate-500">POPULATION</div>
                      <div className="absolute top-2 right-[10%] text-[10px] font-mono text-rose-600 font-bold bg-white px-1 border border-rose-200 rounded">DRIFT</div>
                      <div className="absolute top-[45%] left-2 text-[10px] font-mono text-sky-600 bg-white px-1 border border-sky-200 rounded">SIGNAL</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                    <span>telemetry</span>
                    <span className="text-sky-500/50">anomaly</span>
                    <span>evidence</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* METRICS SECTION */}
        <section className="mb-16 pt-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[
              { label: "COMPONENTS", val: "100", desc: "Population under screening", icon: Microchip, color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
              { label: "MEASUREMENTS", val: "4,035", desc: "Telemetry observations", icon: Database, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
              { label: "TEST WINDOW", val: "168h", desc: "Burn-in duration", icon: Clock, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { label: "ENGINES", val: "7", desc: "Validation → forecast", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" }
            ].map((metric, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + (i * 0.1) }}
                className="rounded border border-slate-200 bg-white p-5 flex flex-col h-[135px] justify-between relative overflow-hidden group hover:border-sky-300 transition-colors shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded ${metric.bg} ${metric.border}`}>
                    <metric.icon className={`h-4 w-4 ${metric.color}`} />
                  </div>
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{metric.label}</div>
                </div>
                <div>
                  <div className="text-3xl font-mono font-bold text-slate-900 tracking-tight">{metric.val}</div>
                  <div className="text-[11px] font-mono text-slate-500 mt-1">{metric.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* PIPELINE SECTION */}
        <section className="mb-20">
          <div className="mb-8 flex flex-col items-center text-center">
            <h2 className="text-sm font-mono font-bold text-sky-600 tracking-widest uppercase flex items-center gap-2"><Scan className="w-4 h-4" /> Pipeline Architecture</h2>
            <p className="text-slate-500 text-xs font-mono mt-2">FROM RAW TELEMETRY TO EVIDENCE</p>
          </div>
          
          <div className="relative py-4 max-w-5xl mx-auto">
            <div className="absolute top-[50%] left-0 w-full h-[1px] bg-slate-200 hidden lg:block"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 relative z-10">
              {[
                { step: "01", name: "DATA", desc: "RAW TELEMETRY" },
                { step: "02", name: "VALIDATE", desc: "INTEGRITY CHECKS" },
                { step: "03", name: "SCREEN", desc: "ANOMALY DETECT" },
                { step: "04", name: "DRIFT", desc: "TEMPORAL TREND" },
                { step: "05", name: "FORECAST", desc: "PROJECT TO 168H" },
                { step: "06", name: "ATTRIBUTE", desc: "ROOT CAUSE" },
                { step: "07", name: "DECIDE", desc: "DISPOSITION" }
              ].map((stage, i) => (
                <div key={i} className="bg-white p-4 border border-slate-200 group hover:border-sky-300 transition-colors cursor-default relative overflow-hidden h-[100px] flex flex-col justify-center text-center shadow-sm rounded">
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-slate-200 to-transparent group-hover:via-sky-400 transition-colors"></div>
                  <div className="text-[10px] font-mono text-slate-400 mb-1">{stage.step}</div>
                  <div className="font-mono font-bold text-slate-700 text-[10px] tracking-wider uppercase mb-1">{stage.name}</div>
                  <div className="text-[9px] font-mono text-sky-600/70 leading-tight opacity-0 h-0 group-hover:opacity-100 group-hover:h-auto transition-all duration-300 group-hover:mt-1">{stage.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT ASTRA-Q FINDS SECTION */}
        <section className="mb-12">
          <div className="mb-8 border-b border-slate-200 pb-2">
            <h2 className="text-lg font-mono font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2"><Database className="w-5 h-5 text-sky-600" /> System Capabilities</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Hidden Anomaly", icon: Crosshair, desc: "Within specification, but significantly different from its lot.", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
              { title: "System Event", icon: Network, desc: "Multiple components change together on the same test path.", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
              { title: "Future Drift", icon: LineChart, desc: "Early behavior indicates potential degradation toward 168h.", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
              { title: "Evidence Gap", icon: HelpCircle, desc: "Suspicious behavior detected, but evidence is not strong enough.", color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-300" }
            ].map((card, i) => (
              <div key={i} className="bg-white p-6 flex flex-col border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all rounded-lg">
                <div className={`p-2 rounded w-fit mb-4 border ${card.bg} ${card.border}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
                <h3 className="font-mono font-bold text-slate-900 mb-2 text-sm uppercase tracking-wide">{card.title}</h3>
                <p className="text-[13px] text-slate-600 leading-relaxed font-sans">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};
