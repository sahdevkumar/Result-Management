
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DataService } from '../services/dataService';
import { Student, Exam, Subject, MarkRecord, SchoolClass, NonAcademicRecord, SavedTemplate } from '../types';
import { useToast } from '../components/ToastContext';
import { 
  Printer, Trophy, Loader2, Download, Layout, Move, Palette, Save, 
  RotateCcw, Upload, Droplet, School, CheckSquare, Square, ImageIcon, 
  Activity, UserCheck, MessageSquare, MessageSquareQuote, Handshake, ChevronDown, Info, X,
  FileDown, Trash2, Copy, Plus, Monitor, Eye, EyeOff, Maximize, AlignCenter,
  Undo2
} from 'lucide-react';
import clsx from 'clsx';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Initialize pdfMake vfs
if (pdfMake.vfs === undefined && pdfFonts && (pdfFonts as any).pdfMake && (pdfFonts as any).pdfMake.vfs) {
  pdfMake.vfs = (pdfFonts as any).pdfMake.vfs;
}

interface LayoutBlock {
    id: string;
    type: 'school_name' | 'tagline' | 'logo' | 'header_info' | 'student_info' | 'marks_table' | 'non_academic' | 'remarks' | 'signatures' | 'custom_text' | 'watermark';
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
    content?: string;
    style: {
        fontSize: number;
        color: string;
        backgroundColor?: string;
        borderColor?: string;
        tableHeaderBg?: string;
        tableGridColor?: string;
        fontWeight?: 'normal' | 'bold';
        textAlign?: 'left' | 'center' | 'right';
        border?: boolean;
        padding?: number;
        opacity?: number;
    };
    isVisible: boolean;
}

const DEFAULT_LAYOUT: LayoutBlock[] = [
    { id: 'watermark', type: 'watermark', label: 'Page Watermark', x: 0, y: 0, w: 794, h: 1123, style: { fontSize: 0, color: '', opacity: 0.1 }, isVisible: true },
    { id: 'logo', type: 'logo', label: 'School Logo', x: 347, y: 25, w: 100, h: 70, style: { fontSize: 0, color: '', border: false }, isVisible: true },
    { id: 'header_info', type: 'header_info', label: 'Session Info', x: 48, y: 105, w: 698, h: 30, style: { fontSize: 12, color: '#64748b', textAlign: 'center' }, isVisible: true },
    { id: 'student_info', type: 'student_info', label: 'Student Details', x: 48, y: 150, w: 698, h: 100, style: { fontSize: 14, color: '#000000', borderColor: '#cbd5e1', backgroundColor: '#ffffff60', textAlign: 'left', border: true, padding: 10 }, isVisible: true },
    { id: 'marks_table', type: 'marks_table', label: 'Marks Table', x: 48, y: 280, w: 698, h: 430, style: { fontSize: 11, color: '#000000', tableHeaderBg: '#f1f5f9', tableGridColor: '#94a3b8', textAlign: 'center' }, isVisible: true },
    { id: 'non_academic', type: 'non_academic', label: 'Non-Academic Performance', x: 48, y: 725, w: 698, h: 80, style: { fontSize: 10, color: '#1e293b', borderColor: '#cbd5e1', border: true }, isVisible: true },
    { id: 'remarks', type: 'remarks', label: 'Remarks Section', x: 48, y: 820, w: 340, h: 140, style: { fontSize: 12, color: '#334155', borderColor: '#cbd5e1', border: true, padding: 12 }, isVisible: true },
    { id: 'overall', type: 'custom_text', label: 'Overall Result', x: 408, y: 820, w: 338, h: 140, style: { fontSize: 14, color: '#1e1b4b', borderColor: '#cbd5e1', textAlign: 'center', border: true, backgroundColor: '#f8fafc', padding: 20 }, isVisible: true },
    { id: 'signatures', type: 'signatures', label: 'Signatures', x: 48, y: 980, w: 698, h: 80, style: { fontSize: 10, color: '#64748b', textAlign: 'center' }, isVisible: true },
];

const PRESETS: { name: string; layout: LayoutBlock[] }[] = [
    { name: 'Standard Academic', layout: DEFAULT_LAYOUT },
    { 
        name: 'Modern Borderless', 
        layout: DEFAULT_LAYOUT.map(b => ({
            ...b,
            style: { ...b.style, border: false, backgroundColor: 'transparent' }
        }))
    },
    {
        name: 'High Contrast',
        layout: DEFAULT_LAYOUT.map(b => ({
            ...b,
            style: { ...b.style, color: '#000000', tableHeaderBg: '#cbd5e1', tableGridColor: '#000000' }
        }))
    }
];

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

