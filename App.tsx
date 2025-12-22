
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
import { Menu, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { DataService } from './services/dataService';
import { ToastProvider } from './components/ToastContext';
import { ThemeProvider } from './components/ThemeContext';
import { UserProfile } from './types';
import clsx from 'clsx';

const AccessGuard: React.FC<{ user: UserProfile, children: React.ReactNode }> = ({ user, children }) => {
  const location = useLocation();
  const hasAccess = canAccessPath(location.pathname, user.role);
  if (!hasAccess) return <Navigate to="/" replace />;
  return <>{children}</>;
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
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await DataService.signOut();
    onLogout();
  };

  const mainBg = 'bg-slate-50 dark:bg-[#050505] text-slate-900 dark:text-cyan-400';
  const mobileHeaderClass = "bg-white/80 dark:bg-black/80 border-slate-200 dark:border-cyan-900/50";

  return (
    <div className={clsx("flex min-h-screen font-sans print:bg-white print:block print:min-h-0 print-reset transition-colors duration-300", mainBg)}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} isOnline={isOnline} onLogout={handleLogout} user={user} />
      <div className={clsx("lg:hidden fixed top-0 left-0 right-0 h-16 backdrop-blur-md border-b z-40 flex items-center justify-between px-4 shadow-sm no-print", mobileHeaderClass)}>
         <div className="flex items-center gap-3">
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 rounded-lg transition-colors text-slate-600 dark:text-cyan-400 hover:bg-slate-100 dark:hover:bg-cyan-950/30"><Menu size={24} /></button>
             <span className="font-bold text-lg text-slate-800 dark:text-cyan-400">Unacademy</span>
         </div>
         <div className="flex items-center gap-3">
            <div title={isOnline ? "Database Connected" : "Connection Lost"}>{isOnline ? <Wifi size={18} className="text-emerald-500" /> : <WifiOff size={18} className="text-red-500" />}</div>
         </div>
      </div>
      <main className={clsx("flex-1 p-4 lg:p-8 overflow-y-auto h-screen transition-all duration-300", "lg:ml-72", "pt-20 lg:pt-8", "print:p-0 print:m-0 print:w-full print:h-auto print:overflow-visible print:static print-reset")}>
        <div className="max-w-7xl mx-auto print:max-w-none print:w-full print:p-0 print:m-0">
            <AccessGuard user={user}><Outlet context={{ user }} /></AccessGuard>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
        try {
            const currentUser = await DataService.getCurrentUser();
            setUser(currentUser);
        } catch (e) {
            setUser(null);
        } finally {
            setIsInitializing(false);
        }
    };
    checkAuth();
  }, []);

  if (isInitializing) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#050505] flex flex-col items-center justify-center text-slate-800 dark:text-cyan-400">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Unacademy_Logo.png/600px-Unacademy_Logo.png" alt="Unacademy" className="w-16 h-16 object-contain mb-6 animate-pulse" />
            <Loader2 className="animate-spin text-indigo-600 dark:text-cyan-500 mb-4" size={48} />
            <p className="text-slate-500 dark:text-cyan-700 font-bold uppercase tracking-widest text-xs">Loading Academic System...</p>
        </div>
    );
  }

  return (
    <ThemeProvider userId={user?.id}>
      <ToastProvider>
        {!user ? <Login onLoginSuccess={(u) => setUser(u)} /> : (
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
