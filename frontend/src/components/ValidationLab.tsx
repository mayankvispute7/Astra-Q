import React, { useState } from 'react';
import { Beaker, Play, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { api } from '../api/client';

export const ValidationLab = () => {
  const [results, setResults] = useState<any>(null);
  const [running, setRunning] = useState(false);

  const runScenarios = async () => {
    setRunning(true);
    try {
      const data = await api.getValidationLab();
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  const scenarios = [
    { id: 'C-042', name: 'Hidden Within-Spec Outlier', expected: 'Flagged & Accelerating Drift' },
    { id: 'C-088', name: 'Insufficient Evidence / Intermittent', expected: 'Insufficient Evidence' },
    { id: 'CH-04', name: 'System Event (Shared Ground)', expected: 'System Suspect' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center space-y-4">
        <div className="inline-flex p-4 rounded-full bg-sky-50 text-sky-600 mb-2">
          <Beaker className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Scenario Validation Lab</h2>
        <p className="text-slate-600 max-w-lg mx-auto">
          Test ASTRA-Q's analytical engines against known adversarial reliability scenarios injected into the synthetic telemetry stream.
        </p>
        
        <button 
          onClick={runScenarios}
          disabled={running}
          className="mt-4 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
        >
          {running ? <span className="animate-pulse">RUNNING VALIDATION...</span> : <><Play className="h-4 w-4" /> RUN ALL SCENARIOS</>}
        </button>
      </div>

      {results && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 text-lg">Validation Results</h3>
          <div className="grid gap-4">
            {results.scenarios.map((s: any, idx: number) => {
              const passed = s.detection_status === 'CORRECT';
              const partial = s.detection_status === 'PARTIAL';
              return (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg mt-1 ${passed ? 'bg-emerald-50 text-emerald-600' : partial ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                      {passed ? <CheckCircle2 className="h-5 w-5" /> : partial ? <AlertTriangle className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 font-mono">{s.scenario.replace(/_/g, ' ')}</h4>
                      <div className="text-sm text-slate-500 mt-1 flex flex-col sm:flex-row sm:gap-4">
                        <span>Expected: <span className="font-semibold text-slate-700">{s.expected}</span></span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${passed ? 'bg-emerald-100 text-emerald-700' : partial ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                      {s.detection_status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
