
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar, canAccessPath } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Reports } from './pages/Reports';
import { Exams } from './pages/Exams';
import { Settings } from './pages/Settings';
import { MarksEntry } from './pages/MarksEntry';
import { NonAcademicEntry } from './pages/NonAcademicEntry';
import { TemplateDesign } from './pages/TemplateDesign';
import { PrintReport } from './pages/PrintReport';
import { ScoreCard } from './pages/ScoreCard';
import { TeachersRemarks } from './pages/TeachersRemarks'; 
import { RolePermission } from './pages/RolePermission';
import { UserManagement } from './pages/UserManagement';
import { Themes } from './pages/Themes';
import { Login } from './pages/Login';
import { Menu, Wifi, WifiOff, Loader2, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { DataService } from './services/dataService';
import { supabase } from './lib/supabase';
import { ToastProvider, useToast } from './components/ToastContext';
import { ThemeProvider, useTheme } from './components/ThemeContext';
import { UserProfile } from './types';
import clsx from 'clsx';

const AccessGuard: React.FC<{ user: UserProfile, children: React.ReactNode }> = ({ user, children }) => {
  const location = useLocation();
  const hasAccess = canAccessPath(location.pathname, user.role);

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const UpdatePassword: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: password });
            if (error) throw error;
            showToast("Password updated successfully!", "success");
            onComplete();
        } catch (err: any) {
            showToast(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
                        <KeyRound size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">Set New Password</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Please create a new secure password for your account.</p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={6}
                                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-slate-800 dark:text-white"
                                placeholder="Min. 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors">
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading || password.length < 6}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                        Update Password
                    </button>
                </form>
            </div>
        </div>
    );
};

