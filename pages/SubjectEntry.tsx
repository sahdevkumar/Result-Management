import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Subject } from '../types';
import { BookCopy, Plus, Trash2, Pencil, X, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '../components/ToastContext';

export const SubjectEntry: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add/Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    maxMarks: 100,
    passMarks: 40
  });

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const data = await DataService.getSubjects();
      setSubjects(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load subjects", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (subject: Subject) => {
      setSubjectToDelete({ id: subject.id, name: subject.name });
      setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
      if (!subjectToDelete) return;
      setIsDeleting(true);
      try {
          await DataService.deleteSubject(subjectToDelete.id);
          showToast("Subject deleted successfully", 'success');
          loadSubjects();
      } catch(e) {
          showToast("Failed to delete subject", 'error');
      } finally {
          setIsDeleting(false);
          setShowDeleteModal(false);
          setSubjectToDelete(null);
      }
  };

  const handleEdit = (subject: Subject) => {
      setFormData({
          name: subject.name,
          code: subject.code,
          maxMarks: subject.maxMarks,
          passMarks: subject.passMarks
      });
      setEditingId(subject.id);
      setShowModal(true);
  };

  const handleOpenAdd = () => {
      setFormData({ name: '', code: '', maxMarks: 100, passMarks: 40 });
      setEditingId(null);
      setShowModal(true);
  };

  const handleCloseModal = () => {
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', code: '', maxMarks: 100, passMarks: 40 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
          // Update existing subject
          await DataService.updateSubject({
              id: editingId,
              ...formData
          });
          showToast("Subject updated successfully", 'success');
      } else {
          // Add new subject
          await DataService.addSubject(formData);
          showToast("Subject added successfully", 'success');
      }
      
      handleCloseModal();
      loadSubjects();
    } catch (err) {
      showToast(editingId ? "Failed to update subject" : "Failed to create subject", 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Subject Management</h1>
          <p className="text-slate-500 text-sm">Define subjects and marking schemes</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Add Subject</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-bold tracking-wider border-b border-slate-200">
                        <th className="px-6 py-4">Subject Name</th>
                        <th className="px-6 py-4">Code</th>
                        <th className="px-6 py-4">Max Marks</th>
                        <th className="px-6 py-4">Pass Marks</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                         <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading subjects...</td></tr>
                    ) : subjects.length === 0 ? (
                         <tr><td colSpan={5} className="p-8 text-center text-slate-500">No subjects defined.</td></tr>
                    ) : (
                        subjects.map(sub => (
                            <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-3 font-medium text-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                            <BookCopy size={16} />
                                        </div>
                                        {sub.name}
                                    </div>
                                </td>
                                <td className="px-6 py-3 text-slate-600 font-mono text-sm">{sub.code}</td>
                                <td className="px-6 py-3 text-slate-600">{sub.maxMarks}</td>
                                <td className="px-6 py-3 text-slate-600">{sub.passMarks}</td>
                                <td className="px-6 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => handleEdit(sub)} 
                                            className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteClick(sub)} 
                                            className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">{editingId ? 'Edit Subject' : 'Add New Subject'}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Mathematics"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject Code</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., MTH101"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Marks</label>
                    <input 
                      type="number" 
                      required
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={formData.maxMarks}
                      onChange={(e) => setFormData({...formData, maxMarks: parseInt(e.target.value)})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pass Marks</label>
                    <input 
                      type="number" 
                      required
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={formData.passMarks}
                      onChange={(e) => setFormData({...formData, passMarks: parseInt(e.target.value)})}
                    />
                 </div>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                  {editingId ? 'Update Subject' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && subjectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                 <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="text-red-600" size={24} />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Subject?</h3>
                 <p className="text-slate-500 text-sm mb-6">
                    Are you sure you want to delete <strong>{subjectToDelete.name}</strong>? This will delete all marks associated with this subject.
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