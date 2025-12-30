
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, PenTool, MessageSquareQuote, Activity, 
  ChevronRight, BarChart, CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { Exam, SchoolClass } from '../types';
import clsx from 'clsx';

export const ResultManagement: React.FC = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [e, c] = await Promise.all([
          DataService.getExams(),
          DataService.getClasses()
        ]);
        setExams(e);
        setClasses(c);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const tools = [
    { title: 'Marks Entry', desc: 'Input subject-wise marks', icon: PenTool, path: '/marks', color: 'bg-blue-500' },
    { title: 'Remarks', desc: 'Add qualitative feedback', icon: MessageSquareQuote, path: '/remarks', color: 'bg-purple-500' },
    { title: 'Non-Academic', desc: 'Grade attendance & participation', icon: Activity, path: '/non-academic', color: 'bg-indigo-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <ClipboardCheck className="text-indigo-600" size={32} />
            Result Management Hub
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Consolidated control panel for term-wise academic outcomes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tools.map((tool, idx) => (
          <button 
            key={idx}
            onClick={() => navigate(tool.path)}
            className="bg-white dark:bg-slate-900 p-6 rounded-[24px] shadow-sm border border-slate-200 dark:border-slate-800 text-left hover:border-indigo-300 dark:hover:border-indigo-600 group transition-all"
          >
            <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform", tool.color)}>
              <tool.icon size={24} />
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center justify-between">
              {tool.title}
              <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{tool.desc}</p>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 p-8">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <BarChart className="text-indigo-500" size={20} />
            Recent Assessment Activity
        </h2>
        
        {loading ? (
            <div className="py-12 text-center text-slate-400 italic">Syncing result status...</div>
        ) : exams.length === 0 ? (
            <div className="py-12 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 rounded-2xl">No active exams found in term schedule.</div>
        ) : (
            <div className="space-y-4">
                {exams.slice(0, 4).map(exam => (
                    <div key={exam.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-white dark:bg-slate-700 rounded-xl shadow-sm">
                                <Clock size={18} className="text-indigo-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm">{exam.name}</h4>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{exam.type}</p>
                            </div>
                        </div>
                        <div className="flex gap-8 items-center pr-4">
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-slate-400">Class Progress</p>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">85% Complete</p>
                            </div>
                            <div className="h-1.5 w-24 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: '85%' }}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-indigo-900 rounded-[32px] p-8 text-white flex gap-6 items-start shadow-xl shadow-indigo-100 dark:shadow-none">
            <div className="p-3 bg-white/10 rounded-2xl">
                <CheckCircle size={28} className="text-indigo-300" />
            </div>
            <div>
                <h4 className="font-black text-lg uppercase tracking-tight">Status: Active</h4>
                <p className="text-sm text-indigo-100/70 mt-1">Data entry systems are online. Verification layer is enforcing pass/fail thresholds based on session config.</p>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 flex gap-6 items-start">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-2xl text-amber-600 dark:text-amber-400">
                <AlertCircle size={28} />
            </div>
            <div>
                <h4 className="font-black text-lg text-slate-800 dark:text-white uppercase tracking-tight">Audit Notice</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Non-academic records for <b>Term 1</b> are prioritized. Ensure all behavioral grades are finalized before scorecard release.</p>
            </div>
        </div>
      </div>
    </div>
  );
};
