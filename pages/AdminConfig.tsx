
import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { useToast } from '../components/ToastContext';
import { Save, Upload, School, Image as ImageIcon, Loader2, Type, Building2, Eye, X, Terminal, Check, Copy } from 'lucide-react';
import clsx from 'clsx';

const SQL_FIX = `ALTER TABLE school_config ADD COLUMN IF NOT EXISTS full_logo_url TEXT;
ALTER TABLE school_config ADD COLUMN IF NOT EXISTS role_permissions JSONB;
ALTER TABLE school_config ADD COLUMN IF NOT EXISTS scorecard_layout JSONB;
ALTER TABLE school_config ADD COLUMN IF NOT EXISTS icon_url TEXT;

-- Create templates table if missing
CREATE TABLE IF NOT EXISTS templates (id TEXT PRIMARY KEY, name TEXT, elements JSONB, width INTEGER, height INTEGER, created_at TIMESTAMPTZ DEFAULT NOW());
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;`;

export const AdminConfig: React.FC = () => {
  const [schoolInfo, setSchoolInfo] = useState({ name: '', tagline: '', logo: '', watermark: '', icon: '', fullLogo: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingWatermark, setUploadingWatermark] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingFullLogo, setUploadingFullLogo] = useState(false);
  const [showSqlFix, setShowSqlFix] = useState(false);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const load = async () => {
       setLoading(true);
       try {
           const info = await DataService.getSchoolInfo();
           setSchoolInfo(info as any);
       } catch (e) {
           showToast("Failed to load school config", "error");
       } finally {
           setLoading(false);
       }
    };
    load();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'watermark' | 'icon' | 'fullLogo') => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      let setUploading;
      if (type === 'logo') setUploading = setUploadingLogo;
      else if (type === 'watermark') setUploading = setUploadingWatermark;
      else if (type === 'icon') setUploading = setUploadingIcon;
      else setUploading = setUploadingFullLogo;

      setUploading(true);
      
      try {
          const url = await DataService.uploadFile(file, 'branding');
          setSchoolInfo(prev => ({ ...prev, [type]: url }));
          showToast(`${type} uploaded successfully`, "success");
      } catch (e: any) {
          showToast(`Upload failed: ${e.message}`, "error");
      } finally {
          setUploading(false);
      }
  };

  const handleRemoveImage = (type: 'fullLogo') => {
      setSchoolInfo(prev => ({ ...prev, [type]: '' }));
  };

  const handleSave = async () => {
      setSaving(true);
      setShowSqlFix(false);
      try {
          await DataService.updateSchoolInfo(schoolInfo);
          showToast("Configuration saved successfully", "success");
          // reload to reflect changes in layout
          setTimeout(() => window.location.reload(), 1000);
      } catch (e: any) {
          const errMsg = e.message || "";
          if (errMsg.includes('DATABASE_SCHEMA_OUT_OF_DATE') || errMsg.includes('full_logo_url')) {
              setShowSqlFix(true);
              showToast("Schema Repair Required: Missing database columns.", "error");
          } else {
              showToast(`Save failed: ${e.message}`, "error");
          }
      } finally {
          setSaving(false);
      }
  };

  const handleCopySql = () => {
      navigator.clipboard.writeText(SQL_FIX);
      setCopied(true);
      showToast("SQL fix copied!", "success");
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                <Building2 size={28} />
            </div>
            Admin Configuration
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage school identity, branding assets, and system-wide display settings.</p>
        </div>
        <button 
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 active:scale-95"
        >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
            Save Configuration
        </button>
      </div>

      {showSqlFix && (
          <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-500 p-6 rounded-3xl animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-red-500 text-white rounded-2xl"><Terminal size={24} /></div>
                  <div className="flex-1">
                      <h3 className="text-lg font-black text-red-600 dark:text-red-400 uppercase tracking-tight">Database Repair Required</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                          The system detected missing columns (e.g. <code>full_logo_url</code>) in your Supabase table. Copy the script below and run it in your Supabase SQL Editor.
                      </p>
                  </div>
                  <button onClick={handleCopySql} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-red-200 dark:shadow-none">
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                      {copied ? 'Copied' : 'Copy SQL'}
                  </button>
              </div>
              <div className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-xs overflow-x-auto shadow-inner border border-slate-800">
                  <pre>{SQL_FIX}</pre>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Branding Identity Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <Type className="text-indigo-500" /> Institutional Identity
              </h2>
              <div className="space-y-6">
                  <div>
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">School / Institute Name</label>
                      <input 
                        type="text" 
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                        placeholder="e.g. UNACADEMY HIGH SCHOOL"
                        value={schoolInfo.name}
                        onChange={(e) => setSchoolInfo({ ...schoolInfo, name: e.target.value.toUpperCase() })}
                      />
                      <p className="text-[10px] text-slate-400 mt-2 ml-1">Displayed on reports, headers, and official documents.</p>
                  </div>

                  <div>
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Brand Wordmark / Wide Logo</label>
                      {schoolInfo.fullLogo ? (
                          <div className="relative group w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-center min-h-[100px]">
                              <img src={schoolInfo.fullLogo} alt="Brand Wordmark" className="max-h-16 object-contain" />
                              <button onClick={() => handleRemoveImage('fullLogo')} className="absolute top-2 right-2 p-1 bg-red-100 text-red-500 rounded-full hover:bg-red-200 transition-colors"><X size={14}/></button>
                          </div>
                      ) : (
                          <div className="relative group w-full bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center p-6 hover:border-indigo-400 transition-all cursor-pointer">
                              {uploadingFullLogo ? <Loader2 className="animate-spin text-indigo-500" /> : (
                                  <>
                                    <Upload className="text-slate-300 mb-2" size={20} />
                                    <span className="text-xs text-slate-400 font-bold">Upload Wide Logo Image</span>
                                    <span className="text-[9px] text-slate-300 mt-1">Replaces text name in headers</span>
                                  </>
                              )}
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={(e) => handleUpload(e, 'fullLogo')}
                                disabled={uploadingFullLogo}
                              />
                          </div>
                      )}
                  </div>

                  <div>
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Tagline / Motto</label>
                      <input 
                        type="text" 
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-800 dark:text-white font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                        placeholder="e.g. Excellence in Education"
                        value={schoolInfo.tagline}
                        onChange={(e) => setSchoolInfo({ ...schoolInfo, tagline: e.target.value })}
                      />
                  </div>
              </div>
          </div>

          {/* Visual Assets Section */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <ImageIcon className="text-indigo-500" /> Visual Assets
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Logo Upload */}
                  <div className="space-y-3">
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Official Logo</label>
                      <div className="relative group aspect-square bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center overflow-hidden hover:border-indigo-400 transition-all">
                          {uploadingLogo ? (
                              <Loader2 className="animate-spin text-indigo-500" size={32} />
                          ) : schoolInfo.logo ? (
                              <>
                                <img src={schoolInfo.logo} alt="School Logo" className="w-full h-full object-contain p-4" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">Click to Change</span>
                                </div>
                              </>
                          ) : (
                              <div className="text-center p-4">
                                  <Upload className="mx-auto text-slate-300 mb-2" size={24} />
                                  <span className="text-xs text-slate-400 font-bold">Upload</span>
                              </div>
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={(e) => handleUpload(e, 'logo')}
                            disabled={uploadingLogo}
                          />
                      </div>
                  </div>

                  {/* Watermark Upload */}
                  <div className="space-y-3">
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Doc Watermark</label>
                      <div className="relative group aspect-square bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center overflow-hidden hover:border-indigo-400 transition-all">
                          {uploadingWatermark ? (
                              <Loader2 className="animate-spin text-indigo-500" size={32} />
                          ) : schoolInfo.watermark ? (
                              <>
                                <img src={schoolInfo.watermark} alt="Watermark" className="w-full h-full object-contain p-4 opacity-50 grayscale" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">Click to Change</span>
                                </div>
                              </>
                          ) : (
                              <div className="text-center p-4">
                                  <Upload className="mx-auto text-slate-300 mb-2" size={24} />
                                  <span className="text-xs text-slate-400 font-bold">Upload</span>
                              </div>
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={(e) => handleUpload(e, 'watermark')}
                            disabled={uploadingWatermark}
                          />
                      </div>
                  </div>

                  {/* Login Icon Upload */}
                  <div className="space-y-3">
                      <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">System Icon</label>
                      <div className="relative group aspect-square bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center overflow-hidden hover:border-indigo-400 transition-all">
                          {uploadingIcon ? (
                              <Loader2 className="animate-spin text-indigo-500" size={32} />
                          ) : schoolInfo.icon ? (
                              <>
                                <img src={schoolInfo.icon} alt="Login Icon" className="w-full h-full object-contain p-4" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">Click to Change</span>
                                </div>
                              </>
                          ) : (
                              <div className="text-center p-4">
                                  <Upload className="mx-auto text-slate-300 mb-2" size={24} />
                                  <span className="text-xs text-slate-400 font-bold">Upload</span>
                                  <span className="text-[9px] text-slate-300 block mt-1 font-mono">64x64 px</span>
                              </div>
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={(e) => handleUpload(e, 'icon')}
                            disabled={uploadingIcon}
                          />
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div className="bg-indigo-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-indigo-100 dark:border-slate-700 flex gap-4 items-start">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-sm">
              <School size={24} />
          </div>
          <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">System-Wide Application</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Changes made here will immediately reflect on the <b>Score Card</b> layout, <b>Report Headers</b>, and the <b>Login Screen</b>. 
                  Ensure images are high-resolution (transparent PNG recommended for Logos). The "System Icon" appears on the main login page.
              </p>
          </div>
      </div>
    </div>
  );
};
