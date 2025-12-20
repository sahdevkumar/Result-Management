
import React, { useState } from 'react';
import { useTheme, Theme } from '../components/ThemeContext';
import { 
    Sun, Moon, Check, Monitor, Briefcase, Layers, Box, Grid, 
    Layout, Cpu, Aperture, Plus, Trash2, Edit, X, Palette,
    Copy, Droplet, MousePointer2, AlertCircle
} from 'lucide-react';
import { DataService } from '../services/dataService';
import { useToast } from '../components/ToastContext';
import { CustomTheme, ThemeColors } from '../types';
import clsx from 'clsx';

interface ThemeOption {
  id: Theme;
  name: string;
  desc: string;
  icon: React.ElementType;
  styleClass: string;
  // Define base colors for cloning purposes
  baseColors: { light: ThemeColors; dark: ThemeColors };
}

const DEFAULT_LIGHT: ThemeColors = {
    primary: '#4f46e5',    secondary: '#64748b',  background: '#f8fafc',
    surface: '#ffffff',    surfaceOpacity: 1,     textMain: '#0f172a',
    textSecondary: '#475569', border: '#e2e8f0',  buttonBackground: '#4f46e5',
    buttonText: '#ffffff', success: '#10b981',    danger: '#ef4444'
};

const DEFAULT_DARK: ThemeColors = {
    primary: '#6366f1',    secondary: '#94a3b8',  background: '#0f172a',
    surface: '#1e293b',    surfaceOpacity: 1,     textMain: '#ffffff',
    textSecondary: '#94a3b8', border: '#334155',  buttonBackground: '#6366f1',
    buttonText: '#ffffff', success: '#10b981',    danger: '#ef4444'
};

