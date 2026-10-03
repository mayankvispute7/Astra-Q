import { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  AlertCircle, 
  ChevronRight,
  RefreshCw,
  Filter
} from 'lucide-react';
import { api } from '../api/client';
import type { ComponentItem } from '../api/client';

interface ComponentMatrixProps {
  onSelectComponent: (componentId: string) => void;
}

export const ComponentMatrix: React.FC<ComponentMatrixProps> = ({ onSelectComponent }) => {
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [lotBaseline, setLotBaseline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<keyof ComponentItem>('robust_z');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchComponents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getComponents();
      setComponents(data.components);
      setLotBaseline(data.lot_baseline);
    } catch (err: any) {
      setError(err.message || 'Failed to load components. Ensure pipeline has been executed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  const handleSort = (field: keyof ComponentItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredComponents = components.filter((comp) => {
    if (activeFilter === 'INVESTIGATE' && comp.overall_status !== 'INVESTIGATE') return false;
    if (activeFilter === 'SYSTEM_SUSPECT' && comp.overall_status !== 'SYSTEM_SUSPECT') return false;
    if (activeFilter === 'INSUFFICIENT' && comp.overall_status !== 'INSUFFICIENT_EVIDENCE') return false;
    if (activeFilter === 'NORMAL' && comp.overall_status !== 'NORMAL') return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        comp.component_id.toLowerCase().includes(term) ||
        comp.board_id.toLowerCase().includes(term) ||
        comp.channel_id.toLowerCase().includes(term) ||
        comp.drift_class.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const sortedComponents = [...filteredComponents].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (valA === null) return 1;
    if (valB === null) return -1;
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
    return sortOrder === 'asc'
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  const counts = {
    ALL: components.length,
    INVESTIGATE: components.filter((c) => c.overall_status === 'INVESTIGATE').length,
    SYSTEM_SUSPECT: components.filter((c) => c.overall_status === 'SYSTEM_SUSPECT').length,
    INSUFFICIENT: components.filter((c) => c.overall_status === 'INSUFFICIENT_EVIDENCE').length,
    NORMAL: components.filter((c) => c.overall_status === 'NORMAL').length,
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Component Screening Matrix</h2>
          <p className="text-sm text-slate-500 mt-1">
            Lot-relative robust statistics & screening classifications for LOT-24A.
          </p>
        </div>
        <button
          onClick={fetchComponents}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className="h-4 w-4 text-slate-400" />
          Refresh Data
        </button>
      </div>

      {lotBaseline && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lot Median</span>
            <span className="text-xl font-bold text-slate-900 mt-2 font-mono">{lotBaseline.lot_median} Ω</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lot MAD</span>
            <span className="text-xl font-bold text-slate-900 mt-2 font-mono">± {lotBaseline.lot_mad} Ω</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Screening Bounds</span>
            <span className="text-lg font-bold text-rose-600 mt-2 font-mono">{lotBaseline.screening_boundary_low} – {lotBaseline.screening_boundary_high} Ω</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Spec Limits</span>
            <span className="text-lg font-bold text-slate-700 mt-2 font-mono">{lotBaseline.spec_low} – {lotBaseline.spec_high} Ω</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Robust Std Dev</span>
            <span className="text-xl font-bold text-slate-900 mt-2 font-mono">{lotBaseline.lot_robust_std} Ω</span>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <Filter className="h-4 w-4 text-slate-400 mr-2" />
            {[
              { id: 'ALL', label: 'All Units', count: counts.ALL, activeClass: 'bg-slate-800 text-white border-slate-800' },
              { id: 'INVESTIGATE', label: 'Investigate', count: counts.INVESTIGATE, activeClass: 'bg-rose-100 text-rose-700 border-rose-200' },
              { id: 'SYSTEM_SUSPECT', label: 'System Suspect', count: counts.SYSTEM_SUSPECT, activeClass: 'bg-amber-100 text-amber-700 border-amber-200' },
              { id: 'INSUFFICIENT', label: 'Insufficient Evidence', count: counts.INSUFFICIENT, activeClass: 'bg-purple-100 text-purple-700 border-purple-200' },
              { id: 'NORMAL', label: 'Normal', count: counts.NORMAL, activeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 border transition-all whitespace-nowrap ${
                  activeFilter === tab.id
                    ? tab.activeClass
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${activeFilter === tab.id ? 'bg-black/10' : 'bg-slate-100'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search component, board..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-sky-500" />
            <p className="text-sm">Loading Component Matrix...</p>
          </div>
        ) : error ? (
          <div className="p-8 border-b border-rose-100 bg-rose-50 text-rose-700 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('component_id')}>
                    <div className="flex items-center gap-1">Component ID <ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('board_id')}>
                    <div className="flex items-center gap-1">Location <ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('current_value')}>
                    <div className="flex items-center gap-1">Value (Ω) <ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('robust_z')}>
                    <div className="flex items-center gap-1">Robust Z <ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('drift_class')}>
                    <div className="flex items-center gap-1">Drift <ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('attribution')}>
                    <div className="flex items-center gap-1">Pattern <ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedComponents.map((comp) => (
                  <tr key={comp.component_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm font-bold text-sky-700">{comp.component_id}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{comp.board_id} / {comp.channel_id}</td>
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-900">{comp.current_value.toFixed(4)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold font-mono ${
                        Math.abs(comp.robust_z) > 3.5 ? 'bg-rose-100 text-rose-700' :
                        Math.abs(comp.robust_z) > 2.0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {comp.robust_z > 0 ? `+${comp.robust_z.toFixed(2)}` : comp.robust_z.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${
                        comp.drift_class === 'STABLE' ? 'text-slate-500' :
                        comp.drift_class === 'ACCELERATING_DRIFT' ? 'text-rose-600 font-bold' : 'text-amber-600'
                      }`}>
                        {comp.drift_class}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${
                        comp.attribution === 'SYSTEM_CONSISTENT' ? 'text-amber-600' :
                        comp.attribution === 'COMPONENT_CONSISTENT' ? 'text-rose-600' :
                        comp.attribution === 'INSUFFICIENT_EVIDENCE' ? 'text-purple-600' : 'text-slate-500'
                      }`}>
                        {comp.attribution}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {comp.overall_status === 'INVESTIGATE' && <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700">INVESTIGATE</span>}
                      {comp.overall_status === 'SYSTEM_SUSPECT' && <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">SYSTEM</span>}
                      {comp.overall_status === 'INSUFFICIENT_EVIDENCE' && <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">INSUFFICIENT</span>}
                      {comp.overall_status === 'NORMAL' && <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">NORMAL</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onSelectComponent(comp.component_id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-sky-600 hover:bg-sky-50 hover:border-sky-200 rounded-md text-xs font-semibold transition-colors"
                      >
                        Deep-Dive <ChevronRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
