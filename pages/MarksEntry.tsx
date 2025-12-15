import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Exam, Subject, Student, MarkRecord, SchoolClass } from '../types';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

export const MarksEntry: React.FC = () => {
  // Selection State
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  
  // Data State
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [marksData, setMarksData] = useState<Record<string, MarkRecord>>({});
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
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
      if(sData.length > 0) setSelectedSubjectId(sData[0].id);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedExamId && selectedSubjectId) {
      loadMarks();
    }
  }, [selectedExamId, selectedSubjectId]);

  const loadMarks = async () => {
    setLoading(true);
    try {
      const records = await DataService.getMarks(selectedExamId, selectedSubjectId);
      const marksMap: Record<string, MarkRecord> = {};
      records.forEach(r => {
        marksMap[r.studentId] = r;
      });
      setMarksData(marksMap);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId: string, field: 'theory' | 'practical', value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    const currentMark = marksData[studentId] || {
      studentId,
      examId: selectedExamId,
      subjectId: selectedSubjectId,
      theory: 0,
      practical: 0,
      assignment: 0,
      total: 0,
      grade: 'F',
      attended: true
    };

    const updatedMark = {
      ...currentMark,
      [field]: isNaN(numValue) ? 0 : numValue
    };
    
    // Auto Calc Total
    updatedMark.total = updatedMark.theory + updatedMark.practical + updatedMark.assignment;
    
    setMarksData(prev => ({
      ...prev,
      [studentId]: updatedMark
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
        const promises = (Object.values(marksData) as MarkRecord[]).map(record => DataService.updateMark(record));
        await Promise.all(promises);
        alert("Marks saved successfully!");
    } catch(e) {
        alert("Error saving marks");
    } finally {
        setSaving(false);
    }
  };

  const currentSubject = subjects.find(s => s.id === selectedSubjectId);
  const currentClass = classes.find(c => c.id === selectedClassId);

  // Filter students based on selected class
  const filteredStudents = students.filter(student => {
    if (!selectedClassId) return true; // Show all if no class selected
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
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Select Exam</label>
          <select 
            className="w-full rounded-lg border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
          >
            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Select Subject</label>
          <select 
            className="w-full rounded-lg border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
          >
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} (Max: {s.maxMarks})</option>)}
          </select>
        </div>
         <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Class</label>
          <select 
            className="w-full rounded-lg border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option value="">All Students</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.className} - {c.section}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-bold tracking-wider border-b border-slate-200">
                        <th className="px-6 py-4 w-64">Student</th>
                        <th className="px-4 py-4 w-32">Theory (80)</th>
                        <th className="px-4 py-4 w-32">Practical (20)</th>
                        <th className="px-4 py-4 w-32">Total</th>
                        <th className="px-4 py-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                         <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading student list...</td></tr>
                    ) : filteredStudents.length === 0 ? (
                         <tr><td colSpan={5} className="p-8 text-center text-slate-500">No students found for selection.</td></tr>
                    ) : (
                        filteredStudents.map(student => {
                            const mark = marksData[student.id] || { theory: 0, practical: 0, total: 0 };
                            const maxTheory = (currentSubject?.maxMarks || 100) * 0.8;
                            const maxPrac = (currentSubject?.maxMarks || 100) * 0.2;
                            const isFail = mark.total < (currentSubject?.passMarks || 40);

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
                                    <td className="px-4 py-3">
                                        <input 
                                            type="number" 
                                            className={clsx(
                                                "w-full p-2 border rounded-md text-sm transition-all focus:ring-2 focus:outline-none",
                                                mark.theory > maxTheory ? "border-red-500 bg-red-50 focus:ring-red-200" : "border-slate-300 focus:ring-indigo-500"
                                            )}
                                            max={maxTheory}
                                            value={mark.theory || ''}
                                            onChange={(e) => handleMarkChange(student.id, 'theory', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                         <input 
                                            type="number" 
                                            className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            max={maxPrac}
                                            value={mark.practical || ''}
                                            onChange={(e) => handleMarkChange(student.id, 'practical', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className={clsx("font-bold text-lg", isFail ? "text-red-500" : "text-green-600")}>
                                            {mark.total}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {isFail ? (
                                            <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full w-fit">
                                                <AlertCircle size={12} /> Fail
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full w-fit">
                                                <CheckCircle size={12} /> Pass
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