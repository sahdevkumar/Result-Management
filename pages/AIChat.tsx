
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
// Added missing Activity and ShieldCheck imports
import { Send, Bot, User, Loader2, RefreshCw, Terminal, Copy, Check, Sparkles, Activity, ShieldCheck } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import clsx from 'clsx';

const SYSTEM_INSTRUCTION = `You are the "Unacademy System Assistant". 
Your purpose is to help administrators manage the Exam Result Management System.
If the user asks to "recreate tables", "fix database", "schema error", or "role permission error", provide this EXACT SQL script:

-- SQL FIX FOR UNACADEMY SYSTEM
CREATE TABLE IF NOT EXISTS system_users (id TEXT PRIMARY KEY, full_name TEXT, email TEXT UNIQUE, password TEXT, role TEXT, mobile TEXT, status TEXT, assigned_subject_id TEXT, assigned_class_id TEXT, staff_post TEXT, last_login_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS subjects (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT, code TEXT UNIQUE, max_marks INTEGER, pass_marks INTEGER, max_marks_objective INTEGER, max_marks_subjective INTEGER);
CREATE TABLE IF NOT EXISTS classes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT, section TEXT, UNIQUE(name, section));
CREATE TABLE IF NOT EXISTS students (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), full_name TEXT, roll_number TEXT UNIQUE, class_name TEXT, section TEXT, guardian_name TEXT, contact_number TEXT, status TEXT, avatar_url TEXT, date_of_birth DATE);
CREATE TABLE IF NOT EXISTS exams (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT, term TEXT, start_date DATE, status TEXT, academic_year TEXT);
CREATE TABLE IF NOT EXISTS exam_types (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE, description TEXT);
CREATE TABLE IF NOT EXISTS marks (student_id UUID REFERENCES students(id), exam_id UUID REFERENCES exams(id), subject_id UUID REFERENCES subjects(id), obj_marks NUMERIC, obj_max_marks NUMERIC, sub_marks NUMERIC, sub_max_marks NUMERIC, exam_date DATE, grade TEXT, remarks TEXT, attended BOOLEAN, updated_at TIMESTAMPTZ, PRIMARY KEY(student_id, exam_id, subject_id));
CREATE TABLE IF NOT EXISTS teacher_remarks (student_id UUID REFERENCES students(id), exam_id UUID REFERENCES exams(id), subject_id UUID REFERENCES subjects(id), remark TEXT, updated_at TIMESTAMPTZ DEFAULT NOW(), PRIMARY KEY(student_id, exam_id, subject_id));
CREATE TABLE IF NOT EXISTS non_academic_records (student_id UUID REFERENCES students(id), exam_id UUID REFERENCES exams(id), attendance TEXT, discipline TEXT, leadership TEXT, arts TEXT, updated_at TIMESTAMPTZ DEFAULT NOW(), PRIMARY KEY(student_id, exam_id));
CREATE TABLE IF NOT EXISTS school_config (id INTEGER PRIMARY KEY, name TEXT, tagline TEXT, logo_url TEXT, watermark_url TEXT, scorecard_layout JSONB, role_permissions JSONB, updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS templates (id TEXT PRIMARY KEY, name TEXT, elements JSONB, width INTEGER, height INTEGER, created_at TIMESTAMPTZ DEFAULT NOW());

ALTER TABLE school_config ADD COLUMN IF NOT EXISTS role_permissions JSONB;
ALTER TABLE school_config ADD COLUMN IF NOT EXISTS scorecard_layout JSONB;

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

INSERT INTO school_config (id, name, tagline) VALUES (1, 'UNACADEMY', 'Excellence in Education') ON CONFLICT (id) DO NOTHING;

Answer academic management questions concisely. Always maintain a professional, helpful tone.`;

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello! I'm your Unacademy System Assistant. How can I help you manage your students, exams, or database today?", timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage, timestamp: new Date() }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMessage,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });

      const modelText = response.text || "I'm sorry, I couldn't generate a response.";
      setMessages(prev => [...prev, { role: 'model', text: modelText, timestamp: new Date() }]);
    } catch (error) {
      console.error("AI Error:", error);
      showToast("AI Service temporarily unavailable", "error");
      setMessages(prev => [...prev, { role: 'model', text: "I encountered an error connecting to the AI brain. Please check your internet connection.", timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    showToast("Copied to clipboard", "success");
  };

  const renderMessageContent = (text: string, index: number) => {
    // Basic detection for SQL code blocks
    if (text.includes('CREATE TABLE') || text.includes('ALTER TABLE')) {
        return (
            <div className="space-y-3">
                <p className="whitespace-pre-wrap">{text.split('--')[0]}</p>
                <div className="relative group/code">
                    <div className="absolute right-3 top-3 z-10">
                        <button 
                            onClick={() => copyToClipboard(text, index)}
                            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg backdrop-blur-md border border-slate-600 transition-all active:scale-95"
                        >
                            {copiedIndex === index ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                    </div>
                    <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 font-mono text-[11px] overflow-x-auto custom-scrollbar text-cyan-400 shadow-inner">
                        <pre className="whitespace-pre-wrap">{text.includes('--') ? '--' + text.split('--')[1] : text}</pre>
                    </div>
                </div>
            </div>
        );
    }
    return <p className="whitespace-pre-wrap leading-relaxed">{text}</p>;
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center shrink-0 px-2">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                <Sparkles size={24} />
            </div>
            AI Assistant
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Chat with Gemini to manage your system and database.</p>
        </div>
        <button 
            onClick={() => setMessages([{ role: 'model', text: "Chat history cleared. How can I help you now?", timestamp: new Date() }])}
            className="p-2.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
        >
            <RefreshCw size={20} />
        </button>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white dark:from-slate-900 to-transparent z-10 pointer-events-none opacity-60"></div>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar pt-12">
          {messages.map((msg, idx) => (
            <div 
                key={idx} 
                className={clsx(
                    "flex gap-4 max-w-[85%] animate-in slide-in-from-bottom-2 duration-300",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
            >
              <div className={clsx(
                  "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm",
                  msg.role === 'model' ? "bg-indigo-600 text-white border-indigo-500" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              )}>
                {msg.role === 'model' ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className={clsx(
                  "p-5 rounded-3xl text-sm shadow-sm border",
                  msg.role === 'model' 
                    ? "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-100 dark:border-slate-700 rounded-tl-none" 
                    : "bg-indigo-600 text-white border-indigo-500 rounded-tr-none"
              )}>
                {renderMessageContent(msg.text, idx)}
                <p className={clsx("text-[10px] mt-2 font-bold opacity-40 uppercase tracking-widest", msg.role === 'user' ? "text-indigo-100" : "text-slate-400")}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isTyping && (
             <div className="flex gap-4 mr-auto animate-pulse">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 text-indigo-500">
                    <Bot size={20} />
                </div>
                <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl rounded-tl-none border border-slate-100 dark:border-slate-700 flex gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 md:p-6 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex gap-3 backdrop-blur-md">
            <div className="relative flex-1 group">
                <input 
                    type="text" 
                    placeholder="Ask anything (e.g. 'How do I recreate tables?')" 
                    className="w-full pl-6 pr-12 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[20px] outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isTyping}
                />
                <button 
                    type="submit" 
                    disabled={isTyping || !input.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-200 dark:shadow-none transition-all active:scale-90 disabled:opacity-50 disabled:grayscale"
                >
                    <Send size={18} />
                </button>
            </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print shrink-0">
          {[
              { label: 'Recreate Database Tables', prompt: 'I need the SQL code to recreate all system tables.', icon: Terminal, color: 'text-amber-500' },
              { label: 'Check System Status', prompt: 'Is the system database connected properly?', icon: Activity, color: 'text-emerald-500' },
              { label: 'Fix Permission Errors', prompt: 'I am getting a "role_permissions" column error. How do I fix it?', icon: ShieldCheck, color: 'text-indigo-500' }
          ].map((suggestion, i) => (
              <button 
                key={i} 
                onClick={() => setInput(suggestion.prompt)}
                className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/60 dark:border-slate-700 p-4 rounded-2xl text-left hover:border-indigo-300 dark:hover:border-indigo-500 transition-all group active:scale-[0.98] shadow-sm"
              >
                  <suggestion.icon className={clsx("mb-2", suggestion.color)} size={18} />
                  <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{suggestion.label}</p>
              </button>
          ))}
      </div>
    </div>
  );
};
