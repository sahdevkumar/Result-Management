import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { SchoolClass } from '../types';
import { LayoutTemplate, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../components/ToastContext';

export const ClassEntry: React.FC = () => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    className: '',
    section: ''
  });
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

  const handleDelete = async (id: string) => {
      if(window.confirm("Are you sure you want to delete this class?")) {
          try {
              await DataService.deleteClass(id);
              showToast("Class deleted successfully", 'success');
              loadClasses();
          } catch(e) {
              showToast("Failed to delete class", 'error');
          }
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await DataService.addClass(formData);
      setShowModal(false);
      setFormData({ className: '', section: '' });
      showToast("Class added successfully", 'success');
      loadClasses();
    } catch (err) {
      showToast("Failed to create class", 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Class Management</h1>
          <p className="text-slate-500 text-sm">Manage class levels and sections</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Add Class</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
             <div className="col-span-full py-12 text-center text-slate-500">Loading classes...</div>
        ) : classes.length === 0 ? (
             <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">No classes found.</div>
        ) : (
            classes.map(cls => (
                <div key={cls.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center hover:shadow-md transition-shadow group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <LayoutTemplate size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">{cls.className}</h3>
                            <p className="text-sm text-slate-500">Section: {cls.section}</p>
                        </div>
                    </div>
                    <button onClick={() => handleDelete(cls.id)} className="text-red-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors">
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
              <h3 className="font-bold text-lg text-slate-800">Add New Class</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Class Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Class 10"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.className}
                  onChange={(e) => setFormData({...formData, className: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., A"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.section}
                  onChange={(e) => setFormData({...formData, section: e.target.value})}
                />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};