const BlockRenderer: React.FC<{
    block: LayoutBlock;
    schoolInfo: { name: string, tagline: string, logo: string, watermark: string, academicSession?: string, signature?: string };
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

    const borderStyle = block.style.border ? `1px solid ${block.style.borderColor || '#cbd5e1'}` : 'none';
    const bgStyle = block.style.backgroundColor || 'transparent';

    switch(block.type) {
        case 'watermark':
            return (
                <div className="w-full h-full flex items-center justify-center overflow-hidden" style={{ opacity: block.style.opacity ?? 0.1 }}>
                     {schoolInfo.watermark && <img src={schoolInfo.watermark} className="w-full h-full object-contain" alt="Watermark" />}
                </div>
            );
        case 'logo':
            return (
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                     {schoolInfo.logo ? <img src={schoolInfo.logo} className="w-full h-full object-contain" alt="Logo" /> : <Trophy size={Math.min(block.w, block.h) * 0.8} className="text-indigo-900" />}
                </div>
            );
        case 'header_info':
            return (
                <div className="w-full h-full flex justify-center items-end px-2 font-sans border-b pb-1" style={{ fontSize: `${block.style.fontSize}px`, color: block.style.color, borderColor: '#e2e8f0' }}>
                    <div className="text-center">
                         <span className="bg-indigo-900 text-white px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mx-2">Academic Report</span>
                         <span className="font-bold uppercase tracking-widest">SESSION {schoolInfo.academicSession || '2024-2025'}</span>
                    </div>
                </div>
            );
        case 'student_info':
            return (
                <div className={clsx("w-full font-sans", block.style.border && "rounded-lg overflow-hidden")} style={{ border: borderStyle, backgroundColor: bgStyle }}>
                     <div className="grid grid-cols-4 border-b" style={{ borderColor: block.style.borderColor || '#e2e8f0' }}>
                        <div className="p-2 border-r text-[9px] font-black opacity-60 uppercase tracking-tight flex items-center" style={{ borderColor: block.style.borderColor || '#e2e8f0', color: block.style.color }}>Student Name</div>
                        <div className="p-2 border-r col-span-3 font-black flex items-center uppercase" style={{ fontSize: `${block.style.fontSize}px`, borderColor: block.style.borderColor || '#e2e8f0', color: block.style.color }}>{student.fullName}</div>
                    </div>
                    <div className="grid grid-cols-4 border-b" style={{ borderColor: block.style.borderColor || '#e2e8f0' }}>
                        <div className="p-2 border-r text-[9px] font-black opacity-60 uppercase tracking-tight flex items-center" style={{ borderColor: block.style.borderColor || '#e2e8f0', color: block.style.color }}>Parent's Name</div>
                        <div className="p-2 border-r col-span-3 font-bold flex items-center uppercase" style={{ fontSize: `${block.style.fontSize}px`, borderColor: block.style.borderColor || '#e2e8f0', color: block.style.color }}>{student.guardianName}</div>
                    </div>
                    <div className="grid grid-cols-4">
                        <div className="p-2 border-r text-[9px] font-black opacity-60 uppercase tracking-tight flex items-center" style={{ borderColor: block.style.borderColor || '#e2e8f0', color: block.style.color }}>Class</div>
                        <div className="p-2 border-r font-bold flex items-center" style={{ fontSize: `${block.style.fontSize}px`, borderColor: block.style.borderColor || '#e2e8f0', color: block.style.color }}>{student.className}</div>
                        <div className="p-2 border-r text-[9px] font-black opacity-60 uppercase tracking-tight flex items-center" style={{ borderColor: block.style.borderColor || '#e2e8f0', color: block.style.color }}>Mobile No</div>
                        <div className="p-2 font-bold font-mono flex items-center" style={{ fontSize: `${block.style.fontSize}px`, color: block.style.color }}>{student.contactNumber}</div>
                    </div>
                </div>
            );
        case 'marks_table':
            const gridColor = block.style.tableGridColor || '#94a3b8';
            const headerBg = block.style.tableHeaderBg || '#f1f5f9';
            return (
                <div className="w-full font-sans overflow-hidden flex flex-col">
                     <div className="rounded-t-lg p-1.5 text-center text-[10px] font-black uppercase tracking-widest shrink-0 text-white bg-slate-900" style={{ backgroundColor: '#0f172a' }}>Academic Performance</div>
                     <div className="border-x border-b shadow-sm overflow-hidden" style={{ borderColor: gridColor, backgroundColor: bgStyle }}>
                        <table className="w-full text-center border-collapse table-fixed">
                             <thead>
                                <tr className="font-black uppercase tracking-wider" style={{ fontSize: '10px', backgroundColor: headerBg, color: block.style.color }}>
                                    <th style={{width: `${WIDTH_SUBJECT}px`, borderColor: gridColor}} rowSpan={2} className="py-2 px-2 border-r">Subject</th>
                                    <th style={{width: `${WIDTH_TYPE}px`, borderColor: gridColor}} rowSpan={2} className="py-2 px-1 border-r">Type</th>
                                    {exams.map(exam => (
                                        <th key={exam.id} colSpan={2} style={{borderColor: gridColor}} className="py-1 px-1 border-r border-b">{exam.name}</th>
                                    ))}
                                    <th style={{width: `${WIDTH_RESULT}px`}} colSpan={3} className="py-2 bg-black/5">Overall</th>
                                </tr>
                                <tr className="text-slate-500 uppercase font-black border-b" style={{ fontSize: '8px', backgroundColor: headerBg, borderColor: gridColor }}>
                                    {exams.map(exam => (
                                        <React.Fragment key={exam.id}>
                                            <th style={{borderColor: gridColor}} className="py-1 border-r">Max</th>
                                            <th style={{borderColor: gridColor}} className="py-1 border-r">Obt</th>
                                        </React.Fragment>
                                    ))}
                                    <th style={{borderColor: gridColor}} className="py-1 border-r bg-black/5">Total</th>
                                    <th style={{borderColor: gridColor}} className="py-1 border-r bg-black/5">%</th>
                                    <th className="py-1 bg-black/5">Grd</th>
                                </tr>
                            </thead>
                            <tbody style={{ fontSize: `${block.style.fontSize}px`, color: block.style.color }}>
                                {subjects.map((sub, idx) => {
                                    const stats = helpers.calculateSubjectStats(marks, sub.id);
                                    return (
                                    <React.Fragment key={sub.id}>
                                        <tr className="border-b" style={{ borderColor: gridColor }}>
                                            <td rowSpan={2} style={{borderColor: gridColor}} className="border-r font-black text-left px-3 py-1 align-middle bg-white/50 uppercase">{sub.name}</td>
                                            <td style={{borderColor: gridColor}} className="border-r text-[8px] opacity-60 font-black uppercase tracking-widest text-center py-1 bg-slate-50/80">SUB</td>
                                            {exams.map(exam => (
                                                <React.Fragment key={exam.id}>
                                                    <td style={{borderColor: gridColor}} className="border-r opacity-60 py-1 text-xs">{helpers.getMaxMark(marks, exam.id, sub.id, 'Subjective')}</td>
                                                    <td style={{borderColor: gridColor}} className="border-r font-bold py-1">{helpers.getMark(marks, exam.id, sub.id, 'Subjective')}</td>
                                                </React.Fragment>
                                            ))}
                                            <td rowSpan={2} style={{borderColor: gridColor}} className="border-r font-bold align-middle bg-slate-100/40">{stats.obtained} / {stats.max}</td>
                                            <td rowSpan={2} style={{borderColor: gridColor}} className="border-r font-bold text-indigo-700 align-middle bg-slate-100/40">{stats.percentage}%</td>
                                            <td rowSpan={2} className="font-black align-middle bg-slate-100/40">{stats.grade}</td>
                                        </tr>
                                        <tr className="border-b" style={{ borderColor: gridColor }}>
                                            <td style={{borderColor: gridColor}} className="border-r text-[8px] opacity-60 font-black uppercase tracking-widest text-center py-1 bg-slate-50/80">OBJ</td>
                                            {exams.map(exam => (
                                                <React.Fragment key={exam.id}>
                                                     <td style={{borderColor: gridColor}} className="border-r opacity-60 py-1 text-xs">{helpers.getMaxMark(marks, exam.id, sub.id, 'Objective')}</td>
                                                     <td style={{borderColor: gridColor}} className="border-r font-bold py-1">{helpers.getMark(marks, exam.id, sub.id, 'Objective')}</td>
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
                <div className={clsx("w-full h-full font-sans overflow-hidden bg-white flex flex-col", block.style.border && "rounded-lg")} style={{ border: borderStyle, backgroundColor: bgStyle }}>
                     <div className="bg-[#f1f5f9] text-[#1e1b4b] p-1.5 text-center text-[10px] font-black uppercase tracking-widest border-b shrink-0" style={{ borderColor: block.style.borderColor || '#e2e8f0' }}>Non-Academic Performance</div>
                     <div className="grid grid-cols-4 flex-1 divide-x" style={{ borderColor: block.style.borderColor || '#e2e8f0' }}>
                        {['Attendance', 'Discipline', 'Communication', 'Participation'].map((trait, idx) => {
                            const traitKey = trait.toLowerCase() as keyof NonAcademicRecord;
                            const val = nonAcademic ? nonAcademic[traitKey] : null;
                            
                            return (
                                <div key={idx} className="flex flex-col items-center justify-center bg-transparent hover:bg-slate-50 transition-colors" style={{ borderColor: block.style.borderColor || '#e2e8f0' }}>
                                    <span className="text-[7px] font-black opacity-50 uppercase tracking-tighter" style={{ color: block.style.color }}>{trait}</span>
                                    <span className="text-xs font-black mt-0.5" style={{ color: block.style.color }}>
                                        {/* If data exists and isn't empty string, show it. Otherwise specifically show N/A as fallback */}
                                        {val && String(val).trim() !== '' ? val : 'N/A'}
                                    </span>
                                </div>
                            );
                        })}
                     </div>
                </div>
            );
        case 'remarks':
            return (
                <div className={clsx("w-full h-full bg-white/80 overflow-hidden", block.style.border && "rounded-lg p-3")} style={{ border: borderStyle, backgroundColor: bgStyle }}>
                     <h4 className="font-black uppercase text-[9px] mb-2 border-b pb-1 flex items-center gap-1" style={{ color: block.style.color, borderColor: block.style.borderColor || '#e2e8f0' }}>
                        <MessageSquareQuote size={10} /> Teacher's Comments
                     </h4>
                     <div className="space-y-1" style={{ fontSize: `${block.style.fontSize}px`, color: block.style.color }}>
                        {subjects.map(s => {
                            const r = helpers.getRemark(marks, s.id);
                            return r ? (
                                <div key={s.id} className="leading-tight">
                                    <span className="font-bold text-[9px] uppercase" style={{ opacity: 0.8 }}>{s.name}:</span> <span className="italic font-medium">"{r}"</span>
                                </div>
                            ) : null;
                        })}
                        {!subjects.some(s => helpers.getRemark(marks, s.id)) && <p className="italic opacity-60 text-[10px]">Consistent performance and active participation noted across sessions.</p>}
                     </div>
                </div>
            );
        case 'custom_text':
            return (
                <div className={clsx("w-full h-full flex flex-col justify-between items-center text-center", block.style.border && "rounded-lg")} style={{ border: borderStyle, backgroundColor: bgStyle }}>
                     <div className="w-full pt-2">
                        <div className="text-[8px] uppercase opacity-50 font-black tracking-widest mb-0.5" style={{ color: block.style.color }}>Final Outcome</div>
                        <div className="font-black drop-shadow-sm" style={{ fontSize: `56px`, lineHeight: 1, color: block.style.color }}>{overallStats.overallGrade}</div>
                     </div>
                     <div className="w-full flex justify-center gap-4 text-[9px] font-black bg-black/5 py-1.5 rounded-b-lg tracking-widest" style={{ color: block.style.color }}>
                         <span>{overallStats.totalPct}%</span>
                         <span className={clsx(overallStats.overallGrade === 'F' ? 'text-red-600' : 'text-emerald-600')}>
                            {overallStats.overallGrade === 'F' ? 'FAIL' : 'PASS'}
                         </span>
                     </div>
                </div>
            );
        case 'signatures':
            return (
                <div className="w-full h-full flex justify-between items-end px-4" style={{ fontSize: `${block.style.fontSize}px`, color: block.style.color }}>
                    <div className="text-center pb-1"><div className="w-32 border-b border-slate-400 mb-1 mx-auto"></div><p className="font-black opacity-50 uppercase text-[8px] tracking-widest">Parent's</p></div>
                    <div className="text-center relative">
                        {schoolInfo.signature && (
                            <img src={schoolInfo.signature} className="absolute -top-12 left-1/2 -translate-x-1/2 h-16 w-32 object-contain mix-blend-multiply dark:mix-blend-normal pointer-events-none" alt="Head Signature" />
                        )}
                        <div className="w-32 border-b border-slate-400 mb-1 mx-auto"></div>
                        <p className="font-black opacity-50 uppercase text-[8px] tracking-widest">Academic Head</p>
                    </div>
                </div>
            );
        default:
            return null;
    }
};

const CustomizableScoreCard: React.FC<{
    student: Student;
    marks: MarkRecord[];
    nonAcademic: NonAcademicRecord | null;
    exams: Exam[];
    subjects: Subject[];
    helpers: ReturnType<typeof useScoreCalculations>;
    schoolInfo: { name: string, tagline: string, logo: string, watermark: string, academicSession?: string, signature?: string };
    layout: LayoutBlock[];
    isPreview?: boolean;
    scale?: number;
}> = ({ student, marks, nonAcademic, exams, subjects, helpers, schoolInfo, layout, isPreview, scale = 1 }) => {
    
    const overallStats = helpers.calculateOverall(marks);

    return (
        <div className={clsx("scorecard-wrapper bg-white shadow-2xl relative transition-transform origin-top", isPreview ? "scorecard-shadow-container" : "")} 
             style={{ width: '794px', height: '1123px', transform: isPreview ? `scale(${scale})` : 'none', marginBottom: isPreview ? `${1123 * (scale - 1)}px` : '0' }}>
            <div className="w-full h-full bg-white iso-bg relative overflow-hidden">
                {layout.filter(l => l.isVisible).map(block => (
                     <div 
                        key={block.id}
                        className="absolute"
                        style={{ left: block.x, top: block.y, width: block.w, height: block.h, zIndex: block.type === 'watermark' ? 0 : 10 }}
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
  const [schoolInfo, setSchoolInfo] = useState({ name: 'Academic System', tagline: 'Excellence in Education', logo: '', watermark: '', academicSession: '2024-2025', signature: '' });
  
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
  const [layoutHistory, setLayoutHistory] = useState<LayoutBlock[][]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [layoutSidebarTab, setLayoutSidebarTab] = useState<'structure' | 'branding' | 'templates'>('structure');
  
  // Templates State
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  
  const [loadingBulk, setLoadingBulk] = useState(false);
  const [downloading, setDownloading] = useState(true);
  const [isSavingAssets, setIsSavingAssets] = useState(false);
  const [isUploadingWatermark, setIsUploadingWatermark] = useState(false);
  
  const { showToast } = useToast();
  const helpers = useScoreCalculations(exams, subjects);
  const reportContainerRef = useRef<HTMLDivElement>(null);

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const blockStart = useRef({ x: 0, y: 0 });
  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0 });
  const dimStart = useRef({ w: 0, h: 0 });

  const dummyStudent: Student = {
      id: 'dummy', fullName: 'Rohit Sharma', rollNumber: '', className: 'X', section: '', contactNumber: '9876543210', guardianName: 'Mr. Sharma', status: 'Active' as any, avatarUrl: ''
  };

  const addToHistory = useCallback((currentLayout: LayoutBlock[]) => {
      setLayoutHistory(prev => [JSON.parse(JSON.stringify(currentLayout)), ...prev].slice(0, 30));
  }, []);

  const handleUndo = () => {
    if (layoutHistory.length === 0) return;
    const [previous, ...remaining] = layoutHistory;
    setLayout(previous);
    setLayoutHistory(remaining);
    showToast("Undo successful", "info");
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
      setDownloading(false);
      try {
        const [c, e, s, stData, info] = await Promise.all([ 
            DataService.getClasses(), 
            DataService.getExams(), 
            DataService.getSubjects(),
            DataService.getStudents(),
            DataService.getSchoolInfo() 
        ]) as [SchoolClass[], Exam[], Subject[], Student[], any];
        
        setClasses(c);
        setExams(e);
        setSubjects(s);
        setStudents(stData);
        setSchoolInfo(info as any);
        
        if (info.scorecard_layout) {
            let loadedLayout = info.scorecard_layout as LayoutBlock[];
            if (!Array.isArray(loadedLayout)) loadedLayout = [];
            
            if (!loadedLayout.some(b => b.type === 'watermark')) {
                 const defaultWm = DEFAULT_LAYOUT.find(b => b.type === 'watermark')!;
                 loadedLayout = [defaultWm, ...loadedLayout];
            }
            // @ts-ignore 
            setLayout(loadedLayout);
        } else {
            setLayout(prev => {
                if (!prev.some(b => b.type === 'watermark')) {
                    const defaultWm = DEFAULT_LAYOUT.find(b => b.type === 'watermark')!;
                    return [defaultWm, ...prev];
                }
                return prev;
            });
        }

        if(c.length > 0) setSelectedClassId(c[0].id);
        
        loadTemplates();
      } catch(e) {
        showToast("Failed to load metadata", 'error');
      }
    };
    init();
  }, []);

  const loadTemplates = async () => {
      try {
          const tmpls = await DataService.getTemplates();
          const valid = tmpls.filter(t => t.elements.some((e: any) => e.type === 'marks_table' || e.type === 'student_info'));
          setSavedTemplates(valid);
      } catch (e) {
          console.error("Failed to load templates");
      }
  };

  const handleSaveTemplate = async () => {
      if (!newTemplateName.trim()) { showToast("Enter a template name", 'error'); return; }
      setIsSavingAssets(true);
      try {
          await DataService.saveTemplate({
              id: Date.now().toString(),
              name: newTemplateName,
              elements: layout as any,
              width: 794, 
              height: 1123
          });
          showToast("Layout saved as template", 'success');
          setNewTemplateName('');
          loadTemplates();
      } catch (e) { showToast("Failed to save template", 'error'); } finally { setIsSavingAssets(false); }
  };

  const handleLoadTemplate = (template: SavedTemplate) => {
      addToHistory(layout);
      setLayout(template.elements as any);
      showToast(`Loaded "${template.name}"`, 'success');
  };

  const handleLoadPreset = (presetLayout: LayoutBlock[]) => {
      addToHistory(layout);
      setLayout(presetLayout);
      showToast("Preset layout loaded", 'info');
  };

  const handleDeleteTemplate = async (id: string) => {
      if(!confirm("Delete this template?")) return;
      try {
          await DataService.deleteTemplate(id);
          showToast("Template deleted", 'info');
          loadTemplates();
      } catch (e) { showToast("Failed to delete", 'error'); }
  };

  const handleWatermarkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingWatermark(true);
    try {
        const url = await DataService.uploadFile(file, 'branding');
        setSchoolInfo(prev => ({ ...prev, watermark: url }));
        showToast("Watermark uploaded. Click 'Set as Active Layout' to save permanently.", "success");
    } catch (error) {
        showToast("Upload failed", "error");
    } finally {
        setIsUploadingWatermark(false);
    }
  };

  useEffect(() => {
    if(!selectedClassId) return;
    const updateFilteredStudents = () => {
        const cls = classes.find(c => c.id === selectedClassId);
        if(cls) {
            const filtered = students.filter(s => s.className === cls.className && s.section === cls.section);
            setBulkSelection(new Set(filtered.map(s => s.id)));
        } else {
            setBulkSelection(new Set());
        }
        setSelectedStudentId('');
        setBulkMarks({});
        setBulkNonAcademic({});
        setBulkViewMode('selection');
    };
    updateFilteredStudents();
  }, [selectedClassId, classes, students]);

  useEffect(() => {
    if(!selectedStudentId) return;
    const loadData = async () => {
        try {
            // Aggressively search for Term 1
            const term1Exam = exams.find(e => 
                e.type?.toUpperCase().includes('TERM 1') || 
                e.name?.toUpperCase().includes('TERM 1') ||
                e.type?.toUpperCase().includes('T1') ||
                e.type?.toUpperCase().includes('TERM1') ||
                e.type?.toUpperCase().includes('FIRST TERM')
            ) || exams[0];
            
            const term1Id = term1Exam?.id || '';

            const [marks, nonAcademicRecords] = await Promise.all([
                DataService.getStudentHistory(selectedStudentId),
                term1Id ? DataService.getNonAcademicRecords(term1Id) : Promise.resolve([])
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
          const selectedStudentsToFetch = students.filter(s => bulkSelection.has(s.id));
          
          const term1Exam = exams.find(e => 
            e.type?.toUpperCase().includes('TERM 1') || 
            e.name?.toUpperCase().includes('TERM 1') ||
            e.type?.toUpperCase().includes('T1') ||
            e.type?.toUpperCase().includes('TERM1') ||
            e.type?.toUpperCase().includes('FIRST TERM')
          ) || (exams.length > 0 ? exams[0] : null);
          
          const term1Id = term1Exam ? term1Exam.id : '';
          const nonAcadRecords = term1Id ? await DataService.getNonAcademicRecords(term1Id) : [];

          await Promise.all(selectedStudentsToFetch.map(async (student) => {
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
      if (!printWindow) { showToast("Pop-up blocked. Please allow pop-ups for printing.", "error"); return; }

      const clonedContainer = reportContainerRef.current.cloneNode(true) as HTMLElement;
      const wrappers = clonedContainer.querySelectorAll('.scorecard-wrapper');
      wrappers.forEach((wrapper: any) => {
          wrapper.style.width = '794px'; wrapper.style.height = '1123px'; wrapper.style.margin = '0 auto'; wrapper.style.transform = 'none';
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
                  .scorecard-shadow-container { box-shadow: none !important; }
                  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                  @page { size: A4; margin: 0; }
                }
                body { font-family: 'Inter', sans-serif; background: #f1f5f9; padding: 40px 0; }
                .print-now-btn { position: fixed; top: 20px; right: 20px; z-index: 1000; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 12px; font-weight: bold; cursor: pointer; border: none; }
                .print-container { display: flex; flex-direction: column; align-items: center; width: 100%; }
              </style>
            </head>
            <body>
              <button class="no-print print-now-btn" onclick="window.print()">Confirm & Print</button>
              <div class="print-container">${clonedContainer.innerHTML}</div>
              <script>window.onload = () => { setTimeout(() => { window.print(); }, 800); };</script>
            </body>
          </html>
      `);
      printWindow.document.close();
  };

  const handleDownloadPDF = async () => {
      setDownloading(true);
      try {
          const content: any[] = [];
          const currentStudent = students.find(s => s.id === selectedStudentId);
          const studentsToPrint = activeTab === 'single' ? (currentStudent ? [currentStudent] : []) : students.filter(s => bulkSelection.has(s.id));

          if (studentsToPrint.length === 0) { showToast("No students selected", 'error'); setDownloading(false); return; }

          const docDefinition: any = { 
            pageSize: 'A4', 
            pageMargins: [0, 0, 0, 0] as [number, number, number, number], 
            content: [{ text: 'Academic Report Batch', alignment: 'center', margin: [0, 20] }], 
            defaultStyle: { font: 'Inter' } 
          };
          pdfMake.createPdf(docDefinition).download(`Score_Cards_${new Date().getTime()}.pdf`);
          showToast("PDF generated successfully", 'success');
      } catch (e: any) { console.error(e); showToast("PDF Error: " + e.message, 'error'); } finally { setDownloading(false); }
  };

  const saveSchoolAssets = async () => {
      setIsSavingAssets(true);
      try {
          await DataService.updateSchoolInfo({ ...schoolInfo, scorecard_layout: layout });
          showToast("Layout & styles saved successfully", 'success');
      } catch (e) { showToast("Failed to save layout.", 'error'); } finally { setIsSavingAssets(false); }
  };

  const resetToDefaults = () => {
      if(confirm("Are you sure you want to reset the layout to default settings? This cannot be undone.")) {
          addToHistory(layout);
          setLayout(DEFAULT_LAYOUT);
          showToast("Layout reset to defaults. Remember to Save.", "info");
      }
  };

  const handleDragStart = (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); if(activeTab !== 'layout') return; isDragging.current = true; setSelectedBlockId(id);
      const block = layout.find(b => b.id === id);
      if(block) { 
          addToHistory(layout);
          dragStart.current = { x: e.clientX, y: e.clientY }; 
          blockStart.current = { x: block.x, y: block.y }; 
      }
  };

  const handleResizeStart = (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); if(activeTab !== 'layout') return; isResizing.current = true; setSelectedBlockId(id);
      const block = layout.find(b => b.id === id);
      if(block) { 
          addToHistory(layout);
          resizeStart.current = { x: e.clientX, y: e.clientY }; 
          dimStart.current = { w: block.w, h: block.h }; 
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (activeTab !== 'layout') return;
      const scaleFactor = 0.65;
      if (isDragging.current && selectedBlockId) {
          const dx = (e.clientX - dragStart.current.x) / scaleFactor; const dy = (e.clientY - dragStart.current.y) / scaleFactor;
          setLayout(prev => prev.map(b => b.id === selectedBlockId ? { ...b, x: blockStart.current.x + dx, y: blockStart.current.y + dy } : b));
      } else if (isResizing.current && selectedBlockId) {
          const dx = (e.clientX - resizeStart.current.x) / scaleFactor; const dy = (e.clientY - resizeStart.current.y) / scaleFactor;
          setLayout(prev => prev.map(b => b.id === selectedBlockId ? { ...b, w: Math.max(50, dimStart.current.w + dx), h: Math.max(20, dimStart.current.h + dy) } : b));
      }
  };

  const handleMouseUp = () => { isDragging.current = false; isResizing.current = false; };
  
  const updateBlockStyle = (key: string, value: any) => { 
      if(!selectedBlockId) return; 
      addToHistory(layout);
      setLayout(prev => prev.map(b => b.id === selectedBlockId ? { ...b, style: { ...b.style, [key]: value } } : b)); 
  };
  
  const updateBlockLayout = (id: string, updates: Partial<{ x: number, y: number, w: number, h: number }>) => {
      addToHistory(layout);
      setLayout(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const selectedBlock = layout.find(b => b.id === selectedBlockId);
  const currentStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className="space-y-8 no-print-space h-full flex flex-col" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center no-print gap-4 shrink-0">
        <div><h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Academic Score Card</h1><p className="text-slate-500 dark:text-slate-400 text-sm">Generate, customize, and print student reports</p></div>
        <div className="flex bg-white dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
            <button onClick={() => setActiveTab('single')} className={clsx("px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2", activeTab === 'single' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800")}>Single</button>
            <button onClick={() => setActiveTab('bulk')} className={clsx("px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2", activeTab === 'bulk' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800")}>Bulk</button>
            <button onClick={() => setActiveTab('layout')} className={clsx("px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2", activeTab === 'layout' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800")}><Layout size={16} /> Layout</button>
        </div>
      </div>

      {activeTab !== 'layout' && (
      <div className="flex flex-wrap justify-between items-center no-print bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm gap-4 shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
               <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                    <option value="">Filter by Class...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.className} - {c.section}</option>)}
               </select>
               {activeTab === 'single' && (
                   <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                        <option value="">Select Student...</option>
                        {students.filter(s => {
                            const cls = classes.find(c => c.id === selectedClassId);
                            return !cls || (s.className === cls.className && s.section === cls.section);
                        }).map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                   </select>
               )}
          </div>
          <div className="flex gap-3">
              {activeTab === 'bulk' && bulkViewMode === 'selection' ? (
                  <button onClick={handleGeneratePreview} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">Preview All</button>
              ) : (
                  <>
                    <button onClick={handlePrintInNewTab} className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl flex items-center gap-2 text-slate-800 dark:text-white font-medium hover:bg-slate-200 dark:hover:bg-slate-700 shadow-sm transition-all active:scale-95">
                        <Printer size={18} /> Print
                    </button>
                    <button onClick={handleDownloadPDF} disabled={downloading} className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl flex items-center gap-2 text-slate-800 dark:text-white font-medium hover:bg-slate-200 dark:hover:bg-slate-700 shadow-sm transition-all active:scale-95">
                        {downloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} PDF
                    </button>
                  </>
              )}
          </div>
      </div>
      )}

      <div className="flex-1 relative flex justify-center overflow-auto pb-12">
        {activeTab === 'layout' ? (
            <div className="flex gap-6 w-full h-[calc(100vh-14rem)]">
                <div className="flex-1 bg-slate-200/50 dark:bg-slate-900/50 rounded-xl overflow-auto border border-slate-300 dark:border-slate-700 flex justify-center p-8 relative">
                    <div className="relative origin-top shadow-2xl" style={{ width: '794px', height: '1123px', transform: 'scale(0.65)' }}>
                        <div className="w-full h-full bg-white iso-bg relative overflow-hidden">
                            {layout.filter(l => l.isVisible).map(block => (
                                 <div 
                                    key={block.id}
                                    className={clsx(
                                        "absolute border-2 cursor-move group transition-colors", 
                                        selectedBlockId === block.id ? "border-blue-500 z-50 bg-blue-50/20" : "border-transparent hover:border-slate-300 hover:bg-slate-50/20 z-10"
                                    )}
                                    style={{ left: block.x, top: block.y, width: block.w, height: block.h, zIndex: block.type === 'watermark' ? 0 : 10 }}
                                    onMouseDown={(e) => handleDragStart(e, block.id)}
                                 >
                                     {selectedBlockId !== block.id && block.type !== 'watermark' && (
                                         <div className="absolute -top-5 left-0 bg-blue-500 text-white text-[10px] px-1.5 rounded-t opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                             {block.label} ({Math.round(block.w)}x{Math.round(block.h)})
                                         </div>
                                     )}
                                     <div className="w-full h-full pointer-events-none overflow-hidden">
                                         <BlockRenderer block={block} schoolInfo={schoolInfo} student={dummyStudent} marks={[]} nonAcademic={null} exams={exams} subjects={subjects} helpers={helpers} overallStats={{totalPct: '0.0', overallGrade: 'A+'}} />
                                     </div>
                                     {selectedBlockId === block.id && (
                                         <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize z-50 shadow-sm" onMouseDown={(e) => handleResizeStart(e, block.id)}></div>
                                     )}
                                 </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="w-80 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden shrink-0">
                    <div className="p-2 border-b border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-1 bg-slate-50 dark:bg-slate-800">
                        <button onClick={() => { setSelectedBlockId(null); setLayoutSidebarTab('structure'); }} className={clsx("flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-colors", layoutSidebarTab === 'structure' ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700")}>
                            <Layout size={14} /> <span className="text-[10px] font-bold">Structure</span>
                        </button>
                        <button onClick={() => { setSelectedBlockId(null); setLayoutSidebarTab('branding'); }} className={clsx("flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-colors", layoutSidebarTab === 'branding' ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700")}>
                            <School size={14} /> <span className="text-[10px] font-bold">Branding</span>
                        </button>
                        <button onClick={() => { setSelectedBlockId(null); setLayoutSidebarTab('templates'); }} className={clsx("flex flex-col items-center justify-center gap-1 py-2 rounded-lg transition-colors", layoutSidebarTab === 'templates' ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700")}>
                            <Copy size={14} /> <span className="text-[10px] font-bold">Templates</span>
                        </button>
                    </div>
                    {/* Sidebar Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {selectedBlock ? (
                            <div className="space-y-4 animate-in slide-in-from-right duration-300">
                                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">{selectedBlock.label}</h4>
                                    <button onClick={() => setSelectedBlockId(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={16}/></button>
                                </div>
                                
                                {selectedBlock.type === 'watermark' && (
                                    <div className="space-y-4">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Source Image</label>
                                            {schoolInfo.watermark ? (
                                                <div className="relative group mb-3 aspect-[3/4] bg-white w-full rounded-md border border-slate-200 flex items-center justify-center overflow-hidden">
                                                    <img src={schoolInfo.watermark} className="w-full h-full object-contain" alt="Watermark Preview" />
                                                </div>
                                            ) : (
                                                <div className="text-center text-xs text-slate-400 py-4 italic">No watermark set</div>
                                            )}
                                            <label className="flex items-center justify-center gap-2 w-full py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                                                {isUploadingWatermark ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                                {isUploadingWatermark ? 'Uploading...' : 'Upload Image'}
                                                <input type="file" accept="image/*" className="hidden" onChange={handleWatermarkUpload} disabled={isUploadingWatermark} />
                                            </label>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Opacity</label>
                                            <div className="flex items-center gap-3">
                                                <EyeOff size={14} className="text-slate-400" />
                                                <input type="range" min="0" max="100" step="1" value={(selectedBlock.style.opacity || 0.1) * 100} onChange={(e) => updateBlockStyle('opacity', parseInt(e.target.value) / 100)} className="flex-1 accent-indigo-600" />
                                                <Eye size={14} className="text-slate-400" />
                                            </div>
                                            <div className="text-right text-xs font-mono mt-1 text-slate-500">{Math.round((selectedBlock.style.opacity || 0.1) * 100)}%</div>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Dimensions & Position</label>
                                            <div className="grid grid-cols-2 gap-2 mb-2">
                                                <div>
                                                    <span className="text-[10px] text-slate-400 uppercase font-mono">W</span>
                                                    <input type="number" value={Math.round(selectedBlock.w)} onChange={(e) => updateBlockLayout(selectedBlock.id, { w: parseInt(e.target.value) || 0 })} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-slate-400 uppercase font-mono">H</span>
                                                    <input type="number" value={Math.round(selectedBlock.h)} onChange={(e) => updateBlockLayout(selectedBlock.id, { h: parseInt(e.target.value) || 0 })} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-slate-400 uppercase font-mono">X</span>
                                                    <input type="number" value={Math.round(selectedBlock.x)} onChange={(e) => updateBlockLayout(selectedBlock.id, { x: parseInt(e.target.value) || 0 })} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-slate-400 uppercase font-mono">Y</span>
                                                    <input type="number" value={Math.round(selectedBlock.y)} onChange={(e) => updateBlockLayout(selectedBlock.id, { y: parseInt(e.target.value) || 0 })} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
                                                </div>
                                            </div>
                                        </div>

                                        <button onClick={() => updateBlockLayout(selectedBlock.id, { x: 0, y: 0, w: 794, h: 1123 })} className="w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2">
                                            <Maximize size={14} /> Fit to Page (Full A4)
                                        </button>
                                        <button onClick={() => updateBlockLayout(selectedBlock.id, { x: 197, y: 361, w: 400, h: 400 })} className="w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2">
                                            <AlignCenter size={14} /> Center (Medium)
                                        </button>
                                    </div>
                                )}

                                {selectedBlock.type !== 'watermark' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Text Color</label>
                                        <div className="flex gap-2 items-center">
                                            <input type="color" value={selectedBlock.style.color || '#000000'} onChange={(e) => updateBlockStyle('color', e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-slate-200" />
                                            <span className="text-xs text-slate-500 font-mono">{selectedBlock.style.color || '#000000'}</span>
                                        </div>
                                    </div>
                                )}

                                {selectedBlock.type === 'marks_table' && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Header Background</label>
                                            <div className="flex gap-2 items-center">
                                                <input type="color" value={selectedBlock.style.tableHeaderBg || '#f1f5f9'} onChange={(e) => updateBlockStyle('tableHeaderBg', e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-slate-200" />
                                                <span className="text-xs text-slate-500 font-mono">{selectedBlock.style.tableHeaderBg || '#f1f5f9'}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Grid Line Color</label>
                                            <div className="flex gap-2 items-center">
                                                <input type="color" value={selectedBlock.style.tableGridColor || '#94a3b8'} onChange={(e) => updateBlockStyle('tableGridColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-slate-200" />
                                                <span className="text-xs text-slate-500 font-mono">{selectedBlock.style.tableGridColor || '#94a3b8'}</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                                {(selectedBlock.type === 'student_info' || selectedBlock.type === 'non_academic' || selectedBlock.type === 'remarks' || selectedBlock.type === 'custom_text') && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Border</label>
                                            <div className="flex items-center gap-3 mb-2">
                                                <input type="checkbox" checked={selectedBlock.style.border} onChange={() => updateBlockStyle('border', !selectedBlock.style.border)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className="text-sm text-slate-700 dark:text-slate-300">Show Border</span>
                                            </div>
                                            {selectedBlock.style.border && (
                                                <div className="flex gap-2 items-center pl-6">
                                                    <input type="color" value={selectedBlock.style.borderColor || '#cbd5e1'} onChange={(e) => updateBlockStyle('borderColor', e.target.value)} className="w-6 h-6 rounded cursor-pointer border border-slate-200" />
                                                    <span className="text-xs text-slate-500 font-mono">Border Color</span>
                                                </div>
                                            )}
                                        </div>
                                        {selectedBlock.type !== 'non_academic' && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Background</label>
                                                <div className="flex gap-2 items-center">
                                                    <input type="color" value={selectedBlock.style.backgroundColor || '#ffffff'} onChange={(e) => updateBlockStyle('backgroundColor', e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-slate-200" />
                                                    <span className="text-xs text-slate-500 font-mono">Fill Color</span>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                                {selectedBlock.type !== 'watermark' && <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Font Size (px)</label><input type="range" min="8" max="60" value={selectedBlock.style.fontSize} onChange={(e) => updateBlockStyle('fontSize', parseInt(e.target.value))} className="w-full accent-indigo-600" /><div className="text-right text-xs font-mono mt-1">{selectedBlock.style.fontSize}px</div></div>}
                            </div>
                        ) : (
                            layoutSidebarTab === 'structure' ? (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Visible Blocks</h4>
                                    <div className="space-y-2">
                                        {layout.map(block => (
                                            <div key={block.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors cursor-pointer" onClick={() => setSelectedBlockId(block.id)}>
                                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    <Move size={14} className="text-slate-400" /> {block.label}
                                                </div>
                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <input type="checkbox" checked={block.isVisible} onChange={() => { addToHistory(layout); setLayout(prev => prev.map(b => b.id === block.id ? { ...b, isVisible: !b.isVisible } : b)); }} className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-3 text-center">Click a block name to edit styles.</p>
                                    
                                    <button onClick={saveSchoolAssets} disabled={isSavingAssets} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 shadow-sm">
                                        {isSavingAssets ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Set as Active Layout
                                    </button>

                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <button 
                                            onClick={handleUndo} 
                                            disabled={layoutHistory.length === 0}
                                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm disabled:opacity-50 disabled:grayscale"
                                        >
                                            <Undo2 size={16} /> Undo
                                        </button>
                                        <button 
                                            onClick={resetToDefaults} 
                                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm"
                                        >
                                            <RotateCcw size={16} /> Reset
                                        </button>
                                    </div>
                                </div>
                            ) : layoutSidebarTab === 'branding' ? (
                                <div className="space-y-4 animate-in slide-in-from-left duration-300">
                                    <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">School Name</label><input type="text" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800" value={schoolInfo.name} onChange={(e) => setSchoolInfo(prev => ({ ...prev, name: e.target.value.toUpperCase() }))} /></div>
                                    <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tagline</label><input type="text" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800" value={schoolInfo.tagline} onChange={(e) => setSchoolInfo(prev => ({ ...prev, tagline: e.target.value }))} /></div>
                                    <button onClick={saveSchoolAssets} disabled={isSavingAssets} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 shadow-sm">
                                        {isSavingAssets ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save Branding
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in slide-in-from-left duration-300">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Save Current Layout</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                className="flex-1 p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800" 
                                                placeholder="Template Name..." 
                                                value={newTemplateName}
                                                onChange={(e) => setNewTemplateName(e.target.value)}
                                            />
                                            <button onClick={handleSaveTemplate} disabled={isSavingAssets || !newTemplateName.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg flex items-center justify-center disabled:opacity-50">
                                                {isSavingAssets ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">Saves the current layout structure to the templates library.</p>
                                    </div>

                                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">System Presets</h4>
                                        <div className="space-y-2 mb-6">
                                            {PRESETS.map((preset, idx) => (
                                                <button 
                                                    key={idx}
                                                    onClick={() => handleLoadPreset(preset.layout)}
                                                    className="w-full flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors group"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Monitor size={14} className="text-indigo-500" />
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{preset.name}</span>
                                                    </div>
                                                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 font-bold transition-opacity">Load</span>
                                                </button>
                                            ))}
                                        </div>

                                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Database Templates</h4>
                                        <div className="space-y-2">
                                            {savedTemplates.length === 0 ? (
                                                <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">No saved layouts found.</p>
                                            ) : (
                                                savedTemplates.map(t => (
                                                    <div key={t.id} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="font-bold text-sm text-slate-700 dark:text-slate-300 truncate">{t.name}</span>
                                                            <button onClick={() => handleDeleteTemplate(t.id)} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                                                        </div>
                                                        <button onClick={() => handleLoadTemplate(t)} className="w-full flex items-center justify-center gap-2 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                                                            <FileDown size={12} /> Load Layout
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
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
                        <div className="w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-300 p-6 no-print max-w-5xl shadow-sm">
                            <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-slate-800 dark:text-white text-lg">Select Students</h3><button onClick={toggleSelectAll} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">Toggle All</button></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {students.filter(s => {
                                    const cls = classes.find(c => c.id === selectedClassId);
                                    return !cls || (s.className === cls.className && s.section === cls.section);
                                }).map(s => (
                                    <div key={s.id} onClick={() => { const n = new Set(bulkSelection); if(n.has(s.id)) n.delete(s.id); else n.add(s.id); setBulkSelection(n); }} className={clsx("p-4 border rounded-xl cursor-pointer flex items-center gap-3 transition-all", bulkSelection.has(s.id) ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 shadow-sm" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm")}>
                                        {bulkSelection.has(s.id) ? <CheckSquare className="text-indigo-600 dark:text-indigo-400" /> : <Square className="text-slate-300 dark:text-slate-600"/>} <span className="text-slate-800 dark:text-white font-bold text-sm">{s.fullName}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-8 w-full relative">
                            {loadingBulk && (
                                <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center min-h-[400px]">
                                    <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
                                    <p className="text-sm font-black text-indigo-600 uppercase tracking-widest">Generating Batch Reports...</p>
                                </div>
                            )}
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
