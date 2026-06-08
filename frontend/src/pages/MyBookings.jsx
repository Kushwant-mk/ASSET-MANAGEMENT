import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Spinner from '../components/ui/Spinner';
import StatusBadge from '../components/ui/StatusBadge';
import { CalendarCheck, Package, X, Clock } from 'lucide-react';
import { format, isPast } from 'date-fns';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = () => {
    setLoading(true);
    api.get('/bookings?limit=50')
      .then(r => setBookings(r.data.bookings.filter(b => b.status !== 'RETURNED')))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.patch(`/bookings/${id}/cancel`);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Bookings</h1>
          <p className="text-slate-500 text-sm mt-1">{bookings.length} active requests</p>
        </div>
        <Link to="/assets" className="btn-primary"><Package size={16} /> Book Asset</Link>
      </div>

      {bookings.length === 0 ? (
        <div className="card p-16 text-center text-slate-400">
          <CalendarCheck size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No active bookings</p>
          <p className="text-sm mt-1">Browse assets to make a booking request</p>
          <Link to="/assets" className="btn-primary mt-4 inline-flex">Browse Assets</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <div key={b.id} className="card p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package size={22} className="text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{b.asset?.name}</h3>
                    <p className="text-sm text-slate-400">{b.asset?.category} · Qty: {b.quantity}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <p className="text-sm text-slate-600 mt-2 line-clamp-1">{b.purpose}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {format(new Date(b.startDate), 'MMM d')} – {format(new Date(b.endDate), 'MMM d, yyyy')}
                  </span>
                  {isPast(new Date(b.endDate)) && b.status === 'ISSUED' && (
                    <span className="text-red-500 font-medium">⚠ Overdue</span>
                  )}
                </div>
                {b.adminNote && (
                  <div className="mt-2 bg-amber-50 text-amber-700 text-xs rounded-lg px-3 py-2">
                    Admin note: {b.adminNote}
                  </div>
                )}
              </div>
              {b.status === 'PENDING' && (
                <button onClick={() => handleCancel(b.id)} title="Cancel booking"
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}