
import React, { useState, useRef, useEffect } from 'react';
import { DesignElement, DesignSystem } from '../types';
import { 
    Move, Ban, Lock, PaintBucket, Type, Square, Layers, Circle, Link, Plus, 
    Image as ImageIcon, Sliders, Wand2, Sun, Moon, Droplet, Eye, Layout, 
    Palette, Box, BarChart3, GripHorizontal, Bookmark, Group, Ungroup, Scissors, Sparkles as MaskIcon,
    ChevronsUp, ChevronUp, ChevronDown, ChevronsDown
} from 'lucide-react';

interface PropertiesPanelProps {
  elements: DesignElement[]; 
  onUpdate: (updates: Partial<DesignElement>) => void;
  onCreateComponent: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onMask?: () => void;
  onUnmask?: () => void;
  onReorder?: (id: string, action: 'front' | 'back' | 'forward' | 'backward') => void;
  system: DesignSystem;
}

const ScrubbableInput = ({ label, value, onChange, unit = '' }: { label: string, value: number, onChange: (val: number) => void, unit?: string }) => {
    const isDragging = useRef(false);
    const startX = useRef(0);
    const startValue = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        startX.current = e.clientX;
        startValue.current = value;
        document.body.style.cursor = 'ew-resize';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        const delta = e.clientX - startX.current;
        onChange(Math.round(startValue.current + delta));
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.body.style.cursor = 'default';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    return (
        <div className="bg-zinc-900 rounded p-1.5 border border-zinc-800 flex items-center gap-2 group focus-within:border-blue-500/50 transition-colors">
            <span className="text-zinc-500 text-[10px] font-mono w-4 cursor-ew-resize select-none hover:text-white transition-colors" onMouseDown={handleMouseDown}>{label}</span>
            <input type="number" value={value} onChange={(e) => onChange(parseInt(e.target.value) || 0)} className="bg-transparent w-full text-right text-xs font-mono focus:outline-none text-zinc-300 appearance-none" />
            {unit && <span className="text-zinc-600 text-[10px]">{unit}</span>}
        </div>
    );
};

