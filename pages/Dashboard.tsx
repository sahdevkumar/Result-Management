import React from 'react';
import { Users, BookOpen, Trophy, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const mockChartData = [
  { name: 'Class 9A', pass: 85, fail: 15 },
  { name: 'Class 9B', pass: 78, fail: 22 },
  { name: 'Class 10A', pass: 92, fail: 8 },
  { name: 'Class 10B', pass: 88, fail: 12 },
];

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType; color: string; subtext: string }> = ({ title, value, icon: Icon, color, subtext }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={color.replace('bg-', 'text-')} size={24} />
      </div>
    </div>
    <p className="text-xs text-slate-400 mt-4">{subtext}</p>
  </div>
);

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
        <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Academic Year: 2023-2024</span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value="1,248" 
          icon={Users} 
          color="bg-blue-500" 
          subtext="+4.5% from last term"
        />
        <StatCard 
          title="Exams Conducted" 
          value="12" 
          icon={BookOpen} 
          color="bg-indigo-500" 
          subtext="2 ongoing currently"
        />
        <StatCard 
          title="Average Pass Rate" 
          value="88.4%" 
          icon={Trophy} 
          color="bg-emerald-500" 
          subtext="+2.1% improvement"
        />
        <StatCard 
          title="Pending Results" 
          value="3 Classes" 
          icon={AlertTriangle} 
          color="bg-amber-500" 
          subtext="Needs attention"
        />
      </div>

      {/* Charts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Class Performance Overview (Last Exam)</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="pass" name="Pass %" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="fail" name="Fail %" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Marks updated for Class 10A</p>
                  <p className="text-xs text-slate-400">Physics • 2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 px-4 bg-slate-50 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors">
            View Audit Log
          </button>
        </div>
      </div>
    </div>
  );
};
