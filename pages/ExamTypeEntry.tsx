import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { ExamType } from '../types';
import { Bookmark, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '../components/ToastContext';

export const ExamTypeEntry: React.FC = () => {
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
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

  const handleDelete = async (id: string) => {
      if(window.confirm("Are you sure you want to delete this exam type?")) {
          try {
              await DataService.deleteExamType(id);
              showToast("Exam type deleted successfully", 'success');
              loadExamTypes();
          } catch(e) {
              showToast("Failed to delete exam type", 'error');
          }
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await DataService.addExamType(formData);
      setShowModal(false);
      setFormData({ name: '', description: '' });
      showToast("Exam type added successfully", 'success');
      loadExamTypes();
    } catch (err: any) {
      if (err.code === 'PGRST205') {
          showToast("Database Error: Table 'exam_types' not found. Please run the SQL commands in schema.sql", 'error');
      } else {
          showToast("Failed to add exam type. Name might be duplicate.", 'error');
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
          onClick={() => setShowModal(true)}
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
                    <button onClick={() => handleDelete(type.id)} className="text-red-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={20} />
                    </button>
                </div>
            ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Add Exam Type</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <Plus size={24} className="rotate-45" />
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
                  Save Exam Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};