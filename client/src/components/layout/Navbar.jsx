import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, NotificationsNone } from '@mui/icons-material';

const Navbar = ({ setSidebarOpen }) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Menu />
          </button>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Welcome back, <span className="text-indigo-600">{user.name.split(' ')[0]}</span> 👋
            </h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors relative">
            <NotificationsNone />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-sm cursor-pointer hover:shadow-md transition-shadow">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;