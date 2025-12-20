
import React, { useState, useEffect } from 'react';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, Database, User, UserPlus, BookOpen, ChevronDown, Briefcase, Zap, KeyRound, ArrowLeft } from 'lucide-react';
import { DataService } from '../services/dataService';
import { useToast } from '../components/ToastContext';
import { Subject } from '../types';
import { useTheme } from '../components/ThemeContext';
import clsx from 'clsx';

interface LoginProps {
    onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const { theme } = useTheme();
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

    const getLoginStyles = () => {
        const systemPresets = [
            'neumorphism', 'neo', 'brutalism', 'glassmorphism', 'minimalist', 'quantum',
            'professional', '3d', 'animated', 'gradients', 'micro', 'asymmetric', 'vivid', 'lumen', 'aura'
        ];
        
        if (systemPresets.includes(theme)) {
            switch(theme) {
                case 'neumorphism': return {
                    bg: 'bg-[#E0E5EC] dark:bg-[#2A2A2A]',
                    card: 'bg-[#E0E5EC] dark:bg-[#2A2A2A] shadow-[20px_20px_60px_#bebebe,-20px_-20px_60px_#ffffff] dark:shadow-[15px_15px_30px_#1a1a1a,-15px_-15px_30px_#3a3a3a] border-none text-slate-700 dark:text-slate-200',
                    input: 'bg-[#E0E5EC] dark:bg-[#2A2A2A] shadow-[inset_6px_6px_12px_#b8b9be,inset_-6px_-6px_12px_#ffffff] dark:shadow-[inset_5px_5px_10px_#1a1a1a,inset_-5px_-5px_10px_#3a3a3a] border-none text-slate-700 dark:text-white',
                    button: 'bg-[#E0E5EC] dark:bg-[#2A2A2A] shadow-[6px_6px_12px_#b8b9be,-6px_-6px_12px_#ffffff] dark:shadow-[5px_5px_10px_#1a1a1a,-5px_-5px_10px_#3a3a3a] text-indigo-600 dark:text-indigo-400 hover:scale-[0.98] transition-transform',
                    text: 'text-slate-600 dark:text-slate-300',
                    accent: 'text-indigo-500'
                };
                case 'neo': return {
                    bg: 'bg-black',
                    card: 'bg-black border border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] text-green-500',
                    input: 'bg-black border border-green-800 text-green-400 focus:border-green-500 focus:shadow-[0_0_10px_rgba(34,197,94,0.5)] rounded-none',
                    button: 'bg-green-900/30 border border-green-500 text-green-400 hover:bg-green-500 hover:text-black rounded-none',
                    text: 'text-green-600',
                    accent: 'text-green-400'
                };
                case 'brutalism': return {
                    bg: 'bg-[#FFDE59] dark:bg-[#4338ca]',
                    card: 'bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] text-black',
                    input: 'bg-white border-2 border-black text-black font-bold focus:shadow-[4px_4px_0px_0px_#000000] rounded-none',
                    button: 'bg-black text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none rounded-none font-black uppercase',
                    text: 'text-black',
                    accent: 'text-black'
                };
                case 'glassmorphism': return {
                    bg: 'bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-slate-900 dark:via-purple-900/20 dark:to-slate-900',
                    card: 'bg-white/20 dark:bg-black/30 backdrop-blur-xl border border-white/30 shadow-xl text-slate-800 dark:text-white',
                    input: 'bg-white/40 dark:bg-black/20 border border-white/30 text-slate-800 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400',
                    button: 'bg-indigo-600/80 hover:bg-indigo-600 text-white backdrop-blur-sm shadow-lg',
                    text: 'text-slate-600 dark:text-slate-300',
                    accent: 'text-indigo-600 dark:text-indigo-400'
                };
                case 'minimalist': return {
                    bg: 'bg-white dark:bg-black',
                    card: 'bg-white dark:bg-black border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white',
                    input: 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-slate-400 rounded-none',
                    button: 'bg-black dark:bg-white text-white dark:text-black rounded-none hover:opacity-80',
                    text: 'text-slate-500 dark:text-slate-400',
                    accent: 'text-black dark:text-white'
                };
                case 'quantum': return {
                    bg: 'bg-[#020617]',
                    card: 'bg-[#0a0a0a] border border-cyan-800 shadow-[0_0_30px_rgba(6,182,212,0.15)] text-cyan-400',
                    input: 'bg-[#050505] border border-cyan-900/50 text-cyan-300 focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)]',
                    button: 'bg-cyan-950/50 border border-cyan-500 text-cyan-300 hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]',
                    text: 'text-cyan-700',
                    accent: 'text-cyan-400'
                };
                case 'professional': return {
                    bg: 'bg-slate-50 dark:bg-slate-900',
                    card: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl text-slate-700 dark:text-slate-200',
                    input: 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-600 focus:border-transparent',
                    button: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 dark:shadow-none',
                    text: 'text-slate-600 dark:text-slate-400',
                    accent: 'text-blue-600'
                };
                case '3d': return {
                    bg: 'bg-[#d1d5db] dark:bg-[#1f2937]',
                    card: 'bg-[#e5e7eb] dark:bg-[#374151] border-2 border-slate-400 dark:border-slate-600 shadow-[8px_8px_0px_rgba(0,0,0,0.15)] text-slate-800 dark:text-white',
                    input: 'bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 focus:shadow-[4px_4px_0px_rgba(0,0,0,0.1)] transition-all',
                    button: 'bg-indigo-600 text-white border-2 border-indigo-800 shadow-[0_4px_0_rgb(55,48,163)] active:shadow-none active:translate-y-[4px] transition-all',
                    text: 'text-slate-700 dark:text-slate-300',
                    accent: 'text-indigo-700 dark:text-indigo-400'
                };
                case 'animated': return {
                    bg: 'bg-slate-900',
                    card: 'bg-slate-800/80 backdrop-blur border border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.2)] text-white',
                    input: 'bg-slate-900/50 border border-indigo-500/30 text-indigo-100 focus:bg-slate-900 focus:border-indigo-400 focus:shadow-[0_0_15px_rgba(99,102,241,0.3)]',
                    button: 'bg-indigo-600 hover:bg-indigo-500 text-white animate-pulse hover:animate-none shadow-[0_0_20px_indigo]',
                    text: 'text-indigo-200',
                    accent: 'text-indigo-400'
                };
                case 'gradients': return {
                    bg: 'bg-gradient-to-tr from-violet-600 via-indigo-500 to-purple-500',
                    card: 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border-none text-slate-800 dark:text-white',
                    input: 'bg-slate-50 dark:bg-slate-800 border-none ring-2 ring-transparent focus:ring-violet-500',
                    button: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg',
                    text: 'text-slate-500 dark:text-slate-400',
                    accent: 'text-violet-600'
                };
                case 'micro': return {
                    bg: 'bg-slate-50 dark:bg-slate-950',
                    card: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-600 dark:text-slate-400',
                    input: 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono focus:border-black dark:focus:border-white rounded-md',
                    button: 'bg-black dark:bg-white text-white dark:text-black text-xs uppercase tracking-widest hover:opacity-80 rounded-md border border-transparent',
                    text: 'text-slate-500 text-xs',
                    accent: 'text-black dark:text-white'
                };
                case 'asymmetric': return {
                    bg: 'bg-stone-100 dark:bg-stone-900',
                    card: 'bg-white dark:bg-stone-800 rounded-tr-[3rem] rounded-bl-[3rem] shadow-xl border-none text-stone-800 dark:text-stone-100',
                    input: 'bg-stone-50 dark:bg-stone-900/50 border-b-2 border-stone-300 dark:border-stone-600 focus:border-stone-600 dark:focus:border-stone-400 rounded-t-lg',
                    button: 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 rounded-tl-xl rounded-br-xl hover:rounded-xl transition-all duration-300',
                    text: 'text-stone-500 dark:text-stone-400',
                    accent: 'text-stone-700 dark:text-stone-300'
                };
                case 'vivid': return {
                    bg: 'bg-fuchsia-900',
                    card: 'bg-fuchsia-950 border-2 border-fuchsia-500 shadow-[8px_8px_0px_#d946ef] text-fuchsia-50',
                    input: 'bg-fuchsia-900 border border-fuchsia-400 text-fuchsia-100 placeholder:text-fuchsia-400/70 focus:bg-fuchsia-800',
                    button: 'bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-black uppercase tracking-wider shadow-[4px_4px_0px_white]',
                    text: 'text-fuchsia-200',
                    accent: 'text-fuchsia-300'
                };
                case 'lumen': return {
                    bg: 'bg-[#F0F2F5] dark:bg-[#18191A]',
                    card: 'bg-white dark:bg-[#242526] shadow-lg border-t-4 border-blue-500 text-slate-700 dark:text-slate-200',
                    input: 'bg-slate-50 dark:bg-[#3A3B3C] border border-slate-200 dark:border-[#3A3B3C] rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900',
                    button: 'bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold',
                    text: 'text-slate-500 dark:text-slate-400',
                    accent: 'text-blue-500'
                };
                case 'aura': return {
                    bg: 'bg-slate-950',
                    card: 'bg-slate-900/80 border border-indigo-500/40 shadow-[0_0_50px_rgba(79,70,229,0.15)] text-indigo-50',
                    input: 'bg-slate-950/50 border border-indigo-500/30 text-indigo-100 focus:border-indigo-400 focus:shadow-[0_0_15px_rgba(129,140,248,0.2)] rounded-xl',
                    button: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] transition-all',
                    text: 'text-slate-400',
                    accent: 'text-indigo-400'
                };
            }
        }

