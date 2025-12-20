
import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Save, Users, Key, AlertCircle, 
  CheckCircle2, Search, Lock, UserCircle, 
  Phone, Mail, User, Eye, EyeOff, ChevronDown, 
  BookOpen, Briefcase, Loader2, DatabaseZap, Pencil, KeyRound, X, Activity, UserCog, ShieldCheck, Clock, Globe,
  Sparkles
} from 'lucide-react';
import { useToast } from '../components/ToastContext';
import { DataService } from '../services/dataService';
import { Subject, ActivityLog } from '../types';
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
  staffPost?: string;
  mobile?: string;
}

export const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'directory' | 'registration' | 'activity'>('directory');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserAccess[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const { showToast } = useToast();

  // Password Modal State
  const [passwordModalUser, setPasswordModalUser] = useState<UserAccess | null>(null);
  const [manualPassword, setManualPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // User Form State
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: 'Teacher' as SystemRole,
    password: '',
    subjectId: '',
    staffPost: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setDbError(null);
    try {
      const [uData, sData] = await Promise.all([
        DataService.getSystemUsers(),
        DataService.getSubjects()
      ]);
      setUsers(uData as any);
      setSubjects(sData);
    } catch (err: any) {
      if (err.message?.includes('does not exist')) {
        setDbError('Table "system_users" not found. Please run the SQL migration.');
      } else {
        showToast("Error loading system user directory", 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadActivityLogs = async () => {
      setLoading(true);
      try {
          const logs = await DataService.getUserActivityLogs();
          setActivityLogs(logs);
      } catch (err) {
          showToast("Failed to load activity logs", 'error');
      } finally {
          setLoading(false);
      }
  };

  const handleTabChange = (tab: 'directory' | 'registration' | 'activity') => {
      setActiveTab(tab);
      if (tab === 'registration') {
          if (activeTab !== 'registration') {
            setEditingUserId(null);
            setUserFormData({ name: '', email: '', mobile: '', role: 'Teacher', password: '', subjectId: '', staffPost: '' });
          }
      } else if (tab === 'activity') {
          loadActivityLogs();
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
                staff_post: userFormData.staffPost || null
            });
            showToast(`User ${userFormData.name} updated successfully`, "success");
        } else {
            await DataService.addSystemUser(userFormData);
            showToast(`User ${userFormData.name} created successfully`, "success");
        }
        
        setUserFormData({ name: '', email: '', mobile: '', role: 'Teacher', password: '', subjectId: '', staffPost: '' });
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
          password: '', // Password not shown/edited here for security
          subjectId: subjects.find(s => s.name === user.assignedSubject)?.id || '',
          staffPost: user.staffPost || ''
      });
      setActiveTab('registration');
  };

  const handleUpdateUserRole = async (userId: string, newRole: SystemRole) => {
      try {
          await DataService.updateSystemUser(userId, { role: newRole });
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
          showToast(`User role updated to ${newRole}`, "info");
      } catch (err: any) {
          showToast("Failed to update role", 'error');
      }
  };

  const handleToggleUserStatus = async (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      const newStatus = user.status === 'Active' ? 'Locked' : 'Active';
      try {
          await DataService.updateSystemUser(userId, { status: newStatus });
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
          showToast(`Account ${newStatus === 'Locked' ? 'locked' : 'unlocked'}`, "info");
      } catch (err: any) {
          showToast("Failed to update status", 'error');
      }
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
    } catch (err: any) {
        showToast("Failed to update password", 'error');
    } finally {
        setIsUpdatingPassword(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative space-y-6 animate-in fade-in duration-700 p-1">
      {/* Enhanced Background Decor */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-purple-50/30 to-slate-50/50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900" />
          <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-indigo-200/20 dark:bg-indigo-500/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-fuchsia-200/20 dark:bg-purple-600/5 rounded-full blur-[100px]" />
          <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-blue-200/10 dark:bg-blue-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3 drop-shadow-sm">
            <div className="p-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl text-indigo-600 dark:text-indigo-400 shadow-sm">
                <UserCog size={28} />
            </div>
            User Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 ml-1">Administer system accounts, assign roles, and manage user details.</p>
        </div>
        
        {/* Improved Glass Tabs */}
        <div className="flex p-1.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl shadow-sm">
            {[
                { id: 'directory', icon: Users, label: 'Directory' },
                { id: 'registration', icon: UserPlus, label: 'Registration' },
                { id: 'activity', icon: Activity, label: 'Audit Logs' },
            ].map((tab) => (
                <button 
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as any)}
                    className={clsx(
                        "px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2.5 transition-all duration-300",
                        activeTab === tab.id 
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none ring-1 ring-indigo-500/20 transform scale-[1.02]" 
                            : "text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-white/50 dark:hover:bg-slate-700/50"
                    )}
                >
                    <tab.icon size={16} /> {tab.label}
                </button>
            ))}
        </div>
      </div>

      {/* Main Glass Content Container */}
      <div className="bg-white/75 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/80 dark:border-white/10 overflow-hidden relative min-h-[600px] transition-all duration-500 ring-1 ring-white/50 dark:ring-white/5">
        
        {loading && (
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md z-50 flex flex-col items-center justify-center">
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-400 blur-xl opacity-20 rounded-full animate-pulse"></div>
                    <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400 relative z-10" size={48} />
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-bold uppercase tracking-widest text-xs mt-4">Syncing database...</p>
            </div>
        )}

        {dbError && (
          <div className="absolute inset-0 z-[60] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center">
              <div className="w-24 h-24 bg-red-50/80 backdrop-blur-sm text-red-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-red-100 border border-red-100">
                  <DatabaseZap size={48} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">Database Error</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8 leading-relaxed">{dbError}</p>
              <button 
                onClick={loadInitialData}
                className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 flex items-center gap-2"
              >
                  <Activity size={18} /> Retry Connection
              </button>
          </div>
        )}

        {activeTab === 'directory' && (
          <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="p-8 border-b border-indigo-100/50 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-r from-white/40 to-indigo-50/20 dark:from-slate-800/40 dark:to-transparent">
                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-0 bg-indigo-200 opacity-0 group-focus-within:opacity-20 blur-xl transition-opacity rounded-2xl"></div>
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        className="w-full pl-12 pr-6 py-4 bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 rounded-2xl text-sm outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-100/50 dark:focus:ring-indigo-900/50 focus:border-indigo-200 dark:focus:border-indigo-800 transition-all font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => {
                        setEditingUserId(null);
                        setUserFormData({ name: '', email: '', mobile: '', role: 'Teacher', password: '', subjectId: '', staffPost: '' });
                        setActiveTab('registration');
                    }}
                    className="w-full md:w-auto flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 dark:shadow-none hover:shadow-indigo-300 hover:-translate-y-0.5"
                >
                    <UserPlus size={20} /> <span className="tracking-wide">Add User</span>
                </button>
            </div>

            {/* Glass Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[10px] font-black uppercase text-indigo-400 dark:text-indigo-300 tracking-widest border-b border-indigo-100/50 dark:border-slate-800 bg-indigo-50/30 dark:bg-slate-800/30">
                            <th className="p-6 pl-8">User Identity</th>
                            <th className="p-6">Role Access</th>
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
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-700 border border-white dark:border-slate-600 shadow-sm flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                                            <UserCircle size={28} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">{user.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{user.email}</p>
                                            <div className="flex gap-2 mt-1">
                                                {user.assignedSubject && (
                                                  <span className="text-[9px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-md font-bold uppercase border border-blue-100 dark:border-blue-800">Sub: {user.assignedSubject}</span>
                                                )}
                                                {user.staffPost && (
                                                  <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md font-bold uppercase border border-slate-200 dark:border-slate-700">{user.staffPost}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="relative group/select">
                                        <select 
                                            disabled={user.role === 'Super Admin'}
                                            className={clsx(
                                                "appearance-none border rounded-xl px-4 py-2 pr-8 text-xs font-bold outline-none transition-all cursor-pointer shadow-sm",
                                                user.role === 'Super Admin' 
                                                    ? "bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent cursor-not-allowed" 
                                                    : "bg-white/50 dark:bg-slate-800/50 border-white/60 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 focus:border-indigo-300 text-slate-700 dark:text-slate-200"
                                            )}
                                            value={user.role}
                                            onChange={(e) => handleUpdateUserRole(user.id, e.target.value as SystemRole)}
                                        >
                                            <option value="Super Admin">Super Admin</option>
                                            <option value="Principal">Principal</option>
                                            <option value="Admin">Admin</option>
                                            <option value="Teacher">Teacher</option>
                                            <option value="Office Staff">Office Staff</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover/select:text-indigo-500 transition-colors" size={14} />
                                    </div>
                                </td>
                                <td className="p-6">
                                    <span className={clsx(
                                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight border shadow-sm",
                                        user.status === 'Active' ? "bg-emerald-50/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800 backdrop-blur-sm" : "bg-red-50/50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800 backdrop-blur-sm"
                                    )}>
                                        <span className={clsx("w-1.5 h-1.5 rounded-full", user.status === 'Active' ? "bg-emerald-500" : "bg-red-500")}></span>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-700 dark:text-slate-200 font-bold">{user.lastLogin}</span>
                                        <span className="text-[10px] text-slate-400 font-medium opacity-70">Last login</span>
                                    </div>
                                </td>
                                <td className="p-6 pr-8 text-right">
                                    <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            disabled={user.role === 'Super Admin'}
                                            onClick={() => setPasswordModalUser(user)}
                                            title="Set Password"
                                            className={clsx(
                                                "p-2.5 rounded-xl transition-all border shadow-sm backdrop-blur-sm",
                                                user.role === 'Super Admin' ? "opacity-20 cursor-not-allowed bg-slate-50 dark:bg-slate-800" : "hover:scale-105 active:scale-95 bg-white/60 dark:bg-slate-800/60 border-white/60 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:border-amber-100"
                                            )}
                                        >
                                            <KeyRound size={18} />
                                        </button>
                                        <button 
                                            disabled={user.role === 'Super Admin'}
                                            onClick={() => handleEditUser(user)}
                                            title="Edit Profile"
                                            className={clsx(
                                                "p-2.5 rounded-xl transition-all border shadow-sm backdrop-blur-sm",
                                                user.role === 'Super Admin' ? "opacity-20 cursor-not-allowed bg-slate-50 dark:bg-slate-800" : "hover:scale-105 active:scale-95 bg-white/60 dark:bg-slate-800/60 border-white/60 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-100"
                                            )}
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button 
                                            disabled={user.role === 'Super Admin'}
                                            onClick={() => handleToggleUserStatus(user.id)}
                                            title={user.status === 'Active' ? 'Lock Account' : 'Unlock Account'}
                                            className={clsx(
                                                "p-2.5 rounded-xl transition-all border shadow-sm backdrop-blur-sm",
                                                user.role === 'Super Admin' ? "opacity-20 cursor-not-allowed bg-slate-50 dark:bg-slate-800" : "hover:scale-105 active:scale-95",
                                                user.status === 'Active' ? "bg-white/60 dark:bg-slate-800/60 border-white/60 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-100" : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 border-emerald-100 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                                            )}
                                        >
                                            {user.status === 'Active' ? <Lock size={18} /> : <Key size={18} />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!loading && filteredUsers.length === 0 && (
                    <div className="py-24 text-center flex flex-col items-center gap-4">
                        <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-full text-slate-300 dark:text-slate-600 shadow-inner">
                            <Search size={48} />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">No users found</p>
                        <p className="text-slate-400 dark:text-slate-500 text-sm">Try adjusting your search terms</p>
                    </div>
                )}
            </div>
          </div>
        )}

        {activeTab === 'registration' && (
          <div className="p-8 md:p-12 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
              <div className="mb-10 text-center">
                  <div className="inline-flex p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm border border-indigo-100 dark:border-indigo-800">
                      {editingUserId ? <UserCog size={32} /> : <Sparkles size={32} />}
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{editingUserId ? 'Edit Profile' : 'New User Registration'}</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">{editingUserId ? 'Update user details and permissions.' : 'Create a new account with specific role-based access.'}</p>
              </div>

              <form id="add-user-form" onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2 group">
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-1 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors">
                          <User size={14} /> Full Name
                      </label>
                      <input 
                        type="text" required
                        placeholder="e.g. Rahul Sharma"
                        className="w-full bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/10 rounded-2xl p-4 text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-100/50 dark:focus:ring-indigo-900/50 focus:border-indigo-300 dark:focus:border-indigo-700 outline-none transition-all font-bold text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm"
                        value={userFormData.name}
                        onChange={(e) => setUserFormData({...userFormData, name: e.target.value})}
                      />
                  </div>
                  <div className="space-y-2 group">
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-1 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors">
                          <Mail size={14} /> Email Address
                      </label>
                      <input 
                        type="email" required
                        disabled={!!editingUserId}
                        placeholder="rahul@example.com"
                        className={clsx(
                            "w-full border rounded-2xl p-4 text-sm outline-none transition-all font-bold shadow-sm",
                            editingUserId 
                                ? "bg-slate-50 dark:bg-slate-900 text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-800" 
                                : "bg-white/50 dark:bg-slate-800/50 border-white/60 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-100/50 dark:focus:ring-indigo-900/50 focus:border-indigo-300 dark:focus:border-indigo-700 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                        )}
                        value={userFormData.email}
                        onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                      />
                  </div>
                  <div className="space-y-2 group">
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-1 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors">
                          <Phone size={14} /> Mobile Number
                      </label>
                      <input 
                        type="tel" required
                        placeholder="+91 00000 00000"
                        className="w-full bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/10 rounded-2xl p-4 text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-100/50 dark:focus:ring-indigo-900/50 focus:border-indigo-300 dark:focus:border-indigo-700 outline-none transition-all font-bold text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm"
                        value={userFormData.mobile}
                        onChange={(e) => setUserFormData({...userFormData, mobile: e.target.value})}
                      />
                  </div>
                  <div className="space-y-2 group">
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-1 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors">
                          <ShieldCheck size={14} /> System Role
                      </label>
                      <div className="relative">
                          <select 
                            className="w-full bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/10 rounded-2xl p-4 text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-100/50 dark:focus:ring-indigo-900/50 focus:border-indigo-300 dark:focus:border-indigo-700 outline-none transition-all font-bold text-slate-800 dark:text-slate-200 appearance-none cursor-pointer shadow-sm"
                            value={userFormData.role}
                            onChange={(e) => setUserFormData({...userFormData, role: e.target.value as SystemRole, subjectId: '', staffPost: ''})}
                          >
                              <option value="Teacher">Teacher</option>
                              <option value="Admin">Admin</option>
                              <option value="Office Staff">Office Staff</option>
                              <option value="Principal">Principal</option>
                              <option value="Super Admin">Super Admin</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400" size={18} />
                      </div>
                  </div>

                  {/* Conditional Fields */}
                  {userFormData.role === 'Teacher' && (
                    <div className="space-y-2 md:col-span-2 animate-in fade-in slide-in-from-top-4 duration-500 group">
                        <label className="block text-xs font-black text-blue-400 dark:text-blue-500 uppercase tracking-widest flex items-center gap-1.5 ml-1 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">
                            <BookOpen size={14} /> Assign Subject
                        </label>
                        <div className="relative">
                            <select 
                                required
                                className="w-full bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-300 dark:focus:border-blue-700 outline-none transition-all font-bold text-blue-900 dark:text-blue-200 appearance-none cursor-pointer shadow-sm"
                                value={userFormData.subjectId}
                                onChange={(e) => setUserFormData({...userFormData, subjectId: e.target.value})}
                            >
                                <option value="" disabled>Select Subject...</option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 dark:text-blue-500 pointer-events-none" size={18} />
                        </div>
                    </div>
                  )}

                  {userFormData.role === 'Office Staff' && (
                    <div className="space-y-2 md:col-span-2 animate-in fade-in slide-in-from-top-4 duration-500 group">
                        <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-1 group-focus-within:text-slate-600 dark:group-focus-within:text-slate-400 transition-colors">
                            <Briefcase size={14} /> Designation
                        </label>
                        <input 
                            type="text" required
                            placeholder="e.g. Administrator, Clerk"
                            className="w-full bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/10 rounded-2xl p-4 text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-700 focus:border-slate-300 dark:focus:border-slate-600 outline-none transition-all font-bold text-slate-800 dark:text-slate-200 shadow-sm"
                            value={userFormData.staffPost}
                            onChange={(e) => setUserFormData({...userFormData, staffPost: e.target.value})}
                        />
                    </div>
                  )}

                  {!editingUserId && (
                    <div className="space-y-2 md:col-span-2 group">
                        <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 ml-1 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors">
                            <Key size={14} /> Master Password
                        </label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} required
                                placeholder="Min. 8 characters"
                                className="w-full bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-white/10 rounded-2xl p-4 text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-100/50 dark:focus:ring-indigo-900/50 focus:border-indigo-300 dark:focus:border-indigo-700 outline-none transition-all font-bold text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm"
                                value={userFormData.password}
                                onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                  )}

                  <div className="md:col-span-2 pt-2">
                      <button 
                        type="submit"
                        disabled={saving}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-200 dark:shadow-none hover:shadow-indigo-300 hover:-translate-y-1 disabled:opacity-50 disabled:translate-y-0 text-lg relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        {saving ? <Loader2 className="animate-spin" size={24} /> : editingUserId ? <Save size={24} /> : <UserPlus size={24} />} 
                        <span className="relative">{editingUserId ? 'Update User Profile' : 'Create System Account'}</span>
                      </button>
                      {editingUserId && (
                          <button 
                            type="button"
                            onClick={() => { setEditingUserId(null); setUserFormData({ name: '', email: '', mobile: '', role: 'Teacher', password: '', subjectId: '', staffPost: '' }); setActiveTab('directory'); }}
                            className="w-full mt-4 text-slate-400 hover:text-red-500 font-bold text-sm transition-colors"
                          >
                              Cancel & Return to Directory
                          </button>
                      )}
                  </div>
              </form>
          </div>
        )}

        {activeTab === 'activity' && (
            <div className="flex flex-col min-h-[400px]">
                <div className="p-8 border-b border-indigo-100/50 dark:border-slate-800 bg-gradient-to-b from-white/40 to-transparent dark:from-slate-800/40">
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400"><Clock size={20} /></div>
                        System Audit Logs
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 ml-12">Track login history and critical system actions.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black uppercase text-indigo-400 dark:text-indigo-300 tracking-widest border-b border-indigo-100/50 dark:border-slate-800">
                                <th className="p-6 pl-8 bg-indigo-50/30 dark:bg-slate-800/30">User</th>
                                <th className="p-6 bg-indigo-50/30 dark:bg-slate-800/30">Event</th>
                                <th className="p-6 bg-indigo-50/30 dark:bg-slate-800/30">IP Source</th>
                                <th className="p-6 pr-8 text-right bg-indigo-50/30 dark:bg-slate-800/30">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-50/50 dark:divide-slate-800">
                            {activityLogs.map(log => (
                                <tr key={log.id} className="hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors">
                                    <td className="p-6 pl-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 border border-white dark:border-slate-600 shadow-sm flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold text-xs">
                                                {log.userName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{log.userName}</p>
                                                <p className="text-[10px] text-indigo-500 dark:text-indigo-400 uppercase font-black tracking-tight">{log.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="space-y-1">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 border border-indigo-50 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm uppercase tracking-tight">
                                                {log.action}
                                            </span>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium ml-1">{log.details}</p>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 w-fit px-3 py-1 rounded-lg border border-white/50 dark:border-slate-700">
                                            <Globe size={12} />
                                            <span className="text-xs font-mono font-bold">{log.ipAddress}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 pr-8 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{new Date(log.timestamp).toLocaleDateString()}</span>
                                            <span className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {activityLogs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="p-16 text-center text-slate-400 text-sm italic">
                                        No recent activity recorded.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>

      {/* Glass Password Modal */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-950/40 dark:bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border border-white/60 dark:border-slate-700">
                <div className="p-6 border-b border-indigo-50/50 dark:border-slate-800 flex justify-between items-center bg-white/40 dark:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-2.5 rounded-xl text-amber-600 dark:text-amber-400 shadow-sm">
                            <KeyRound size={20} />
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Set Password</h3>
                    </div>
                    <button onClick={() => setPasswordModalUser(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-white/50 dark:hover:bg-slate-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSetPassword} className="p-8 space-y-6">
                    <div className="text-center mb-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Updating Credentials For</p>
                        <p className="text-xl font-black text-slate-800 dark:text-white">{passwordModalUser.name}</p>
                    </div>

                    <div className="space-y-2 group">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors">New Password</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors">
                                <Lock size={18} />
                            </div>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                required
                                minLength={6}
                                placeholder="Enter new password"
                                className="w-full pl-12 pr-12 py-4 bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-100/50 dark:focus:ring-indigo-900/50 focus:border-indigo-300 dark:focus:border-indigo-700 transition-all font-bold shadow-inner"
                                value={manualPassword}
                                onChange={(e) => setManualPassword(e.target.value)}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={isUpdatingPassword || !manualPassword}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 hover:-translate-y-0.5"
                    >
                        {isUpdatingPassword ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                        {isUpdatingPassword ? 'Updating...' : 'Confirm Update'}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
