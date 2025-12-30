import React, { useState, useEffect, useRef } from 'react';
import { DataService } from '../services/dataService';
import { Student, Exam, MarkRecord, Subject, NonAcademicRecord } from '../types';
import { 
  Search, ShieldCheck, Download, Printer, User, 
  BookOpen, Calendar, GraduationCap, ArrowLeft,
  Loader2, Trophy, Activity, Info
} from 'lucide-react';
import { useToast } from '../components/ToastContext';
import clsx from 'clsx';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const PublicResultPortal: React.FC = () => {
  const [rollNumber, setRollNumber] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [resultData, setResultData] = useState<{
    student: Student;
    marks: MarkRecord[];
    nonAcademic: NonAcademicRecord | null;
  } | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        const [eData, sData, info] = await Promise.all([
          DataService.getExams(),
          DataService.getSubjects(),
          DataService.getSchoolInfo()
        ]);
        setExams(eData);
        setSubjects(sData);
        setSchoolInfo(info);
        if (eData.length > 0) setSelectedExamId(eData[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber.trim() || !selectedExamId) return;

    setIsSearching(true);
    setResultData(null);

    try {
      const allStudents = await DataService.getStudents();
      const student = allStudents.find(s => s.rollNumber.toUpperCase() === rollNumber.toUpperCase());

      if (!student) {
        showToast("Roll Number not found. Please verify and try again.", "error");
        setIsSearching(false);
        return;
      }

      const [marks, nonAcademicRecords] = await Promise.all([
        DataService.getStudentMarks(student.id, selectedExamId),
        DataService.getNonAcademicRecords(selectedExamId)
      ]);

      const naRecord = nonAcademicRecords.find(r => r.studentId === student.id) || null;

      if (marks.length === 0) {
        showToast("Results for this exam have not been published yet.", "info");
      }

      setResultData({
        student,
        marks,
        nonAcademic: naRecord
      });
    } catch (err) {
      showToast("Error retrieving records. System busy.", "error");
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownload = async () => {
    if (!reportRef.current || !resultData) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 3, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${resultData.student.fullName}_Result.pdf`);
    } catch (e) {
      showToast("Download failed", "error");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  const selectedExam = exams.find(e => e.id === selectedExamId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] transition-colors duration-500 selection:bg-indigo-500/30">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-600/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <header className="relative z-10 p-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-900/50 rounded-2xl flex items-center justify-center shadow-sm">
             <img src={schoolInfo?.icon || 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Unacademy_Logo.png/600px-Unacademy_Logo.png'} alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{schoolInfo?.name || 'Unacademy'}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] -mt-1">Public Result Portal</p>
          </div>
        </div>
        <a href="/" className="text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-indigo-900/30">
          <ArrowLeft size={14} /> Admin Login
        </a>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-24">
        {!resultData ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-4">
              <div className="inline-flex p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-3xl mb-4 border border-indigo-200 dark:border-indigo-800">
                <ShieldCheck size={40} />
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Academic Results <br/><span className="text-indigo-600 dark:text-indigo-400">Published Online</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto font-medium">Enter your credentials below to securely view your term assessment outcomes and progress report.</p>
            </div>

            <form onSubmit={handleSearch} className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[40px] shadow-2xl shadow-indigo-100 dark:shadow-none border border-slate-100 dark:border-indigo-900/30 relative group">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2 group/input">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within/input:text-indigo-600">Exam Term</label>
                  <div className="relative">
                    <select 
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-indigo-900/30 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-800 dark:text-white appearance-none"
                      value={selectedExamId}
                      onChange={(e) => setSelectedExamId(e.target.value)}
                    >
                      {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  </div>
                </div>

                <div className="space-y-2 group/input">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within/input:text-indigo-600">Student Roll Number</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. ACS001"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-indigo-900/30 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-800 dark:text-white placeholder:text-slate-400"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <button 
                  type="submit" 
                  disabled={isSearching}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[20px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-100 dark:shadow-none hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                >
                  {isSearching ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                  Check Result Now
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="animate-in zoom-in-95 duration-500 space-y-6">
            <div className="flex justify-between items-center no-print">
               <button onClick={() => setResultData(null)} className="text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-2 group">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg group-hover:bg-indigo-50 transition-colors">
                    <ArrowLeft size={16} />
                  </div>
                  New Search
               </button>
               <div className="flex gap-2">
                  <button onClick={handleDownload} disabled={isExporting} className="p-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-indigo-900/30 hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2 text-xs font-bold">
                    {isExporting ? <Loader2 className="animate-spin" size={16}/> : <Download size={16} />} Save PDF
                  </button>
                  <button onClick={() => window.print()} className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2 text-xs font-bold">
                    <Printer size={16} /> Print
                  </button>
               </div>
            </div>

            <div ref={reportRef} className="bg-white rounded-[40px] shadow-2xl overflow-hidden text-slate-900 border border-slate-100 min-h-[1000px] flex flex-col print:rounded-none print:shadow-none print:border-none print:w-full">
              <div className="bg-slate-900 p-10 text-white flex justify-between items-center relative overflow-hidden print:bg-slate-900">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 opacity-20 blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <img src={schoolInfo?.logo || schoolInfo?.icon} className="w-12 h-12 object-contain bg-white rounded-xl p-1" alt="" />
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">{schoolInfo?.name}</h3>
                      <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">{schoolInfo?.tagline}</p>
                    </div>
                  </div>
                  <h2 className="text-4xl font-black tracking-tighter">OFFICIAL TRANSCRIPT</h2>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">{selectedExam?.name}</p>
                </div>
                <div className="text-right relative z-10">
                  <div className="inline-flex p-4 bg-white/10 backdrop-blur-md rounded-[32px] border border-white/10 flex-col items-center">
                    <Trophy size={32} className="text-amber-400 mb-1" />
                    <span className="text-[10px] font-black uppercase text-indigo-200">Aggregate</span>
                    <span className="text-2xl font-black">
                      {resultData.marks.length > 0 
                        ? ((resultData.marks.reduce((a,b)=>a+(b.objMarks+b.subMarks),0) / resultData.marks.reduce((a,b)=>a+(b.objMaxMarks+b.subMaxMarks),0)) * 100).toFixed(1)
                        : '0.0'
                      }%
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-10 grid grid-cols-2 md:grid-cols-4 gap-8 bg-slate-50/50 border-b border-slate-100">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-1.5"><User size={12}/> Full Name</span>
                  <p className="font-bold text-lg">{resultData.student.fullName}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-1.5"><ShieldCheck size={12}/> Roll Number</span>
                  <p className="font-bold text-lg">{resultData.student.rollNumber}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-1.5"><GraduationCap size={12}/> Class & Section</span>
                  <p className="font-bold text-lg">{resultData.student.className} - {resultData.student.section}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-1.5"><Calendar size={12}/> Session</span>
                  <p className="font-bold text-lg">{schoolInfo?.academicSession || '2024-25'}</p>
                </div>
              </div>

              <div className="p-10 flex-1">
                <div className="mb-6 flex justify-between items-end">
                   <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                     <BookOpen size={14} className="text-indigo-500" /> Subject-wise Breakdown
                   </h4>
                </div>
                <div className="overflow-hidden border border-slate-100 rounded-2xl shadow-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                        <th className="px-6 py-4">Subject</th>
                        <th className="px-4 py-4 text-center">Obj.</th>
                        <th className="px-4 py-4 text-center">Subj.</th>
                        <th className="px-4 py-4 text-center">Obtained</th>
                        <th className="px-4 py-4 text-center">Maximum</th>
                        <th className="px-6 py-4 text-right">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {resultData.marks.length === 0 ? (
                        <tr><td colSpan={6} className="py-20 text-center text-slate-400 italic font-medium">Evaluation results pending publication.</td></tr>
                      ) : (
                        resultData.marks.map((m, idx) => {
                          const sub = subjects.find(s => s.id === m.subjectId);
                          const total = m.objMarks + m.subMarks;
                          const max = m.objMaxMarks + m.subMaxMarks;
                          return (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-6 py-4 font-bold text-slate-800">{sub?.name || 'Unknown'}</td>
                              <td className="px-4 py-4 text-center text-sm font-medium text-slate-500">{m.objMarks}</td>
                              <td className="px-4 py-4 text-center text-sm font-medium text-slate-500">{m.subMarks}</td>
                              <td className="px-4 py-4 text-center font-black text-slate-800">{total}</td>
                              <td className="px-4 py-4 text-center text-sm font-bold text-slate-400">{max}</td>
                              <td className="px-6 py-4 text-right">
                                <span className={clsx(
                                  "px-3 py-1 rounded-lg text-[10px] font-black uppercase",
                                  m.grade === 'Fail' ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
                                )}>
                                  {m.grade}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {resultData.nonAcademic && (
                  <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-4">
                     {[
                       { label: 'Attendance', val: resultData.nonAcademic.attendance },
                       { label: 'Discipline', val: resultData.nonAcademic.discipline },
                       { label: 'Communication', val: resultData.nonAcademic.communication },
                       { label: 'Participation', val: resultData.nonAcademic.participation },
                     ].map((item, i) => (
                       <div key={i} className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center text-center">
                          <span className="text-[8px] font-black uppercase text-indigo-400 tracking-widest mb-1">{item.label}</span>
                          <span className="text-xl font-black text-indigo-700">{item.val || 'N/A'}</span>
                       </div>
                     ))}
                  </div>
                )}
              </div>

              <div className="p-10 border-t border-slate-100 bg-slate-50/30 flex flex-col md:flex-row justify-between items-center gap-8">
                 <div className="flex gap-4 items-start max-w-sm">
                    <div className="p-2 bg-white rounded-xl shadow-sm"><Info size={16} className="text-slate-400" /></div>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium italic">
                      This is a computer-generated transcript published by the {schoolInfo?.name} Exam Department.
                    </p>
                 </div>
                 {schoolInfo?.signature && (
                   <div className="text-center">
                      <img src={schoolInfo.signature} className="h-16 w-32 object-contain mix-blend-multiply mb-1 mx-auto" alt="" />
                      <div className="w-40 h-[1px] bg-slate-200 mb-2"></div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Academic Head</p>
                   </div>
                 )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="p-12 text-center no-print">
        <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-bold opacity-50">
          <Activity size={14} /> System Secure • Powered by Quantum Result Engine
        </div>
      </footer>
    </div>
  );
};