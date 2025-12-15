import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Exam, ExamStatus } from '../types';
import { Calendar, Plus, Book, Clock } from 'lucide-react';
import clsx from 'clsx';

export const Exams: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    academicYear: '2023-2024',
    term: 'Term 1',
    startDate: '',
    endDate: '',
    status: ExamStatus.Upcoming
  });

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const data = await DataService.getExams();
      setExams(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await DataService.addExam(formData as any);
      setShowModal(false);
      setFormData({
        name: '',
        academicYear: '2023-2024',
        term: 'Term 1',
        startDate: '',
        endDate: '',
        status: ExamStatus.Upcoming
      });
      loadExams();
    } catch (err) {
      alert("Failed to create exam");
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
          onClick={() => setShowModal(true)}
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
            <div key={exam.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
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
                   <Calendar size={16} />
                   <span>{exam.academicYear} • {exam.term}</span>
                </div>
                <div className="flex items-center gap-2">
                   <Clock size={16} />
                   <span>{exam.startDate} - {exam.endDate}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                 <button className="flex-1 text-center py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-medium transition-colors">
                    Edit
                 </button>
                 <button className="flex-1 text-center py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-medium transition-colors">
                    Timetable
                 </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Create New Exam</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Exam Name</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  placeholder="e.g., Final Term 2024"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Academic Year</label>
                    <select 
                      name="academicYear"
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={formData.academicYear}
                      onChange={handleInputChange}
                    >
                      <option>2023-2024</option>
                      <option>2024-2025</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Term</label>
                    <select 
                      name="term"
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={formData.term}
                      onChange={handleInputChange}
                    >
                      <option>Term 1</option>
                      <option>Term 2</option>
                      <option>Final</option>
                    </select>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                    <input 
                      type="date" 
                      name="startDate"
                      required
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={formData.startDate}
                      onChange={handleInputChange}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                    <input 
                      type="date" 
                      name="endDate"
                      required
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={formData.endDate}
                      onChange={handleInputChange}
                    />
                 </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select 
                   name="status"
                   className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                   value={formData.status}
                   onChange={handleInputChange}
                >
                   <option value={ExamStatus.Upcoming}>Upcoming</option>
                   <option value={ExamStatus.Ongoing}>Ongoing</option>
                   <option value={ExamStatus.Completed}>Completed</option>
                </select>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                  Create Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};