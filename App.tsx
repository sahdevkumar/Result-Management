
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
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
import { Menu, Wifi, WifiOff } from 'lucide-react';
import { DataService } from './services/dataService';
import { ToastProvider } from './components/ToastContext';
import clsx from 'clsx';

const Layout: React.FC = () => {
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

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans print:bg-white print:block print:min-h-0 print-reset">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} isOnline={isOnline} />
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 flex items-center justify-between px-4 shadow-sm no-print">
         <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
             >
                <Menu size={24} />
             </button>
             <span className="font-bold text-slate-800 text-lg">EduCore</span>
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
            <Outlet />
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
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
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </ToastProvider>
  );
};

export default App;