// Map system themes to approximate color values for the "Fetch/Clone" feature
const themeOptions: ThemeOption[] = [
  { 
      id: 'light', name: 'Classic Light', desc: 'Standard high-contrast interface.', icon: Sun, styleClass: 'bg-white border-slate-200 text-slate-800',
      baseColors: { light: DEFAULT_LIGHT, dark: DEFAULT_DARK }
  },
  { 
      id: 'dark', name: 'Classic Dark', desc: 'Eye-friendly dark mode.', icon: Moon, styleClass: 'bg-slate-900 border-slate-700 text-white',
      baseColors: { light: DEFAULT_LIGHT, dark: DEFAULT_DARK }
  },
  { 
      id: 'professional', name: 'Professional', desc: 'Corporate slate & blue.', icon: Briefcase, styleClass: 'bg-slate-50 border-slate-300 text-slate-700',
      baseColors: { 
          light: { ...DEFAULT_LIGHT, primary: '#1380D0', background: '#F8FAFC', surface: '#FFFFFF', border: '#CBD5E1', buttonBackground: '#1380D0' },
          dark: { ...DEFAULT_DARK, primary: '#38bdf8', background: '#0f172a', surface: '#1e293b', border: '#334155', buttonBackground: '#38bdf8' }
      }
  },
  { 
      id: 'neumorphism', name: 'Neumorphism', desc: 'Soft UI with tactile shadows.', icon: Layers, styleClass: 'bg-[#E0E5EC] shadow-[10px_10px_20px_#bebebe,-10px_-10px_20px_#ffffff] border-0 text-slate-600',
      baseColors: {
          light: { ...DEFAULT_LIGHT, background: '#E0E5EC', surface: '#E0E5EC', textMain: '#475569', border: '#E0E5EC', buttonBackground: '#E0E5EC', buttonText: '#4f46e5' },
          dark: { ...DEFAULT_DARK, background: '#2A2A2A', surface: '#2A2A2A', textMain: '#e2e8f0', border: '#2A2A2A', buttonBackground: '#2A2A2A', buttonText: '#6366f1' }
      }
  },
  { 
      id: 'glassmorphism', name: 'Glassmorphism', desc: 'Blur, transparency, gradients.', icon: Aperture, styleClass: 'bg-gradient-to-br from-indigo-100 to-purple-100 border-white/50 backdrop-blur-md text-indigo-900',
      baseColors: {
          light: { ...DEFAULT_LIGHT, background: '#e0e7ff', surface: '#ffffff', surfaceOpacity: 0.4, textMain: '#312e81', buttonBackground: '#4f46e5' },
          dark: { ...DEFAULT_DARK, background: '#1e1b4b', surface: '#000000', surfaceOpacity: 0.3, textMain: '#ffffff', buttonBackground: '#6366f1' }
      }
  },
  { 
      id: 'brutalism', name: 'Brutalism', desc: 'Raw, bold, neo-brutalist.', icon: Box, styleClass: 'bg-yellow-300 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black',
      baseColors: {
          light: { ...DEFAULT_LIGHT, primary: '#000000', background: '#FFFDF5', surface: '#FFFFFF', textMain: '#000000', border: '#000000', buttonBackground: '#000000', buttonText: '#ffffff' },
          dark: { ...DEFAULT_DARK, primary: '#ffffff', background: '#000000', surface: '#121212', textMain: '#ffffff', border: '#ffffff', buttonBackground: '#ffffff', buttonText: '#000000' }
      }
  },
  { 
      id: 'minimalist', name: 'Minimalist', desc: 'Clean, airy, essential.', icon: Layout, styleClass: 'bg-white border border-gray-100 text-gray-600',
      baseColors: {
          light: { ...DEFAULT_LIGHT, primary: '#000000', background: '#ffffff', surface: '#ffffff', border: '#f3f4f6', buttonBackground: '#000000', buttonText: '#ffffff' },
          dark: { ...DEFAULT_DARK, primary: '#ffffff', background: '#000000', surface: '#000000', border: '#333333', buttonBackground: '#ffffff', buttonText: '#000000' }
      }
  },
  { 
      id: 'neo', name: 'Neo Interface', desc: 'Cyberpunk inspired.', icon: Cpu, styleClass: 'bg-black text-green-500 border border-green-800 font-mono',
      baseColors: {
          light: { ...DEFAULT_LIGHT, primary: '#22c55e', background: '#f0fdf4', surface: '#ffffff', textMain: '#166534', border: '#15803d', buttonBackground: '#166534', buttonText: '#ffffff' },
          dark: { ...DEFAULT_DARK, primary: '#22c55e', background: '#000000', surface: '#0a0a0a', textMain: '#22c55e', textSecondary: '#15803d', border: '#14532d', buttonBackground: '#22c55e', buttonText: '#000000' }
      }
  },
  { 
      id: 'quantum', name: 'Quantum', desc: 'Sci-fi tech interface.', icon: Grid, styleClass: 'bg-[#050505] text-cyan-400 border border-cyan-900',
      baseColors: {
          light: { ...DEFAULT_LIGHT, primary: '#0891b2', background: '#ecfeff', surface: '#ffffff', textMain: '#0e7490', border: '#06b6d4', buttonBackground: '#0891b2', buttonText: '#ffffff' },
          dark: { ...DEFAULT_DARK, primary: '#22d3ee', background: '#020617', surface: '#083344', textMain: '#22d3ee', border: '#164e63', buttonBackground: '#22d3ee', buttonText: '#000000' }
      }
  },
];

