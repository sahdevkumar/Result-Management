import React, { useState, useRef, useEffect } from 'react';
import { 
  Image as ImageIcon, Type, Save, Trash2, Droplet, Layout, Maximize, Minus, Plus, 
  List as ListIcon, Palette, Settings,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify
} from 'lucide-react';
import { useToast } from '../components/ToastContext';
import { DesignElement, SavedTemplate } from '../types';
import clsx from 'clsx';

type Tab = 'design' | 'list' | 'size';

export const TemplateDesign: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<Tab>('design');
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scale, setScale] = useState(0.8);
  
  // Canvas Size State (Default A4: 794x1123 px at 96 DPI)
  const [pageSize, setPageSize] = useState({ width: 794, height: 1123, name: 'A4' });
  const [customSize, setCustomSize] = useState({ width: 794, height: 1123 });
  
  // Template List State
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);

  const { showToast } = useToast();
  
  // Dragging state
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const elementStart = useRef({ x: 0, y: 0 });
  const draggedElementId = useRef<string | null>(null);

  // Resizing state
  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0 });
  const dimsStart = useRef({ w: 0, h: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load templates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('educore_templates');
    if (saved) {
      try {
        setSavedTemplates(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved templates");
      }
    }
  }, []);

  // Auto-fit on load
  useEffect(() => {
    if (containerRef.current) {
        const { clientWidth } = containerRef.current;
        const padding = 64; 
        const availableWidth = clientWidth - padding;
        if (availableWidth < pageSize.width) {
            setScale(Math.max(0.3, availableWidth / pageSize.width));
        }
    }
  }, [pageSize.width]);

  // --- Handlers ---

  const saveTemplate = () => {
    const name = prompt("Enter a name for this template:", `Template ${savedTemplates.length + 1}`);
    if (!name) return;

    const newTemplate: SavedTemplate = {
      id: Date.now().toString(),
      name,
      elements,
      width: pageSize.width,
      height: pageSize.height,
      createdAt: new Date().toLocaleDateString()
    };

    const updatedList = [...savedTemplates, newTemplate];
    setSavedTemplates(updatedList);
    localStorage.setItem('educore_templates', JSON.stringify(updatedList));
    showToast("Template saved successfully", 'success');
  };

  const deleteTemplate = (id: string) => {
    if(!confirm("Delete this template?")) return;
    const updatedList = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(updatedList);
    localStorage.setItem('educore_templates', JSON.stringify(updatedList));
    showToast("Template deleted", 'info');
  };

  const loadTemplate = (template: SavedTemplate) => {
    setElements(template.elements);
    setPageSize({ width: template.width, height: template.height, name: 'Custom' });
    setCustomSize({ width: template.width, height: template.height });
    showToast(`Loaded "${template.name}"`, 'success');
  };

  const applyPageSize = (width: number, height: number, name: string) => {
    setPageSize({ width, height, name });
    setCustomSize({ width, height });
  };

  const getClientCoords = (e: MouseEvent | TouchEvent) => {
    if ('touches' in e) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  // --- Element Interaction Logic ---
  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      const coords = getClientCoords(e);

      if (isDragging.current && draggedElementId.current) {
        if (e.type === 'touchmove') e.preventDefault(); 

        const dx = (coords.x - dragStart.current.x) / scale;
        const dy = (coords.y - dragStart.current.y) / scale;
        
        setElements(prev => prev.map(el => {
          if (el.id === draggedElementId.current) {
            return {
              ...el,
              x: elementStart.current.x + dx,
              y: elementStart.current.y + dy
            };
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

  const addText = () => {
    const newEl: DesignElement = {
      id: Date.now().toString(),
      type: 'text',
      x: 50,
      y: 50,
      width: 300,
      height: 100,
      content: 'New Text Block',
      style: {
        fontSize: 24,
        fontFamily: 'Inter',
        color: '#000000',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        opacity: 1,
        textAlign: 'left',
        lineHeight: 1.2,
        letterSpacing: 0
      }
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
          id: Date.now().toString(),
          type: isWatermark ? 'watermark' : 'image',
          x: isWatermark ? 0 : 50,
          y: isWatermark ? 0 : 50,
          width: isWatermark ? pageSize.width : 200,
          height: isWatermark ? pageSize.height : 200,
          content: event.target?.result as string,
          style: {
            opacity: isWatermark ? 0.15 : 1
          }
        };
        if (isWatermark) {
          setElements(prev => [...prev.filter(el => el.type !== 'watermark'), newEl]);
        } else {
          setElements(prev => [...prev, newEl]);
        }
        setSelectedId(newEl.id);
      };
      reader.readAsDataURL(file);
    }
  };

  const initDrag = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation();
    let clientX, clientY;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }
    setSelectedId(id);
    isDragging.current = true;
    draggedElementId.current = id;
    dragStart.current = { x: clientX, y: clientY };
    const el = elements.find(item => item.id === id);
    if (el) {
      elementStart.current = { x: el.x, y: el.y };
    }
  };

  const initResize = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation();
    let clientX, clientY;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }
    isResizing.current = true;
    draggedElementId.current = id;
    resizeStart.current = { x: clientX, y: clientY };
    const el = elements.find(item => item.id === id);
    if (el) {
      dimsStart.current = { w: el.width || 100, h: el.height || 100 };
    }
  };

  const updateElementStyle = (key: string, value: any) => {
    if (!selectedId) return;
    setElements(prev => prev.map(el => {
      if (el.id === selectedId) {
        return { ...el, style: { ...el.style, [key]: value } };
      }
      return el;
    }));
  };

  const updateElementContent = (value: string) => {
    if (!selectedId) return;
    setElements(prev => prev.map(el => {
      if (el.id === selectedId) {
        return { ...el, content: value };
      }
      return el;
    }));
  };

  const deleteElement = () => {
    if (!selectedId) return;
    setElements(prev => prev.filter(el => el.id !== selectedId));
    setSelectedId(null);
  };

  const insertPlaceholder = (placeholder: string) => {
     if (!selectedId) return;
     const el = elements.find(e => e.id === selectedId);
     if (el && el.type === 'text') {
         updateElementContent(el.content + ' ' + placeholder);
     }
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)] lg:h-[calc(100vh-2rem)]">
      
      {/* Sidebar / Controls Panel */}
      <div className="lg:w-80 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-h-[40vh] lg:max-h-full">
        
        {/* Tab Header */}
        <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('design')}
            className={clsx("flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1", activeTab === 'design' ? "bg-slate-50 text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:bg-slate-50")}
          >
            <Palette size={14} /> Dsgn
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={clsx("flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1", activeTab === 'list' ? "bg-slate-50 text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:bg-slate-50")}
          >
            <ListIcon size={14} /> List
          </button>
          <button 
            onClick={() => setActiveTab('size')}
            className={clsx("flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1", activeTab === 'size' ? "bg-slate-50 text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:bg-slate-50")}
          >
            <Settings size={14} /> Size
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto flex-1">
          
          {/* DESIGN TAB */}
          {activeTab === 'design' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
                <button onClick={addText} className="flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-2 px-3 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium transition-colors">
                  <Type size={16} /> <span className="hidden sm:inline">Add Text</span>
                </button>
                <label className="flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-2 px-3 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium transition-colors cursor-pointer">
                  <ImageIcon size={16} /> <span className="hidden sm:inline">Logo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, false)} />
                </label>
                <label className="flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-2 px-3 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium transition-colors cursor-pointer">
                  <Droplet size={16} /> <span className="hidden sm:inline">Watermark</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, true)} />
                </label>
              </div>

              {selectedElement ? (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                   <div className="flex justify-between items-center">
                       <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Properties</span>
                       <button onClick={deleteElement} className="text-red-500 bg-red-50 p-1.5 rounded hover:bg-red-100">
                          <Trash2 size={14} />
                       </button>
                   </div>

                   {/* TEXT PROPERTIES */}
                   {selectedElement.type === 'text' && (
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Content</label>
                              <textarea 
                                className="w-full p-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                                rows={2}
                                value={selectedElement.content}
                                onChange={(e) => updateElementContent(e.target.value)}
                              />
                              <div className="mt-2 flex flex-wrap gap-1">
                                  {['{{name}}', '{{roll}}', '{{total}}', '{{exam}}', '{{marks_table}}'].map(ph => (
                                      <button 
                                        key={ph} 
                                        onClick={() => insertPlaceholder(ph)}
                                        className="text-[10px] bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 text-slate-600"
                                      >
                                          {ph}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          {/* Font Family, Size, Color */}
                          <div className="flex gap-2">
                              <div className="flex-1">
                                   <label className="block text-[10px] text-slate-400 mb-1">Font</label>
                                   <select 
                                      className="w-full p-1.5 border border-slate-300 rounded text-xs"
                                      value={selectedElement.style.fontFamily || 'Inter'}
                                      onChange={(e) => updateElementStyle('fontFamily', e.target.value)}
                                  >
                                      <option value="Inter">Inter</option>
                                      <option value="Times New Roman">Times New Roman</option>
                                      <option value="Courier New">Courier New</option>
                                      <option value="Arial">Arial</option>
                                  </select>
                              </div>
                              <div className="w-16">
                                   <label className="block text-[10px] text-slate-400 mb-1">Size</label>
                                   <input 
                                      type="number" 
                                      className="w-full p-1.5 border border-slate-300 rounded text-xs"
                                      value={selectedElement.style.fontSize || 16}
                                      onChange={(e) => updateElementStyle('fontSize', parseInt(e.target.value))}
                                  />
                              </div>
                              <div className="w-10">
                                   <label className="block text-[10px] text-slate-400 mb-1">Color</label>
                                   <input 
                                      type="color" 
                                      className="w-full h-[26px] border border-slate-300 rounded p-0.5 cursor-pointer"
                                      value={selectedElement.style.color || '#000000'}
                                      onChange={(e) => updateElementStyle('color', e.target.value)}
                                  />
                              </div>
                          </div>

                          {/* Formatting: Bold, Italic, Underline */}
                          <div>
                              <label className="block text-[10px] text-slate-400 mb-1">Style</label>
                              <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                                  <button 
                                      onClick={() => updateElementStyle('fontWeight', selectedElement.style.fontWeight === 'bold' ? 'normal' : 'bold')}
                                      className={clsx("flex-1 py-1.5 flex justify-center hover:bg-slate-200 transition-colors", selectedElement.style.fontWeight === 'bold' && "bg-slate-300 text-slate-900")}
                                      title="Bold"
                                  >
                                      <Bold size={14} />
                                  </button>
                                  <div className="w-px bg-slate-200"></div>
                                  <button 
                                      onClick={() => updateElementStyle('fontStyle', selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic')}
                                      className={clsx("flex-1 py-1.5 flex justify-center hover:bg-slate-200 transition-colors", selectedElement.style.fontStyle === 'italic' && "bg-slate-300 text-slate-900")}
                                      title="Italic"
                                  >
                                      <Italic size={14} />
                                  </button>
                                  <div className="w-px bg-slate-200"></div>
                                  <button 
                                      onClick={() => updateElementStyle('textDecoration', selectedElement.style.textDecoration === 'underline' ? 'none' : 'underline')}
                                      className={clsx("flex-1 py-1.5 flex justify-center hover:bg-slate-200 transition-colors", selectedElement.style.textDecoration === 'underline' && "bg-slate-300 text-slate-900")}
                                      title="Underline"
                                  >
                                      <Underline size={14} />
                                  </button>
                              </div>
                          </div>

                          {/* Alignment */}
                          <div>
                              <label className="block text-[10px] text-slate-400 mb-1">Alignment</label>
                              <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                                  <button 
                                      onClick={() => updateElementStyle('textAlign', 'left')}
                                      className={clsx("flex-1 py-1.5 flex justify-center hover:bg-slate-200 transition-colors", (selectedElement.style.textAlign === 'left' || !selectedElement.style.textAlign) && "bg-slate-300 text-slate-900")}
                                      title="Left"
                                  >
                                      <AlignLeft size={14} />
                                  </button>
                                  <div className="w-px bg-slate-200"></div>
                                  <button 
                                      onClick={() => updateElementStyle('textAlign', 'center')}
                                      className={clsx("flex-1 py-1.5 flex justify-center hover:bg-slate-200 transition-colors", selectedElement.style.textAlign === 'center' && "bg-slate-300 text-slate-900")}
                                      title="Center"
                                  >
                                      <AlignCenter size={14} />
                                  </button>
                                  <div className="w-px bg-slate-200"></div>
                                  <button 
                                      onClick={() => updateElementStyle('textAlign', 'right')}
                                      className={clsx("flex-1 py-1.5 flex justify-center hover:bg-slate-200 transition-colors", selectedElement.style.textAlign === 'right' && "bg-slate-300 text-slate-900")}
                                      title="Right"
                                  >
                                      <AlignRight size={14} />
                                  </button>
                                  <div className="w-px bg-slate-200"></div>
                                   <button 
                                      onClick={() => updateElementStyle('textAlign', 'justify')}
                                      className={clsx("flex-1 py-1.5 flex justify-center hover:bg-slate-200 transition-colors", selectedElement.style.textAlign === 'justify' && "bg-slate-300 text-slate-900")}
                                      title="Justify"
                                  >
                                      <AlignJustify size={14} />
                                  </button>
                              </div>
                          </div>

                          {/* Spacing */}
                          <div className="grid grid-cols-2 gap-2">
                              <div>
                                   <label className="block text-[10px] text-slate-400 mb-1">Line Height</label>
                                   <input 
                                      type="number" 
                                      step="0.1"
                                      min="0.5"
                                      max="3"
                                      className="w-full p-1.5 border border-slate-300 rounded text-xs"
                                      value={selectedElement.style.lineHeight || 1.2}
                                      onChange={(e) => updateElementStyle('lineHeight', parseFloat(e.target.value))}
                                  />
                              </div>
                              <div>
                                   <label className="block text-[10px] text-slate-400 mb-1">Letter Spacing (px)</label>
                                   <input 
                                      type="number" 
                                      step="0.5"
                                      className="w-full p-1.5 border border-slate-300 rounded text-xs"
                                      value={selectedElement.style.letterSpacing || 0}
                                      onChange={(e) => updateElementStyle('letterSpacing', parseFloat(e.target.value))}
                                  />
                              </div>
                          </div>
                      </div>
                   )}

                   {/* IMAGE PROPERTIES */}
                   {(selectedElement.type === 'image' || selectedElement.type === 'watermark') && (
                      <div>
                         <label className="block text-xs font-medium text-slate-500 mb-1">Opacity: {Math.round((selectedElement.style.opacity || 1) * 100)}%</label>
                         <input 
                            type="range" 
                            min="0" max="100" 
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            value={(selectedElement.style.opacity || 1) * 100}
                            onChange={(e) => updateElementStyle('opacity', parseInt(e.target.value) / 100)}
                         />
                      </div>
                   )}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                   Select an element to edit
                </div>
              )}
            </div>
          )}

          {/* LIST TAB */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <button 
                onClick={saveTemplate}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
              >
                  <Save size={16} /> Save Current Layout
              </button>
              
              <div className="space-y-2 mt-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Saved Templates</h3>
                {savedTemplates.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No templates saved.</p>
                ) : (
                  savedTemplates.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 group">
                      <div className="overflow-hidden">
                        <p className="font-medium text-sm text-slate-700 truncate">{t.name}</p>
                        <p className="text-[10px] text-slate-400">{t.width}x{t.height} • {t.createdAt}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => loadTemplate(t)} className="text-blue-500 hover:text-blue-700 p-1" title="Load">
                          <Layout size={16} />
                        </button>
                        <button onClick={() => deleteTemplate(t.id)} className="text-red-400 hover:text-red-600 p-1" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SIZE TAB */}
          {activeTab === 'size' && (
            <div className="space-y-6">
               <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Presets</h3>
                  <div className="grid grid-cols-2 gap-2">
                     <button 
                        onClick={() => applyPageSize(794, 1123, 'A4')}
                        className={clsx("p-2 border rounded text-sm", pageSize.name === 'A4' ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-slate-200 text-slate-600")}
                     >
                        A4 (Portrait)
                     </button>
                     <button 
                        onClick={() => applyPageSize(1123, 794, 'A4-L')}
                        className={clsx("p-2 border rounded text-sm", pageSize.name === 'A4-L' ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-slate-200 text-slate-600")}
                     >
                        A4 (Landscape)
                     </button>
                     <button 
                        onClick={() => applyPageSize(816, 1056, 'Letter')}
                        className={clsx("p-2 border rounded text-sm", pageSize.name === 'Letter' ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-slate-200 text-slate-600")}
                     >
                        Letter
                     </button>
                      <button 
                        onClick={() => applyPageSize(559, 794, 'A5')}
                        className={clsx("p-2 border rounded text-sm", pageSize.name === 'A5' ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-slate-200 text-slate-600")}
                     >
                        A5
                     </button>
                  </div>
               </div>

               <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Custom Size (px)</h3>
                  <div className="flex gap-2 mb-2">
                     <div className="flex-1">
                        <label className="text-[10px] text-slate-400">Width</label>
                        <input 
                           type="number" 
                           className="w-full p-2 border border-slate-300 rounded text-sm"
                           value={customSize.width}
                           onChange={(e) => setCustomSize({...customSize, width: parseInt(e.target.value) || 0})}
                        />
                     </div>
                     <div className="flex-1">
                        <label className="text-[10px] text-slate-400">Height</label>
                        <input 
                           type="number" 
                           className="w-full p-2 border border-slate-300 rounded text-sm"
                           value={customSize.height}
                           onChange={(e) => setCustomSize({...customSize, height: parseInt(e.target.value) || 0})}
                        />
                     </div>
                  </div>
                  <button 
                     onClick={() => applyPageSize(customSize.width, customSize.height, 'Custom')}
                     className="w-full py-2 bg-slate-800 text-white rounded text-sm font-medium"
                  >
                     Apply Custom Size
                  </button>
               </div>
               
               <div className="bg-amber-50 border border-amber-100 p-3 rounded text-xs text-amber-800">
                  Note: Standard sizes based on 96 DPI.
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 bg-slate-200/50 rounded-xl overflow-auto flex items-start justify-center p-4 lg:p-8 relative border border-slate-300/50"
      >
          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white/90 backdrop-blur shadow-sm p-1.5 rounded-lg border border-slate-200">
             <button onClick={() => setScale(s => Math.max(0.2, s - 0.1))} className="p-1 hover:bg-slate-100 rounded">
                <Minus size={14} />
             </button>
             <span className="text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
             <button onClick={() => setScale(s => Math.min(2.0, s + 0.1))} className="p-1 hover:bg-slate-100 rounded">
                <Plus size={14} />
             </button>
             <div className="w-px h-4 bg-slate-200 mx-1"></div>
             <button onClick={() => setScale(0.8)} className="p-1 hover:bg-slate-100 rounded" title="Reset">
                <Maximize size={14} />
             </button>
          </div>

          <div 
             ref={canvasRef}
             className="bg-white shadow-2xl relative transition-transform origin-top select-none shrink-0"
             style={{
                 width: `${pageSize.width}px`,
                 height: `${pageSize.height}px`,
                 transform: `scale(${scale})`,
                 marginBottom: `${pageSize.height * (scale - 0.5)}px`, 
                 marginRight: `${Math.max(0, pageSize.width * (scale - 1))}px`
             }}
             onClick={() => setSelectedId(null)}
          >
             {/* Render Elements */}
             {elements.map(el => (
                 <div
                    key={el.id}
                    className={clsx(
                        "absolute group",
                        selectedId === el.id ? "z-50 cursor-move" : "z-10 cursor-pointer"
                    )}
                    style={{
                        left: el.x,
                        top: el.y,
                        width: el.width,
                        height: el.height,
                        zIndex: el.type === 'watermark' ? 0 : undefined,
                        opacity: el.style.opacity,
                        pointerEvents: el.type === 'watermark' && selectedId !== el.id ? 'none' : 'auto'
                    }}
                    onMouseDown={(e) => initDrag(e, el.id)}
                    onTouchStart={(e) => initDrag(e, el.id)}
                 >
                     {/* Content */}
                     {el.type === 'text' ? (
                         <div style={{
                             fontSize: `${el.style.fontSize}px`,
                             fontFamily: el.style.fontFamily,
                             color: el.style.color,
                             fontWeight: el.style.fontWeight,
                             fontStyle: el.style.fontStyle,
                             textDecoration: el.style.textDecoration,
                             textAlign: el.style.textAlign as any,
                             lineHeight: el.style.lineHeight,
                             letterSpacing: `${el.style.letterSpacing}px`,
                             whiteSpace: 'pre-wrap', // Allow wrapping
                             wordBreak: 'break-word',
                             width: '100%',
                             height: '100%',
                             userSelect: 'none',
                             padding: '4px',
                             border: selectedId === el.id ? '1px dashed #3b82f6' : '1px solid transparent'
                         }}>
                             {el.content}
                         </div>
                     ) : (
                         <img 
                            src={el.content} 
                            alt="design element" 
                            className="w-full h-full object-contain pointer-events-none" 
                         />
                     )}

                     {/* Selection Highlights */}
                     {selectedId === el.id && (
                         <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none">
                             {/* Resize Handle (Bottom Right) */}
                             {(el.type !== 'text' || true) && (
                                <div 
                                    className="absolute -bottom-2 -right-2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize pointer-events-auto flex items-center justify-center shadow-sm z-50 touch-manipulation"
                                    onMouseDown={(e) => initResize(e, el.id)}
                                    onTouchStart={(e) => initResize(e, el.id)}
                                >
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                </div>
                             )}
                         </div>
                     )}
                 </div>
             ))}
             
             {elements.length === 0 && (
                 <div className="absolute inset-0 flex items-center justify-center text-slate-300 pointer-events-none">
                     <div className="text-center">
                         <Layout size={48} className="mx-auto mb-2 opacity-50" />
                         <p>{pageSize.name} ({pageSize.width}x{pageSize.height})</p>
                         <p className="text-sm">Drag and drop elements here</p>
                     </div>
                 </div>
             )}
          </div>
      </div>
    </div>
  );
};