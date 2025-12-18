
import React, { useState, useEffect, useRef } from 'react';
import { DataService } from '../services/dataService';
import { Student, Exam, Subject, MarkRecord, SchoolClass } from '../types';
import { Printer, Search, Trophy, Medal, Star, Loader2, Users, CreditCard, RefreshCw, CheckSquare, Square, ArrowLeft, FileText, Download, Image as ImageIcon, Layout, Move, Maximize, Type, Palette, Save, RotateCcw, Upload, Droplet, School } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import clsx from 'clsx';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Initialize pdfMake vfs
if (pdfMake.vfs === undefined && pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
}

// --- Types for Layout Engine ---
interface LayoutBlock {
    id: string;
    type: 'school_name' | 'tagline' | 'logo' | 'header_info' | 'student_info' | 'marks_table' | 'remarks' | 'signatures' | 'custom_text';
    label: string;
    x: number;
    y: number;
    w: number;
    h: number; // h might be 'auto' for table
    style: {
        fontSize: number;
        color: string;
        backgroundColor?: string;
        fontWeight?: 'normal' | 'bold';
        textAlign?: 'left' | 'center' | 'right';
        border?: boolean;
        padding?: number;
    };
    isVisible: boolean;
}

const DEFAULT_LAYOUT: LayoutBlock[] = [
    { id: 'logo', type: 'logo', label: 'School Logo', x: 40, y: 30, w: 100, h: 100, style: { fontSize: 0, color: '', border: false }, isVisible: true },
    { id: 'school_name', type: 'school_name', label: 'School Name', x: 150, y: 40, w: 600, h: 50, style: { fontSize: 32, color: '#1e1b4b', textAlign: 'center', fontWeight: 'bold' }, isVisible: true },
    { id: 'tagline', type: 'tagline', label: 'Tagline', x: 150, y: 95, w: 600, h: 30, style: { fontSize: 12, color: '#475569', textAlign: 'center' }, isVisible: true },
    { id: 'header_info', type: 'header_info', label: 'Session Info', x: 48, y: 150, w: 698, h: 30, style: { fontSize: 10, color: '#64748b', textAlign: 'center' }, isVisible: true },
    
    { id: 'student_info', type: 'student_info', label: 'Student Details', x: 48, y: 190, w: 698, h: 100, style: { fontSize: 14, color: '#000000', textAlign: 'left', border: true, padding: 10 }, isVisible: true },
    { id: 'marks_table', type: 'marks_table', label: 'Marks Table', x: 48, y: 310, w: 698, h: 400, style: { fontSize: 12, color: '#000000', textAlign: 'center' }, isVisible: true },
    { id: 'remarks', type: 'remarks', label: 'Remarks Section', x: 48, y: 730, w: 340, h: 150, style: { fontSize: 12, color: '#334155', border: true, padding: 12 }, isVisible: true },
    { id: 'overall', type: 'custom_text', label: 'Overall Result', x: 408, y: 730, w: 338, h: 150, style: { fontSize: 14, color: '#1e1b4b', textAlign: 'center', border: true, backgroundColor: '#f1f5f9', padding: 20 }, isVisible: true },
    { id: 'signatures', type: 'signatures', label: 'Signatures', x: 48, y: 950, w: 698, h: 100, style: { fontSize: 10, color: '#64748b', textAlign: 'center' }, isVisible: true },
];

