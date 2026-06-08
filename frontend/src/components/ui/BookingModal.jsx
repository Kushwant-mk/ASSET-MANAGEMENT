import React, { useState } from 'react';
import api from '../../utils/api';
import { X, Calendar, Package, AlertCircle, CheckCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';

export default function BookingModal({ asset, onClose, onSuccess }) {
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');

  const [form, setForm] = useState({ quantity: 1, purpose: '', startDate: tomorrow, endDate: nextWeek });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/bookings', { ...form, assetId: asset.id });
      setSuccess(true);
      setTimeout(onSuccess, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-slate-900">Book Asset</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <CheckCircle size={48} className="text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-900">Booking Requested!</h3>
            <p className="text-slate-500 text-sm mt-1">Your request has been submitted for admin approval.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Asset info */}
            <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{asset.name}</p>
                <p className="text-xs text-slate-500">{asset.category} · {asset.availableQty} available</p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">
                <AlertCircle size={16} />{error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start Date *</label>
                <input type="date" className="input" value={form.startDate} min={tomorrow}
                  onChange={e => setForm({ ...form, startDate: e.target.value })} required />
              </div>
              <div>
                <label className="label">End Date *</label>
                <input type="date" className="input" value={form.endDate} min={form.startDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })} required />
              </div>
            </div>

            <div>
              <label className="label">Quantity *</label>
              <input type="number" className="input" min="1" max={asset.availableQty}
                value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) })} required />
              <p className="text-xs text-slate-400 mt-1">Max: {asset.availableQty}</p>
            </div>

            <div>
              <label className="label">Purpose / Reason *</label>
              <textarea className="input" rows={3} placeholder="e.g., Photography for Thomso cultural event..."
                value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} required />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}