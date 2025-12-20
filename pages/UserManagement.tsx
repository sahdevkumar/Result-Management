
import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Save, Users, Key, AlertCircle, 
  CheckCircle2, Search, Lock, UserCircle, 
  Phone, Mail, User, Eye, EyeOff, ChevronDown, 
  BookOpen, Briefcase, Loader2, DatabaseZap, Pencil, KeyRound, X, Activity, UserCog, ShieldCheck, Clock, Globe
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                <UserCog size={28} />
            </div>
            User Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">Administer system accounts, assign roles, and manage user details.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-8 no-print">
        <button 
            onClick={() => handleTabChange('directory')}
            className={clsx(
                "pb-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 px-1 flex items-center gap-2",
                activeTab === 'directory' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
            )}
        >
            <Users size={16} /> System Users
        </button>
        <button 
            onClick={() => handleTabChange('registration')}
            className={clsx(
                "pb-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 px-1 flex items-center gap-2",
                activeTab === 'registration' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
            )}
        >
            <UserPlus size={16} /> {editingUserId ? 'Edit User Profile' : 'User Registration'}
        </button>
        <button 
            onClick={() => handleTabChange('activity')}
            className={clsx(
                "pb-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 px-1 flex items-center gap-2",
                activeTab === 'activity' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"
            )}
        >
            <Activity size={16} /> Activity Log
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[500px]">
        {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600 mb-2" size={48} />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Syncing database...</p>
            </div>
        )}

        {dbError && (
          <div className="absolute inset-0 z-[60] bg-white flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6">
                  <DatabaseZap size={48} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">Database Initialization Required</h2>
              <p className="text-slate-500 max-w-md mb-8">{dbError}</p>
              <button 
                onClick={loadInitialData}
                className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center gap-2"
              >
                  <Activity size={18} /> Retry Connection
              </button>
          </div>
        )}

        {activeTab === 'directory' && (
          <div className="flex flex-col min-h-[400px]">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name, email or role..." 
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
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
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-black transition-all shadow-lg shadow-slate-200"
                >
                    <UserPlus size={18} /> Add New User
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 bg-slate-50/30">
                            <th className="p-6">System User</th>
                            <th className="p-6">Access Profile</th>
                            <th className="p-6">Account Status</th>
                            <th className="p-6">Activity</th>
                            <th className="p-6 text-right">Access Controls</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner border border-indigo-100">
                                            <UserCircle size={26} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                                            <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                                            {user.assignedSubject && (
                                              <p className="text-[10px] text-blue-600 font-black uppercase mt-0.5">Sub: {user.assignedSubject}</p>
                                            )}
                                            {user.staffPost && (
                                              <p className="text-[10px] text-slate-600 font-black uppercase mt-0.5">Post: {user.staffPost}</p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <select 
                                        disabled={user.role === 'Super Admin'}
                                        className={clsx(
                                            "border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none transition-all",
                                            user.role === 'Super Admin' ? "bg-indigo-600 text-white border-transparent" : "bg-white text-slate-700 hover:bg-slate-50 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
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
                                </td>
                                <td className="p-6">
                                    <span className={clsx(
                                        "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight border",
                                        user.status === 'Active' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                                    )}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="p-6">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-700 font-bold">{user.lastLogin}</span>
                                        <span className="text-[10px] text-slate-400">Last login</span>
                                    </div>
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            disabled={user.role === 'Super Admin'}
                                            onClick={() => setPasswordModalUser(user)}
                                            title="Set Password Manually"
                                            className={clsx(
                                                "p-2.5 rounded-xl transition-all border shadow-sm",
                                                user.role === 'Super Admin' ? "opacity-20 cursor-not-allowed" : "hover:scale-105 active:scale-95 bg-white text-slate-400 hover:text-amber-600 hover:bg-amber-50 border-slate-200"
                                            )}
                                        >
                                            <KeyRound size={18} />
                                        </button>
                                        <button 
                                            disabled={user.role === 'Super Admin'}
                                            onClick={() => handleEditUser(user)}
                                            title="Modify User Profile"
                                            className={clsx(
                                                "p-2.5 rounded-xl transition-all border shadow-sm",
                                                user.role === 'Super Admin' ? "opacity-20 cursor-not-allowed" : "hover:scale-105 active:scale-95 bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border-slate-200"
                                            )}
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button 
                                            disabled={user.role === 'Super Admin'}
                                            onClick={() => handleToggleUserStatus(user.id)}
                                            title={user.status === 'Active' ? 'Lock Account' : 'Unlock Account'}
                                            className={clsx(
                                                "p-2.5 rounded-xl transition-all border shadow-sm",
                                                user.role === 'Super Admin' ? "opacity-20 cursor-not-allowed" : "hover:scale-105 active:scale-95",
                                                user.status === 'Active' ? "text-slate-400 bg-white border-slate-200 hover:text-red-600 hover:bg-red-50 hover:border-red-100" : "text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100"
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
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                        <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                            <Search size={48} />
                        </div>
                        <p className="text-slate-500 font-bold">No users match your search</p>
                    </div>
                )}
            </div>
          </div>
        )}

        {activeTab === 'registration' && (
          <div className="p-8 max-w-4xl mx-auto animate-in slide-in-from-bottom duration-300">
              <div className="mb-8 border-b border-slate-100 pb-4 flex justify-between items-center">
                  <div>
                      <h3 className="text-xl font-bold text-slate-800">{editingUserId ? 'Edit System User' : 'New User Registration'}</h3>
                      <p className="text-sm text-slate-500">{editingUserId ? 'Update profile information for an existing account' : 'Create a new system account with specific access privileges'}</p>
                  </div>
                  {editingUserId && (
                      <button 
                        onClick={() => { setEditingUserId(null); setUserFormData({ name: '', email: '', mobile: '', role: 'Teacher', password: '', subjectId: '', staffPost: '' }); }}
                        className="text-xs font-bold text-red-500 hover:underline"
                      >
                          Cancel Editing
                      </button>
                  )}
              </div>
              <form id="add-user-form" onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <User size={14} className="text-indigo-500" /> Full Name
                      </label>
                      <input 
                        type="text" required
                        placeholder="e.g. Rahul Sharma"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800"
                        value={userFormData.name}
                        onChange={(e) => setUserFormData({...userFormData, name: e.target.value})}
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Mail size={14} className="text-indigo-500" /> Email Address
                      </label>
                      <input 
                        type="email" required
                        disabled={!!editingUserId}
                        placeholder="rahul@example.com"
                        className={clsx(
                            "w-full border rounded-2xl p-3.5 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold",
                            editingUserId ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200" : "bg-slate-50 text-slate-800 border-slate-200"
                        )}
                        value={userFormData.email}
                        onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Phone size={14} className="text-indigo-500" /> Mobile Number
                      </label>
                      <input 
                        type="tel" required
                        placeholder="+91 00000 00000"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800"
                        value={userFormData.mobile}
                        onChange={(e) => setUserFormData({...userFormData, mobile: e.target.value})}
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-indigo-500" /> User Type / Role
                      </label>
                      <div className="relative">
                          <select 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800 appearance-none cursor-pointer"
                            value={userFormData.role}
                            onChange={(e) => setUserFormData({...userFormData, role: e.target.value as SystemRole, subjectId: '', staffPost: ''})}
                          >
                              <option value="Teacher">Teacher</option>
                              <option value="Admin">Admin</option>
                              <option value="Office Staff">Office Staff</option>
                              <option value="Principal">Principal</option>
                              <option value="Super Admin">Super Admin</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                      </div>
                  </div>

                  {/* Conditional Subject Field for Teacher */}
                  {userFormData.role === 'Teacher' && (
                    <div className="space-y-2 md:col-span-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <BookOpen size={14} className="text-blue-500" /> Assign Subject
                        </label>
                        <div className="relative">
                            <select 
                                required
                                className="w-full bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-blue-900 appearance-none cursor-pointer"
                                value={userFormData.subjectId}
                                onChange={(e) => setUserFormData({...userFormData, subjectId: e.target.value})}
                            >
                                <option value="" disabled>Select Subject to Manage...</option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" size={18} />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium ml-1">Teachers assigned to a subject can enter marks and remarks for that specific module.</p>
                    </div>
                  )}

                  {/* Conditional Staff Post Field for Office Staff */}
                  {userFormData.role === 'Office Staff' && (
                    <div className="space-y-2 md:col-span-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Briefcase size={14} className="text-slate-500" /> Staff Designation / Post
                        </label>
                        <input 
                            type="text" required
                            placeholder="e.g. Administrator, Clerk, Receptionist"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm focus:ring-4 focus:ring-slate-500/10 focus:border-slate-500 outline-none transition-all font-bold text-slate-800"
                            value={userFormData.staffPost}
                            onChange={(e) => setUserFormData({...userFormData, staffPost: e.target.value})}
                        />
                        <p className="text-[10px] text-slate-400 font-medium ml-1">Specify the official designation or department for this staff member.</p>
                    </div>
                  )}

                  {!editingUserId && (
                    <div className="space-y-2 md:col-span-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Key size={14} className="text-indigo-500" /> Account Password
                        </label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} required
                                placeholder="Min. 8 characters"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800"
                                value={userFormData.password}
                                onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                  )}

                  <div className="md:col-span-2 pt-4">
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 text-amber-700">
                          <AlertCircle className="shrink-0" size={18} />
                          <p className="text-xs leading-relaxed">
                              {editingUserId ? 'Updating user details will take effect immediately. Password changes must be initiated by the user via the recovery system.' : "Credentials will be sent to the user's email address upon creation. The password must be changed by the user during their first successful login session."}
                          </p>
                      </div>
                  </div>

                  <div className="md:col-span-2 pt-4 flex justify-end">
                      <button 
                        type="submit"
                        disabled={saving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 active:scale-95 text-lg"
                      >
                        {saving ? <Loader2 className="animate-spin" size={22} /> : editingUserId ? <Save size={22} /> : <UserPlus size={22} />} 
                        {editingUserId ? 'Update Profile' : 'Create System User'}
                      </button>
                  </div>
              </form>
          </div>
        )}

        {activeTab === 'activity' && (
            <div className="flex flex-col min-h-[400px]">
                <div className="p-6 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Clock size={18} className="text-slate-400" /> Recent System Events
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 bg-slate-50/30">
                                <th className="p-6">User</th>
                                <th className="p-6">Action & Details</th>
                                <th className="p-6">Network Info</th>
                                <th className="p-6 text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {activityLogs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs">
                                                {log.userName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{log.userName}</p>
                                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">{log.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="space-y-1">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-tight">
                                                {log.action}
                                            </span>
                                            <p className="text-xs text-slate-600 font-medium">{log.details}</p>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Globe size={14} />
                                            <span className="text-xs font-mono font-medium">{log.ipAddress}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-bold text-slate-700">{new Date(log.timestamp).toLocaleDateString()}</span>
                                            <span className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {activityLogs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate-400 text-sm italic">
                                        No activity logs available.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>

      {/* Set Password Modal */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-950/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                            <KeyRound size={20} />
                        </div>
                        <h3 className="font-bold text-lg text-slate-800">Set Password</h3>
                    </div>
                    <button onClick={() => setPasswordModalUser(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <form onSubmit={handleSetPassword} className="p-8 space-y-6">
                    <div className="text-center mb-2">
                        <p className="text-sm text-slate-500">Updating password for</p>
                        <p className="font-bold text-slate-800">{passwordModalUser.name}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                <Lock size={18} />
                            </div>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                required
                                minLength={6}
                                placeholder="Enter new password"
                                className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                                value={manualPassword}
                                onChange={(e) => setManualPassword(e.target.value)}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={isUpdatingPassword || !manualPassword}
                        className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
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
