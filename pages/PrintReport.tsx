import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, Loader2, CheckSquare, Square, FileText, Users, Search 
} from 'lucide-react';
import { useToast } from '../components/ToastContext';
import { DataService } from '../services/dataService';
import { Student, Exam, SchoolClass, Subject, SavedTemplate, DesignElement } from '../types';
import clsx from 'clsx';

type PrintTab = 'single' | 'bulk';

export const PrintReport: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PrintTab>('single');
  const { showToast } = useToast();
  
  // Data
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Configuration
  const [templateId, setTemplateId] = useState('');
  const [examId, setExamId] = useState('');
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState(''); // For Single Print

  // Bulk Selection
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  
  // Printing State
  const [isPrinting, setIsPrinting] = useState(false);
  const [printPages, setPrintPages] = useState<{studentId: string, elements: DesignElement[]}[]>([]);
  
  // Preview State (Single)
  const [previewElements, setPreviewElements] = useState<DesignElement[]>([]);
  const [previewSize, setPreviewSize] = useState({ width: 794, height: 1123 });

  // --- Initial Data Load ---
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [e, c, s, sub] = await Promise.all([
          DataService.getExams(),
          DataService.getClasses(),
          DataService.getStudents(),
          DataService.getSubjects()
        ]);
        setExams(e);
        setClasses(c);
        setStudents(s);
        setSubjects(sub);
        
        // Load templates
        const saved = localStorage.getItem('educore_templates');
        if (saved) {
            setSavedTemplates(JSON.parse(saved));
        }

        // Defaults
        if (e.length > 0) setExamId(e[0].id);
        if (c.length > 0) setClassId(c[0].id);
      } catch (err) {
        showToast("Failed to load data", 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // --- Filtering & Selection ---
  useEffect(() => {
    if (classId) {
      const selectedClass = classes.find(c => c.id === classId);
      if (selectedClass) {
        const filtered = students.filter(s => 
          s.className === selectedClass.className && s.section === selectedClass.section
        );
        setFilteredStudents(filtered);
        if (activeTab === 'single' && filtered.length > 0) {
            setStudentId(filtered[0].id);
        } else {
            setStudentId('');
        }
        // Auto select all for bulk
        setSelectedStudentIds(new Set(filtered.map(s => s.id)));
      }
    } else {
      setFilteredStudents([]);
      setStudentId('');
    }
  }, [classId, students, classes, activeTab]);

  // --- Live Preview for Single Print ---
  useEffect(() => {
    if (activeTab === 'single' && templateId && examId && studentId) {
        generatePreview();
    }
  }, [activeTab, templateId, examId, studentId]);

  const hydrateElements = async (elements: DesignElement[], s: Student, exam: Exam) => {
    // Fetch marks
    const marks = await DataService.getStudentMarks(s.id, exam.id);
    
    // Consolidate Marks (Obj + Subj)
    const consolidatedMarks: Record<string, { total: number, grade: string }> = {};
    marks.forEach(m => {
        if(!consolidatedMarks[m.subjectId]) {
            consolidatedMarks[m.subjectId] = { total: 0, grade: '-' };
        }
        consolidatedMarks[m.subjectId].total += m.obtainedMarks;
        // Simplified grade logic, ideally fetched from subject definition
    });

    // Determine final grade for each subject
    Object.keys(consolidatedMarks).forEach(sid => {
        const sub = subjects.find(sb => sb.id === sid);
        const max = sub?.maxMarks || 100;
        const total = consolidatedMarks[sid].total;
        const pct = (total/max)*100;
        
        let grade = 'F';
        if(pct >= 90) grade = 'A+';
        else if(pct >= 80) grade = 'A';
        else if(pct >= 70) grade = 'B';
        else if(pct >= 60) grade = 'C';
        else if(pct >= 50) grade = 'D';
        else if(pct >= 40) grade = 'E';
        consolidatedMarks[sid].grade = grade;
    });

    const overallTotal = Object.values(consolidatedMarks).reduce((acc, curr) => acc + curr.total, 0);
    const overallMax = Object.keys(consolidatedMarks).length * 100; // approximation if max not available per record
    const percentage = overallMax > 0 ? ((overallTotal / overallMax) * 100).toFixed(1) : '0';

    return elements.map(el => {
        if (el.type !== 'text') return el;
        
        let text = el.content;
        // Variables
        text = text.replace(/{{name}}/gi, s.fullName);
        text = text.replace(/{{roll}}/gi, s.rollNumber);
        text = text.replace(/{{class}}/gi, `${s.className}-${s.section}`);
        text = text.replace(/{{guardian}}/gi, s.guardianName);
        text = text.replace(/{{exam}}/gi, exam.name);
        
        text = text.replace(/{{total}}/gi, overallTotal.toString());
        text = text.replace(/{{percentage}}/gi, percentage + '%');
        
        // Tables
        if (text.includes('{{marks_table}}')) {
            const tableStr = Object.keys(consolidatedMarks).map(sid => {
                const sub = subjects.find(sb => sb.id === sid);
                const cm = consolidatedMarks[sid];
                return `${sub?.name || 'Sub'}: ${cm.total} (${cm.grade})`; 
            }).join('\n');
            text = text.replace(/{{marks_table}}/gi, tableStr);
        } else if (text.includes('{{marks_summary}}')) {
             const summary = Object.keys(consolidatedMarks).map(sid => {
                const sub = subjects.find(sb => sb.id === sid);
                const cm = consolidatedMarks[sid];
                return `${sub?.code}: ${cm.total}`; 
            }).join(', ');
            text = text.replace(/{{marks_summary}}/gi, summary);
        }

        return { ...el, content: text };
    });
  };

  const generatePreview = async () => {
      const tmpl = savedTemplates.find(t => t.id === templateId);
      const exam = exams.find(e => e.id === examId);
      const student = students.find(s => s.id === studentId);
      
      if (!tmpl || !exam || !student) return;
      
      setPreviewSize({ width: tmpl.width, height: tmpl.height });
      const hydrated = await hydrateElements(tmpl.elements, student, exam);
      setPreviewElements(hydrated);
  };

  const handlePrint = async () => {
    if (!templateId || !examId) {
        showToast("Select template and exam", 'error');
        return;
    }

    const tmpl = savedTemplates.find(t => t.id === templateId);
    const exam = exams.find(e => e.id === examId);
    if (!tmpl || !exam) return;

    let targetStudents: Student[] = [];
    if (activeTab === 'single') {
        const s = students.find(st => st.id === studentId);
        if (s) targetStudents = [s];
    } else {
        targetStudents = filteredStudents.filter(s => selectedStudentIds.has(s.id));
    }

    if (targetStudents.length === 0) {
        showToast("No students selected", 'error');
        return;
    }

    setIsPrinting(true);
    setPreviewSize({ width: tmpl.width, height: tmpl.height });

    try {
        const pages = [];
        for (const s of targetStudents) {
            const elements = await hydrateElements(tmpl.elements, s, exam);
            pages.push({ studentId: s.id, elements });
        }
        setPrintPages(pages);

        // Allow DOM to update
        requestAnimationFrame(() => {
           setTimeout(() => {
             window.print();
             setIsPrinting(false);
             // Optional: Keep pages for a moment to avoid glitch, but normally clearing is fine
             setPrintPages([]);
           }, 500);
        });
    } catch (e) {
        showToast("Error generating print pages", 'error');
        setIsPrinting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.size === filteredStudents.length) {
        setSelectedStudentIds(new Set());
    } else {
        setSelectedStudentIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const toggleStudentSelection = (id: string) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedStudentIds(newSet);
  };

  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-800 no-print">Print Reports</h1>
        
        <div className="flex flex-col lg:flex-row gap-6 no-print">
            {/* Sidebar Configuration */}
            <div className="lg:w-80 space-y-4">
                {/* Tabs */}
                <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                    <button 
                        onClick={() => setActiveTab('single')}
                        className={clsx("flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2", activeTab === 'single' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700")}
                    >
                        <FileText size={16} /> Print
                    </button>
                    <button 
                        onClick={() => setActiveTab('bulk')}
                        className={clsx("flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2", activeTab === 'bulk' ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700")}
                    >
                        <Users size={16} /> Bulk Print
                    </button>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configuration</h3>
                    
                    <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Template</label>
                        <select 
                            className="w-full p-2 border border-slate-300 rounded text-sm"
                            value={templateId}
                            onChange={(e) => setTemplateId(e.target.value)}
                        >
                            <option value="">Select Template</option>
                            {savedTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Exam</label>
                        <select 
                            className="w-full p-2 border border-slate-300 rounded text-sm"
                            value={examId}
                            onChange={(e) => setExamId(e.target.value)}
                        >
                             <option value="">Select Exam</option>
                            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Class</label>
                        <select 
                            className="w-full p-2 border border-slate-300 rounded text-sm"
                            value={classId}
                            onChange={(e) => setClassId(e.target.value)}
                        >
                            <option value="">Select Class</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.className} - {c.section}</option>)}
                        </select>
                    </div>

                    {activeTab === 'single' && (
                        <div>
                            <label className="block text-[10px] text-slate-400 mb-1">Student</label>
                            <select 
                                className="w-full p-2 border border-slate-300 rounded text-sm"
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                            >
                                <option value="">Select Student</option>
                                {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.rollNumber})</option>)}
                            </select>
                        </div>
                    )}
                </div>

                <button 
                    onClick={handlePrint}
                    disabled={isPrinting || !templateId || !examId || (activeTab === 'single' ? !studentId : selectedStudentIds.size === 0)}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isPrinting ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />}
                    {isPrinting ? 'Generating...' : activeTab === 'single' ? 'Print Report' : `Print Selected (${selectedStudentIds.size})`}
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 p-4 lg:p-8 overflow-auto min-h-[600px] flex justify-center items-start">
                
                {activeTab === 'single' ? (
                    templateId && studentId ? (
                        <div 
                            className="bg-white shadow-2xl origin-top transition-transform"
                            style={{
                                width: `${previewSize.width}px`,
                                height: `${previewSize.height}px`,
                                transform: 'scale(0.65)',
                                position: 'relative'
                            }}
                        >
                            {previewElements.map(el => (
                                <div
                                    key={el.id}
                                    style={{
                                        position: 'absolute',
                                        left: el.x,
                                        top: el.y,
                                        width: el.width,
                                        height: el.height,
                                        zIndex: el.type === 'watermark' ? 0 : 1,
                                        opacity: el.style.opacity
                                    }}
                                >
                                    {el.type === 'text' ? (
                                        <div style={{
                                            fontSize: `${el.style.fontSize}px`,
                                            fontFamily: el.style.fontFamily,
                                            color: el.style.color,
                                            fontWeight: el.style.fontWeight,
                                            fontStyle: el.style.fontStyle,
                                            textDecoration: el.style.textDecoration,
                                            textAlign: el.style.textAlign as any,
                                            lineHeight: el.style.lineHeight,
                                            letterSpacing: `${el.style.letterSpacing}px`,
                                            whiteSpace: 'pre-wrap',
                                            width: '100%',
                                            height: '100%',
                                        }}>
                                            {el.content}
                                        </div>
                                    ) : (
                                        <img src={el.content} className="w-full h-full object-contain" alt="" />
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <Printer size={48} className="mb-4 opacity-50" />
                            <p>Select configuration to preview report</p>
                        </div>
                    )
                ) : (
                    // BULK TAB LIST
                    <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden self-start">
                         <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-700">Student List ({filteredStudents.length})</h3>
                            <button onClick={toggleSelectAll} className="text-xs text-blue-600 font-medium hover:underline">
                                {selectedStudentIds.size === filteredStudents.length ? 'Deselect All' : 'Select All'}
                            </button>
                         </div>
                         <div className="max-h-[600px] overflow-y-auto">
                            {filteredStudents.length === 0 ? (
                                <p className="p-8 text-center text-slate-400">No students found.</p>
                            ) : (
                                filteredStudents.map(s => (
                                    <div 
                                        key={s.id} 
                                        onClick={() => toggleStudentSelection(s.id)}
                                        className="flex items-center gap-3 p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                                    >
                                        {selectedStudentIds.has(s.id) ? 
                                            <CheckSquare size={18} className="text-blue-600" /> : 
                                            <Square size={18} className="text-slate-300" />
                                        }
                                        <div>
                                            <p className="font-medium text-sm text-slate-800">{s.fullName}</p>
                                            <p className="text-xs text-slate-400">{s.rollNumber}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                         </div>
                    </div>
                )}
            </div>
        </div>

        {/* HIDDEN PRINT CONTAINER - Only visible during print */}
        <div className="hidden print:block absolute top-0 left-0 w-full z-[9999] bg-white">
            {printPages.map((page, index) => (
                <div 
                    key={index} 
                    className="relative overflow-hidden print-page"
                    style={{
                        width: `${previewSize.width}px`,
                        height: `${previewSize.height}px`,
                        pageBreakAfter: 'always',
                        margin: '0 auto' 
                    }}
                >
                    {page.elements.map(el => (
                        <div
                            key={el.id}
                            className="absolute"
                            style={{
                                left: el.x,
                                top: el.y,
                                width: el.width,
                                height: el.height,
                                zIndex: el.type === 'watermark' ? 0 : 1,
                                opacity: el.style.opacity
                            }}
                        >
                            {el.type === 'text' ? (
                                <div style={{
                                    fontSize: `${el.style.fontSize}px`,
                                    fontFamily: el.style.fontFamily,
                                    color: el.style.color,
                                    fontWeight: el.style.fontWeight,
                                    fontStyle: el.style.fontStyle,
                                    textDecoration: el.style.textDecoration,
                                    textAlign: el.style.textAlign as any,
                                    lineHeight: el.style.lineHeight,
                                    letterSpacing: `${el.style.letterSpacing}px`,
                                    whiteSpace: 'pre-wrap',
                                    width: '100%',
                                    height: '100%',
                                }}>
                                    {el.content}
                                </div>
                            ) : (
                                <img src={el.content} alt="" className="w-full h-full object-contain" />
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
        <style>{`
            @media print {
                @page {
                    size: ${previewSize.width}px ${previewSize.height}px;
                    margin: 0;
                }
                body {
                    background-color: white;
                }
            }
        `}</style>
    </div>
  );
};