        // Default or Custom Theme (Using CSS Variables)
        return {
            bg: 'bg-[var(--bg-background)]', 
            card: 'bg-[var(--bg-surface)] shadow-2xl border border-[var(--border-color)] text-[var(--text-main)] backdrop-blur-[var(--surface-blur)]',
            input: 'bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] placeholder-[var(--text-secondary)] focus:border-[var(--color-primary)] ring-0 focus:ring-2 focus:ring-[var(--color-primary)]/20',
            button: 'bg-[var(--bg-button)] hover:brightness-90 text-[var(--text-button)] shadow-md',
            text: 'text-[var(--text-secondary)]',
            accent: 'text-[var(--color-primary)]'
        };
    };

    const styles = getLoginStyles();

    return (
        <div className={clsx("min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500", styles.bg)}>
            {/* Background Decorative Elements - Theme Adaptive */}
            {theme === 'neo' && <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>}
            
            <div className={clsx("absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse", theme === 'neo' ? "bg-green-900/20" : theme === 'quantum' ? "bg-cyan-900/20" : "bg-indigo-500/10 dark:bg-indigo-500/10")}></div>
            <div className={clsx("absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2", theme === 'neo' ? "bg-green-900/10" : theme === 'quantum' ? "bg-blue-900/10" : "bg-purple-500/10 dark:bg-purple-500/10")}></div>

            <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500 relative z-10">
                <div className="text-center mb-10">
                    <div className={clsx("inline-flex p-4 rounded-3xl shadow-2xl mb-6", styles.card, theme === 'neumorphism' ? "rounded-full" : "")}>
                        <GraduationCap size={48} className={styles.accent} />
                    </div>
                    <h1 className={clsx("text-4xl font-black tracking-tight uppercase drop-shadow-md", styles.accent)}>Unacademy</h1>
                    <p className={clsx("mt-2 font-medium", styles.text)}>Exam Result Management System</p>
                </div>

                <div className={clsx("rounded-[32px] p-8 shadow-2xl relative transition-all", styles.card)}>
                    <div className={clsx("absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg border", 
                        theme === 'brutalism' ? "bg-black text-white border-black" : 
                        theme === 'neo' ? "bg-black border-green-500 text-green-500" : 
                        theme === 'vivid' ? "bg-fuchsia-500 text-white border-fuchsia-400" :
                        "bg-[var(--color-primary)] text-white border-transparent"
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

                    <div className={clsx("mt-6 pt-6 border-t flex flex-col gap-4", theme === 'neumorphism' ? "border-slate-300" : "border-[var(--border-color)]/30")}>
                        <div className={clsx("flex items-center gap-3", styles.text, "opacity-70")}>
                            <ShieldCheck size={14} className={theme === 'neo' ? 'text-green-500' : 'text-[var(--color-primary)]'} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encrypted Data</span>
                        </div>
                        <div className={clsx("flex items-center gap-3", styles.text, "opacity-70")}>
                            <Database size={14} className={theme === 'neo' ? 'text-green-500' : 'text-[var(--color-primary)]'} />
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
