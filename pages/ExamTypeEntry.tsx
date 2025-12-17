import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { ExamType } from '../types';
import { Bookmark, Plus, Trash2, Pencil, X, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '../components/ToastContext';

export const ExamTypeEntry: React.FC = () => {
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add/Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    loadExamTypes();
  }, []);

  const loadExamTypes = async () => {
    try {
      const data = await DataService.getExamTypes();
      setExamTypes(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load exam types", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (type: ExamType) => {
      setTypeToDelete({ id: type.id, name: type.name });
      setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
      if (!typeToDelete) return;
      setIsDeleting(true);
      try {
          await DataService.deleteExamType(typeToDelete.id);
          showToast("Exam type deleted successfully", 'success');
          loadExamTypes();
      } catch(e) {
          showToast("Failed to delete exam type", 'error');
      } finally {
          setIsDeleting(false);
          setShowDeleteModal(false);
          setTypeToDelete(null);
      }
  };

  const handleEdit = (type: ExamType) => {
      setFormData({
          name: type.name,
          description: type.description
      });
      setEditingId(type.id);
      setShowModal(true);
  };

  const handleOpenAdd = () => {
      setFormData({ name: '', description: '' });
      setEditingId(null);
      setShowModal(true);
  };

  const handleCloseModal = () => {
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', description: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
          // Update existing type
          await DataService.updateExamType({
              id: editingId,
              ...formData
          });
          showToast("Exam type updated successfully", 'success');
      } else {
          // Add new type
          await DataService.addExamType(formData);
          showToast("Exam type added successfully", 'success');
      }
      
      handleCloseModal();
      loadExamTypes();
    } catch (err: any) {
      if (err.code === 'PGRST205') {
          showToast("Database Error: Table 'exam_types' not found. Please run the SQL commands in schema.sql", 'error');
      } else {
          showToast(editingId ? "Failed to update exam type" : "Failed to add exam type", 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Exam Types</h1>
          <p className="text-slate-500 text-sm">Configure available exam categories (e.g., Unit Test, Final)</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Add Exam Type</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
             <div className="col-span-full py-12 text-center text-slate-500">Loading exam types...</div>
        ) : examTypes.length === 0 ? (
             <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 flex flex-col items-center gap-2">
                <AlertTriangle className="text-amber-500" size={32} />
                <p>No exam types found or table missing.</p>
                <p className="text-xs">Please run the SQL commands in <code>schema.sql</code> to initialize the database.</p>
             </div>
        ) : (
            examTypes.map(type => (
                <div key={type.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center hover:shadow-md transition-shadow group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <Bookmark size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">{type.name}</h3>
                            {type.description && <p className="text-sm text-slate-500">{type.description}</p>}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleEdit(type)} 
                            className="text-slate-300 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                        >
                            <Pencil size={20} />
                        </button>
                        <button 
                            onClick={() => handleDeleteClick(type)} 
                            className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">{editingId ? 'Edit Exam Type' : 'Add Exam Type'}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Unit Test"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g., Monthly assessment"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                  {editingId ? 'Update Exam Type' : 'Save Exam Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && typeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                 <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="text-red-600" size={24} />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Exam Type?</h3>
                 <p className="text-slate-500 text-sm mb-6">
                    Are you sure you want to delete <strong>{typeToDelete.name}</strong>?
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