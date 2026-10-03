import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Landing } from './components/Landing';
import { ValidationProgress } from './components/ValidationProgress';
import { TestRunOverview } from './components/TestRunOverview';
import { ComponentMatrix } from './components/ComponentMatrix';
import { ComponentDeepDive } from './components/ComponentDeepDive';
import { AnalyticsView } from './components/AnalyticsView';
import { ValidationLab } from './components/ValidationLab';
import { DecisionLog } from './components/DecisionLog';
import { api } from './api/client';
import type { RunAnalysisResponse } from './api/client';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [analysisData, setAnalysisData] = useState<RunAnalysisResponse | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  useEffect(() => {
    // Check backend connection
    const checkBackend = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/docs');
        setIsBackendConnected(res.ok);
      } catch {
        setIsBackendConnected(false);
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStartAnalysis = async () => {
    setActiveTab('validation');
    try {
      const response = await api.runAnalysis();
      setAnalysisData(response);
      // Let the validation progress handle the transition to 'overview'
    } catch (error) {
      console.error("Failed to run analysis", error);
      setActiveTab('landing'); // revert on error
    }
  };

  const handleSelectComponent = (compId: string) => {
    setSelectedComponentId(compId);
    setActiveTab('investigation');
  };

  const isDark = false;

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-sky-500/30 bg-slate-50 text-slate-900 selection:bg-sky-200`}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isBackendConnected={isBackendConnected}
        hasRunAnalysis={!!analysisData}
      />

      <main className={`flex-1 w-full mx-auto relative flex flex-col ${activeTab === 'landing' || activeTab === 'validation' ? '' : 'max-w-7xl p-4 md:p-6 md:px-8'}`}>
        {activeTab === 'landing' && (
          <Landing onStart={handleStartAnalysis} onViewLogs={() => setActiveTab('decisions')} />
        )}

        {activeTab === 'validation' && (
          <ValidationProgress 
            isComplete={!!analysisData} 
            onComplete={() => setActiveTab('overview')} 
          />
        )}

        {activeTab === 'overview' && (
          <TestRunOverview 
            analysisData={analysisData}
            onNavigateToComponents={() => setActiveTab('components')} 
          />
        )}

        {activeTab === 'components' && (
          <ComponentMatrix 
            onSelectComponent={handleSelectComponent} 
          />
        )}

        {activeTab === 'investigation' && (
          <ComponentDeepDive
            selectedComponentId={selectedComponentId || 'C-042'}
            onSelectComponent={handleSelectComponent}
            onBack={() => setActiveTab('components')}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsView />}

        {activeTab === 'lab' && <ValidationLab />}

        {activeTab === 'decisions' && <DecisionLog />}
      </main>

      <footer className={`py-4 px-6 text-center text-xs font-medium border-t bg-white border-slate-200 text-slate-500`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ASTRA-Q — SIH 26170 (AI-Assisted Reliability Screening & Investigation Workstation)</span>
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            {isBackendConnected ? 'ANALYSIS ENGINE ONLINE' : 'ENGINE DISCONNECTED'}
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
