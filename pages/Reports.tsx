import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { generateStudentReportRemark, analyzeClassPerformance } from '../services/geminiService';
import { Student, Exam, MarkRecord, Subject } from '../types';
import { Wand2, Download, ChevronDown, Loader2 } from 'lucide-react';

export const Reports: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  
  const [reportMarks, setReportMarks] = useState<MarkRecord[]>([]);
  const [aiRemark, setAiRemark] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [analyzingClass, setAnalyzingClass] = useState(false);
  const [classAnalysis, setClassAnalysis] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      const [sData, eData, subData] = await Promise.all([
        DataService.getStudents(),
        DataService.getExams(),
        DataService.getSubjects()
      ]);
      setStudents(sData);
      setExams(eData);
      setSubjects(subData);
      if(sData.length) setSelectedStudentId(sData[0].id);
      if(eData.length) setSelectedExamId(eData[0].id);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedStudentId && selectedExamId) {
      loadStudentMarks();
      setAiRemark(''); // Reset remark on change
    }
  }, [selectedStudentId, selectedExamId]);

  const loadStudentMarks = async () => {
    const data = await DataService.getStudentMarks(selectedStudentId, selectedExamId);
    setReportMarks(data);
  };

  const handleGenerateRemark = async () => {
    setGenerating(true);
    try {
      const student = students.find(s => s.id === selectedStudentId);
      const exam = exams.find(e => e.id === selectedExamId);
      if (student && exam) {
        const remark = await generateStudentReportRemark(student, exam.name, reportMarks, subjects);
        setAiRemark(remark);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleClassAnalysis = async () => {
    setAnalyzingClass(true);
    try {
        // Mocking aggregated data for the API call
        const exam = exams.find(e => e.id === selectedExamId);
        if(exam) {
            const analysis = await analyzeClassPerformance(
                exam.name,
                78, // mock avg
                92, // mock pass rate
                'Mathematics',
                'Physics'
            );
            setClassAnalysis(analysis);
        }
    } finally {
        setAnalyzingClass(false);
    }
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const totalMarks = reportMarks.reduce((acc, curr) => acc + curr.total, 0);
  const maxTotal = reportMarks.length * 100; // Simplified
  const percentage = maxTotal > 0 ? (totalMarks / maxTotal) * 100 : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Result Processing & Reports</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
             <h2 className="font-semibold text-slate-800 mb-4">Report Configuration</h2>
             <div className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Select Exam</label>
                    <div className="relative">
                        <select 
                            className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedExamId}
                            onChange={(e) => setSelectedExamId(e.target.value)}
                        >
                            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Select Student</label>
                    <div className="relative">
                        <select 
                            className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-700 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                        >
                            {students.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.rollNumber})</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
                    </div>
                </div>
             </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 rounded-xl text-white shadow-lg">
             <div className="flex items-center gap-2 mb-2">
                <Wand2 size={20} className="text-yellow-300" />
                <h3 className="font-bold text-lg">AI Insights</h3>
             </div>
             <p className="text-indigo-100 text-sm mb-4">Generate overall class performance analysis for the selected exam.</p>
             <button 
                onClick={handleClassAnalysis}
                disabled={analyzingClass}
                className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-2"
             >
                {analyzingClass ? <Loader2 className="animate-spin" size={16} /> : 'Analyze Class Performance'}
             </button>
             {classAnalysis && (
                <div className="mt-4 p-3 bg-black/20 rounded-lg text-xs leading-relaxed text-indigo-50 border border-white/10">
                    <pre className="whitespace-pre-wrap font-sans">{classAnalysis}</pre>
                </div>
             )}
          </div>
        </div>

        {/* Report Card Preview */}
        <div className="lg:col-span-2">
           <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
              <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
                 <div>
                    <h2 className="text-2xl font-serif font-bold">Progress Report</h2>
                    <p className="text-slate-400 text-sm">{exams.find(e => e.id === selectedExamId)?.name}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-2xl font-bold text-green-400">{percentage.toFixed(1)}%</p>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Overall Aggregate</p>
                 </div>
              </div>
              
              <div className="p-8">
                 {/* Student Header */}
                 <div className="flex items-start gap-6 mb-8 border-b border-slate-100 pb-6">
                    <img src={selectedStudent?.avatarUrl} className="w-20 h-20 rounded-lg object-cover border-2 border-slate-100 shadow-sm" alt="Student" />
                    <div className="grid grid-cols-2 gap-x-12 gap-y-2 w-full">
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Student Name</p>
                            <p className="font-bold text-slate-800">{selectedStudent?.fullName}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Roll Number</p>
                            <p className="font-bold text-slate-800">{selectedStudent?.rollNumber}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Class</p>
                            <p className="font-bold text-slate-800">{selectedStudent?.className} - {selectedStudent?.section}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Guardian</p>
                            <p className="font-bold text-slate-800">{selectedStudent?.guardianName}</p>
                        </div>
                    </div>
                 </div>

                 {/* Marks Table */}
                 <table className="w-full mb-8">
                    <thead>
                        <tr className="border-b-2 border-slate-100">
                            <th className="text-left py-3 text-sm font-bold text-slate-600">Subject</th>
                            <th className="text-center py-3 text-sm font-bold text-slate-600">Marks Obtained</th>
                            <th className="text-center py-3 text-sm font-bold text-slate-600">Max Marks</th>
                            <th className="text-center py-3 text-sm font-bold text-slate-600">Grade</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {reportMarks.map((mark) => {
                            const subject = subjects.find(s => s.id === mark.subjectId);
                            return (
                                <tr key={mark.subjectId}>
                                    <td className="py-3 text-slate-700 font-medium">{subject?.name}</td>
                                    <td className="py-3 text-center text-slate-700">{mark.total}</td>
                                    <td className="py-3 text-center text-slate-500">{subject?.maxMarks}</td>
                                    <td className="py-3 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${mark.grade === 'F' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                                            {mark.grade}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                 </table>

                 {/* AI Remarks Section */}
                 <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 relative group">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                           Teacher's Remarks
                           {generating && <Loader2 className="animate-spin text-blue-500" size={16} />}
                        </h4>
                        <button 
                            onClick={handleGenerateRemark}
                            className="text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-blue-50 transition-colors shadow-sm"
                        >
                            <Wand2 size={12} />
                            Generate with AI
                        </button>
                    </div>
                    
                    {aiRemark ? (
                        <p className="text-slate-600 italic leading-relaxed">"{aiRemark}"</p>
                    ) : (
                        <p className="text-slate-400 text-sm italic">Click 'Generate with AI' to create a personalized remark based on the student's performance.</p>
                    )}
                 </div>
                 
                 <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                    <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg transition-colors">
                        <Download size={18} />
                        Download PDF
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
