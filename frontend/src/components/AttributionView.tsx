import { useState, useEffect } from 'react';
import { 
  Layers, 
  AlertTriangle, 
  Cpu, 
  RefreshCw
} from 'lucide-react';
import { api } from '../api/client';

export const AttributionView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttribution = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAttribution();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch attribution data. Please execute analysis pipeline first.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttribution();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center text-slate-400 space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-cyan-400" />
        <p className="text-sm font-mono">Running Board & Channel Pattern Attribution Analysis...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto p-8 border border-rose-800 bg-rose-950/20 rounded-xl text-rose-300 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto" />
        <p className="text-sm">{error || 'No attribution data available'}</p>
      </div>
    );
  }

  const { component_attributions, board_summary, common_mode_patterns } = data;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Layers className="h-7 w-7 text-amber-400" />
            <span>System vs Component Pattern Attribution Engine</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Isolates component intrinsic degradation from board-level common-mode power/thermal noise or channel cross-coupling.
          </p>
        </div>

        <button onClick={fetchAttribution} className="btn-astra btn-secondary text-xs px-3 py-2">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>RE-EVALUATE ATTRIBUTION</span>
        </button>
      </div>

      {/* Common-Mode Alert Banner */}
      {common_mode_patterns && common_mode_patterns.length > 0 && (
        <div className="p-5 rounded-xl bg-amber-950/40 border border-amber-800/60 space-y-3">
          <div className="flex items-center gap-3 text-amber-300 font-bold text-sm">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <span>DETECTED {common_mode_patterns.length} COMMON-MODE SYSTEM PATTERN(S)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {common_mode_patterns.map((pat: any, idx: number) => (
              <div key={idx} className="p-3 bg-black/40 border border-amber-900/50 rounded-lg text-xs space-y-1 font-mono">
                <div className="flex justify-between text-amber-400 font-bold">
                  <span>{pat.type || 'SYSTEM NOISE PATTERN'}</span>
                  <span>{pat.location}</span>
                </div>
                <p className="text-slate-300 text-[11px] font-sans">{pat.description || pat.message}</p>
                <div className="text-[10px] text-amber-500 pt-1">
                  Affects {pat.affected_count || pat.affected_components?.length || 'multiple'} components simultaneously
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Board-Level Heatmap / Distribution Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
          <Cpu className="h-4 w-4 text-cyan-400" />
          <span>Board-Level Anomaly Distribution Matrix (8 Boards)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {board_summary && Object.entries(board_summary).map(([boardId, bData]: [string, any]) => (
            <div
              key={boardId}
              className={`glass-card p-4 border space-y-3 font-mono text-xs ${
                bData.system_suspect > 2
                  ? 'border-amber-500/50 bg-amber-950/20'
                  : bData.outliers > 0
                  ? 'border-rose-500/30 bg-rose-950/10'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-sm">{boardId}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {bData.total} Units
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">System Suspect:</span>
                  <span className={bData.system_suspect > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                    {bData.system_suspect}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Lot Outliers:</span>
                  <span className={bData.outliers > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                    {bData.outliers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pass Rate:</span>
                  <span className="text-emerald-400 font-bold">{bData.pass_rate}%</span>
                </div>
              </div>

              {bData.common_mode && (
                <div className="text-[10px] text-amber-400 bg-amber-950/60 p-1.5 rounded border border-amber-800">
                  ⚠️ Common-mode board event
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Component Attributions List Table */}
      <div className="glass-card overflow-hidden border border-slate-800 space-y-3 p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
          Detailed Component Attribution Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="astra-table">
            <thead>
              <tr>
                <th>Component ID</th>
                <th>Board / Channel</th>
                <th>Attribution Label</th>
                <th>Confidence</th>
                <th>Primary Evidence</th>
              </tr>
            </thead>
            <tbody>
              {component_attributions && Object.entries(component_attributions).map(([compId, attr]: [string, any]) => (
                <tr key={compId} className="font-mono text-xs hover:bg-slate-800/40">
                  <td className="font-bold text-cyan-400">{compId}</td>
                  <td className="text-slate-300">{attr.board_id} / {attr.channel_id}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      attr.attribution === 'SYSTEM_CONSISTENT'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : attr.attribution === 'COMPONENT_CONSISTENT'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : attr.attribution === 'INSUFFICIENT_EVIDENCE'
                        ? 'bg-purple-950 text-purple-400 border border-purple-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {attr.attribution}
                    </span>
                  </td>
                  <td className="text-slate-300">{attr.confidence}</td>
                  <td className="text-slate-400 text-[11px] font-sans">
                    {attr.evidence_sources?.[0] || 'Nominal behavior'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
