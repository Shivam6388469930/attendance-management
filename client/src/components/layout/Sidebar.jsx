import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Dashboard,
  History,
  EditNote,
  People,
  AdminPanelSettings,
  Rule,
  ReceiptLong,
  CalendarMonth,
  Logout,
  Close
} from '@mui/icons-material';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getLinks = () => {
    if (user?.role === 'admin') {
      return [
        { text: 'Dashboard', path: '/dashboard', icon: Dashboard },
        { text: 'User Management', path: '/admin/users', icon: People },
        { text: 'Role Assignment', path: '/admin/roles', icon: AdminPanelSettings },
        { text: 'Attendance Rules', path: '/admin/rules', icon: Rule },
        { text: 'Audit Logs', path: '/admin/logs', icon: ReceiptLong },
      ];
    }
    if (user?.role === 'hr') {
      return [
        { text: 'Dashboard', path: '/dashboard', icon: Dashboard },
        { text: 'Correction Requests', path: '/hr/requests', icon: EditNote },
        { text: 'Attendance View', path: '/hr/attendance', icon: CalendarMonth },
      ];
    }
    return [
      { text: 'Dashboard', path: '/dashboard', icon: Dashboard },
      { text: 'Attendance History', path: '/history', icon: History },
      { text: 'Correction Requests', path: '/corrections', icon: EditNote },
    ];
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:shadow-none lg:border-r lg:border-slate-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
                A
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Attendance
              </span>
            </div>
            <button 
              className="lg:hidden text-slate-400 hover:text-slate-600 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <Close />
            </button>
          </div>

          {/* User Profile */}
          <div className="p-6 border-b border-slate-100 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 text-3xl font-bold mb-3 shadow-inner">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <h3 className="font-semibold text-slate-800 text-lg">{user?.name}</h3>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="mt-3 px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold uppercase tracking-wider rounded-full border border-indigo-100">
              {user?.role}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {getLinks().map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                    ${active 
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-medium shadow-sm border border-indigo-100/50' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}
                  `}
                >
                  <Icon className={`
                    text-xl transition-colors
                    ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}
                  `} />
                  <span>{link.text}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer Action */}
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 transition-colors group"
            >
              <Logout className="text-red-400 group-hover:text-red-600 transition-colors" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;