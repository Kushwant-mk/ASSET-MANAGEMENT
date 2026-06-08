import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../utils/api';
import Spinner from '../components/ui/Spinner';
import StatusBadge from '../components/ui/StatusBadge';
import { Package, Users, CalendarCheck, AlertTriangle, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
    </div>
    <p className="text-3xl font-bold text-slate-900">{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/dashboard')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  if (!data) return <div className="text-center text-slate-500 mt-20">Failed to load dashboard</div>;

  const { summary, assetsByCategory, bookingsByStatus, recentBookings, topAssets, monthlyTrend } = data;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Overview of all assets and activity</p>
        </div>
        <Link to="/bookings?status=PENDING" className="btn-primary">
          <Clock size={16} />
          {summary.pendingBookings} Pending Requests
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Package} label="Total Assets" value={summary.totalAssets} color="bg-blue-500" />
        <StatCard icon={Users} label="Total Users" value={summary.totalUsers} color="bg-emerald-500" />
        <StatCard icon={CalendarCheck} label="Active Bookings" value={summary.activeBookings} color="bg-violet-500" />
        <StatCard icon={AlertTriangle} label="Overdue" value={summary.overdueBookings} color="bg-red-500" sub={summary.overdueBookings > 0 ? 'Needs attention' : 'All clear'} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly trend */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Booking Trend (6 Months)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyTrend}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Bookings" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Booking status pie */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Bookings by Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={bookingsByStatus} cx="50%" cy="50%" outerRadius={75} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {bookingsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Assets by category */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Assets by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={assetsByCategory} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Assets" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top assets */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Most Booked Assets</h3>
          <div className="space-y-3">
            {topAssets.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No booking data yet</p>
            ) : topAssets.map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400 w-5">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-slate-800">{a.name}</p>
                    <span className="text-sm font-semibold text-blue-600">{a.bookings}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(a.bookings / (topAssets[0]?.bookings || 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Recent Booking Activity</h3>
          <Link to="/bookings" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['User', 'Asset', 'Dates', 'Status', 'Created'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBookings.map(b => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-3 font-medium text-slate-800">{b.user?.name}</td>
                  <td className="py-3 px-3 text-slate-600">{b.asset?.name}</td>
                  <td className="py-3 px-3 text-slate-500 text-xs">
                    {format(new Date(b.startDate), 'MMM d')} – {format(new Date(b.endDate), 'MMM d')}
                  </td>
                  <td className="py-3 px-3"><StatusBadge status={b.status} /></td>
                  <td className="py-3 px-3 text-slate-400 text-xs">{format(new Date(b.createdAt), 'MMM d, HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}