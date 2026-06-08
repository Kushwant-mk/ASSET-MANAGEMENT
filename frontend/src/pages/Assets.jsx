import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';
import StatusBadge from '../components/ui/StatusBadge';
import BookingModal from '../components/ui/BookingModal';
import { Plus, Search, Package, Edit2, Trash2, Eye, Filter, X } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORIES = ['Camera', 'Lighting', 'Audio', 'Costumes', 'Props', 'Equipment', 'Other'];
const EMPTY_FORM = { name: '', category: 'Camera', description: '', totalQuantity: 1, status: 'ACTIVE', condition: 'GOOD', imageUrl: '' };

export default function Assets() {
  const { isAdmin } = useAuth();
  const [assets, setAssets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [bookingAsset, setBookingAsset] = useState(null);
  const [page, setPage] = useState(1);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      const res = await api.get(`/assets?${params}`);
      setAssets(res.data.assets);
      setTotal(res.data.total);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchAssets(); }, [search, category, page]);

  const openCreate = () => { setEditAsset(null); setForm(EMPTY_FORM); setError(''); setShowModal(true); };
  const openEdit = (asset) => {
    setEditAsset(asset);
    setForm({ name: asset.name, category: asset.category, description: asset.description || '', totalQuantity: asset.totalQuantity, status: asset.status, condition: asset.condition, imageUrl: asset.imageUrl || '' });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editAsset) await api.put(`/assets/${editAsset.id}`, form);
      else await api.post('/assets', form);
      setShowModal(false);
      fetchAssets();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save asset');
    }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/assets/${id}`);
      fetchAssets();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isAdmin ? 'Asset Inventory' : 'Browse Assets'}</h1>
          <p className="text-slate-500 text-sm mt-1">{total} assets available</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> Add Asset
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search assets..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input w-44" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(search || category) && (
          <button onClick={() => { setSearch(''); setCategory(''); }} className="btn-secondary">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
      ) : assets.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No assets found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {assets.map(asset => (
              <div key={asset.id} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Package size={20} className="text-blue-500" />
                  </div>
                  <StatusBadge status={asset.status} />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-2">{asset.name}</h3>
                <p className="text-xs text-slate-400 mb-3">{asset.category}</p>
                {asset.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{asset.description}</p>}

                <div className="flex items-center justify-between text-xs mb-4">
                  <span className="text-slate-500">Available</span>
                  <span className={`font-semibold ${asset.availableQty === 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {asset.availableQty} / {asset.totalQuantity}
                  </span>
                </div>

                {/* Utilization bar */}
                <div className="h-1.5 bg-gray-100 rounded-full mb-4">
                  <div className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${((asset.totalQuantity - asset.availableQty) / asset.totalQuantity) * 100}%` }} />
                </div>

                <div className="flex gap-2">
                  {isAdmin ? (
                    <>
                      <button onClick={() => openEdit(asset)} className="btn-secondary flex-1 text-xs py-1.5 justify-center">
                        <Edit2 size={13} /> Edit
                      </button>
                      <button onClick={() => handleDelete(asset.id, asset.name)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <button
                      disabled={asset.availableQty === 0 || asset.status !== 'ACTIVE'}
                      onClick={() => setBookingAsset(asset)}
                      className={`btn-primary flex-1 text-xs py-1.5 justify-center ${asset.availableQty === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {asset.availableQty === 0 ? 'Unavailable' : 'Book Now'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {total > 12 && (
            <div className="flex items-center justify-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary disabled:opacity-40">Prev</button>
              <span className="text-sm text-slate-500">Page {page} of {Math.ceil(total / 12)}</span>
              <button disabled={page >= Math.ceil(total / 12)} onClick={() => setPage(p => p + 1)} className="btn-secondary disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-slate-900">{editAsset ? 'Edit Asset' : 'Add New Asset'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Asset Name *</label>
                  <input className="input" placeholder="Canon EOS 5D Mark IV" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Category *</label>
                  <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Quantity *</label>
                  <input type="number" min="1" className="input" value={form.totalQuantity} onChange={e => setForm({ ...form, totalQuantity: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {['ACTIVE', 'MAINTENANCE', 'RETIRED'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Condition</label>
                  <select className="input" value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>
                    {['EXCELLENT', 'GOOD', 'FAIR', 'POOR'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Description</label>
                  <textarea className="input" rows={3} placeholder="Brief description of the asset..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? 'Saving...' : editAsset ? 'Update Asset' : 'Create Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking modal for users */}
      {bookingAsset && (
        <BookingModal asset={bookingAsset} onClose={() => setBookingAsset(null)} onSuccess={() => { setBookingAsset(null); fetchAssets(); }} />
      )}
    </div>
  );
}