// --- Helper Hook for Score Calculations ---
const useScoreCalculations = (exams: Exam[], subjects: Subject[]) => {
    const getMark = (marks: MarkRecord[], examId: string, subjectId: string, type: 'Objective' | 'Subjective') => {
        const record = marks.find(m => m.examId === examId && m.subjectId === subjectId);
        if (record) {
            if (!record.attended) return 'AB';
            return type === 'Objective' ? record.objMarks : record.subMarks;
        }
        return '-';
    };

    const getMaxMark = (marks: MarkRecord[], examId: string, subjectId: string, type: 'Objective' | 'Subjective') => {
        const record = marks.find(m => m.examId === examId && m.subjectId === subjectId);
        if (record) {
            const val = type === 'Objective' ? record.objMaxMarks : record.subMaxMarks;
            if (val !== undefined && val !== null) return val;
        }
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
            let examObjMax = 0;
            let examSubMax = 0;
            
            if (mark) {
                examObjMax = mark.objMaxMarks || 0;
                examSubMax = mark.subMaxMarks || 0;
                if (examObjMax === 0 && examSubMax === 0) {
                    examObjMax = sub.maxMarksObjective || 0;
                    examSubMax = sub.maxMarksSubjective || 0;
                }
                if (mark.attended) {
                    totalObtained += (mark.objMarks + mark.subMarks);
                }
            } else {
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

// --- Block Renderer Component ---
const BlockRenderer: React.FC<{
    block: LayoutBlock;
    schoolInfo: { name: string, tagline: string, logo: string, watermark: string };
    student: Student;
    marks: MarkRecord[];
    exams: Exam[];
    subjects: Subject[];
    helpers: ReturnType<typeof useScoreCalculations>;
    overallStats: { totalPct: string, overallGrade: string };
}> = ({ block, schoolInfo, student, marks, exams, subjects, helpers, overallStats }) => {
    
    // Derived values for table
    const WIDTH_SUBJECT = 180;
    const WIDTH_TYPE = 40;
    const WIDTH_RESULT = 140; 

    switch(block.type) {
        case 'logo':
            return (
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                     {schoolInfo.logo ? <img src={schoolInfo.logo} className="w-full h-full object-contain" /> : <Trophy size={Math.min(block.w, block.h) * 0.8} className="text-indigo-900" />}
                </div>
            );
        case 'school_name':
            return (
                <div style={{ ...block.style, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: block.style.textAlign === 'center' ? 'center' : block.style.textAlign === 'right' ? 'flex-end' : 'flex-start' }}>
                    <h1 style={{ fontSize: `${block.style.fontSize}px`, fontWeight: block.style.fontWeight, letterSpacing: '1px', lineHeight: 1 }}>{schoolInfo.name || 'UNACADEMY'}</h1>
                </div>
            );
        case 'tagline':
            return (
                <div style={{ ...block.style, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: block.style.textAlign === 'center' ? 'center' : block.style.textAlign === 'right' ? 'flex-end' : 'flex-start' }}>
                     <p style={{ fontSize: `${block.style.fontSize}px`, letterSpacing: '2px', textTransform: 'uppercase' }}>{schoolInfo.tagline || 'Excellence in Education'}</p>
                </div>
            );
        case 'header_info':
            return (
                <div className="w-full h-full flex justify-between items-end px-2 font-sans text-slate-500 border-b border-slate-200 pb-1" style={{ fontSize: `${block.style.fontSize}px` }}>
                    <div className="text-left"><strong>Affiliation:</strong> 2430012</div>
                    <div className="text-center">
                         <span className="bg-indigo-900 text-white px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mx-2">Report Card</span>
                         <span className="font-bold uppercase">2024-2025</span>
                    </div>
                    <div className="text-right"><strong>Term:</strong> Annual</div>
                </div>
            );
        case 'student_info':
            return (
                <div className={clsx("w-full h-full font-sans bg-white/60", block.style.border && "border border-slate-300 rounded-lg overflow-hidden")}>
                     <div className="grid grid-cols-4 bg-slate-100 border-b border-slate-300">
                        <div className="p-2 border-r border-slate-300 text-xs font-bold text-slate-500 uppercase">Student Name</div>
                        <div className="p-2 border-r border-slate-300 col-span-3 font-bold text-slate-800" style={{ fontSize: `${block.style.fontSize}px` }}>{student.fullName}</div>
                    </div>
                    <div className="grid grid-cols-4">
                        <div className="p-2 border-r border-slate-300 bg-slate-100 text-xs font-bold text-slate-500 uppercase">Class / Section</div>
                        <div className="p-2 border-r border-slate-300 font-bold text-slate-800" style={{ fontSize: `${block.style.fontSize}px` }}>{student.className} - {student.section}</div>
                        <div className="p-2 border-r border-slate-300 bg-slate-100 text-xs font-bold text-slate-500 uppercase">Roll Number</div>
                        <div className="p-2 font-bold text-slate-800 font-mono" style={{ fontSize: `${block.style.fontSize}px` }}>{student.rollNumber}</div>
                    </div>
                </div>
            );
        case 'marks_table':
            return (
                <div className="w-full h-full font-sans overflow-hidden">
                     <div className="rounded-t-lg bg-indigo-900 text-white p-1 text-center text-xs font-bold uppercase tracking-wider">Scholastic Areas</div>
                     <div className="border border-slate-400">
                        <table className="w-full text-center border-collapse table-fixed bg-white/70">
                             <thead>
                                <tr className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider" style={{ fontSize: '10px' }}>
                                    <th style={{width: `${WIDTH_SUBJECT}px`}} rowSpan={2} className="py-2 px-2 border-r border-slate-400">Subject</th>
                                    <th style={{width: `${WIDTH_TYPE}px`}} rowSpan={2} className="py-2 px-1 border-r border-slate-400">Type</th>
                                    {exams.map(exam => (
                                        <th key={exam.id} colSpan={2} className="py-1 px-1 border-r border-slate-400 border-b border-slate-400">{exam.name}</th>
                                    ))}
                                    <th style={{width: `${WIDTH_RESULT}px`}} colSpan={3} className="py-2 bg-slate-200">Overall</th>
                                </tr>
                                <tr className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-400" style={{ fontSize: '9px' }}>
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
                            <tbody style={{ fontSize: `${block.style.fontSize}px` }}>
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
            );
        case 'remarks':
            return (
                <div className={clsx("w-full h-full bg-white/80 overflow-hidden", block.style.border && "border border-slate-300 rounded-lg p-3")}>
                     <h4 className="font-bold text-indigo-900 uppercase text-xs mb-2 border-b border-indigo-200 pb-1">Remarks</h4>
                     <div className="italic text-slate-600" style={{ fontSize: `${block.style.fontSize}px` }}>
                        {subjects.map(s => {
                            const r = helpers.getRemark(marks, s.id);
                            return r ? <div key={s.id}><span className="font-bold text-xs">{s.name}:</span> {r}</div> : null;
                        })}
                        {!subjects.some(s => helpers.getRemark(marks, s.id)) && "Progressing well. Consistent efforts will lead to better results."}
                     </div>
                </div>
            );
        case 'custom_text':
            return (
                <div className={clsx("w-full h-full flex flex-col justify-center items-center text-center", block.style.border && "border border-slate-300 rounded-lg")} style={{ backgroundColor: block.style.backgroundColor }}>
                     <div className="text-xs uppercase text-slate-500 font-bold mb-1">Final Result</div>
                     <div className="font-bold text-indigo-900 mb-2" style={{ fontSize: `${block.style.fontSize * 2.5}px` }}>{overallStats.overallGrade}</div>
                     <div className="flex justify-center gap-4 text-sm font-bold text-slate-700 border-t border-slate-300 pt-2 w-full px-4">
                         <span>{overallStats.totalPct}%</span>
                         <span>{overallStats.overallGrade === 'F' ? 'Fail' : 'Pass'}</span>
                     </div>
                </div>
            );
        case 'signatures':
            return (
                <div className="w-full h-full flex justify-between items-end px-4" style={{ fontSize: `${block.style.fontSize}px` }}>
                    <div className="text-center"><div className="w-32 border-b border-slate-400 mb-1"></div><p className="font-bold text-slate-500 uppercase">Class Teacher</p></div>
                    <div className="text-center"><div className="w-32 border-b border-slate-400 mb-1"></div><p className="font-bold text-slate-500 uppercase">Principal</p></div>
                    <div className="text-center"><div className="w-32 border-b border-slate-400 mb-1"></div><p className="font-bold text-slate-500 uppercase">Parent</p></div>
                </div>
            );
        default:
            return null;
    }
};

// --- Customizable Score Card Component (For DOM Preview) ---
const CustomizableScoreCard: React.FC<{
    student: Student;
    marks: MarkRecord[];
    exams: Exam[];
    subjects: Subject[];
    helpers: ReturnType<typeof useScoreCalculations>;
    schoolInfo: { name: string, tagline: string, logo: string, watermark: string };
    layout: LayoutBlock[];
    scale?: number;
    isPreview?: boolean;
}> = ({ student, marks, exams, subjects, helpers, schoolInfo, layout, scale = 1, isPreview = false }) => {
    const overallStats = helpers.calculateOverall(marks);
    const PAGE_WIDTH = 794;
    
    return (
        <div 
            className={clsx("scorecard-page relative bg-white shadow-2xl mx-auto overflow-hidden mb-8", !isPreview && "pointer-events-none")} 
            style={{ width: `${PAGE_WIDTH}px`, height: '1123px', transform: `scale(${scale})`, transformOrigin: 'top center' }}
        >
             {/* Decorative Borders (Static) */}
             <div className="absolute inset-0 border-[3px] border-indigo-900 m-3 pointer-events-none z-0 rounded-sm"></div>
             
             {schoolInfo.watermark && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-10 grayscale">
                     <img src={schoolInfo.watermark} className="w-[80%] max-h-[80%] object-contain" />
                 </div>
             )}

             {/* Render Layout Blocks */}
             {layout.filter(l => l.isVisible).map(block => (
                 <div 
                    key={block.id}
                    className="absolute"
                    style={{ left: block.x, top: block.y, width: block.w, height: block.h, zIndex: 10 }}
                 >
                     <BlockRenderer 
                        block={block}
                        schoolInfo={schoolInfo}
                        student={student}
                        marks={marks}
                        exams={exams}
                        subjects={subjects}
                        helpers={helpers}
                        overallStats={overallStats}
                     />
                 </div>
             ))}
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
  
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'layout'>('single');
  const [bulkViewMode, setBulkViewMode] = useState<'selection' | 'preview'>('selection');
  const [bulkSelection, setBulkSelection] = useState<Set<string>>(new Set());
  const [bulkMarks, setBulkMarks] = useState<Record<string, MarkRecord[]>>({});
  
  // Layout State
  const [layout, setLayout] = useState<LayoutBlock[]>(DEFAULT_LAYOUT);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [layoutSidebarTab, setLayoutSidebarTab] = useState<'structure' | 'branding'>('structure');
  
  const [loadingBulk, setLoadingBulk] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isSavingAssets, setIsSavingAssets] = useState(false);
  
  const { showToast } = useToast();
  const helpers = useScoreCalculations(exams, subjects);
  const overallStats = helpers.calculateOverall([]); // Dummy stats for editor
  const reportContainerRef = useRef<HTMLDivElement>(null);

  // Drag & Drop Refs
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const blockStart = useRef({ x: 0, y: 0 });
  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0 });
  const dimStart = useRef({ w: 0, h: 0 });

  const currentStudent = students.find(s => s.id === selectedStudentId);
  const dummyStudent: Student = {
      id: 'dummy', fullName: 'Rohit Sharma', rollNumber: '101', className: 'X', section: 'A', contactNumber: '', guardianName: 'Mr. Sharma', status: 'Active' as any, avatarUrl: ''
  };

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

  const getBase64ImageFromURL = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute("crossOrigin", "anonymous");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if(ctx) {
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL("image/png");
            resolve(dataURL);
        } else {
            resolve("");
        }
      };
      img.onerror = error => {
        // Return a 1x1 transparent pixel if fail to avoid crashing PDF generation
        resolve("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
      };
      img.src = url;
    });
  };

  const handleDownloadPDF = async () => {
      setDownloading(true);
      try {
          // Prepare fonts (if standard fonts are used, pdfmake has them. If custom, need vfs).
          // We'll stick to standard Roboto provided by default build.

          // Pre-fetch images
          let logoBase64 = "";
          let watermarkBase64 = "";
          
          if (schoolInfo.logo) logoBase64 = await getBase64ImageFromURL(schoolInfo.logo);
          if (schoolInfo.watermark) watermarkBase64 = await getBase64ImageFromURL(schoolInfo.watermark);

          const scale = 0.75; // Approx px to pt ratio
          const content: any[] = [];

          // Determine which students to print
          const studentsToPrint = activeTab === 'single' 
            ? (currentStudent ? [currentStudent] : []) 
            : students.filter(s => bulkSelection.has(s.id));

          if (studentsToPrint.length === 0) {
              showToast("No students selected", 'error');
              setDownloading(false);
              return;
          }

          // Generate Content for each student
          for (let i = 0; i < studentsToPrint.length; i++) {
              const student = studentsToPrint[i];
              const marks = activeTab === 'single' ? studentMarks : (bulkMarks[student.id] || []);
              const overallStats = helpers.calculateOverall(marks);
              
              // Helper to get block config
              const getB = (type: string) => layout.find(l => l.type === type && l.isVisible);

              const pageContent: any[] = [];

              // Watermark Background (using absolute position hack or simple image)
              if (watermarkBase64) {
                  pageContent.push({
                      image: watermarkBase64,
                      width: 400,
                      opacity: 0.1,
                      absolutePosition: { x: 100, y: 300 }
                  });
              }

              // Decorative Border (Rect)
              pageContent.push({
                  canvas: [{
                      type: 'rect',
                      x: 10, y: 10,
                      w: 575, h: 820,
                      lineWidth: 3,
                      lineColor: '#1e1b4b',
                      r: 5
                  }],
                  absolutePosition: { x: 0, y: 0 }
              });

              // --- Process Blocks ---
              
              // Logo
              const logoBlock = getB('logo');
              if (logoBlock && logoBase64) {
                  pageContent.push({
                      image: logoBase64,
                      width: Math.min(logoBlock.w * scale, logoBlock.h * scale), // Maintain aspect ratio roughly
                      absolutePosition: { x: logoBlock.x * scale, y: logoBlock.y * scale }
                  });
              }

              // School Name
              const nameBlock = getB('school_name');
              if (nameBlock) {
                  pageContent.push({
                      text: schoolInfo.name || 'UNACADEMY',
                      fontSize: nameBlock.style.fontSize * scale,
                      bold: nameBlock.style.fontWeight === 'bold',
                      color: nameBlock.style.color,
                      alignment: nameBlock.style.textAlign,
                      absolutePosition: { x: nameBlock.x * scale, y: nameBlock.y * scale },
                      width: nameBlock.w * scale // Constrain width for alignment
                  });
              }

              // Tagline
              const tagBlock = getB('tagline');
              if (tagBlock) {
                  pageContent.push({
                      text: (schoolInfo.tagline || '').toUpperCase(),
                      fontSize: tagBlock.style.fontSize * scale,
                      color: tagBlock.style.color,
                      alignment: tagBlock.style.textAlign,
                      letterSpacing: 2,
                      absolutePosition: { x: tagBlock.x * scale, y: tagBlock.y * scale },
                      width: tagBlock.w * scale
                  });
              }

              // Header Info
              const infoBlock = getB('header_info');
              if (infoBlock) {
                  // Simplified representation for PDFMake using columns
                  // Note: absolutePosition for columns works but complex. 
                  // We'll place a table or columns at the position.
                  pageContent.push({
                      columns: [
                          { text: 'Affiliation: 2430012', alignment: 'left' },
                          { text: `Report Card ${new Date().getFullYear()}-${new Date().getFullYear()+1}`, alignment: 'center', bold: true },
                          { text: 'Term: Annual', alignment: 'right' }
                      ],
                      fontSize: infoBlock.style.fontSize * scale,
                      color: infoBlock.style.color,
                      absolutePosition: { x: infoBlock.x * scale, y: infoBlock.y * scale },
                      width: infoBlock.w * scale
                  });
                  // Line
                  pageContent.push({
                      canvas: [{ type: 'line', x1: 0, y1: 0, x2: infoBlock.w * scale, y2: 0, lineWidth: 1, lineColor: '#e2e8f0' }],
                      absolutePosition: { x: infoBlock.x * scale, y: (infoBlock.y + infoBlock.h) * scale }
                  });
              }

              // Student Info
              const stuBlock = getB('student_info');
              if (stuBlock) {
                  pageContent.push({
                      table: {
                          widths: ['25%', '75%'],
                          body: [
                              [
                                  { text: 'STUDENT NAME', bold: true, fillColor: '#f1f5f9', fontSize: 9 }, 
                                  { text: student.fullName, bold: true, fontSize: stuBlock.style.fontSize * scale }
                              ],
                              [
                                  { text: 'CLASS / SECTION', bold: true, fillColor: '#f1f5f9', fontSize: 9 }, 
                                  { text: `${student.className} - ${student.section}`, fontSize: stuBlock.style.fontSize * scale }
                              ],
                              [
                                  { text: 'ROLL NUMBER', bold: true, fillColor: '#f1f5f9', fontSize: 9 }, 
                                  { text: student.rollNumber, fontSize: stuBlock.style.fontSize * scale }
                              ]
                          ]
                      },
                      layout: stuBlock.style.border ? 'lightHorizontalLines' : 'noBorders',
                      absolutePosition: { x: stuBlock.x * scale, y: stuBlock.y * scale },
                      width: stuBlock.w * scale
                  });
              }

              // Marks Table
              const tblBlock = getB('marks_table');
              if (tblBlock) {
                  // Construct Table Body
                  // Widths: Subject (fixed approx), Type (fixed approx), Exams... (flex), Overall (fixed)
                  const subWidth = 120;
                  const typeWidth = 30;
                  const resultWidth = 100;
                  const availableForExams = (tblBlock.w * scale) - subWidth - typeWidth - resultWidth;
                  const examWidth = exams.length > 0 ? availableForExams / (exams.length * 2) : 0;
                  
                  const tableBody: any[] = [];
                  
                  // Header Rows
                  const headerRow1: any[] = [
                      { text: 'SUBJECT', rowSpan: 2, bold: true, alignment: 'left', margin: [0, 5] },
                      { text: 'TYPE', rowSpan: 2, bold: true, alignment: 'center', margin: [0, 5] }
                  ];
                  exams.forEach(e => {
                      headerRow1.push({ text: e.name.toUpperCase(), colSpan: 2, bold: true, alignment: 'center' });
                      headerRow1.push({}); // Placeholder for colspan
                  });
                  headerRow1.push({ text: 'OVERALL', colSpan: 3, bold: true, alignment: 'center', fillColor: '#e2e8f0' });
                  headerRow1.push({}); 
                  headerRow1.push({});

                  const headerRow2: any[] = [{}, {}];
                  exams.forEach(() => {
                      headerRow2.push({ text: 'Max', fontSize: 8, alignment: 'center' });
                      headerRow2.push({ text: 'Obt', fontSize: 8, alignment: 'center' });
                  });
                  headerRow2.push({ text: 'Total', fontSize: 8, alignment: 'center', fillColor: '#f1f5f9' });
                  headerRow2.push({ text: '%', fontSize: 8, alignment: 'center', fillColor: '#f1f5f9' });
                  headerRow2.push({ text: 'Grd', fontSize: 8, alignment: 'center', fillColor: '#f1f5f9' });

                  tableBody.push(headerRow1);
                  tableBody.push(headerRow2);

                  // Data Rows
                  subjects.forEach(sub => {
                      const stats = helpers.calculateSubjectStats(marks, sub.id);
                      
                      // Row 1 (Subjective + Subject Name)
                      const row1: any[] = [
                          { text: sub.name, rowSpan: 2, bold: true, alignment: 'left', margin: [0, 5] },
                          { text: 'SUB', fontSize: 8, alignment: 'center', color: '#64748b' }
                      ];
                      
                      exams.forEach(ex => {
                          row1.push({ text: String(helpers.getMaxMark(marks, ex.id, sub.id, 'Subjective')), fontSize: 8, alignment: 'center', color: '#94a3b8' });
                          row1.push({ text: String(helpers.getMark(marks, ex.id, sub.id, 'Subjective')), fontSize: 9, bold: true, alignment: 'center' });
                      });

                      row1.push({ text: `${stats.obtained} / ${stats.max}`, rowSpan: 2, alignment: 'center', margin: [0, 5], fontSize: 9 });
                      row1.push({ text: `${stats.percentage}%`, rowSpan: 2, alignment: 'center', margin: [0, 5], fontSize: 9, bold: true });
                      row1.push({ text: stats.grade, rowSpan: 2, alignment: 'center', margin: [0, 5], fontSize: 9, bold: true, color: '#312e81' });

                      tableBody.push(row1);

                      // Row 2 (Objective)
                      const row2: any[] = [
                          {},
                          { text: 'OBJ', fontSize: 8, alignment: 'center', color: '#64748b' }
                      ];
                      
                      exams.forEach(ex => {
                          row2.push({ text: String(helpers.getMaxMark(marks, ex.id, sub.id, 'Objective')), fontSize: 8, alignment: 'center', color: '#94a3b8' });
                          row2.push({ text: String(helpers.getMark(marks, ex.id, sub.id, 'Objective')), fontSize: 9, bold: true, alignment: 'center' });
                      });
                      
                      // Empty cells for rowspan
                      row2.push({});
                      row2.push({});
                      row2.push({});

                      tableBody.push(row2);
                  });

                  // Width definition
                  const widths = [subWidth, typeWidth];
                  exams.forEach(() => { widths.push(examWidth); widths.push(examWidth); });
                  widths.push(35); widths.push(35); widths.push(30);

                  pageContent.push({
                      table: {
                          headerRows: 2,
                          widths: widths,
                          body: tableBody
                      },
                      layout: 'lightHorizontalLines',
                      fontSize: tblBlock.style.fontSize * scale, // scale font
                      absolutePosition: { x: tblBlock.x * scale, y: tblBlock.y * scale }
                  });
              }

              // Remarks
              const remBlock = getB('remarks');
              if (remBlock) {
                  const remText = subjects.map(s => {
                      const r = helpers.getRemark(marks, s.id);
                      return r ? `${s.name}: ${r}` : null;
                  }).filter(Boolean).join('\n') || "Progressing well. Consistent efforts will lead to better results.";

                  pageContent.push({
                      stack: [
                          { text: 'REMARKS', fontSize: 8, bold: true, color: '#312e81', margin: [0, 0, 0, 2] },
                          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: remBlock.w * scale, y2: 0, lineWidth: 1, lineColor: '#e2e8f0' }] },
                          { text: remText, fontSize: remBlock.style.fontSize * scale, italics: true, color: '#475569', margin: [0, 5, 0, 0] }
                      ],
                      absolutePosition: { x: remBlock.x * scale, y: remBlock.y * scale },
                      width: remBlock.w * scale
                  });
              }

              // Overall Result
              const ovrBlock = getB('overall');
              if (ovrBlock) {
                  pageContent.push({
                      stack: [
                          { text: 'FINAL RESULT', fontSize: 8, bold: true, alignment: 'center', color: '#64748b' },
                          { text: overallStats.overallGrade, fontSize: 24, bold: true, alignment: 'center', color: '#312e81', margin: [0, 5] },
                          { 
                              columns: [
                                  { text: `${overallStats.totalPct}%`, alignment: 'center', bold: true },
                                  { text: overallStats.overallGrade === 'F' ? 'FAIL' : 'PASS', alignment: 'center', bold: true }
                              ]
                          }
                      ],
                      absolutePosition: { x: ovrBlock.x * scale, y: ovrBlock.y * scale },
                      width: ovrBlock.w * scale
                  });
              }

              // Signatures
              const sigBlock = getB('signatures');
              if (sigBlock) {
                  pageContent.push({
                      columns: [
                          { stack: [{canvas:[{type:'line', x1:0, y1:0, x2:80, y2:0}]}, {text:'Class Teacher', fontSize:9, margin:[0,5]}] },
                          { stack: [{canvas:[{type:'line', x1:0, y1:0, x2:80, y2:0}]}, {text:'Principal', fontSize:9, margin:[0,5]}] },
                          { stack: [{canvas:[{type:'line', x1:0, y1:0, x2:80, y2:0}]}, {text:'Parent', fontSize:9, margin:[0,5]}] }
                      ],
                      absolutePosition: { x: sigBlock.x * scale, y: sigBlock.y * scale },
                      width: sigBlock.w * scale,
                      alignment: 'center'
                  });
              }

              content.push(pageContent);
              
              // Page Break for all except last
              if (i < studentsToPrint.length - 1) {
                  content.push({ text: '', pageBreak: 'after' });
              }
          }

          const docDefinition = {
              pageSize: 'A4',
              pageMargins: [0, 0, 0, 0],
              content: content,
              defaultStyle: {
                  font: 'Roboto'
              }
          };

          pdfMake.createPdf(docDefinition).download(`Score_Cards_${new Date().getTime()}.pdf`);
          showToast("PDF generated successfully", 'success');

      } catch (e: any) { 
          console.error(e);
          showToast("PDF Error: " + e.message, 'error'); 
      } finally { 
          setDownloading(false); 
      }
  };

  // --- Asset Management ---
  const saveSchoolAssets = async () => {
      setIsSavingAssets(true);
      try {
          await DataService.updateSchoolInfo(schoolInfo);
          showToast("School branding saved successfully", 'success');
      } catch (e) {
          showToast("Failed to save branding. Check database.", 'error');
      } finally {
          setIsSavingAssets(false);
      }
  };

  const handleGlobalAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'watermark') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        showToast(`Uploading ${type}...`, 'info');
        // Upload to bucket
        const publicUrl = await DataService.uploadFile(file, 'branding');
        setSchoolInfo(prev => ({ ...prev, [type]: publicUrl }));
        showToast("Upload successful. Don't forget to save.", 'success');
    } catch (error: any) {
        console.error(error);
        showToast("Upload failed", 'error');
    }
  };

  // --- Layout Engine Logic ---
  const handleDragStart = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(activeTab !== 'layout') return;
      isDragging.current = true;
      setSelectedBlockId(id);
      const block = layout.find(b => b.id === id);
      if(block) {
          dragStart.current = { x: e.clientX, y: e.clientY };
          blockStart.current = { x: block.x, y: block.y };
      }
  };

  const handleResizeStart = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(activeTab !== 'layout') return;
      isResizing.current = true;
      setSelectedBlockId(id);
      const block = layout.find(b => b.id === id);
      if(block) {
          resizeStart.current = { x: e.clientX, y: e.clientY };
          dimStart.current = { w: block.w, h: block.h };
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (activeTab !== 'layout') return;
      
      const scaleFactor = 0.65; // Matches the visual scale in Layout Tab

      if (isDragging.current && selectedBlockId) {
          const dx = (e.clientX - dragStart.current.x) / scaleFactor;
          const dy = (e.clientY - dragStart.current.y) / scaleFactor;
          setLayout(prev => prev.map(b => b.id === selectedBlockId ? { ...b, x: blockStart.current.x + dx, y: blockStart.current.y + dy } : b));
      } else if (isResizing.current && selectedBlockId) {
          const dx = (e.clientX - resizeStart.current.x) / scaleFactor;
          const dy = (e.clientY - resizeStart.current.y) / scaleFactor;
          setLayout(prev => prev.map(b => b.id === selectedBlockId ? { ...b, w: Math.max(50, dimStart.current.w + dx), h: Math.max(20, dimStart.current.h + dy) } : b));
      }
  };

  const handleMouseUp = () => {
      isDragging.current = false;
      isResizing.current = false;
  };

  const updateBlockStyle = (key: string, value: any) => {
      if(!selectedBlockId) return;
      setLayout(prev => prev.map(b => b.id === selectedBlockId ? { ...b, style: { ...b.style, [key]: value } } : b));
  };

  return (
    <div className="space-y-8 no-print-space h-full flex flex-col" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="flex flex-col md:flex-row justify-between items-center no-print gap-4 shrink-0">
        <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Academic Score Card</h1>
            <p className="text-slate-500">Generate, customize, and print student reports</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
            <button onClick={() => setActiveTab('single')} className={clsx("px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2", activeTab === 'single' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50")}>Single</button>
            <button onClick={() => setActiveTab('bulk')} className={clsx("px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2", activeTab === 'bulk' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50")}>Bulk</button>
            <button onClick={() => setActiveTab('layout')} className={clsx("px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2", activeTab === 'layout' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50")}>
                <Layout size={16} /> Layout
            </button>
        </div>
      </div>

      {activeTab !== 'layout' && (
      <div className="flex flex-wrap justify-between items-center no-print bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4 shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
               <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.className} - {c.section}</option>)}
               </select>
               {activeTab === 'single' && (
                   <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                        <option value="">Select Student...</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                   </select>
               )}
          </div>
          <div className="flex gap-3">
              {activeTab === 'bulk' && bulkViewMode === 'selection' ? (
                  <button onClick={handleGeneratePreview} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">Preview All</button>
              ) : (
                  <button onClick={handleDownloadPDF} disabled={downloading} className="bg-slate-100 px-4 py-2 rounded-xl flex items-center gap-2 text-slate-800 font-medium hover:bg-slate-200 shadow-sm">
                      {downloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} PDF
                  </button>
              )}
          </div>
      </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 relative flex justify-center overflow-auto">
        {activeTab === 'layout' ? (
            <div className="flex gap-6 w-full h-[calc(100vh-14rem)]">
                {/* Editor Canvas (Left Side) */}
                <div className="flex-1 bg-slate-200/50 rounded-xl overflow-auto border border-slate-300 flex justify-center p-8 relative">
                    <div className="relative shadow-2xl bg-white origin-top" style={{ width: '794px', height: '1123px', transform: 'scale(0.65)' }}>
                        {/* Decorative Background for Editor */}
                        <div className="absolute inset-0 border-[3px] border-indigo-900 m-3 pointer-events-none z-0 rounded-sm opacity-50"></div>
                        
                        {/* Render Draggable Blocks */}
                        {layout.filter(l => l.isVisible).map(block => (
                             <div 
                                key={block.id}
                                className={clsx(
                                    "absolute border-2 cursor-move group transition-colors", 
                                    selectedBlockId === block.id ? "border-blue-500 z-50 bg-blue-50/20" : "border-transparent hover:border-slate-300 hover:bg-slate-50/20 z-10"
                                )}
                                style={{ left: block.x, top: block.y, width: block.w, height: block.h }}
                                onMouseDown={(e) => handleDragStart(e, block.id)}
                             >
                                 {/* Helper Label */}
                                 <div className="absolute -top-5 left-0 bg-blue-500 text-white text-[10px] px-1.5 rounded-t opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                     {block.label} ({Math.round(block.w)}x{Math.round(block.h)})
                                 </div>
                                 
                                 {/* Content Preview */}
                                 <div className="w-full h-full pointer-events-none overflow-hidden">
                                     <BlockRenderer 
                                        block={block}
                                        schoolInfo={schoolInfo}
                                        student={dummyStudent}
                                        marks={[]} 
                                        exams={exams} 
                                        subjects={subjects} 
                                        helpers={helpers} 
                                        overallStats={overallStats}
                                     />
                                 </div>

                                 {/* Resize Handle */}
                                 {selectedBlockId === block.id && (
                                     <div 
                                        className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize z-50 shadow-sm"
                                        onMouseDown={(e) => handleResizeStart(e, block.id)}
                                     ></div>
                                 )}
                             </div>
                        ))}
                    </div>
                </div>

                {/* Layout Sidebar (Right Side) */}
                <div className="w-80 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0">
                    <div className="p-2 border-b border-slate-200 grid grid-cols-2 gap-1 bg-slate-50">
                        <button 
                            onClick={() => setLayoutSidebarTab('structure')}
                            className={clsx("flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-colors", layoutSidebarTab === 'structure' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:bg-slate-100")}
                        >
                            <Layout size={14} /> Structure
                        </button>
                        <button 
                            onClick={() => setLayoutSidebarTab('branding')}
                            className={clsx("flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-colors", layoutSidebarTab === 'branding' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:bg-slate-100")}
                        >
                            <School size={14} /> Branding
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {layoutSidebarTab === 'structure' && (
                            <>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Visible Blocks</h4>
                                    <div className="space-y-2">
                                        {layout.map(block => (
                                            <div key={block.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                                    <Move size={14} className="text-slate-400" />
                                                    {block.label}
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={block.isVisible} 
                                                    onChange={() => setLayout(prev => prev.map(b => b.id === block.id ? { ...b, isVisible: !b.isVisible } : b))}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedBlockId && (
                                    <div className="border-t border-slate-200 pt-4">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Palette size={14} /> Style: {layout.find(b => b.id === selectedBlockId)?.label}
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Font Size (px)</label>
                                                <input 
                                                    type="number" 
                                                    className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900"
                                                    value={layout.find(b => b.id === selectedBlockId)?.style.fontSize}
                                                    onChange={(e) => updateBlockStyle('fontSize', parseInt(e.target.value))}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Text Color</label>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="color" 
                                                        className="h-8 w-12 p-0.5 border border-slate-300 rounded cursor-pointer"
                                                        value={layout.find(b => b.id === selectedBlockId)?.style.color}
                                                        onChange={(e) => updateBlockStyle('color', e.target.value)}
                                                    />
                                                    <span className="text-xs text-slate-600 font-mono">{layout.find(b => b.id === selectedBlockId)?.style.color}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => updateBlockStyle('textAlign', 'left')} 
                                                    className={clsx("flex-1 py-1 text-xs border rounded hover:bg-slate-100", layout.find(b => b.id === selectedBlockId)?.style.textAlign === 'left' && "bg-slate-200 font-bold")}
                                                >Left</button>
                                                <button 
                                                    onClick={() => updateBlockStyle('textAlign', 'center')} 
                                                    className={clsx("flex-1 py-1 text-xs border rounded hover:bg-slate-100", layout.find(b => b.id === selectedBlockId)?.style.textAlign === 'center' && "bg-slate-200 font-bold")}
                                                >Center</button>
                                                <button 
                                                    onClick={() => updateBlockStyle('textAlign', 'right')} 
                                                    className={clsx("flex-1 py-1 text-xs border rounded hover:bg-slate-100", layout.find(b => b.id === selectedBlockId)?.style.textAlign === 'right' && "bg-slate-200 font-bold")}
                                                >Right</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="pt-4 border-t border-slate-200">
                                     <button onClick={() => setLayout(DEFAULT_LAYOUT)} className="w-full flex items-center justify-center gap-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 py-2 rounded-lg transition-colors">
                                         <RotateCcw size={14} /> Reset Layout
                                     </button>
                                </div>
                            </>
                        )}

                        {layoutSidebarTab === 'branding' && (
                             <div className="space-y-4 animate-in slide-in-from-left duration-300">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">School Name</label>
                                    <input type="text" className="w-full p-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white" value={schoolInfo.name} onChange={(e) => setSchoolInfo(prev => ({ ...prev, name: e.target.value.toUpperCase() }))} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tagline</label>
                                    <input type="text" className="w-full p-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white" value={schoolInfo.tagline} onChange={(e) => setSchoolInfo(prev => ({ ...prev, tagline: e.target.value }))} />
                                </div>
                                <div className="pt-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Primary Logo</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                                            {schoolInfo.logo ? <img src={schoolInfo.logo} className="w-full h-full object-contain" /> : <ImageIcon size={24} className="text-slate-300" />}
                                        </div>
                                        <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-900">
                                            <Upload size={14} /> Upload Logo
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleGlobalAssetUpload(e, 'logo')} />
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Watermark</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                                            {schoolInfo.watermark ? <img src={schoolInfo.watermark} className="w-full h-full object-contain opacity-30" /> : <Droplet size={24} className="text-slate-300" />}
                                        </div>
                                        <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-50">
                                            <Upload size={14} /> Upload
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleGlobalAssetUpload(e, 'watermark')} />
                                        </label>
                                    </div>
                                </div>
                                <button onClick={saveSchoolAssets} disabled={isSavingAssets} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 shadow-sm">
                                    {isSavingAssets ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save Assets
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ) : (
            <div ref={reportContainerRef} className="flex justify-center">
                {activeTab === 'single' ? (
                    currentStudent && (
                        <CustomizableScoreCard 
                            student={currentStudent} 
                            marks={studentMarks} 
                            exams={exams} 
                            subjects={subjects} 
                            helpers={helpers} 
                            schoolInfo={schoolInfo} 
                            layout={layout}
                        />
                    )
                ) : (
                    bulkViewMode === 'selection' ? (
                        <div className="w-full bg-white rounded-xl border border-slate-200 p-4 no-print max-w-5xl">
                            <div className="flex justify-between mb-4"><h3 className="font-bold text-slate-800">Select Students</h3><button onClick={toggleSelectAll} className="text-blue-600 text-xs font-bold">Toggle All</button></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {students.map(s => (
                                    <div key={s.id} onClick={() => { const n = new Set(bulkSelection); if(n.has(s.id)) n.delete(s.id); else n.add(s.id); setBulkSelection(n); }} className={clsx("p-3 border rounded-lg cursor-pointer flex items-center gap-3", bulkSelection.has(s.id) ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-200")}>
                                        {bulkSelection.has(s.id) ? <CheckSquare className="text-indigo-600" /> : <Square className="text-slate-300"/>} <span className="text-slate-800 font-medium">{s.fullName}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            {students.filter(s => bulkSelection.has(s.id)).map(s => (
                                <CustomizableScoreCard 
                                    key={s.id} 
                                    student={s} 
                                    marks={bulkMarks[s.id] || []} 
                                    exams={exams} 
                                    subjects={subjects} 
                                    helpers={helpers} 
                                    schoolInfo={schoolInfo} 
                                    layout={layout}
                                />
                            ))}
                        </div>
                    )
                )}
            </div>
        )}
      </div>
    </div>
  );
};
