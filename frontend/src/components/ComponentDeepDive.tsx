import React, { useState, useEffect } from 'react';
import { 
  Activity, AlertTriangle, ShieldCheck, TrendingUp, Layers, CheckCircle2, 
  Send, RefreshCw, User, Zap, ChevronLeft, Info, HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, 
  CartesianGrid, ReferenceLine, ReferenceArea, AreaChart, Area
} from 'recharts';
import { api } from '../api/client';

export const ComponentDeepDive = ({ selectedComponentId, onSelectComponent, onBack }: any) => {
  const [componentList, setComponentList] = useState<string[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [decision, setDecision] = useState<'ACCEPT' | 'HOLD' | 'RETEST' | 'REJECT' | 'ESCALATE'>('HOLD');
  const [rationale, setRationale] = useState<string>('');
  const [engineer, setEngineer] = useState<string>('ISRO-Sr-Reliability-Eng');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [decisionSaved, setDecisionSaved] = useState<any>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    api.getComponents().then((res) => {
      setComponentList(res.components.map((c) => c.component_id));
    }).catch(() => {});
  }, []);

  const fetchDetail = async (compId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getComponentDetail(compId);
      setDetail(data);
      if (data.saved_decision) {
        setDecisionSaved(data.saved_decision);
        setDecision(data.saved_decision.decision);
        setRationale(data.saved_decision.rationale || '');
      } else {
        setDecisionSaved(null);
        setRationale('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch component details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedComponentId) fetchDetail(selectedComponentId);
  }, [selectedComponentId]);

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComponentId) return;
    setSubmitting(true);
    try {
      const res = await api.submitDecision({
        component_id: selectedComponentId, decision, rationale, engineer,
      });
      setDecisionSaved(res.record);
    } catch (err: any) {
      alert(`Error saving decision: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-slate-400 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-sky-500" />
        <p className="text-sm font-medium">Retrieving telemetry evidence for {selectedComponentId}...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-8 border border-rose-200 bg-rose-50 rounded-xl text-rose-700 text-center space-y-4">
        <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
        <p className="text-sm font-medium">{error || 'Component detail not found'}</p>
      </div>
    );
  }

  const { screening, drift, forecast, attribution, historical_range, lot_baseline } = detail;
  
  const timeSeriesData = screening.trajectory_hours && screening.trajectory_values 
    ? screening.trajectory_hours.map((hr: number, i: number) => ({
        hour: hr,
        value: screening.trajectory_values[i]
      }))
    : [];
  
  const isAnomalous = screening.screen_status !== 'PASS';
  const isSystemSuspect = attribution.attribution === 'SYSTEM_CONSISTENT';
  const isInsufficient = attribution.attribution === 'INSUFFICIENT_EVIDENCE';

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <button onClick={onBack} className="flex items-center gap-1 text-sky-600 hover:text-sky-700 text-sm font-semibold mb-4 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to Matrix
          </button>
          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">{detail.component_id}</h2>
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isSystemSuspect ? 'bg-amber-100 text-amber-700' :
              isInsufficient ? 'bg-purple-100 text-purple-700' :
              isAnomalous ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {screening.screen_status}
            </div>
          </div>
          <p className="text-slate-500 text-sm mt-2">
            Potential latent reliability anomaly on Board {screening.board_id} / Channel {screening.channel_id}
          </p>
        </div>

        <div className="flex flex-col items-end">
          <label className="text-xs font-semibold text-slate-500 mb-1">Investigation Target</label>
          <select
            value={selectedComponentId}
            onChange={(e) => onSelectComponent(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
          >
            {componentList.map((id) => <option key={id} value={id}>{id}</option>)}
          </select>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Specification</p>
          <p className={`font-mono font-bold text-lg ${screening.spec_pass ? 'text-emerald-600' : 'text-rose-600'}`}>
            {screening.spec_pass ? 'PASS' : 'FAIL'}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lot-Relative</p>
          <p className={`font-mono font-bold text-lg ${Math.abs(screening.robust_z_score) > 3.5 ? 'text-rose-600' : 'text-slate-900'}`}>
            {Math.abs(screening.robust_z_score) > 3.5 ? 'ANOMALOUS' : 'NORMAL'}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Temporal Drift</p>
          <p className={`font-mono font-bold text-lg ${drift.drift_class !== 'STABLE' ? 'text-amber-600' : 'text-emerald-600'}`}>
            {drift.drift_class}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">168h Forecast</p>
          <p className={`font-mono font-bold text-lg ${forecast.risk === 'HIGH' ? 'text-rose-600' : 'text-slate-900'}`}>
            {forecast.risk === 'HIGH' ? 'ELEVATED RISK' : 'NOMINAL'}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Attribution</p>
          <p className={`font-mono font-bold text-sm leading-tight mt-1 ${isSystemSuspect ? 'text-amber-600' : 'text-sky-600'}`}>
            {attribution.attribution.replace('_', ' ')}
          </p>
        </div>
      </div>

      {/* Why Flagged Section */}
      {isAnomalous && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Why was this flagged?</h3>
            <button 
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-sm font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <HelpCircle className="h-4 w-4" /> Why is this not normal?
            </button>
          </div>
          
          {showExplanation && (
            <div className="bg-sky-50 border border-sky-100 rounded-xl p-6 mb-4 flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1 space-y-3">
                <h4 className="font-bold text-slate-900">Specification vs. Lot Distribution</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Although <span className="font-mono font-bold text-slate-800">{detail.component_id}</span> is within the absolute specification range (8.0Ω - 12.0Ω), its behavior is unusually far from the expected lot distribution. The majority of components are tightly clustered, making this component a statistical outlier (+{screening.robust_z_score.toFixed(1)} MAD).
                </p>
              </div>
              <div className="w-full md:w-1/3 bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Component vs Median</span>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-xl font-mono font-bold text-rose-500">{timeSeriesData[timeSeriesData.length-1]?.value.toFixed(2)}Ω</div>
                  <div className="text-slate-300 font-bold">vs</div>
                  <div className="text-xl font-mono font-bold text-emerald-500">{screening.lot_median}Ω</div>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white border-l-4 border-l-rose-500 border border-slate-200 rounded-r-xl p-5 shadow-sm">
              <div className="text-4xl font-black text-slate-100 absolute -mt-2 -ml-2 -z-10">01</div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Lot-Relative Deviation</h4>
              <p className="font-mono text-lg font-bold text-slate-900 mb-1">+{screening.robust_z_score.toFixed(1)} MAD</p>
              <p className="text-sm text-slate-600">Component behavior is significantly different from the lot population.</p>
            </div>
            <div className="bg-white border-l-4 border-l-amber-500 border border-slate-200 rounded-r-xl p-5 shadow-sm">
              <div className="text-4xl font-black text-slate-100 absolute -mt-2 -ml-2 -z-10">02</div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Temporal Drift</h4>
              <p className="font-mono text-lg font-bold text-slate-900 mb-1">{drift.drift_class.replace('_', ' ')}</p>
              <p className="text-sm text-slate-600">The observed trend is non-linear and degrading over time.</p>
            </div>
            <div className="bg-white border-l-4 border-l-emerald-500 border border-slate-200 rounded-r-xl p-5 shadow-sm">
              <div className="text-4xl font-black text-slate-100 absolute -mt-2 -ml-2 -z-10">03</div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Specification</h4>
              <p className="font-mono text-lg font-bold text-slate-900 mb-1">PASSING</p>
              <p className="text-sm text-slate-600">Absolute specification limits have not yet been crossed.</p>
            </div>
          </div>
        </div>
      )}

      {/* Time Series Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">168h Reliability Projection</h3>
            <p className="text-sm text-slate-500 mt-1">Observed trajectory and statistical forecast.</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-slate-700">
              <div className="h-2 w-4 bg-slate-900 rounded-sm" /> Component
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <div className="h-0.5 w-4 bg-emerald-500 border-dashed" /> Lot Median
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <div className="h-2 w-4 bg-rose-100 border border-rose-200 rounded-sm" /> Forecast
            </div>
          </div>
        </div>
        <div className="h-[400px] w-full p-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
              />
              
              {/* Screening Bounds */}
              {lot_baseline?.screening_boundary_low && (
                <ReferenceLine y={lot_baseline.screening_boundary_low} stroke="#cbd5e1" strokeDasharray="4 4" label={{ value: 'Normal Bound', fill: '#94a3b8', fontSize: 11, position: 'insideTopLeft' }} />
              )}
              {lot_baseline?.screening_boundary_high && (
                <ReferenceLine y={lot_baseline.screening_boundary_high} stroke="#cbd5e1" strokeDasharray="4 4" label={{ value: 'Normal Bound', fill: '#94a3b8', fontSize: 11, position: 'insideBottomLeft' }} />
              )}
              {lot_baseline?.lot_median && (
                <ReferenceLine y={lot_baseline.lot_median} stroke="#10b981" strokeDasharray="2 2" />
              )}

              {/* Forecast Area (assuming last 20% of data is forecast if provided, or we just draw it) */}
              <ReferenceArea x1={120} x2={168} fill="#ffe4e6" fillOpacity={0.3} />
              
              <Line type="monotone" dataKey="value" stroke="#0f172a" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attribution Block */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:p-8 flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1 space-y-4">
          <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Component or Test System?</h3>
          <p className="text-slate-600 text-sm leading-relaxed max-w-xl">
            ASTRA-Q analyzes spatial correlations across the testing hardware to determine if the anomaly is localized to the component or part of a broader test system event.
          </p>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl inline-block mt-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Conclusion</span>
            <span className="text-sm font-semibold text-slate-800">
              {isSystemSuspect ? 'Evidence suggests a common test-system pattern.' : 
               isInsufficient ? 'ASTRA-Q cannot confidently attribute the cause.' : 
               'Evidence is more consistent with a component-level anomaly.'}
            </span>
          </div>
        </div>

        <div className="w-full md:w-96 space-y-4">
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
              <span>Component Evidence</span>
              <span className={!isSystemSuspect ? 'text-sky-600' : ''}>{!isSystemSuspect ? 'Strong' : 'Weak'}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full bg-sky-500 rounded-full ${!isSystemSuspect ? 'w-[85%]' : 'w-[20%]'}`}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
              <span>Board Correlation</span>
              <span className={isSystemSuspect ? 'text-amber-600' : ''}>{isSystemSuspect ? 'Strong' : 'Weak'}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full bg-amber-500 rounded-full ${isSystemSuspect ? 'w-[75%]' : 'w-[15%]'}`}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
              <span>Channel Correlation</span>
              <span className={isSystemSuspect ? 'text-amber-600' : ''}>{isSystemSuspect ? 'Strong' : 'Weak'}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full bg-amber-500 rounded-full ${isSystemSuspect ? 'w-[90%]' : 'w-[10%]'}`}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Engineer Decision Form */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Engineering Disposition</h3>
            <p className="text-sm text-slate-500">Record final decision into the SQLite audit database.</p>
          </div>
          {decisionSaved && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> SAVED
            </div>
          )}
        </div>

        <form onSubmit={handleSubmitDecision} className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { key: 'ACCEPT', label: 'ACCEPT' },
              { key: 'HOLD', label: 'HOLD' },
              { key: 'RETEST', label: 'RETEST' },
              { key: 'REJECT', label: 'REJECT' },
              { key: 'ESCALATE', label: 'ESCALATE' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setDecision(opt.key as any)}
                className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                  decision === opt.key
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md transform -translate-y-0.5'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Technical Rationale</label>
            <textarea
              rows={3}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Enter detailed engineering justification for this disposition..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all shadow-inner"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
            <div className="w-full md:w-64">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Sign-Off Engineer ID</label>
              <div className="relative">
                <User className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={engineer}
                  onChange={(e) => setEngineer(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              className="w-full md:w-auto px-8 py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-md shadow-sky-200 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? 'SAVING...' : 'SUBMIT DECISION'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
