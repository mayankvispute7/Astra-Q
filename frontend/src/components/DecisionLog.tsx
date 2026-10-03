import React, { useState, useEffect } from 'react';
import { FileText, Calendar, User, Search } from 'lucide-react';
import { api } from '../api/client';

export const DecisionLog = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    api.getDecisions().then((res) => {
      setLogs(res.decisions.reverse()); // latest first
    }).catch(console.error);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Decision Audit Log</h2>
          <p className="text-sm text-slate-500 mt-1">Immutable record of all engineering dispositions.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">
            No decisions recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="p-5 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-lg font-bold text-sky-700">{log.component_id}</div>
                    <div className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                      log.decision === 'ACCEPT' ? 'bg-emerald-100 text-emerald-700' :
                      log.decision === 'REJECT' ? 'bg-rose-100 text-rose-700' :
                      log.decision === 'HOLD' ? 'bg-amber-100 text-amber-700' :
                      log.decision === 'RETEST' ? 'bg-sky-100 text-sky-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {log.decision}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {log.engineer}</div>
                    <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(log.timestamp).toLocaleString()}</div>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg text-sm text-slate-700 leading-relaxed">
                  <strong className="text-slate-900 mr-2">Rationale:</strong> 
                  {log.rationale || 'No rationale provided.'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
