import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Student, StudentStatus } from '../types';
import { Search, Plus, Filter, MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const data = await DataService.getStudents();
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Student Directory</h1>
          <p className="text-slate-500 text-sm">Manage student profiles and enrollment status</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-blue-500/20">
          <Plus size={18} />
          <span>Add Student</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or roll number..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 text-sm hover:bg-slate-50">
                <Filter size={16} />
                <span>Filter</span>
             </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold tracking-wider">
                <th className="px-6 py-4">Student Info</th>
                <th className="px-6 py-4">Roll ID</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Guardian</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Loading student data...</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No students found.</td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <img src={student.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                        <div>
                          <p className="font-medium text-slate-900">{student.fullName}</p>
                          <p className="text-xs text-slate-500">{student.contactEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600 font-mono">{student.rollNumber}</td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded">
                        {student.className}-{student.section}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">{student.guardianName}</td>
                    <td className="px-6 py-3">
                      <span className={clsx(
                        "px-2.5 py-1 rounded-full text-xs font-medium",
                        student.status === StudentStatus.Active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button className="text-slate-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
