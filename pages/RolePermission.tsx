
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Save, Users, 
  CheckCircle2, XCircle, 
  Settings, FileCheck, PenTool,
  ShieldAlert, Fingerprint, Activity, Database, Loader2,
  LayoutDashboard, FileText, MessageSquareQuote, CreditCard,
  BarChart3, Printer, Palette, UserCog, BookOpen, GraduationCap,
  Bookmark, Terminal, Copy, Check, UserPlus, Trash2, Edit, Building2
} from 'lucide-react';
import { useToast } from '../components/ToastContext';
import { DataService } from '../services/dataService';
import clsx from 'clsx';

type SystemRole = 'Super Admin' | 'Principal' | 'Admin' | 'Teacher' | 'Office Staff';

interface Permission {
  id: string;
  name: string;
  category: 'Navigation' | 'Academic Entry' | 'Reports & Output' | 'System' | 'Security' | 'Student Management';
  description: string;
  icon: React.ElementType;
}

const SYSTEM_PERMISSIONS: Permission[] = [
  { id: 'nav_dashboard', name: 'Dashboard Access', category: 'Navigation', description: 'View system overview and statistics', icon: LayoutDashboard },
  { id: 'nav_students', name: 'Student Directory', category: 'Navigation', description: 'Access student records and profiles', icon: Users },
  { id: 'nav_exams', name: 'Exam Management', category: 'Navigation', description: 'View and schedule examinations', icon: FileText },
  
  { id: 'student_add', name: 'Add Student', category: 'Student Management', description: 'Register new students or import CSV', icon: UserPlus },
  { id: 'student_edit', name: 'Edit Student', category: 'Student Management', description: 'Modify student profile details', icon: Edit },
  { id: 'student_delete', name: 'Delete Student', category: 'Student Management', description: 'Remove student records permanently', icon: Trash2 },

  { id: 'entry_marks', name: 'Marks Entry', category: 'Academic Entry', description: 'Input and edit student exam scores', icon: PenTool },
  { id: 'entry_remarks', name: "Teacher's Remark", category: 'Academic Entry', description: 'Add qualitative feedback for subjects', icon: MessageSquareQuote },
  { id: 'entry_non_academic', name: 'Non-Academic Entry', category: 'Academic Entry', description: 'Grade behavior and participation', icon: Activity },
  { id: 'output_scorecard', name: 'Score Card Generation', category: 'Reports & Output', description: 'Generate and customize scorecards', icon: CreditCard },
  { id: 'output_reports', name: 'Performance Reports', category: 'Reports & Output', description: 'View trend analysis and class stats', icon: BarChart3 },
  { id: 'output_print', name: 'Print Center', category: 'Reports & Output', description: 'Bulk print management for reports', icon: Printer },
  { id: 'design_templates', name: 'Template Designer', category: 'System', description: 'Create and edit scorecard layouts', icon: Palette },
  { id: 'config_settings', name: 'Academic Settings', category: 'System', description: 'Manage Subjects, Classes, and Types', icon: Settings },
  { id: 'sys_branding', name: 'Admin Config', category: 'System', description: 'Manage school identity, logo and watermark', icon: Building2 },
  { id: 'sec_roles', name: 'Role & Permission', category: 'Security', description: 'Manage system access control matrix', icon: ShieldCheck },
  { id: 'sec_users', name: 'User Management', category: 'Security', description: 'Administer staff accounts and status', icon: UserCog },
  { id: 'sec_audit', name: 'Audit Logs', category: 'Security', description: 'Monitor system-wide activity history', icon: Fingerprint },
];

const INITIAL_ROLE_MAP: Record<SystemRole, string[]> = {
  'Super Admin': SYSTEM_PERMISSIONS.map(p => p.id),
  'Principal': SYSTEM_PERMISSIONS.map(p => p.id),
  'Admin': SYSTEM_PERMISSIONS.filter(p => !['sec_roles', 'sec_audit'].includes(p.id)).map(p => p.id),
  'Teacher': ['nav_dashboard', 'nav_students', 'entry_marks', 'entry_remarks', 'entry_non_academic', 'output_scorecard', 'output_reports'],
  'Office Staff': ['nav_dashboard', 'nav_students', 'student_add', 'student_edit', 'nav_exams', 'output_scorecard', 'output_print'],
};

