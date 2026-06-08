import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import Spinner from '../components/ui/Spinner';
import { ScrollText, Activity } from 'lucide-react';
import { format } from 'date-fns';

const ACTION_COLORS = {
  USER_REGISTERED: 'bg-blue-100 text-blue-700',
  ASSET_CREATED: 'bg-emerald-100 text-emerald-700',
  ASSET_UPDATED: 'bg-amber-100 text-amber-700',
  BOOKING_REQUESTED: 'bg-violet-100 text-violet-700',
  BOOKING_APPROVED: 'bg-emerald-100 text-emerald-700',
  BOOKING_REJECTED: 'bg-red-100 text-red-700',
  ASSET_ISSUED: 'bg-blue-100 text-blue-700',
  ASSET_RETURNED: 'bg-slate-100 text-slate-700',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.get(`/bookings/audit?page=${page}&limit=30`)
      .then(r => { setLogs(r.data.logs); setTotal(r.data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-slate-500 text-sm mt-1">{total} total events logged</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="divide-y divide-gray-50">
              {logs.map(log => (
                <div key={log.id} className="px-5 py-4 flex items-start gap-4 hover:bg-gray-50">
                  <div className="flex-shrink-0 mt-0.5">
                    <Activity size={16} className="text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      {log.user && <span className="text-sm text-slate-600">{log.user.name}</span>}
                      {log.asset && <span className="text-sm text-slate-400">· {log.asset.name}</span>}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{log.details}</p>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0 font-mono">
                    {format(new Date(log.createdAt), 'MMM d, HH:mm')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {total > 30 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary disabled:opacity-40">Prev</button>
              <span className="text-sm text-slate-500">Page {page} of {Math.ceil(total / 30)}</span>
              <button disabled={page >= Math.ceil(total / 30)} onClick={() => setPage(p => p + 1)} className="btn-secondary disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}