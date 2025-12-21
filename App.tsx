
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
import { Login } from './pages/Login';
import { Menu, Wifi, WifiOff, Loader2, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { DataService } from './services/dataService';
import { supabase } from './lib/supabase';
import { ToastProvider, useToast } from './components/ToastContext';
import { ThemeProvider } from './components/ThemeContext';
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
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#050505] text-slate-800 dark:text-cyan-400">
            <div className="w-full max-w-md bg-white dark:bg-black/40 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-slate-200 dark:border-cyan-900/50 animate-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-cyan-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-600 dark:text-cyan-400 border border-slate-200 dark:border-cyan-800">
                        <KeyRound size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-cyan-300">Set New Password</h2>
                    <p className="text-slate-500 dark:text-cyan-700 text-sm mt-2">Please create a new secure password for your account.</p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-400 dark:text-cyan-800 uppercase tracking-widest ml-1">New Password</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={6}
                                className="w-full p-4 bg-slate-50 dark:bg-black/60 border border-slate-300 dark:border-cyan-900/50 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 dark:focus:ring-cyan-500/20 focus:border-indigo-500 dark:focus:border-cyan-500 transition-all font-bold text-slate-900 dark:text-cyan-100"
                                placeholder="Min. 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-cyan-700 dark:hover:text-cyan-400 transition-colors">
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading || password.length < 6}
                        className="w-full py-4 bg-slate-900 dark:bg-cyan-950/50 border border-transparent dark:border-cyan-500 hover:bg-slate-800 dark:hover:bg-cyan-500 dark:hover:text-black text-white dark:text-cyan-400 rounded-2xl font-bold shadow-lg shadow-slate-200 dark:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

  // Responsive Background using standard classes
  const mainBg = 'bg-slate-50 dark:bg-[#050505] text-slate-900 dark:text-cyan-400';
  const mobileHeaderClass = "bg-white/80 dark:bg-black/80 border-slate-200 dark:border-cyan-900/50";

  return (
    <div className={clsx("flex min-h-screen font-sans print:bg-white print:block print:min-h-0 print-reset transition-colors duration-300", mainBg)}>
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
          mobileHeaderClass
      )}>
         <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="p-2 -ml-2 rounded-lg transition-colors text-slate-600 dark:text-cyan-400 hover:bg-slate-100 dark:hover:bg-cyan-950/30"
             >
                <Menu size={24} />
             </button>
             <span className="font-bold text-lg text-slate-800 dark:text-cyan-400">Unacademy</span>
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
    // 1. Initial Session Check with Timeout
    const checkAuth = async () => {
        try {
            // Force a timeout after 10 seconds to avoid stuck loading screens if Supabase hangs
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Auth Check Timeout')), 10000));
            
            // Race the actual check against the timeout
            const currentUser = await Promise.race([
                DataService.getCurrentUser(),
                timeoutPromise
            ]);
            
            setUser(currentUser as UserProfile | null);
        } catch (e) {
            console.warn("Auth initialization failed or timed out", e);
            setUser(null); // Fallback to unauthenticated state (Login screen)
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
        <div className="min-h-screen bg-slate-50 dark:bg-[#050505] flex flex-col items-center justify-center text-slate-800 dark:text-cyan-400">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Unacademy_Logo.png/600px-Unacademy_Logo.png" 
              alt="Unacademy" 
              className="w-16 h-16 object-contain mb-6 animate-pulse drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
            />
            <Loader2 className="animate-spin text-indigo-600 dark:text-cyan-500 mb-4" size={48} />
            <p className="text-slate-500 dark:text-cyan-700 font-bold uppercase tracking-widest text-xs">Loading Unacademy...</p>
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
            <Login onLoginSuccess={(u) => setUser(u)} />
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
