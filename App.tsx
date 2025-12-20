
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

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans print:bg-white print:block print:min-h-0 print-reset">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        isOnline={isOnline} 
        onLogout={handleLogout}
        user={user}
      />
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 flex items-center justify-between px-4 shadow-sm no-print">
         <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
             >
                <Menu size={24} />
             </button>
             <span className="font-bold text-slate-800 text-lg">Unacademy</span>
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

  useEffect(() => {
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
  }, []);

  if (isInitializing) {
    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white">
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Unacademy...</p>
        </div>
    );
  }

  if (!user) {
    return (
        <ToastProvider>
            <Login onLoginSuccess={() => window.location.reload()} />
        </ToastProvider>
    );
  }

  return (
    <ToastProvider>
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
    </ToastProvider>
  );
};

export default App;
