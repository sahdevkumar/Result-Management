import React, { useState, useEffect, useRef } from 'react';
import { DataService } from '../services/dataService';
import { Student, Exam, Subject, MarkRecord, SchoolClass } from '../types';
import { Printer, Search, Trophy, Medal, Star, Loader2, Users, CreditCard, RefreshCw, CheckSquare, Square, ArrowLeft, FileText, Download } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import clsx from 'clsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// --- Helper Hook for Score Calculations ---
const useScoreCalculations = (exams: Exam[], subjects: Subject[]) => {
    const getMark = (marks: MarkRecord[], examId: string, subjectId: string, type: 'Objective' | 'Subjective') => {
        const record = marks.find(m => m.examId === examId && m.subjectId === subjectId && m.assessmentType === type);
        if (record) {
            return record.attended ? record.obtainedMarks : 'AB';
        }
        return '-';
    };

    const getRemark = (marks: MarkRecord[], subjectId: string) => {
        const records = marks.filter(m => m.subjectId === subjectId && m.remarks);
        // Get the latest remark
        const sortedExams = [...exams].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        for (const exam of sortedExams) {
            const record = records.find(r => r.examId === exam.id);
            if (record && record.remarks) return record.remarks;
        }
        return '';
    };

    const getSubMax = (subjectId: string) => {
        const sub = subjects.find(s => s.id === subjectId);
        return sub ? Math.round(sub.maxMarks / 2) : 50;
    };

    const calculateSubjectStats = (marks: MarkRecord[], subjectId: string) => {
        const sub = subjects.find(s => s.id === subjectId);
        if (!sub) return { percentage: '0.0', grade: '-' };

        let totalObtained = 0;
        let totalMax = 0;

        exams.forEach(exam => {
            const subjMark = marks.find(m => m.examId === exam.id && m.subjectId === subjectId && m.assessmentType === 'Subjective');
            const objMark = marks.find(m => m.examId === exam.id && m.subjectId === subjectId && m.assessmentType === 'Objective');

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

    const calculateOverall = (marks: MarkRecord[]) => {
        if (subjects.length === 0) return { totalPct: '0.0', overallGrade: 'N/A' };
        
        let totalPctSum = 0;
        let validSubjects = 0;
        
        subjects.forEach(s => {
           const stats = calculateSubjectStats(marks, s.id);
           if (stats.grade !== '-') {
             totalPctSum += parseFloat(stats.percentage);
             validSubjects++;
           }
        });
        
        if (validSubjects === 0) return { totalPct: '0.0', overallGrade: 'N/A' };

        const avgPct = totalPctSum / validSubjects;
        let grade = 'F';
        if (avgPct >= 90) grade = 'A+';
        else if (avgPct >= 80) grade = 'A';
        else if (avgPct >= 70) grade = 'B';
        else if (avgPct >= 60) grade = 'C';
        else if (avgPct >= 50) grade = 'D';
        else if (avgPct >= 40) grade = 'E';
        
        return { totalPct: avgPct.toFixed(1), overallGrade: grade };
    };

    return { getMark, getRemark, getSubMax, calculateSubjectStats, calculateOverall };
};

// --- Reusable Score Card Template Component ---
const ScoreCardTemplate: React.FC<{
    student: Student;
    marks: MarkRecord[];
    exams: Exam[];
    subjects: Subject[];
    helpers: ReturnType<typeof useScoreCalculations>;
}> = ({ student, marks, exams, subjects, helpers }) => {
    const overallStats = helpers.calculateOverall(marks);

    // Layout Constants for A4 (794px width)
    const PAGE_WIDTH = 794;
    const PADDING_X = 48; 
    const CONTENT_WIDTH = PAGE_WIDTH - (PADDING_X * 2); 
    
    // Column Widths
    const WIDTH_SUBJECT = 200;
    const WIDTH_TYPE = 50;
    const WIDTH_RESULT = 100;
    
    // Remaining width for exams
    const widthForExams = CONTENT_WIDTH - WIDTH_SUBJECT - WIDTH_TYPE - WIDTH_RESULT;
    // Each exam needs 2 sub-columns (Max, Obt)
    const examColWidth = exams.length > 0 ? widthForExams / exams.length : 0;
    const subColWidth = examColWidth / 2;

    return (
        <div 
            className="scorecard-page relative bg-white shadow-2xl mx-auto overflow-hidden mb-8" 
            style={{ 
                width: `${PAGE_WIDTH}px`, 
                minHeight: '1123px', // A4 Height
                fontFamily: '"Times New Roman", Times, serif' // Classic Report Card Font
            }}
        >
             {/* Decorative Border */}
             <div className="absolute inset-0 border-[3px] border-indigo-900 m-3 pointer-events-none z-10 rounded-sm"></div>
             <div className="absolute inset-0 border-[1px] border-indigo-900 m-4 pointer-events-none z-10 rounded-sm"></div>

             <div className="relative z-20 p-12 h-full flex flex-col min-h-[1123px]">
                
                {/* HEADER */}
                <header className="flex flex-col items-center mb-8 border-b-2 border-indigo-900 pb-4">
                    <div className="flex items-center gap-4 mb-2">
                         <Trophy size={48} className="text-indigo-900" />
                         <div className="text-center">
                            <h1 className="text-4xl font-bold text-indigo-900 uppercase tracking-wide" style={{ letterSpacing: '2px' }}>UNACADEMY</h1>
                            <p className="text-sm font-bold text-slate-600 uppercase tracking-[0.4em]">Excellence in Education</p>
                         </div>
                         <Trophy size={48} className="text-indigo-900" />
                    </div>
                    <div className="w-full flex justify-between items-end mt-4 px-4 font-sans">
                        <div className="text-sm text-slate-600">
                             <p><strong>Affiliation No:</strong> 2430012</p>
                             <p><strong>School Code:</strong> 15892</p>
                        </div>
                        <div className="text-center">
                             <div className="bg-indigo-900 text-white px-6 py-1 rounded-full text-sm font-bold uppercase tracking-wider mb-1">
                                Progress Report
                             </div>
                             <p className="text-xs font-bold text-slate-500 uppercase">Session: {new Date().getFullYear()}-{new Date().getFullYear()+1}</p>
                        </div>
                        <div className="text-sm text-slate-600 text-right">
                             <p><strong>Branch:</strong> Samastipur</p>
                             <p><strong>Phone:</strong> +91 98765 43210</p>
                        </div>
                    </div>
                </header>

                {/* STUDENT PROFILE GRID */}
                <div className="mb-6 border border-slate-300 rounded-lg overflow-hidden font-sans">
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
                    <div className="grid grid-cols-4">
                        <div className="p-2 border-r border-slate-300 bg-slate-100 text-xs font-bold text-slate-500 uppercase">Guardian Name</div>
                        <div className="p-2 border-r border-slate-300 font-bold text-slate-800 text-sm">{student.guardianName}</div>
                        <div className="p-2 border-r border-slate-300 bg-slate-100 text-xs font-bold text-slate-500 uppercase">Date of Birth</div>
                        <div className="p-2 font-bold text-slate-800 text-sm">-</div>
                    </div>
                </div>

                {/* MARKS TABLE */}
                <div className="mb-8 flex-1 font-sans">
                    <div className="rounded-t-lg bg-indigo-900 text-white p-2 text-center text-sm font-bold uppercase tracking-wider">
                        Scholastic Areas
                    </div>
                    <div className="border-x border-b border-slate-400">
                        <table className="w-full text-center border-collapse table-fixed">
                            <thead>
                                <tr className="bg-slate-100 text-slate-800">
                                    <th style={{width: `${WIDTH_SUBJECT}px`}} rowSpan={2} className="py-2 px-2 border-r border-slate-400 text-xs font-bold uppercase tracking-wider">Subject</th>
                                    <th style={{width: `${WIDTH_TYPE}px`}} rowSpan={2} className="py-2 px-1 border-r border-slate-400 text-[10px] font-bold uppercase tracking-wider">Type</th>
                                    {exams.map(exam => (
                                        <th key={exam.id} style={{width: `${examColWidth}px`}} colSpan={2} className="py-1 px-1 border-r border-slate-400 border-b border-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                            {exam.name}
                                        </th>
                                    ))}
                                    <th style={{width: `${WIDTH_RESULT}px`}} colSpan={2} className="py-2 border-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-200">Overall</th>
                                </tr>
                                <tr className="bg-slate-50 text-slate-600 text-[9px] uppercase font-bold border-b border-slate-400">
                                    {exams.map(exam => (
                                        <React.Fragment key={exam.id}>
                                            <th style={{width: `${subColWidth}px`}} className="py-1 border-r border-slate-400">Max</th>
                                            <th style={{width: `${subColWidth}px`}} className="py-1 border-r border-slate-400">Obt</th>
                                        </React.Fragment>
                                    ))}
                                    <th className="py-1 border-r border-slate-400 w-1/2 bg-slate-100">%</th>
                                    <th className="py-1 w-1/2 bg-slate-100">Grd</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs">
                                {subjects.map((sub, idx) => {
                                    const stats = helpers.calculateSubjectStats(marks, sub.id);
                                    
                                    return (
                                    <React.Fragment key={sub.id}>
                                        <tr className="border-b border-slate-300">
                                            <td 
                                                rowSpan={2} 
                                                className="border-r border-slate-400 font-bold text-left px-3 py-1 align-middle text-black bg-white"
                                                style={{ color: '#000000', position: 'relative', zIndex: 10 }}
                                            >
                                                {sub.name}
                                            </td>
                                            <td className="border-r border-slate-400 text-[9px] text-slate-500 font-bold uppercase tracking-wider text-center py-1 bg-slate-50">TH</td>
                                            {exams.map(exam => (
                                                <React.Fragment key={exam.id}>
                                                    <td className="border-r border-slate-300 text-slate-400 py-1 bg-white">{helpers.getSubMax(sub.id)}</td>
                                                    <td className="border-r border-slate-400 font-bold py-1 text-black bg-white">{helpers.getMark(marks, exam.id, sub.id, 'Subjective')}</td>
                                                </React.Fragment>
                                            ))}
                                            
                                            {/* Final Stats */}
                                            <td 
                                                rowSpan={2} 
                                                className="border-r border-slate-400 font-bold text-indigo-800 align-middle bg-slate-50"
                                            >
                                                {stats.percentage}%
                                            </td>
                                            <td 
                                                rowSpan={2} 
                                                className="font-bold text-indigo-900 align-middle bg-slate-50"
                                            >
                                                {stats.grade}
                                            </td>
                                        </tr>
                                        {/* Objective Row */}
                                        <tr className="border-b border-slate-400">
                                            <td className="border-r border-slate-400 text-[9px] text-slate-500 font-bold uppercase tracking-wider text-center py-1 bg-slate-50">PR</td>
                                            {exams.map(exam => (
                                                <React.Fragment key={exam.id}>
                                                     <td className="border-r border-slate-300 text-slate-400 py-1 bg-white">{helpers.getSubMax(sub.id)}</td>
                                                     <td className="border-r border-slate-400 font-bold py-1 text-black bg-white">{helpers.getMark(marks, exam.id, sub.id, 'Objective')}</td>
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
                <div className="mt-auto font-sans">
                    <div className="grid grid-cols-2 gap-8 mb-8">
                         <div className="border border-slate-300 rounded-lg p-3">
                            <h4 className="font-bold text-indigo-900 uppercase text-xs mb-2 border-b border-indigo-200 pb-1">Remarks</h4>
                            <div className="text-sm italic text-slate-600 min-h-[80px]">
                                {subjects.map(s => {
                                    const r = helpers.getRemark(marks, s.id);
                                    return r ? <div key={s.id}><span className="font-bold text-xs">{s.name}:</span> {r}</div> : null;
                                })}
                                {!subjects.some(s => helpers.getRemark(marks, s.id)) && "Keep up the good work!"}
                            </div>
                         </div>
                         
                         <div>
                             <div className="bg-slate-100 rounded-lg p-4 border border-slate-300 text-center">
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
                        <div className="text-center">
                            <div className="w-40 border-b border-slate-400 mb-1"></div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Class Teacher</p>
                        </div>
                        <div className="text-center">
                            <div className="w-40 border-b border-slate-400 mb-1"></div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Principal</p>
                        </div>
                         <div className="text-center">
                            <div className="w-40 border-b border-slate-400 mb-1"></div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Parent</p>
                        </div>
                    </div>
                    
                    <div className="text-center text-[10px] text-slate-400 mt-2">
                        Generated on {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}
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
  
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentMarks, setStudentMarks] = useState<MarkRecord[]>([]);
  
  // Tabs & Bulk State
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [bulkViewMode, setBulkViewMode] = useState<'selection' | 'preview'>('selection');
  const [bulkSelection, setBulkSelection] = useState<Set<string>>(new Set());
  const [bulkMarks, setBulkMarks] = useState<Record<string, MarkRecord[]>>({});
  const [loadingBulk, setLoadingBulk] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  const { showToast } = useToast();
  const helpers = useScoreCalculations(exams, subjects);
  const reportContainerRef = useRef<HTMLDivElement>(null);

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
            const filtered = allStudents.filter(s => s.className === cls.className && s.section === cls.section);
            setStudents(filtered);
            // Default select all
            setBulkSelection(new Set(filtered.map(s => s.id)));
        } else {
            setStudents([]);
            setBulkSelection(new Set());
        }
        // Reset state
        setSelectedStudentId('');
        setBulkMarks({});
        setBulkViewMode('selection');
    };
    loadStudents();
  }, [selectedClassId, classes]);

  // Load marks when student changes (Single Mode)
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

  const toggleStudentSelection = (id: string) => {
      const newSet = new Set(bulkSelection);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setBulkSelection(newSet);
  };

  const toggleSelectAll = () => {
      if (bulkSelection.size === students.length) {
          setBulkSelection(new Set());
      } else {
          setBulkSelection(new Set(students.map(s => s.id)));
      }
  };

  const handleGeneratePreview = async () => {
      if (bulkSelection.size === 0) {
          showToast("Please select at least one student", 'error');
          return;
      }
      
      setLoadingBulk(true);
      try {
          const marksData: Record<string, MarkRecord[]> = {};
          // Only fetch for selected students
          const selectedStudents = students.filter(s => bulkSelection.has(s.id));
          
          await Promise.all(selectedStudents.map(async (student) => {
              const history = await DataService.getStudentHistory(student.id);
              marksData[student.id] = history;
          }));
          
          setBulkMarks(marksData);
          setBulkViewMode('preview');
      } catch (e) {
          showToast("Failed to load marks data", 'error');
      } finally {
          setLoadingBulk(false);
      }
  };

  const handleBackToSelection = () => {
      setBulkViewMode('selection');
  };

  const handleDownloadPDF = async () => {
      if (!reportContainerRef.current) return;
      
      setDownloading(true);
      try {
          // Initialize PDF with A4 dimensions (210 x 297 mm)
          const doc = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'a4',
              compress: true
          });

          const pages = reportContainerRef.current.querySelectorAll('.scorecard-page');
          
          if (pages.length === 0) {
             showToast("No content to download", 'error');
             setDownloading(false);
             return;
          }

          const pdfWidth = doc.internal.pageSize.getWidth();
          const pdfHeight = doc.internal.pageSize.getHeight();

          for (let i = 0; i < pages.length; i++) {
              if (i > 0) doc.addPage();
              
              const pageEl = pages[i] as HTMLElement;
              // Save original styles
              const originalBg = pageEl.style.backgroundColor;
              
              // Force white background for capture
              pageEl.style.backgroundColor = '#ffffff';

              const canvas = await html2canvas(pageEl, {
                  scale: 4, // Ultra high quality scale
                  useCORS: true,
                  logging: false,
                  width: 794, 
                  height: 1123,
                  windowWidth: 1200, // Ensure viewport doesn't constrain layout
                  scrollY: -window.scrollY // Fix scrolling offset issues
              });
              
              // Restore styles
              pageEl.style.backgroundColor = originalBg;

              const imgData = canvas.toDataURL('image/jpeg', 0.95); // High quality JPEG
              
              doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
          }

          const fileName = activeTab === 'single' 
            ? `Report_Card_${students.find(s => s.id === selectedStudentId)?.fullName || 'Student'}.pdf`
            : `Class_Report_Cards_${classes.find(c => c.id === selectedClassId)?.className || 'All'}.pdf`;

          doc.save(fileName);
          showToast("PDF downloaded successfully", 'success');
      } catch (e) {
          console.error(e);
          showToast("Failed to generate PDF", 'error');
      } finally {
          setDownloading(false);
      }
  };

  const currentStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className="space-y-8 no-print-space">
      <div className="flex flex-col md:flex-row justify-between items-center no-print gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Academic Score Card</h1>
            <p className="text-slate-500">Generate and print official student performance reports</p>
        </div>
        <div>
           {/* Tab Switcher */}
           <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                <button 
                    onClick={() => setActiveTab('single')}
                    className={clsx(
                        "px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all", 
                        activeTab === 'single' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    )}
                >
                    <CreditCard size={16} /> Single Mode
                </button>
                <button 
                    onClick={() => setActiveTab('bulk')}
                    className={clsx(
                        "px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all", 
                        activeTab === 'bulk' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    )}
                >
                    <Users size={16} /> Bulk Mode
                </button>
           </div>
        </div>
      </div>

      <div className="flex justify-between items-center no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          {/* Class Selection - Global for both modes */}
          <div className="flex items-center gap-4">
               <div className="w-64">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Class</label>
                    <div className="relative">
                        <select 
                            className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                        >
                            {classes.map(c => <option key={c.id} value={c.id}>{c.className} - {c.section}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                    </div>
               </div>
               
               {/* Single Mode: Student Selection */}
               {activeTab === 'single' && (
                   <div className="w-64 animate-in fade-in slide-in-from-left-4 duration-300">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Student</label>
                        <div className="relative">
                            <select 
                                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                            >
                                <option value="">Select Student...</option>
                                {students.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.rollNumber})</option>)}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                        </div>
                   </div>
               )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
              {activeTab === 'bulk' && bulkViewMode === 'preview' && (
                  <button 
                    onClick={handleBackToSelection}
                    className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-200 transition-all font-medium"
                  >
                      <ArrowLeft size={18} /> Back to Selection
                  </button>
              )}
              
              {activeTab === 'bulk' && bulkViewMode === 'selection' ? (
                  <button 
                    onClick={handleGeneratePreview}
                    disabled={bulkSelection.size === 0 || loadingBulk}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     {loadingBulk ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
                     <span className="font-semibold">{loadingBulk ? 'Generating...' : `Generate Preview (${bulkSelection.size})`}</span>
                  </button>
              ) : (
                  <>
                    <button 
                        onClick={handleDownloadPDF}
                        disabled={activeTab === 'single' ? !currentStudent : (bulkSelection.size === 0 || loadingBulk || downloading)}
                        className="flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl hover:bg-slate-200 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {downloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} 
                        <span className="font-semibold">{downloading ? 'Downloading...' : 'Download PDF'}</span>
                    </button>
                    <button 
                        onClick={() => window.print()} 
                        disabled={activeTab === 'single' ? !currentStudent : (bulkSelection.size === 0 || loadingBulk)}
                        className="flex items-center gap-2 bg-slate-800 text-white px-6 py-2.5 rounded-xl hover:bg-slate-900 shadow-lg shadow-slate-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Printer size={18} /> 
                        <span className="font-semibold">
                            {activeTab === 'single' ? 'Print' : 'Print All'}
                        </span>
                    </button>
                  </>
              )}
          </div>
      </div>

      <div ref={reportContainerRef} className="flex justify-center">
        {/* REPORT AREA - Single View */}
        {activeTab === 'single' && (
            currentStudent ? (
                <ScoreCardTemplate 
                    student={currentStudent} 
                    marks={studentMarks} 
                    exams={exams} 
                    subjects={subjects} 
                    helpers={helpers}
                />
            ) : (
                <div className="w-full text-center py-24 bg-white rounded-2xl border border-dashed border-slate-300 no-print flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Search className="text-slate-300" size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">Ready to Generate</h3>
                    <p className="text-slate-400 text-sm max-w-xs">Select a student from the dropdown above to preview their report card.</p>
                </div>
            )
        )}

        {/* REPORT AREA - Bulk View */}
        {activeTab === 'bulk' && (
            <div className="print-reset relative min-h-[400px] w-full">
                {/* Selection List */}
                {bulkViewMode === 'selection' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden no-print">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <Users size={18} /> Select Students
                            </h3>
                            <button 
                                onClick={toggleSelectAll}
                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                            >
                                {bulkSelection.size === students.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div className="max-h-[600px] overflow-y-auto">
                            {students.length === 0 ? (
                                <div className="p-12 text-center text-slate-500">No students found in this class.</div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider sticky top-0 z-10">
                                        <tr>
                                            <th className="w-16 px-6 py-3 text-center">Select</th>
                                            <th className="px-6 py-3">Student Name</th>
                                            <th className="px-6 py-3">Roll Number</th>
                                            <th className="px-6 py-3">Guardian</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {students.map(s => {
                                            const isSelected = bulkSelection.has(s.id);
                                            return (
                                                <tr 
                                                    key={s.id} 
                                                    className={clsx("hover:bg-indigo-50/50 cursor-pointer transition-colors", isSelected && "bg-indigo-50/30")}
                                                    onClick={() => toggleStudentSelection(s.id)}
                                                >
                                                    <td className="px-6 py-3 text-center">
                                                        {isSelected ? 
                                                            <CheckSquare className="mx-auto text-indigo-600" size={20} /> : 
                                                            <Square className="mx-auto text-slate-300" size={20} />
                                                        }
                                                    </td>
                                                    <td className="px-6 py-3 font-medium text-slate-700">{s.fullName}</td>
                                                    <td className="px-6 py-3 font-mono text-xs text-slate-500">{s.rollNumber}</td>
                                                    <td className="px-6 py-3 text-sm text-slate-500">{s.guardianName}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
                            <span>{bulkSelection.size} students selected</span>
                        </div>
                    </div>
                )}

                {/* Preview Cards */}
                {bulkViewMode === 'preview' && (
                    <>
                        {loadingBulk ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50 rounded-2xl no-print">
                                <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
                                <p className="font-medium text-slate-600">Generating report cards...</p>
                            </div>
                        ) : (
                            <div className={clsx(loadingBulk && "opacity-50 blur-sm", "flex flex-col items-center")}>
                                {students.filter(s => bulkSelection.has(s.id)).map(student => (
                                    <ScoreCardTemplate 
                                        key={student.id}
                                        student={student}
                                        marks={bulkMarks[student.id] || []}
                                        exams={exams}
                                        subjects={subjects}
                                        helpers={helpers}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        )}
      </div>
    </div>
  );
};