const Layout: React.FC<{ user: UserProfile, onLogout: () => void }> = ({ user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const checkStatus = async () => {
      const status = await DataService.checkConnection();
      setIsOnline(status);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    const handleOnline = () => checkStatus();
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = async () => {
    try {
        await DataService.signOut();
        onLogout();
    } catch (e) {
        console.error("Logout failed", e);
    }
  };

  const getMainBackground = () => {
    switch (theme) {
        case 'professional': return 'bg-slate-50/50 dark:bg-slate-900';
        case 'neumorphism': return 'bg-[#E0E5EC] dark:bg-[#2A2A2A] text-slate-800 dark:text-slate-200';
        case 'glassmorphism': return 'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-slate-900 dark:via-purple-900/20 dark:to-slate-900';
        case 'brutalism': return 'bg-[#FFFDF5] dark:bg-[#121212]';
        case 'minimalist': return 'bg-white dark:bg-black';
        case '3d': return 'bg-blue-50/50 dark:bg-slate-900';
        case 'animated': return 'bg-slate-50 dark:bg-slate-950';
        case 'gradients': return 'bg-gradient-to-tr from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-indigo-950';
        case 'micro': return 'bg-gray-50 dark:bg-gray-900';
        case 'asymmetric': return 'bg-stone-50 dark:bg-stone-900';
        case 'vivid': return 'bg-fuchsia-50/30 dark:bg-fuchsia-950/20';
        case 'lumen': return 'bg-[#F0F2F5] dark:bg-[#18191A]';
        case 'neo': return 'bg-black text-green-500';
        case 'aura': return 'bg-slate-900 text-white';
        case 'quantum': return 'bg-[#050505] text-cyan-400';
        default: return 'bg-slate-50/50 dark:bg-slate-950';
    }
  };

  const getMobileHeaderClass = () => {
      if (theme === 'neumorphism') return "bg-[#E0E5EC]/90 dark:bg-[#2A2A2A]/90 border-slate-300/50 dark:border-black/20";
      if (theme === 'glassmorphism') return "bg-white/30 dark:bg-black/30 backdrop-blur-lg border-white/20";
      if (theme === 'neo' || theme === 'quantum') return "bg-black/80 border-green-900/50";
      return "bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800";
  }

  return (
    <div className={clsx("flex min-h-screen font-sans print:bg-white print:block print:min-h-0 print-reset transition-colors duration-300", getMainBackground())}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        isOnline={isOnline} 
        onLogout={handleLogout}
        user={user}
      />
      
      {/* Mobile Header */}
      <div className={clsx(
          "lg:hidden fixed top-0 left-0 right-0 h-16 backdrop-blur-md border-b z-40 flex items-center justify-between px-4 shadow-sm no-print transition-colors duration-300",
          getMobileHeaderClass()
      )}>
         <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsSidebarOpen(true)} 
                className={clsx(
                    "p-2 -ml-2 rounded-lg transition-colors",
                    theme === 'neumorphism' ? "text-slate-700 dark:text-slate-300 hover:bg-black/5" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
             >
                <Menu size={24} />
             </button>
             <span className={clsx("font-bold text-lg", theme === 'neo' ? "text-green-500" : "text-slate-800 dark:text-white")}>Unacademy</span>
         </div>
         <div className="flex items-center gap-3">
            <div title={isOnline ? "Database Connected" : "Connection Lost"}>
              {isOnline ? (
                <Wifi size={18} className="text-emerald-500" />
              ) : (
                <WifiOff size={18} className="text-red-500" />
              )}
            </div>
         </div>
      </div>

      <main className={clsx(
        "flex-1 p-4 lg:p-8 overflow-y-auto h-screen transition-all duration-300",
        "lg:ml-72", 
        "pt-20 lg:pt-8", 
        "print:p-0 print:m-0 print:w-full print:h-auto print:overflow-visible print:static print-reset"
      )}>
        <div className="max-w-7xl mx-auto print:max-w-none print:w-full print:p-0 print:m-0">
            <AccessGuard user={user}>
              <Outlet context={{ user }} />
            </AccessGuard>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    // 1. Initial Session Check
    const checkAuth = async () => {
        try {
            const currentUser = await DataService.getCurrentUser();
            setUser(currentUser);
        } catch (e) {
            console.error("Auth initialization failed", e);
        } finally {
            setIsInitializing(false);
        }
    };
    checkAuth();

    // 2. Setup Auth Listener for Password Recovery & Session Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
            setIsRecoveryMode(true);
        } else if (event === 'SIGNED_IN') {
            const currentUser = await DataService.getCurrentUser();
            setUser(currentUser);
            // If we signed in but NOT via recovery, ensure recovery mode is off
            if (!window.location.hash.includes('type=recovery')) {
                setIsRecoveryMode(false);
            }
        } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setIsRecoveryMode(false);
        }
    });

    return () => {
        subscription.unsubscribe();
    };
  }, []);

  if (isInitializing) {
    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white">
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Unacademy...</p>
        </div>
    );
  }

  // Intercept Recovery Mode
  if (isRecoveryMode) {
      return (
          <ThemeProvider userId={user?.id}>
              <ToastProvider>
                  <UpdatePassword onComplete={() => { setIsRecoveryMode(false); window.location.href = '/'; }} />
              </ToastProvider>
          </ThemeProvider>
      );
  }

  return (
    <ThemeProvider userId={user?.id}>
      <ToastProvider>
        {!user ? (
            <Login onLoginSuccess={() => { /* User state updates via listener */ }} />
        ) : (
            <Router>
              <Routes>
                <Route path="/" element={<Layout user={user} onLogout={() => setUser(null)} />}>
                  <Route index element={<Dashboard />} />
                  <Route path="students" element={<Students />} />
                  <Route path="exams" element={<Exams />} />
                  <Route path="marks" element={<MarksEntry />} />
                  <Route path="remarks" element={<TeachersRemarks />} /> 
                  <Route path="non-academic" element={<NonAcademicEntry />} /> 
                  <Route path="scorecard" element={<ScoreCard />} /> 
                  <Route path="reports" element={<Reports />} />
                  <Route path="templates" element={<TemplateDesign />} />
                  <Route path="themes" element={<Themes />} />
                  <Route path="print" element={<PrintReport />} />
                  <Route path="roles" element={<RolePermission />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </Router>
        )}
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
