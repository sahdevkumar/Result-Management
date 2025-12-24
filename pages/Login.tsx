
import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, Database, User, UserPlus, BookOpen, ChevronDown, Briefcase, RefreshCw, DatabaseZap, AlertCircle, ServerCrash, Copy, Check, Terminal } from 'lucide-react';
import { DataService } from '../services/dataService';
import { useToast } from '../components/ToastContext';
import { Subject, UserProfile } from '../types';
import clsx from 'clsx';

interface LoginProps {
    onLoginSuccess: (user: UserProfile) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [mode, setMode] = useState<'login' | 'signup' | 'diagnostics'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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

    const SQL_FIX = `-- RUN THIS IN SUPABASE SQL EDITOR
-- 1. ENSURE TABLES EXIST
CREATE TABLE IF NOT EXISTS system_users (id TEXT PRIMARY KEY, full_name TEXT, email TEXT UNIQUE, password TEXT, role TEXT, mobile TEXT, status TEXT, assigned_subject_id TEXT, assigned_class_id TEXT, staff_post TEXT, last_login_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS subjects (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT, code TEXT UNIQUE, max_marks INTEGER, pass_marks INTEGER, max_marks_objective INTEGER, max_marks_subjective INTEGER);
CREATE TABLE IF NOT EXISTS classes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT, section TEXT, UNIQUE(name, section));
CREATE TABLE IF NOT EXISTS students (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), full_name TEXT, roll_number TEXT UNIQUE, class_name TEXT, section TEXT, guardian_name TEXT, contact_number TEXT, status TEXT, avatar_url TEXT, date_of_birth DATE);
CREATE TABLE IF NOT EXISTS exams (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT, term TEXT, start_date DATE, status TEXT, academic_year TEXT);
CREATE TABLE IF NOT EXISTS exam_types (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE, description TEXT);
CREATE TABLE IF NOT EXISTS marks (student_id UUID REFERENCES students(id), exam_id UUID REFERENCES exams(id), subject_id UUID REFERENCES subjects(id), obj_marks NUMERIC, obj_max_marks NUMERIC, sub_marks NUMERIC, sub_max_marks NUMERIC, exam_date DATE, grade TEXT, remarks TEXT, attended BOOLEAN, updated_at TIMESTAMPTZ, PRIMARY KEY(student_id, exam_id, subject_id));
CREATE TABLE IF NOT EXISTS teacher_remarks (student_id UUID REFERENCES students(id), exam_id UUID REFERENCES exams(id), subject_id UUID REFERENCES subjects(id), remark TEXT, updated_at TIMESTAMPTZ DEFAULT NOW(), PRIMARY KEY(student_id, exam_id, subject_id));
CREATE TABLE IF NOT EXISTS non_academic_records (student_id UUID REFERENCES students(id), exam_id UUID REFERENCES exams(id), attendance TEXT, discipline TEXT, leadership TEXT, arts TEXT, updated_at TIMESTAMPTZ DEFAULT NOW(), PRIMARY KEY(student_id, exam_id));
CREATE TABLE IF NOT EXISTS school_config (id INTEGER PRIMARY KEY, name TEXT, tagline TEXT, logo_url TEXT, watermark_url TEXT, icon_url TEXT, scorecard_layout JSONB, role_permissions JSONB, updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS templates (id TEXT PRIMARY KEY, name TEXT, elements JSONB, width INTEGER, height INTEGER, created_at TIMESTAMPTZ DEFAULT NOW());

-- 2. APPLY SCHEMA MIGRATIONS (IF COLUMNS ARE MISSING)
ALTER TABLE school_config ADD COLUMN IF NOT EXISTS role_permissions JSONB;
ALTER TABLE school_config ADD COLUMN IF NOT EXISTS scorecard_layout JSONB;
ALTER TABLE school_config ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE school_config ADD COLUMN IF NOT EXISTS full_logo_url TEXT;
ALTER TABLE system_users ADD COLUMN IF NOT EXISTS assigned_class_id TEXT;
ALTER TABLE system_users ADD COLUMN IF NOT EXISTS assigned_subject_id TEXT;
ALTER TABLE system_users ADD COLUMN IF NOT EXISTS staff_post TEXT;

-- 3. DISABLE RLS (REQUIRED FOR CLIENT-SIDE OPERATION)
ALTER TABLE system_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE marks DISABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_remarks DISABLE ROW LEVEL SECURITY;
ALTER TABLE non_academic_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE school_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;

-- 4. INSERT DEFAULT CONFIG RECORD
INSERT INTO school_config (id, name, tagline) VALUES (1, 'UNACADEMY', 'Excellence in Education') ON CONFLICT (id) DO NOTHING;`;

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
            if (mode === 'login') {
                const user = await DataService.signIn(email, password);
                showToast("Welcome back!", "success");
                onLoginSuccess(user);
            } else {
                await DataService.signUp({
                    email, password, name: fullName, role,
                    subjectId: role === 'Teacher' ? selectedSubjectId : undefined,
                    staffPost: role === 'Office Staff' ? staffPost : undefined,
                    classId: role === 'Teacher' ? null : undefined // Only define classId if you have a class selector, but user table needs column regardless
                });
                showToast("Account created! Contact admin to activate.", "success");
                setMode('login');
            }
        } catch (err: any) {
            showToast(err.message || "Operation failed", "error");
            if (err.message?.includes('RLS') || err.message?.includes('PERMISSION') || err.message?.includes('assigned_class_id')) {
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
                    <p className={clsx("mt-2 font-medium", styles.text)}>Academic Result Management System</p>
                </div>

                <div className="relative group">
                    <div className={styles.badge}>{mode === 'diagnostics' ? 'Emergency Security Fix' : mode === 'login' ? 'System Authentication' : 'New User Request'}</div>
                    <div className={clsx("rounded-[32px] p-8 transition-all", styles.card)}>
                        {mode === 'diagnostics' ? (
                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                                <div className="flex items-start gap-4 p-5 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/30">
                                    <ServerCrash size={32} className="text-red-500 shrink-0 mt-1" />
                                    <div>
                                        <h4 className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">Database Schema Alert</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                            The application detected missing columns or permissions. This usually happens if the database was created with an older version of the schema.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Terminal size={14}/> Run this SQL in Supabase Dashboard
                                        </h5>
                                        <button onClick={handleCopySQL} className="text-[10px] font-black uppercase text-indigo-600 dark:text-cyan-400 flex items-center gap-1.5 hover:underline">
                                            {copied ? <Check size={12}/> : <Copy size={12}/>}
                                            {copied ? 'Copied' : 'Copy Script'}
                                        </button>
                                    </div>
                                    <div className="bg-slate-900 text-cyan-50 p-4 rounded-2xl text-[10px] font-mono overflow-x-auto max-h-60 custom-scrollbar border border-slate-700">
                                        <pre>{SQL_FIX}</pre>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button 
                                        onClick={handleSeedData} 
                                        disabled={isSeeding} 
                                        className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
                                    >
                                        {isSeeding ? <Loader2 size={16} className="animate-spin" /> : <DatabaseZap size={16} />}
                                        Try Initializing Now
                                    </button>
                                    <button 
                                        onClick={() => setMode('login')} 
                                        className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                    >
                                        Return to Login
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
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
                                    <label className={styles.label}>Account Email</label>
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
                                                <div className="flex justify-between items-center ml-1">
                                                    <label className={styles.label}>Subject</label>
                                                    {isFetchingSubjects && <Loader2 size={10} className="animate-spin text-cyan-500" />}
                                                </div>
                                                <div className={styles.inputWrapper}>
                                                    <div className={styles.inputIcon}><BookOpen size={18} /></div>
                                                    <select className={clsx(styles.input, "appearance-none")} value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} required={role === 'Teacher'}>
                                                        <option value="" disabled>Choose Subject...</option>
                                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={18} /></div>
                                                </div>
                                                {subjects.length === 0 && !isFetchingSubjects && (
                                                    <div className="mt-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
                                                        <p className="text-[10px] text-amber-500 font-bold">Tables empty or RLS active.</p>
                                                        <button type="button" onClick={() => setMode('diagnostics')} className="w-full py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2">
                                                            Fix Database Connection
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Password</label>
                                    <div className={styles.inputWrapper}>
                                        <div className={styles.inputIcon}><Lock size={18} /></div>
                                        <input type={showPassword ? "text" : "password"} required placeholder="••••••••" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                    </div>
                                </div>
                                <button type="submit" disabled={isLoading} className={styles.button}>{isLoading ? <Loader2 className="animate-spin" size={20} /> : mode === 'login' ? 'Sign In' : 'Request Access'}</button>
                            </form>
                        )}
                        
                        {mode !== 'diagnostics' && (
                            <div className="mt-6 text-center">
                                <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className={clsx("text-xs font-bold opacity-80", styles.link)}>{mode === 'login' ? "New staff member? Register" : "Already registered? Log In"}</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
