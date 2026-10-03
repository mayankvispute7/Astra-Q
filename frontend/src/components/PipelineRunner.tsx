import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Terminal, 
  Database, 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  Zap, 
  GitBranch, 
  History,
  ArrowRight
} from 'lucide-react';
import { api } from '../api/client';
import type { RunAnalysisResponse } from '../api/client';

interface PipelineRunnerProps {
  onPipelineComplete: (data: RunAnalysisResponse) => void;
  onNavigateToMatrix: () => void;
  analysisData: RunAnalysisResponse | null;
}

export const PipelineRunner: React.FC<PipelineRunnerProps> = ({
  onPipelineComplete,
  onNavigateToMatrix,
  analysisData,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(-1);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const stageIcons = [
    Database,
    ShieldCheck,
    Activity,
    TrendingUp,
    Zap,
    GitBranch,
    History,
  ];

  const handleRunPipeline = async () => {
    setIsRunning(true);
    setError(null);
    setLogs(['Initiating ASTRA-Q 7-Stage Analysis Pipeline...']);
    setActiveStageIndex(0);

    try {
      const response = await api.runAnalysis();
      
      // Simulate live stage progression animation
      for (let i = 0; i < response.pipeline_stages.length; i++) {
        setActiveStageIndex(i);
        const stage = response.pipeline_stages[i];
        if (stage.log) {
          setLogs((prev) => [...prev, ...stage.log!]);
        }
        await new Promise((r) => setTimeout(r, 250));
      }

      setActiveStageIndex(7); // complete
      onPipelineComplete(response);
    } catch (err: any) {
      setError(err.message || 'Failed to run analysis pipeline');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Hero Banner */}
      <div className="glass-card p-8 relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800">
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
            <Zap className="h-3.5 w-3.5" />
            <span>SIH 2026 BENCHMARK ENGINE</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            AI-Driven Anomaly Detection & Reliability Screening Engine
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Execute the complete 7-stage automated screening pipeline across 100 components and 4,035 telemetry points. ASTRA-Q combines median-absolute-deviation robust screening, non-parametric drift detection, component vs system pattern attribution, and historical distribution tests to prevent premature part rejection and ground-system confusion.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={handleRunPipeline}
              disabled={isRunning}
              className="btn-astra btn-primary px-6 py-3.5 text-sm rounded-xl font-bold tracking-wide shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Activity className="h-5 w-5 animate-spin" />
                  <span>RUNNING 7-STAGE PIPELINE...</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 fill-current" />
                  <span>EXECUTE PIPELINE</span>
                </>
              )}
            </button>

            {analysisData && !isRunning && (
              <button
                onClick={onNavigateToMatrix}
                className="btn-astra btn-secondary px-5 py-3 text-sm rounded-xl"
              >
                <span>INSPECT COMPONENT MATRIX</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 7 Stage Flow Visualizer */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
          <span>7-Stage Pipeline Architecture</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {[
            { title: '1. Load Data', desc: '4035 Records' },
            { title: '2. Validation', desc: 'Range & Dups' },
            { title: '3. Screening', desc: 'Robust Z-score' },
            { title: '4. Drift Engine', desc: 'Theil-Sen & CUSUM' },
            { title: '5. Forecast', desc: '168h Extrap.' },
            { title: '6. Attribution', desc: 'Board vs Comp' },
            { title: '7. Historical', desc: 'KS Shift Test' },
          ].map((stg, idx) => {
            const Icon = stageIcons[idx];
            const stageData = analysisData?.pipeline_stages[idx];
            const isCompleted = analysisData && stageData?.status === 'COMPLETE';
            const isCurrent = isRunning && activeStageIndex === idx;

            return (
              <div
                key={idx}
                className={`glass-card p-4 flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-cyan-500 bg-cyan-950/30 shadow-md shadow-cyan-500/20 scale-[1.02]'
                    : isCompleted
                    ? 'border-emerald-500/40 bg-slate-900/60'
                    : 'border-slate-800 bg-slate-900/30'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${
                      isCurrent ? 'bg-cyan-500/20 text-cyan-400' : isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <Activity className="h-4 w-4 text-cyan-400 animate-spin" />
                    ) : (
                      <Clock className="h-4 w-4 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{stg.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{stg.desc}</p>
                  </div>
                </div>

                {stageData && (
                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{stageData.duration_ms}ms</span>
                    <span className="text-emerald-400 font-semibold">100%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Terminal Log Output + Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Terminal Log */}
        <div className="lg:col-span-2 glass-card p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Pipeline Execution Telemetry Log
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">STDOUT</span>
          </div>

          <div className="h-64 overflow-y-auto bg-black/60 rounded-lg p-4 font-mono text-xs space-y-1 text-slate-300 border border-slate-900">
            {logs.length === 0 ? (
              <span className="text-slate-600 italic">Click "EXECUTE PIPELINE" to trigger analysis...</span>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-cyan-500 font-bold">$</span>
                  <span>{log}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="glass-card p-5 border border-slate-800 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono border-b border-slate-800 pb-3">
            Executive Lot Screening Summary
          </h4>

          {analysisData ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Total Components Screened</span>
                <span className="text-sm font-bold font-mono text-white">{analysisData.summary.total_components}</span>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between">
                <span className="text-xs text-emerald-400 font-medium">Passed (Normal)</span>
                <span className="text-sm font-bold font-mono text-emerald-300">{analysisData.summary.normal}</span>
              </div>

              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 flex items-center justify-between">
                <span className="text-xs text-rose-400 font-medium">Investigate (Component Issue)</span>
                <span className="text-sm font-bold font-mono text-rose-300">{analysisData.summary.investigate}</span>
              </div>

              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/40 flex items-center justify-between">
                <span className="text-xs text-amber-400 font-medium">System Suspect (Board Issue)</span>
                <span className="text-sm font-bold font-mono text-amber-300">{analysisData.summary.system_suspect}</span>
              </div>

              <div className="p-3 rounded-lg bg-purple-950/40 border border-purple-800/40 flex items-center justify-between">
                <span className="text-xs text-purple-400 font-medium">Insufficient Evidence</span>
                <span className="text-sm font-bold font-mono text-purple-300">{analysisData.summary.insufficient_evidence}</span>
              </div>

              {analysisData.summary.population_shift && (
                <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-700/50 text-amber-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Population shift detected across lot. Historical confidence penalized.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-center p-4 text-xs text-slate-500">
              Run pipeline to display executive metrics summary.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
