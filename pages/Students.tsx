
import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Student, StudentStatus, SchoolClass } from '../types';
import { Search, Plus, Filter, Trash2, X, RefreshCw, Pencil, Loader2, AlertTriangle, Upload, FileDown, FileSpreadsheet, GraduationCap, Eye, User, Phone, Shield, Calendar } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import clsx from 'clsx';

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [classFilter, setClassFilter] = useState<string>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ fullName: '', classId: '', contactNumber: '', guardianName: '', status: StudentStatus.Active, dateOfBirth: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importClassId, setImportClassId] = useState<string>('');
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  const { showToast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, cData] = await Promise.all([ DataService.getStudents(), DataService.getClasses() ]);
      setStudents(sData);
      setClasses(cData);
    } catch (err) { showToast("Failed to load student data", 'error'); } finally { setLoading(false); }
  };

  const handleAddNew = () => { setFormData({ fullName: '', classId: classes[0]?.id || '', contactNumber: '', guardianName: '', status: StudentStatus.Active, dateOfBirth: '' }); setEditingId(null); setShowModal(true); };
  const handleEdit = (student: Student) => { const cls = classes.find(c => c.className === student.className && c.section === student.section); setFormData({ fullName: student.fullName, classId: cls ? cls.id : '', contactNumber: student.contactNumber, guardianName: student.guardianName, status: student.status, dateOfBirth: student.dateOfBirth || '' }); setEditingId(student.id); setShowModal(true); };
  const handleDeleteClick = (student: Student) => { setStudentToDelete({ id: student.id, name: student.fullName }); setShowDeleteModal(true); };
  
  const confirmDelete = async () => {
      if (!studentToDelete) return;
      setIsDeleting(true);
      try { await DataService.deleteStudent(studentToDelete.id); showToast("Student deleted successfully", 'success'); setStudents(prev => prev.filter(s => s.id !== studentToDelete.id)); } catch(e: any) { showToast(e.message || "Failed to delete student", 'error'); await loadData(); } finally { setIsDeleting(false); setShowDeleteModal(false); setStudentToDelete(null); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const selectedClass = classes.find(c => c.id === formData.classId);
      const commonData = { fullName: formData.fullName, className: selectedClass?.className || '', section: selectedClass?.section || '', contactNumber: formData.contactNumber, guardianName: formData.guardianName, status: formData.status, avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName)}&background=random`, dateOfBirth: formData.dateOfBirth };
      if (editingId) {
          const currentStudent = students.find(s => s.id === editingId);
          if (currentStudent) { await DataService.updateStudent({ id: editingId, rollNumber: currentStudent.rollNumber, ...commonData }); showToast("Student updated successfully", 'success'); }
      } else { await DataService.addStudent(commonData); showToast("Student added successfully", 'success'); }
      await loadData(); setShowModal(false);
    } catch (err) { showToast(editingId ? "Failed to update student." : "Failed to add student.", 'error'); } finally { setIsSubmitting(false); }
  };

  const handleDownloadSample = () => {
    const targetClass = classes.find(c => c.id === importClassId);
    let csvContent = "";
    
    if (targetClass) {
        // Simplified format for specific class
        csvContent = "Full Name, Guardian Name, Contact Number, Date of Birth\n" +
                     "John Doe, Robert Doe, 9876543210, 2010-05-15\n" +
                     "Jane Smith, Michael Smith, 9876543211, 2011-08-20";
    } else {
        // Full format with class and section
        csvContent = "Full Name, Class, Section, Guardian Name, Contact Number, Date of Birth\n" +
                     "John Doe, Class 10, A, Robert Doe, 9876543210, 2010-05-15\n" +
                     "Jane Smith, Class 9, B, Michael Smith, 9876543211, 2011-08-20";
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", targetClass ? `sample_students_${targetClass.className.replace(/\s+/g, '_')}.csv` : "sample_students_all_classes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Sample CSV file generated and downloaded", "info");
  };

  const processCSV = async (text: string) => {
      setIsImporting(true);
      try {
          const lines = text.split('\n').map(l => l.trim()).filter(l => l);
          if (lines.length < 2) throw new Error("File is empty or missing data rows");
          const newStudents: Omit<Student, 'id' | 'rollNumber'>[] = [];
          const targetClass = classes.find(c => c.id === importClassId);
          for (let i = 1; i < lines.length; i++) {
              const cols = lines[i].split(',').map(c => c.trim());
              if (targetClass && cols.length >= 3) {
                  newStudents.push({ fullName: cols[0], className: targetClass.className, section: targetClass.section, guardianName: cols[1], contactNumber: cols[2], dateOfBirth: cols[3] || '', status: StudentStatus.Active, avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(cols[0])}&background=random` });
              } else if (cols.length >= 5) {
                  newStudents.push({ fullName: cols[0], className: cols[1], section: cols[2], guardianName: cols[3], contactNumber: cols[4], dateOfBirth: cols[5] || '', status: StudentStatus.Active, avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(cols[0])}&background=random` });
              }
          }
          if (newStudents.length === 0) throw new Error("No valid student records found in file");
          await DataService.bulkAddStudents(newStudents);
          showToast(`Successfully imported ${newStudents.length} students`, 'success');
          setShowImportModal(false); await loadData();
      } catch (e: any) { console.error(e); showToast(e.message || "Failed to import CSV", 'error'); } finally { setIsImporting(false); }
  };

  const filteredStudents = students.filter(s => (s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())) && (statusFilter === 'All' || s.status === statusFilter) && (classFilter === 'All' || `${s.className}-${s.section}` === classFilter));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Student Directory</h1><p className="text-slate-500 dark:text-slate-400 text-sm">Manage student profiles and enrollment status</p></div>
        <div className="flex gap-2"><button onClick={() => { setShowImportModal(true); setImportClassId(''); }} className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm"><Upload size={18} /><span className="hidden sm:inline">Import CSV</span></button><button onClick={handleAddNew} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-indigo-500/20"><Plus size={18} /><span>Add Student</span></button></div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm dark:shadow-none border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="relative flex-1 max-md:max-w-none max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search by name or roll number..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          <div className="flex gap-2"><button onClick={() => setShowFilter(!showFilter)} className={clsx("flex items-center gap-2 px-3 py-2.5 border rounded-xl text-sm transition-all", showFilter ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400" : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800")}><Filter size={16} /><span>Advanced Filter</span></button></div>
        </div>

        {showFilter && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-6 animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-1.5"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Profile</label><select className="text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="All">All Statuses</option><option value={StudentStatus.Active}>Active Only</option><option value={StudentStatus.Inactive}>Inactive Only</option></select></div>
                <div className="space-y-1.5"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Class Assignment</label><div className="relative"><select className="text-sm border border-slate-300 dark:border-slate-600 rounded-xl pl-8 pr-4 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}><option value="All">All Classes</option>{classes.map(c => (<option key={c.id} value={`${c.className}-${c.section}`}>{c.className} - {c.section}</option>))}</select><div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"><GraduationCap size={14} /></div></div></div>
                <div className="flex items-end"><button onClick={() => { setStatusFilter('All'); setClassFilter('All'); setSearchTerm(''); }} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors py-2">Reset All Filters</button></div>
            </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold tracking-wider border-b border-slate-200 dark:border-slate-700"><th className="px-6 py-4">Student Info</th><th className="px-6 py-4">Roll ID</th><th className="px-6 py-4">Class</th><th className="px-6 py-4">Guardian</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? ( <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">Loading student data...</td></tr> ) : filteredStudents.length === 0 ? ( <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"><div className="flex flex-col items-center gap-2"><Search className="text-slate-300 dark:text-slate-600" size={40} /><p className="font-medium">No students match your criteria.</p><button onClick={() => { setStatusFilter('All'); setClassFilter('All'); setSearchTerm(''); }} className="text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline">Clear all filters</button></div></td></tr> ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group">
                    <td className="px-6 py-3"><div className="flex items-center gap-3"><img src={student.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" /><div><p className="font-medium text-slate-900 dark:text-slate-200">{student.fullName}</p><p className="text-xs text-slate-500 dark:text-slate-400">{student.contactNumber}</p></div></div></td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-300 font-mono">{student.rollNumber}</td>
                    <td className="px-6 py-3"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded">{student.className}-{student.section}</span></td>
                    <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-300">{student.guardianName}</td>
                    <td className="px-6 py-3"><span className={clsx("px-2.5 py-1 rounded-full text-xs font-medium", student.status === StudentStatus.Active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400")}>{student.status}</span></td>
                    <td className="px-6 py-3 text-right"><div className="flex justify-end gap-2"><button onClick={() => setPreviewStudent(student)} title="Profile Preview" className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"><Eye size={18} /></button><button onClick={() => handleEdit(student)} title="Edit Student" className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"><Pencil size={18} /></button><button onClick={() => handleDeleteClick(student)} title="Delete Student" className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"><Trash2 size={18} /></button></div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {previewStudent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-indigo-950/40 dark:bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
               <div className="relative h-32 bg-gradient-to-br from-indigo-500 to-violet-600">
                  <button onClick={() => setPreviewStudent(null)} className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full transition-colors"><X size={20} /></button>
                  <div className="absolute -bottom-12 left-8 p-1 bg-white dark:bg-slate-800 rounded-3xl shadow-xl"><img src={previewStudent.avatarUrl} alt="" className="w-24 h-24 rounded-[22px] object-cover" /></div>
               </div>
               <div className="pt-16 pb-8 px-8 space-y-6">
                  <div><h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{previewStudent.fullName}</h3><div className="flex items-center gap-2 mt-1"><span className="text-xs font-black text-indigo-500 dark:text-indigo-300 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">Roll: {previewStudent.rollNumber}</span><span className={clsx("text-[10px] font-black uppercase px-2 py-0.5 rounded-md", previewStudent.status === StudentStatus.Active ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400")}>{previewStudent.status}</span></div></div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700"><div className="flex items-center gap-2 text-slate-400 mb-1"><GraduationCap size={14} /><span className="text-[10px] font-black uppercase tracking-widest">Class</span></div><p className="font-bold text-slate-800 dark:text-slate-200">{previewStudent.className} - {previewStudent.section}</p></div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700"><div className="flex items-center gap-2 text-slate-400 mb-1"><Phone size={14} /><span className="text-[10px] font-black uppercase tracking-widest">Contact</span></div><p className="font-bold text-slate-800 dark:text-slate-200 truncate" title={previewStudent.contactNumber}>{previewStudent.contactNumber || 'N/A'}</p></div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700"><div className="flex items-center gap-2 text-slate-400 mb-1"><Calendar size={14} /><span className="text-[10px] font-black uppercase tracking-widest">Date of Birth</span></div><p className="font-bold text-slate-800 dark:text-slate-200 truncate" title={previewStudent.dateOfBirth}>{previewStudent.dateOfBirth || 'N/A'}</p></div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700"><div className="flex items-center gap-2 text-slate-400 mb-1"><User size={14} /><span className="text-[10px] font-black uppercase tracking-widest">Guardian</span></div><p className="font-bold text-slate-800 dark:text-slate-200 truncate">{previewStudent.guardianName}</p></div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800"><button onClick={() => setPreviewStudent(null)} className="w-full py-3.5 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black dark:hover:bg-slate-700 transition-all shadow-lg shadow-slate-200 dark:shadow-none">Dismiss Preview</button></div>
               </div>
           </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">{editingId ? 'Edit Student' : 'Add New Student'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label><input type="text" name="fullName" required placeholder="e.g. John Doe" className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white" value={formData.fullName} onChange={handleInputChange} /></div>
                 <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Class</label><select name="classId" required className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white" value={formData.classId} onChange={handleInputChange}><option value="" disabled>Select Class</option>{classes.map(c => (<option key={c.id} value={c.id}>{c.className} - {c.section}</option>))}</select></div>
                 <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mobile Number</label><input type="tel" name="contactNumber" placeholder="e.g. 9876543210" className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white" value={formData.contactNumber} onChange={handleInputChange} /></div>
                 <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date of Birth</label><input type="date" name="dateOfBirth" className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white" value={formData.dateOfBirth} onChange={handleInputChange} /></div>
                 <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Guardian Name</label><input type="text" name="guardianName" placeholder="e.g. Jane Doe" className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white" value={formData.guardianName} onChange={handleInputChange} /></div>
                 <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label><select name="status" className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white" value={formData.status} onChange={handleInputChange}><option value={StudentStatus.Active}>Active</option><option value={StudentStatus.Inactive}>Inactive</option><option value={StudentStatus.Suspended}>Suspended</option></select></div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-3"><button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button><button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50">{isSubmitting ? 'Saving...' : (editingId ? 'Update Student' : 'Add Student')}</button></div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
               <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                   <div className="flex items-center gap-3"><div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-600 dark:text-green-400"><FileSpreadsheet size={24} /></div><div><h3 className="font-bold text-lg text-slate-800 dark:text-white">Bulk Import Students</h3><p className="text-xs text-slate-500 dark:text-slate-400">Upload CSV file to import student records</p></div></div>
                   <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X size={24} /></button>
               </div>
               <div className="p-6 space-y-6">
                   <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Target Class (Optional)</label><select className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white" value={importClassId} onChange={(e) => setImportClassId(e.target.value)}><option value="">Select a class to enable simplified import...</option>{classes.map(c => (<option key={c.id} value={c.id}>{c.className} - {c.section}</option>))}</select><p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">If selected, the CSV only needs Name, Guardian, Contact, and DOB fields.</p></div>
                   <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4"><h4 className="text-sm font-bold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2"><AlertTriangle size={16} /> Instructions</h4><ul className="list-disc list-inside text-xs text-indigo-700 dark:text-indigo-400 space-y-1"><li>File must be in <strong>.CSV</strong> format.</li><li>Required columns: {importClassId ? <strong>Full Name, Guardian Name, Contact Number, Date of Birth</strong> : <strong>Full Name, Class, Section, Guardian Name, Contact Number, Date of Birth</strong>}</li>{!importClassId && <li>Class and Section must match exactly with existing classes in the system.</li>}<li>Roll numbers will be auto-generated.</li><li>Date format should be YYYY-MM-DD.</li></ul><button onClick={handleDownloadSample} className="mt-3 flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 hover:underline"><FileDown size={14} /> Download Sample CSV</button></div>
                   <div><label className="block w-full cursor-pointer group"><div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-indigo-400 transition-all">{isImporting ? (<div className="flex flex-col items-center gap-2"><Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} /><span className="text-sm font-medium text-slate-500 dark:text-slate-400">Processing file...</span></div>) : (<><div className="p-3 bg-white dark:bg-slate-700 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform"><Upload className="text-slate-400 dark:text-slate-300 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" size={24} /></div><p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Click to upload or drag & drop</p><p className="text-xs text-slate-400 dark:text-slate-500">CSV files only</p></>)}</div><input type="file" accept=".csv" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if(file) { const reader = new FileReader(); reader.onload = (ev) => processCSV(ev.target?.result as string); reader.readAsText(file); e.target.value = ''; } }} disabled={isImporting} /></label></div>
               </div>
           </div>
        </div>
      )}

      {showDeleteModal && studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
              <div className="p-6 text-center"><div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="text-red-600 dark:text-red-400" size={24} /></div><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Student?</h3><p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Are you sure you want to delete <strong>{studentToDelete.name}</strong>? This action cannot be undone and will delete all associated marks.</p><div className="flex gap-3"><button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">Cancel</button><button onClick={confirmDelete} disabled={isDeleting} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">{isDeleting && <Loader2 size={16} className="animate-spin" />}{isDeleting ? 'Deleting...' : 'Delete'}</button></div></div>
           </div>
        </div>
      )}
    </div>
  );
};
