
import React, { useState, useEffect } from 'react';
import { 
  Trash2, RotateCcw, AlertTriangle, Search, Filter, 
  Loader2, UserX, FileX, BookX, Trash, ShieldAlert,
  Calendar, GraduationCap, BookOpen, Clock, RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { useToast } from '../components/ToastContext';
import { DataService } from '../services/dataService';
import clsx from 'clsx';

type DeletedType = 'Student' | 'Exam' | 'Subject';

interface DeletedRecord {
    id: string;
    type: DeletedType;
    name: string;
    deletedAt: string;
    details: string;
    originalData: any;
}

export const RecycleBin: React.FC = () => {
    const [records, setRecords] = useState<DeletedRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<'All' | DeletedType>('All');
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const { showToast } = useToast();

    // Mock records for demonstration as current DB logic uses hard deletes
    useEffect(() => {
        const fetchDeleted = async () => {
            setLoading(true);
            // In a real system, this would fetch from a 'trash' or 'audit' table
            setTimeout(() => {
                setRecords([
                    { id: '1', type: 'Student', name: 'Aarav Sharma', deletedAt: new Date(Date.now() - 86400000).toISOString(), details: 'Roll: ACS042 • Class 10A', originalData: {} },
                    { id: '2', type: 'Exam', name: 'Mid-Term Physics', deletedAt: new Date(Date.now() - 172800000).toISOString(), details: 'Scheduled: 2024-03-15', originalData: {} },
                    { id: '3', type: 'Subject', name: 'Advanced Calculus', deletedAt: new Date(Date.now() - 259200000).toISOString(), details: 'Code: MAT-601', originalData: {} }
                ]);
                setLoading(false);
            }, 800);
        };
        fetchDeleted();
    }, []);

    const handleRestore = async (record: DeletedRecord) => {
        setIsProcessing(record.id);
        try {
            // Simulated restore logic
            await new Promise(r => setTimeout(r, 1000));
            setRecords(prev => prev.filter(r => r.id !== record.id));
            showToast(`${record.type} "${record.name}" restored successfully`, 'success');
        } catch (e) {
            showToast("Failed to restore record", "error");
        } finally {
            setIsProcessing(null);
        }
    };

    const handlePurge = async (record: DeletedRecord) => {
        if (!confirm(`Permanently delete this ${record.type.toLowerCase()}? This action is irreversible.`)) return;
        setIsProcessing(record.id);
        try {
            await new Promise(r => setTimeout(r, 1000));
            setRecords(prev => prev.filter(r => r.id !== record.id));
            showToast("Record purged permanently", 'info');
        } catch (e) {
            showToast("Purge failed", "error");
        } finally {
            setIsProcessing(null);
        }
    };

    const handleEmptyBin = async () => {
        if (!confirm("Are you sure you want to empty the Recycle Bin? All items will be lost forever.")) return;
        setLoading(true);
        try {
            await new Promise(r => setTimeout(r, 1500));
            setRecords([]);
            showToast("Recycle bin emptied", "success");
        } catch (e) {
            showToast("Operation failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const filteredRecords = records.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              r.details.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = activeFilter === 'All' || r.type === activeFilter;
        return matchesSearch && matchesType;
    });

    const getTypeStyles = (type: DeletedType) => {
        switch(type) {
            case 'Student': return "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800";
            case 'Exam': return "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800";
            case 'Subject': return "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800";
        }
    };

    const getTypeIcon = (type: DeletedType) => {
        switch(type) {
            case 'Student': return <UserX size={18} />;
            case 'Exam': return <FileX size={18} />;
            case 'Subject': return <BookX size={18} />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
                        <div className="p-3 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-2xl shadow-sm">
                            <Trash2 size={28} />
                        </div>
                        Recycle Bin
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review and restore recently deleted academic data.</p>
                </div>
                <button 
                    onClick={handleEmptyBin}
                    disabled={records.length === 0 || loading}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-slate-200 dark:shadow-none disabled:opacity-50"
                >
                    <Trash size={18} /> Empty Recycle Bin
                </button>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-2xl flex items-start gap-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl">
                    <ShieldAlert size={20} />
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">Data Retention Policy</h4>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                        Items in the recycle bin are stored for <b>30 days</b> before being permanently purged by the system. Restoring an item will reactivate all associated historical marks and remarks.
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[500px] flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search in trash..." 
                            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        {['All', 'Student', 'Exam', 'Subject'].map((filter) => (
                            <button 
                                key={filter}
                                onClick={() => setActiveFilter(filter as any)}
                                className={clsx(
                                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border",
                                    activeFilter === filter 
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100" 
                                        : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                                )}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto relative">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm z-10">
                            <Loader2 className="animate-spin text-indigo-600 mb-2" size={40} />
                            <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Scanning Directory...</p>
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="p-24 text-center">
                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-600">
                                <Trash2 size={48} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Empty Recycle Bin</h3>
                            <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">No deleted items match your current filters or the trash has been recently emptied.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                                    <th className="p-6">Entity Details</th>
                                    <th className="p-6">Category</th>
                                    <th className="p-6">Deleted At</th>
                                    <th className="p-6 pr-8 text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredRecords.map(record => (
                                    <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-110", getTypeStyles(record.type))}>
                                                    {getTypeIcon(record.type)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">{record.name}</p>
                                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{record.details}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={clsx("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border", getTypeStyles(record.type))}>
                                                {record.type}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm font-medium">
                                                <Clock size={14} className="text-slate-400" />
                                                {new Date(record.deletedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                            </div>
                                        </td>
                                        <td className="p-6 pr-8 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    disabled={isProcessing === record.id}
                                                    onClick={() => handleRestore(record)}
                                                    className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                                                >
                                                    {isProcessing === record.id ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} Restore
                                                </button>
                                                <button 
                                                    disabled={isProcessing === record.id}
                                                    onClick={() => handlePurge(record)}
                                                    className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                                    title="Purge Permanently"
                                                >
                                                    <Trash size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-slate-900 rounded-3xl text-white">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                        <RefreshCw size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold">Auto-Purge System Active</h4>
                        <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Next scan in 14 hours</p>
                    </div>
                </div>
                <div className="text-right mt-4 md:mt-0">
                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Bin Integrity</p>
                    <p className="text-sm font-bold text-emerald-400 flex items-center gap-2 justify-end">
                        <CheckCircle2 size={14} /> 100% Secure
                    </p>
                </div>
            </div>
        </div>
    );
};
