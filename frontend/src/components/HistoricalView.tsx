import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw
} from 'lucide-react';
import { api } from '../api/client';

export const HistoricalView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistorical = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getHistorical();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch historical data. Please execute analysis pipeline first.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorical();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center text-slate-400 space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-cyan-400" />
        <p className="text-sm font-mono">Comparing Current Lot against Historical Baseline Population...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto p-8 border border-rose-800 bg-rose-950/20 rounded-xl text-rose-300 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto" />
        <p className="text-sm">{error || 'No historical comparison data available'}</p>
      </div>
    );
  }

  const { lot_comparisons, population_shift, confidence_adjustment, current_distribution, historical_distribution } = data;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-cyan-400" />
            <span>Population & Historical Shift Analysis Engine</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Detects whole-lot distribution shifts against historical flight qualification lots using Kolmogorov-Smirnov statistical tests.
          </p>
        </div>

        <button onClick={fetchHistorical} className="btn-astra btn-secondary text-xs px-3 py-2">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>RE-TEST HISTORICAL SHIFT</span>
        </button>
      </div>

      {/* Confidence Penalty Alert */}
      {population_shift?.detected ? (
        <div className="p-6 rounded-xl bg-amber-950/40 border-2 border-amber-600 space-y-3 shadow-lg shadow-amber-950/40">
          <div className="flex items-center gap-3 text-amber-300 font-bold text-base">
            <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0 animate-bounce" />
            <span>CONFIDENCE PENALIZED: POPULATION SHIFT DETECTED</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            {confidence_adjustment || 'The overall resistance distribution of current lot (LOT-24A) exhibits a statistically significant shift compared to historical qualified lots.'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs font-mono">
            <div className="p-2.5 bg-black/40 rounded border border-amber-900/60">
              <span className="text-slate-400 block text-[10px]">KS STATISTIC</span>
              <span className="text-amber-400 font-bold">{population_shift.ks_statistic}</span>
            </div>
            <div className="p-2.5 bg-black/40 rounded border border-amber-900/60">
              <span className="text-slate-400 block text-[10px]">KS P-VALUE</span>
              <span className="text-rose-400 font-bold">{population_shift.ks_p_value} (&lt; 0.01)</span>
            </div>
            <div className="p-2.5 bg-black/40 rounded border border-amber-900/60">
              <span className="text-slate-400 block text-[10px]">SHIFT SEVERITY</span>
              <span className="text-amber-300 font-bold">{population_shift.severity}</span>
            </div>
            <div className="p-2.5 bg-black/40 rounded border border-amber-900/60">
              <span className="text-slate-400 block text-[10px]">MEDIAN DIFF (MAD UNITS)</span>
              <span className="text-cyan-400 font-bold">{population_shift.overall_median_diff_mad} MAD</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-3 font-mono">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>CURRENT LOT IS POPULATION-CONSISTENT WITH HISTORICAL BASELINE</span>
        </div>
      )}

      {/* Side-by-side Population Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Lot Card */}
        <div className="glass-card p-5 border border-cyan-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
              Current Lot Telemetry (LOT-24A)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              {current_distribution?.n} Screened Units
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 bg-slate-900 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">MEDIAN</span>
              <span className="text-cyan-400 font-bold text-sm">{current_distribution?.median} Ω</span>
            </div>
            <div className="p-3 bg-slate-900 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">MAD</span>
              <span className="text-emerald-400 font-bold text-sm">{current_distribution?.mad} Ω</span>
            </div>
            <div className="p-3 bg-slate-900 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">MEAN ± STD</span>
              <span className="text-slate-200 font-bold text-xs">{current_distribution?.mean} ± {current_distribution?.std}</span>
            </div>
            <div className="p-3 bg-slate-900 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">MIN – MAX</span>
              <span className="text-slate-200 font-bold text-xs">{current_distribution?.min} – {current_distribution?.max}</span>
            </div>
          </div>
        </div>

        {/* Historical Population Baseline Card */}
        <div className="glass-card p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Historical Qualified Baseline (LOT-21, 22, 23)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              {historical_distribution?.n} Total Flight Units
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 bg-slate-900 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">HISTORICAL MEDIAN</span>
              <span className="text-purple-400 font-bold text-sm">{historical_distribution?.median} Ω</span>
            </div>
            <div className="p-3 bg-slate-900 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">HISTORICAL MAD</span>
              <span className="text-purple-300 font-bold text-sm">{historical_distribution?.mad} Ω</span>
            </div>
            <div className="p-3 bg-slate-900 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">MEAN ± STD</span>
              <span className="text-slate-200 font-bold text-xs">{historical_distribution?.mean} ± {historical_distribution?.std}</span>
            </div>
            <div className="p-3 bg-slate-900 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">QUALIFIED LOT COUNT</span>
              <span className="text-slate-200 font-bold text-xs">3 Historical Lots</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lot-by-Lot Comparison Table */}
      <div className="glass-card overflow-hidden border border-slate-800 space-y-3 p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
          Pairwise Lot Comparison Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="astra-table">
            <thead>
              <tr>
                <th>Historical Lot ID</th>
                <th>Historical Median</th>
                <th>Current Median</th>
                <th>Median Diff (MAD)</th>
                <th>KS Statistic</th>
                <th>KS p-value</th>
                <th>Shift Status</th>
              </tr>
            </thead>
            <tbody>
              {lot_comparisons && lot_comparisons.map((lot: any) => (
                <tr key={lot.lot_id} className="font-mono text-xs hover:bg-slate-800/40">
                  <td className="font-bold text-purple-400">{lot.lot_id}</td>
                  <td className="text-white">{lot.historical_median} Ω</td>
                  <td className="text-cyan-400">{lot.current_median} Ω</td>
                  <td className="text-amber-300">+{lot.median_diff_in_mad} MAD</td>
                  <td className="text-slate-300">{lot.ks_statistic}</td>
                  <td className="text-slate-300">{lot.ks_p_value}</td>
                  <td>
                    {lot.significant_shift ? (
                      <span className="badge badge-investigate">SHIFT DETECTED</span>
                    ) : (
                      <span className="badge badge-pass">CONSISTENT</span>
                    )}
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