const ProSlider = ({ value, min = 0, max = 100, onChange }: { value: number, min?: number, max?: number, onChange: (val: number) => void }) => (
    <div className="relative w-full h-4 flex items-center group">
        <div className="absolute inset-x-0 h-[2px] bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-blue-600" style={{ width: `${((value - min) / (max - min)) * 100}%` }} /></div>
        <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        <div className="w-2 h-2 bg-white rounded-full shadow border border-zinc-400 pointer-events-none absolute transition-transform group-hover:scale-125" style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 4px)` }} />
    </div>
);

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ elements, onUpdate, onCreateComponent, onGroup, onUngroup, onMask, onUnmask, onReorder, system }) => {
  const [activeTab, setActiveTab] = useState<'layout' | 'style' | 'image' | 'effects'>('layout');

  if (elements.length === 0) return <div className="flex-1 p-6 flex flex-col items-center justify-center text-zinc-600 text-center h-full"><div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4"><Layers size={20} /></div><p className="text-sm font-medium text-zinc-400">No Selection</p><p className="text-xs mt-2 text-zinc-500 max-w-[180px]">Select an element to edit.</p></div>;

  if (elements.length > 1) {
      return (
        <div className="flex-1 overflow-hidden bg-zinc-950 flex flex-col h-full border-l border-zinc-800">
             <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1"><Layers size={10} /> Mixed Selection</span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">{elements.length} Items</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={onGroup} className="flex-1 flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] py-1 rounded transition-colors"><Group size={10} /> Group</button>
                    {onMask && <button onClick={onMask} className="flex-1 flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] py-1 rounded transition-colors"><MaskIcon size={10} /> Mask</button>}
                    <button onClick={onUngroup} className="flex-1 flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] py-1 rounded transition-colors"><Ungroup size={10} /> Ungroup</button>
                </div>
            </div>
            <div className="p-4 text-center text-zinc-500 text-xs">Multiple objects selected. Group them to edit layout constraints together.</div>
        </div>
      );
  }

  const element = elements[0];
  const handleStyleChange = (key: string, value: any) => { onUpdate({ style: { ...element.style, [key]: value } }); };
  const applySystemTypography = (name: string) => {
      const typeStyle = system.typography.find(t => t.name === name);
      if (typeStyle) onUpdate({ style: { ...element.style, fontFamily: typeStyle.family, fontSize: typeStyle.size, fontWeight: typeStyle.weight, lineHeight: typeStyle.lineHeight } });
  };
  const TabButton = ({ id, icon: Icon, label }: { id: any, icon: any, label: string }) => (
      <button onClick={() => setActiveTab(id)} className={`flex-1 flex flex-col items-center justify-center py-2 text-[9px] uppercase tracking-wider gap-1 border-b-2 transition-colors ${activeTab === id ? 'border-blue-500 text-blue-400 bg-zinc-900/50' : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'}`}><Icon size={14} />{label}</button>
  );

  return (
    <div className="flex-1 overflow-hidden bg-zinc-950 flex flex-col h-full border-l border-zinc-800">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
            {element.type === 'text' ? <Type size={10} /> : element.type === 'image' ? <ImageIcon size={10} /> : element.type === 'group' ? <Group size={10} /> : <Box size={10} />}
            {element.type.toUpperCase()}
          </span>
          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono truncate max-w-[100px] select-all">{element.id}</span>
        </div>
        <div className="flex gap-2">
            <button onClick={onCreateComponent} className="flex-1 flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] py-1 rounded transition-colors"><Plus size={10} /> Component</button>
            {/* Mask/Unmask Logic */}
            {(element.clip || element.type === 'group') && onUnmask ? (
                <button onClick={onUnmask} className="flex-1 flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] py-1 rounded transition-colors"><Scissors size={10} /> Unmask</button>
            ) : element.type === 'group' ? (
                <button onClick={onUngroup} className="flex-1 flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] py-1 rounded transition-colors"><Ungroup size={10} /> Ungroup</button>
            ) : null}
        </div>
      </div>

      <div className="flex border-b border-zinc-800 shrink-0"><TabButton id="layout" icon={Layout} label="Layout" /><TabButton id="style" icon={Palette} label="Style" /><TabButton id="image" icon={Sliders} label="Image" /><TabButton id="effects" icon={Wand2} label="Effects" /></div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
      {activeTab === 'layout' && (
      <div className="p-4 space-y-6">
        <div>
            <h3 className="text-[10px] font-bold uppercase text-zinc-600 mb-3 flex items-center gap-2"><Move size={10} /> Dimensions</h3>
            <div className="grid grid-cols-2 gap-2 mb-2">
                <ScrubbableInput label="X" value={Math.round(element.x)} onChange={(v) => onUpdate({ x: v })} />
                <ScrubbableInput label="Y" value={Math.round(element.y)} onChange={(v) => onUpdate({ y: v })} />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
                <ScrubbableInput label="W" value={Math.round(element.width)} onChange={(v) => onUpdate({ width: v })} />
                <ScrubbableInput label="H" value={Math.round(element.height)} onChange={(v) => onUpdate({ height: v })} />
            </div>
            <ScrubbableInput label="R" value={Math.round(element.style?.rotation || 0)} onChange={(v) => handleStyleChange('rotation', v)} unit="deg" />
        </div>

        {onReorder && (
            <div>
                 <h3 className="text-[10px] font-bold uppercase text-zinc-600 mb-3 flex items-center gap-2"><Layers size={10} /> Arrange</h3>
                 <div className="flex gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded">
                    <button 
                        onClick={() => onReorder(element.id, 'front')} 
                        className="flex-1 h-7 flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors"
                        title="Bring to Front (Ctrl+Shift+])"
                    >
                        <ChevronsUp size={14} />
                    </button>
                    <button 
                        onClick={() => onReorder(element.id, 'forward')} 
                        className="flex-1 h-7 flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors"
                        title="Bring Forward (Ctrl+])"
                    >
                        <ChevronUp size={14} />
                    </button>
                    <button 
                        onClick={() => onReorder(element.id, 'backward')} 
                        className="flex-1 h-7 flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors"
                        title="Send Backward (Ctrl+[)"
                    >
                        <ChevronDown size={14} />
                    </button>
                    <button 
                        onClick={() => onReorder(element.id, 'back')} 
                        className="flex-1 h-7 flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors"
                        title="Send to Back (Ctrl+Shift+[)"
                    >
                        <ChevronsDown size={14} />
                    </button>
                 </div>
            </div>
        )}
        
        {/* CLIPPING MASK */}
        {(element.type === 'group' || element.type === 'box') && (
            <div>
                 <h3 className="text-[10px] font-bold uppercase text-zinc-600 mb-3 flex items-center gap-2"><Scissors size={10} /> Masking</h3>
                 <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-2 rounded">
                    <span className="text-xs text-zinc-300">Clip Content</span>
                    <input type="checkbox" checked={!!element.clip} onChange={(e) => onUpdate({ clip: e.target.checked })} className="accent-blue-500" />
                 </div>
            </div>
        )}

        <div>
            <h3 className="text-[10px] font-bold uppercase text-zinc-600 mb-3 flex items-center gap-2"><Link size={10} /> Constraints</h3>
            <div className="space-y-2">
                {element.constraints.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-zinc-900 p-2 rounded border border-zinc-800 group hover:border-zinc-700 transition-colors">
                        <span className="text-zinc-300 capitalize flex items-center gap-2"><Lock size={10} className="text-blue-500" />{c.replace('-', ' ')}</span>
                        <button onClick={() => onUpdate({ constraints: element.constraints.filter(con => con !== c) })} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"><Ban size={12} /></button>
                    </div>
                ))}
                <div className="mt-3 grid grid-cols-2 gap-2">
                    {!element.constraints.includes('grid-snap') && <button onClick={() => onUpdate({ constraints: [...element.constraints, 'grid-snap'] })} className="text-[10px] bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 py-1.5 rounded transition-colors">+ Grid Snap</button>}
                    {!element.constraints.includes('baseline-snap') && <button onClick={() => onUpdate({ constraints: [...element.constraints, 'baseline-snap'] })} className="text-[10px] bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 py-1.5 rounded transition-colors">+ Baseline</button>}
                </div>
            </div>
        </div>
      </div>
      )}

      {activeTab === 'style' && (
      <div className="p-4 space-y-6">
        <div>
            <h3 className="text-[10px] font-bold uppercase text-zinc-600 mb-3 flex items-center gap-2"><PaintBucket size={10} /> Fill</h3>
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-zinc-400">Color</span>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded border border-zinc-700 overflow-hidden relative cursor-pointer shadow-sm">
                            <input type="color" value={element.style?.backgroundColor || element.style?.color || '#2A4B8D'} onChange={(e) => element.type === 'text' ? handleStyleChange('color', e.target.value) : handleStyleChange('backgroundColor', e.target.value)} className="absolute -top-1 -left-1 w-12 h-12 opacity-0 cursor-pointer" />
                            <div className="w-full h-full" style={{ backgroundColor: element.style?.backgroundColor || element.style?.color || '#2A4B8D' }} />
                    </div>
                </div>
            </div>
            <div className="mt-3">
                <div className="text-[10px] text-zinc-500 mb-2">System Palette</div>
                <div className="grid grid-cols-6 gap-2">
                    {system.colors.map((c) => (
                        <button key={c.name} onClick={() => element.type === 'text' ? handleStyleChange('color', c.value) : handleStyleChange('backgroundColor', c.value)} className="w-6 h-6 rounded-full border border-zinc-700 hover:scale-110 transition-transform relative group" style={{ backgroundColor: c.value }} title={c.name} />
                    ))}
                </div>
            </div>
        </div>
        {element.type === 'text' && (
           <div>
               <h3 className="text-[10px] font-bold uppercase text-zinc-600 mb-3 flex items-center gap-2"><Type size={10} /> Typography</h3>
               <div className="space-y-3">
                   <div className="relative group"><div className="absolute inset-y-0 left-2 flex items-center pointer-events-none"><Bookmark size={10} className="text-blue-500"/></div><select className="w-full bg-zinc-900 border border-zinc-800 rounded pl-7 pr-2 py-1.5 text-xs text-zinc-300 focus:border-blue-500 outline-none appearance-none" onChange={(e) => applySystemTypography(e.target.value)} value=""><option value="" disabled>Apply System Style...</option>{system.typography.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}</select></div>
                   <div className="grid grid-cols-2 gap-2">
                       <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 focus:border-blue-500 outline-none appearance-none" value={element.style?.fontFamily} onChange={(e) => handleStyleChange('fontFamily', e.target.value)}><option value="Inter">Inter</option><option value="JetBrains Mono">Mono</option><option value="serif">Serif</option><option value="sans-serif">Sans</option></select>
                       <select className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 focus:border-blue-500 outline-none appearance-none" value={element.style?.fontWeight} onChange={(e) => handleStyleChange('fontWeight', e.target.value)}><option value="300">Light</option><option value="400">Regular</option><option value="500">Medium</option><option value="600">SemiBold</option><option value="700">Bold</option></select>
                   </div>
                   <div className="grid grid-cols-2 gap-2"><ScrubbableInput label="Sz" value={element.style?.fontSize || 16} onChange={(v) => handleStyleChange('fontSize', v)} unit="px" /><div className="bg-zinc-900 rounded p-1.5 border border-zinc-800 flex items-center gap-2"><span className="text-zinc-500 text-[10px] font-mono">LH</span><input type="number" step="0.1" value={element.style?.lineHeight || 1.2} onChange={(e) => handleStyleChange('lineHeight', parseFloat(e.target.value))} className="bg-transparent w-full text-right text-xs font-mono focus:outline-none text-zinc-300 appearance-none" /></div></div>
               </div>
           </div>
        )}
        {element.shapeType !== 'circle' && (
            <div><h3 className="text-[10px] font-bold uppercase text-zinc-600 mb-3 flex items-center gap-2"><Box size={10} /> Border & Radius</h3><div className="flex flex-col gap-2 pt-2"><div className="flex justify-between text-xs text-zinc-400"><span>Radius</span><span>{element.style?.borderRadius ?? 0}px</span></div><ProSlider min={0} max={100} value={element.style?.borderRadius ?? 0} onChange={(v) => handleStyleChange('borderRadius', v)} /></div></div>
        )}
      </div>
      )}

      {activeTab === 'image' && (
          <div className="p-4 space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded p-2"><div className="flex items-center justify-between mb-2"><span className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1"><BarChart3 size={10}/> Histogram</span></div><div className="h-16 flex items-end justify-between gap-px opacity-60">{Array.from({length: 40}).map((_, i) => <div key={i} className="flex-1 bg-zinc-500" style={{ height: `${Math.random() * 100}%` }}></div>)}</div></div>
              <div>
                  <h3 className="text-[10px] font-bold uppercase text-zinc-600 mb-3 flex items-center gap-2"><Sliders size={10} /> Color Adjustments</h3>
                  <div className="space-y-4">
                      <div className="space-y-1"><div className="flex justify-between text-[10px] text-zinc-400"><span className="flex items-center gap-1"><Sun size={10}/> Brightness</span><span>{element.style?.brightness ?? 100}%</span></div><ProSlider min={0} max={200} value={element.style?.brightness ?? 100} onChange={(v) => handleStyleChange('brightness', v)} /></div>
                      <div className="space-y-1"><div className="flex justify-between text-[10px] text-zinc-400"><span className="flex items-center gap-1"><Moon size={10}/> Contrast</span><span>{element.style?.contrast ?? 100}%</span></div><ProSlider min={0} max={200} value={element.style?.contrast ?? 100} onChange={(v) => handleStyleChange('contrast', v)} /></div>
                      <div className="space-y-1"><div className="flex justify-between text-[10px] text-zinc-400"><span className="flex items-center gap-1"><Droplet size={10}/> Saturation</span><span>{element.style?.saturate ?? 100}%</span></div><ProSlider min={0} max={200} value={element.style?.saturate ?? 100} onChange={(v) => handleStyleChange('saturate', v)} /></div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'effects' && (
         <div className="p-4 space-y-6">
             <div>
                <h3 className="text-[10px] font-bold uppercase text-zinc-600 mb-3 flex items-center gap-2"><Layers size={10} /> Compositing</h3>
                <div className="space-y-4">
                    <div className="space-y-1"><div className="flex justify-between text-[10px] text-zinc-400"><span className="flex items-center gap-1"><Eye size={10}/> Opacity</span><span>{Math.round((element.style?.opacity ?? 1) * 100)}%</span></div><ProSlider min={0} max={100} value={Math.round((element.style?.opacity ?? 1) * 100)} onChange={(v) => handleStyleChange('opacity', v / 100)} /></div>
                    <div className="space-y-1"><label className="text-[10px] text-zinc-400">Blend Mode</label><select className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 focus:border-blue-500 outline-none" value={element.style?.mixBlendMode || 'normal'} onChange={(e) => handleStyleChange('mixBlendMode', e.target.value)}><option value="normal">Normal</option><option value="multiply">Multiply</option><option value="screen">Screen</option><option value="overlay">Overlay</option></select></div>
                </div>
             </div>
             <div><h3 className="text-[10px] font-bold uppercase text-zinc-600 mb-3 flex items-center gap-2"><GripHorizontal size={10} /> Drop Shadow</h3><div className="flex items-center justify-between mb-2"><span className="text-xs text-zinc-400">Enable Shadow</span><input type="checkbox" checked={!!element.style?.boxShadow} onChange={(e) => handleStyleChange('boxShadow', e.target.checked ? '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)' : undefined)} className="accent-blue-500" /></div></div>
         </div>
      )}

      </div>
    </div>
  );
};
