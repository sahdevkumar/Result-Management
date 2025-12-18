import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Exam, Subject, Student, MarkRecord, SchoolClass } from '../types';
import { Save, AlertCircle, CheckCircle, Calculator, Info, BookOpen, GraduationCap, Calendar, Loader2 } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import clsx from 'clsx';

export const MarksEntry: React.FC = () => {
  // Selection State
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  
  // Local Max Marks (Global for current subject selection)
  const [localMaxObj, setLocalMaxObj] = useState<number>(0);
  const [localMaxSubj, setLocalMaxSubj] = useState<number>(0);

  // Data State
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Marks logic - Unified map
  const [marksData, setMarksData] = useState<Record<string, MarkRecord>>({});
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

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
        setSubjects(sData);
        setClasses(cData);
        setStudents(stData);
        
        if(eData.length > 0) setSelectedExamId(eData[0].id);
        if(cData.length > 0) setSelectedClassId(cData[0].id);
        if(sData.length > 0) setSelectedSubjectId(sData[0].id);
      } catch (err) {
        showToast("Failed to load initial data", 'error');
      }
    };
    init();
  }, []);

  // Sync Max Marks when subject changes (Default Fallback)
  useEffect(() => {
    const sub = subjects.find(s => s.id === selectedSubjectId);
    if (sub) {
      setLocalMaxObj(sub.maxMarksObjective || 0);
      setLocalMaxSubj(sub.maxMarksSubjective || 0);
    }
  }, [selectedSubjectId, subjects]);

  // Load Marks when exam or subject changes
  useEffect(() => {
    if (selectedExamId && selectedSubjectId) {
      loadMarks();
    }
  }, [selectedExamId, selectedSubjectId]);

  const createEmptyRecord = (studentId: string): MarkRecord => ({
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
  });

  const loadMarks = async () => {
    setLoading(true);
    try {
      const records = await DataService.getMarks(selectedExamId, selectedSubjectId);
      const marksMap: Record<string, MarkRecord> = {};
      
      // If marks exist for this exam/subject, use the stored max marks from the table
      // This overrides the default subject max marks, allowing for exam-specific max marks.
      // We check > 0 to ensure we don't accidentally pull 0s from legacy data or initialized rows
      if (records.length > 0) {
        const firstRecord = records[0];
        if ((firstRecord.objMaxMarks || 0) > 0 || (firstRecord.subMaxMarks || 0) > 0) {
           setLocalMaxObj(firstRecord.objMaxMarks || 0);
           setLocalMaxSubj(firstRecord.subMaxMarks || 0);
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
  };

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
        
        // Auto-calculate grade based on total percentage
        const totalObtained = updated.objMarks + updated.subMarks;
        const totalMax = localMaxObj + localMaxSubj;
        const pct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
        
        updated.grade = pct >= 33 ? 'Pass' : 'Fail';
        
        return { ...prev, [studentId]: updated };
    });
  };

  const handleSave = async () => {
    const currentSubject = subjects.find(s => s.id === selectedSubjectId);
    if (!currentSubject) {
        showToast("Please select a subject first", "error");
        return;
    }

    if (localMaxObj === 0 && localMaxSubj === 0) {
      showToast("Please define Maximum Marks (Objective or Subjective) before saving", "error");
      return;
    }

    setSaving(true);
    try {
        // 1. Update Global Subject Config first (Optional, but keeps global sync)
        await DataService.updateSubject({
            ...currentSubject,
            maxMarksObjective: localMaxObj,
            maxMarksSubjective: localMaxSubj,
            maxMarks: localMaxObj + localMaxSubj
        });

        // 2. Prepare Student Mark Records
        // IMPORTANT: We explicitly include the current localMaxObj/Subj here to ensure
        // the marks table captures the max marks at the time of entry.
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
        
        // 3. Bulk Upsert Marks
        await DataService.bulkUpdateMarks(recordsToSave);
        
        showToast("Marks and Configuration saved successfully!", 'success');
        
        // Refresh local subjects to sync UI
        const sData = await DataService.getSubjects();
        setSubjects(sData);
        // Refresh marks from DB
        await loadMarks();
    } catch(e: any) {
        console.error("Save failed:", e);
        showToast(`Save failed: ${e.message || "Unknown database error"}`, 'error');
    } finally {
        setSaving(false);
    }
  };

  const currentClass = classes.find(c => c.id === selectedClassId);

  const filteredStudents = students.filter(student => {
    if (!selectedClassId || !currentClass) return true;
    return student.className === currentClass.className && student.section === currentClass.section;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
             <Calculator className="text-indigo-600" /> Result Management Entry
          </h1>
          <p className="text-slate-500 text-sm">Select subject and define max marks to begin entry.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving || loading} 
          className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-xl font-bold shadow-xl shadow-slate-200 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
          {saving ? 'Saving...' : 'Finalize & Save Marks'}
        </button>
      </div>

      {/* Top Filter Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Calendar size={12} /> 1. Select Exam Term
           </label>
           <select 
             className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700" 
             value={selectedExamId} 
             onChange={(e) => setSelectedExamId(e.target.value)}
           >
             {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
           </select>
        </div>
        <div>
           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <GraduationCap size={12} /> 2. Class Selection
           </label>
           <select 
             className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700" 
             value={selectedClassId} 
             onChange={(e) => setSelectedClassId(e.target.value)}
           >
             <option value="">All Students</option>
             {classes.map(c => <option key={c.id} value={c.id}>{c.className} - {c.section}</option>)}
           </select>
        </div>
        <div>
           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <BookOpen size={12} /> 3. Subject Module
           </label>
           <select 
             className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-indigo-700" 
             value={selectedSubjectId} 
             onChange={(e) => setSelectedSubjectId(e.target.value)}
           >
             {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
           </select>
        </div>
      </div>

      {/* Configuration Header for Max Marks Entry */}
      <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Info className="text-white" />
              </div>
              <div>
                  <h3 className="font-bold text-lg leading-tight">Define Maximum Marks</h3>
                  <p className="text-indigo-100 text-xs">Set these once per subject before entering student marks.</p>
              </div>
          </div>
          <div className="flex gap-4 items-center">
              <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-indigo-200 mb-1">Objective Max</span>
                  <input 
                    type="number" 
                    className="w-24 bg-white/10 border border-white/20 rounded-xl p-2 text-center text-xl font-black focus:bg-white focus:text-indigo-600 outline-none transition-all"
                    value={localMaxObj}
                    onChange={(e) => setLocalMaxObj(parseInt(e.target.value) || 0)}
                  />
              </div>
              <div className="text-xl opacity-40 font-black mt-4">+</div>
              <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-indigo-200 mb-1">Subjective Max</span>
                  <input 
                    type="number" 
                    className="w-24 bg-white/10 border border-white/20 rounded-xl p-2 text-center text-xl font-black focus:bg-white focus:text-indigo-600 outline-none transition-all"
                    value={localMaxSubj}
                    onChange={(e) => setLocalMaxSubj(parseInt(e.target.value) || 0)}
                  />
              </div>
              <div className="text-xl opacity-40 font-black mt-4">=</div>
              <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-indigo-200 mb-1">Total Limit</span>
                  <div className="w-24 bg-white/20 rounded-xl p-2 text-center text-xl font-black">{localMaxObj + localMaxSubj}</div>
              </div>
          </div>
      </div>

      {/* Entry Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
         {loading && (
             <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                 <div className="flex flex-col items-center gap-2">
                     <Loader2 className="animate-spin text-indigo-600" size={32} />
                     <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Loading Records...</p>
                 </div>
             </div>
         )}
         <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-200">
                        <th className="px-6 py-4">Student Information</th>
                        <th className="px-6 py-4 text-center">Obj. Obtained</th>
                        <th className="px-6 py-4 text-center">Subj. Obtained</th>
                        <th className="px-6 py-4 text-center">Grand Total</th>
                        <th className="px-6 py-4 text-center">Result Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length === 0 ? (
                      <tr><td colSpan={5} className="p-12 text-center text-slate-400 italic font-medium">No students found for this class.</td></tr>
                    ) : (
                      filteredStudents.map(student => {
                        const record = marksData[student.id] || createEmptyRecord(student.id);
                        const totalObtained = (record.objMarks || 0) + (record.subMarks || 0);
                        const totalMax = localMaxObj + localMaxSubj;
                        const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
                        const isPass = percentage >= 33;
                        
                        const isObjInvalid = (record.objMarks || 0) > localMaxObj;
                        const isSubInvalid = (record.subMarks || 0) > localMaxSubj;

                        return (
                            <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-800 text-sm">{student.fullName}</div>
                                    <div className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{student.rollNumber}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="relative max-w-[120px] mx-auto">
                                        <input 
                                            type="number" 
                                            className={clsx(
                                                "w-full p-2.5 rounded-xl border text-center font-black text-lg outline-none transition-all",
                                                isObjInvalid 
                                                  ? "border-red-500 bg-red-50 text-red-600" 
                                                  : "border-slate-200 bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 shadow-sm"
                                            )}
                                            value={record.objMarks || ''}
                                            onChange={(e) => handleScoreUpdate(student.id, 'objMarks', e.target.value)}
                                            placeholder="0"
                                        />
                                        {isObjInvalid && (
                                            <div className="absolute -top-2 -right-1 text-red-500 bg-white rounded-full"><AlertCircle size={14} /></div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="relative max-w-[120px] mx-auto">
                                        <input 
                                            type="number" 
                                            className={clsx(
                                                "w-full p-2.5 rounded-xl border text-center font-black text-lg outline-none transition-all",
                                                isSubInvalid 
                                                  ? "border-red-500 bg-red-50 text-red-600" 
                                                  : "border-slate-200 bg-slate-50 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 shadow-sm"
                                            )}
                                            value={record.subMarks || ''}
                                            onChange={(e) => handleScoreUpdate(student.id, 'subMarks', e.target.value)}
                                            placeholder="0"
                                        />
                                        {isSubInvalid && (
                                            <div className="absolute -top-2 -right-1 text-red-500 bg-white rounded-full"><AlertCircle size={14} /></div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center">
                                      <span className="text-xl font-black text-slate-900 leading-none">{totalObtained}</span>
                                      <span className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase">of {totalMax} ({percentage.toFixed(1)}%)</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className={clsx(
                                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                        isPass 
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                          : "bg-red-50 text-red-700 border-red-100"
                                    )}>
                                        {isPass ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
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

      {/* Pass Criteria Info */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Info size={16} /></div>
              <p className="text-xs text-slate-600">Calculations follow the standard <b>33% passing criteria</b> across combined components.</p>
          </div>
          <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Entry Status</p>
              <p className="text-xs font-black text-slate-800">{Object.keys(marksData).length} / {filteredStudents.length} Students Record Prepared</p>
          </div>
      </div>
    </div>
  );
};