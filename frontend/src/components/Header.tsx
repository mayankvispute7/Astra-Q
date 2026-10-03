import React from 'react';
import { Activity, LayoutDashboard, Cpu, Search, Network, Beaker, FileText } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isBackendConnected: boolean;
  hasRunAnalysis: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, isBackendConnected, hasRunAnalysis }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, reqData: true },
    { id: 'components', label: 'Components', icon: Cpu, reqData: true },
    { id: 'investigation', label: 'Investigation', icon: Search, reqData: true },
    { id: 'analytics', label: 'Analytics', icon: Network, reqData: true },
    { id: 'lab', label: 'Validation Lab', icon: Beaker, reqData: true },
    { id: 'decisions', label: 'Audit Log', icon: FileText, reqData: false },
  ];

  const isDark = activeTab === 'landing' || activeTab === 'validation';

  return (
    <header className={`sticky top-0 z-50 transition-colors duration-300 ${isDark ? 'bg-slate-950/80 border-b border-sky-900/50 backdrop-blur-md' : 'bg-white border-b border-slate-200'}`}>
      <div className="max-w-[1500px] mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo Section */}
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setActiveTab('landing')}
        >
          <div className={`p-2 rounded border transition-colors ${isDark ? 'bg-sky-900/30 border-sky-800 text-sky-400 group-hover:bg-sky-900/50' : 'bg-sky-50 border-sky-100 text-sky-700 group-hover:bg-sky-100'}`}>
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <h1 className={`text-lg font-bold leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>ASTRA-Q</h1>
              <span className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? 'text-sky-500/70 font-mono' : 'text-slate-400'}`}>SIH 26170</span>
            </div>
            <span className={`text-[11px] tracking-wide mt-0.5 ${isDark ? 'text-slate-400 font-mono' : 'text-slate-500 font-medium'}`}>Reliability Screening & Investigation</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={tab.reqData && !hasRunAnalysis}
              className={`
                flex items-center gap-2 px-3 py-2 rounded text-sm transition-all
                ${activeTab === tab.id 
                  ? (isDark ? 'bg-sky-900/30 text-sky-400 border border-sky-800 font-mono font-bold uppercase tracking-wide text-xs shadow-[0_0_10px_rgba(14,165,233,0.2)]' : 'bg-slate-50 text-sky-700 shadow-sm border border-slate-200 font-medium') 
                  : (isDark ? 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent font-mono uppercase tracking-wide text-xs' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent font-medium')}
                ${tab.reqData && !hasRunAnalysis ? 'opacity-40 cursor-not-allowed' : ''}
              `}
            >
              <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? (isDark ? 'text-sky-400' : 'text-sky-600') : 'text-slate-400'}`} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right Status */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-3 px-3 py-1.5 rounded border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                {isBackendConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isBackendConnected ? 'bg-emerald-500' : 'bg-rose-500'} ${isDark && isBackendConnected ? 'shadow-[0_0_8px_rgba(16,185,129,0.8)]' : ''}`}></span>
              </span>
              <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>System Ready</span>
            </div>
            <div className={`w-px h-3 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
            <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${isDark ? (hasRunAnalysis ? 'text-sky-400' : 'text-slate-500') : 'text-slate-800 tech-value'}`}>
              {hasRunAnalysis ? 'LOT-A17' : 'NO ACTIVE RUN'}
            </span>
          </div>
        </div>
        
      </div>
    </header>
  );
};
