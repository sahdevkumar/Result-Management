
import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, Loader2, CheckSquare, Square, FileText, Users, Search, Maximize2, Layout
} from 'lucide-react';
import { useToast } from '../components/ToastContext';
import { DataService } from '../services/dataService';
import { Student, Exam, SchoolClass, Subject, SavedTemplate, DesignElement } from '../types';
import clsx from 'clsx';

type PrintTab = 'single' | 'bulk';
type PaperSize = 'A4' | 'Letter';
type Orientation = 'portrait' | 'landscape';

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
  
  // Paper Settings
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [orientation, setOrientation] = useState<Orientation>('portrait');

  // Bulk Selection
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  
  // Printing State
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Preview State (Single)
  const [previewElements, setPreviewElements] = useState<DesignElement[]>([]);
  const [previewSize, setPreviewSize] = useState({ width: 794, height: 1123 });

  // --- Initial Data Load ---
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [e, c, s, sub, tmpls] = await Promise.all([
          DataService.getExams(),
          DataService.getClasses(),
          DataService.getStudents(),
          DataService.getSubjects(),
          DataService.getTemplates()
        ]);
        setExams(e);
        setClasses(c);
        setStudents(s);
        setSubjects(sub);
        setSavedTemplates(tmpls);
        
        // Defaults
        if (e.length > 0) setExamId(e[0].id);
        if (c.length > 0) setClassId(c[0].id);
        if (tmpls.length > 0) setTemplateId(tmpls[0].id);
      } catch (err) {
        showToast("Failed to load database data", 'error');
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

  // Dimension Helper
  const getPageDimensions = () => {
    let w = 794; // A4 approx px at 96dpi
    let h = 1123;
    if (paperSize === 'Letter') {
      w = 816; // 8.5in
      h = 1056; // 11in
    }
    return orientation === 'landscape' ? { width: h, height: w } : { width: w, height: h };
  };

  const generatePreview = () => {
    const template = savedTemplates.find(t => t.id === templateId);
    const student = students.find(s => s.id === studentId);
    const exam = exams.find(e => e.id === examId);

    if (!template || !student || !exam) {
      setPreviewElements([]);
      return;
    }

    const dims = getPageDimensions();
    setPreviewSize(dims);

    const mappedElements = template.elements.map(el => {
      if (el.type === 'text') {
        let content = el.content;
        content = content.replace(/{{name}}/g, student.fullName);
        content = content.replace(/{{roll}}/g, student.rollNumber);
        content = content.replace(/{{class}}/g, student.className);
        content = content.replace(/{{section}}/g, student.section);
        content = content.replace(/{{exam}}/g, exam.name);
        return { ...el, content };
      }
      return el;
    });

    setPreviewElements(mappedElements);
  };

  // --- Live Preview for Single Print ---
  useEffect(() => {
    if (activeTab === 'single' && templateId && examId && studentId) {
        generatePreview();
    }
  }, [activeTab, templateId, examId, studentId, paperSize, orientation, savedTemplates, students, exams]);

  const handlePrint = () => {
    if (activeTab === 'single' && !studentId) return;
    if (activeTab === 'bulk' && selectedStudentIds.size === 0) return;
    window.print();
  };

  const toggleStudentSelection = (id: string) => {
    const next = new Set(selectedStudentIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedStudentIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.size === filteredStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Print Styles */}
      <style>
        {`
          @media print {
            @page {
              size: ${paperSize} ${orientation};
              margin: 0;
            }
          }
        `}
      </style>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Print Center</h1>
          <p className="text-slate-500 text-sm">Generate and print reports using custom templates</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
            <button 
                onClick={() => setActiveTab('single')} 
                className={clsx(
                    "px-4 py-2 text-sm font-medium rounded-md transition-all",
                    activeTab === 'single' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
                )}
            >
                Single Print
            </button>
            <button 
                onClick={() => setActiveTab('bulk')} 
                className={clsx(
                    "px-4 py-2 text-sm font-medium rounded-md transition-all",
                    activeTab === 'bulk' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
                )}
            >
                Bulk Print
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 no-print">
        {/* Configuration Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">1. Select Template</label>
              <select 
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                {savedTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                {savedTemplates.length === 0 && <option value="">No templates found</option>}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">2. Paper Settings</label>
              <div className="grid grid-cols-2 gap-2">
                <select 
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50 text-slate-900"
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                >
                  <option value="A4">A4 Size</option>
                  <option value="Letter">Letter Size</option>
                </select>
                <select 
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-slate-50 text-slate-900"
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as Orientation)}
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">3. Select Exam</label>
              <select 
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
              >
                {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">4. Select Class</label>
              <select 
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
              >
                <option value="">Choose Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.className} - {c.section}</option>)}
              </select>
            </div>

            {activeTab === 'single' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">5. Select Student</label>
                <select 
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={!classId}
                >
                  <option value="">Choose Student</option>
                  {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.rollNumber})</option>)}
                </select>
              </div>
            )}
            
            <button 
              onClick={handlePrint}
              disabled={loading || (activeTab === 'single' ? !studentId : selectedStudentIds.size === 0)}
              className="w-full bg-slate-800 hover:bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 shadow-lg shadow-slate-200"
            >
              <Printer size={18} />
              {activeTab === 'single' ? 'Print Report' : `Print (${selectedStudentIds.size}) Reports`}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'bulk' && classId && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Users size={18} className="text-indigo-600" />
                        Select Students for Bulk Printing
                    </h3>
                    <button onClick={toggleSelectAll} className="text-xs font-bold text-blue-600 hover:underline">
                        {selectedStudentIds.size === filteredStudents.length ? 'Deselect All' : 'Select All'}
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {filteredStudents.map(s => (
                        <div 
                            key={s.id} 
                            onClick={() => toggleStudentSelection(s.id)}
                            className={clsx(
                                "p-3 border rounded-lg cursor-pointer flex items-center gap-3 transition-all",
                                selectedStudentIds.has(s.id) ? "bg-indigo-50 border-indigo-200 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            )}
                        >
                            {selectedStudentIds.has(s.id) ? (
                                <CheckSquare size={18} className="text-indigo-600" />
                            ) : (
                                <Square size={18} className="text-slate-300" />
                            )}
                            <div className="overflow-hidden">
                                <p className="text-xs font-bold text-slate-800 truncate">{s.fullName}</p>
                                <p className="text-[10px] text-slate-500 font-mono">{s.rollNumber}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {/* Preview Display for Single Student */}
          {activeTab === 'single' && templateId && studentId && (
              <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
                  <div className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} /> Live Print Preview ({orientation === 'portrait' ? 'Portrait' : 'Landscape'})
                  </div>
                  <div 
                    className="bg-white shadow-2xl relative overflow-hidden border border-slate-200 shrink-0"
                    style={{ 
                        width: `${previewSize.width}px`, 
                        height: `${previewSize.height}px`,
                        transform: orientation === 'portrait' ? 'scale(0.65)' : 'scale(0.55)',
                        transformOrigin: 'top center',
                        marginBottom: `-${previewSize.height * (orientation === 'portrait' ? 0.35 : 0.45)}px`
                    }}
                  >
                    {previewElements.map(el => (
                        <div
                            key={el.id} 
                            className="absolute"
                            style={{ 
                                left: el.x, 
                                top: el.y, 
                                width: el.width, 
                                height: el.height, 
                                opacity: el.style.opacity,
                                zIndex: el.type === 'watermark' ? 0 : 10
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
                                    wordBreak: 'break-word', 
                                    width: '100%', 
                                    height: '100%' 
                                }}>
                                    {el.content}
                                </div>
                            ) : ( 
                                <img src={el.content} alt="preview element" className="w-full h-full object-contain" /> 
                            )}
                        </div>
                    ))}
                  </div>
              </div>
          )}
          
          {activeTab === 'single' && (!templateId || !studentId) && (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl py-20 text-center text-slate-400">
                  Select a template and student to see the preview.
              </div>
          )}
        </div>
      </div>

      {/* Hidden Print Section - Optimized for Browser Printing */}
      <div className="hidden print:block">
          {activeTab === 'single' && (
              <div 
                className="bg-white relative overflow-hidden mx-auto"
                style={{ width: `${previewSize.width}px`, height: `${previewSize.height}px` }}
              >
                {previewElements.map(el => (
                    <div
                        key={el.id} 
                        className="absolute"
                        style={{ 
                            left: el.x, 
                            top: el.y, 
                            width: el.width, 
                            height: el.height, 
                            opacity: el.style.opacity,
                            zIndex: el.type === 'watermark' ? 0 : 10
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
                                wordBreak: 'break-word', 
                                width: '100%', 
                                height: '100%' 
                            }}>
                                {el.content}
                            </div>
                        ) : ( 
                            <img src={el.content} alt="print element" className="w-full h-full object-contain" /> 
                        )}
                    </div>
                ))}
              </div>
          )}
      </div>
    </div>
  );
};
