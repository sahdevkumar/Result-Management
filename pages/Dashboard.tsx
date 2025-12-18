
import React, { useEffect, useState } from 'react';
import { Users, BookOpen, Trophy, AlertTriangle, TrendingUp, Clock, ArrowRight } from 'lucide-react';
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
  <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group">
    <div className={clsx("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2 group-hover:opacity-20 transition-opacity", gradient)}></div>
    <div className="relative">
        <div className="flex justify-between items-start mb-4">
            <div className={clsx("p-3 rounded-xl bg-gradient-to-br text-white shadow-lg", gradient)}>
                <Icon size={22} />
            </div>
            {trend && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <TrendingUp size={12} /> {trend}
                </span>
            )}
        </div>
        <div>
            <h3 className="text-3xl font-bold text-slate-800 tracking-tight mb-1">{value}</h3>
            <p className="text-sm font-medium text-slate-500">{title}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-400">{subtext}</p>
            <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
        </div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ totalStudents: 0, activeExams: 0, passRate: 0, pending: 0 });
  const { showToast } = useToast();

  useEffect(() => {
    const loadStats = async () => {
        try {
            const data = await DataService.getDashboardStats();
            setStats(data);
        } catch (e) {
            console.error("Failed to load dashboard stats");
        }
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 text-sm">Welcome back, Admin. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-sm font-bold text-slate-700">Academic Year: {new Date().getFullYear()}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value={stats.totalStudents.toString()} 
          icon={Users} 
          gradient="from-blue-500 to-indigo-600" 
          subtext="Active enrollments"
          trend="+5%"
        />
        <StatCard 
          title="Exams Created" 
          value={stats.activeExams.toString()} 
          icon={BookOpen} 
          gradient="from-violet-500 to-purple-600" 
          subtext="This academic session"
        />
        <StatCard 
          title="Avg Pass Rate" 
          value={`${stats.passRate}%`} 
          icon={Trophy} 
          gradient="from-emerald-400 to-teal-500" 
          subtext="Across all classes"
          trend="+2.1%"
        />
        <StatCard 
          title="Pending Results" 
          value={stats.pending.toString()} 
          icon={AlertTriangle} 
          gradient="from-amber-400 to-orange-500" 
          subtext="Classes pending publish"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-lg font-bold text-slate-800">Class Performance Analysis</h2>
             <select className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-100 text-slate-700">
                 <option>Last Exam</option>
                 <option>Annual</option>
             </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.2}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="pass" name="Pass %" fill="url(#colorPass)" radius={[6, 6, 0, 0]} barSize={32} />
                <Bar dataKey="fail" name="Fail %" fill="#cbd5e1" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
             <Clock size={20} className="text-indigo-500" /> Recent Activity
          </h2>
          <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 group cursor-pointer">
                <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-indigo-50"></div>
                    <div className="w-0.5 h-full bg-slate-100 mt-2 group-last:hidden"></div>
                </div>
                <div className="pb-4 group-last:pb-0">
                  <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">Marks updated for Class 10A</p>
                  <p className="text-xs text-slate-400 mt-1">Physics • {i} hours ago</p>
                </div>
              </div>
            ))}
          </div>
          <button 
            className="w-full mt-6 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 hover:text-indigo-600 transition-all"
          >
            View Full Audit Log
          </button>
        </div>
      </div>
    </div>
  );
};