const SQL_FIX = `-- RUN THIS IN SUPABASE SQL EDITOR
ALTER TABLE school_config ADD COLUMN IF NOT EXISTS role_permissions JSONB;
ALTER TABLE school_config ADD COLUMN IF NOT EXISTS scorecard_layout JSONB;
ALTER TABLE school_config ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE school_config ADD COLUMN IF NOT EXISTS full_logo_url TEXT;
ALTER TABLE system_users ADD COLUMN IF NOT EXISTS assigned_class_id TEXT;
ALTER TABLE system_users ADD COLUMN IF NOT EXISTS assigned_subject_id TEXT;
ALTER TABLE system_users ADD COLUMN IF NOT EXISTS staff_post TEXT;

-- Create templates table if missing
CREATE TABLE IF NOT EXISTS templates (id TEXT PRIMARY KEY, name TEXT, elements JSONB, width INTEGER, height INTEGER, created_at TIMESTAMPTZ DEFAULT NOW());
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;

-- Ensure record 1 exists
INSERT INTO school_config (id, name, tagline) 
VALUES (1, 'UNACADEMY', 'Excellence in Education') 
ON CONFLICT (id) DO NOTHING;`;

export const RolePermission: React.FC = () => {
  const [roleMap, setRoleMap] = useState<Record<SystemRole, string[]>>(INITIAL_ROLE_MAP);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [showSqlFix, setShowSqlFix] = useState(false);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const load = async () => {
        setLoading(true);
        try {
            const info = await DataService.getSchoolInfo();
            setSchoolInfo(info);
            if (info.role_permissions) {
                // Merge loaded permissions with defaults to ensure new keys exist
                const loadedMap = info.role_permissions as Record<SystemRole, string[]>;
                const mergedMap = { ...INITIAL_ROLE_MAP };
                
                (Object.keys(loadedMap) as SystemRole[]).forEach(role => {
                    // Start with what's in DB
                    let perms = loadedMap[role] || [];
                    // If it's Super Admin, force all
                    if (role === 'Super Admin') {
                        perms = SYSTEM_PERMISSIONS.map(p => p.id);
                    }
                    mergedMap[role] = perms;
                });
                
                setRoleMap(mergedMap);
            }
        } catch (e) {
            showToast("Failed to load permissions from server.", "error");
        } finally {
            setLoading(false);
        }
    };
    load();
  }, []);

  const handleTogglePermission = (role: SystemRole, permId: string) => {
    if (role === 'Super Admin') return;
    setRoleMap(prev => {
        const currentPerms = prev[role] || [];
        const nextPerms = currentPerms.includes(permId)
            ? currentPerms.filter(id => id !== permId)
            : [...currentPerms, permId];
        return { ...prev, [role]: nextPerms };
    });
  };

  const handleSaveMatrix = async () => {
    setSaving(true);
    setShowSqlFix(false);
    try {
        await DataService.updateSchoolInfo({
            ...schoolInfo,
            role_permissions: roleMap
        });
        showToast("Access control policies updated successfully", "success");
        // Force refresh to update sidebar if needed
        setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
        console.error("SAVE ERROR:", e);
        const errMsg = e.message || "Could not save permissions.";
        
        if (errMsg.includes('DATABASE_SCHEMA_OUT_OF_DATE') || errMsg.includes('role_permissions')) {
             setShowSqlFix(true);
             showToast("Schema Repair Required: The required database column is missing.", "error");
        } else {
             showToast(`Save Error: ${errMsg}`, "error");
        }
    } finally {
        setSaving(false);
    }
  };

  const handleCopySql = () => {
      navigator.clipboard.writeText(SQL_FIX);
      setCopied(true);
      showToast("SQL fix copied!", "success");
      setTimeout(() => setCopied(false), 2000);
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

  // Group permissions by category for display
  const groupedPermissions = SYSTEM_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const categoryOrder = ['Navigation', 'Student Management', 'Academic Entry', 'Reports & Output', 'System', 'Security'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                <ShieldCheck size={28} />
            </div>
            Access Control Matrix
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure feature visibility and functional permissions for system roles</p>
        </div>
        <div className="flex gap-3">
            <button 
              onClick={handleSaveMatrix}
              disabled={saving || loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 active:scale-95"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
              Commit Changes
            </button>
        </div>
      </div>

      {showSqlFix && (
          <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-500 p-6 rounded-3xl animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-red-500 text-white rounded-2xl"><Terminal size={24} /></div>
                  <div className="flex-1">
                      <h3 className="text-lg font-black text-red-600 dark:text-red-400 uppercase tracking-tight">Database Repair Required</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                          Required columns are missing from your Supabase table. Copy the script below and run it in your Supabase SQL Editor.
                      </p>
                  </div>
                  <button onClick={handleCopySql} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-red-200 dark:shadow-none">
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                      {copied ? 'Copied' : 'Copy SQL'}
                  </button>
              </div>
              <div className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-xs overflow-x-auto shadow-inner border border-slate-800">
                  <pre>{SQL_FIX}</pre>
              </div>
          </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative min-h-[500px]">
          {loading && (
              <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
                  <Loader2 className="animate-spin text-indigo-600" size={32} />
              </div>
          )}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-6 w-[340px]">
                     <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Menu Item / Capability</span>
                  </th>
                  {(Object.keys(roleMap) as SystemRole[]).map(role => (
                    <th key={role} className="p-6 text-center border-l border-slate-100 dark:border-slate-800 min-w-[140px]">
                        <div className="flex flex-col items-center">
                            <span className={clsx("text-[10px] font-black text-white px-2.5 py-1 rounded-lg mb-2 shadow-sm uppercase tracking-wider", getRoleColor(role))}>
                                {role}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-tighter">
                                {role === 'Super Admin' ? 'Root Access' : `${(roleMap[role] || []).length} Enabled`}
                            </span>
                        </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {categoryOrder.map(category => (
                  <React.Fragment key={category}>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/50">
                        <td colSpan={6} className="px-6 py-2 border-y border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em]">{category}</span>
                        </td>
                    </tr>
                    {(groupedPermissions[category] || []).map(perm => (
                      <tr key={perm.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                        <td className="p-6">
                            <div className="flex items-start gap-4">
                                <div className={clsx(
                                    "p-2.5 rounded-xl shadow-sm border shrink-0",
                                    perm.category === 'Navigation' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30" :
                                    perm.category === 'Student Management' ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30" :
                                    perm.category === 'Academic Entry' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30" :
                                    perm.category === 'Reports & Output' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30" :
                                    perm.category === 'Security' ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30" :
                                    "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30"
                                )}>
                                    <perm.icon size={20}/>
                                </div>
                                <div className="overflow-hidden">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{perm.name}</h4>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-tight line-clamp-1">{perm.description}</p>
                                </div>
                            </div>
                        </td>
                        {(Object.keys(roleMap) as SystemRole[]).map(role => (
                          <td key={role} className="p-6 text-center border-l border-slate-100 dark:border-slate-800">
                              <button 
                                disabled={role === 'Super Admin'}
                                onClick={() => handleTogglePermission(role, perm.id)}
                                className={clsx(
                                    "w-11 h-11 rounded-2xl flex items-center justify-center transition-all",
                                    role === 'Super Admin' ? "cursor-default" : "cursor-pointer active:scale-90",
                                    (roleMap[role] || []).includes(perm.id) 
                                        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20 shadow-inner" 
                                        : "bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                                )}
                              >
                                 {(roleMap[role] || []).includes(perm.id) ? (
                                     <CheckCircle2 size={24} strokeWidth={3} />
                                 ) : (
                                     <XCircle size={24} strokeWidth={2} className="opacity-40" />
                                 )}
                              </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
      </div>

      {/* Footer Security Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-indigo-950 dark:bg-black rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none flex gap-6 border-l-8 border-indigo-600">
            <div className="p-4 bg-white/10 rounded-2xl h-fit backdrop-blur-md">
                <ShieldAlert size={32} className="text-indigo-400" />
            </div>
            <div>
                <h4 className="font-black text-xl uppercase tracking-tight mb-2">Policy Governance</h4>
                <p className="text-sm text-indigo-200/80 leading-relaxed">
                    Changes to the permission matrix are applied globally. <b>Super Admin</b> permissions are immutable to prevent system lockouts. Ensure "Student Management" rights are only assigned to authorized personnel to prevent data loss.
                </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 flex gap-6 shadow-sm">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl h-fit text-amber-600 dark:text-amber-400">
                <Fingerprint size={32} />
            </div>
            <div className="space-y-4 w-full">
                <h4 className="font-black text-xl text-slate-800 dark:text-white uppercase tracking-tight">Security Summary</h4>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Roles</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white">5</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Perms</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{SYSTEM_PERMISSIONS.length}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Encrypted</p>
                        <div className="mt-2 text-emerald-500 dark:text-emerald-400"><Database size={18} /></div>
                    </div>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};
