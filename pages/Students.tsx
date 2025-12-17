import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Student, StudentStatus, SchoolClass } from '../types';
import { Search, Plus, Filter, Trash2, X, RefreshCw, Pencil, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import clsx from 'clsx';

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // Modal State for Add/Edit
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    classId: '',
    contactNumber: '',
    guardianName: '',
    status: StudentStatus.Active
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State for Delete Confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, cData] = await Promise.all([
        DataService.getStudents(),
        DataService.getClasses()
      ]);
      setStudents(sData);
      setClasses(cData);
    } catch (err) {
      console.error(err);
      showToast("Failed to load student data", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
      setFormData({
        fullName: '',
        classId: classes[0]?.id || '',
        contactNumber: '',
        guardianName: '',
        status: StudentStatus.Active
      });
      setEditingId(null);
      setShowModal(true);
  };

  const handleEdit = (student: Student) => {
      const cls = classes.find(c => c.className === student.className && c.section === student.section);
      setFormData({
        fullName: student.fullName,
        classId: cls ? cls.id : '',
        contactNumber: student.contactNumber,
        guardianName: student.guardianName,
        status: student.status
      });
      setEditingId(student.id);
      setShowModal(true);
  };

  const handleDeleteClick = (student: Student) => {
      setStudentToDelete({ id: student.id, name: student.fullName });
      setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
      if (!studentToDelete) return;
      
      setIsDeleting(true);
      try {
          await DataService.deleteStudent(studentToDelete.id);
          showToast("Student deleted successfully", 'success');
          // Optimistic update
          setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
      } catch(e: any) {
          console.error(e);
          showToast(e.message || "Failed to delete student", 'error');
          // Revert or reload if failed
          await loadData();
      } finally {
          setIsDeleting(false);
          setShowDeleteModal(false);
          setStudentToDelete(null);
      }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const selectedClass = classes.find(c => c.id === formData.classId);
      
      const commonData = {
        fullName: formData.fullName,
        className: selectedClass?.className || '',
        section: selectedClass?.section || '',
        contactNumber: formData.contactNumber,
        guardianName: formData.guardianName,
        status: formData.status,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName)}&background=random`
      };

      if (editingId) {
          // Edit mode
          const currentStudent = students.find(s => s.id === editingId);
          if (currentStudent) {
              await DataService.updateStudent({
                  id: editingId,
                  rollNumber: currentStudent.rollNumber,
                  ...commonData
              });
              showToast("Student updated successfully", 'success');
          }
      } else {
          // Add mode
          await DataService.addStudent(commonData);
          showToast("Student added successfully", 'success');
      }
      
      await loadData(); 
      setShowModal(false);
      
    } catch (err) {
      showToast(editingId ? "Failed to update student." : "Failed to add student.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Student Directory</h1>
          <p className="text-slate-500 text-sm">Manage student profiles and enrollment status</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-blue-500/20"
        >
          <Plus size={18} />
          <span>Add Student</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or roll number..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             <button 
                onClick={() => setShowFilter(!showFilter)}
                className={clsx(
                    "flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-slate-50",
                    showFilter ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-white border-slate-300 text-slate-600"
                )}
             >
                <Filter size={16} />
                <span>Filter</span>
             </button>
          </div>
        </div>

        {/* Extended Filter Panel */}
        {showFilter && (
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                    <select 
                        className="text-sm border border-slate-300 rounded p-1"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value={StudentStatus.Active}>Active</option>
                        <option value={StudentStatus.Inactive}>Inactive</option>
                    </select>
                </div>
            </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold tracking-wider">
                <th className="px-6 py-4">Student Info</th>
                <th className="px-6 py-4">Roll ID</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Guardian</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading student data...</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No students found.</td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <img src={student.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                        <div>
                          <p className="font-medium text-slate-900">{student.fullName}</p>
                          <p className="text-xs text-slate-500">{student.contactNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 font-mono">{student.rollNumber}</td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded">
                        {student.className}-{student.section}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">{student.guardianName}</td>
                    <td className="px-6 py-3">
                      <span className={clsx(
                        "px-2.5 py-1 rounded-full text-xs font-medium",
                        student.status === StudentStatus.Active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(student)}
                            title="Edit Student"
                            className="text-slate-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(student)}
                            title="Delete Student"
                            className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Student Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">{editingId ? 'Edit Student' : 'Add New Student'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      name="fullName"
                      required
                      placeholder="e.g. John Doe"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={formData.fullName}
                      onChange={handleInputChange}
                    />
                 </div>

                 <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
                    <select 
                      name="classId"
                      required
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                      value={formData.classId}
                      onChange={handleInputChange}
                    >
                      <option value="" disabled>Select Class</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.className} - {c.section}</option>
                      ))}
                    </select>
                 </div>

                 <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                    <input 
                      type="tel" 
                      name="contactNumber"
                      placeholder="e.g. 9876543210"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={formData.contactNumber}
                      onChange={handleInputChange}
                    />
                 </div>

                 <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Guardian Name</label>
                    <input 
                      type="text" 
                      name="guardianName"
                      placeholder="e.g. Jane Doe"
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={formData.guardianName}
                      onChange={handleInputChange}
                    />
                 </div>

                 <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select 
                        name="status"
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                        value={formData.status}
                        onChange={handleInputChange}
                    >
                        <option value={StudentStatus.Active}>Active</option>
                        <option value={StudentStatus.Inactive}>Inactive</option>
                        <option value={StudentStatus.Suspended}>Suspended</option>
                    </select>
                 </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : (editingId ? 'Update Student' : 'Add Student')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                 <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="text-red-600" size={24} />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Student?</h3>
                 <p className="text-slate-500 text-sm mb-6">
                    Are you sure you want to delete <strong>{studentToDelete.name}</strong>? This action cannot be undone and will delete all associated marks.
                 </p>
                 <div className="flex gap-3">
                    <button 
                       onClick={() => setShowDeleteModal(false)}
                       disabled={isDeleting}
                       className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                       Cancel
                    </button>
                    <button 
                       onClick={confirmDelete}
                       disabled={isDeleting}
                       className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                       {isDeleting && <Loader2 size={16} className="animate-spin" />}
                       {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};