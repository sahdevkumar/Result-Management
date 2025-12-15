import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, BarChart3, Settings, LogOut, PenTool } from 'lucide-react';
import clsx from 'clsx';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Students', path: '/students' },
    { icon: FileText, label: 'Exams', path: '/exams' },
    { icon: PenTool, label: 'Marks Entry', path: '/marks' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
  ];

  // Check if we are in a settings sub-page to highlight the Settings button
  // Removed /marks from here as it is now a main menu item
  const isSettingsActive = ['/settings', '/subjects', '/classes'].includes(location.pathname);

  return (
    <div className="h-screen w-64 bg-slate-900 text-slate-100 flex flex-col fixed left-0 top-0 border-r border-slate-800 z-50">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold">EC</div>
        <span className="text-xl font-bold tracking-tight">EduCore</span>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-2">
        <NavLink
            to="/settings"
            className={clsx(
                'flex items-center gap-3 px-4 py-3 w-full rounded-lg transition-colors',
                isSettingsActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            )}
        >
            <Settings size={20} />
            <span>Settings</span>
        </NavLink>
        <button className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-colors">
            <LogOut size={20} />
            <span>Logout</span>
        </button>
      </div>
    </div>
  );
};