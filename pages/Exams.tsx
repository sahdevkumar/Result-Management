import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Exam, ExamStatus, ExamType } from '../types';
import { Calendar, Plus, Book, Tag, Trash2, Pencil, X, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import clsx from 'clsx';

export const Exams: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    date: '',
    status: ExamStatus.Upcoming
  });

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [examToDelete, setExamToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [examsData, typesData] = await Promise.all([
          DataService.getExams(),
          DataService.getExamTypes()
      ]);
      setExams(examsData);
      setExamTypes(typesData);
      
      // Set default type if available and not editing
      if (!editingId && typesData.length > 0) {
          setFormData(prev => ({ ...prev, type: typesData[0].name }));
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load exam data", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (exam: Exam) => {
      setExamToDelete({ id: exam.id, name: exam.name });
      setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
      if (!examToDelete) return;
      setIsDeleting(true);
      try {
          await DataService.deleteExam(examToDelete.id);
          showToast("Exam deleted successfully", 'success');
          loadData();
      } catch(e) {
          showToast("Failed to delete exam", 'error');
      } finally {
          setIsDeleting(false);
          setShowDeleteModal(false);
          setExamToDelete(null);
      }
  };

  const handleEdit = (exam: Exam) => {
    setEditingId(exam.id);
    setFormData({
        name: exam.name,
        type: exam.type,
        date: exam.date,
        status: exam.status
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
        name: '',
        type: examTypes.length > 0 ? examTypes[0].name : '',
        date: '',
        status: ExamStatus.Upcoming
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
          // Update existing exam
          await DataService.updateExam({
              ...formData,
              id: editingId,
              subjects: [] // Not needed for update currently
          });
          showToast("Exam updated successfully", 'success');
      } else {
          // Create new exam
          await DataService.addExam(formData as any);
          showToast("Exam created successfully", 'success');
      }
      
      handleCloseModal();
      loadData();
    } catch (err) {
      showToast(editingId ? "Failed to update exam" : "Failed to create exam", 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Exam Management</h1>
          <p className="text-slate-500 text-sm">Schedule and manage examinations</p>
        </div>
        <button 
          onClick={() => {
              setEditingId(null);
              setFormData(prev => ({ 
                  ...prev, 
                  name: '', 
                  date: '',
                  type: examTypes.length > 0 ? examTypes[0].name : prev.type 
              }));
              setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Create New Exam</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <div className="col-span-full text-center py-12 text-slate-500">Loading exams...</div>
        ) : exams.length === 0 ? (
           <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
              No exams found. Create one to get started.
           </div>
        ) : (
          exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow relative">
              <div className="flex justify-between items-start mb-4">
                <div className={clsx(
                  "p-3 rounded-lg",
                  exam.status === ExamStatus.Completed ? "bg-green-100 text-green-600" :
                  exam.status === ExamStatus.Ongoing ? "bg-blue-100 text-blue-600" :
                  "bg-amber-100 text-amber-600"
                )}>
                  <Book size={24} />
                </div>
                <span className={clsx(
                  "px-3 py-1 rounded-full text-xs font-bold",
                  exam.status === ExamStatus.Completed ? "bg-green-50 text-green-700 border border-green-200" :
                  exam.status === ExamStatus.Ongoing ? "bg-blue-50 text-blue-700 border border-blue-200" :
                  "bg-amber-50 text-amber-700 border border-amber-200"
                )}>
                  {exam.status}
                </span>
              </div>
              
              <h3 className="font-bold text-lg text-slate-800 mb-2">{exam.name}</h3>
              
              <div className="space-y-2 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                   <Tag size={16} />
                   <span>Type: {exam.type}</span>
                </div>
                <div className="flex items-center gap-2">
                   <Calendar size={16} />
                   <span>Date: {exam.date || 'N/A'}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                 <button 
                    onClick={() => handleEdit(exam)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-medium transition-colors"
                 >
                    <Pencil size={16} />
                    Edit
                 </button>
                 <button 
                    onClick={() => handleDeleteClick(exam)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                 >
                    <Trash2 size={16} />
                    Delete
                 </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">
                  {editingId ? 'Edit Exam' : 'Create New Exam'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Exam Name</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  placeholder="e.g., Physics Unit Test 1"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Exam Type</label>
                <select 
                    name="type"
                    required
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                    value={formData.type}
                    onChange={handleInputChange}
                >
                    {examTypes.length > 0 ? (
                        examTypes.map(type => (
                            <option key={type.id} value={type.name}>{type.name}</option>
                        ))
                    ) : (
                        <option value="">No exam types defined</option>
                    )}
                </select>
                {examTypes.length === 0 && (
                     <p className="text-xs text-amber-600 mt-1">Please add exam types in Settings first.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input 
                  type="date" 
                  name="date"
                  required
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                  value={formData.date}
                  onChange={handleInputChange}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select 
                   name="status"
                   className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900"
                   value={formData.status}
                   onChange={handleInputChange}
                >
                   <option value={ExamStatus.Upcoming}>Upcoming</option>
                   <option value={ExamStatus.Ongoing}>Ongoing</option>
                   <option value={ExamStatus.Completed}>Completed</option>
                </select>
              </div>
              <div className="pt-4">
                <button type="submit" disabled={examTypes.length === 0} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed">
                  {editingId ? 'Update Exam' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && examToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                 <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="text-red-600" size={24} />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Exam?</h3>
                 <p className="text-slate-500 text-sm mb-6">
                    Are you sure you want to delete <strong>{examToDelete.name}</strong>? This will permanently delete the exam and all associated marks records.
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