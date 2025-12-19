
import React, { useState, useEffect, useRef } from 'react';
import { DataService } from '../services/dataService';
import { Student, Exam, Subject, MarkRecord, SchoolClass, NonAcademicRecord } from '../types';
import { useToast } from '../components/ToastContext';
import { 
  Printer, Trophy, Loader2, Download, Layout, Move, Palette, Save, 
  RotateCcw, Upload, Droplet, School, CheckSquare, Square, ImageIcon, 
  Activity, UserCheck, MessageSquare, Handshake, ChevronDown, Info, MessageSquareQuote
} from 'lucide-react';
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
    type: 'school_name' | 'tagline' | 'logo' | 'header_info' | 'student_info' | 'marks_table' | 'non_academic' | 'remarks' | 'signatures' | 'custom_text';
    label: string;
    x: number;
    y: number;
    w: number;
    h: number; 
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
    { id: 'logo', type: 'logo', label: 'School Logo', x: 347, y: 20, w: 100, h: 60, style: { fontSize: 0, color: '', border: false }, isVisible: true },
    { id: 'header_info', type: 'header_info', label: 'Session Info', x: 48, y: 90, w: 698, h: 30, style: { fontSize: 12, color: '#64748b', textAlign: 'center' }, isVisible: true },
    { id: 'student_info', type: 'student_info', label: 'Student Details', x: 48, y: 135, w: 698, h: 110, style: { fontSize: 14, color: '#000000', textAlign: 'left', border: true, padding: 10 }, isVisible: true },
    { id: 'marks_table', type: 'marks_table', label: 'Marks Table', x: 48, y: 265, w: 698, h: 440, style: { fontSize: 11, color: '#000000', textAlign: 'center' }, isVisible: true },
    { id: 'non_academic', type: 'non_academic', label: 'Non-Academic Skills', x: 48, y: 725, w: 698, h: 80, style: { fontSize: 10, color: '#1e293b', border: true }, isVisible: true },
    { id: 'remarks', type: 'remarks', label: 'Remarks Section', x: 48, y: 820, w: 340, h: 140, style: { fontSize: 12, color: '#334155', border: true, padding: 12 }, isVisible: true },
    { id: 'overall', type: 'custom_text', label: 'Overall Result', x: 408, y: 820, w: 338, h: 140, style: { fontSize: 14, color: '#1e1b4b', textAlign: 'center', border: true, backgroundColor: '#f8fafc', padding: 20 }, isVisible: true },
    { id: 'signatures', type: 'signatures', label: 'Signatures', x: 48, y: 980, w: 698, h: 80, style: { fontSize: 10, color: '#64748b', textAlign: 'center' }, isVisible: true },
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
    nonAcademic: NonAcademicRecord | null;
    exams: Exam[];
    subjects: Subject[];
    helpers: ReturnType<typeof useScoreCalculations>;
    overallStats: { totalPct: string, overallGrade: string };
}> = ({ block, schoolInfo, student, marks, nonAcademic, exams, subjects, helpers, overallStats }) => {
    
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
        case 'header_info':
            return (
                <div className="w-full h-full flex justify-center items-end px-2 font-sans text-slate-500 border-b border-slate-200 pb-1" style={{ fontSize: `${block.style.fontSize}px` }}>
                    <div className="text-center">
                         <span className="bg-indigo-900 text-white px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mx-2">Academic Report</span>
                         <span className="font-bold uppercase tracking-widest text-slate-700">SESSION 2024-2025</span>
                    </div>
                </div>
            );
        case 'student_info':
            return (
                <div className={clsx("w-full font-sans bg-white/60", block.style.border && "border border-slate-300 rounded-lg overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.02)] flex flex-col")}>
                     <div className="grid grid-cols-4 bg-[#f8fafc] border-b border-slate-200">
                        <div className="p-2.5 border-r border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-tight flex items-center">Student Name</div>
                        <div className="p-2.5 border-r border-slate-200 col-span-3 font-black text-[#1e1b4b] flex items-center uppercase" style={{ fontSize: `${block.style.fontSize}px` }}>{student.fullName}</div>
                    </div>
                    <div className="grid grid-cols-4 border-b border-slate-200">
                        <div className="p-2.5 border-r border-slate-200 bg-white text-[9px] font-black text-slate-400 uppercase tracking-tight flex items-center">Parent's Name</div>
                        <div className="p-2.5 border-r border-slate-200 col-span-3 font-bold text-slate-800 flex items-center" style={{ fontSize: `${block.style.fontSize}px` }}>{student.guardianName}</div>
                    </div>
                    <div className="grid grid-cols-4">
                        <div className="p-2.5 border-r border-slate-200 bg-[#f8fafc] text-[9px] font-black text-slate-400 uppercase tracking-tight flex items-center">Class / Section</div>
                        <div className="p-2.5 border-r border-slate-200 font-bold text-slate-800 flex items-center" style={{ fontSize: `${block.style.fontSize}px` }}>{student.className} - {student.section}</div>
                        <div className="p-2.5 border-r border-slate-200 bg-[#f8fafc] text-[9px] font-black text-slate-400 uppercase tracking-tight flex items-center">Roll Number</div>
                        <div className="p-2.5 font-bold text-slate-800 font-mono flex items-center" style={{ fontSize: `${block.style.fontSize}px` }}>{student.rollNumber}</div>
                    </div>
                </div>
            );
        case 'marks_table':
            return (
                <div className="w-full font-sans overflow-hidden flex flex-col">
                     <div className="rounded-t-lg bg-[#1e1b4b] text-white p-2 text-center text-[10px] font-black uppercase tracking-widest shrink-0">Academic Performance</div>
                     <div className="border-x border-b border-slate-400 shadow-sm overflow-hidden bg-white/70">
                        <table className="w-full text-center border-collapse table-fixed">
                             <thead>
                                <tr className="bg-[#f1f5f9] text-[#1e1b4b] font-black uppercase tracking-wider" style={{ fontSize: '10px' }}>
                                    <th style={{width: `${WIDTH_SUBJECT}px`}} rowSpan={2} className="py-2 px-2 border-r border-slate-400">Subject</th>
                                    <th style={{width: `${WIDTH_TYPE}px`}} rowSpan={2} className="py-2 px-1 border-r border-slate-400">Type</th>
                                    {exams.map(exam => (
                                        <th key={exam.id} colSpan={2} className="py-1 px-1 border-r border-slate-400 border-b border-slate-400">{exam.name}</th>
                                    ))}
                                    <th style={{width: `${WIDTH_RESULT}px`}} colSpan={3} className="py-2 bg-[#e2e8f0]">Overall</th>
                                </tr>
                                <tr className="bg-[#f8fafc] text-slate-500 uppercase font-black border-b border-slate-400" style={{ fontSize: '8px' }}>
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
                                            <td rowSpan={2} className="border-r border-slate-400 font-black text-left px-3 py-1.5 align-middle text-[#1e1b4b] bg-white/50 uppercase">{sub.name}</td>
                                            <td className="border-r border-slate-400 text-[8px] text-slate-400 font-black uppercase tracking-widest text-center py-1.5 bg-[#f8fafc]/80">SUB</td>
                                            {exams.map(exam => (
                                                <React.Fragment key={exam.id}>
                                                    <td className="border-r border-slate-200 text-slate-300 py-1.5 text-xs">{helpers.getMaxMark(marks, exam.id, sub.id, 'Subjective')}</td>
                                                    <td className="border-r border-slate-400 font-bold py-1.5 text-black">{helpers.getMark(marks, exam.id, sub.id, 'Subjective')}</td>
                                                </React.Fragment>
                                            ))}
                                            <td rowSpan={2} className="border-r border-slate-400 font-bold text-slate-800 align-middle bg-[#f1f5f9]/40">{stats.obtained} / {stats.max}</td>
                                            <td rowSpan={2} className="border-r border-slate-400 font-bold text-indigo-700 align-middle bg-[#f1f5f9]/40">{stats.percentage}%</td>
                                            <td rowSpan={2} className="font-black text-[#1e1b4b] align-middle bg-[#f1f5f9]/40">{stats.grade}</td>
                                        </tr>
                                        <tr className="border-b border-slate-400">
                                            <td className="border-r border-slate-400 text-[8px] text-slate-400 font-black uppercase tracking-widest text-center py-1.5 bg-[#f8fafc]/80">OBJ</td>
                                            {exams.map(exam => (
                                                <React.Fragment key={exam.id}>
                                                     <td className="border-r border-slate-200 text-slate-300 py-1.5 text-xs">{helpers.getMaxMark(marks, exam.id, sub.id, 'Objective')}</td>
                                                     <td className="border-r border-slate-400 font-bold py-1.5 text-black">{helpers.getMark(marks, exam.id, sub.id, 'Objective')}</td>
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
        case 'non_academic':
            return (
                <div className={clsx("w-full h-full font-sans overflow-hidden bg-white flex flex-col", block.style.border && "border border-slate-300 rounded-lg")}>
                     <div className="bg-[#f1f5f9] text-[#1e1b4b] p-1.5 text-center text-[10px] font-black uppercase tracking-widest border-b border-slate-300 shrink-0">Non-Academic Performance & Traits</div>
                     <div className="grid grid-cols-4 flex-1 divide-x divide-slate-200">
                        <div className="flex flex-col items-center justify-center bg-white hover:bg-slate-50 transition-colors">
                            <Activity size={16} className="text-indigo-600 mb-0.5" />
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Attendance</span>
                            <span className="text-xs font-black text-[#1e1b4b] mt-0.5">{nonAcademic?.attendance || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center bg-white hover:bg-slate-50 transition-colors">
                            <UserCheck size={16} className="text-emerald-600 mb-0.5" />
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Discipline</span>
                            <span className="text-xs font-black text-[#1e1b4b] mt-0.5">{nonAcademic?.discipline || 'A'}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center bg-white hover:bg-slate-50 transition-colors">
                            <MessageSquare size={16} className="text-amber-600 mb-0.5" />
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Communication</span>
                            <span className="text-xs font-black text-[#1e1b4b] mt-0.5">{nonAcademic?.communication || 'A'}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center bg-white hover:bg-slate-50 transition-colors">
                            <Handshake size={16} className="text-blue-600 mb-0.5" />
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Participation</span>
                            <span className="text-xs font-black text-[#1e1b4b] mt-0.5">{nonAcademic?.participation || 'A'}</span>
                        </div>
                     </div>
                </div>
            );
        case 'remarks':
            return (
                <div className={clsx("w-full h-full bg-white/80 overflow-hidden", block.style.border && "border border-slate-300 rounded-lg p-3")}>
                     <h4 className="font-black text-[#1e1b4b] uppercase text-[9px] mb-2 border-b border-slate-200 pb-1 flex items-center gap-1">
                        <MessageSquareQuote size={10} /> Teacher's Comments
                     </h4>
                     <div className="text-slate-600 space-y-1" style={{ fontSize: `${block.style.fontSize}px` }}>
                        {subjects.map(s => {
                            const r = helpers.getRemark(marks, s.id);
                            return r ? (
                                <div key={s.id} className="leading-tight">
                                    <span className="font-bold text-[9px] text-[#1e1b4b] uppercase">{s.name}:</span> <span className="italic text-slate-500 font-medium">"{r}"</span>
                                </div>
                            ) : null;
                        })}
                        {!subjects.some(s => helpers.getRemark(marks, s.id)) && <p className="italic text-slate-400 text-[10px]">Consistent performance and active participation noted across sessions.</p>}
                     </div>
                </div>
            );
        case 'custom_text':
            return (
                <div className={clsx("w-full h-full flex flex-col justify-between items-center text-center", block.style.border && "border border-slate-300 rounded-lg")} style={{ backgroundColor: block.style.backgroundColor }}>
                     <div className="w-full pt-2">
                        <div className="text-[8px] uppercase text-slate-400 font-black tracking-widest mb-0.5">Final Outcome</div>
                        <div className="font-black text-[#1e1b4b] drop-shadow-sm" style={{ fontSize: `56px`, lineHeight: 1 }}>{overallStats.overallGrade}</div>
                     </div>
                     <div className="w-full flex justify-center gap-4 text-[9px] font-black text-[#1e1b4b] bg-slate-100 py-1.5 rounded-b-lg tracking-widest">
                         <span>{overallStats.totalPct}%</span>
                         <span className={clsx(overallStats.overallGrade === 'F' ? 'text-red-600' : 'text-emerald-600')}>
                            {overallStats.overallGrade === 'F' ? 'FAIL' : 'PASS'}
                         </span>
                     </div>
                </div>
            );
        case 'signatures':
            return (
                <div className="w-full h-full flex justify-between items-end px-4" style={{ fontSize: `${block.style.fontSize}px` }}>
                    <div className="text-center"><div className="w-32 border-b border-slate-400 mb-1 mx-auto"></div><p className="font-black text-slate-400 uppercase text-[8px] tracking-widest">Guardian's Sign</p></div>
                    <div className="text-center"><div className="w-32 border-b border-slate-400 mb-1 mx-auto"></div><p className="font-black text-slate-400 uppercase text-[8px] tracking-widest">Class Teacher</p></div>
                    <div className="text-center"><div className="w-32 border-b border-slate-400 mb-1 mx-auto"></div><p className="font-black text-slate-400 uppercase text-[8px] tracking-widest">Principal</p></div>
                </div>
            );
        default:
            return null;
    }
};

// --- Customizable Score Card Component ---
const CustomizableScoreCard: React.FC<{
    student: Student;
    marks: MarkRecord[];
    nonAcademic: NonAcademicRecord | null;
    exams: Exam[];
    subjects: Subject[];
    helpers: ReturnType<typeof useScoreCalculations>;
    schoolInfo: { name: string, tagline: string, logo: string, watermark: string };
    layout: LayoutBlock[];
    scale?: number;
    isPreview?: boolean;
}> = ({ student, marks, nonAcademic, exams, subjects, helpers, schoolInfo, layout, scale = 1, isPreview = false }) => {
    const overallStats = helpers.calculateOverall(marks);
    const PAGE_WIDTH = 794;
    const PAGE_HEIGHT = 1123;
    
    return (
        <div 
            className="scorecard-wrapper flex-shrink-0"
            style={{ width: `${PAGE_WIDTH * scale}px`, height: `${PAGE_HEIGHT * scale}px`, marginBottom: isPreview ? '2.5rem' : '0' }}
        >
            <div 
                className={clsx("scorecard-page relative bg-white shadow-2xl overflow-hidden", !isPreview && "pointer-events-none")} 
                style={{ width: `${PAGE_WIDTH}px`, height: `${PAGE_HEIGHT}px`, transform: `scale(${scale})`, transformOrigin: 'top left' }}
            >
                 {schoolInfo.watermark && (
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.03] grayscale">
                         <img src={schoolInfo.watermark} className="w-[80%] max-h-[80%] object-contain" />
                     </div>
                 )}

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
                            nonAcademic={nonAcademic}
                            exams={exams}
                            subjects={subjects}
                            helpers={helpers}
                            overallStats={overallStats}
                         />
                     </div>
                 ))}
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
  const [studentNonAcademic, setStudentNonAcademic] = useState<NonAcademicRecord | null>(null);
  
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'layout'>('single');
  const [bulkViewMode, setBulkViewMode] = useState<'selection' | 'preview'>('selection');
  const [bulkSelection, setBulkSelection] = useState<Set<string>>(new Set());
  const [bulkMarks, setBulkMarks] = useState<Record<string, MarkRecord[]>>({});
  const [bulkNonAcademic, setBulkNonAcademic] = useState<Record<string, NonAcademicRecord>>({});
  
  // Layout State
  const [layout, setLayout] = useState<LayoutBlock[]>(DEFAULT_LAYOUT);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [layoutSidebarTab, setLayoutSidebarTab] = useState<'structure' | 'branding'>('structure');
  
  const [loadingBulk, setLoadingBulk] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isSavingAssets, setIsSavingAssets] = useState(false);
  
  const { showToast } = useToast();
  const helpers = useScoreCalculations(exams, subjects);
  const overallStats = helpers.calculateOverall([]); 
  const reportContainerRef = useRef<HTMLDivElement>(null);

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
        setBulkNonAcademic({});
        setBulkViewMode('selection');
    };
    loadStudents();
  }, [selectedClassId, classes]);

  useEffect(() => {
    if(!selectedStudentId) return;
    const loadData = async () => {
        try {
            const [marks, nonAcademicRecords] = await Promise.all([
                DataService.getStudentHistory(selectedStudentId),
                // We fetch all records for current exam context
                exams.length > 0 ? DataService.getNonAcademicRecords(exams[0].id) : Promise.resolve([])
            ]);
            setStudentMarks(marks);
            const studentRecord = nonAcademicRecords.find(r => r.studentId === selectedStudentId);
            setStudentNonAcademic(studentRecord || null);
        } catch(e) {
            showToast("Failed to load data", 'error');
        }
    };
    loadData();
  }, [selectedStudentId, exams]);

  const handleGeneratePreview = async () => {
      if (bulkSelection.size === 0) { showToast("Select at least one student", 'error'); return; }
      setLoadingBulk(true);
      try {
          const marksData: Record<string, MarkRecord[]> = {};
          const nonAcademicData: Record<string, NonAcademicRecord> = {};
          const selectedStudents = students.filter(s => bulkSelection.has(s.id));
          
          const examId = exams.length > 0 ? exams[0].id : '';
          const nonAcadRecords = examId ? await DataService.getNonAcademicRecords(examId) : [];

          await Promise.all(selectedStudents.map(async (student) => {
              const history = await DataService.getStudentHistory(student.id);
              marksData[student.id] = history;
              const na = nonAcadRecords.find(r => r.studentId === student.id);
              if (na) nonAcademicData[student.id] = na;
          }));

          setBulkMarks(marksData);
          setBulkNonAcademic(nonAcademicData);
          setBulkViewMode('preview');
      } catch (e) { showToast("Failed to load bulk data", 'error'); } finally { setLoadingBulk(false); }
  };

  const handlePrintInNewTab = () => {
      if (!reportContainerRef.current) return;
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
          showToast("Pop-up blocked. Please allow pop-ups for printing.", "error");
          return;
      }

      const clonedContainer = reportContainerRef.current.cloneNode(true) as HTMLElement;
      
      const wrappers = clonedContainer.querySelectorAll('.scorecard-wrapper');
      wrappers.forEach((wrapper: any) => {
          wrapper.style.width = '794px';
          wrapper.style.height = '1123px';
          wrapper.style.margin = '0 auto';
          wrapper.style.transform = 'none';
      });

      const pages = clonedContainer.querySelectorAll('.scorecard-page');
      pages.forEach((page: any) => {
          page.style.transform = 'none';
          page.style.margin = '0 auto';
          page.style.boxShadow = 'none';
          page.style.border = 'none';
      });

      printWindow.document.write(`
          <html>
            <head>
              <title>Print Score Cards</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
              <style>
                @media print {
                  body { background: white !important; margin: 0; padding: 0; }
                  .no-print { display: none !important; }
                  .scorecard-wrapper { page-break-after: always; margin: 0 !important; display: block !important; }
                  * { 
                    -webkit-print-color-adjust: exact !important; 
                    print-color-adjust: exact !important; 
                    color-adjust: exact !important;
                  }
                  @page { size: A4; margin: 0; }
                }
                body { font-family: 'Inter', sans-serif; background: #f1f5f9; padding: 40px 0; }
                .print-now-btn {
                    position: fixed; top: 20px; right: 20px; z-index: 1000;
                    background: #4f46e5; color: white; padding: 12px 24px; 
                    border-radius: 12px; font-weight: bold; cursor: pointer; 
                    box-shadow: 0 10px 15px -3px rgb(79 70 229 / 0.3); border: none;
                    transition: all 0.2s;
                }
                .print-now-btn:hover { background: #4338ca; transform: translateY(-1px); }
                .print-container { display: flex; flex-direction: column; align-items: center; width: 100%; }
              </style>
            </head>
            <body>
              <button class="no-print print-now-btn" onclick="window.print()">
                  Confirm & Print
              </button>
              <div class="print-container">
                ${clonedContainer.innerHTML}
              </div>
              <script>
                window.onload = () => {
                   setTimeout(() => { window.print(); }, 800);
                };
              </script>
            </body>
          </html>
      `);
      printWindow.document.close();
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
      img.onerror = () => resolve("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
      img.src = url;
    });
  };

  const handleDownloadPDF = async () => {
      setDownloading(true);
      try {
          const pdfScale = 0.75;
          const PAGE_W = 595.28;
          const PAGE_H = 841.89;
          let logoBase64 = "";
          let watermarkBase64 = "";
          if (schoolInfo.logo) logoBase64 = await getBase64ImageFromURL(schoolInfo.logo);
          if (schoolInfo.watermark) watermarkBase64 = await getBase64ImageFromURL(schoolInfo.watermark);

          const content: any[] = [];
          const studentsToPrint = activeTab === 'single' 
            ? (currentStudent ? [currentStudent] : []) 
            : students.filter(s => bulkSelection.has(s.id));

          if (studentsToPrint.length === 0) {
              showToast("No students selected", 'error');
              setDownloading(false);
              return;
          }

          for (let i = 0; i < studentsToPrint.length; i++) {
              const student = studentsToPrint[i];
              const marks = activeTab === 'single' ? studentMarks : (bulkMarks[student.id] || []);
              const na = activeTab === 'single' ? studentNonAcademic : (bulkNonAcademic[student.id] || null);
              
              const overallStats = helpers.calculateOverall(marks);
              const getB = (type: string) => layout.find(l => l.type === type && l.isVisible);
              const pageContent: any[] = [];

              if (watermarkBase64) {
                  pageContent.push({
                      image: watermarkBase64, width: 350, opacity: 0.1,
                      absolutePosition: { x: (PAGE_W - 350) / 2, y: (PAGE_H - 300) / 2 }
                  });
              }

              const logoBlock = getB('logo');
              if (logoBlock && logoBase64) {
                  pageContent.push({
                      image: logoBase64, fit: [logoBlock.w * pdfScale, logoBlock.h * pdfScale],
                      absolutePosition: { x: logoBlock.x * pdfScale, y: logoBlock.y * pdfScale }
                  });
              }

              const infoBlock = getB('header_info');
              if (infoBlock) {
                  pageContent.push({
                      columns: [{ text: `Report Card ${new Date().getFullYear()}-${new Date().getFullYear()+1}`, alignment: 'center', bold: true, width: '*' }],
                      fontSize: infoBlock.style.fontSize * pdfScale, color: infoBlock.style.color,
                      absolutePosition: { x: infoBlock.x * pdfScale, y: infoBlock.y * pdfScale }, width: infoBlock.w * pdfScale
                  });
              }

              const stuBlock = getB('student_info');
              if (stuBlock) {
                  pageContent.push({
                      table: {
                          widths: ['30%', '70%'],
                          body: [
                              [{ text: 'STUDENT NAME', bold: true, fillColor: '#f8fafc', fontSize: 9 }, { text: student.fullName, bold: true, fontSize: 11, margin: [5, 0] }],
                              [{ text: "PARENT'S NAME", bold: true, fillColor: '#f8fafc', fontSize: 9 }, { text: student.guardianName, bold: true, fontSize: 10, margin: [5, 0] }],
                              [{ text: 'CLASS / SECTION', bold: true, fillColor: '#f8fafc', fontSize: 9 }, { text: `${student.className} - ${student.section}`, fontSize: 10, margin: [5, 0] }],
                              [{ text: 'ROLL NUMBER', bold: true, fillColor: '#f8fafc', fontSize: 9 }, { text: student.rollNumber, fontSize: 10, margin: [5, 0] }]
                          ]
                      },
                      layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#cbd5e1', vLineColor: () => '#cbd5e1' },
                      absolutePosition: { x: stuBlock.x * pdfScale, y: stuBlock.y * pdfScale }, width: stuBlock.w * pdfScale
                  });
              }

              const tblBlock = getB('marks_table');
              if (tblBlock) {
                  const tableWidth = tblBlock.w * pdfScale;
                  const colSubject = tableWidth * 0.28;
                  const colType = tableWidth * 0.08;
                  const colOverall = tableWidth * 0.28;
                  const colExamSpace = tableWidth - colSubject - colType - colOverall;
                  const colExamCell = colExamSpace / (exams.length * 2);
                  const tableBody: any[] = [];
                  const sortedExams = [...exams].sort((a, b) => a.name.localeCompare(b.name));

                  const headerRow1: any[] = [
                      { text: 'SUBJECT', rowSpan: 2, bold: true, alignment: 'left', margin: [5, 8], fontSize: 9, fillColor: '#f1f5f9' },
                      { text: 'TYPE', rowSpan: 2, bold: true, alignment: 'center', margin: [0, 8], fontSize: 8, fillColor: '#f1f5f9' }
                  ];
                  sortedExams.forEach(e => {
                      headerRow1.push({ text: e.name.toUpperCase(), colSpan: 2, bold: true, alignment: 'center', fontSize: 8, fillColor: '#f1f5f9' });
                      headerRow1.push({});
                  });
                  headerRow1.push({ text: 'OVERALL', colSpan: 3, bold: true, alignment: 'center', fillColor: '#e2e8f0', fontSize: 9 });
                  headerRow1.push({}); headerRow1.push({});

                  const headerRow2: any[] = [{}, {}];
                  sortedExams.forEach(() => {
                      headerRow2.push({ text: 'Max', fontSize: 7, alignment: 'center', bold: true, fillColor: '#f8fafc' });
                      headerRow2.push({ text: 'Obt', fontSize: 7, alignment: 'center', bold: true, fillColor: '#f8fafc' });
                  });
                  headerRow2.push({ text: 'Total', fontSize: 7, alignment: 'center', fillColor: '#f8fafc', bold: true });
                  headerRow2.push({ text: '%', fontSize: 7, alignment: 'center', fillColor: '#f8fafc', bold: true });
                  headerRow2.push({ text: 'Grd', fontSize: 7, alignment: 'center', fillColor: '#f8fafc', bold: true });

                  tableBody.push(headerRow1);
                  tableBody.push(headerRow2);

                  subjects.forEach(sub => {
                      const stats = helpers.calculateSubjectStats(marks, sub.id);
                      const rowSub: any[] = [
                          { text: sub.name, rowSpan: 2, bold: true, alignment: 'left', margin: [5, 4], fontSize: 9 },
                          { text: 'SUB', fontSize: 7, alignment: 'center', color: '#64748b', margin: [0, 4] }
                      ];
                      sortedExams.forEach(ex => {
                          rowSub.push({ text: String(helpers.getMaxMark(marks, ex.id, sub.id, 'Subjective')), fontSize: 7, alignment: 'center', color: '#94a3b8', margin: [0, 4] });
                          rowSub.push({ text: String(helpers.getMark(marks, ex.id, sub.id, 'Subjective')), fontSize: 8, bold: true, alignment: 'center', margin: [0, 4] });
                      });
                      rowSub.push({ text: `${stats.obtained} / ${stats.max}`, rowSpan: 2, alignment: 'center', margin: [0, 8], fontSize: 8, bold: true });
                      rowSub.push({ text: `${stats.percentage}%`, rowSpan: 2, alignment: 'center', margin: [0, 8], fontSize: 8, bold: true, color: '#1e3a8a' });
                      rowSub.push({ text: stats.grade, rowSpan: 2, alignment: 'center', margin: [0, 8], fontSize: 9, bold: true, color: '#312e81' });
                      tableBody.push(rowSub);

                      const rowObj: any[] = [{}, { text: 'OBJ', fontSize: 7, alignment: 'center', color: '#64748b', margin: [0, 4] }];
                      sortedExams.forEach(ex => {
                          rowObj.push({ text: String(helpers.getMaxMark(marks, ex.id, sub.id, 'Objective')), fontSize: 7, alignment: 'center', color: '#94a3b8', margin: [0, 4] });
                          rowObj.push({ text: String(helpers.getMark(marks, ex.id, sub.id, 'Objective')), fontSize: 8, bold: true, alignment: 'center', margin: [0, 4] });
                      });
                      rowObj.push({}); rowObj.push({}); rowObj.push({});
                      tableBody.push(rowObj);
                  });

                  const widthsArr = [colSubject, colType];
                  sortedExams.forEach(() => { widthsArr.push(colExamCell); widthsArr.push(colExamCell); });
                  widthsArr.push(colOverall * 0.4); widthsArr.push(colOverall * 0.35); widthsArr.push(colOverall * 0.25);

                  pageContent.push({
                      table: { headerRows: 2, widths: widthsArr, body: tableBody },
                      layout: {
                          hLineWidth: (i: number) => (i === 0 || i === 2) ? 1 : 0.5,
                          vLineWidth: () => 0.5,
                          hLineColor: (i: number) => (i === 0 || i === 2) ? '#1e1b4b' : '#cbd5e1',
                          vLineColor: () => '#cbd5e1'
                      },
                      absolutePosition: { x: tblBlock.x * pdfScale, y: tblBlock.y * pdfScale }
                  });
              }

              const naBlock = getB('non_academic');
              if (naBlock) {
                  pageContent.push({
                      table: {
                          widths: ['25%', '25%', '25%', '25%'],
                          body: [
                              [{ text: 'NON-ACADEMIC PERFORMANCE', colSpan: 4, alignment: 'center', bold: true, fontSize: 7, fillColor: '#f1f5f9' }, {}, {}, {}],
                              [
                                { stack: [{ text: 'ATTENDANCE', fontSize: 6, color: '#64748b' }, { text: na?.attendance || 'N/A', bold: true, fontSize: 9 }], alignment: 'center' },
                                { stack: [{ text: 'DISCIPLINE', fontSize: 6, color: '#64748b' }, { text: na?.discipline || 'A', bold: true, fontSize: 9 }], alignment: 'center' },
                                { stack: [{ text: 'COMMUNICATION', fontSize: 6, color: '#64748b' }, { text: na?.communication || 'A', bold: true, fontSize: 9 }], alignment: 'center' },
                                { stack: [{ text: 'PARTICIPATION', fontSize: 6, color: '#64748b' }, { text: na?.participation || 'A', bold: true, fontSize: 9 }], alignment: 'center' }
                              ]
                          ]
                      },
                      layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#cbd5e1', vLineColor: () => '#cbd5e1' },
                      absolutePosition: { x: naBlock.x * pdfScale, y: naBlock.y * pdfScale }, width: naBlock.w * pdfScale
                  });
              }

              const remBlock = getB('remarks');
              if (remBlock) {
                  const remText = subjects.map(s => {
                      const r = helpers.getRemark(marks, s.id);
                      return r ? `${s.name}: ${r}` : null;
                  }).filter(Boolean).join('\n') || "Progressing well. Consistent efforts will lead to better results.";

                  pageContent.push({
                      stack: [{ text: 'REMARKS', fontSize: 8, bold: true, color: '#312e81', margin: [0, 0, 0, 4], decoration: 'underline' }, { text: remText, fontSize: 8.5, italics: true, color: '#475569', lineHeight: 1.2 }],
                      absolutePosition: { x: remBlock.x * pdfScale, y: remBlock.y * pdfScale }, width: remBlock.w * pdfScale
                  });
              }

              const ovrBlock = getB('overall');
              if (ovrBlock) {
                  pageContent.push({
                      stack: [{ text: 'FINAL OUTCOME', fontSize: 9, bold: true, alignment: 'center', color: '#64748b', margin: [0, 5] }, { text: overallStats.overallGrade, fontSize: 36, bold: true, alignment: 'center', color: '#1e1b4b', margin: [0, 5] }, { columns: [{ text: `${overallStats.totalPct}% AGGREGATE`, alignment: 'center', bold: true, fontSize: 10, color: '#1e3a8a' }, { text: overallStats.overallGrade === 'F' ? 'FAIL' : 'PROMOTED', alignment: 'center', bold: true, fontSize: 10, color: '#1e3a8a' }] }],
                      absolutePosition: { x: ovrBlock.x * pdfScale, y: ovrBlock.y * pdfScale }, width: ovrBlock.w * pdfScale
                  });
              }

              const sigBlock = getB('signatures');
              if (sigBlock) {
                  pageContent.push({
                      columns: [
                          { stack: [{canvas:[{type:'line', x1:0, y1:0, x2:90, y2:0, lineWidth: 1, lineColor: '#94a3b8'}]}, {text:'Parent\'s Sig', fontSize:9, bold: true, margin:[0,5], color: '#64748b'}], alignment: 'center' },
                          { stack: [{canvas:[{type:'line', x1:0, y1:0, x2:90, y2:0, lineWidth: 1, lineColor: '#94a3b8'}]}, {text:'Mentor', fontSize:9, bold: true, margin:[0,5], color: '#64748b'}], alignment: 'center' },
                          { stack: [{canvas:[{type:'line', x1:0, y1:0, x2:90, y2:0, lineWidth: 1, lineColor: '#94a3b8'}]}, {text:'Head of Center', fontSize:9, bold: true, margin:[0,5], color: '#64748b'}], alignment: 'center' }
                      ],
                      absolutePosition: { x: sigBlock.x * pdfScale, y: sigBlock.y * pdfScale }, width: sigBlock.w * pdfScale
                  });
              }

              content.push(pageContent);
              if (i < studentsToPrint.length - 1) content.push({ text: '', pageBreak: 'after' });
          }

          const docDefinition = { pageSize: 'A4', pageMargins: [0, 0, 0, 0], content: content, defaultStyle: { font: 'Roboto' } };
          pdfMake.createPdf(docDefinition).download(`Score_Cards_${new Date().getTime()}.pdf`);
          showToast("PDF generated successfully", 'success');
      } catch (e: any) { 
          console.error(e);
          showToast("PDF Error: " + e.message, 'error'); 
      } finally { setDownloading(false); }
  };

  const saveSchoolAssets = async () => {
      setIsSavingAssets(true);
      try {
          await DataService.updateSchoolInfo(schoolInfo);
          showToast("School branding saved successfully", 'success');
      } catch (e) { showToast("Failed to save branding.", 'error'); } finally { setIsSavingAssets(false); }
  };

  const handleGlobalAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'watermark') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
        showToast(`Uploading ${type}...`, 'info');
        const publicUrl = await DataService.uploadFile(file, 'branding');
        setSchoolInfo(prev => ({ ...prev, [type]: publicUrl }));
        showToast("Upload successful. Don't forget to save.", 'success');
    } catch (error: any) { showToast("Upload failed", 'error'); }
  };

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
      const scaleFactor = 0.65;
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

  const handleMouseUp = () => { isDragging.current = false; isResizing.current = false; };
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
            <button onClick={() => setActiveTab('layout')} className={clsx("px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2", activeTab === 'layout' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100")}>
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
                  <>
                    <button onClick={handlePrintInNewTab} className="bg-slate-100 px-4 py-2 rounded-xl flex items-center gap-2 text-slate-800 font-medium hover:bg-slate-200 shadow-sm transition-all active:scale-95">
                        <Printer size={18} /> Print
                    </button>
                    <button onClick={handleDownloadPDF} disabled={downloading} className="bg-slate-100 px-4 py-2 rounded-xl flex items-center gap-2 text-slate-800 font-medium hover:bg-slate-200 shadow-sm transition-all active:scale-95">
                        {downloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} PDF
                    </button>
                  </>
              )}
          </div>
      </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 relative flex justify-center overflow-auto pb-12">
        {activeTab === 'layout' ? (
            <div className="flex gap-6 w-full h-[calc(100vh-14rem)]">
                <div className="flex-1 bg-slate-200/50 rounded-xl overflow-auto border border-slate-300 flex justify-center p-8 relative">
                    <div className="relative origin-top" style={{ width: '794px', height: '1123px', transform: 'scale(0.65)' }}>
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
                                 <div className="absolute -top-5 left-0 bg-blue-500 text-white text-[10px] px-1.5 rounded-t opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                     {block.label} ({Math.round(block.w)}x{Math.round(block.h)})
                                 </div>
                                 <div className="w-full h-full pointer-events-none overflow-hidden">
                                     <BlockRenderer block={block} schoolInfo={schoolInfo} student={dummyStudent} marks={[]} nonAcademic={null} exams={exams} subjects={subjects} helpers={helpers} overallStats={overallStats} />
                                 </div>
                                 {selectedBlockId === block.id && (
                                     <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize z-50 shadow-sm" onMouseDown={(e) => handleResizeStart(e, block.id)}></div>
                                 )}
                             </div>
                        ))}
                    </div>
                </div>

                <div className="w-80 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0">
                    <div className="p-2 border-b border-slate-200 grid grid-cols-2 gap-1 bg-slate-50">
                        <button onClick={() => setLayoutSidebarTab('structure')} className={clsx("flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-colors", layoutSidebarTab === 'structure' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:bg-slate-100")}>
                            <Layout size={14} /> Structure
                        </button>
                        <button onClick={() => setLayoutSidebarTab('branding')} className={clsx("flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-colors", layoutSidebarTab === 'branding' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:bg-slate-100")}>
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
                                                    <Move size={14} className="text-slate-400" /> {block.label}
                                                </div>
                                                <input type="checkbox" checked={block.isVisible} onChange={() => setLayout(prev => prev.map(b => b.id === block.id ? { ...b, isVisible: !b.isVisible } : b))} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
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
                                                <input type="number" className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900" value={layout.find(b => b.id === selectedBlockId)?.style.fontSize} onChange={(e) => updateBlockStyle('fontSize', parseInt(e.target.value))} />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Text Color</label>
                                                <div className="flex items-center gap-2">
                                                    <input type="color" className="h-8 w-12 p-0.5 border border-slate-300 rounded cursor-pointer" value={layout.find(b => b.id === selectedBlockId)?.style.color} onChange={(e) => updateBlockStyle('color', e.target.value)} />
                                                    <span className="text-xs text-slate-600 font-mono">{layout.find(b => b.id === selectedBlockId)?.style.color}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {['left', 'center', 'right'].map(pos => (
                                                    <button key={pos} onClick={() => updateBlockStyle('textAlign', pos)} className={clsx("flex-1 py-1 text-xs border rounded hover:bg-slate-100 uppercase", layout.find(b => b.id === selectedBlockId)?.style.textAlign === pos && "bg-slate-200 font-bold")}>{pos}</button>
                                                ))}
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
                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">School Name</label><input type="text" className="w-full p-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white" value={schoolInfo.name} onChange={(e) => setSchoolInfo(prev => ({ ...prev, name: e.target.value.toUpperCase() }))} /></div>
                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tagline</label><input type="text" className="w-full p-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white" value={schoolInfo.tagline} onChange={(e) => setSchoolInfo(prev => ({ ...prev, tagline: e.target.value }))} /></div>
                                <div className="pt-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Primary Logo</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0">{schoolInfo.logo ? <img src={schoolInfo.logo} className="w-full h-full object-contain" /> : <ImageIcon size={24} className="text-slate-300" />}</div>
                                        <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-900">
                                            <Upload size={14} /> Upload Logo <input type="file" accept="image/*" className="hidden" onChange={(e) => handleGlobalAssetUpload(e, 'logo')} />
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Watermark</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0">{schoolInfo.watermark ? <img src={schoolInfo.watermark} className="w-full h-full object-contain opacity-30" /> : <Droplet size={24} className="text-slate-300" />}</div>
                                        <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-50">
                                            <Upload size={14} /> Upload <input type="file" accept="image/*" className="hidden" onChange={(e) => handleGlobalAssetUpload(e, 'watermark')} />
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
            <div ref={reportContainerRef} className="flex flex-col items-center w-full">
                {activeTab === 'single' ? (
                    currentStudent && (
                        <CustomizableScoreCard 
                            student={currentStudent} 
                            marks={studentMarks} 
                            nonAcademic={studentNonAcademic}
                            exams={exams} subjects={subjects} helpers={helpers} 
                            schoolInfo={schoolInfo} layout={layout} isPreview={true} scale={0.9} 
                        />
                    )
                ) : (
                    bulkViewMode === 'selection' ? (
                        <div className="w-full bg-white rounded-xl border border-slate-200 p-6 no-print max-w-5xl shadow-sm">
                            <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-slate-800 text-lg">Select Students</h3><button onClick={toggleSelectAll} className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">Toggle All</button></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {students.map(s => (
                                    <div key={s.id} onClick={() => { const n = new Set(bulkSelection); if(n.has(s.id)) n.delete(s.id); else n.add(s.id); setBulkSelection(n); }} className={clsx("p-4 border rounded-xl cursor-pointer flex items-center gap-3 transition-all", bulkSelection.has(s.id) ? "bg-indigo-50 border-indigo-500 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm")}>
                                        {bulkSelection.has(s.id) ? <CheckSquare className="text-indigo-600" /> : <Square className="text-slate-300"/>} <span className="text-slate-800 font-bold text-sm">{s.fullName}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-8 w-full">
                            {students.filter(s => bulkSelection.has(s.id)).map(s => (
                                <CustomizableScoreCard 
                                    key={s.id} student={s} 
                                    marks={bulkMarks[s.id] || []} 
                                    nonAcademic={bulkNonAcademic[s.id] || null}
                                    exams={exams} subjects={subjects} helpers={helpers} 
                                    schoolInfo={schoolInfo} layout={layout} isPreview={true} scale={0.8}
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
