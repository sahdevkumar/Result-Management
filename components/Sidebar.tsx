
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, BarChart3, Settings, LogOut, 
  PenTool, X, Wifi, WifiOff, Palette, Printer, CreditCard, 
  MessageSquareQuote, GraduationCap, Activity, ShieldCheck, UserCircle, UserCog,
  Sun, Moon, PaintBucket
} from 'lucide-react';
import { UserProfile } from '../types';
import { useTheme } from './ThemeContext';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  onLogout: () => void;
  user: UserProfile;
}

export const canAccessPath = (path: string, role: string): boolean => {
  if (role === 'Super Admin' || role === 'Principal') return true;
  const commonPaths = ['/', '/students', '/reports', '/scorecard', '/themes'];
  switch (role) {
    case 'Admin': return path !== '/roles';
    case 'Teacher': return [...commonPaths, '/marks', '/remarks', '/non-academic'].includes(path);
    case 'Office Staff': return [...commonPaths, '/exams', '/print'].includes(path);
    default: return path === '/';
  }
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isOnline, onLogout, user }) => {
  const location = useLocation();
  const { theme, toggleTheme, isDarkMode } = useTheme();
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Students', path: '/students' },
    { icon: FileText, label: 'Exams', path: '/exams' },
    { icon: PenTool, label: 'Marks Entry', path: '/marks' },
    { icon: MessageSquareQuote, label: "Teacher's Remark", path: '/remarks' },
    { icon: Activity, label: 'Non Academic', path: '/non-academic' },
    { icon: CreditCard, label: 'Score Card', path: '/scorecard' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
    { icon: Printer, label: 'Print Report', path: '/print' },
  ];

  const systemItems = [
    { icon: ShieldCheck, label: 'Role & Permission', path: '/roles' },
    { icon: UserCog, label: 'User Management', path: '/users' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const layoutItems = [
    { icon: Palette, label: 'Template Design', path: '/templates' },
    { icon: PaintBucket, label: 'Themes', path: '/themes' },
  ];

  const filteredNavItems = navItems.filter(item => canAccessPath(item.path, user.role));
  const filteredSystemItems = systemItems.filter(item => canAccessPath(item.path, user.role));
  const filteredLayoutItems = layoutItems.filter(item => canAccessPath(item.path, user.role));

  const handleNavClick = () => {
    if (window.innerWidth < 1024) onClose();
  };

  const getSidebarBg = () => {
    switch(theme) {
        case 'professional': return 'bg-[#3C4952] border-r border-[#3C4952]/50 text-white';
        case 'neumorphism': return 'bg-[#E0E5EC] dark:bg-[#2A2A2A] border-r border-slate-300/50 dark:border-black/20 text-slate-700 dark:text-slate-300 shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] dark:shadow-[10px_10px_30px_#1a1a1a,-10px_-10px_30px_#3a3a3a]';
        case 'glassmorphism': return 'bg-white/20 dark:bg-black/40 backdrop-blur-xl border-r border-white/20 dark:border-white/10 text-slate-800 dark:text-white';
        case 'brutalism': return 'bg-[#FFDE59] dark:bg-[#4338ca] border-r-4 border-black dark:border-white text-black dark:text-white';
        case 'minimalist': return 'bg-white dark:bg-black border-r border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200';
        case '3d': return 'bg-[#e0e5ec] dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200';
        case 'animated': return 'bg-slate-900 text-white border-r border-slate-800';
        case 'gradients': return 'bg-gradient-to-b from-violet-600 to-indigo-600 dark:from-violet-900 dark:to-indigo-900 text-white';
        case 'micro': return 'bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300';
        case 'asymmetric': return 'bg-stone-100 dark:bg-stone-900 border-r-8 border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 rounded-r-[3rem]';
        case 'vivid': return 'bg-fuchsia-600 dark:bg-fuchsia-900 text-white border-r border-fuchsia-500';
        case 'lumen': return 'bg-white dark:bg-[#242526] border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 shadow-xl';
        case 'neo': return 'bg-black border-r border-green-500 text-green-500 font-mono shadow-[5px_0_15px_rgba(34,197,94,0.2)]';
        case 'aura': return 'bg-slate-900/80 backdrop-blur-md border-r border-indigo-500/30 text-indigo-100 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-900';
        case 'quantum': return 'bg-[#0a0a0a] border-r border-cyan-900/50 text-cyan-400 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]';
        default: return 'bg-gradient-to-b from-indigo-950 to-indigo-900 border-r border-white/10 text-white';
    }
  };

  const getActiveItemClass = (isActive: boolean) => {
    if (theme === 'neumorphism') {
        return isActive
            ? 'text-indigo-600 dark:text-indigo-400 shadow-[inset_4px_4px_8px_#b8b9be,inset_-4px_-4px_8px_#ffffff] dark:shadow-[inset_3px_3px_6px_#1a1a1a,inset_-3px_-3px_6px_#3a3a3a] rounded-xl font-bold bg-[#E0E5EC] dark:bg-[#2A2A2A]'
            : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-[4px_4px_8px_#b8b9be,-4px_-4px_8px_#ffffff] dark:hover:shadow-[3px_3px_6px_#1a1a1a,-3px_-3px_6px_#3a3a3a] rounded-xl transition-all duration-300';
    }
    if (theme === 'brutalism') {
        return isActive
            ? 'bg-black dark:bg-white text-white dark:text-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] translate-x-1 translate-y-1 border-2 border-black dark:border-white'
            : 'hover:bg-black/10 dark:hover:bg-white/10 font-bold border-2 border-transparent hover:border-black dark:hover:border-white transition-all';
    }
    if (theme === 'glassmorphism') {
        return isActive
            ? 'bg-white/40 dark:bg-white/10 backdrop-blur-md shadow-lg border border-white/30 text-indigo-900 dark:text-white font-bold'
            : 'hover:bg-white/20 dark:hover:bg-white/5 transition-all text-slate-700 dark:text-slate-300';
    }
    if (theme === 'minimalist') {
        return isActive
            ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white font-bold border-l-4 border-black dark:border-white pl-3'
            : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:pl-2 transition-all';
    }
    if (theme === 'neo') {
        return isActive
            ? 'bg-green-900/30 text-green-400 border border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]'
            : 'text-green-700 hover:text-green-400 hover:bg-green-900/10 transition-colors';
    }
    if (theme === 'quantum') {
        return isActive
            ? 'bg-cyan-950/40 text-cyan-300 border-l-2 border-cyan-400 shadow-[4px_0_20px_rgba(6,182,212,0.2)]'
            : 'text-cyan-700 hover:text-cyan-400 hover:bg-cyan-950/20 transition-all';
    }
    if (theme === '3d') {
        return isActive
            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-[0_4px_0_rgb(203,213,225)] dark:shadow-[0_4px_0_rgb(30,41,59)] transform -translate-y-1'
            : 'hover:bg-white/50 dark:hover:bg-slate-700/50 hover:-translate-y-0.5 transition-transform';
    }
    if (theme === 'gradients') {
        return isActive
            ? 'bg-white text-violet-600 shadow-lg'
            : 'text-violet-100 hover:bg-white/10 hover:text-white';
    }
    
    // Default / Professional
    if (theme === 'professional') {
        return isActive
            ? 'bg-[#1380D0] text-white shadow-lg shadow-[#1380D0]/40'
            : 'text-slate-300 hover:text-white hover:bg-white/10';
    }
    return isActive
        ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/10'
        : 'text-violet-200 hover:text-white hover:bg-white/10';
  };

  const getSubHeaderClass = () => {
      if (theme === 'neo') return "text-green-800 font-bold border-b border-green-900/30 pb-1";
      if (theme === 'quantum') return "text-cyan-900 font-bold border-b border-cyan-900/30 pb-1";
      if (theme === 'brutalism') return "text-black dark:text-white font-black uppercase tracking-widest border-b-2 border-black dark:border-white pb-1";
      if (theme === 'neumorphism') return "text-slate-500 dark:text-slate-400 font-bold";
      if (theme === 'minimalist') return "text-gray-400 dark:text-gray-500 font-semibold";
      if (theme === 'professional') return "text-slate-400";
      return "text-violet-300/70";
  }

  const getLogoBg = () => {
      if (theme === 'neumorphism') return "bg-[#E0E5EC] dark:bg-[#2A2A2A] text-indigo-600 dark:text-indigo-400 shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff] dark:shadow-[4px_4px_8px_#1a1a1a,-4px_-4px_8px_#3a3a3a]";
      if (theme === 'brutalism') return "bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)]";
      if (theme === 'glassmorphism') return "bg-white/30 backdrop-blur-md border border-white/40 text-indigo-700";
      if (theme === 'minimalist') return "bg-black dark:bg-white text-white dark:text-black";
      if (theme === 'neo') return "border border-green-500 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]";
      if (theme === 'quantum') return "border border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)] bg-cyan-950/30";
      if (theme === 'professional') return "bg-[#1380D0]";
      return "bg-white/10";
  }

  return (
    <>
      <div className={clsx("fixed inset-0 bg-indigo-950/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 print:hidden", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")} onClick={onClose} />

      <div className={clsx("h-screen w-72 flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 lg:translate-x-0 shadow-2xl print:hidden", getSidebarBg(), isOpen ? "translate-x-0" : "-translate-x-full")}>
        {/* Header */}
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center transition-all", getLogoBg())}>
                <GraduationCap size={24} />
            </div>
            <div>
                <h1 className={clsx("text-xl font-bold tracking-tight leading-none", theme === 'brutalism' ? "font-black" : "")}>Unacademy</h1>
                <span className={clsx("text-[10px] uppercase tracking-widest font-semibold opacity-70")}>Admin Portal</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden opacity-70 hover:opacity-100"><X size={20} /></button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar pb-6">
          <div className={clsx("text-xs uppercase tracking-wider px-4 mb-2 mt-2", getSubHeaderClass())}>Main Menu</div>
          {filteredNavItems.map((item) => (
            <NavLink key={item.path} to={item.path} onClick={handleNavClick} className={({ isActive }) => clsx('relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group', getActiveItemClass(isActive))}>
              <item.icon size={20} /> <span className="font-medium tracking-wide">{item.label}</span>
            </NavLink>
          ))}
          
           {filteredSystemItems.length > 0 && (
             <>
               <div className={clsx("text-xs uppercase tracking-wider px-4 mb-2 mt-6", getSubHeaderClass())}>System</div>
               {filteredSystemItems.map((item) => (
                 <NavLink key={item.path} to={item.path} onClick={handleNavClick} className={({ isActive }) => clsx('relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group', getActiveItemClass(isActive))}>
                    <item.icon size={20} /> <span className="font-medium tracking-wide">{item.label}</span>
                </NavLink>
               ))}
             </>
           )}

           {filteredLayoutItems.length > 0 && (
             <>
               <div className={clsx("text-xs uppercase tracking-wider px-4 mb-2 mt-6", getSubHeaderClass())}>Layout & UI</div>
               {filteredLayoutItems.map((item) => (
                 <NavLink key={item.path} to={item.path} onClick={handleNavClick} className={({ isActive }) => clsx('relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group', getActiveItemClass(isActive))}>
                    <item.icon size={20} /> <span className="font-medium tracking-wide">{item.label}</span>
                </NavLink>
               ))}
             </>
           )}
        </nav>

        {/* Footer */}
        <div className={clsx("p-4", theme === 'neumorphism' ? "border-t border-slate-300/50 dark:border-black/20" : "border-t border-white/10 bg-black/5")}>
          <div className={clsx("rounded-xl p-3 flex items-center justify-between gap-3 mb-3", theme === 'neumorphism' ? "shadow-[inset_2px_2px_5px_#b8b9be,inset_-2px_-2px_5px_#ffffff] dark:shadow-[inset_2px_2px_5px_#1a1a1a,inset_-2px_-2px_5px_#3a3a3a]" : "bg-white/10 border border-white/10")}>
              <div className="flex items-center gap-3 overflow-hidden">
                  <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", theme === 'professional' ? "bg-[#1380D0]" : "bg-indigo-500/30")}>
                      <UserCircle size={18} />
                  </div>
                  <div className="overflow-hidden">
                      <p className="text-xs font-bold truncate">{user.fullName}</p>
                      <p className="text-[10px] uppercase opacity-70 truncate">{user.role}</p>
                  </div>
              </div>
              <button onClick={onLogout} className="opacity-70 hover:opacity-100 hover:text-red-400"><LogOut size={16} /></button>
          </div>

          <div className="flex items-center justify-between px-1">
             <div className="flex items-center gap-2" title={isOnline ? "System Online" : "Offline Mode"}>
                 <div className={clsx("w-2 h-2 rounded-full animate-pulse", isOnline ? "bg-emerald-400" : "bg-red-400")}></div>
                 {isOnline ? <Wifi size={14} className="opacity-70" /> : <WifiOff size={14} className="text-red-400" />}
             </div>
             
             <button onClick={toggleTheme} className={clsx("p-1.5 rounded-lg transition-all", theme === 'neumorphism' ? "shadow-[3px_3px_6px_#b8b9be,-3px_-3px_6px_#ffffff] dark:shadow-[3px_3px_6px_#1a1a1a,-3px_-3px_6px_#3a3a3a]" : "bg-white/10 hover:bg-white/20")}>
                {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
             </button>
          </div>
        </div>
      </div>
    </>
  );
};
