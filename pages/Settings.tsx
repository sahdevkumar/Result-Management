import React, { useState } from 'react';
import { SubjectEntry } from './SubjectEntry';
import { ClassEntry } from './ClassEntry';
import { ExamTypeEntry } from './ExamTypeEntry';
import { BookCopy, LayoutTemplate, Bookmark } from 'lucide-react';
import clsx from 'clsx';

type Tab = 'subjects' | 'classes' | 'examTypes';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('subjects');

  const tabs = [
    { id: 'subjects' as Tab, label: 'Subject Entry', icon: BookCopy },
    { id: 'classes' as Tab, label: 'Class Entry', icon: LayoutTemplate },
    { id: 'examTypes' as Tab, label: 'Exam Types', icon: Bookmark },
  ];

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div>
            <h1 className="text-2xl font-bold text-slate-800">Settings & Configuration</h1>
            <p className="text-slate-500 text-sm">Manage academic data and configurations</p>
         </div>
       </div>

       {/* Tab Navigation */}
       <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
       </div>

       {/* Tab Content */}
       <div className="mt-6">
          {activeTab === 'subjects' && <SubjectEntry />}
          {activeTab === 'classes' && <ClassEntry />}
          {activeTab === 'examTypes' && <ExamTypeEntry />}
       </div>
    </div>
  );
};