
import React, { useState, useRef, useEffect } from 'react';
import { 
  Image as ImageIcon, Type, Save, Trash2, Layout, Maximize, Minus, Plus, 
  List as ListIcon, Palette, Settings, Bold, Italic, Upload, Loader2
} from 'lucide-react';
import { useToast } from '../components/ToastContext';
import { DesignElement, SavedTemplate } from '../types';
import { DataService } from '../services/dataService';
import clsx from 'clsx';

type Tab = 'design' | 'list' | 'size';

export const TemplateDesign: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<Tab>('design');
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scale, setScale] = useState(0.8);
  const [loading, setLoading] = useState(true);
  
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Canvas Size State
  const [pageSize, setPageSize] = useState({ width: 794, height: 1123, name: 'A4' });
  const [customSize, setCustomSize] = useState({ width: 794, height: 1123 });
  
  // Template List State
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);

  const { showToast } = useToast();
  
  // Refs for Drag & Resize
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const elementStart = useRef({ x: 0, y: 0 });
  const draggedElementId = useRef<string | null>(null);
  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0 });
  const dimsStart = useRef({ w: 0, h: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Load data from DB on mount
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const templates = await DataService.getTemplates();
            setSavedTemplates(templates);
        } catch (e) {
            showToast("Error connecting to database.", 'error');
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  const saveTemplate = async () => {
    const name = prompt("Enter a name for this template:", `Template ${savedTemplates.length + 1}`);
    if (!name) return;

    setIsSavingTemplate(true);
    const newId = Date.now().toString();
    try {
        await DataService.saveTemplate({
            id: newId,
            name,
            elements,
            width: pageSize.width,
            height: pageSize.height
        });
        
        // Refresh list
        const updated = await DataService.getTemplates();
        setSavedTemplates(updated);
        showToast("Layout saved to database", 'success');
    } catch (e) {
        showToast("Failed to save layout.", 'error');
    } finally {
        setIsSavingTemplate(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if(!confirm("Delete this template?")) return;
    try {
        await DataService.deleteTemplate(id);
        setSavedTemplates(prev => prev.filter(t => t.id !== id));
        showToast("Template deleted", 'info');
    } catch (e) {
        showToast("Failed to delete template", 'error');
    }
  };

  // --- UI Operations ---

  const loadTemplate = (template: SavedTemplate) => {
    setElements(template.elements);
    setPageSize({ width: template.width, height: template.height, name: 'Custom' });
    setCustomSize({ width: template.width, height: template.height });
    showToast(`Loaded "${template.name}"`, 'success');
  };

  const addText = () => {
    const newEl: DesignElement = {
      id: Date.now().toString(), type: 'text', x: 50, y: 50, width: 300, height: 100, content: 'New Text Block',
      style: { fontSize: 24, fontFamily: 'Inter', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textDecoration: 'none', opacity: 1, textAlign: 'left', lineHeight: 1.2, letterSpacing: 0 }
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isWatermark = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newEl: DesignElement = {
          id: Date.now().toString(), type: isWatermark ? 'watermark' : 'image', x: isWatermark ? 0 : 50, y: isWatermark ? 0 : 50, width: isWatermark ? pageSize.width : 200, height: isWatermark ? pageSize.height : 200, content: event.target?.result as string,
          style: { opacity: isWatermark ? 0.15 : 1 }
        };
        if (isWatermark) setElements(prev => [...prev.filter(el => el.type !== 'watermark'), newEl]);
        else setElements(prev => [...prev, newEl]);
        setSelectedId(newEl.id);
      };
      reader.readAsDataURL(file);
    }
  };

  const initDrag = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation();
    let clientX, clientY;
    if ('touches' in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
    else { clientX = (e as React.MouseEvent).clientX; clientY = (e as React.MouseEvent).clientY; }
    setSelectedId(id);
    isDragging.current = true;
    draggedElementId.current = id;
    dragStart.current = { x: clientX, y: clientY };
    const el = elements.find(item => item.id === id);
    if (el) elementStart.current = { x: el.x, y: el.y };
  };

  const initResize = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation();
    let clientX, clientY;
    if ('touches' in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
    else { clientX = (e as React.MouseEvent).clientX; clientY = (e as React.MouseEvent).clientY; }
    isResizing.current = true;
    draggedElementId.current = id;
    resizeStart.current = { x: clientX, y: clientY };
    const el = elements.find(item => item.id === id);
    if (el) dimsStart.current = { w: el.width || 100, h: el.height || 100 };
  };

  const updateElementStyle = (key: string, value: any) => {
    if (!selectedId) return;
    setElements(prev => prev.map(el => {
      if (el.id === selectedId) return { ...el, style: { ...el.style, [key]: value } };
      return el;
    }));
  };

  const updateElementContent = (value: string) => {
    if (!selectedId) return;
    setElements(prev => prev.map(el => {
      if (el.id === selectedId) return { ...el, content: value };
      return el;
    }));
  };

  const deleteElement = () => {
    if (!selectedId) return;
    setElements(prev => prev.filter(el => el.id !== selectedId));
    setSelectedId(null);
  };

  const applyPageSize = (width: number, height: number, name: string) => {
    setPageSize({ width, height, name });
    setCustomSize({ width, height });
  };

  const getClientCoords = (e: MouseEvent | TouchEvent) => {
    if ('touches' in e) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      const coords = getClientCoords(e);
      if (isDragging.current && draggedElementId.current) {
        if (e.type === 'touchmove') e.preventDefault(); 
        const dx = (coords.x - dragStart.current.x) / scale;
        const dy = (coords.y - dragStart.current.y) / scale;
        setElements(prev => prev.map(el => {
          if (el.id === draggedElementId.current) {
            return { ...el, x: elementStart.current.x + dx, y: elementStart.current.y + dy };
          }
          return el;
        }));
      }
      if (isResizing.current && draggedElementId.current) {
        if (e.type === 'touchmove') e.preventDefault();
        const dx = (coords.x - resizeStart.current.x) / scale;
        const dy = (coords.y - resizeStart.current.y) / scale;
        setElements(prev => prev.map(el => {
          if (el.id === draggedElementId.current) {
            const newWidth = Math.max(20, (dimsStart.current.w) + dx);
            const newHeight = Math.max(20, (dimsStart.current.h) + dy);
            return { ...el, width: newWidth, height: newHeight };
          }
          return el;
        }));
      }
    };
    const handleGlobalUp = () => {
      isDragging.current = false;
      isResizing.current = false;
      draggedElementId.current = null;
    };
    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchmove', handleGlobalMove, { passive: false });
    window.addEventListener('touchend', handleGlobalUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, [scale]);

  const selectedElement = elements.find(el => el.id === selectedId);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)] lg:h-[calc(100vh-2rem)]">
      
      {/* Sidebar Controls */}
      <div className="lg:w-80 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-h-[40vh] lg:max-h-full">
        
        <div className="flex border-b border-slate-200">
          <button onClick={() => setActiveTab('design')} className={clsx("flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1", activeTab === 'design' ? "bg-slate-50 text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:bg-slate-50")}>
            <Palette size={14} /> Dsgn
          </button>
          <button onClick={() => setActiveTab('list')} className={clsx("flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1", activeTab === 'list' ? "bg-slate-50 text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:bg-slate-50")}>
            <ListIcon size={14} /> List
          </button>
          <button onClick={() => setActiveTab('size')} className={clsx("flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1", activeTab === 'size' ? "bg-slate-50 text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:bg-slate-50")}>
            <Settings size={14} /> Size
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {activeTab === 'design' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                <button onClick={addText} className="flex items-center gap-2 px-3 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium">
                  <Type size={16} /> Add Text Block
                </button>
                <label className="flex items-center gap-2 px-3 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium cursor-pointer">
                  <ImageIcon size={16} /> Add Image
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, false)} />
                </label>
              </div>

              {selectedElement ? (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                   <div className="flex justify-between items-center">
                       <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Properties</span>
                       <button onClick={deleteElement} className="text-red-500 bg-red-50 p-1.5 rounded hover:bg-red-100"><Trash2 size={14} /></button>
                   </div>
                   {selectedElement.type === 'text' && (
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Content</label>
                              <textarea className="w-full p-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 text-slate-900 bg-white" rows={3} value={selectedElement.content} onChange={(e) => updateElementContent(e.target.value)} />
                          </div>
                          <div className="flex gap-2">
                              <div className="flex-1">
                                   <label className="block text-[10px] text-slate-400 mb-1">Font Size</label>
                                   <input type="number" className="w-full p-1.5 border border-slate-300 rounded text-xs text-slate-900 bg-white" value={selectedElement.style.fontSize} onChange={(e) => updateElementStyle('fontSize', parseInt(e.target.value))} />
                              </div>
                              <div className="w-10">
                                   <label className="block text-[10px] text-slate-400 mb-1">Color</label>
                                   <input type="color" className="w-full h-[26px] border border-slate-300 rounded p-0.5 cursor-pointer" value={selectedElement.style.color} onChange={(e) => updateElementStyle('color', e.target.value)} />
                              </div>
                          </div>
                          <div>
                              <label className="block text-[10px] text-slate-400 mb-1">Style</label>
                              <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                                  <button onClick={() => updateElementStyle('fontWeight', selectedElement.style.fontWeight === 'bold' ? 'normal' : 'bold')} className={clsx("flex-1 py-1.5 flex justify-center hover:bg-slate-200", selectedElement.style.fontWeight === 'bold' && "bg-slate-300 text-slate-900")}><Bold size={14} /></button>
                                  <button onClick={() => updateElementStyle('fontStyle', selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic')} className={clsx("flex-1 py-1.5 flex justify-center hover:bg-slate-200", selectedElement.style.fontStyle === 'italic' && "bg-slate-300 text-slate-900")}><Italic size={14} /></button>
                              </div>
                          </div>
                      </div>
                   )}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">Select an element to edit</div>
              )}
            </div>
          )}

          {activeTab === 'list' && (
            <div className="space-y-4">
              <button onClick={saveTemplate} disabled={isSavingTemplate} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50">
                {isSavingTemplate ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Layout to DB
              </button>
              <div className="space-y-2 mt-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Saved Layouts</h3>
                {savedTemplates.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">No layouts in database.</p> : savedTemplates.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg group">
                    <div className="overflow-hidden">
                      <p className="font-medium text-sm text-slate-700 truncate">{t.name}</p>
                      <p className="text-[10px] text-slate-400">{t.width}x{t.height} • {t.createdAt}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => loadTemplate(t)} className="text-blue-500 hover:text-blue-700 p-1"><Layout size={16} /></button>
                      <button onClick={() => deleteTemplate(t.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'size' && (
            <div className="space-y-6">
               <div><h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Presets</h3>
                  <div className="grid grid-cols-2 gap-2">
                     <button onClick={() => applyPageSize(794, 1123, 'A4')} className={clsx("p-2 border rounded text-sm", pageSize.name === 'A4' ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-slate-200 text-slate-600")}>A4 (Portrait)</button>
                     <button onClick={() => applyPageSize(1123, 794, 'A4-L')} className={clsx("p-2 border rounded text-sm", pageSize.name === 'A4-L' ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-slate-200 text-slate-600")}>A4 (Landscape)</button>
                  </div>
               </div>
               <div><h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Custom (px)</h3>
                  <div className="flex gap-2 mb-2">
                     <input type="number" className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 bg-white" value={customSize.width} onChange={(e) => setCustomSize({...customSize, width: parseInt(e.target.value) || 0})} />
                     <input type="number" className="w-full p-2 border border-slate-300 rounded text-sm text-slate-900 bg-white" value={customSize.height} onChange={(e) => setCustomSize({...customSize, height: parseInt(e.target.value) || 0})} />
                  </div>
                  <button onClick={() => applyPageSize(customSize.width, customSize.height, 'Custom')} className="w-full py-2 bg-slate-800 text-white rounded text-sm font-medium">Apply</button>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div ref={containerRef} className="flex-1 bg-slate-200/50 rounded-xl overflow-auto flex items-start justify-center p-4 lg:p-8 relative border border-slate-300/50">
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white/90 backdrop-blur shadow-sm p-1.5 rounded-lg border border-slate-200">
             <button onClick={() => setScale(s => Math.max(0.2, s - 0.1))} className="p-1 hover:bg-slate-100 rounded"><Minus size={14} /></button>
             <span className="text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
             <button onClick={() => setScale(s => Math.min(2.0, s + 0.1))} className="p-1 hover:bg-slate-100 rounded"><Plus size={14} /></button>
             <button onClick={() => setScale(0.8)} className="p-1 hover:bg-slate-100 rounded ml-2"><Maximize size={14} /></button>
          </div>

          <div 
             className="bg-white shadow-2xl relative transition-transform origin-top select-none shrink-0"
             style={{ width: `${pageSize.width}px`, height: `${pageSize.height}px`, transform: `scale(${scale})`, marginBottom: `${pageSize.height * (scale - 0.5)}px` }}
             onClick={() => setSelectedId(null)}
          >
             {elements.map(el => (
                 <div
                    key={el.id} className={clsx("absolute group", selectedId === el.id ? "z-50 cursor-move" : "z-10 cursor-pointer")}
                    style={{ left: el.x, top: el.y, width: el.width, height: el.height, zIndex: el.type === 'watermark' ? 0 : undefined, opacity: el.style.opacity, pointerEvents: el.type === 'watermark' && selectedId !== el.id ? 'none' : 'auto' }}
                    onMouseDown={(e) => initDrag(e, el.id)} onTouchStart={(e) => initDrag(e, el.id)}
                 >
                     {el.type === 'text' ? (
                         <div style={{ fontSize: `${el.style.fontSize}px`, fontFamily: el.style.fontFamily, color: el.style.color, fontWeight: el.style.fontWeight, fontStyle: el.style.fontStyle, textDecoration: el.style.textDecoration, textAlign: el.style.textAlign as any, lineHeight: el.style.lineHeight, letterSpacing: `${el.style.letterSpacing}px`, whiteSpace: 'pre-wrap', wordBreak: 'break-word', width: '100%', height: '100%', userSelect: 'none', padding: '4px', border: selectedId === el.id ? '1px dashed #3b82f6' : '1px solid transparent' }}>
                             {el.content}
                         </div>
                     ) : ( <img src={el.content} alt="element" className="w-full h-full object-contain pointer-events-none" /> )}
                     {selectedId === el.id && (
                         <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none">
                            <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize pointer-events-auto shadow-sm z-50" onMouseDown={(e) => initResize(e, el.id)} onTouchStart={(e) => initResize(e, el.id)}></div>
                         </div>
                     )}
                 </div>
             ))}
          </div>
      </div>
    </div>
  );
};
