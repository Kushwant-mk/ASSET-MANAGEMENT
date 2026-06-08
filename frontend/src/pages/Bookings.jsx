import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import StatusBadge from '../components/ui/StatusBadge';
import { CheckCircle, XCircle, PackageCheck, RotateCcw, Filter, X, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'ISSUED', 'RETURNED', 'OVERDUE'];

export default function Bookings() {
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);
  const [actionModal, setActionModal] = useState(null); // { booking, action }
  const [adminNote, setAdminNote] = useState('');
  const [actioning, setActioning] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/bookings?${params}`);
      setBookings(res.data.bookings);
      setTotal(res.data.total);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, [statusFilter, page]);

  const handleAction = async () => {
    setActioning(true);
    try {
      const { booking, action } = actionModal;
      if (action === 'approve') await api.patch(`/bookings/${booking.id}/approve`, { adminNote });
      else if (action === 'reject') await api.patch(`/bookings/${booking.id}/reject`, { adminNote });
      else if (action === 'issue') await api.patch(`/bookings/${booking.id}/issue`);
      else if (action === 'return') await api.patch(`/bookings/${booking.id}/return`);
      else if (action === 'cancel') await api.patch(`/bookings/${booking.id}/cancel`);
      setActionModal(null);
      setAdminNote('');
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    }
    setActioning(false);
  };

  const openAction = (booking, action) => { setActionModal({ booking, action }); setAdminNote(''); };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isAdmin ? 'All Bookings' : 'My Bookings'}</h1>
          <p className="text-slate-500 text-sm mt-1">{total} total bookings</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button onClick={() => { setStatusFilter(''); setPage(1); }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!statusFilter ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-gray-200 hover:bg-gray-50'}`}>
          All
        </button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-gray-200 hover:bg-gray-50'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
      ) : bookings.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <p className="font-medium">No bookings found</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Asset', 'User', 'Qty', 'Duration', 'Purpose', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">{b.asset?.name}</p>
                      <p className="text-xs text-slate-400">{b.asset?.category}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-700">{b.user?.name}</p>
                      <p className="text-xs text-slate-400">{b.user?.email}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{b.quantity}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      <div>{format(new Date(b.startDate), 'MMM d')}</div>
                      <div>→ {format(new Date(b.endDate), 'MMM d, yyyy')}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-slate-600 text-xs line-clamp-2">{b.purpose}</p>
                      {b.adminNote && <p className="text-amber-600 text-xs mt-1 italic">Note: {b.adminNote}</p>}
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={b.status} /></td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {isAdmin && b.status === 'PENDING' && (
                          <>
                            <button onClick={() => openAction(b, 'approve')} title="Approve" className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><CheckCircle size={16} /></button>
                            <button onClick={() => openAction(b, 'reject')} title="Reject" className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><XCircle size={16} /></button>
                          </>
                        )}
                        {isAdmin && b.status === 'APPROVED' && (
                          <button onClick={() => openAction(b, 'issue')} title="Mark as Issued" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><PackageCheck size={16} /></button>
                        )}
                        {isAdmin && ['ISSUED', 'OVERDUE'].includes(b.status) && (
                          <button onClick={() => openAction(b, 'return')} title="Mark as Returned" className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"><RotateCcw size={16} /></button>
                        )}
                        {!isAdmin && b.status === 'PENDING' && (
                          <button onClick={() => openAction(b, 'cancel')} title="Cancel" className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > 15 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary disabled:opacity-40">Prev</button>
              <span className="text-sm text-slate-500">Page {page} of {Math.ceil(total / 15)}</span>
              <button disabled={page >= Math.ceil(total / 15)} onClick={() => setPage(p => p + 1)} className="btn-secondary disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}

      {/* Action Confirmation Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2 capitalize">
              {actionModal.action} Booking
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {actionModal.action === 'approve' && `Approve ${actionModal.booking.quantity}x ${actionModal.booking.asset?.name} for ${actionModal.booking.user?.name}?`}
              {actionModal.action === 'reject' && `Reject this booking request?`}
              {actionModal.action === 'issue' && `Mark this booking as issued to ${actionModal.booking.user?.name}?`}
              {actionModal.action === 'return' && `Mark this booking as returned?`}
              {actionModal.action === 'cancel' && `Cancel your booking for ${actionModal.booking.asset?.name}?`}
            </p>
            {['approve', 'reject'].includes(actionModal.action) && (
              <div className="mb-4">
                <label className="label">Note to user (optional)</label>
                <textarea className="input" rows={2} placeholder="Add a message for the user..."
                  value={adminNote} onChange={e => setAdminNote(e.target.value)} />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setActionModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handleAction} disabled={actioning}
                className={`flex-1 justify-center font-medium px-4 py-2 rounded-lg transition-colors text-white flex items-center gap-2 ${
                  actionModal.action === 'approve' || actionModal.action === 'issue' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  actionModal.action === 'return' ? 'bg-violet-600 hover:bg-violet-700' :
                  'bg-red-600 hover:bg-red-700'
                }`}>
                {actioning ? 'Processing...' : `Confirm ${actionModal.action}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}