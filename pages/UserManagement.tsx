
import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Save, Users, Key, AlertCircle, 
  CheckCircle2, Search, Lock, UserCircle, 
  Phone, Mail, User, Eye, EyeOff, ChevronDown, 
  BookOpen, Briefcase, Loader2, DatabaseZap, Pencil, KeyRound, X, Activity, UserCog, ShieldCheck, Clock, Globe,
  Sparkles, GraduationCap
} from 'lucide-react';
import { useToast } from '../components/ToastContext';
import { DataService } from '../services/dataService';
import { Subject, SchoolClass, ActivityLog } from '../types';
import clsx from 'clsx';

type SystemRole = 'Super Admin' | 'Principal' | 'Admin' | 'Teacher' | 'Office Staff';

interface UserAccess {
  id: string;
  name: string;
  email: string;
  role: SystemRole;
  status: 'Active' | 'Locked';
  lastLogin: string;
  assignedSubject?: string;
  assignedClass?: string;
  staffPost?: string;
  mobile?: string;
}

export const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'directory' | 'registration' | 'activity'>('directory');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserAccess[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const { showToast } = useToast();

  const [passwordModalUser, setPasswordModalUser] = useState<UserAccess | null>(null);
  const [manualPassword, setManualPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: 'Teacher' as SystemRole,
    password: '',
    subjectId: '',
    classId: '',
    staffPost: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setDbError(null);
    try {
      const [uData, sData, cData] = await Promise.all([
        DataService.getSystemUsers(),
        DataService.getSubjects(),
        DataService.getClasses()
      ]);
      setUsers(uData as any);
      setSubjects(sData);
      setClasses(cData);
    } catch (err: any) {
      console.error("DB LOAD ERROR:", err);
      if (err.message?.includes('PERMISSION_DENIED') || err.code === '42501') {
          setDbError('Access Denied: Row Level Security is blocking the User Directory. Go to Login > Diagnostics to fix permissions.');
      } else if (err.message?.includes('does not exist')) {
        setDbError('Table "system_users" not found. Please run the SQL migration.');
      } else {
        setDbError(err.message || "Error loading system user directory");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: 'directory' | 'registration' | 'activity') => {
      setActiveTab(tab);
      if (tab === 'registration') {
          if (activeTab !== 'registration') {
            setEditingUserId(null);
            setUserFormData({ name: '', email: '', mobile: '', role: 'Teacher', password: '', subjectId: '', classId: '', staffPost: '' });
          }
      } else if (tab === 'activity') {
          DataService.getUserActivityLogs().then(setActivityLogs);
      } else if (tab === 'directory') {
          loadInitialData();
      }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
        if (editingUserId) {
            await DataService.updateSystemUser(editingUserId, {
                full_name: userFormData.name,
                mobile: userFormData.mobile,
                role: userFormData.role,
                assigned_subject_id: userFormData.subjectId || null,
                // Removed assigned_class_id to avoid schema error
                staff_post: userFormData.staffPost || null
            });
            showToast(`User ${userFormData.name} updated successfully`, "success");
        } else {
            await DataService.addSystemUser(userFormData);
            showToast(`User ${userFormData.name} created successfully`, "success");
        }
        
        setUserFormData({ name: '', email: '', mobile: '', role: 'Teacher', password: '', subjectId: '', classId: '', staffPost: '' });
        setEditingUserId(null);
        await loadInitialData();
        setActiveTab('directory');
    } catch (err: any) {
        showToast(`Operation failed: ${err.message}`, 'error');
    } finally {
        setSaving(false);
    }
  };

  const handleEditUser = (user: UserAccess) => {
      setEditingUserId(user.id);
      setUserFormData({
          name: user.name,
          email: user.email,
          mobile: user.mobile || '',
          role: user.role,
          password: '',
          subjectId: subjects.find(s => s.name === user.assignedSubject)?.id || '',
          classId: classes.find(c => `${c.className} - ${c.section}` === user.assignedClass)?.id || '',
          staffPost: user.staffPost || ''
      });
      setActiveTab('registration');
  };

  const handleUpdateUserRole = async (userId: string, newRole: SystemRole) => {
      try {
          await DataService.updateSystemUser(userId, { role: newRole });
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
          showToast(`User role updated to ${newRole}`, "info");
      } catch (err: any) { showToast("Failed to update role", 'error'); }
  };

  const handleToggleUserStatus = async (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      const newStatus = user.status === 'Active' ? 'Locked' : 'Active';
      try {
          await DataService.updateSystemUser(userId, { status: newStatus });
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
          showToast(`Account ${newStatus === 'Locked' ? 'locked' : 'unlocked'}`, "info");
      } catch (err: any) { showToast("Failed to update status", 'error'); }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser || !manualPassword) return;
    setIsUpdatingPassword(true);
    try {
        await DataService.updateSystemUser(passwordModalUser.id, { password: manualPassword });
        showToast(`Password updated for ${passwordModalUser.name}`, 'success');
        setManualPassword('');
        setPasswordModalUser(null);
    } catch (err: any) { showToast("Failed to update password", 'error'); } finally { setIsUpdatingPassword(false); }
  };

  const handleSyncAdmin = async () => {
    setIsInitializing(true);
    try {
        await DataService.seedInitialData();
        showToast("System users table initialized", "success");
        await loadInitialData();
    } catch (e: any) {
        showToast(e.message || "Sync failed", "error");
    } finally {
        setIsInitializing(false);
    }
  };

  // Robust null-safe filtering
  const filteredUsers = users.filter(u => {
      const search = searchTerm.toLowerCase();
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(search) || email.includes(search);
  });

  return (
    <div className="relative space-y-6 animate-in fade-in duration-700 p-1">
      <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-purple-50/30 to-slate-50/50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900" />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3 drop-shadow-sm">
            <div className="p-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl text-indigo-600 dark:text-indigo-400 shadow-sm"><UserCog size={28} /></div>
            User Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 ml-1">Administer system accounts and roles.</p>
        </div>
        <div className="flex p-1.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl shadow-sm">
            {[{ id: 'directory', icon: Users, label: 'Directory' }, { id: 'registration', icon: UserPlus, label: 'Registration' }, { id: 'activity', icon: Activity, label: 'Audit Logs' }].map((tab) => (
                <button key={tab.id} onClick={() => handleTabChange(tab.id as any)} className={clsx("px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all duration-300", activeTab === tab.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none ring-1 ring-indigo-500/20 transform scale-[1.02]" : "text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-white/50 dark:hover:bg-slate-700/50")}><tab.icon size={16} /> {tab.label}</button>
            ))}
        </div>
      </div>

      <div className="bg-white/75 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/80 dark:border-white/10 overflow-hidden relative min-h-[600px] transition-all duration-500 ring-1 ring-white/50 dark:ring-white/5">
        {loading && <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md z-50 flex flex-col items-center justify-center"><Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={48} /><p className="text-slate-600 dark:text-slate-300 font-bold uppercase tracking-widest text-xs mt-4">Syncing database...</p></div>}

        {activeTab === 'directory' && (
          <div className="flex flex-col h-full">
            {dbError ? (
                <div className="p-20 text-center flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full flex items-center justify-center"><AlertCircle size={32} /></div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Database Configuration Issue</h3>
                    <p className="max-w-md text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{dbError}</p>
                    <div className="flex gap-3">
                        <button onClick={loadInitialData} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"><Globe size={18} /> Retry Connection</button>
                    </div>
                </div>
            ) : filteredUsers.length === 0 && !loading ? (
                <div className="p-20 text-center flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-200 dark:text-indigo-800 rounded-full flex items-center justify-center relative">
                        <Users size={48} />
                        <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center animate-bounce shadow-lg"><DatabaseZap size={16} /></div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white">User Directory Empty</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">No authorized accounts found. If you have data in Supabase, make sure <b>RLS is disabled</b> for the <code>system_users</code> table in the Diagnostics section.</p>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            disabled={isInitializing}
                            onClick={handleSyncAdmin}
                            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center gap-3 active:scale-95 disabled:opacity-50"
                        >
                            {isInitializing ? <Loader2 className="animate-spin" size={20} /> : <DatabaseZap size={20} />}
                            Sync Master Admin
                        </button>
                        <button onClick={() => handleTabChange('registration')} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm">Register New</button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="p-8 border-b border-indigo-100/50 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-r from-white/40 to-indigo-50/20 dark:from-slate-800/40 dark:to-transparent">
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" size={20} />
                            <input type="text" placeholder="Search users..." className="w-full pl-12 pr-6 py-4 bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 rounded-2xl text-sm outline-none focus:bg-white dark:focus:bg-slate-800 transition-all font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <button onClick={() => handleTabChange('registration')} className="w-full md:w-auto flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5"><UserPlus size={20} /> Add User</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-black uppercase text-indigo-400 dark:text-indigo-300 tracking-widest border-b border-indigo-100/50 dark:border-slate-800 bg-indigo-50/30 dark:bg-slate-800/30">
                                    <th className="p-6 pl-8">User Identity</th>
                                    <th className="p-6">Role</th>
                                    <th className="p-6">Status</th>
                                    <th className="p-6">Last Active</th>
                                    <th className="p-6 pr-8 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-indigo-50/50 dark:divide-slate-800">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-indigo-50/20 dark:hover:bg-white/5 transition-colors group">
                                        <td className="p-6 pl-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-700 border border-white dark:border-slate-600 shadow-sm flex items-center justify-center text-indigo-500 dark:text-indigo-400"><UserCircle size={28} /></div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">{user.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{user.email}</p>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {user.assignedSubject && <span className="text-[9px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-md font-bold uppercase border border-blue-100 dark:border-blue-800">Sub: {user.assignedSubject}</span>}
                                                        {user.assignedClass && <span className="text-[9px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 px-2 py-0.5 rounded-md font-bold uppercase border border-emerald-100 dark:border-emerald-800">Class: {user.assignedClass}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{user.role}</span>
                                        </td>
                                        <td className="p-6">
                                            <span className={clsx("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight border shadow-sm", user.status === 'Active' ? "bg-emerald-50/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800" : "bg-red-50/50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800")}>{user.status}</span>
                                        </td>
                                        <td className="p-6">
                                            <span className="text-xs text-slate-700 dark:text-slate-200 font-bold">{user.lastLogin}</span>
                                        </td>
                                        <td className="p-6 pr-8 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button disabled={user.role === 'Super Admin'} onClick={() => setPasswordModalUser(user)} className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700 text-slate-500 hover:text-amber-600"><KeyRound size={18} /></button>
                                                <button disabled={user.role === 'Super Admin'} onClick={() => handleEditUser(user)} className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700 text-slate-500 hover:text-indigo-600"><Pencil size={18} /></button>
                                                <button disabled={user.role === 'Super Admin'} onClick={() => handleToggleUserStatus(user.id)} className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700 text-slate-500 hover:text-red-600">{user.status === 'Active' ? <Lock size={18} /> : <Key size={18} />}</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
          </div>
        )}

        {activeTab === 'registration' && (
          <div className="p-8 md:p-12 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
              <div className="mb-10 text-center">
                  <div className="inline-flex p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400 mb-4 border border-indigo-100 dark:border-indigo-800">{editingUserId ? <UserCog size={32} /> : <Sparkles size={32} />}</div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{editingUserId ? 'Edit Profile' : 'New User Registration'}</h3>
              </div>
              <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2"><label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label><input type="text" required className="w-full bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/10 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:bg-white dark:focus:bg-slate-800 shadow-sm" value={userFormData.name} onChange={(e) => setUserFormData({...userFormData, name: e.target.value})} /></div>
                  <div className="space-y-2"><label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label><input type="email" required disabled={!!editingUserId} className="w-full bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/10 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:bg-white dark:focus:bg-slate-800 shadow-sm disabled:opacity-50" value={userFormData.email} onChange={(e) => setUserFormData({...userFormData, email: e.target.value})} /></div>
                  <div className="space-y-2"><label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">System Role</label><select className="w-full bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/10 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-slate-200 outline-none appearance-none" value={userFormData.role} onChange={(e) => setUserFormData({...userFormData, role: e.target.value as SystemRole, subjectId: '', classId: '', staffPost: ''})}><option value="Teacher">Teacher</option><option value="Admin">Admin</option><option value="Office Staff">Office Staff</option><option value="Principal">Principal</option><option value="Super Admin">Super Admin</option></select></div>
                  <div className="space-y-2"><label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label><input type="tel" className="w-full bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/10 rounded-2xl p-4 text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:bg-white dark:focus:bg-slate-800 shadow-sm" value={userFormData.mobile} onChange={(e) => setUserFormData({...userFormData, mobile: e.target.value})} /></div>
                  
                  {userFormData.role === 'Teacher' && (
                    <>
                        <div className="space-y-2 group"><label className="block text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5 ml-1"><BookOpen size={14} /> Assign Subject</label><select required className="w-full bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 text-sm font-bold" value={userFormData.subjectId} onChange={(e) => setUserFormData({...userFormData, subjectId: e.target.value})}><option value="" disabled>Select Subject...</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}</select></div>
                        <div className="space-y-2 group"><label className="block text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 ml-1"><GraduationCap size={14} /> Assign Class</label><select required className="w-full bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-4 text-sm font-bold" value={userFormData.classId} onChange={(e) => setUserFormData({...userFormData, classId: e.target.value})}><option value="" disabled>Select Class...</option>{classes.map(c => <option key={c.id} value={c.id}>{c.className} - {c.section}</option>)}</select></div>
                    </>
                  )}
                  {userFormData.role === 'Office Staff' && (<div className="space-y-2 md:col-span-2"><label className="block text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1"><Briefcase size={14} /> Designation</label><input type="text" required className="w-full bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/10 rounded-2xl p-4 text-sm font-bold" value={userFormData.staffPost} onChange={(e) => setUserFormData({...userFormData, staffPost: e.target.value})} /></div>)}
                  {!editingUserId && (<div className="space-y-2 md:col-span-2"><label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Account Password</label><input type="password" required minLength={6} className="w-full bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/10 rounded-2xl p-4 text-sm font-bold" value={userFormData.password} onChange={(e) => setUserFormData({...userFormData, password: e.target.value})} /></div>)}
                  <div className="md:col-span-2 pt-4"><button type="submit" disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-200">{saving ? <Loader2 className="animate-spin" size={24} /> : editingUserId ? <Save size={24} /> : <UserPlus size={24} />} {editingUserId ? 'Update User' : 'Register User'}</button></div>
              </form>
          </div>
        )}

        {activeTab === 'activity' && (
           <div className="p-8">
               <div className="space-y-4">
                   {activityLogs.map(log => (
                       <div key={log.id} className="flex gap-4 p-4 rounded-2xl bg-indigo-50/30 dark:bg-slate-800/40 border border-indigo-100/50 dark:border-slate-800">
                           <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-indigo-500 shadow-sm"><Clock size={20} /></div>
                           <div className="flex-1">
                               <div className="flex justify-between">
                                   <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{log.action}</p>
                                   <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(log.timestamp).toLocaleString()}</p>
                               </div>
                               <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{log.details}</p>
                               <p className="text-[9px] text-indigo-400 dark:text-indigo-600 font-bold mt-1 uppercase">User: {log.userName} ({log.role}) • IP: {log.ipAddress}</p>
                           </div>
                       </div>
                   ))}
               </div>
           </div>
        )}
      </div>

      {/* Password Reset Modal */}
      {passwordModalUser && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
              <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                      <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-2"><Key size={20} /> Reset Password</h3>
                      <button onClick={() => setPasswordModalUser(null)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                  </div>
                  <form onSubmit={handleSetPassword} className="p-8 space-y-6">
                      <div className="text-center">
                          <p className="text-sm text-slate-500 dark:text-slate-400">Updating password for</p>
                          <p className="font-black text-indigo-600 dark:text-indigo-400 text-lg">{passwordModalUser.name}</p>
                      </div>
                      <div className="space-y-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Secure Password</label>
                          <div className="relative">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                              <input 
                                type={showPassword ? "text" : "password"} 
                                required 
                                minLength={6}
                                className="w-full pl-12 pr-12 py-4 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={manualPassword}
                                onChange={(e) => setManualPassword(e.target.value)}
                              />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                          </div>
                      </div>
                      <button type="submit" disabled={isUpdatingPassword} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-200 disabled:opacity-50">
                          {isUpdatingPassword ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save New Password
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
