
import React, { useRef, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, BarChart3, Settings, LogOut, 
  PenTool, X, Wifi, WifiOff, Palette, Printer, CreditCard, 
  MessageSquareQuote, GraduationCap, Activity, ShieldCheck, UserCircle, UserCog,
  Sun, Moon, Monitor, ChevronUp, ChevronDown
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
  const commonPaths = ['/', '/students', '/reports', '/scorecard'];
  switch (role) {
    case 'Admin': return path !== '/roles';
    case 'Teacher': return [...commonPaths, '/marks', '/remarks', '/non-academic'].includes(path);
    case 'Office Staff': return [...commonPaths, '/exams', '/print'].includes(path);
    default: return path === '/';
  }
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isOnline, onLogout, user }) => {
  const location = useLocation();
  const { mode, setMode } = useTheme();
  const navRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  
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
  ];

  const filteredNavItems = navItems.filter(item => canAccessPath(item.path, user.role));
  const filteredSystemItems = systemItems.filter(item => canAccessPath(item.path, user.role));
  const filteredLayoutItems = layoutItems.filter(item => canAccessPath(item.path, user.role));

  const handleNavClick = () => {
    if (window.innerWidth < 1024) onClose();
  };

  const checkScroll = () => {
    if (navRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = navRef.current;
        setCanScrollUp(scrollTop > 0);
        // Using a small buffer (1px) for float precision issues
        setCanScrollDown(Math.ceil(scrollTop + clientHeight) < scrollHeight);
    }
  };

  const scrollNav = (direction: 'up' | 'down') => {
    if (navRef.current) {
        const amount = 100;
        navRef.current.scrollBy({ top: direction === 'up' ? -amount : amount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const nav = navRef.current;
    if (nav) {
        nav.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);
        // Initial check
        checkScroll();
        // Check again after a delay to ensure rendering is complete
        setTimeout(checkScroll, 100);
    }
    return () => {
        if (nav) nav.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
    };
  }, [filteredNavItems, filteredSystemItems, filteredLayoutItems, isOpen]);

  // Quantum Theme Styling Constants (Responsive)
  const sidebarBg = 'bg-white dark:bg-[#0a0a0a] border-r border-slate-200 dark:border-cyan-900/50 text-slate-600 dark:text-cyan-400 dark:bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] dark:bg-[size:20px_20px]';
  const logoBg = 'border border-cyan-500 text-cyan-500 dark:text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] bg-cyan-50 dark:bg-cyan-950/30';
  const subHeaderClass = "text-slate-400 dark:text-cyan-900 font-bold border-b border-slate-100 dark:border-cyan-900/30 pb-1";
  
  const getActiveItemClass = (isActive: boolean) => {
    return isActive
        ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-300 border-l-2 border-cyan-500 dark:border-cyan-400 shadow-[4px_0_20px_rgba(6,182,212,0.1)]'
        : 'text-slate-500 dark:text-cyan-700 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-cyan-950/20 transition-all';
  };

  return (
    <>
      <div className={clsx("fixed inset-0 bg-slate-900/20 dark:bg-cyan-950/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 print:hidden", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")} onClick={onClose} />

      <div className={clsx("h-screen w-72 flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 lg:translate-x-0 shadow-2xl print:hidden", sidebarBg, isOpen ? "translate-x-0" : "-translate-x-full")}>
        {/* Header */}
        <div className="p-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center transition-all", logoBg)}>
                <GraduationCap size={24} />
            </div>
            <div>
                <h1 className={clsx("text-xl font-bold tracking-tight leading-none text-slate-800 dark:text-cyan-400")}>Unacademy</h1>
                <span className={clsx("text-[10px] uppercase tracking-widest font-semibold opacity-70")}>Admin Portal</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden opacity-70 hover:opacity-100 text-slate-500 dark:text-cyan-400"><X size={20} /></button>
        </div>

        {/* Navigation Wrapper with Scroll Indicators */}
        <div className="flex-1 relative min-h-0 flex flex-col">
            {/* Up Indicator */}
            <div className={clsx("absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white dark:from-[#0a0a0a] to-transparent z-10 flex justify-center items-start transition-opacity duration-300 pointer-events-none", canScrollUp ? "opacity-100" : "opacity-0")}>
                <button 
                    onClick={() => scrollNav('up')} 
                    className="pointer-events-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-1 rounded-full shadow-sm border border-slate-200 dark:border-slate-800 mt-1 animate-bounce hover:bg-indigo-50 dark:hover:bg-indigo-900/50"
                >
                    <ChevronUp size={14} className="text-slate-500 dark:text-slate-400" />
                </button>
            </div>

            {/* Navigation */}
            <nav ref={navRef} className="flex-1 px-4 space-y-2 overflow-y-auto hide-scrollbar pb-6 pt-2">
              <div className={clsx("text-xs uppercase tracking-wider px-4 mb-2 mt-2", subHeaderClass)}>Main Menu</div>
              {filteredNavItems.map((item) => (
                <NavLink key={item.path} to={item.path} onClick={handleNavClick} className={({ isActive }) => clsx('relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group', getActiveItemClass(isActive))}>
                  <item.icon size={20} /> <span className="font-medium tracking-wide">{item.label}</span>
                </NavLink>
              ))}
              
               {filteredSystemItems.length > 0 && (
                 <>
                   <div className={clsx("text-xs uppercase tracking-wider px-4 mb-2 mt-6", subHeaderClass)}>System</div>
                   {filteredSystemItems.map((item) => (
                     <NavLink key={item.path} to={item.path} onClick={handleNavClick} className={({ isActive }) => clsx('relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group', getActiveItemClass(isActive))}>
                        <item.icon size={20} /> <span className="font-medium tracking-wide">{item.label}</span>
                    </NavLink>
                   ))}
                 </>
               )}

               {filteredLayoutItems.length > 0 && (
                 <>
                   <div className={clsx("text-xs uppercase tracking-wider px-4 mb-2 mt-6", subHeaderClass)}>Layout & UI</div>
                   {filteredLayoutItems.map((item) => (
                     <NavLink key={item.path} to={item.path} onClick={handleNavClick} className={({ isActive }) => clsx('relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group', getActiveItemClass(isActive))}>
                        <item.icon size={20} /> <span className="font-medium tracking-wide">{item.label}</span>
                    </NavLink>
                   ))}
                 </>
               )}
            </nav>

            {/* Down Indicator */}
            <div className={clsx("absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-[#0a0a0a] to-transparent z-10 flex justify-center items-end transition-opacity duration-300 pointer-events-none", canScrollDown ? "opacity-100" : "opacity-0")}>
                <button 
                    onClick={() => scrollNav('down')} 
                    className="pointer-events-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-1 rounded-full shadow-sm border border-slate-200 dark:border-slate-800 mb-1 animate-bounce hover:bg-indigo-50 dark:hover:bg-indigo-900/50"
                >
                    <ChevronDown size={14} className="text-slate-500 dark:text-slate-400" />
                </button>
            </div>
        </div>

        {/* Footer */}
        <div className={clsx("p-4 border-t border-slate-200 dark:border-cyan-900/30 bg-slate-50 dark:bg-black/20 shrink-0")}>
          <div className={clsx("rounded-xl p-3 flex items-center justify-between gap-3 mb-3 border border-slate-200 dark:border-cyan-900/30 bg-white dark:bg-cyan-950/20")}>
              <div className="flex items-center gap-3 overflow-hidden">
                  <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 dark:bg-cyan-900/30 text-slate-600 dark:text-cyan-400")}>
                      <UserCircle size={18} />
                  </div>
                  <div className="overflow-hidden text-slate-700 dark:text-cyan-700">
                      <p className="text-xs font-bold truncate text-slate-800 dark:text-cyan-300">{user.fullName}</p>
                      <p className="text-[10px] uppercase opacity-70 truncate">{user.role}</p>
                  </div>
              </div>
              <button onClick={onLogout} className="opacity-70 hover:opacity-100 hover:text-red-500 dark:hover:text-red-400 text-slate-500 dark:text-cyan-600"><LogOut size={16} /></button>
          </div>

          <div className="flex bg-slate-200 dark:bg-cyan-950/40 p-1 rounded-lg border border-slate-300 dark:border-cyan-900/30">
              {[
                  { id: 'light', icon: Sun },
                  { id: 'system', icon: Monitor },
                  { id: 'dark', icon: Moon }
              ].map((opt) => (
                  <button 
                    key={opt.id}
                    onClick={() => setMode(opt.id as any)}
                    className={clsx(
                        "flex-1 flex items-center justify-center py-1.5 rounded-md transition-all",
                        mode === opt.id 
                            ? "bg-white dark:bg-cyan-500 text-indigo-600 dark:text-black shadow-sm" 
                            : "text-slate-500 dark:text-cyan-700 hover:text-indigo-600 dark:hover:text-cyan-400"
                    )}
                  >
                      <opt.icon size={14} strokeWidth={3} />
                  </button>
              ))}
          </div>

          <div className="flex items-center justify-center px-1 mt-3">
             <div className="flex items-center gap-2" title={isOnline ? "System Online" : "Offline Mode"}>
                 <div className={clsx("w-2 h-2 rounded-full animate-pulse", isOnline ? "bg-emerald-500" : "bg-red-500")}></div>
                 <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-cyan-800">{isOnline ? 'System Online' : 'Offline'}</span>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};
