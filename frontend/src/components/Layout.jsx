import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Mic, Activity, User, LogOut } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 transition-colors duration-200">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary-600" />
              <span className="font-bold text-xl text-gray-900 tracking-tight">FLUENCIFY</span>
            </div>
            
            <div className="flex items-center gap-6">
              <nav className="flex space-x-6 mr-4 border-r border-gray-200 pr-6">
                <Link to="/dashboard" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 px-2 py-2 text-sm font-medium">
                  <User className="h-4 w-4" /> Dashboard
                </Link>
                <Link to="/practice" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 px-2 py-2 text-sm font-medium">
                  <Mic className="h-4 w-4" /> Practice
                </Link>
              </nav>

              {/* User Profile / Logout */}
              <button 
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-900 flex items-center gap-2 px-2 py-2 text-sm font-medium transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
            
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
