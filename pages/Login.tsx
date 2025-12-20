
import React, { useState, useEffect } from 'react';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, Database, Info, User, UserPlus, BookOpen, ChevronDown, Briefcase } from 'lucide-react';
import { DataService } from '../services/dataService';
import { useToast } from '../components/ToastContext';
import { Subject } from '../types';
import clsx from 'clsx';

interface LoginProps {
    onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<'Super Admin' | 'Principal' | 'Teacher' | 'Office Staff' | 'Admin'>('Teacher');
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [staffPost, setStaffPost] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        const loadSubjects = async () => {
            try {
                const data = await DataService.getSubjects();
                setSubjects(data);
            } catch (e) {
                console.error("Failed to load subjects for signup", e);
            }
        };
        loadSubjects();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (mode === 'login') {
                await DataService.signIn(email, password);
                showToast("Welcome to Unacademy", "success");
                onLoginSuccess();
            } else {
                await DataService.signUp({
                    email,
                    password,
                    name: fullName,
                    role,
                    subjectId: role === 'Teacher' ? selectedSubjectId : undefined,
                    staffPost: role === 'Office Staff' ? staffPost : undefined
                });
                showToast("Account created! You can now sign in.", "success");
                setMode('login');
            }
        } catch (err: any) {
            console.error(err);
            showToast(err.message || "Operation failed", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-10">
                    <div className="inline-flex p-4 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl shadow-2xl shadow-indigo-500/40 text-white mb-6">
                        <GraduationCap size={48} />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase">Unacademy</h1>
                    <p className="text-slate-400 mt-2 font-medium">Exam Result Management System</p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                        {mode === 'login' ? 'Secure Authentication' : 'Member Registration'}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                        {mode === 'signup' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="e.g. John Doe"
                                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-medium placeholder:text-slate-600"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Work Email</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input 
                                    type="email" 
                                    required
                                    placeholder="admin@school.com"
                                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-medium placeholder:text-slate-600"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {mode === 'signup' && (
                            <>
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Initial Role</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                            <ShieldCheck size={18} />
                                        </div>
                                        <select 
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-medium appearance-none"
                                            value={role}
                                            onChange={(e) => setRole(e.target.value as any)}
                                        >
                                            <option value="Teacher" className="bg-slate-900">Teacher</option>
                                            <option value="Admin" className="bg-slate-900">Admin</option>
                                            <option value="Office Staff" className="bg-slate-900">Office Staff</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                            <ChevronDown size={18} />
                                        </div>
                                    </div>
                                </div>

                                {role === 'Teacher' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Assigned Subject</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                                <BookOpen size={18} />
                                            </div>
                                            <select 
                                                className="w-full pl-12 pr-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-medium appearance-none"
                                                value={selectedSubjectId}
                                                onChange={(e) => setSelectedSubjectId(e.target.value)}
                                                required={role === 'Teacher'}
                                            >
                                                <option value="" disabled className="bg-slate-900">Choose subject...</option>
                                                {subjects.map(s => (
                                                    <option key={s.id} value={s.id} className="bg-slate-900">{s.name} ({s.code})</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                                <ChevronDown size={18} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {role === 'Office Staff' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Designation / Post</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                                <Briefcase size={18} />
                                            </div>
                                            <input 
                                                type="text" 
                                                required
                                                placeholder="e.g. Administrator, Clerk"
                                                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-medium placeholder:text-slate-600"
                                                value={staffPost}
                                                onChange={(e) => setStaffPost(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Password</label>
                                {mode === 'login' && <button type="button" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Forgot Password?</button>}
                            </div>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all font-medium placeholder:text-slate-600"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                <>
                                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                                    {mode === 'login' ? <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /> : <UserPlus size={20} />}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button 
                            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                            className="text-sm font-bold text-slate-400 hover:text-indigo-400 transition-colors"
                        >
                            {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                        </button>
                    </div>

                    {/* Demo Credentials Help - Only show in login mode */}
                    {mode === 'login' && (
                        <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex gap-3 animate-pulse">
                            <Info size={18} className="text-indigo-400 shrink-0" />
                            <div>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Demo Credentials</p>
                                <p className="text-xs text-slate-300">Email: <b>admin@unacademy.com</b></p>
                                <p className="text-xs text-slate-300">Password: <b>admin123</b></p>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-white/5 flex flex-col gap-4">
                        <div className="flex items-center gap-3 text-slate-500">
                            <ShieldCheck size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encrypted Data</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500">
                            <Database size={14} className="text-blue-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Real-time Cloud Sync Enabled</span>
                        </div>
                    </div>
                </div>

                <p className="text-center mt-8 text-slate-500 text-xs font-medium">
                    &copy; {new Date().getFullYear()} Unacademy Academic Systems. All rights reserved.
                </p>
            </div>
        </div>
    );
};
