
import React, { useState, useEffect, useRef } from 'react';
import { DataService } from '../services/dataService';
import { Student, Exam, Subject, MarkRecord, SchoolClass } from '../types';
import { Printer, Search, Trophy, Medal, Star, Loader2, Users, CreditCard, RefreshCw, CheckSquare, Square, ArrowLeft, FileText, Download, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import clsx from 'clsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// --- Helper Hook for Score Calculations ---
const useScoreCalculations = (exams: Exam[], subjects: Subject[]) => {
    const getMark = (marks: MarkRecord[], examId: string, subjectId: string, type: 'Objective' | 'Subjective') => {
        // Find record for student, exam and subject (each record holds both components)
        const record = marks.find(m => m.examId === examId && m.subjectId === subjectId);
        if (record) {
            if (!record.attended) return 'AB';
            return type === 'Objective' ? record.objMarks : record.subMarks;
        }
        return '-';
    };

    const getMaxMark = (marks: MarkRecord[], examId: string, subjectId: string, type: 'Objective' | 'Subjective') => {
        const record = marks.find(m => m.examId === examId && m.subjectId === subjectId);
        
        // Priority 1: Use stored max marks from the mark record if available
        if (record) {
            const val = type === 'Objective' ? record.objMaxMarks : record.subMaxMarks;
            // If the record has a valid max mark (legacy data might have 0, so we check)
            if (val !== undefined && val !== null) return val;
        }

        // Priority 2: Fallback to Subject Global Configuration
        const sub = subjects.find(s => s.id === subjectId);
        if (sub) {
            if (type === 'Objective') return sub.maxMarksObjective || 0;
            if (type === 'Subjective') return sub.maxMarksSubjective || 0;
        }
        
        return 0;
    };

    const getRemark = (marks: MarkRecord[], subjectId: string) => {
        const records = marks.filter(m => m.subjectId === subjectId && m.remarks);
        const sortedExams = [...exams].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        for (const exam of sortedExams) {
            const record = records.find(r => r.examId === exam.id);
            if (record && record.remarks) return record.remarks;
        }
        return '';
    };

    const calculateSubjectStats = (marks: MarkRecord[], subjectId: string) => {
        const sub = subjects.find(s => s.id === subjectId);
        if (!sub) return { obtained: 0, max: 0, percentage: '0.0', grade: '-' };
        let totalObtained = 0;
        let totalMax = 0;
        
        exams.forEach(exam => {
            const mark = marks.find(m => m.examId === exam.id && m.subjectId === subjectId);
            
            // Calculate Max for this specific exam instance
            let examObjMax = 0;
            let examSubMax = 0;
            
            if (mark) {
                // Use stored max marks if record exists
                examObjMax = mark.objMaxMarks || 0;
                examSubMax = mark.subMaxMarks || 0;
                
                // Fallback to subject defaults if stored as 0 (legacy data handling)
                if (examObjMax === 0 && examSubMax === 0) {
                    examObjMax = sub.maxMarksObjective || 0;
                    examSubMax = sub.maxMarksSubjective || 0;
                }

                if (mark.attended) {
                    totalObtained += (mark.objMarks + mark.subMarks);
                }
            } else {
                // If no record exists (student absent or entry missing), we still might count the max marks 
                // depending on policy, but usually for "Not Attempted" we might exclude or include.
                // Here we include the max marks based on subject default to show accurate total percentage denominator
                examObjMax = sub.maxMarksObjective || 0;
                examSubMax = sub.maxMarksSubjective || 0;
            }

            totalMax += (examObjMax + examSubMax);
        });

        const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
        let grade = 'F';
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B';
        else if (percentage >= 60) grade = 'C';
        else if (percentage >= 50) grade = 'D';
        else if (percentage >= 40) grade = 'E';
        return { obtained: totalObtained, max: totalMax, percentage: percentage.toFixed(1), grade };
    };

    const calculateOverall = (marks: MarkRecord[]) => {
        if (subjects.length === 0) return { totalPct: '0.0', overallGrade: 'N/A' };
        let grandTotalObtained = 0;
        let grandTotalMax = 0;
        subjects.forEach(s => {
           const stats = calculateSubjectStats(marks, s.id);
           grandTotalObtained += stats.obtained;
           grandTotalMax += stats.max;
        });
        if (grandTotalMax === 0) return { totalPct: '0.0', overallGrade: 'N/A' };
        const avgPct = (grandTotalObtained / grandTotalMax) * 100;
        let grade = 'F';
        if (avgPct >= 90) grade = 'A+';
        else if (avgPct >= 80) grade = 'A';
        else if (avgPct >= 70) grade = 'B';
        else if (avgPct >= 60) grade = 'C';
        else if (avgPct >= 50) grade = 'D';
        else if (avgPct >= 40) grade = 'E';
        return { totalPct: avgPct.toFixed(1), overallGrade: grade };
    };

    return { getMark, getMaxMark, getRemark, calculateSubjectStats, calculateOverall };
};

// --- Reusable Score Card Template Component ---
const ScoreCardTemplate: React.FC<{
    student: Student;
    marks: MarkRecord[];
    exams: Exam[];
    subjects: Subject[];
    helpers: ReturnType<typeof useScoreCalculations>;
    schoolInfo: { name: string, tagline: string, logo: string, watermark: string };
}> = ({ student, marks, exams, subjects, helpers, schoolInfo }) => {
    const overallStats = helpers.calculateOverall(marks);
    const PAGE_WIDTH = 794;
    const PADDING_X = 48; 
    const CONTENT_WIDTH = PAGE_WIDTH - (PADDING_X * 2); 
    const WIDTH_SUBJECT = 180;
    const WIDTH_TYPE = 40;
    const WIDTH_RESULT = 140; 
    const widthForExams = CONTENT_WIDTH - WIDTH_SUBJECT - WIDTH_TYPE - WIDTH_RESULT;
    const examColWidth = exams.length > 0 ? widthForExams / exams.length : 0;

    return (
        <div 
            className="scorecard-page relative bg-white shadow-2xl mx-auto overflow-hidden mb-8" 
            style={{ width: `${PAGE_WIDTH}px`, minHeight: '1123px', fontFamily: '"Times New Roman", Times, serif' }}
        >
             <div className="absolute inset-0 border-[3px] border-indigo-900 m-3 pointer-events-none z-10 rounded-sm"></div>
             <div className="absolute inset-0 border-[1px] border-indigo-900 m-4 pointer-events-none z-10 rounded-sm"></div>

             {schoolInfo.watermark && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-10 grayscale">
                     <img src={schoolInfo.watermark} className="w-[80%] max-h-[80%] object-contain" />
                 </div>
             )}

             <div className="relative z-20 p-12 h-full flex flex-col min-h-[1123px]">
                <header className="flex flex-col items-center mb-8 border-b-2 border-indigo-900 pb-4 bg-white/80 backdrop-blur-sm">
                    <div className="flex items-center gap-6 mb-2">
                         <div className="w-16 h-16 flex items-center justify-center overflow-hidden">
                             {schoolInfo.logo ? <img src={schoolInfo.logo} className="w-full h-full object-contain" /> : <Trophy size={48} className="text-indigo-900" />}
                         </div>
                         <div className="text-center">
                            <h1 className="text-4xl font-bold text-indigo-900 uppercase tracking-wide" style={{ letterSpacing: '2px' }}>{schoolInfo.name || 'UNACADEMY'}</h1>
                            <p className="text-sm font-bold text-slate-600 uppercase tracking-[0.4em]">{schoolInfo.tagline || 'Excellence in Education'}</p>
                         </div>
                    </div>
                    <div className="w-full flex justify-between items-end mt-4 px-4 font-sans text-[10px] text-slate-500">
                        <div className="text-left">
                             <p><strong>Affiliation No:</strong> 2430012</p>
                             <p><strong>School Code:</strong> 15892</p>
                        </div>
                        <div className="text-center">
                             <div className="bg-indigo-900 text-white px-6 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-1">
                                Progress Report
                             </div>
                             <p className="font-bold uppercase">Session: {new Date().getFullYear()}-{new Date().getFullYear()+1}</p>
                        </div>
                        <div className="text-right">
                             <p><strong>Branch:</strong> Samastipur</p>
                             <p><strong>Phone:</strong> +91 98765 43210</p>
                        </div>
                    </div>
                </header>

                <div className="mb-6 border border-slate-300 rounded-lg overflow-hidden font-sans bg-white/60">
                    <div className="grid grid-cols-4 bg-slate-100 border-b border-slate-300">
                        <div className="p-2 border-r border-slate-300 text-xs font-bold text-slate-500 uppercase">Student Name</div>
                        <div className="p-2 border-r border-slate-300 col-span-3 font-bold text-slate-800 text-sm">{student.fullName}</div>
                    </div>
                    <div className="grid grid-cols-4 border-b border-slate-300">
                        <div className="p-2 border-r border-slate-300 bg-slate-100 text-xs font-bold text-slate-500 uppercase">Class / Section</div>
                        <div className="p-2 border-r border-slate-300 font-bold text-slate-800 text-sm">{student.className} - {student.section}</div>
                        <div className="p-2 border-r border-slate-300 bg-slate-100 text-xs font-bold text-slate-500 uppercase">Roll Number</div>
                        <div className="p-2 font-bold text-slate-800 text-sm font-mono">{student.rollNumber}</div>
                    </div>
                </div>

                <div className="mb-8 flex-1 font-sans">
                    <div className="rounded-t-lg bg-indigo-900 text-white p-2 text-center text-sm font-bold uppercase tracking-wider">
                        Scholastic Areas
                    </div>
                    <div className="border-x border-b border-slate-400">
                        <table className="w-full text-center border-collapse table-fixed bg-white/70">
                            <thead>
                                <tr className="bg-slate-100 text-slate-800 text-[10px] font-bold uppercase tracking-wider">
                                    <th style={{width: `${WIDTH_SUBJECT}px`}} rowSpan={2} className="py-2 px-2 border-r border-slate-400">Subject</th>
                                    <th style={{width: `${WIDTH_TYPE}px`}} rowSpan={2} className="py-2 px-1 border-r border-slate-400">Type</th>
                                    {exams.map(exam => (
                                        <th key={exam.id} style={{width: `${examColWidth}px`}} colSpan={2} className="py-1 px-1 border-r border-slate-400 border-b border-slate-400">
                                            {exam.name}
                                        </th>
                                    ))}
                                    <th style={{width: `${WIDTH_RESULT}px`}} colSpan={3} className="py-2 bg-slate-200">Overall</th>
                                </tr>
                                <tr className="bg-slate-50 text-slate-600 text-[9px] uppercase font-bold border-b border-slate-400">
                                    {exams.map(exam => (
                                        <React.Fragment key={exam.id}>
                                            <th className="py-1 border-r border-slate-400">Max</th>
                                            <th className="py-1 border-r border-slate-400">Obt</th>
                                        </React.Fragment>
                                    ))}
                                    <th className="py-1 border-r border-slate-400 bg-slate-100">Total</th>
                                    <th className="py-1 border-r border-slate-400 bg-slate-100">%</th>
                                    <th className="py-1 bg-slate-100">Grd</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs">
                                {subjects.map((sub, idx) => {
                                    const stats = helpers.calculateSubjectStats(marks, sub.id);
                                    return (
                                    <React.Fragment key={sub.id}>
                                        <tr className="border-b border-slate-300">
                                            <td rowSpan={2} className="border-r border-slate-400 font-bold text-left px-3 py-1 align-middle text-black bg-white/50">{sub.name}</td>
                                            <td className="border-r border-slate-400 text-[9px] text-slate-500 font-bold uppercase tracking-wider text-center py-1 bg-slate-50/50">SUB</td>
                                            {exams.map(exam => (
                                                <React.Fragment key={exam.id}>
                                                    <td className="border-r border-slate-300 text-slate-400 py-1">{helpers.getMaxMark(marks, exam.id, sub.id, 'Subjective')}</td>
                                                    <td className="border-r border-slate-400 font-bold py-1 text-black">{helpers.getMark(marks, exam.id, sub.id, 'Subjective')}</td>
                                                </React.Fragment>
                                            ))}
                                            <td rowSpan={2} className="border-r border-slate-400 font-bold text-slate-800 align-middle bg-slate-100/30">{stats.obtained} / {stats.max}</td>
                                            <td rowSpan={2} className="border-r border-slate-400 font-bold text-indigo-800 align-middle bg-slate-100/30">{stats.percentage}%</td>
                                            <td rowSpan={2} className="font-bold text-indigo-900 align-middle bg-slate-100/30">{stats.grade}</td>
                                        </tr>
                                        <tr className="border-b border-slate-400">
                                            <td className="border-r border-slate-400 text-[9px] text-slate-500 font-bold uppercase tracking-wider text-center py-1 bg-slate-50/50">OBJ</td>
                                            {exams.map(exam => (
                                                <React.Fragment key={exam.id}>
                                                     <td className="border-r border-slate-300 text-slate-400 py-1">{helpers.getMaxMark(marks, exam.id, sub.id, 'Objective')}</td>
                                                     <td className="border-r border-slate-400 font-bold py-1 text-black">{helpers.getMark(marks, exam.id, sub.id, 'Objective')}</td>
                                                </React.Fragment>
                                            ))}
                                        </tr>
                                    </React.Fragment>
                                )})}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-auto font-sans">
                    <div className="grid grid-cols-2 gap-8 mb-8">
                         <div className="border border-slate-300 rounded-lg p-3 bg-white/80 min-h-[100px]">
                            <h4 className="font-bold text-indigo-900 uppercase text-xs mb-2 border-b border-indigo-200 pb-1">Remarks</h4>
                            <div className="text-sm italic text-slate-600">
                                {subjects.map(s => {
                                    const r = helpers.getRemark(marks, s.id);
                                    return r ? <div key={s.id}><span className="font-bold text-xs">{s.name}:</span> {r}</div> : null;
                                })}
                                {!subjects.some(s => helpers.getRemark(marks, s.id)) && "Progressing well. Consistent efforts will lead to better results."}
                            </div>
                         </div>
                         <div>
                             <div className="bg-slate-100/80 rounded-lg p-4 border border-slate-300 text-center">
                                 <div className="text-xs uppercase text-slate-500 font-bold mb-1">Final Result</div>
                                 <div className="text-4xl font-bold text-indigo-900 mb-2">{overallStats.overallGrade}</div>
                                 <div className="flex justify-center gap-4 text-sm font-bold text-slate-700 border-t border-slate-300 pt-2">
                                     <span>Percentage: {overallStats.totalPct}%</span>
                                     <span>Status: {overallStats.overallGrade === 'F' ? 'Fail' : 'Pass'}</span>
                                 </div>
                             </div>
                         </div>
                    </div>
                    <div className="flex justify-between items-end pt-8 pb-4 px-4">
                        <div className="text-center"><div className="w-40 border-b border-slate-400 mb-1"></div><p className="text-[10px] font-bold text-slate-500 uppercase">Class Teacher</p></div>
                        <div className="text-center"><div className="w-40 border-b border-slate-400 mb-1"></div><p className="text-[10px] font-bold text-slate-500 uppercase">Principal</p></div>
                         <div className="text-center"><div className="w-40 border-b border-slate-400 mb-1"></div><p className="text-[10px] font-bold text-slate-500 uppercase">Parent</p></div>
                    </div>
                </div>
             </div>
        </div>
    );
};


