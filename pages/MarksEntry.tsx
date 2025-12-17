import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Exam, Subject, Student, MarkRecord, SchoolClass, AssessmentType } from '../types';
import { Save, AlertCircle, CheckCircle, ChevronRight, Info } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import clsx from 'clsx';

export const MarksEntry: React.FC = () => {
  // Selection State (Flow: Exam > Class > Subject)
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  
  // Data State
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Map: studentId -> { Objective: MarkRecord, Subjective: MarkRecord }
  const [marksData, setMarksData] = useState<Record<string, { Objective: MarkRecord, Subjective: MarkRecord }>>({});
  
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
        
        // Initial defaults
        if(eData.length > 0) setSelectedExamId(eData[0].id);
        if(cData.length > 0) setSelectedClassId(cData[0].id);
        if(sData.length > 0) setSelectedSubjectId(sData[0].id);
      } catch (err) {
        showToast("Failed to load initial data", 'error');
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedExamId && selectedSubjectId) {
      loadMarks();
    }
  }, [selectedExamId, selectedSubjectId]);

  const createEmptyRecord = (studentId: string, type: AssessmentType): MarkRecord => ({
      studentId,
      examId: selectedExamId,
      subjectId: selectedSubjectId,
      assessmentType: type,
      obtainedMarks: 0,
      grade: 'F',
      attended: true
  });

  const loadMarks = async () => {
    setLoading(true);
    try {
      // Fetch all marks for this exam & subject (both Objective and Subjective)
      const records = await DataService.getMarks(selectedExamId, selectedSubjectId);
      
      const marksMap: Record<string, { Objective: MarkRecord, Subjective: MarkRecord }> = {};
      
      // Populate map with existing records
      records.forEach(r => {
        if (!marksMap[r.studentId]) {
            marksMap[r.studentId] = {
                Objective: createEmptyRecord(r.studentId, 'Objective'),
                Subjective: createEmptyRecord(r.studentId, 'Subjective')
            };
        }
        if (r.assessmentType === 'Objective') marksMap[r.studentId].Objective = r;
        if (r.assessmentType === 'Subjective') marksMap[r.studentId].Subjective = r;
      });

      setMarksData(marksMap);
    } catch(e) {
      showToast("Error loading marks", 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateGrade = (total: number, max: number) => {
    if (max <= 0) return 'F';
    const percentage = (total / max) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    if (percentage >= 40) return 'E';
    return 'F';
  };

  const currentSubject = subjects.find(s => s.id === selectedSubjectId);
  const currentClass = classes.find(c => c.id === selectedClassId);

  // Max marks logic
  const subjectTotalMax = currentSubject?.maxMarks || 100;
  const componentMaxMarks = Math.round(subjectTotalMax / 2);

  const handleMarkChange = (studentId: string, type: AssessmentType, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    
    setMarksData(prev => {
        const studentRecords = prev[studentId] || {
            Objective: createEmptyRecord(studentId, 'Objective'),
            Subjective: createEmptyRecord(studentId, 'Subjective')
        };
        
        const currentMark = studentRecords[type];
        
        const updatedMark = {
            ...currentMark,
            examId: selectedExamId, 
            subjectId: selectedSubjectId,
            obtainedMarks: isNaN(numValue) ? 0 : numValue,
            grade: calculateGrade(isNaN(numValue) ? 0 : numValue, componentMaxMarks)
        };

        return {
            ...prev,
            [studentId]: {
                ...studentRecords,
                [type]: updatedMark
            }
        };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
        const allRecords: MarkRecord[] = [];
        Object.values(marksData).forEach(pair => {
            allRecords.push(pair.Objective);
            allRecords.push(pair.Subjective);
        });
        
        const promises = allRecords.map(record => DataService.updateMark(record));
        await Promise.all(promises);
        showToast("Marks saved successfully!", 'success');
    } catch(e) {
        showToast("Error saving marks", 'error');
    } finally {
        setSaving(false);
    }
  };

  // Filter students based on selected class
  const filteredStudents = students.filter(student => {
    if (!selectedClassId) return true; 
    if (!currentClass) return true;
    return student.className === currentClass.className && student.section === currentClass.section;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Marks Entry</h1>
        <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
        >
          {saving ? 'Saving...' : <><Save size={18} /> Save Marks</>}
        </button>
      </div>

      {/* Selectors */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            
            {/* 1. Exam */}
            <div className="relative group">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">1. Select Exam</label>
               <select 
                className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 hover:bg-white transition-colors cursor-pointer"
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
              >
                {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>

            {/* 2. Class */}
            <div className="relative group">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">2. Select Class</label>
              <select 
                className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 hover:bg-white transition-colors cursor-pointer"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.className} - {c.section}</option>)}
              </select>
            </div>

            {/* 3. Subject */}
             <div className="relative group">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">3. Select Subject</label>
              <select 
                className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 hover:bg-white transition-colors cursor-pointer"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
              >
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
         </div>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <h3 className="font-bold text-slate-700">
                 Marks for <span className="text-indigo-600">{currentSubject?.name}</span>
             </h3>
             <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-slate-600">
                    <Info size={14} />
                    <span>Subject Total: <strong>{subjectTotalMax}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-full text-indigo-700 border border-indigo-100">
                    <CheckCircle size={14} />
                    <span>Component Max: <strong>{componentMaxMarks}</strong></span>
                </div>
             </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-white text-slate-600 text-xs uppercase font-bold tracking-wider border-b border-slate-200">
                        <th className="px-6 py-4 w-64">Student</th>
                        <th className="px-4 py-4 w-32">Objective</th>
                        <th className="px-4 py-4 w-32">Subjective</th>
                        <th className="px-4 py-4 w-24">Total</th>
                        <th className="px-4 py-4 w-24">Grade</th>
                        <th className="px-4 py-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                         <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading student list...</td></tr>
                    ) : filteredStudents.length === 0 ? (
                         <tr><td colSpan={6} className="p-8 text-center text-slate-500">No students found for selection.</td></tr>
                    ) : (
                        filteredStudents.map(student => {
                            // Ensure records exist for rendering even if not yet in state
                            const studentRecords = marksData[student.id] || { 
                                Objective: createEmptyRecord(student.id, 'Objective'), 
                                Subjective: createEmptyRecord(student.id, 'Subjective') 
                            };
                            
                            const objMark = studentRecords.Objective.obtainedMarks || 0;
                            const subjMark = studentRecords.Subjective.obtainedMarks || 0;
                            const total = objMark + subjMark;
                            const totalGrade = calculateGrade(total, subjectTotalMax);

                            const isObjOver = objMark > componentMaxMarks;
                            const isSubjOver = subjMark > componentMaxMarks;

                            return (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                                                <img src={student.avatarUrl} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-800 text-sm">{student.fullName}</div>
                                                <div className="text-xs text-slate-500">{student.rollNumber}</div>
                                                <div className="text-[10px] text-slate-400">{student.className}-{student.section}</div>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    {/* Objective Input */}
                                    <td className="px-4 py-3">
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                min="0"
                                                max={componentMaxMarks}
                                                className={clsx(
                                                    "w-full p-2 border rounded-md text-sm transition-all focus:ring-2 focus:outline-none",
                                                    isObjOver ? "border-red-500 bg-red-50 focus:ring-red-200 text-red-700" : "border-slate-300 focus:ring-indigo-500"
                                                )}
                                                value={studentRecords.Objective.obtainedMarks || ''}
                                                onChange={(e) => handleMarkChange(student.id, 'Objective', e.target.value)}
                                                placeholder="0"
                                            />
                                            {isObjOver && (
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none">
                                                    <AlertCircle size={16} />
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Subjective Input */}
                                    <td className="px-4 py-3">
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                min="0"
                                                max={componentMaxMarks}
                                                className={clsx(
                                                    "w-full p-2 border rounded-md text-sm transition-all focus:ring-2 focus:outline-none",
                                                    isSubjOver ? "border-red-500 bg-red-50 focus:ring-red-200 text-red-700" : "border-slate-300 focus:ring-indigo-500"
                                                )}
                                                value={studentRecords.Subjective.obtainedMarks || ''}
                                                onChange={(e) => handleMarkChange(student.id, 'Subjective', e.target.value)}
                                                placeholder="0"
                                            />
                                            {isSubjOver && (
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none">
                                                    <AlertCircle size={16} />
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Total Calculation */}
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-slate-700 text-sm">{total}</div>
                                    </td>

                                    {/* Grade Calculation */}
                                    <td className="px-4 py-3">
                                        <div className={clsx(
                                            "font-bold text-xs inline-block px-2 py-0.5 rounded",
                                            totalGrade === 'F' ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                                        )}>
                                            {totalGrade}
                                        </div>
                                    </td>

                                    <td className="px-4 py-3">
                                        {total > 0 && !isObjOver && !isSubjOver && (
                                            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                                <CheckCircle size={12} /> Ready
                                            </span>
                                        )}
                                        {(isObjOver || isSubjOver) && (
                                             <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                                                <AlertCircle size={12} /> Invalid
                                            </span>
                                        )}
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