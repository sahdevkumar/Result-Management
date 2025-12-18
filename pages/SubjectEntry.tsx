
import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Subject } from '../types';
import { BookCopy, Plus, Trash2, Pencil, X, AlertTriangle, Loader2, Calculator } from 'lucide-react';
import { useToast } from '../components/ToastContext';

export const SubjectEntry: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    maxMarksObjective: 80,
    maxMarksSubjective: 90,
    passMarks: 40
  });

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
      showToast("Failed to load subjects", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subject: Subject) => {
      setFormData({
          name: subject.name,
          code: subject.code,
          maxMarksObjective: subject.maxMarksObjective || 0,
          maxMarksSubjective: subject.maxMarksSubjective || 0,
          passMarks: subject.passMarks
      });
      setEditingId(subject.id);
      setShowModal(true);
  };

  const handleOpenAdd = () => {
      setFormData({ name: '', code: '', maxMarksObjective: 80, maxMarksSubjective: 90, passMarks: 40 });
      setEditingId(null);
      setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const totalMax = formData.maxMarksObjective + formData.maxMarksSubjective;
      const data: Omit<Subject, 'id'> = {
          name: formData.name,
          code: formData.code,
          maxMarks: totalMax,
          passMarks: formData.passMarks,
          maxMarksObjective: formData.maxMarksObjective,
          maxMarksSubjective: formData.maxMarksSubjective
      };

      if (editingId) {
          await DataService.updateSubject({ id: editingId, ...data });
          showToast("Subject updated", 'success');
      } else {
          await DataService.addSubject(data);
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
          <p className="text-slate-500 text-sm">Define mark limits for Objective and Subjective components</p>
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
                        <th className="px-6 py-4">Subject & Code</th>
                        <th className="px-6 py-4 text-center">Objective Max</th>
                        <th className="px-6 py-4 text-center">Subjective Max</th>
                        <th className="px-6 py-4 text-center">Total Max</th>
                        <th className="px-6 py-4 text-center">Pass Marks</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                         <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading...</td></tr>
                    ) : subjects.map(sub => (
                        <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="font-bold text-slate-800">{sub.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{sub.code}</div>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md font-bold text-xs">{sub.maxMarksObjective}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className="inline-block px-2 py-1 bg-violet-50 text-violet-700 rounded-md font-bold text-xs">{sub.maxMarksSubjective}</span>
                            </td>
                            <td className="px-6 py-4 text-center font-black text-slate-900">{sub.maxMarks}</td>
                            <td className="px-6 py-4 text-center text-slate-500 font-medium">{sub.passMarks}</td>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject Name</label>
                    <input type="text" required className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Objective Max</label>
                    <input type="number" required className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.maxMarksObjective} onChange={(e) => setFormData({...formData, maxMarksObjective: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subjective Max</label>
                    <input type="number" required className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.maxMarksSubjective} onChange={(e) => setFormData({...formData, maxMarksSubjective: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-slate-600">
                      <Calculator size={16} />
                      <span className="text-sm font-medium">Total Maximum Marks</span>
                  </div>
                  <span className="text-xl font-black text-indigo-600">{formData.maxMarksObjective + formData.maxMarksSubjective}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pass Marks</label>
                <input type="number" required className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.passMarks} onChange={(e) => setFormData({...formData, passMarks: parseInt(e.target.value) || 0})} />
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-all">Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
