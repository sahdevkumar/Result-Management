
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { DataService } from '../services/dataService';
import { Exam, Subject, Student, SchoolClass, UserProfile } from '../types';
import { Save, MessageSquareQuote, Lock, Info, Loader2 } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import clsx from 'clsx';

export const TeachersRemarks: React.FC = () => {
  const { user } = useOutletContext<{ user: UserProfile }>();

  // Selection State
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  
  // Data State
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const commonRemarks = [
      "Excellent performance!",
      "Good effort, keep it up.",
      "Needs more focus on concepts.",
      "Showing improvement.",
      "Outstanding work.",
      "Work on handwriting.",
      "Regular practice required."
  ];

  useEffect(() => {
    const init = async () => {
      try {
        const [eData, sData, cData, stData] = await Promise.all([
            DataService.getExams(),
            DataService.getSubjects(),
            DataService.getClasses(),
            DataService.getStudents()
        ]);

        setExams(eData);
        setClasses(cData);
        setStudents(stData);

        // --- Role-Based Filtering ---
        let filteredSubjects = sData;
        if (user.role === 'Teacher' && user.assignedSubjectId) {
            filteredSubjects = sData.filter(s => s.id === user.assignedSubjectId);
        }
        setSubjects(filteredSubjects);
        
        if(eData.length > 0) setSelectedExamId(eData[0].id);
        if(cData.length > 0) setSelectedClassId(cData[0].id);
        if(filteredSubjects.length > 0) setSelectedSubjectId(filteredSubjects[0].id);

      } catch (err: any) {
        showToast("Failed to load initial data", 'error');
      }
    };
    init();
  }, [user]);

  useEffect(() => {
    if (selectedExamId && selectedSubjectId) {
      loadRemarks();
    }
  }, [selectedExamId, selectedSubjectId]);

  const loadRemarks = async () => {
    setLoading(true);
    try {
      const records = await DataService.getTeacherRemarks(selectedExamId, selectedSubjectId);
      const map: Record<string, string> = {};
      records.forEach(r => {
        map[r.studentId] = r.remark;
      });
      setRemarksMap(map);
    } catch(e: any) {
      showToast("Error loading remarks", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemarkChange = (studentId: string, value: string) => {
    setRemarksMap(prev => ({ ...prev, [studentId]: value }));
  };

  const handleSave = async () => {
    if (!selectedExamId || !selectedSubjectId) {
        showToast("Please select exam and subject", 'error');
        return;
    }
    setSaving(true);
    try {
        const promises = Object.entries(remarksMap).map(([studentId, remark]) => {
            return DataService.saveTeacherRemark({
                studentId,
                examId: selectedExamId,
                subjectId: selectedSubjectId,
                remark: remark as string
            });
        });
        await Promise.all(promises);
        showToast("Remarks saved successfully!", 'success');
    } catch(e: any) {
        showToast("Error saving remarks", 'error');
    } finally {
        setSaving(false);
    }
  };

  const currentSubject = subjects.find(s => s.id === selectedSubjectId);
  const currentClass = classes.find(c => c.id === selectedClassId);
  const filteredStudents = students.filter(student => {
    if (!selectedClassId || !currentClass) return true;
    return student.className === currentClass.className && student.section === currentClass.section;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Teacher's Remark</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Add subject-specific performance feedback.</p>
        </div>
        <button 
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md shadow-indigo-500/20 dark:shadow-none disabled:opacity-50 transition-all"
        >
          {saving ? 'Saving...' : <><Save size={18} /> Save Remarks</>}
        </button>
      </div>

      {/* Selectors */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="space-y-1">
               <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">1. Select Exam</label>
               <select 
                className="w-full rounded-lg border-slate-300 dark:border-slate-700 border p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold transition-colors"
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
              >
                {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">2. Select Class</label>
              <select 
                className="w-full rounded-lg border-slate-300 dark:border-slate-700 border p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold transition-colors"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.className} - {c.section}</option>)}
              </select>
            </div>

             <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">3. Subject Access</label>
              <div className="relative">
                  <select 
                    disabled={user.role === 'Teacher'}
                    className={clsx(
                        "w-full rounded-lg border p-2.5 text-sm outline-none font-bold appearance-none transition-colors",
                        user.role === 'Teacher' 
                            ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-500" 
                            : "bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-700 dark:text-indigo-400"
                    )}
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                  >
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {user.role === 'Teacher' && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={14} /></div>}
              </div>
            </div>
         </div>
      </div>

      {/* Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[400px]">
         <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
             <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                 <MessageSquareQuote size={18} className="text-indigo-600 dark:text-indigo-400"/>
                 Target: <span className="text-indigo-600 dark:text-indigo-400">{currentSubject?.name || 'Loading...'}</span>
             </h3>
         </div>
         <div className="overflow-x-auto relative">
            {loading && <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>}
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-700">
                        <th className="px-6 py-4 w-1/4">Student Info</th>
                        <th className="px-4 py-4 w-3/4">Feedback Content</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {filteredStudents.length === 0 ? (
                         <tr><td colSpan={2} className="p-12 text-center text-slate-400 italic">No student records found.</td></tr>
                    ) : (
                        filteredStudents.map(student => {
                            const remark = remarksMap[student.id] || '';
                            return (
                                <tr key={student.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 overflow-hidden">
                                                <img src={student.avatarUrl} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{student.fullName}</div>
                                                <div className="text-xs text-slate-400 dark:text-slate-500 font-mono uppercase">{student.rollNumber}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="space-y-2">
                                            <textarea 
                                                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                                value={remark}
                                                onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                                                placeholder="Type subject-wise feedback here..."
                                                rows={2}
                                            />
                                            <div className="flex flex-wrap gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                {commonRemarks.map((rem, idx) => (
                                                    <button 
                                                        key={idx}
                                                        onClick={() => handleRemarkChange(student.id, rem)}
                                                        className="text-[9px] font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2.5 py-1 rounded-full text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all shadow-sm"
                                                    >
                                                        {rem}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};
