
import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Exam, Student, SchoolClass, NonAcademicRecord } from '../types';
import { Save, Activity, Info, Loader2, Calendar, GraduationCap, ChevronDown, CheckCircle2, Zap } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import clsx from 'clsx';

export const NonAcademicEntry: React.FC = () => {
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [recordsMap, setRecordsMap] = useState<Record<string, NonAcademicRecord>>({});
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const gradeOptions = ['A', 'B', 'C', 'D', 'E'];

  useEffect(() => {
    const init = async () => {
      try {
        const [eData, cData, stData] = await Promise.all([
            DataService.getExams(),
            DataService.getClasses(),
            DataService.getStudents()
        ]);
        setExams(eData);
        setClasses(cData);
        setStudents(stData);
        
        if(eData.length > 0) setSelectedExamId(eData[0].id);
        if(cData.length > 0) setSelectedClassId(cData[0].id);
      } catch (err) {
        showToast("Failed to load initial data", 'error');
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      loadRecords();
    }
  }, [selectedExamId]);

  const createEmptyRecord = (studentId: string): NonAcademicRecord => ({
      studentId,
      examId: selectedExamId,
      attendance: '',
      discipline: 'A',
      communication: 'A',
      participation: 'A'
  });

  const loadRecords = async () => {
    setLoading(true);
    try {
      const records = await DataService.getNonAcademicRecords(selectedExamId);
      const map: Record<string, NonAcademicRecord> = {};
      records.forEach(r => {
        map[r.studentId] = r;
      });
      setRecordsMap(map);
    } catch(e) {
      showToast("Error loading records", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldUpdate = (studentId: string, field: keyof NonAcademicRecord, value: string) => {
    setRecordsMap(prev => {
        const record = prev[studentId] || createEmptyRecord(studentId);
        return {
            ...prev,
            [studentId]: { ...record, [field]: value }
        };
    });
  };

  const quickFillGrades = (field: keyof NonAcademicRecord, grade: string) => {
    setRecordsMap(prev => {
      const next = { ...prev };
      filteredStudents.forEach(s => {
        const record = next[s.id] || createEmptyRecord(s.id);
        next[s.id] = { ...record, [field]: grade };
      });
      return next;
    });
    showToast(`All students marked as '${grade}' for ${field}`, 'info');
  };

  const handleSave = async () => {
    if (!selectedExamId) {
        showToast("Please select an exam first", "error");
        return;
    }
    setSaving(true);
    try {
        const promises = filteredStudents.map(s => {
            const record = recordsMap[s.id] || createEmptyRecord(s.id);
            return DataService.saveNonAcademicRecord(record);
        });
        await Promise.all(promises);
        showToast("Non-Academic records saved successfully!", 'success');
        await loadRecords();
    } catch(e: any) {
        showToast(`Save failed: ${e.message}`, 'error');
    } finally {
        setSaving(false);
    }
  };

  const currentClass = classes.find(c => c.id === selectedClassId);
  const filteredStudents = students.filter(student => {
    if (!selectedClassId || !currentClass) return true;
    return student.className === currentClass.className && student.section === currentClass.section;
  });

  const getGradeStyles = (grade: string) => {
    switch(grade) {
      case 'A': return "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20";
      case 'B': return "bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20";
      case 'C': return "bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20";
      case 'D': return "bg-orange-50 text-orange-700 border-orange-200 ring-orange-500/20";
      case 'E': return "bg-red-50 text-red-700 border-red-200 ring-red-500/20";
      default: return "bg-slate-50 text-slate-700 border-slate-200 ring-slate-500/20";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
             <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                <Activity size={24} />
             </div>
             Non-Academic Performance
          </h1>
          <p className="text-slate-500 text-sm mt-1">Grade student behavior, communication skills, and active class participation.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <button 
                onClick={handleSave} 
                disabled={saving || loading || filteredStudents.length === 0} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-xl font-bold shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50"
            >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} 
                {saving ? 'Saving...' : 'Save All Records'}
            </button>
        </div>
      </div>

      {/* Selectors Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-8 relative overflow-hidden group border-l-4 border-l-indigo-500">
        <div className="space-y-1">
           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Calendar size={12} className="text-indigo-500" /> 1. Select Assessment Term
           </label>
           <div className="relative">
               <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800 appearance-none cursor-pointer" 
                value={selectedExamId} 
                onChange={(e) => setSelectedExamId(e.target.value)}
               >
                 {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
               </select>
               <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
           </div>
        </div>
        <div className="space-y-1">
           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <GraduationCap size={12} className="text-indigo-500" /> 2. Class & Section Selection
           </label>
           <div className="relative">
               <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800 appearance-none cursor-pointer" 
                value={selectedClassId} 
                onChange={(e) => setSelectedClassId(e.target.value)}
               >
                 <option value="">Choose Class...</option>
                 {classes.map(c => <option key={c.id} value={c.id}>{c.className} - {c.section}</option>)}
               </select>
               <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
           </div>
        </div>
      </div>

      {/* Entry Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[400px]">
         {loading && (
             <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-30 flex items-center justify-center">
                 <div className="flex flex-col items-center gap-3">
                     <div className="relative">
                        <Loader2 className="animate-spin text-indigo-600" size={40} />
                        <Activity className="absolute inset-0 m-auto text-indigo-400" size={16} />
                     </div>
                     <p className="text-xs font-black text-indigo-600 uppercase tracking-widest animate-pulse">Synchronizing Data...</p>
                 </div>
             </div>
         )}
         
         {/* Table Actions / Bulk Fill Header */}
         {filteredStudents.length > 0 && (
             <div className="bg-slate-50/80 border-b border-slate-200 p-3 flex flex-wrap items-center gap-4 text-xs no-print">
                 <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-tighter">
                    <Zap size={14} className="text-amber-500" /> Quick Fill Grades:
                 </div>
                 {['discipline', 'communication', 'participation'].map(field => (
                     <div key={field} className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 pr-2 shadow-sm">
                         <span className="px-2 font-bold text-slate-400 uppercase border-r border-slate-100 mr-1">{field === 'participation' ? 'Class Part.' : field}</span>
                         <div className="flex gap-1">
                            {['A', 'B', 'C'].map(g => (
                                <button 
                                    key={g} 
                                    onClick={() => quickFillGrades(field as any, g)}
                                    className="w-6 h-6 rounded flex items-center justify-center font-bold bg-slate-100 hover:bg-indigo-600 hover:text-white transition-colors"
                                >
                                    {g}
                                </button>
                            ))}
                         </div>
                     </div>
                 ))}
             </div>
         )}

         <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-20 shadow-sm bg-white">
                    <tr className="bg-white text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-200">
                        <th className="px-6 py-4 min-w-[240px] bg-white">Student Information</th>
                        <th className="px-4 py-4 text-center bg-white">Attendance</th>
                        <th className="px-4 py-4 text-center bg-white">Discipline</th>
                        <th className="px-4 py-4 text-center bg-white">Communication</th>
                        <th className="px-4 py-4 text-center bg-white">Participation</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-20 text-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                                    <Activity size={48} />
                                </div>
                                <div>
                                    <p className="text-slate-800 font-bold">No students found</p>
                                    <p className="text-slate-400 text-sm">Select a class or check student enrollment in settings.</p>
                                </div>
                            </div>
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(student => {
                        const record = recordsMap[student.id] || createEmptyRecord(student.id);

                        return (
                            <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                                            <img src={student.avatarUrl} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{student.fullName}</div>
                                            <div className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{student.rollNumber}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex justify-center">
                                        <input 
                                            type="text" 
                                            className="w-28 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                                            value={record.attendance}
                                            onChange={(e) => handleFieldUpdate(student.id, 'attendance', e.target.value)}
                                            placeholder="Ex: 180/200"
                                        />
                                    </div>
                                </td>
                                {['discipline', 'communication', 'participation'].map((field) => (
                                    <td key={field} className="px-4 py-4 text-center">
                                        <div className="flex justify-center">
                                            <div className="relative group/select">
                                                <select 
                                                    className={clsx(
                                                        "w-16 p-2.5 rounded-xl border font-black text-sm outline-none transition-all appearance-none text-center cursor-pointer ring-inset focus:ring-4",
                                                        getGradeStyles(record[field as keyof NonAcademicRecord] as string)
                                                    )}
                                                    value={record[field as keyof NonAcademicRecord] as string}
                                                    onChange={(e) => handleFieldUpdate(student.id, field as keyof NonAcademicRecord, e.target.value)}
                                                >
                                                    {gradeOptions.map(o => <option key={o} value={o} className="bg-white text-slate-900 font-bold">{o}</option>)}
                                                </select>
                                                <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                                    <ChevronDown size={10} />
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        );
                      })
                    )}
                </tbody>
            </table>
         </div>
      </div>

      {/* Information Footer */}
      <div className="bg-indigo-900 rounded-2xl p-5 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Info className="text-indigo-200" size={24} />
              </div>
              <div>
                  <h4 className="font-bold text-sm">Grading Rubric Information</h4>
                  <p className="text-indigo-200 text-xs mt-0.5">Grades range from <b>A (Excellent)</b> to <b>E (Needs Improvement)</b>. All changes are saved per exam term.</p>
              </div>
          </div>
          <div className="flex gap-4 items-center">
              <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black uppercase text-indigo-300">Completion Status</p>
                  <p className="text-sm font-bold">{Object.keys(recordsMap).length} / {filteredStudents.length} Graded</p>
              </div>
              <div className="w-24 h-2 bg-indigo-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-400 transition-all duration-1000" 
                    style={{ width: `${filteredStudents.length > 0 ? (Object.keys(recordsMap).length / filteredStudents.length) * 100 : 0}%` }}
                  ></div>
              </div>
          </div>
      </div>
    </div>
  );
};
