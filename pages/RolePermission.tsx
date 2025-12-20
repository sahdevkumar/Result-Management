
// ... imports ...
import React, { useState } from 'react';
import { 
  ShieldCheck, Save, Users, 
  CheckCircle2, XCircle, 
  Settings, FileCheck, PenTool,
  ShieldAlert, Fingerprint, Activity, Database, Loader2
} from 'lucide-react';
import { useToast } from '../components/ToastContext';
import clsx from 'clsx';

type SystemRole = 'Super Admin' | 'Principal' | 'Admin' | 'Teacher' | 'Office Staff';

interface Permission {
  id: string;
  name: string;
  category: 'Student' | 'Exam' | 'Academic' | 'System' | 'Security';
  description: string;
}

const SYSTEM_PERMISSIONS: Permission[] = [
  { id: 'view_students', name: 'View Students', category: 'Student', description: 'Search and view student profiles' },
  { id: 'edit_students', name: 'Edit Students', category: 'Student', description: 'Add, modify, or delete students' },
  { id: 'manage_exams', name: 'Manage Exams', category: 'Exam', description: 'Schedule and configure examinations' },
  { id: 'entry_marks', name: 'Marks Entry', category: 'Academic', description: 'Input and edit academic scores' },
  { id: 'approve_results', name: 'Approve Results', category: 'Academic', description: 'Lock marks and finalize results' },
  { id: 'print_reports', name: 'Print Reports', category: 'Academic', description: 'Generate and print scorecards' },
  { id: 'manage_system', name: 'System Settings', category: 'System', description: 'Modify school info and branding' },
  { id: 'manage_roles', name: 'Access Control', category: 'Security', description: 'Manage roles and user permissions' },
  { id: 'audit_logs', name: 'Audit Logs', category: 'Security', description: 'View system-wide activity history' },
  { id: 'db_manage', name: 'Database Management', category: 'Security', description: 'Handle backups and data migrations' },
];

const INITIAL_ROLE_MAP: Record<SystemRole, string[]> = {
  'Super Admin': SYSTEM_PERMISSIONS.map(p => p.id),
  'Principal': SYSTEM_PERMISSIONS.map(p => p.id),
  'Admin': ['view_students', 'edit_students', 'manage_exams', 'entry_marks', 'print_reports', 'manage_system'],
  'Teacher': ['view_students', 'entry_marks', 'print_reports'],
  'Office Staff': ['view_students', 'print_reports'],
};

