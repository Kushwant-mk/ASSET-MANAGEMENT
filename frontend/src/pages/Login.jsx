import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'ADMIN' ? '/dashboard' : '/assets');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') { setEmail('admin@iitroorkee.ac.in'); setPassword('admin123'); }
    else { setEmail('arjun@iitroorkee.ac.in'); setPassword('user123'); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-fade-in">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Package size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">AssetHub</h1>
              <p className="text-sm text-slate-400">IIT Roorkee Cultural Council</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
          <p className="text-slate-500 text-sm mb-6">Sign in to manage assets</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-100 rounded-lg px-4 py-3 mb-5 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@iitroorkee.ac.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-base">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-slate-400 mb-3 text-center">Demo credentials</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => fillDemo('admin')}
                className="text-xs border border-dashed border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors text-slate-600">
                <span className="font-semibold text-blue-600">Admin</span><br />admin@iitroorkee.ac.in
              </button>
              <button onClick={() => fillDemo('user')}
                className="text-xs border border-dashed border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors text-slate-600">
                <span className="font-semibold text-emerald-600">User</span><br />arjun@iitroorkee.ac.in
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}