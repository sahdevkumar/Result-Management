import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Subject } from '../types';
import { BookCopy, Plus, Trash2 } from 'lucide-react';

export const SubjectEntry: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    maxMarks: 100,
    passMarks: 40
  });

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const data = await DataService.getSubjects();
      setSubjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
      if(window.confirm("Are you sure you want to delete this subject?")) {
          try {
              await DataService.deleteSubject(id);
              loadSubjects();
          } catch(e) {
              alert("Failed to delete subject.");
          }
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await DataService.addSubject(formData);
      setShowModal(false);
      setFormData({ name: '', code: '', maxMarks: 100, passMarks: 40 });
      loadSubjects();
    } catch (err) {
      alert("Failed to create subject");
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
          onClick={() => setShowModal(true)}
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
                                    <button onClick={() => handleDelete(sub.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
         </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Add New Subject</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <Plus size={24} className="rotate-45" />
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
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};