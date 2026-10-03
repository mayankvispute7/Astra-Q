import React from 'react';
import { Users, ActivitySquare, AlertCircle, ArrowRight, Activity, Server, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';

export const TestRunOverview = ({ analysisData, onNavigateToComponents }: any) => {
  if (!analysisData) return null;

  const summary = analysisData.summary;

  // Mock normal distribution for population health visual
  const distributionData = Array.from({ length: 40 }, (_, i) => {
    const x = 9.5 + i * 0.05;
    const normal = Math.exp(-Math.pow(x - 10.47, 2) / 0.1) * 100;
    const isAnomalous = x > 11.2;
    return { 
      resistance: x.toFixed(2), 
      count: normal, 
      anomaly: isAnomalous ? (normal + Math.random() * 5) : 0 
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">LOT 24A — Reliability Screening</h2>
          <p className="text-slate-500 text-sm mt-1">168-hour accelerated burn-in analysis completed.</p>
        </div>
        <button 
          onClick={onNavigateToComponents}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm shadow-sky-200 transition-colors"
        >
          Explore Components
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Components</h3>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{summary.total_components}</div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Measurements</h3>
            <ActivitySquare className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900">4,035</div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-rose-500 uppercase tracking-wider">Flagged</h3>
            <AlertCircle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-3xl font-bold text-rose-600">{summary.investigate}</div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider">System Events</h3>
            <Server className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-600">{summary.system_suspect}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Population Health */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Population Health Distribution</h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium">End of Test (168h)</span>
          </div>
          <div className="p-5 flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={distributionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAnomaly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="resistance" 
                  tick={{fontSize: 12, fill: '#64748b'}} 
                  axisLine={false} 
                  tickLine={false} 
                  tickMargin={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                />
                <ReferenceLine x="11.2" stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Screening Boundary', fill: '#ef4444', fontSize: 10 }} />
                <Area type="monotone" dataKey="count" name="Normal Population" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                <Area type="monotone" dataKey="anomaly" name="Suspicious Tail" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorAnomaly)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Findings */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Key Findings</h3>
          </div>
          <div className="p-5 space-y-4 flex-1">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2"></div>
              <div>
                <p className="text-sm font-medium text-slate-900">{summary.investigate} components show unusual lot-relative behavior.</p>
                <p className="text-xs text-slate-500 mt-0.5">Component-level anomalies detected.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2"></div>
              <div>
                <p className="text-sm font-medium text-slate-900">System/Channel event detected.</p>
                <p className="text-xs text-slate-500 mt-0.5">{summary.system_suspect} components affected across shared channels.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-2"></div>
              <div>
                <p className="text-sm font-medium text-slate-900">Accelerating drift observed.</p>
                <p className="text-xs text-slate-500 mt-0.5">C-042 identified with elevated risk forecast.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2"></div>
              <div>
                <p className="text-sm font-medium text-slate-900">Historical population shift: {summary.population_shift ? 'DETECTED' : 'NOT DETECTED'}.</p>
                <p className="text-xs text-slate-500 mt-0.5">Compared against LOT-21, LOT-22, LOT-23.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Timeline */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <h3 className="font-semibold text-slate-900 mb-6">Test Execution Timeline</h3>
        <div className="relative pb-8 pt-2">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 mt-[-10px]"></div>
          <div className="relative flex justify-between">
            {[
              { time: '0h', label: 'Test Start', color: 'bg-sky-500' },
              { time: '24h', color: 'bg-slate-300' },
              { time: '96h', label: 'System Event', color: 'bg-amber-400' },
              { time: '120h', color: 'bg-slate-300' },
              { time: '168h', label: 'Test Complete', color: 'bg-emerald-500' },
            ].map((node, i) => (
              <motion.div 
                key={i} 
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
              >
                <div className={`w-4 h-4 rounded-full ${node.color} border-4 border-white shadow-sm z-10`}></div>
                <span className="text-xs font-bold text-slate-700">{node.time}</span>
                {node.label && (
                  <span className="text-[10px] text-slate-500 absolute top-10 whitespace-nowrap">{node.label}</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
    </div>
  );
};