export const RolePermission: React.FC = () => {
  const [roleMap, setRoleMap] = useState(INITIAL_ROLE_MAP);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const handleTogglePermission = (role: SystemRole, permId: string) => {
    if (role === 'Super Admin') return;
    setRoleMap(prev => {
        const currentPerms = prev[role];
        const nextPerms = currentPerms.includes(permId)
            ? currentPerms.filter(id => id !== permId)
            : [...currentPerms, permId];
        return { ...prev, [role]: nextPerms };
    });
  };

  const handleSaveMatrix = () => {
    setSaving(true);
    setTimeout(() => {
        setSaving(false);
        showToast("Role configurations and permissions updated", "success");
    }, 800);
  };

  const getRoleColor = (role: SystemRole) => {
      switch(role) {
          case 'Super Admin': return 'bg-indigo-600';
          case 'Principal': return 'bg-purple-600';
          case 'Admin': return 'bg-emerald-600';
          case 'Teacher': return 'bg-blue-600';
          case 'Office Staff': return 'bg-slate-600';
          default: return 'bg-slate-400';
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                <ShieldCheck size={28} />
            </div>
            Role Configuration
          </h1>
          <p className="text-slate-500 text-sm mt-1">Define system access capabilities and role-based security policies</p>
        </div>
        <div className="flex gap-3">
            <button 
              onClick={handleSaveMatrix}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 active:scale-95"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
              Save Policy Changes
            </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-slate-200 gap-8 no-print">
        <button 
            className="pb-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 px-1 flex items-center gap-2 border-indigo-600 text-indigo-600"
        >
            <Fingerprint size={16} /> Permission Matrix
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[500px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-6 w-[320px]">
                     <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">System Capabilities</span>
                  </th>
                  {(Object.keys(roleMap) as SystemRole[]).map(role => (
                    <th key={role} className="p-6 text-center border-l border-slate-100 min-w-[140px]">
                        <div className="flex flex-col items-center">
                            <span className={clsx("text-xs font-black text-white px-2 py-1 rounded-lg mb-2 shadow-sm", getRoleColor(role))}>
                                {role.toUpperCase()}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                {role === 'Super Admin' ? 'Master Access' : `${roleMap[role].length} Capabilities`}
                            </span>
                        </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {SYSTEM_PERMISSIONS.map(perm => (
                  <tr key={perm.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                        <div className="flex items-start gap-4">
                            <div className={clsx(
                                "p-2.5 rounded-xl shadow-sm border",
                                perm.category === 'Student' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                perm.category === 'Exam' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                perm.category === 'Academic' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                perm.category === 'Security' ? "bg-red-50 text-red-600 border-red-100" :
                                "bg-purple-50 text-purple-600 border-purple-100"
                            )}>
                                {perm.category === 'Student' && <Users size={20}/>}
                                {perm.category === 'Exam' && <FileCheck size={20}/>}
                                {perm.category === 'Academic' && <PenTool size={20}/>}
                                {perm.category === 'Security' && <ShieldAlert size={20}/>}
                                {perm.category === 'System' && <Settings size={20}/>}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm">{perm.name}</h4>
                                <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{perm.description}</p>
                            </div>
                        </div>
                    </td>
                    {(Object.keys(roleMap) as SystemRole[]).map(role => (
                      <td key={role} className="p-6 text-center border-l border-slate-100">
                          <button 
                            disabled={role === 'Super Admin'}
                            onClick={() => handleTogglePermission(role, perm.id)}
                            className={clsx(
                                "w-11 h-11 rounded-2xl flex items-center justify-center transition-all",
                                role === 'Super Admin' ? "cursor-default" : "cursor-pointer active:scale-90",
                                roleMap[role].includes(perm.id) 
                                    ? "bg-indigo-50 text-indigo-600 ring-2 ring-indigo-500/20 shadow-inner" 
                                    : "bg-slate-50 text-slate-300 hover:bg-slate-100"
                            )}
                          >
                             {roleMap[role].includes(perm.id) ? (
                                 <CheckCircle2 size={24} strokeWidth={3} />
                             ) : (
                                 <XCircle size={24} strokeWidth={2} className="opacity-40" />
                             )}
                          </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-indigo-950 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 flex gap-6 border-l-8 border-indigo-900">
            <div className="p-4 bg-white/10 rounded-2xl h-fit backdrop-blur-md">
                <ShieldAlert size={32} className="text-violet-200" />
            </div>
            <div>
                <h4 className="font-black text-xl uppercase tracking-tight mb-2">Master Administrator Logic</h4>
                <p className="text-sm text-violet-100 leading-relaxed">
                    The <b>Super Admin</b> profile is the root account for the EduCore instance. It possesses unchangeable permissions for database maintenance, audit log access, and global system configurations. It cannot be locked or modified by other roles.
                </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 flex gap-6 shadow-sm">
            <div className="p-4 bg-amber-50 rounded-2xl h-fit text-amber-500">
                <Activity size={32} />
            </div>
            <div className="space-y-4 w-full">
                <h4 className="font-black text-xl text-slate-800 uppercase tracking-tight">Security Stats</h4>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-3 rounded-2xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active</p>
                        <p className="text-2xl font-black text-slate-800">12</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Locked</p>
                        <p className="text-2xl font-black text-slate-800">2</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Backup</p>
                        <div className="mt-2 text-emerald-500"><Database size={18} /></div>
                    </div>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};
