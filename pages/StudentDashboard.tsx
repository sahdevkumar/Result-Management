
import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Student, MarkRecord, Exam, Subject, NonAcademicRecord } from '../types';
import { 
  User, BookOpen, Calendar, ShieldCheck, 
  Trophy, TrendingUp, Camera, Loader2,
  Award, Activity, History, ChevronDown, ChevronUp,
  MessageSquareQuote, UserCheck, Star, UserPen, Key, X, Save,
  Fingerprint, Heart, Image as ImageIcon, Trash2
} from 'lucide-react';
import { useToast } from '../components/ToastContext';
import clsx from 'clsx';

export const StudentDashboard: React.FC<{ studentId: string }> = ({ studentId }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [history, setHistory] = useState<MarkRecord[]>([]);
  const [nonAcademicHistory, setNonAcademicHistory] = useState<NonAcademicRecord[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedExams, setExpandedExams] = useState<Set<string>>(new Set());

  // Profile Update State
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({ 
    fullName: '', 
    contactNumber: '', 
    dateOfBirth: '', 
    guardianName: '',
    avatarUrl: ''
  });
  
  const { showToast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, [studentId]);

  const loadDashboardData = async () => {
    try {
      const [s, h, nah, e, sub] = await Promise.all([
        DataService.getStudentById(studentId),
        DataService.getStudentHistory(studentId),
        DataService.getStudentNonAcademicHistory(studentId),
        DataService.getExams(),
        DataService.getSubjects()
      ]);
      setStudent(s);
      setHistory(h);
      setNonAcademicHistory(nah);
      setExams(e);
      setSubjects(sub);
      
      if (s) {
        setEditFormData({ 
            fullName: s.fullName, 
            contactNumber: s.contactNumber, 
            dateOfBirth: s.dateOfBirth || '',
            guardianName: s.guardianName || '',
            avatarUrl: s.avatarUrl || ''
        });
      }

      if (e.length > 0 && expandedExams.size === 0) {
          setExpandedExams(new Set([e[e.length - 1].id]));
      }
    } catch (err) {
      showToast("Error loading profile data", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (examId: string) => {
    const next = new Set(expandedExams);
    if (next.has(examId)) next.delete(examId);
    else next.add(examId);
    setExpandedExams(next);
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    try {
        const isValid = await DataService.validateStudentToken(tokenInput);
        if (isValid) {
            setShowTokenModal(false);
            setShowEditModal(true);
            setTokenInput('');
            showToast("Identity Verified", "success");
        } else {
            showToast("Invalid security token. Please try again.", "error");
        }
    } catch (err) {
        showToast("Validation service unavailable", "error");
    } finally {
        setIsValidating(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setIsSaving(true);
    try {
        await DataService.updateStudent({
            ...student,
            fullName: editFormData.fullName,
            contactNumber: editFormData.contactNumber,
            dateOfBirth: editFormData.dateOfBirth,
            guardianName: editFormData.guardianName,
            avatarUrl: editFormData.avatarUrl
        });
        await loadDashboardData();
        setShowEditModal(false);
        showToast("Profile updated successfully!", "success");
    } catch (err) {
        showToast("Failed to save changes", "error");
    } finally {
        setIsSaving(false);
    }
  };

  const handleModalAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
        const url = await DataService.uploadFile(file, 'students');
        setEditFormData(prev => ({ ...prev, avatarUrl: url }));
        showToast("Photo uploaded to storage.", "success");
    } catch (err) {
        showToast("Upload failed", "error");
    } finally {
        setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Decrypting Academic Records...</p>
      </div>
    );
  }

  if (!student) return <div className="p-20 text-center text-slate-500 font-bold">Student record not found in system.</div>;

  const totalExams = [...new Set(history.map(h => h.examId))].length;
  const avgPercentage = history.length > 0 
    ? (history.reduce((acc, h) => acc + ((h.objMarks + h.subMarks) / (h.objMaxMarks + h.subMaxMarks) * 100), 0) / history.length).toFixed(1)
    : '0.0';

  const groupedHistory = exams.filter(e => history.some(h => h.examId === e.id)).map(exam => {
      const examMarks = history.filter(h => h.examId === exam.id);
      const nonAcad = nonAcademicHistory.find(nah => nah.examId === exam.id);
      const totalObtained = examMarks.reduce((a, b) => a + (b.objMarks + b.subMarks), 0);
      const totalMax = examMarks.reduce((a, b) => a + (b.objMaxMarks + b.subMaxMarks), 0);
      return {
          exam,
          marks: examMarks,
          nonAcademic: nonAcad,
          totalObtained,
          totalMax,
          percentage: totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : '0.0'
      };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 md:p-12 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-600/10 transition-colors duration-700"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
              <div className="relative group/avatar">
                  <div className="w-32 h-32 md:w-44 md:h-44 rounded-[40px] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl relative">
                      <img src={student.avatarUrl} alt={student.fullName} className="w-full h-full object-cover transition-transform duration-700" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-2xl shadow-lg border-4 border-white dark:border-slate-900">
                      <ShieldCheck size={20} />
                  </div>
              </div>

              <div className="flex-1 text-center md:text-left space-y-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{student.fullName}</h1>
                          <p className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest text-xs mt-2 flex items-center justify-center md:justify-start gap-2">
                            <Award size={14} /> Distinguished Academic Profile
                          </p>
                      </div>
                      <button 
                        onClick={() => setShowTokenModal(true)}
                        className="self-center md:self-start flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all shadow-sm group/edit font-black text-[10px] uppercase tracking-widest"
                        title="Update Profile Settings"
                      >
                        <UserPen size={18} className="group-hover/edit:scale-110 transition-transform" />
                        Manage Profile
                      </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-4">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Roll ID</p>
                          <p className="text-sm font-bold text-slate-800 dark:text-white font-mono">{student.rollNumber}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Standard</p>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">{student.className} - {student.section}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Parents Name</p>
                          <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{student.guardianName || 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Birth Date</p>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">{student.dateOfBirth || 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl col-span-2 md:col-span-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                              <Activity size={12} /> Active
                          </span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Security Token Modal */}
      {showTokenModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                      <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                        <Fingerprint size={20} className="text-indigo-600" /> Security Check
                      </h3>
                      <button onClick={() => setShowTokenModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                  </div>
                  <form onSubmit={handleTokenSubmit} className="p-8 space-y-6">
                      <div className="text-center space-y-2">
                          <p className="text-sm text-slate-500 dark:text-slate-400">Enter your 6-digit identity token to modify profile settings.</p>
                          <p className="text-[10px] font-bold text-indigo-500/50 uppercase tracking-widest italic">(Default: 123456)</p>
                      </div>
                      <div className="relative group">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                          <input 
                            type="password" 
                            autoFocus
                            placeholder="••••••"
                            className="w-full pl-12 pr-4 py-4 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-center text-xl font-black tracking-[0.5em] focus:ring-4 focus:ring-indigo-500/20 outline-none"
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                            maxLength={6}
                            required
                          />
                      </div>
                      <button 
                        type="submit" 
                        disabled={isValidating || tokenInput.length < 6}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      >
                          {isValidating ? <Loader2 className="animate-spin" size={18} /> : 'Validate Token'}
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* Profile Edit Modal */}
      {showEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
                  <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
                      <div>
                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-xl">Update Profile</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Identity Record</p>
                      </div>
                      <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm"><X size={24} /></button>
                  </div>
                  
                  <form onSubmit={handleProfileUpdate} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                      {/* Photo Section in Modal */}
                      <div className="flex flex-col items-center gap-4 py-4 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800">
                          <div className="relative group/modal-avatar">
                              <div className="w-24 h-24 rounded-[30px] overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl relative">
                                  {isUploading && (
                                      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-20 flex items-center justify-center">
                                          <Loader2 className="animate-spin text-white" size={24} />
                                      </div>
                                  )}
                                  <img src={editFormData.avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/modal-avatar:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white z-10">
                                      <Camera size={18} className="mb-0.5" />
                                      <span className="text-[8px] font-black uppercase tracking-widest">Update</span>
                                      <input type="file" accept="image/*" className="hidden" onChange={handleModalAvatarUpload} disabled={isUploading} />
                                  </label>
                              </div>
                              {isUploading && (
                                  <div className="absolute -top-1 -right-1 bg-indigo-600 text-white p-1 rounded-lg animate-bounce">
                                      <ImageIcon size={12} />
                                  </div>
                              )}
                          </div>
                          <div className="text-center">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Profile Photo</p>
                              <p className="text-[9px] text-slate-400 italic">PNG/JPG recommended (max 2MB)</p>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <div className="space-y-1.5">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                              <div className="relative">
                                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                  <input 
                                    type="text" 
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10"
                                    value={editFormData.fullName}
                                    onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
                                  />
                              </div>
                          </div>
                          
                          <div className="space-y-1.5">
                              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Parent / Guardian Name</label>
                              <div className="relative">
                                  <Heart className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                  <input 
                                    type="text" 
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10"
                                    value={editFormData.guardianName}
                                    onChange={(e) => setEditFormData({...editFormData, guardianName: e.target.value})}
                                    placeholder="Enter Parent's Name"
                                  />
                              </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Number</label>
                                  <input 
                                    type="tel" 
                                    required
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10"
                                    value={editFormData.contactNumber}
                                    onChange={(e) => setEditFormData({...editFormData, contactNumber: e.target.value})}
                                  />
                              </div>
                              <div className="space-y-1.5">
                                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                                  <input 
                                    type="date" 
                                    required
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10"
                                    value={editFormData.dateOfBirth}
                                    onChange={(e) => setEditFormData({...editFormData, dateOfBirth: e.target.value})}
                                  />
                              </div>
                          </div>
                      </div>
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
                          <button 
                            type="button" 
                            onClick={() => setShowEditModal(false)}
                            className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200"
                          >
                              Cancel
                          </button>
                          <button 
                            type="submit" 
                            disabled={isSaving || isUploading}
                            className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-50"
                          >
                              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Save Changes
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-between group">
              <div>
                  <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Cumulative Avg.</p>
                  <h3 className="text-4xl font-black">{avgPercentage}%</h3>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform">
                  <TrendingUp size={32} />
              </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between group">
              <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Terms Completed</p>
                  <h3 className="text-4xl font-black text-slate-800 dark:text-white">{totalExams}</h3>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:scale-110 transition-transform">
                  <BookOpen size={32} className="text-indigo-500" />
              </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between group">
              <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Academic Year</p>
                  <h3 className="text-4xl font-black text-slate-800 dark:text-white">2024</h3>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:scale-110 transition-transform">
                  <Calendar size={32} className="text-indigo-500" />
              </div>
          </div>
      </div>

      {/* Exam History Accordion */}
      <div className="space-y-6">
          <div className="flex items-center gap-3 ml-2">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <History size={20} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Detailed Performance History</h2>
          </div>

          <div className="space-y-4">
              {groupedHistory.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 p-20 rounded-[40px] text-center border border-dashed border-slate-300 dark:border-slate-700">
                      <p className="text-slate-400 font-bold">Historical data currently unavailable.</p>
                  </div>
              ) : (
                  groupedHistory.reverse().map((gh, idx) => {
                      const isExpanded = expandedExams.has(gh.exam.id);
                      return (
                        <div key={gh.exam.id} className={clsx(
                            "bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border transition-all duration-500 overflow-hidden",
                            isExpanded ? "border-indigo-200 dark:border-indigo-900 ring-4 ring-indigo-50 dark:ring-indigo-950/20" : "border-slate-200 dark:border-slate-800"
                        )}>
                            {/* Card Header (Clickable) */}
                            <button 
                                onClick={() => toggleExpand(gh.exam.id)}
                                className="w-full text-left p-6 md:px-10 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={clsx(
                                        "w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center font-black transition-all",
                                        isExpanded ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400"
                                    )}>
                                        {groupedHistory.length - idx}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-lg text-slate-800 dark:text-white">{gh.exam.name}</h4>
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{gh.exam.type} • {gh.exam.date}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="hidden sm:block text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregate</p>
                                        <p className="text-lg font-black text-slate-800 dark:text-white">{gh.percentage}%</p>
                                    </div>
                                    <div className={clsx(
                                        "p-2 rounded-xl transition-transform duration-300",
                                        isExpanded ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400" : "text-slate-400"
                                    )}>
                                        {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                    </div>
                                </div>
                            </button>

                            {/* Card Content (Expandable) */}
                            {isExpanded && (
                                <div className="animate-in slide-in-from-top-4 duration-500">
                                    <div className="p-4 md:p-8 space-y-8">
                                        {/* Marks Table */}
                                        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                                        <th className="px-6 py-4">Subject Assessment</th>
                                                        <th className="px-4 py-4 text-center">Obj.</th>
                                                        <th className="px-4 py-4 text-center">Subj.</th>
                                                        <th className="px-4 py-4 text-center">Obtained</th>
                                                        <th className="px-4 py-4 text-center">Maximum</th>
                                                        <th className="px-4 py-4 text-right">Grd</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                    {gh.marks.map((m, mIdx) => {
                                                        const sub = subjects.find(s => s.id === m.subjectId);
                                                        return (
                                                            <tr key={mIdx} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <p className="font-bold text-slate-700 dark:text-slate-300">{sub?.name || 'Unknown Subject'}</p>
                                                                    {m.remarks && (
                                                                        <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-indigo-500 dark:text-indigo-400 italic font-medium leading-relaxed">
                                                                            <MessageSquareQuote size={12} className="shrink-0 mt-0.5" />
                                                                            <span>{m.remarks}</span>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-4 text-center text-sm font-medium text-slate-400">{m.objMarks}</td>
                                                                <td className="px-4 py-4 text-center text-sm font-medium text-slate-400">{m.subMarks}</td>
                                                                <td className="px-4 py-4 text-center font-black text-slate-800 dark:text-white">{m.objMarks + m.subMarks}</td>
                                                                <td className="px-4 py-4 text-center text-sm font-bold text-slate-300">{m.objMaxMarks + m.subMaxMarks}</td>
                                                                <td className="px-4 py-4 text-right">
                                                                    <span className={clsx(
                                                                        "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase",
                                                                        m.grade === 'Fail' ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                                                                    )}>
                                                                        {m.grade}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Non-Academic / Behavioral Section */}
                                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-2 mb-6">
                                                <UserCheck size={18} className="text-indigo-600 dark:text-indigo-400" />
                                                <h5 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Behavior & Participation</h5>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {[
                                                    { label: 'Attendance', value: gh.nonAcademic?.attendance, icon: Calendar },
                                                    { label: 'Discipline', value: gh.nonAcademic?.discipline, icon: ShieldCheck },
                                                    { label: 'Communication', value: gh.nonAcademic?.communication, icon: MessageSquareQuote },
                                                    { label: 'Participation', value: gh.nonAcademic?.participation, icon: Star }
                                                ].map((trait, tIdx) => (
                                                    <div key={tIdx} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center shadow-sm">
                                                        <trait.icon size={16} className="text-slate-400 mb-2" />
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{trait.label}</p>
                                                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{trait.value || 'N/A'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                      );
                  })
              )}
          </div>
      </div>
    </div>
  );
};
