
import React, { useEffect, useState } from 'react';
import { Users, BookOpen, Trophy, AlertTriangle, TrendingUp, Clock, ArrowRight, Sparkles, DatabaseZap, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DataService } from '../services/dataService';
import { useToast } from '../components/ToastContext';
import clsx from 'clsx';

const mockChartData = [
  { name: '9A', pass: 85, fail: 15 },
  { name: '9B', pass: 78, fail: 22 },
  { name: '10A', pass: 92, fail: 8 },
  { name: '10B', pass: 88, fail: 12 },
  { name: '11A', pass: 75, fail: 25 },
];

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType; gradient: string; subtext: string; trend?: string }> = ({ title, value, icon: Icon, gradient, subtext, trend }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
    <div className={clsx("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2 group-hover:opacity-20 transition-opacity", gradient)}></div>
    <div className="relative">
        <div className="flex justify-between items-start mb-4">
            <div className={clsx("p-3 rounded-xl bg-gradient-to-br text-white shadow-lg", gradient)}>
                <Icon size={22} />
            </div>
            {trend && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full">
                    <TrendingUp size={12} /> {trend}
                </span>
            )}
        </div>
        <div>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight mb-1">{value}</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-400 dark:text-slate-500">{subtext}</p>
            <ArrowRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
        </div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs">
        <p className="font-bold mb-1">{label}</p>
        <p className="text-indigo-600 dark:text-indigo-400">Pass: {payload[0].value}%</p>
        <p className="text-slate-500 dark:text-slate-400">Fail: {payload[1].value}%</p>
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ totalStudents: 0, activeExams: 0, passRate: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const { showToast } = useToast();

  const loadStats = async () => {
    setLoading(true);
    try {
        const data = await DataService.getDashboardStats();
        setStats(data);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleSeed = async () => {
      setIsSeeding(true);
      try {
          await DataService.seedInitialData();
          showToast("Database initialized successfully!", "success");
          await loadStats();
      } catch (e) {
          showToast("Seeding failed. Connection error.", "error");
      } finally {
          setIsSeeding(false);
      }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">System Console</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Real-time academic performance telemetry.</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Session: {new Date().getFullYear()}</span>
        </div>
      </div>

      {!loading && stats.totalStudents === 0 ? (
          <div className="bg-indigo-600 rounded-[32px] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200 dark:shadow-none">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex p-3 bg-white/20 rounded-2xl mb-6 backdrop-blur-md">
                      <Sparkles size={32} />
                  </div>
                  <h2 className="text-4xl font-black tracking-tight mb-4">Initialize Database</h2>
                  <p className="text-indigo-100 text-lg font-medium leading-relaxed mb-8">
                      Your directory is currently empty. Run the setup tool to populate the system with standard academic subjects, classes, and student profiles.
                  </p>
                  <button 
                    onClick={handleSeed}
                    disabled={isSeeding}
                    className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-50 transition-all flex items-center gap-3 shadow-xl disabled:opacity-50"
                  >
                    {isSeeding ? <Loader2 className="animate-spin" size={20} /> : <DatabaseZap size={20} />}
                    {isSeeding ? 'Populating System...' : 'Initialize Demo Database'}
                  </button>
              </div>
          </div>
      ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Student Body" value={stats.totalStudents.toString()} icon={Users} gradient="from-blue-500 to-indigo-600" subtext="Active enrollments" trend="+5%"/>
                <StatCard title="Evaluations" value={stats.activeExams.toString()} icon={BookOpen} gradient="from-violet-500 to-purple-600" subtext="Term assessments"/>
                <StatCard title="Avg Pass Rate" value={`${stats.passRate}%`} icon={Trophy} gradient="from-emerald-400 to-teal-500" subtext="Institutional aggregate" trend="+2.1%"/>
                <StatCard title="Audit Pending" value={stats.pending.toString()} icon={AlertTriangle} gradient="from-amber-400 to-orange-500" subtext="Verification required"/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Trend Analysis</h2>
                        <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-lg px-2 py-1 outline-none text-slate-700 dark:text-slate-300">
                            <option>Current Term</option>
                            <option>Annual View</option>
                        </select>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0.2}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc', opacity: 0.1}} />
                            <Bar dataKey="pass" name="Pass %" fill="url(#colorPass)" radius={[6, 6, 0, 0]} barSize={32} />
                            <Bar dataKey="fail" name="Fail %" fill="#cbd5e1" radius={[6, 6, 0, 0]} barSize={32} className="dark:fill-slate-700" />
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800 flex flex-col">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Clock size={20} className="text-indigo-500" /> System Logs
                    </h2>
                    <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex gap-4 group cursor-pointer">
                            <div className="flex flex-col items-center">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-indigo-50 dark:ring-indigo-900/50"></div>
                                <div className="w-0.5 h-full bg-slate-100 dark:bg-slate-800 mt-2 group-last:hidden"></div>
                            </div>
                            <div className="pb-4 group-last:pb-0">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Record Update: Class 10A</p>
                                <p className="text-xs text-slate-400 mt-1">Database Sync • {i}h ago</p>
                            </div>
                        </div>
                        ))}
                    </div>
                    <button className="w-full mt-6 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">Audit Portal</button>
                </div>
            </div>
          </>
      )}
    </div>
  );
};
