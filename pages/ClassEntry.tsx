
import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { SchoolClass } from '../types';
import { LayoutTemplate, Plus, Trash2, Pencil, X, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '../components/ToastContext';

export const ClassEntry: React.FC = () => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add/Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    className: '',
    section: ''
  });

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState<{id: string, className: string, section: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await DataService.getClasses();
      setClasses(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load classes", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (cls: SchoolClass) => {
      setClassToDelete({ id: cls.id, className: cls.className, section: cls.section });
      setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
      if (!classToDelete) return;
      setIsDeleting(true);
      try {
          await DataService.deleteClass(classToDelete.id);
          showToast("Class deleted successfully", 'success');
          loadClasses();
      } catch(e) {
          showToast("Failed to delete class", 'error');
      } finally {
          setIsDeleting(false);
          setShowDeleteModal(false);
          setClassToDelete(null);
      }
  };

  const handleEdit = (cls: SchoolClass) => {
      setFormData({
          className: cls.className,
          section: cls.section
      });
      setEditingId(cls.id);
      setShowModal(true);
  };

  const handleOpenAdd = () => {
      setFormData({ className: '', section: '' });
      setEditingId(null);
      setShowModal(true);
  };

  const handleCloseModal = () => {
      setShowModal(false);
      setEditingId(null);
      setFormData({ className: '', section: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
          // Update existing class
          await DataService.updateClass({
              id: editingId,
              ...formData
          });
          showToast("Class updated successfully", 'success');
      } else {
          // Add new class
          await DataService.addClass(formData);
          showToast("Class added successfully", 'success');
      }
      
      handleCloseModal();
      loadClasses();
    } catch (err) {
      showToast(editingId ? "Failed to update class" : "Failed to create class", 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Class Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage class levels and sections</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Add Class</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
             <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400">Loading classes...</div>
        ) : classes.length === 0 ? (
             <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">No classes found.</div>
        ) : (
            classes.map(cls => (
                <div key={cls.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center hover:shadow-md transition-shadow group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <LayoutTemplate size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{cls.className}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Section: {cls.section}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleEdit(cls)} 
                            className="text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors"
                            title="Edit"
                        >
                            <Pencil size={20} />
                        </button>
                        <button 
                            onClick={() => handleDeleteClick(cls)} 
                            className="text-slate-300 hover:text-red-500 dark:hover:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">{editingId ? 'Edit Class' : 'Add New Class'}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Class Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Class 10"
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  value={formData.className}
                  onChange={(e) => setFormData({...formData, className: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Section</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., A"
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  value={formData.section}
                  onChange={(e) => setFormData({...formData, section: e.target.value})}
                />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                  {editingId ? 'Update Class' : 'Save Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && classToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
              <div className="p-6 text-center">
                 <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Class?</h3>
                 <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                    Are you sure you want to delete <strong>{classToDelete.className} - {classToDelete.section}</strong>?
                 </p>
                 <div className="flex gap-3">
                    <button 
                       onClick={() => setShowDeleteModal(false)}
                       disabled={isDeleting}
                       className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                       Cancel
                    </button>
                    <button 
                       onClick={confirmDelete}
                       disabled={isDeleting}
                       className="flex-1 bg-red-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
