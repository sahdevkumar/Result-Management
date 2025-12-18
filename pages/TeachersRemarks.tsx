import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Exam, Subject, Student, SchoolClass } from '../types';
import { Save, MessageSquareQuote } from 'lucide-react';
import { useToast } from '../components/ToastContext';

export const TeachersRemarks: React.FC = () => {
  // Selection State
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  
  // Data State
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  // Store remarks as simple key-value: studentId -> remark string
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
        setSubjects(sData);
        setClasses(cData);
        setStudents(stData);
        
        // Initial defaults
        if(eData.length > 0) setSelectedExamId(eData[0].id);
        if(cData.length > 0) setSelectedClassId(cData[0].id);
        if(sData.length > 0) setSelectedSubjectId(sData[0].id);
      } catch (err: any) {
        showToast("Failed to load initial data", 'error');
      }
    };
    init();
  }, []);

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
    setRemarksMap(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  const handleSave = async () => {
    if (!selectedExamId || !selectedSubjectId) {
        showToast("Please select exam and subject", 'error');
        return;
    }
    setSaving(true);
    try {
        // Save all remarks that are present in the map
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

  // Filter students based on selected class
  const filteredStudents = students.filter(student => {
    if (!selectedClassId) return true; 
    if (!currentClass) return true;
    return student.className === currentClass.className && student.section === currentClass.section;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Teacher's Remark</h1>
            <p className="text-slate-500 text-sm">Add subject-wise performance feedback</p>
        </div>
        <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
        >
          {saving ? 'Saving...' : <><Save size={18} /> Save Remarks</>}
        </button>
      </div>

      {/* Selectors */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            
            {/* 1. Exam */}
            <div className="relative group">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">1. Select Exam</label>
               <select 
                className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 hover:bg-white transition-colors cursor-pointer text-slate-700"
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
                className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 hover:bg-white transition-colors cursor-pointer text-slate-700"
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
                className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 hover:bg-white transition-colors cursor-pointer text-slate-700"
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
         <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
             <h3 className="font-bold text-slate-700 flex items-center gap-2">
                 <MessageSquareQuote size={18} className="text-indigo-600"/>
                 Remarks for <span className="text-indigo-600">{currentSubject?.name}</span>
             </h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-white text-slate-600 text-xs uppercase font-bold tracking-wider border-b border-slate-200">
                        <th className="px-6 py-4 w-1/4">Student</th>
                        <th className="px-4 py-4 w-3/4">Teacher's Remark</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                         <tr><td colSpan={2} className="p-8 text-center text-slate-500">Loading student list...</td></tr>
                    ) : filteredStudents.length === 0 ? (
                         <tr><td colSpan={2} className="p-8 text-center text-slate-500">No students found for selection.</td></tr>
                    ) : (
                        filteredStudents.map(student => {
                            const remark = remarksMap[student.id] || '';

                            return (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                                <img src={student.avatarUrl} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-800 text-sm">{student.fullName}</div>
                                                <div className="text-xs text-slate-500">{student.rollNumber}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="space-y-2">
                                            <textarea 
                                                className="w-full p-3 border border-slate-300 rounded-lg text-sm transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white resize-y min-h-[60px] text-slate-900"
                                                value={remark}
                                                onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                                                placeholder="Enter remarks..."
                                                rows={2}
                                            />
                                            <div className="flex flex-wrap gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                {commonRemarks.map((rem, idx) => (
                                                    <button 
                                                        key={idx}
                                                        onClick={() => handleRemarkChange(student.id, rem)}
                                                        className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-full text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
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