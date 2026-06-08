import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, AlertCircle } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/assets');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Package size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">AssetHub</h1>
              <p className="text-sm text-slate-400">IIT Roorkee Cultural Council</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">Create account</h2>
          <p className="text-slate-500 text-sm mb-6">Join to start booking assets</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-100 rounded-lg px-4 py-3 mb-5 text-sm">
              <AlertCircle size={16} />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Arjun Sharma' },
              { label: 'Email address', key: 'email', type: 'email', placeholder: 'you@iitroorkee.ac.in' },
              { label: 'Password', key: 'password', type: 'password', placeholder: 'Min. 6 characters' },
              { label: 'Confirm Password', key: 'confirm', type: 'password', placeholder: 'Repeat password' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input type={type} className="input" placeholder={placeholder}
                  value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-base">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}