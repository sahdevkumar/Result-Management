
import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, Database, User, UserPlus, BookOpen, ChevronDown, Briefcase, RefreshCw, DatabaseZap, AlertCircle, ServerCrash, Copy, Check, Terminal, Phone, Calendar } from 'lucide-react';
import { DataService } from '../services/dataService';
import { useToast } from '../components/ToastContext';
import { Subject, UserProfile } from '../types';
import clsx from 'clsx';

interface LoginProps {
    onLoginSuccess: (user: UserProfile) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [authSource, setAuthSource] = useState<'staff' | 'student'>('staff');
    const [mode, setMode] = useState<'login' | 'signup' | 'diagnostics'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Student Login Fields
    const [mobile, setMobile] = useState('');
    const [dob, setDob] = useState('');

    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<'Super Admin' | 'Principal' | 'Teacher' | 'Office Staff' | 'Admin'>('Teacher');
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [staffPost, setStaffPost] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingSubjects, setIsFetchingSubjects] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [copied, setCopied] = useState(false);
    const [schoolBranding, setSchoolBranding] = useState({ name: 'Unacademy', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Unacademy_Logo.png/600px-Unacademy_Logo.png', fullLogo: '' });
    
    const { showToast } = useToast();

    // Fetch school config for custom branding
    useEffect(() => {
        const loadBranding = async () => {
            try {
                const info = await DataService.getSchoolInfo();
                setSchoolBranding(prev => ({
                    name: info.name || prev.name,
                    icon: info.icon || prev.icon,
                    fullLogo: info.fullLogo || ''
                }));
            } catch(e) {
                // Keep defaults if error
            }
        };
        loadBranding();
    }, []);

    const SQL_FIX = `-- SQL FIX SCRIPT PROVIDED PREVIOUSLY`;

    const fetchSubjectsData = async () => {
        setIsFetchingSubjects(true);
        try {
            const subData = await DataService.getSubjects();
            setSubjects(subData);
            if (subData.length > 0 && !selectedSubjectId) {
                setSelectedSubjectId(subData[0].id);
            }
        } catch (e: any) {
            console.error(e);
            if (e.message?.includes('RLS')) {
                setMode('diagnostics');
            }
        } finally {
            setIsFetchingSubjects(false);
        }
    };

    const handleCopySQL = () => {
        navigator.clipboard.writeText(SQL_FIX);
        setCopied(true);
        showToast("SQL Script copied to clipboard", "success");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSeedData = async () => {
        setIsSeeding(true);
        try {
            await DataService.seedInitialData();
            showToast("System initialized with sample data!", "success");
            await fetchSubjectsData();
            setMode('login');
        } catch (e: any) {
            console.error(e);
            showToast(e.message || "Failed to seed. Check RLS.", "error");
            setMode('diagnostics');
        } finally {
            setIsSeeding(false);
        }
    };

    useEffect(() => {
        if (mode === 'signup') {
            fetchSubjectsData();
        }
    }, [mode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (authSource === 'student') {
                const user = await DataService.studentSignIn(mobile, dob);
                showToast(`Welcome ${user.fullName}!`, "success");
                onLoginSuccess(user);
                return;
            }

            if (mode === 'login') {
                const user = await DataService.signIn(email, password);
                showToast("Welcome back!", "success");
                onLoginSuccess(user);
            } else {
                await DataService.signUp({
                    email, password, name: fullName, role,
                    subjectId: role === 'Teacher' ? selectedSubjectId : undefined,
                    staffPost: role === 'Office Staff' ? staffPost : undefined
                });
                showToast("Account created! Contact admin to activate.", "success");
                setMode('login');
            }
        } catch (err: any) {
            showToast(err.message || "Operation failed", "error");
            if (err.message?.includes('RLS') || err.message?.includes('PERMISSION')) {
                setMode('diagnostics');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const styles = {
        bg: 'bg-slate-50 dark:bg-[#020617]',
        card: 'bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-cyan-900/50 shadow-2xl dark:shadow-[0_0_40px_rgba(8,145,178,0.1)] backdrop-blur-xl',
        inputGroup: 'space-y-1.5 group',
        label: 'block text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400 dark:text-cyan-800 group-focus-within:text-indigo-600 dark:group-focus-within:text-cyan-400 transition-colors duration-300',
        inputWrapper: 'relative',
        input: 'w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-cyan-900/30 rounded-2xl outline-none text-sm font-bold text-slate-800 dark:text-cyan-100 placeholder:text-slate-400 dark:placeholder:text-cyan-900/50 focus:bg-white dark:focus:bg-slate-900/80 focus:border-indigo-500 dark:focus:border-cyan-400 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-cyan-400/10 transition-all duration-300 shadow-sm dark:shadow-none',
        inputIcon: 'absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-cyan-800 group-focus-within:text-indigo-600 dark:group-focus-within:text-cyan-400 transition-colors duration-300',
        button: 'w-full py-4 bg-indigo-600 dark:bg-cyan-500 hover:bg-indigo-700 dark:hover:bg-cyan-400 text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all transform active:scale-[0.98] flex items-center justify-center gap-2',
        link: 'text-indigo-600 dark:text-cyan-500 hover:text-indigo-800 dark:hover:text-cyan-300 transition-colors font-bold text-[10px] uppercase tracking-wide',
        badge: 'absolute left-1/2 -translate-x-1/2 -top-3.5 z-20 bg-slate-50 dark:bg-[#0a0a0a] text-indigo-600 dark:text-cyan-400 border border-indigo-100 dark:border-cyan-800 shadow-[0_2px_10px_rgba(0,0,0,0.05)] px-6 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap',
        text: 'text-slate-600 dark:text-cyan-700'
    };

    return (
        <div className={clsx("min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500", styles.bg)}>
            <div className={clsx("absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse bg-indigo-200/40 dark:bg-cyan-900/20")}></div>
            <div className={clsx("absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 bg-blue-200/40 dark:bg-blue-900/10")}></div>

            <div className={clsx("w-full transition-all duration-500 relative z-10", mode === 'diagnostics' ? 'max-w-3xl' : 'max-w-md')}>
                <div className="text-center mb-10">
                    <div className="mb-6 flex justify-center">
                        <img src={schoolBranding.icon} alt="School Icon" className="w-20 h-20 object-contain drop-shadow-md" />
                    </div>
                    {schoolBranding.fullLogo ? (
                        <div className="flex justify-center mb-2">
                            <img src={schoolBranding.fullLogo} alt="School Name" className="h-12 object-contain" />
                        </div>
                    ) : (
                        <h1 className="text-4xl font-black tracking-tight uppercase text-indigo-600 dark:text-cyan-400">{schoolBranding.name}</h1>
                    )}
                    <p className={clsx("mt-2 font-medium", styles.text)}>Result Management Intelligence</p>
                </div>

                <div className="relative group">
                    <div className={styles.badge}>{mode === 'diagnostics' ? 'Database Recovery' : authSource === 'staff' ? 'Institutional Staff Portal' : 'Student Result Access'}</div>
                    <div className={clsx("rounded-[32px] p-8 transition-all", styles.card)}>
                        
                        {/* Auth Toggle */}
                        {mode === 'login' && (
                            <div className="flex p-1 bg-slate-100 dark:bg-slate-900/50 rounded-2xl mb-8">
                                <button onClick={() => setAuthSource('staff')} className={clsx("flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", authSource === 'staff' ? "bg-white dark:bg-cyan-500 text-indigo-600 dark:text-black shadow-sm" : "text-slate-400 hover:text-slate-600")}>Staff</button>
                                <button onClick={() => setAuthSource('student')} className={clsx("flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", authSource === 'student' ? "bg-white dark:bg-cyan-500 text-indigo-600 dark:text-black shadow-sm" : "text-slate-400 hover:text-slate-600")}>Student</button>
                            </div>
                        )}

                        {mode === 'diagnostics' ? (
                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                                <div className="flex items-start gap-4 p-5 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/30">
                                    <ServerCrash size={32} className="text-red-500 shrink-0 mt-1" />
                                    <div>
                                        <h4 className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">Schema Conflict Detected</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Ensure your database tables match the required architecture for Student Authentication.</p>
                                    </div>
                                </div>
                                <button onClick={() => setMode('login')} className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Back to Security Gate</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                                {authSource === 'staff' ? (
                                    <>
                                        {mode === 'signup' && (
                                            <div className={clsx(styles.inputGroup, "animate-in fade-in slide-in-from-top-2")}>
                                                <label className={styles.label}>Full Name</label>
                                                <div className={styles.inputWrapper}>
                                                    <div className={styles.inputIcon}><User size={18} /></div>
                                                    <input type="text" required placeholder="Full Name" className={styles.input} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                                                </div>
                                            </div>
                                        )}
                                        <div className={styles.inputGroup}>
                                            <label className={styles.label}>Staff Email</label>
                                            <div className={styles.inputWrapper}>
                                                <div className={styles.inputIcon}><Mail size={18} /></div>
                                                <input type="email" required placeholder="name@school.com" className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />
                                            </div>
                                        </div>
                                        {mode === 'signup' && (
                                            <>
                                                <div className={clsx(styles.inputGroup, "animate-in fade-in slide-in-from-top-2")}>
                                                    <label className={styles.label}>System Role</label>
                                                    <div className={styles.inputWrapper}>
                                                        <div className={styles.inputIcon}><ShieldCheck size={18} /></div>
                                                        <select className={clsx(styles.input, "appearance-none")} value={role} onChange={(e) => setRole(e.target.value as any)}>
                                                            <option value="Teacher">Teacher</option>
                                                            <option value="Admin">Admin</option>
                                                            <option value="Office Staff">Office Staff</option>
                                                            <option value="Principal">Principal</option>
                                                        </select>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={18} /></div>
                                                    </div>
                                                </div>
                                                {role === 'Teacher' && (
                                                    <div className={clsx(styles.inputGroup, "animate-in fade-in slide-in-from-top-2")}>
                                                        <label className={styles.label}>Subject Discipline</label>
                                                        <div className={styles.inputWrapper}>
                                                            <div className={styles.inputIcon}><BookOpen size={18} /></div>
                                                            <select className={clsx(styles.input, "appearance-none")} value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} required={role === 'Teacher'}>
                                                                <option value="" disabled>Choose Subject...</option>
                                                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                            </select>
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={18} /></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <div className={styles.inputGroup}>
                                            <label className={styles.label}>Security Password</label>
                                            <div className={styles.inputWrapper}>
                                                <div className={styles.inputIcon}><Lock size={18} /></div>
                                                <input type={showPassword ? "text" : "password"} required placeholder="••••••••" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
                                        <div className={styles.inputGroup}>
                                            <label className={styles.label}>Registered Mobile Number</label>
                                            <div className={styles.inputWrapper}>
                                                <div className={styles.inputIcon}><Phone size={18} /></div>
                                                <input type="tel" required placeholder="9876543210" className={styles.input} value={mobile} onChange={(e) => setMobile(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label className={styles.label}>Date of Birth</label>
                                            <div className={styles.inputWrapper}>
                                                <div className={styles.inputIcon}><Calendar size={18} /></div>
                                                <input type="date" required className={clsx(styles.input, "pr-8")} value={dob} onChange={(e) => setDob(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 flex gap-3 items-start">
                                            <Info size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 leading-relaxed font-medium">Use the mobile number and birth date provided during registration. Contact school office if login fails.</p>
                                        </div>
                                    </>
                                )}
                                <button type="submit" disabled={isLoading} className={styles.button}>{isLoading ? <Loader2 className="animate-spin" size={20} /> : authSource === 'staff' ? (mode === 'login' ? 'Identify' : 'Request Account') : 'Authorize Access'}</button>
                            </form>
                        )}
                        
                        {mode !== 'diagnostics' && authSource === 'staff' && (
                            <div className="mt-6 text-center">
                                <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className={clsx("text-xs font-bold opacity-80", styles.link)}>{mode === 'login' ? "New Faculty? Register" : "Registered? Log In"}</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper component for info icon
const Info = ({ size, className }: { size: number, className: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
    </svg>
);
