import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import Spinner from '../components/ui/Spinner';
import StatusBadge from '../components/ui/StatusBadge';
import { History as HistoryIcon, Package } from 'lucide-react';
import { format } from 'date-fns';

export default function History() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/bookings?status=RETURNED&limit=50')
      .then(r => setBookings(r.data.bookings))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Borrowing History</h1>
        <p className="text-slate-500 text-sm mt-1">{bookings.length} completed bookings</p>
      </div>

      {bookings.length === 0 ? (
        <div className="card p-16 text-center text-slate-400">
          <HistoryIcon size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No completed bookings yet</p>
          <p className="text-sm mt-1">Your returned assets will appear here</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Asset', 'User', 'Qty', 'Booked For', 'Returned', 'Status'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package size={13} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{b.asset?.name}</p>
                        <p className="text-xs text-slate-400">{b.asset?.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{b.user?.name}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{b.quantity}</td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {format(new Date(b.startDate), 'MMM d')} – {format(new Date(b.endDate), 'MMM d, yyyy')}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {b.returnedAt ? format(new Date(b.returnedAt), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="py-3 px-4"><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}