export const ScoreCard: React.FC = () => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolInfo, setSchoolInfo] = useState({ name: 'UNACADEMY', tagline: 'Excellence in Education', logo: '', watermark: '' });
  
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentMarks, setStudentMarks] = useState<MarkRecord[]>([]);
  
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [bulkViewMode, setBulkViewMode] = useState<'selection' | 'preview'>('selection');
  const [bulkSelection, setBulkSelection] = useState<Set<string>>(new Set());
  const [bulkMarks, setBulkMarks] = useState<Record<string, MarkRecord[]>>({});
  const [loadingBulk, setLoadingBulk] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  const { showToast } = useToast();
  const helpers = useScoreCalculations(exams, subjects);
  const reportContainerRef = useRef<HTMLDivElement>(null);

  const currentStudent = students.find(s => s.id === selectedStudentId);

  const toggleSelectAll = () => {
      if (bulkSelection.size === students.length) {
          setBulkSelection(new Set());
      } else {
          setBulkSelection(new Set(students.map(s => s.id)));
      }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [c, e, s, info] = await Promise.all([ 
            DataService.getClasses(), 
            DataService.getExams(), 
            DataService.getSubjects(),
            DataService.getSchoolInfo() 
        ]);
        setClasses(c);
        setExams(e);
        setSubjects(s);
        setSchoolInfo(info);
        if(c.length > 0) setSelectedClassId(c[0].id);
      } catch(e) {
        showToast("Failed to load metadata", 'error');
      }
    };
    init();
  }, []);

  useEffect(() => {
    if(!selectedClassId) return;
    const loadStudents = async () => {
        const allStudents = await DataService.getStudents();
        const cls = classes.find(c => c.id === selectedClassId);
        if(cls) {
            const filtered = allStudents.filter(s => s.className === cls.className && s.section === cls.section);
            setStudents(filtered);
            setBulkSelection(new Set(filtered.map(s => s.id)));
        } else {
            setStudents([]);
            setBulkSelection(new Set());
        }
        setSelectedStudentId('');
        setBulkMarks({});
        setBulkViewMode('selection');
    };
    loadStudents();
  }, [selectedClassId, classes]);

  useEffect(() => {
    if(!selectedStudentId) return;
    const loadMarks = async () => {
        try {
            const marks = await DataService.getStudentHistory(selectedStudentId);
            setStudentMarks(marks);
        } catch(e) {
            showToast("Failed to load marks", 'error');
        }
    };
    loadMarks();
  }, [selectedStudentId]);

  const handleGeneratePreview = async () => {
      if (bulkSelection.size === 0) { showToast("Select at least one student", 'error'); return; }
      setLoadingBulk(true);
      try {
          const marksData: Record<string, MarkRecord[]> = {};
          const selectedStudents = students.filter(s => bulkSelection.has(s.id));
          await Promise.all(selectedStudents.map(async (student) => {
              const history = await DataService.getStudentHistory(student.id);
              marksData[student.id] = history;
          }));
          setBulkMarks(marksData);
          setBulkViewMode('preview');
      } catch (e) { showToast("Failed to load bulk data", 'error'); } finally { setLoadingBulk(false); }
  };

  const handleDownloadPDF = async () => {
      if (!reportContainerRef.current) return;
      setDownloading(true);
      try {
          const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
          const pages = reportContainerRef.current.querySelectorAll('.scorecard-page');
          const pdfWidth = doc.internal.pageSize.getWidth();
          const pdfHeight = doc.internal.pageSize.getHeight();

          for (let i = 0; i < pages.length; i++) {
              if (i > 0) doc.addPage();
              const pageEl = pages[i] as HTMLElement;
              const canvas = await html2canvas(pageEl, { scale: 3, useCORS: true, logging: false, width: 794, height: 1123 });
              const imgData = canvas.toDataURL('image/jpeg', 0.9);
              doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          }
          doc.save(`Score_Cards_${new Date().getTime()}.pdf`);
          showToast("PDF generated", 'success');
      } catch (e) { showToast("PDF Error", 'error'); } finally { setDownloading(false); }
  };

  return (
    <div className="space-y-8 no-print-space">
      <div className="flex flex-col md:flex-row justify-between items-center no-print gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Academic Score Card</h1>
            <p className="text-slate-500">Official student performance reports</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
            <button onClick={() => setActiveTab('single')} className={clsx("px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2", activeTab === 'single' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50")}>Single</button>
            <button onClick={() => setActiveTab('bulk')} className={clsx("px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2", activeTab === 'bulk' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50")}>Bulk</button>
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
          <div className="flex items-center gap-4 flex-wrap">
               <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.className} - {c.section}</option>)}
               </select>
               {activeTab === 'single' && (
                   <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                        <option value="">Select Student...</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                   </select>
               )}
          </div>
          <div className="flex gap-3">
              {activeTab === 'bulk' && bulkViewMode === 'selection' ? (
                  <button onClick={handleGeneratePreview} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">Preview All</button>
              ) : (
                  <>
                    <button onClick={handleDownloadPDF} disabled={downloading} className="bg-slate-100 px-4 py-2 rounded-xl flex items-center gap-2">{downloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} PDF</button>
                    <button onClick={() => window.print()} className="bg-slate-800 text-white px-6 py-2 rounded-xl flex items-center gap-2"><Printer size={18} /> Print</button>
                  </>
              )}
          </div>
      </div>

      <div ref={reportContainerRef} className="flex justify-center">
        {activeTab === 'single' ? (
            currentStudent && <ScoreCardTemplate student={currentStudent} marks={studentMarks} exams={exams} subjects={subjects} helpers={helpers} schoolInfo={schoolInfo} />
        ) : (
            bulkViewMode === 'selection' ? (
                <div className="w-full bg-white rounded-xl border border-slate-200 p-4 no-print">
                    <div className="flex justify-between mb-4"><h3 className="font-bold">Select Students</h3><button onClick={toggleSelectAll} className="text-blue-600 text-xs font-bold">Toggle All</button></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {students.map(s => (
                            <div key={s.id} onClick={() => { const n = new Set(bulkSelection); if(n.has(s.id)) n.delete(s.id); else n.add(s.id); setBulkSelection(n); }} className={clsx("p-3 border rounded-lg cursor-pointer flex items-center gap-3", bulkSelection.has(s.id) ? "bg-indigo-50 border-indigo-200" : "bg-white")}>
                                {bulkSelection.has(s.id) ? <CheckSquare className="text-indigo-600" /> : <Square />} {s.fullName}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    {students.filter(s => bulkSelection.has(s.id)).map(s => (
                        <ScoreCardTemplate key={s.id} student={s} marks={bulkMarks[s.id] || []} exams={exams} subjects={subjects} helpers={helpers} schoolInfo={schoolInfo} />
                    ))}
                </div>
            )
        )}
      </div>
    </div>
  );
};