export const Themes: React.FC = () => {
  const { theme, setTheme, isDarkMode, toggleTheme, customThemes, refreshCustomThemes } = useTheme();
  const { showToast } = useToast();
  
  // Modal State
  const [showEditor, setShowEditor] = useState(false);
  const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'light' | 'dark'>('light'); // Switch between light/dark palette editing
  
  const [formData, setFormData] = useState<{name: string, colors: { light: ThemeColors; dark: ThemeColors }}>({
      name: '',
      colors: { light: DEFAULT_LIGHT, dark: DEFAULT_DARK }
  });

  const handleEdit = (t: CustomTheme) => {
      setEditingThemeId(t.id);
      
      // Handle legacy themes (flat color structure) vs new themes (light/dark)
      let lightColors = DEFAULT_LIGHT;
      let darkColors = DEFAULT_DARK;

      if ((t.colors as any).light && (t.colors as any).dark) {
          lightColors = { ...DEFAULT_LIGHT, ...t.colors.light };
          darkColors = { ...DEFAULT_DARK, ...t.colors.dark };
      } else {
          // It's a legacy flat theme, treat it as the 'light' version and generate a dark fallback
          lightColors = { ...DEFAULT_LIGHT, ...(t.colors as any) };
          // Simple dark generation for legacy migration
          darkColors = { ...DEFAULT_DARK, primary: lightColors.primary }; 
      }

      setFormData({ name: t.name, colors: { light: lightColors, dark: darkColors } });
      setEditMode('light');
      setShowEditor(true);
  };

  const handleCreate = () => {
      setEditingThemeId(null);
      setFormData({ name: '', colors: { light: DEFAULT_LIGHT, dark: DEFAULT_DARK } });
      setEditMode('light');
      setShowEditor(true);
  };

  const handleCloneSystem = (opt: ThemeOption) => {
      setEditingThemeId(null);
      setFormData({ 
          name: `${opt.name} Copy`, 
          colors: opt.baseColors 
      });
      setEditMode('light');
      setShowEditor(true);
      showToast(`Fetched colors from ${opt.name}`, 'info');
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (!confirm("Delete this theme? This cannot be undone.")) return;
      
      try {
          await DataService.deleteCustomTheme(id);
          showToast("Theme deleted", 'success');
          if (theme === id) setTheme('light'); // Fallback if active theme is deleted
          refreshCustomThemes();
      } catch (err) {
          showToast("Failed to delete theme", 'error');
      }
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await DataService.saveCustomTheme({
              id: editingThemeId || undefined,
              name: formData.name,
              colors: formData.colors,
              isPreset: false
          });
          showToast("Theme saved successfully", 'success');
          setShowEditor(false);
          refreshCustomThemes();
      } catch (err: any) {
          showToast(err.message, 'error');
      }
  };

  const handleColorChange = (key: keyof ThemeColors, value: string | number) => {
      setFormData(prev => ({
          ...prev,
          colors: {
              ...prev.colors,
              [editMode]: {
                  ...prev.colors[editMode],
                  [key]: value
              }
          }
      }));
  };

  // Helper to visualize RGBA for preview
  const getRgba = (hex: string, alpha: number = 1) => {
      if (!hex) return 'rgba(0,0,0,0)';
      let c: any;
      if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
          c= hex.substring(1).split('');
          if(c.length== 3){
              c= [c[0], c[0], c[1], c[1], c[2], c[2]];
          }
          c= '0x'+c.join('');
          return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
      }
      return hex;
  }

  // Get active color set for preview
  const activePreviewColors = formData.colors[editMode];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
             <div className="p-2 bg-indigo-100 dark:bg-slate-800 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Palette size={28} />
             </div>
             System Appearance
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 ml-1">Customize application colors, fonts, and layout styles.</p>
        </div>
        <button 
            onClick={handleCreate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:-translate-y-0.5 active:scale-95"
        >
            <Plus size={20} /> Create Custom Theme
        </button>
      </div>

      {/* --- CUSTOM THEMES SECTION --- */}
      {customThemes.length > 0 && (
          <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Edit size={14} /> Your Custom Themes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {customThemes.map((ct) => {
                      // Determine display colors (handle old/new structure)
                      const displayColors = (ct.colors as any).light ? (isDarkMode ? ct.colors.dark : ct.colors.light) : (ct.colors as any);
                      return (
                      <div
                        key={ct.id}
                        onClick={() => setTheme(ct.id)}
                        className={clsx(
                            "relative group p-6 rounded-2xl transition-all duration-300 border-2 overflow-hidden cursor-pointer",
                            theme === ct.id 
                                ? "border-indigo-500 ring-4 ring-indigo-500/20 scale-[1.02] shadow-xl" 
                                : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg hover:-translate-y-1"
                        )}
                        style={{ backgroundColor: displayColors.surface }}
                      >
                          {/* Active Badge */}
                          {theme === ct.id && (
                              <div className="absolute top-0 right-0 bg-indigo-600 text-white px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider shadow-sm z-10">
                                  Active
                              </div>
                          )}

                          <div className="flex justify-between items-start mb-4 mt-2">
                              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md" style={{ backgroundColor: displayColors.primary }}>
                                  <Droplet size={24} />
                              </div>
                          </div>
                          
                          <h3 className="font-bold text-xl leading-tight mb-1" style={{ color: displayColors.textMain }}>{ct.name}</h3>
                          <p className="text-xs font-medium opacity-70 mb-4" style={{ color: displayColors.textSecondary }}>Custom Palette</p>
                          
                          {/* Palette Preview Strip */}
                          <div className="flex h-3 rounded-full overflow-hidden mb-6 w-full shadow-sm ring-1 ring-black/5">
                              <div style={{ backgroundColor: displayColors.primary, flex: 2 }} />
                              <div style={{ backgroundColor: displayColors.secondary, flex: 1 }} />
                              <div style={{ backgroundColor: displayColors.background, flex: 1 }} />
                              <div style={{ backgroundColor: displayColors.textMain, flex: 1 }} />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleEdit(ct); }}
                                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-200"
                              >
                                  <Edit size={14} /> Edit Colors
                              </button>
                              <button 
                                onClick={(e) => handleDelete(e, ct.id)}
                                className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors border border-red-100"
                                title="Delete Theme"
                              >
                                  <Trash2 size={16} />
                              </button>
                          </div>
                      </div>
                  )})}
              </div>
          </div>
      )}

      {/* --- SYSTEM PRESETS SECTION --- */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Monitor size={14} /> System Presets
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {themeOptions.map((opt) => (
                <div key={opt.id} className="relative group">
                    <button
                        onClick={() => setTheme(opt.id)}
                        className={clsx(
                            "w-full text-left relative flex flex-col items-start p-6 rounded-2xl transition-all duration-300 overflow-hidden h-48 border-2",
                            opt.styleClass,
                            theme === opt.id 
                                ? "border-indigo-500 ring-4 ring-indigo-500/30 scale-[1.02] shadow-xl" 
                                : "border-transparent hover:scale-[1.02] hover:shadow-lg opacity-90 hover:opacity-100"
                        )}
                    >
                        <div className="flex justify-between w-full mb-4">
                            <div className="p-2.5 rounded-xl bg-current opacity-10">
                                <opt.icon size={28} />
                            </div>
                            {theme === opt.id && (
                                <div className="bg-indigo-600 text-white p-1.5 rounded-full shadow-sm">
                                    <Check size={16} strokeWidth={4} />
                                </div>
                            )}
                        </div>
                        <h3 className="font-bold text-lg leading-tight mt-auto">{opt.name}</h3>
                        <p className="text-xs opacity-70 mt-1 font-medium">{opt.desc}</p>
                    </button>
                    
                    {/* Clone Button Overlay */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleCloneSystem(opt); }}
                        className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur text-slate-600 rounded-lg shadow-sm border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-600 hover:bg-white"
                        title={`Clone ${opt.name} to edit`}
                    >
                        <Copy size={16} />
                    </button>
                </div>
            ))}
        </div>
      </div>
      
      {/* Global Toggle */}
      <div className="max-w-7xl bg-indigo-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-indigo-100 dark:border-slate-800 flex gap-4 items-center justify-between">
          <div className="flex gap-4 items-start">
            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
                <Sun size={20} />
            </div>
            <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-sm">Global Mode Settings</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Current Mode: <strong>{isDarkMode ? 'Dark' : 'Light'}</strong>. 
                    All themes support both modes.
                </p>
            </div>
          </div>
          <button 
            onClick={toggleTheme}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
              Toggle Mode
          </button>
      </div>

      {/* --- EDITOR MODAL --- */}
      {showEditor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                      <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-3">
                          <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg text-indigo-600 dark:text-indigo-400"><Palette size={20} /></div>
                          {editingThemeId ? 'Edit Theme Colors' : 'Create Custom Theme'}
                      </h3>
                      <button onClick={() => setShowEditor(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={24} /></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                    <form onSubmit={handleSave} className="p-8 space-y-8">
                        <div>
                            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Theme Name</label>
                            <input 
                                type="text" required
                                className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold transition-all placeholder:font-normal"
                                placeholder="e.g. Ocean Blue"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>

                        {/* Mode Toggle Tabs */}
                        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setEditMode('light')}
                                className={clsx(
                                    "flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all",
                                    editMode === 'light' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                <Sun size={16} /> Light Mode Config
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditMode('dark')}
                                className={clsx(
                                    "flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all",
                                    editMode === 'dark' ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                <Moon size={16} /> Dark Mode Config
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            {/* Color Group: Brand */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest border-b border-indigo-100 dark:border-slate-700 pb-2 mb-4">Brand Identity</h4>
                                
                                <div className="group relative bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-colors">
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Primary / Accent Color</label>
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full shadow-sm border border-black/10 shrink-0" style={{ backgroundColor: activePreviewColors.primary }}></div>
                                        <input type="text" className="w-full bg-transparent text-sm font-mono text-slate-700 dark:text-slate-300 outline-none" value={activePreviewColors.primary} onChange={(e) => handleColorChange('primary', e.target.value)} />
                                        <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" value={activePreviewColors.primary} onChange={(e) => handleColorChange('primary', e.target.value)} />
                                    </div>
                                </div>

                                <div className="group relative bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-colors">
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Secondary Color</label>
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full shadow-sm border border-black/10 shrink-0" style={{ backgroundColor: activePreviewColors.secondary }}></div>
                                        <input type="text" className="w-full bg-transparent text-sm font-mono text-slate-700 dark:text-slate-300 outline-none" value={activePreviewColors.secondary} onChange={(e) => handleColorChange('secondary', e.target.value)} />
                                        <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" value={activePreviewColors.secondary} onChange={(e) => handleColorChange('secondary', e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            {/* Color Group: Buttons */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest border-b border-indigo-100 dark:border-slate-700 pb-2 mb-4">Interactive Elements</h4>
                                
                                <div className="group relative bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-colors">
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Button Background</label>
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full shadow-sm border border-black/10 shrink-0" style={{ backgroundColor: activePreviewColors.buttonBackground }}></div>
                                        <input type="text" className="w-full bg-transparent text-sm font-mono text-slate-700 dark:text-slate-300 outline-none" value={activePreviewColors.buttonBackground} onChange={(e) => handleColorChange('buttonBackground', e.target.value)} />
                                        <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" value={activePreviewColors.buttonBackground} onChange={(e) => handleColorChange('buttonBackground', e.target.value)} />
                                    </div>
                                </div>

                                <div className="group relative bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-colors">
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Button Text Color</label>
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full shadow-sm border border-black/10 shrink-0" style={{ backgroundColor: activePreviewColors.buttonText }}></div>
                                        <input type="text" className="w-full bg-transparent text-sm font-mono text-slate-700 dark:text-slate-300 outline-none" value={activePreviewColors.buttonText} onChange={(e) => handleColorChange('buttonText', e.target.value)} />
                                        <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" value={activePreviewColors.buttonText} onChange={(e) => handleColorChange('buttonText', e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            {/* Color Group: Surfaces */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest border-b border-indigo-100 dark:border-slate-700 pb-2 mb-4">Surfaces & Layout</h4>
                                
                                <div className="group relative bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-colors">
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">App Background</label>
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full shadow-sm border border-black/10 shrink-0" style={{ backgroundColor: activePreviewColors.background }}></div>
                                        <input type="text" className="w-full bg-transparent text-sm font-mono text-slate-700 dark:text-slate-300 outline-none" value={activePreviewColors.background} onChange={(e) => handleColorChange('background', e.target.value)} />
                                        <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" value={activePreviewColors.background} onChange={(e) => handleColorChange('background', e.target.value)} />
                                    </div>
                                </div>

                                <div className="group relative bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-colors">
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Card Surface</label>
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="h-10 w-10 rounded-full shadow-sm border border-black/10 shrink-0 relative overflow-hidden">
                                             {/* Checkerboard for transparency indication */}
                                             <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNjY2MiLz48cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjY2NjIi8+PC9zdmc+')] opacity-30"></div>
                                             <div className="absolute inset-0" style={{ backgroundColor: activePreviewColors.surface, opacity: activePreviewColors.surfaceOpacity ?? 1 }}></div>
                                        </div>
                                        <div className="flex-1 relative">
                                            <input type="text" className="w-full bg-transparent text-sm font-mono text-slate-700 dark:text-slate-300 outline-none" value={activePreviewColors.surface} onChange={(e) => handleColorChange('surface', e.target.value)} />
                                            <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" value={activePreviewColors.surface} onChange={(e) => handleColorChange('surface', e.target.value)} />
                                        </div>
                                    </div>
                                    {/* Opacity Slider */}
                                    <div className="flex items-center gap-3 bg-slate-200/50 dark:bg-black/20 p-2 rounded-lg">
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Opacity</span>
                                        <input 
                                            type="range" 
                                            min="0" max="1" step="0.05" 
                                            value={activePreviewColors.surfaceOpacity ?? 1} 
                                            onChange={(e) => handleColorChange('surfaceOpacity', parseFloat(e.target.value))}
                                            className="w-full h-1.5 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <span className="text-[10px] font-mono font-bold w-9 text-right text-slate-600 dark:text-slate-300">{Math.round((activePreviewColors.surfaceOpacity ?? 1) * 100)}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Color Group: Typography */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest border-b border-indigo-100 dark:border-slate-700 pb-2 mb-4">Typography (Fonts Color)</h4>
                                
                                <div className="group relative bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-colors">
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Main Text</label>
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full shadow-sm border border-black/10 shrink-0" style={{ backgroundColor: activePreviewColors.textMain }}></div>
                                        <input type="text" className="w-full bg-transparent text-sm font-mono text-slate-700 dark:text-slate-300 outline-none" value={activePreviewColors.textMain} onChange={(e) => handleColorChange('textMain', e.target.value)} />
                                        <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" value={activePreviewColors.textMain} onChange={(e) => handleColorChange('textMain', e.target.value)} />
                                    </div>
                                </div>

                                <div className="group relative bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-colors">
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Secondary Text</label>
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full shadow-sm border border-black/10 shrink-0" style={{ backgroundColor: activePreviewColors.textSecondary }}></div>
                                        <input type="text" className="w-full bg-transparent text-sm font-mono text-slate-700 dark:text-slate-300 outline-none" value={activePreviewColors.textSecondary} onChange={(e) => handleColorChange('textSecondary', e.target.value)} />
                                        <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" value={activePreviewColors.textSecondary} onChange={(e) => handleColorChange('textSecondary', e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            {/* Color Group: UI Elements */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest border-b border-indigo-100 dark:border-slate-700 pb-2 mb-4">UI Elements</h4>
                                
                                <div className="group relative bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-colors">
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Border Color</label>
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full shadow-sm border border-black/10 shrink-0" style={{ backgroundColor: activePreviewColors.border }}></div>
                                        <input type="text" className="w-full bg-transparent text-sm font-mono text-slate-700 dark:text-slate-300 outline-none" value={activePreviewColors.border} onChange={(e) => handleColorChange('border', e.target.value)} />
                                        <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" value={activePreviewColors.border} onChange={(e) => handleColorChange('border', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Live Preview Block */}
                        <div className="mt-8 p-6 rounded-3xl border-2 transition-all duration-300" style={{ backgroundColor: activePreviewColors.background, borderColor: activePreviewColors.border }}>
                            <h4 className="text-xs font-black uppercase mb-4 tracking-widest" style={{ color: activePreviewColors.textSecondary }}>Live Preview & Button Showcase</h4>
                            <div className="p-6 rounded-2xl shadow-lg transition-all duration-300 space-y-6" style={{ backgroundColor: getRgba(activePreviewColors.surface, activePreviewColors.surfaceOpacity ?? 1), borderColor: activePreviewColors.border, borderWidth: '1px', backdropFilter: (activePreviewColors.surfaceOpacity || 1) < 0.95 ? 'blur(12px)' : 'none' }}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-xl mb-1" style={{ color: activePreviewColors.textMain }}>UI Components</h3>
                                        <p className="text-sm font-medium" style={{ color: activePreviewColors.textSecondary }}>Button styles used throughout the app.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {/* Primary Button Preview */}
                                        <button type="button" className="px-6 py-2.5 rounded-xl font-bold shadow-md transition-all duration-300 hover:brightness-110 flex items-center gap-2" style={{ backgroundColor: activePreviewColors.buttonBackground, color: activePreviewColors.buttonText }}>
                                            <MousePointer2 size={16} /> Primary Action
                                        </button>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px w-full" style={{ backgroundColor: activePreviewColors.border }}></div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: activePreviewColors.textSecondary }}>Primary</span>
                                        <button className="w-full py-3 rounded-xl font-bold shadow-sm" style={{ backgroundColor: activePreviewColors.buttonBackground, color: activePreviewColors.buttonText }}>
                                            Save Changes
                                        </button>
                                    </div>
                                    
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: activePreviewColors.textSecondary }}>Secondary / Ghost</span>
                                        <button className="w-full py-3 rounded-xl font-bold border hover:opacity-80 transition-opacity" style={{ borderColor: activePreviewColors.border, color: activePreviewColors.textMain, backgroundColor: 'transparent' }}>
                                            Cancel
                                        </button>
                                    </div>

                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: activePreviewColors.textSecondary }}>Destructive</span>
                                        <button className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 opacity-90 hover:opacity-100" style={{ backgroundColor: activePreviewColors.danger, color: '#ffffff' }}>
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </div>

                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: activePreviewColors.textSecondary }}>Icon / Action</span>
                                        <div className="flex gap-2">
                                            <button className="p-3 rounded-xl border hover:opacity-80" style={{ borderColor: activePreviewColors.border, color: activePreviewColors.textMain }}>
                                                <Edit size={18} />
                                            </button>
                                            <button className="p-3 rounded-xl shadow-sm hover:brightness-110" style={{ backgroundColor: activePreviewColors.buttonBackground, color: activePreviewColors.buttonText }}>
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-4 rounded-xl flex items-start gap-3" style={{ backgroundColor: activePreviewColors.background, border: `1px solid ${activePreviewColors.border}` }}>
                                    <AlertCircle size={20} style={{ color: activePreviewColors.primary }} />
                                    <div>
                                        <h5 className="text-sm font-bold" style={{ color: activePreviewColors.textMain }}>Interactive Elements</h5>
                                        <p className="text-xs mt-1" style={{ color: activePreviewColors.textSecondary }}>
                                            Buttons typically use the <strong>Button Background</strong> color. 
                                            Text links and accents use the <strong>Primary Color</strong>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                  </div>

                  <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
                      <button type="button" onClick={() => setShowEditor(false)} className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                      <button type="button" onClick={handleSave} className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:-translate-y-0.5">Save Theme</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
