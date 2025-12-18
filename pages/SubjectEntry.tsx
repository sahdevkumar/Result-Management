import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Subject } from '../types';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import { useToast } from '../components/ToastContext';

export const SubjectEntry: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: ''
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<{id: string, name: string} | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const data = await DataService.getSubjects();
      setSubjects(data);
    } catch (err) {
      showToast("Failed to load subjects", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subject: Subject) => {
      setFormData({
          name: subject.name,
          code: subject.code
      });
      setEditingId(subject.id);
      setShowModal(true);
  };

  const handleOpenAdd = () => {
      setFormData({ name: '', code: '' });
      setEditingId(null);
      setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
          // Preserve existing marks configuration when editing name/code
          const existing = subjects.find(s => s.id === editingId);
          await DataService.updateSubject({ 
              id: editingId, 
              name: formData.name,
              code: formData.code,
              maxMarks: existing?.maxMarks ?? 100,
              passMarks: existing?.passMarks ?? 33,
              maxMarksObjective: existing?.maxMarksObjective ?? 0,
              maxMarksSubjective: existing?.maxMarksSubjective ?? 0
          });
          showToast("Subject updated", 'success');
      } else {
          // Defaults for new subject (will be configured in Marks Entry)
          await DataService.addSubject({
              name: formData.name,
              code: formData.code,
              maxMarks: 100,
              passMarks: 33,
              maxMarksObjective: 0,
              maxMarksSubjective: 0
          });
          showToast("Subject created", 'success');
      }
      
      setShowModal(false);
      loadSubjects();
    } catch (err) {
      showToast("Operation failed", 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Academic Subjects</h1>
          <p className="text-slate-500 text-sm">Manage subject list</p>
        </div>
        <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-slate-200">
          <Plus size={18} /> Add Subject
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-200">
                        <th className="px-6 py-4">Subject Name</th>
                        <th className="px-6 py-4">Subject Code</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                         <tr><td colSpan={3} className="p-8 text-center text-slate-500">Loading...</td></tr>
                    ) : subjects.map(sub => (
                        <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="font-bold text-slate-800">{sub.name}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit">{sub.code}</div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => handleEdit(sub)} className="text-slate-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg"><Pencil size={18} /></button>
                                    <button onClick={() => { setSubjectToDelete({id: sub.id, name: sub.name}); setShowDeleteModal(true); }} className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800">Configure Subject</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject Name</label>
                    <input type="text" required className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Mathematics" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject Code</label>
                    <input type="text" required className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} placeholder="e.g. MTH-101" />
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-all">Save Changes</button>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && subjectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                 <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Subject?</h3>
                 <p className="text-slate-500 text-sm mb-6">
                    Are you sure you want to delete <strong>{subjectToDelete.name}</strong>?
                 </p>
                 <div className="flex gap-3">
                    <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
                    <button 
                       onClick={async () => {
                           if (!subjectToDelete) return;
                           try {
                               await DataService.deleteSubject(subjectToDelete.id);
                               showToast("Subject deleted", 'success');
                               loadSubjects();
                           } catch (e) {
                               showToast("Failed to delete", 'error');
                           } finally {
                               setShowDeleteModal(false);
                           }
                       }}
                       className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700"
                    >
                       Delete
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};