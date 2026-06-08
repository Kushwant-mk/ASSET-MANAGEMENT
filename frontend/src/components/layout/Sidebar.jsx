import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Package, CalendarCheck, ClipboardList,
  BarChart3, History, LogOut, ChevronRight, Settings, ScrollText
} from 'lucide-react';

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
        isActive
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`
    }
  >
    <Icon size={18} />
    {label}
  </NavLink>
);

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-gray-100 flex flex-col z-30">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Package size={16} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-tight">AssetHub</p>
            <p className="text-xs text-slate-400">IIT Roorkee</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {isAdmin && (
          <>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Admin</p>
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/assets" icon={Package} label="Assets" />
            <NavItem to="/bookings" icon={ClipboardList} label="All Bookings" />
            <NavItem to="/audit" icon={ScrollText} label="Audit Logs" />
            <div className="border-t border-gray-100 my-3" />
          </>
        )}
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Menu</p>
        {!isAdmin && <NavItem to="/assets" icon={Package} label="Browse Assets" />}
        <NavItem to="/my-bookings" icon={CalendarCheck} label="My Bookings" />
        <NavItem to="/history" icon={History} label="History" />
      </nav>

      {/* User info */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-50 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}