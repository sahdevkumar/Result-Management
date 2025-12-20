
import React, { useState, useEffect, useRef } from 'react';
import { DataService } from '../services/dataService';
import { Student, Exam, MarkRecord, Subject, SchoolClass } from '../types';
import { Download, ChevronDown, Loader2, Printer, FileDown, FileText, GraduationCap } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const Reports: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [reportMarks, setReportMarks] = useState<MarkRecord[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        const [sData, eData, subData, cData] = await Promise.all([
          DataService.getStudents(),
          DataService.getExams(),
          DataService.getSubjects(),
          DataService.getClasses()
        ]);
        setStudents(sData); setExams(eData); setSubjects(subData); setClasses(cData);
        if(sData.length) setSelectedStudentId(sData[0].id);
        if(eData.length) setSelectedExamId(eData[0].id);
      } catch (err) { showToast("Failed to load reporting data", "error"); }
    };
    init();
  }, []);

  const filteredStudents = students.filter(s => {
    if (!selectedClassId) return true;
    const cls = classes.find(c => c.id === selectedClassId);
    return cls ? (s.className === cls.className && s.section === cls.section) : true;
  });

  useEffect(() => {
    if (filteredStudents.length > 0) {
      if (!filteredStudents.some(s => s.id === selectedStudentId)) setSelectedStudentId(filteredStudents[0].id);
    } else { setSelectedStudentId(''); }
  }, [selectedClassId, students, classes]);

  useEffect(() => { if (selectedStudentId && selectedExamId) loadStudentMarks(); else setReportMarks([]); }, [selectedStudentId, selectedExamId]);

  const loadStudentMarks = async () => {
    try { const data = await DataService.getStudentMarks(selectedStudentId, selectedExamId); setReportMarks(data); } catch (err) { showToast("Failed to load marks", "error"); }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return; setIsGenerating(true);
    try {
        const canvas = await html2canvas(reportRef.current, { scale: 3, useCORS: true, logging: false, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Report_${students.find(s => s.id === selectedStudentId)?.fullName || 'Student'}.pdf`);
        showToast("PDF generated!", "success");
    } catch (error) { showToast("Failed to generate PDF", "error"); } finally { setIsGenerating(false); }
  };

  const handleExportWord = () => { /* Word Export Logic */ };
  const handlePrint = () => { window.print(); };

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const consolidatedMarks: Record<string, any> = {};
  reportMarks.forEach(mark => {
      const sub = subjects.find(s => s.id === mark.subjectId);
      consolidatedMarks[mark.subjectId] = { obj: mark.objMarks, subj: mark.subMarks, total: mark.objMarks + mark.subMarks, max: mark.objMaxMarks || sub?.maxMarks || 100, grade: mark.grade };
  });
  const totalObtained = Object.values(consolidatedMarks).reduce((acc, curr) => acc + curr.total, 0);
  const totalMax = Object.values(consolidatedMarks).reduce((acc, curr) => acc + curr.max, 0);
  const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  const existingRemarks = reportMarks.filter(m => m.remarks).map(m => ({ subject: subjects.find(s => s.id === m.subjectId)?.name, text: m.remarks }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white no-print">Result Processing & Reports</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6 no-print">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
             <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Report Configuration</h2>
             <div className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Select Exam</label>
                    <div className="relative">
                        <select className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)}>
                            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Filter by Class</label>
                    <div className="relative">
                        <select className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                            <option value="">All Classes</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.className} - {c.section}</option>)}
                        </select>
                        <GraduationCap className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Select Student</label>
                    <div className="relative">
                        <select className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} disabled={filteredStudents.length === 0}>
                            {filteredStudents.length === 0 ? <option value="">No students found</option> : filteredStudents.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.rollNumber})</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
                    </div>
                </div>
             </div>
          </div>
        </div>
        <div className="lg:col-span-2">
           {selectedStudentId ? (
              <div ref={reportRef} className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 print:shadow-none print:border-none print:w-full animate-in fade-in duration-300">
                 <div className="bg-slate-800 p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:bg-slate-800 print:text-white print-color-adjust-exact">
                    <div><h2 className="text-2xl font-serif font-bold">Progress Report</h2><p className="text-slate-400 text-sm print:text-slate-300">{exams.find(e => e.id === selectedExamId)?.name}</p></div>
                    <div className="text-left sm:text-right"><p className="text-2xl font-bold text-green-400">{percentage.toFixed(1)}%</p><p className="text-xs text-slate-400 uppercase tracking-wider print:text-slate-300">Overall Aggregate</p></div>
                 </div>
                 <div className="p-4 sm:p-8 text-slate-900">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 border-b border-slate-100 pb-6 text-center sm:text-left print:flex-row print:text-left">
                       <img src={selectedStudent?.avatarUrl} className="w-20 h-20 rounded-lg object-cover border-2 border-slate-100 shadow-sm" alt="Student" />
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 w-full">
                           <div><p className="text-xs text-slate-500 uppercase font-bold tracking-tight">Student Name</p><p className="font-bold text-slate-800">{selectedStudent?.fullName}</p></div>
                           <div><p className="text-xs text-slate-500 uppercase font-bold tracking-tight">Roll Number</p><p className="font-bold text-slate-800">{selectedStudent?.rollNumber}</p></div>
                           <div><p className="text-xs text-slate-500 uppercase font-bold tracking-tight">Class</p><p className="font-bold text-slate-800">{selectedStudent?.className} - {selectedStudent?.section}</p></div>
                           <div><p className="text-xs text-slate-500 uppercase font-bold tracking-tight">Guardian</p><p className="font-bold text-slate-800">{selectedStudent?.guardianName}</p></div>
                       </div>
                    </div>
                    <div className="overflow-x-auto mb-8">
                        <table className="w-full min-w-[300px]">
                           <thead><tr className="border-b-2 border-slate-100"><th className="text-left py-3 text-sm font-bold text-slate-600">Subject</th><th className="text-center py-3 text-sm font-bold text-slate-600">Objective</th><th className="text-center py-3 text-sm font-bold text-slate-600">Subjective</th><th className="text-center py-3 text-sm font-bold text-slate-600">Total</th><th className="text-center py-3 text-sm font-bold text-slate-600">Max</th><th className="text-center py-3 text-sm font-bold text-slate-600">Grade</th></tr></thead>
                           <tbody className="divide-y divide-slate-50">
                               {Object.keys(consolidatedMarks).length === 0 ? ( <tr><td colSpan={6} className="py-12 text-center text-slate-400 italic">No marks recorded.</td></tr> ) : (
                                   Object.keys(consolidatedMarks).map((subId) => {
                                       const subject = subjects.find(s => s.id === subId); const data = consolidatedMarks[subId];
                                       return ( <tr key={subId}><td className="py-3 text-slate-700 font-medium">{subject?.name}</td><td className="py-3 text-center text-slate-500 text-sm">{data.obj || '-'}</td><td className="py-3 text-center text-slate-500 text-sm">{data.subj || '-'}</td><td className="py-3 text-center text-slate-800 font-bold">{data.total}</td><td className="py-3 text-center text-slate-500">{data.max}</td><td className="py-3 text-center"><span className={`px-2 py-1 rounded text-xs font-bold ${data.grade === 'Fail' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'} print-color-adjust-exact`}>{data.grade}</span></td></tr> );
                                   })
                               )}
                           </tbody>
                        </table>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 relative group print:bg-white print:border-slate-300">
                       <h4 className="font-bold text-slate-800 mb-3">Teacher's Remarks</h4>
                       {existingRemarks.length > 0 ? ( <div className="space-y-2">{existingRemarks.map((rem, idx) => ( <p key={idx} className="text-slate-600 text-sm italic"><span className="font-semibold not-italic text-slate-700">{rem.subject}:</span> "{rem.text}"</p> ))}</div> ) : ( <p className="text-slate-400 text-sm italic">No remarks recorded.</p> )}
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap justify-end gap-3 no-print">
                       <button onClick={handleDownloadPDF} disabled={isGenerating} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors justify-center font-medium disabled:opacity-50 shadow-md shadow-indigo-100">{isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} Download PDF</button>
                       <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-800 hover:bg-black text-white px-6 py-2 rounded-lg transition-colors justify-center font-medium shadow-md shadow-slate-200"><Printer size={18} /> Print Report</button>
                    </div>
                 </div>
              </div>
           ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 py-24 text-center">
                  <div className="flex flex-col items-center gap-3"><div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-full text-slate-300 dark:text-slate-500"><FileText size={48} /></div><p className="text-slate-500 dark:text-slate-400 font-medium">Please select a class and student to generate a report preview.</p></div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
