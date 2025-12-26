import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { DataService } from '../services/dataService';
import { Exam, Subject, Student, MarkRecord, SchoolClass, UserProfile } from '../types';
import { Save, CheckCircle, Calculator, Info, BookOpen, GraduationCap, Calendar, Loader2, Lock, AlertTriangle } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import clsx from 'clsx';

export const MarksEntry: React.FC = () => {
  const { user } = useOutletContext<{ user: UserProfile }>();
  
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  
  const [localMaxObj, setLocalMaxObj] = useState<number>(0);
  const [localMaxSubj, setLocalMaxSubj] = useState<number>(0);
  
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [marksData, setMarksData] = useState<Record<string, MarkRecord>>({});
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  // Load Metadata
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
        
        let filteredSubjects = sData;
        if (user.role === 'Teacher' && user.assignedSubjectId) {
            filteredSubjects = sData.filter(s => s.id === user.assignedSubjectId);
        }
        setSubjects(filteredSubjects);
        
        if (eData.length > 0) setSelectedExamId(eData[0].id);
        if (cData.length > 0) setSelectedClassId(cData[0].id);
        if (filteredSubjects.length > 0) setSelectedSubjectId(filteredSubjects[0].id);
      } catch (err) {
        showToast("Failed to load initial data", 'error');
      }
    };
    init();
  }, [user, showToast]);

  const currentClass = useMemo(() => classes.find(c => c.id === selectedClassId), [classes, selectedClassId]);
  
  const filteredStudents = useMemo(() => students.filter(student => 
    !selectedClassId || !currentClass 
      ? true 
      : student.className === currentClass.className && student.section === currentClass.section
  ), [students, selectedClassId, currentClass]);

  const createEmptyRecord = useCallback((studentId: string): MarkRecord => ({
      studentId, 
      examId: selectedExamId, 
      subjectId: selectedSubjectId, 
      objMarks: 0, 
      objMaxMarks: localMaxObj, 
      subMarks: 0, 
      subMaxMarks: localMaxSubj,
      examDate: exams.find(e => e.id === selectedExamId)?.date || new Date().toISOString().split('T')[0], 
      grade: 'F', 
      attended: true
  }), [selectedExamId, selectedSubjectId, localMaxObj, localMaxSubj, exams]);

  const loadMarks = useCallback(async () => {
    if (!selectedExamId || !selectedSubjectId || !selectedClassId) return;
    setLoading(true);
    try {
      const records = await DataService.getMarks(selectedExamId, selectedSubjectId);
      const marksMap: Record<string, MarkRecord> = {};
      
      // Filter records that belong to the currently selected class only
      const classStudentIds = new Set(filteredStudents.map(s => s.id));
      const classRecords = records.filter(r => classStudentIds.has(r.studentId));

      if (classRecords.length > 0) {
        const firstWithMax = classRecords.find(r => (r.objMaxMarks || 0) > 0 || (r.subMaxMarks || 0) > 0);
        if (firstWithMax) {
          setLocalMaxObj(firstWithMax.objMaxMarks || 0);
          setLocalMaxSubj(firstWithMax.subMaxMarks || 0);
        }
      } else {
        // If no records for THIS class/exam combo, fall back to Subject defaults
        const sub = subjects.find(s => s.id === selectedSubjectId);
        if (sub) {
          setLocalMaxObj(sub.maxMarksObjective || 0);
          setLocalMaxSubj(sub.maxMarksSubjective || 0);
        }
      }

      records.forEach(r => {
        marksMap[r.studentId] = r;
      });
      setMarksData(marksMap);
    } catch(e) { 
      showToast("Error loading marks", 'error'); 
    } finally { 
      setLoading(false); 
    }
  }, [selectedExamId, selectedSubjectId, selectedClassId, filteredStudents, subjects, showToast]);

  useEffect(() => {
    loadMarks();
  }, [selectedExamId, selectedSubjectId, selectedClassId, loadMarks]);

  const handleScoreUpdate = (studentId: string, field: 'objMarks' | 'subMarks', value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setMarksData(prev => {
        const record = prev[studentId] || createEmptyRecord(studentId);
        const updated = { 
            ...record, 
            [field]: isNaN(numValue) ? 0 : numValue, 
            objMaxMarks: localMaxObj, 
            subMaxMarks: localMaxSubj, 
            examId: selectedExamId, 
            subjectId: selectedSubjectId 
        };
        
        const totalObt = (updated.objMarks || 0) + (updated.subMarks || 0);
        const totalMax = localMaxObj + localMaxSubj;
        const pct = totalMax > 0 ? (totalObt / totalMax) * 100 : 0;
        updated.grade = pct >= 33 ? 'Pass' : 'Fail';
        
        return { ...prev, [studentId]: updated };
    });
  };

  const handleSave = async () => {
    if (!selectedExamId || !selectedSubjectId || !selectedClassId) {
        showToast("Complete selection first", "error");
        return;
    }
    
    setSaving(true);
    try {
        // We save the marks specifically for the students in this class/exam/subject
        const recordsToSave = filteredStudents.map(s => {
            const record = marksData[s.id] || createEmptyRecord(s.id);
            return { 
                ...record, 
                objMaxMarks: localMaxObj, 
                subMaxMarks: localMaxSubj, 
                examId: selectedExamId, 
                subjectId: selectedSubjectId 
            };
        });
        
        await DataService.bulkUpdateMarks(recordsToSave);
        showToast("Marks saved successfully!", 'success');
        await loadMarks();
    } catch(e: any) { 
      showToast(`Save failed: ${e.message}`, 'error'); 
    } finally { 
      setSaving(false); 
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <Calculator className="text-indigo-600 dark:text-indigo-400" /> Marks Entry Module
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Add or modify student results per class and term.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving || loading} 
          className="flex items-center gap-2 bg-indigo-950 dark:bg-indigo-600 hover:bg-indigo-900 dark:hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-xl shadow-violet-200 dark:shadow-none transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
          {saving ? 'Saving...' : 'Finalize & Save Marks'}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
           <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Calendar size={12} /> 1. Select Exam Term
           </label>
           <select 
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-white" 
              value={selectedExamId} 
              onChange={(e) => setSelectedExamId(e.target.value)}
           >
             {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
           </select>
        </div>
        <div>
           <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
              <GraduationCap size={12} /> 2. Class Selection
           </label>
           <select 
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-white" 
              value={selectedClassId} 
              onChange={(e) => setSelectedClassId(e.target.value)}
           >
             <option value="" disabled>Choose Class...</option>
             {classes.map(c => <option key={c.id} value={c.id}>{c.className} - {c.section}</option>)}
           </select>
        </div>
        <div>
           <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
              <BookOpen size={12} /> 3. Subject Module
           </label>
           <div className="relative group">
              <select 
                disabled={user.role === 'Teacher'} 
                className={clsx(
                    "w-full border rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold appearance-none", 
                    user.role === 'Teacher' ? "bg-slate-100 dark:bg-slate-900/50 text-slate-500 border-slate-200 dark:border-slate-800" : "bg-slate-50 dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 border-slate-200 dark:border-slate-700"
                )} 
                value={selectedSubjectId} 
                onChange={(e) => setSelectedSubjectId(e.target.value)}
              >
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
              {user.role === 'Teacher' && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={14} /></div>}
           </div>
        </div>
      </div>

      <div className="bg-indigo-600 dark:bg-indigo-900 p-6 rounded-2xl text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10"><Info className="text-white" /></div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Max Marks (Per Class/Term)</h3>
                <p className="text-indigo-100 dark:text-indigo-300 text-xs">These values apply only to the selected Class and Exam.</p>
              </div>
          </div>
          <div className="flex gap-4 items-center relative z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-indigo-200 dark:text-indigo-300 mb-1">Objective Max</span>
                <input 
                  type="number" 
                  className="w-24 bg-white/10 border border-white/20 rounded-xl p-2 text-center text-xl font-black text-white focus:bg-white focus:text-indigo-600 outline-none transition-all" 
                  value={localMaxObj} 
                  onChange={(e) => setLocalMaxObj(parseInt(e.target.value) || 0)} 
                />
              </div>
              <div className="text-xl opacity-40 font-black mt-4">+</div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-indigo-200 dark:text-indigo-300 mb-1">Subjective Max</span>
                <input 
                  type="number" 
                  className="w-24 bg-white/10 border border-white/20 rounded-xl p-2 text-center text-xl font-black text-white focus:bg-white focus:text-indigo-600 outline-none transition-all" 
                  value={localMaxSubj} 
                  onChange={(e) => setLocalMaxSubj(parseInt(e.target.value) || 0)} 
                />
              </div>
              <div className="text-xl opacity-40 font-black mt-4">=</div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-indigo-200 dark:text-indigo-300 mb-1">Class Total</span>
                <div className="w-24 bg-white/20 rounded-xl p-2 text-center text-xl font-black backdrop-blur-sm">{localMaxObj + localMaxSubj}</div>
              </div>
          </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden relative">
         {loading && <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} /></div>}
         <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-200 dark:border-slate-800">
                        <th className="px-6 py-4">Student Information</th>
                        <th className="px-6 py-4 text-center">Obj. Obtained</th>
                        <th className="px-6 py-4 text-center">Subj. Obtained</th>
                        <th className="px-6 py-4 text-center">Grand Total</th>
                        <th className="px-6 py-4 text-center">Result Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStudents.length === 0 ? ( 
                        <tr>
                            <td colSpan={5} className="p-20 text-center text-slate-400">
                                <div className="flex flex-col items-center gap-2">
                                    <GraduationCap size={40} className="opacity-20" />
                                    <p>Please select a class to view students.</p>
                                </div>
                            </td>
                        </tr> 
                    ) : (
                      filteredStudents.map(student => {
                        const record = marksData[student.id] || createEmptyRecord(student.id);
                        const totalObtained = (record.objMarks || 0) + (record.subMarks || 0);
                        const totalMax = localMaxObj + localMaxSubj;
                        const isPass = (totalMax > 0 ? (totalObtained / totalMax) * 100 : 0) >= 33;
                        const isObjInvalid = (record.objMarks || 0) > localMaxObj;
                        const isSubInvalid = (record.subMarks || 0) > localMaxSubj;
                        
                        return (
                            <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 shadow-sm">
                                            <img src={student.avatarUrl} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{student.fullName}</div>
                                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-tighter">{student.rollNumber}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="relative max-w-[120px] mx-auto group/input">
                                        <input 
                                            type="number" 
                                            className={clsx(
                                                "w-full p-2.5 rounded-xl border text-center font-black text-lg outline-none transition-all", 
                                                isObjInvalid ? "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 ring-2 ring-red-500/20" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400"
                                            )} 
                                            value={record.objMarks || ''} 
                                            onChange={(e) => handleScoreUpdate(student.id, 'objMarks', e.target.value)} 
                                        />
                                        {isObjInvalid && <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg animate-bounce"><AlertTriangle size={10} /></div>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="relative max-w-[120px] mx-auto group/input">
                                        <input 
                                            type="number" 
                                            className={clsx(
                                                "w-full p-2.5 rounded-xl border text-center font-black text-lg outline-none transition-all", 
                                                isSubInvalid ? "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 ring-2 ring-red-500/20" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400"
                                            )} 
                                            value={record.subMarks || ''} 
                                            onChange={(e) => handleScoreUpdate(student.id, 'subMarks', e.target.value)} 
                                        />
                                        {isSubInvalid && <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg animate-bounce"><AlertTriangle size={10} /></div>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{totalObtained}</span>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">of {totalMax}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className={clsx(
                                        "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm transition-all", 
                                        isPass ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50" : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50"
                                    )}>
                                        {isPass ? <CheckCircle size={14} strokeWidth={3} /> : <AlertTriangle size={14} strokeWidth={3} />}
                                        {isPass ? 'Pass' : 'Fail'}
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