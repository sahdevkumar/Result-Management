import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Student, Exam, Subject, MarkRecord, SchoolClass } from '../types';
import { Printer, Search, Trophy, Medal, Star } from 'lucide-react';
import { useToast } from '../components/ToastContext';

export const ScoreCard: React.FC = () => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentMarks, setStudentMarks] = useState<MarkRecord[]>([]);
  
  const { showToast } = useToast();

  // Load initial data
  useEffect(() => {
    const init = async () => {
      try {
        const [c, e, s] = await Promise.all([
            DataService.getClasses(),
            DataService.getExams(),
            DataService.getSubjects()
        ]);
        setClasses(c);
        setExams(e);
        setSubjects(s);
        if(c.length > 0) setSelectedClassId(c[0].id);
      } catch(e) {
        showToast("Failed to load metadata", 'error');
      }
    };
    init();
  }, []);

  // Load students when class changes
  useEffect(() => {
    if(!selectedClassId) return;
    const loadStudents = async () => {
        const allStudents = await DataService.getStudents();
        const cls = classes.find(c => c.id === selectedClassId);
        if(cls) {
            setStudents(allStudents.filter(s => s.className === cls.className && s.section === cls.section));
        } else {
            setStudents([]);
        }
    };
    loadStudents();
  }, [selectedClassId, classes]);

  // Load marks when student changes
  useEffect(() => {
    if(!selectedStudentId) return;
    const loadMarks = async () => {
        try {
            const marks = await DataService.getStudentHistory(selectedStudentId);
            setStudentMarks(marks);
        } catch(e) {
            showToast("Failed to load student history", 'error');
        }
    };
    loadMarks();
  }, [selectedStudentId]);

  const currentStudent = students.find(s => s.id === selectedStudentId);

  // Helper to get mark for grid
  const getMark = (examId: string, subjectId: string, type: 'Objective' | 'Subjective') => {
      const record = studentMarks.find(m => m.examId === examId && m.subjectId === subjectId && m.assessmentType === type);
      if (record) {
          return record.attended ? record.obtainedMarks : 'A';
      }
      return 'A';
  };

  // Helper to get remark for a subject
  const getRemark = (subjectId: string) => {
      const records = studentMarks.filter(m => m.subjectId === subjectId && m.remarks);
      for (let i = exams.length - 1; i >= 0; i--) {
          const exam = exams[i];
          const record = records.find(r => r.examId === exam.id);
          if (record && record.remarks) return record.remarks;
      }
      return '';
  };

  const getSubMax = (subjectId: string) => {
      const sub = subjects.find(s => s.id === subjectId);
      return sub ? Math.round(sub.maxMarks / 2) : 50;
  };

  // Calculate Stats
  const calculateSubjectStats = (subjectId: string) => {
      const sub = subjects.find(s => s.id === subjectId);
      if (!sub) return { percentage: '0.0', grade: 'F' };

      let totalObtained = 0;
      let totalMax = 0;

      exams.forEach(exam => {
          const subjMark = studentMarks.find(m => m.examId === exam.id && m.subjectId === subjectId && m.assessmentType === 'Subjective');
          const objMark = studentMarks.find(m => m.examId === exam.id && m.subjectId === subjectId && m.assessmentType === 'Objective');

          if (subjMark && subjMark.attended) totalObtained += subjMark.obtainedMarks;
          if (objMark && objMark.attended) totalObtained += objMark.obtainedMarks;

          totalMax += sub.maxMarks;
      });

      const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
      
      let grade = 'F';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B';
      else if (percentage >= 60) grade = 'C';
      else if (percentage >= 50) grade = 'D';
      else if (percentage >= 40) grade = 'E';

      return { percentage: percentage.toFixed(1), grade };
  };

  // Calculate overall performance
  const calculateOverall = () => {
    if (subjects.length === 0) return { totalPct: '0.0', overallGrade: 'N/A' };
    
    let totalPctSum = 0;
    subjects.forEach(s => {
       const stats = calculateSubjectStats(s.id);
       totalPctSum += parseFloat(stats.percentage);
    });
    
    const avgPct = totalPctSum / subjects.length;
    let grade = 'F';
    if (avgPct >= 90) grade = 'A+';
    else if (avgPct >= 80) grade = 'A';
    else if (avgPct >= 70) grade = 'B';
    else if (avgPct >= 60) grade = 'C';
    else if (avgPct >= 50) grade = 'D';
    else if (avgPct >= 40) grade = 'E';
    
    return { totalPct: avgPct.toFixed(1), overallGrade: grade };
  };
  
  const overallStats = calculateOverall();

  return (
    <div className="space-y-8 print:space-y-0">
      <div className="flex flex-col md:flex-row justify-between items-center print:hidden gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Academic Score Card</h1>
            <p className="text-slate-500">Generate and print official student performance reports</p>
        </div>
        <button 
            onClick={() => window.print()} 
            disabled={!currentStudent}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Printer size={20} /> <span className="font-semibold">Print Report</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print:hidden flex flex-col md:flex-row gap-6 items-end">
         <div className="w-full md:w-64">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Select Class</label>
            <div className="relative">
                <select 
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-8 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                >
                    {classes.map(c => <option key={c.id} value={c.id}>{c.className} - {c.section}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
            </div>
         </div>
         <div className="w-full md:w-80">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Select Student</label>
            <div className="relative">
                <select 
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-8 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                    <option value="">Select Student...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.rollNumber})</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
            </div>
         </div>
      </div>

      {/* REPORT AREA - Premium Design */}
      {currentStudent ? (
          <div 
            className="relative bg-white shadow-2xl mx-auto overflow-hidden print:shadow-none print:m-0 print:w-full print:h-auto print:max-w-none print:overflow-visible" 
            style={{ 
                // We use inline styles for screen preview dimensions
                // For print, we essentially let CSS overrides handle it (see className above)
                maxWidth: '210mm', 
                minHeight: '297mm' 
            }}
          >
             
             {/* Decorative Border Container */}
             <div className="absolute inset-0 border-[12px] border-double border-slate-200 m-2 pointer-events-none z-10 print:border-slate-300"></div>
             
             {/* Watermark */}
             <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                 <Trophy size={400} />
             </div>

             <div className="relative z-20 p-12 h-full flex flex-col print:h-auto">
                
                {/* HEADER */}
                <header className="border-b-2 border-indigo-900 pb-6 mb-8 print:border-black">
                    <div className="flex justify-between items-end">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-indigo-900 text-white flex items-center justify-center rounded-lg shadow-lg print:shadow-none print:border print:border-black print:text-black print:bg-transparent">
                                <Trophy size={40} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-serif font-bold text-indigo-900 leading-none mb-1 print:text-black">UNACADEMY</h1>
                                <p className="text-sm font-bold text-slate-500 tracking-[0.3em] uppercase print:text-slate-600">Excellence in Education</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="inline-block bg-indigo-50 px-4 py-1 rounded-full border border-indigo-100 mb-2 print:border-black print:bg-transparent">
                                <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider print:text-black">Report Card</span>
                             </div>
                             <p className="font-serif text-lg text-slate-800 font-bold">Samastipur Branch</p>
                             <p className="text-xs text-slate-500">Academic Year: {new Date().getFullYear()}</p>
                        </div>
                    </div>
                </header>

                {/* STUDENT DETAILS */}
                <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-200 print:bg-transparent print:border-slate-300">
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                        <div className="flex items-baseline gap-2">
                            <span className="text-xs font-bold text-slate-500 uppercase w-24">Student Name</span>
                            <span className="font-serif text-lg font-bold text-slate-800 border-b border-slate-300 flex-1">{currentStudent.fullName}</span>
                        </div>
                         <div className="flex items-baseline gap-2">
                            <span className="text-xs font-bold text-slate-500 uppercase w-24">Roll Number</span>
                            <span className="font-mono text-lg font-bold text-slate-800 border-b border-slate-300 flex-1">{currentStudent.rollNumber}</span>
                        </div>
                         <div className="flex items-baseline gap-2">
                            <span className="text-xs font-bold text-slate-500 uppercase w-24">Class / Sec</span>
                            <span className="font-serif text-lg font-bold text-slate-800 border-b border-slate-300 flex-1">{currentStudent.className} - {currentStudent.section}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xs font-bold text-slate-500 uppercase w-24">Guardian</span>
                            <span className="font-serif text-lg font-bold text-slate-800 border-b border-slate-300 flex-1">{currentStudent.guardianName}</span>
                        </div>
                    </div>
                </div>

                {/* MARKS TABLE */}
                <div className="mb-8 flex-1 print:flex-none">
                    <h3 className="text-center font-bold text-indigo-900 uppercase tracking-widest mb-4 flex items-center justify-center gap-2 print:text-black">
                        <Star size={16} className="text-yellow-500 print:text-black" /> Academic Performance <Star size={16} className="text-yellow-500 print:text-black" />
                    </h3>
                    
                    <div className="rounded-lg overflow-hidden border border-slate-300 shadow-sm print:shadow-none">
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr className="bg-indigo-900 text-white print:bg-slate-200 print:text-black">
                                    <th rowSpan={2} className="py-3 px-2 border-r border-indigo-800 text-sm font-bold uppercase tracking-wider w-32 print:border-slate-400">Subject</th>
                                    <th rowSpan={2} className="py-3 px-2 border-r border-indigo-800 text-xs font-bold uppercase tracking-wider w-24 print:border-slate-400">Type</th>
                                    {exams.map(exam => (
                                        <th key={exam.id} colSpan={2} className="py-2 border-r border-indigo-800 border-b border-indigo-800 text-sm font-semibold print:border-slate-400">{exam.name}</th>
                                    ))}
                                    <th colSpan={2} className="py-2 bg-indigo-800 text-sm font-bold uppercase tracking-wider print:bg-slate-300 print:text-black">Result</th>
                                </tr>
                                <tr className="bg-indigo-800 text-white text-[10px] uppercase font-bold print:bg-slate-200 print:text-black">
                                    {exams.map(exam => (
                                        <React.Fragment key={exam.id}>
                                            <th className="py-1 border-r border-indigo-700 w-12 print:border-slate-400">Max</th>
                                            <th className="py-1 border-r border-indigo-700 w-12 print:border-slate-400">Obt</th>
                                        </React.Fragment>
                                    ))}
                                    <th className="py-1 border-r border-indigo-700 w-14 print:border-slate-400">%</th>
                                    <th className="py-1 w-14">Grd</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-medium text-slate-700">
                                {subjects.map((sub, idx) => {
                                    const stats = calculateSubjectStats(sub.id);
                                    const isEven = idx % 2 === 0;
                                    
                                    return (
                                    <React.Fragment key={sub.id}>
                                        {/* Subjective Row */}
                                        <tr className={isEven ? "bg-slate-50 print:bg-transparent" : "bg-white"}>
                                            <td rowSpan={2} className="border-r border-b border-slate-300 font-bold text-indigo-900 text-left px-4 print:text-black">{sub.name}</td>
                                            <td className="border-r border-slate-200 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-wider text-left px-2">Subj</td>
                                            {exams.map(exam => (
                                                <React.Fragment key={exam.id}>
                                                    <td className="border-r border-slate-200 border-b border-slate-200 text-slate-400">{getSubMax(sub.id)}</td>
                                                    <td className="border-r border-slate-300 border-b border-slate-200 font-bold">{getMark(exam.id, sub.id, 'Subjective')}</td>
                                                </React.Fragment>
                                            ))}
                                            
                                            {/* Final Stats (Merged) */}
                                            <td rowSpan={2} className="border-r border-slate-300 border-b border-slate-300 font-bold bg-indigo-50 text-indigo-700 print:bg-transparent print:text-black">{stats.percentage}%</td>
                                            <td rowSpan={2} className="border-b border-slate-300 font-bold bg-indigo-50 text-indigo-900 print:bg-transparent print:text-black">{stats.grade}</td>
                                        </tr>
                                        {/* Objective Row */}
                                        <tr className={isEven ? "bg-slate-50 print:bg-transparent" : "bg-white"}>
                                            <td className="border-r border-slate-300 border-b border-slate-300 text-xs text-slate-500 font-bold uppercase tracking-wider text-left px-2">Obj</td>
                                            {exams.map(exam => (
                                                <React.Fragment key={exam.id}>
                                                     <td className="border-r border-slate-200 border-b border-slate-300 text-slate-400">{getSubMax(sub.id)}</td>
                                                     <td className="border-r border-slate-300 border-b border-slate-300 font-bold">{getMark(exam.id, sub.id, 'Objective')}</td>
                                                </React.Fragment>
                                            ))}
                                        </tr>
                                    </React.Fragment>
                                )})}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* FOOTER SECTION: Remarks & Signatures */}
                <div className="mt-auto">
                    <div className="grid grid-cols-3 gap-6 mb-8">
                         <div className="col-span-2">
                            <h4 className="font-bold text-indigo-900 uppercase text-xs mb-2 border-b border-indigo-200 pb-1 print:text-black print:border-black">Teacher's Remarks</h4>
                            <div className="border border-slate-200 rounded-lg p-0 overflow-hidden print:border-slate-400">
                                {subjects.map((sub, i) => {
                                    const remark = getRemark(sub.id);
                                    if(!remark) return null;
                                    return (
                                        <div key={sub.id} className="flex text-xs border-b border-slate-100 last:border-0 p-2 bg-slate-50 print:bg-transparent print:border-slate-300">
                                            <span className="font-bold w-24 text-slate-600 print:text-black">{sub.name}:</span>
                                            <span className="font-serif italic text-indigo-700 flex-1 print:text-black">{remark}</span>
                                        </div>
                                    )
                                })}
                                {subjects.every(s => !getRemark(s.id)) && (
                                    <div className="p-4 text-center text-slate-400 text-xs italic">No remarks recorded.</div>
                                )}
                            </div>
                         </div>
                         <div className="col-span-1">
                             <h4 className="font-bold text-indigo-900 uppercase text-xs mb-2 border-b border-indigo-200 pb-1 print:text-black print:border-black">Result Summary</h4>
                             <div className="bg-indigo-900 text-white rounded-lg p-4 text-center print:bg-transparent print:text-black print:border print:border-black">
                                 <div className="text-3xl font-bold mb-1">{overallStats.overallGrade}</div>
                                 <div className="text-xs uppercase opacity-70 mb-2">Overall Grade</div>
                                 <div className="text-lg font-bold text-indigo-200 print:text-black">{overallStats.totalPct}%</div>
                                 <div className="text-[10px] uppercase opacity-70">Aggregate</div>
                             </div>
                         </div>
                    </div>

                    <div className="flex justify-between items-end mt-12 pt-4 px-8">
                        <div className="text-center">
                            <div className="w-40 border-b-2 border-slate-400 mb-2"></div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Class Teacher</p>
                        </div>
                        <div className="text-center">
                             <div className="w-24 h-24 absolute left-1/2 -translate-x-1/2 -translate-y-20 opacity-10 print:opacity-100">
                                 <Medal size={96} className="text-slate-200 print:text-black/10" />
                             </div>
                             <p className="text-[10px] text-slate-400 print:text-black">Issued on {new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="text-center">
                            <div className="w-40 border-b-2 border-slate-400 mb-2"></div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Principal</p>
                        </div>
                    </div>
                </div>

             </div>
          </div>
      ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm print:hidden">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-slate-300" size={32} />
             </div>
             <h3 className="text-lg font-bold text-slate-700 mb-1">Select Student</h3>
             <p className="text-slate-400 text-sm">Please select a class and student to generate the report.</p>
          </div>
      )}
    </div>
  );
};