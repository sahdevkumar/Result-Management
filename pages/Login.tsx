
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

    // Redesigned Quantum Styles
    const styles = {
        bg: 'bg-slate-50 dark:bg-[#020617]',
        card: 'bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-cyan-900/50 shadow-2xl dark:shadow-[0_0_40px_rgba(8,145,178,0.1)] backdrop-blur-xl',
        
        // Input Group Styles
        inputGroup: 'space-y-1.5 group',
        label: 'block text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400 dark:text-cyan-800 group-focus-within:text-indigo-600 dark:group-focus-within:text-cyan-400 transition-colors duration-300',
        inputWrapper: 'relative',
        input: 'w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-cyan-900/30 rounded-2xl outline-none text-sm font-bold text-slate-800 dark:text-cyan-100 placeholder:text-slate-400 dark:placeholder:text-cyan-900/50 focus:bg-white dark:focus:bg-slate-900/80 focus:border-indigo-500 dark:focus:border-cyan-400 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-cyan-400/10 transition-all duration-300 shadow-sm dark:shadow-none',
        inputIcon: 'absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-cyan-800 group-focus-within:text-indigo-600 dark:group-focus-within:text-cyan-400 transition-colors duration-300',
        
        // Button & Misc
        button: 'w-full py-4 bg-indigo-600 dark:bg-cyan-500 hover:bg-indigo-700 dark:hover:bg-cyan-400 text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all transform active:scale-[0.98] flex items-center justify-center gap-2',
        link: 'text-indigo-600 dark:text-cyan-500 hover:text-indigo-800 dark:hover:text-cyan-300 transition-colors font-bold text-[10px] uppercase tracking-wide',
        // Updated badge style: uses bg-slate-50 to avoid global bg-white glass override
        badge: 'absolute left-1/2 -translate-x-1/2 -top-3.5 z-20 bg-slate-50 dark:bg-[#0a0a0a] text-indigo-600 dark:text-cyan-400 border border-indigo-100 dark:border-cyan-800 shadow-[0_2px_10px_rgba(0,0,0,0.05)] px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap',
        text: 'text-slate-600 dark:text-cyan-700'
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
                    <h1 className="text-4xl font-black tracking-tight uppercase drop-shadow-md text-indigo-600 dark:text-cyan-400">Unacademy</h1>
                    <p className={clsx("mt-2 font-medium", styles.text)}>Exam Result Management System</p>
                </div>

                <div className="relative group">
                    {/* Badge positioned outside the card container for perfect layering */}
                    <div className={styles.badge}>
                        {mode === 'login' ? 'Secure Authentication' : mode === 'signup' ? 'Member Registration' : 'Account Recovery'}
                    </div>

                    <div className={clsx("rounded-[32px] p-8 transition-all", styles.card)}>
                        {mode === 'forgot' ? (
                            <form onSubmit={handleReset} className="space-y-6 mt-4 animate-in fade-in slide-in-from-right duration-300">
                                 <div className="text-center mb-4">
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors border-2 border-slate-100 dark:border-cyan-900/30 bg-slate-50 dark:bg-slate-900/30">
                                        <KeyRound size={32} className="text-indigo-600 dark:text-cyan-400" />
                                    </div>
                                    <p className={clsx("text-sm font-bold opacity-80", styles.text)}>
                                        Enter your registered email address. We'll send you a link to reset your password.
                                    </p>
                                 </div>
                                 
                                 <div className={styles.inputGroup}>
                                    <label className={styles.label}>Email Address</label>
                                    <div className={styles.inputWrapper}>
                                        <div className={styles.inputIcon}>
                                            <Mail size={18} />
                                        </div>
                                        <input 
                                            type="email" 
                                            required
                                            placeholder="admin@school.com"
                                            className={styles.input}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button type="submit" disabled={isLoading} className={styles.button}>
                                    {isLoading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <>Send Reset Link <ArrowRight size={18} /></>
                                    )}
                                </button>

                                <button 
                                    type="button"
                                    onClick={() => setMode('login')}
                                    className={clsx("w-full py-2 flex items-center justify-center gap-2 hover:opacity-80", styles.link)}
                                >
                                    <ArrowLeft size={14} /> Back to Login
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                                {mode === 'signup' && (
                                    <div className={clsx(styles.inputGroup, "animate-in fade-in slide-in-from-top-2")}>
                                        <label className={styles.label}>Full Name</label>
                                        <div className={styles.inputWrapper}>
                                            <div className={styles.inputIcon}>
                                                <User size={18} />
                                            </div>
                                            <input 
                                                type="text" 
                                                required
                                                placeholder="e.g. John Doe"
                                                className={styles.input}
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Work Email</label>
                                    <div className={styles.inputWrapper}>
                                        <div className={styles.inputIcon}>
                                            <Mail size={18} />
                                        </div>
                                        <input 
                                            type="email" 
                                            required
                                            placeholder="admin@school.com"
                                            className={styles.input}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {mode === 'signup' && (
                                    <>
                                        <div className={clsx(styles.inputGroup, "animate-in fade-in slide-in-from-top-2")}>
                                            <label className={styles.label}>Initial Role</label>
                                            <div className={styles.inputWrapper}>
                                                <div className={styles.inputIcon}>
                                                    <ShieldCheck size={18} />
                                                </div>
                                                <select 
                                                    className={clsx(styles.input, "appearance-none cursor-pointer")}
                                                    value={role}
                                                    onChange={(e) => setRole(e.target.value as any)}
                                                >
                                                    <option value="Teacher">Teacher</option>
                                                    <option value="Admin">Admin</option>
                                                    <option value="Office Staff">Office Staff</option>
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-cyan-800">
                                                    <ChevronDown size={18} />
                                                </div>
                                            </div>
                                        </div>

                                        {role === 'Teacher' && (
                                            <div className={clsx(styles.inputGroup, "animate-in fade-in slide-in-from-top-2 duration-300")}>
                                                <label className={styles.label}>Assigned Subject</label>
                                                <div className={styles.inputWrapper}>
                                                    <div className={styles.inputIcon}>
                                                        <BookOpen size={18} />
                                                    </div>
                                                    <select 
                                                        className={clsx(styles.input, "appearance-none cursor-pointer")}
                                                        value={selectedSubjectId}
                                                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                                                        required={role === 'Teacher'}
                                                    >
                                                        <option value="" disabled>Choose subject...</option>
                                                        {subjects.map(s => (
                                                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-cyan-800">
                                                        <ChevronDown size={18} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {role === 'Office Staff' && (
                                            <div className={clsx(styles.inputGroup, "animate-in fade-in slide-in-from-top-2 duration-300")}>
                                                <label className={styles.label}>Designation</label>
                                                <div className={styles.inputWrapper}>
                                                    <div className={styles.inputIcon}>
                                                        <Briefcase size={18} />
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        required
                                                        placeholder="e.g. Administrator, Clerk"
                                                        className={styles.input}
                                                        value={staffPost}
                                                        onChange={(e) => setStaffPost(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className={styles.inputGroup}>
                                    <div className="flex justify-between items-center ml-1 mb-2">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-cyan-800 group-focus-within:text-indigo-600 dark:group-focus-within:text-cyan-400 transition-colors duration-300">Password</label>
                                        {mode === 'login' && (
                                            <button 
                                                type="button" 
                                                onClick={() => setMode('forgot')}
                                                className={styles.link}
                                            >
                                                Forgot Password?
                                            </button>
                                        )}
                                    </div>
                                    <div className={styles.inputWrapper}>
                                        <div className={styles.inputIcon}>
                                            <Lock size={18} />
                                        </div>
                                        <input 
                                            type={showPassword ? "text" : "password"} 
                                            required
                                            placeholder="••••••••"
                                            className={styles.input}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-cyan-800 hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" disabled={isLoading} className={styles.button}>
                                    {isLoading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            {mode === 'login' ? 'Sign In' : 'Create Account'}
                                            {mode === 'login' ? <ArrowRight size={18} /> : <UserPlus size={18} />}
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        <div className="mt-6 text-center">
                            {mode !== 'forgot' && (
                                <button 
                                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                                    className={clsx("text-xs font-bold transition-colors opacity-80 hover:opacity-100", styles.link)}
                                >
                                    {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                                </button>
                            )}
                        </div>

                        <div className={clsx("mt-6 pt-6 border-t flex flex-col gap-3 border-slate-100 dark:border-cyan-900/30")}>
                            <div className={clsx("flex items-center gap-2.5", styles.text, "opacity-70")}>
                                <ShieldCheck size={14} className='text-emerald-500 dark:text-cyan-500' />
                                <span className="text-[9px] font-bold uppercase tracking-widest">End-to-End Encrypted Data</span>
                            </div>
                            <div className={clsx("flex items-center gap-2.5", styles.text, "opacity-70")}>
                                <Database size={14} className='text-emerald-500 dark:text-cyan-500' />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Real-time Cloud Sync Enabled</span>
                            </div>
                        </div>
                    </div>
                </div>

                <p className={clsx("text-center mt-8 text-[10px] font-bold uppercase tracking-wider opacity-50", styles.text)}>
                    &copy; {new Date().getFullYear()} Unacademy Academic Systems
                </p>
            </div>
        </div>
    );
};
