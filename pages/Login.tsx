
import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, Database, User, UserPlus, BookOpen, ChevronDown, Briefcase, KeyRound, ArrowLeft } from 'lucide-react';
import { DataService } from '../services/dataService';
import { useToast } from '../components/ToastContext';
import { Subject, UserProfile } from '../types';
import clsx from 'clsx';

interface LoginProps {
    onLoginSuccess: (user: UserProfile) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
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
                const user = await DataService.signIn(email, password);
                showToast("Welcome to Unacademy", "success");
                onLoginSuccess(user);
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

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await DataService.resetPassword(email);
            showToast("Password reset link sent to your email", "success");
            setMode('login');
        } catch (err: any) {
            showToast(err.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Responsive Quantum Styles
    const styles = {
        bg: 'bg-slate-50 dark:bg-[#020617]',
        card: 'bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-cyan-800 shadow-xl dark:shadow-[0_0_30px_rgba(6,182,212,0.15)] text-slate-800 dark:text-cyan-400',
        input: 'bg-slate-50 dark:bg-[#050505] border border-slate-300 dark:border-cyan-900/50 text-slate-900 dark:text-cyan-300 focus:border-indigo-500 dark:focus:border-cyan-500 focus:shadow-lg rounded-none',
        button: 'bg-indigo-600 dark:bg-cyan-950/50 border border-transparent dark:border-cyan-500 text-white dark:text-cyan-300 hover:bg-indigo-700 dark:hover:bg-cyan-500 dark:hover:text-black hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]',
        text: 'text-slate-600 dark:text-cyan-700',
        accent: 'text-indigo-600 dark:text-cyan-400',
        badge: 'bg-indigo-100 dark:bg-cyan-950 text-indigo-700 dark:text-cyan-400 border border-indigo-200 dark:border-cyan-500'
    };

    return (
        <div className={clsx("min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500", styles.bg)}>
            {/* Background Decorative Elements */}
            <div className={clsx("absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse bg-indigo-200/40 dark:bg-cyan-900/20")}></div>
            <div className={clsx("absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 bg-blue-200/40 dark:bg-blue-900/10")}></div>

            <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500 relative z-10">
                <div className="text-center mb-10">
                    <div className={clsx("inline-flex p-4 rounded-3xl shadow-2xl mb-6", styles.card)}>
                        <img 
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Unacademy_Logo.png/600px-Unacademy_Logo.png" 
                            alt="Unacademy" 
                            className="w-12 h-12 object-contain drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" 
                        />
                    </div>
                    <h1 className={clsx("text-4xl font-black tracking-tight uppercase drop-shadow-md", styles.accent)}>Unacademy</h1>
                    <p className={clsx("mt-2 font-medium", styles.text)}>Exam Result Management System</p>
                </div>

                <div className={clsx("rounded-[32px] p-8 shadow-2xl relative transition-all", styles.card)}>
                    <div className={clsx("absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg", 
                        styles.badge
                    )}>
                        {mode === 'login' ? 'Secure Authentication' : mode === 'signup' ? 'Member Registration' : 'Account Recovery'}
                    </div>

                    {mode === 'forgot' ? (
                        <form onSubmit={handleReset} className="space-y-6 mt-4 animate-in fade-in slide-in-from-right duration-300">
                             <div className="text-center mb-4">
                                <div className={clsx("w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors border-2 border-transparent", styles.input)}>
                                    <KeyRound size={32} className={clsx(styles.accent)} />
                                </div>
                                <p className={clsx("text-sm font-bold opacity-80", styles.text)}>
                                    Enter your registered email address. We'll send you a link to reset your password.
                                </p>
                             </div>
                             
                             <div className="space-y-2">
                                <label className={clsx("block text-xs font-black uppercase tracking-widest ml-1", styles.text)}>Email Address</label>
                                <div className="relative group">
                                    <div className={clsx("absolute left-4 top-1/2 -translate-y-1/2 transition-colors", styles.accent)}>
                                        <Mail size={18} />
                                    </div>
                                    <input 
                                        type="email" 
                                        required
                                        placeholder="admin@school.com"
                                        className={clsx("w-full pl-12 pr-4 py-4 rounded-2xl outline-none transition-all font-medium", styles.input)}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className={clsx("w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group", styles.button)}
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin" size={24} />
                                ) : (
                                    <>
                                        Send Reset Link <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            <button 
                                type="button"
                                onClick={() => setMode('login')}
                                className={clsx("w-full py-2 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 hover:opacity-80", styles.accent)}
                            >
                                <ArrowLeft size={14} /> Back to Login
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                            {mode === 'signup' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className={clsx("block text-xs font-black uppercase tracking-widest ml-1", styles.text)}>Full Name</label>
                                    <div className="relative group">
                                        <div className={clsx("absolute left-4 top-1/2 -translate-y-1/2 transition-colors", styles.accent)}>
                                            <User size={18} />
                                        </div>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder="e.g. John Doe"
                                            className={clsx("w-full pl-12 pr-4 py-4 rounded-2xl outline-none transition-all font-medium", styles.input)}
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className={clsx("block text-xs font-black uppercase tracking-widest ml-1", styles.text)}>Work Email</label>
                                <div className="relative group">
                                    <div className={clsx("absolute left-4 top-1/2 -translate-y-1/2 transition-colors", styles.accent)}>
                                        <Mail size={18} />
                                    </div>
                                    <input 
                                        type="email" 
                                        required
                                        placeholder="admin@school.com"
                                        className={clsx("w-full pl-12 pr-4 py-4 rounded-2xl outline-none transition-all font-medium", styles.input)}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {mode === 'signup' && (
                                <>
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <label className={clsx("block text-xs font-black uppercase tracking-widest ml-1", styles.text)}>Initial Role</label>
                                        <div className="relative group">
                                            <div className={clsx("absolute left-4 top-1/2 -translate-y-1/2 transition-colors", styles.accent)}>
                                                <ShieldCheck size={18} />
                                            </div>
                                            <select 
                                                className={clsx("w-full pl-12 pr-4 py-4 rounded-2xl outline-none transition-all font-medium appearance-none", styles.input)}
                                                value={role}
                                                onChange={(e) => setRole(e.target.value as any)}
                                            >
                                                <option value="Teacher" className="text-black dark:text-white">Teacher</option>
                                                <option value="Admin" className="text-black dark:text-white">Admin</option>
                                                <option value="Office Staff" className="text-black dark:text-white">Office Staff</option>
                                            </select>
                                            <div className={clsx("absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none", styles.text)}>
                                                <ChevronDown size={18} />
                                            </div>
                                        </div>
                                    </div>

                                    {role === 'Teacher' && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className={clsx("block text-xs font-black uppercase tracking-widest ml-1", styles.text)}>Assigned Subject</label>
                                            <div className="relative group">
                                                <div className={clsx("absolute left-4 top-1/2 -translate-y-1/2 transition-colors", styles.accent)}>
                                                    <BookOpen size={18} />
                                                </div>
                                                <select 
                                                    className={clsx("w-full pl-12 pr-10 py-4 rounded-2xl outline-none transition-all font-medium appearance-none", styles.input)}
                                                    value={selectedSubjectId}
                                                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                                                    required={role === 'Teacher'}
                                                >
                                                    <option value="" disabled className="text-black dark:text-white">Choose subject...</option>
                                                    {subjects.map(s => (
                                                        <option key={s.id} value={s.id} className="text-black dark:text-white">{s.name} ({s.code})</option>
                                                    ))}
                                                </select>
                                                <div className={clsx("absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none", styles.text)}>
                                                    <ChevronDown size={18} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {role === 'Office Staff' && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className={clsx("block text-xs font-black uppercase tracking-widest ml-1", styles.text)}>Designation</label>
                                            <div className="relative group">
                                                <div className={clsx("absolute left-4 top-1/2 -translate-y-1/2 transition-colors", styles.accent)}>
                                                    <Briefcase size={18} />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    required
                                                    placeholder="e.g. Administrator, Clerk"
                                                    className={clsx("w-full pl-12 pr-4 py-4 rounded-2xl outline-none transition-all font-medium", styles.input)}
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
                                    <label className={clsx("block text-xs font-black uppercase tracking-widest", styles.text)}>Password</label>
                                    {mode === 'login' && (
                                        <button 
                                            type="button" 
                                            onClick={() => setMode('forgot')}
                                            className={clsx("text-[10px] font-bold transition-colors hover:underline", styles.accent)}
                                        >
                                            Forgot Password?
                                        </button>
                                    )}
                                </div>
                                <div className="relative group">
                                    <div className={clsx("absolute left-4 top-1/2 -translate-y-1/2 transition-colors", styles.accent)}>
                                        <Lock size={18} />
                                    </div>
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        required
                                        placeholder="••••••••"
                                        className={clsx("w-full pl-12 pr-12 py-4 rounded-2xl outline-none transition-all font-medium", styles.input)}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className={clsx("absolute right-4 top-1/2 -translate-y-1/2 transition-colors", styles.text)}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className={clsx("w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group", styles.button)}
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
                    )}

                    <div className="mt-6 text-center">
                        {mode !== 'forgot' && (
                            <button 
                                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                                className={clsx("text-sm font-bold transition-colors", styles.accent)}
                            >
                                {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                            </button>
                        )}
                    </div>

                    <div className={clsx("mt-6 pt-6 border-t flex flex-col gap-4 border-slate-200 dark:border-cyan-900/30")}>
                        <div className={clsx("flex items-center gap-3", styles.text, "opacity-70")}>
                            <ShieldCheck size={14} className='text-indigo-500 dark:text-cyan-500' />
                            <span className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encrypted Data</span>
                        </div>
                        <div className={clsx("flex items-center gap-3", styles.text, "opacity-70")}>
                            <Database size={14} className='text-indigo-500 dark:text-cyan-500' />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Real-time Cloud Sync Enabled</span>
                        </div>
                    </div>
                </div>

                <p className={clsx("text-center mt-8 text-xs font-medium opacity-60", styles.text)}>
                    &copy; {new Date().getFullYear()} Unacademy Academic Systems. All rights reserved.
                </p>
            </div>
        </div>
    );
};
