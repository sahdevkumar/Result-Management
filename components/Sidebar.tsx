
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, BarChart3, Settings, LogOut, 
  PenTool, X, Wifi, WifiOff, Palette, Printer, CreditCard, 
  MessageSquareQuote, GraduationCap, Activity, ShieldCheck, UserCircle, UserCog
} from 'lucide-react';
import { UserProfile } from '../types';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  onLogout: () => void;
  user: UserProfile;
}

// Utility to check access
export const canAccessPath = (path: string, role: string): boolean => {
  if (role === 'Super Admin' || role === 'Principal') return true;
  
  const commonPaths = ['/', '/students', '/reports', '/scorecard'];
  
  switch (role) {
    case 'Admin':
      // Admin can do everything except manage roles (reserved for Super Admin/Principal)
      return path !== '/roles';
    case 'Teacher':
      // Teachers focused on academic entry
      return [...commonPaths, '/marks', '/remarks', '/non-academic'].includes(path);
    case 'Office Staff':
      // Office staff focused on directory and printing
      return [...commonPaths, '/exams', '/print'].includes(path);
    default:
      return path === '/';
  }
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isOnline, onLogout, user }) => {
  const location = useLocation();
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Students', path: '/students' },
    { icon: FileText, label: 'Exams', path: '/exams' },
    { icon: PenTool, label: 'Marks Entry', path: '/marks' },
    { icon: MessageSquareQuote, label: "Teacher's Remark", path: '/remarks' },
    { icon: Activity, label: 'Non Academic', path: '/non-academic' },
    { icon: CreditCard, label: 'Score Card', path: '/scorecard' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
    { icon: Palette, label: 'Template Design', path: '/templates' },
    { icon: Printer, label: 'Print Report', path: '/print' },
  ];

  const systemItems = [
    { icon: ShieldCheck, label: 'Role & Permission', path: '/roles' },
    { icon: UserCog, label: 'User Management', path: '/users' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const filteredNavItems = navItems.filter(item => canAccessPath(item.path, user.role));
  const filteredSystemItems = systemItems.filter(item => canAccessPath(item.path, user.role));

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={clsx(
          "fixed inset-0 bg-indigo-950/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 print:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )} 
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <div className={clsx(
        "h-screen w-72 bg-[#0f172a] text-slate-300 flex flex-col fixed left-0 top-0 border-r border-white/5 z-50 transition-transform duration-300 lg:translate-x-0 shadow-2xl print:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <GraduationCap size={24} />
            </div>
            <div>
                <h1 className="text-xl font-bold text-white tracking-tight leading-none">Unacademy</h1>
                <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold">Admin Portal</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* User Info Section */}
        <div className="px-6 mb-6">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <UserCircle size={24} />
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-bold text-white truncate">{user.fullName}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{user.role}</p>
                </div>
            </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-4 mb-2 mt-2">Main Menu</div>
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                clsx(
                  'relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden',
                  isActive
                    ? 'bg-white/10 text-white shadow-lg backdrop-blur-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )
              }
            >
              {({ isActive }) => (
                <>
                    {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.5)]"></div>
                    )}
                    <item.icon size={20} className={clsx("transition-colors", isActive ? "text-indigo-400" : "group-hover:text-indigo-300")} />
                    <span className="font-medium tracking-wide">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
          
           {filteredSystemItems.length > 0 && (
             <>
               <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-4 mb-2 mt-6">System</div>
               {filteredSystemItems.map((item) => (
                 <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                        clsx(
                            'relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group',
                            isActive ? 'bg-white/10 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'
                        )
                    }
                >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.5)]"></div>
                        )}
                        <item.icon size={20} className={clsx(isActive ? "text-indigo-400" : "group-hover:text-indigo-300")} />
                        <span className="font-medium tracking-wide">{item.label}</span>
                      </>
                    )}
                </NavLink>
               ))}
             </>
           )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="flex items-center justify-between px-2 mb-3">
             <div className="flex items-center gap-2">
                 <div className={clsx("w-2 h-2 rounded-full animate-pulse", isOnline ? "bg-emerald-500" : "bg-red-500")}></div>
                 <span className="text-xs font-medium text-slate-400">{isOnline ? "System Online" : "Offline Mode"}</span>
             </div>
             {isOnline ? <Wifi size={14} className="text-emerald-500/50"/> : <WifiOff size={14} className="text-red-500/50"/>}
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 text-sm font-medium group"
          >
              <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};
