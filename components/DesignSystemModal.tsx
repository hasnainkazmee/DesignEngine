
import React, { useState } from 'react';
import { X, Grid, Type, Palette, Trash2, Plus } from 'lucide-react';
import { GridConfig, DesignSystem } from '../types';

interface DesignSystemModalProps {
  onClose: () => void;
  config: GridConfig;
  system: DesignSystem;
  onUpdateConfig: (config: GridConfig) => void;
  onUpdateSystem: (system: DesignSystem) => void;
}

export const DesignSystemModal: React.FC<DesignSystemModalProps> = ({ onClose, config, onUpdateConfig, system, onUpdateSystem }) => {
  const [activeTab, setActiveTab] = useState<'grid'|'type'|'color'>('grid');
  
  // Temporary state for new items
  const [newColor, setNewColor] = useState({ name: '', value: '#000000' });
  const [newType, setNewType] = useState({ name: '', family: 'Inter', size: 16, weight: '400', lineHeight: 1.5 });
  const [isAdding, setIsAdding] = useState(false);

  const handleChange = (key: keyof GridConfig, value: number) => {
    onUpdateConfig({ ...config, [key]: value });
  };

  const handleAddColor = () => {
      if (!newColor.name) return;
      onUpdateSystem({
          ...system,
          colors: [...system.colors, newColor]
      });
      setNewColor({ name: '', value: '#000000' });
      setIsAdding(false);
  };

  const handleDeleteColor = (idx: number) => {
      onUpdateSystem({
          ...system,
          colors: system.colors.filter((_, i) => i !== idx)
      });
  };

  const handleAddType = () => {
      if (!newType.name) return;
      onUpdateSystem({
          ...system,
          typography: [...system.typography, newType]
      });
      setNewType({ name: '', family: 'Inter', size: 16, weight: '400', lineHeight: 1.5 });
      setIsAdding(false);
  };

  const handleDeleteType = (idx: number) => {
      onUpdateSystem({
          ...system,
          typography: system.typography.filter((_, i) => i !== idx)
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl w-[800px] h-[600px] flex overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Sidebar */}
        <div className="w-48 border-r border-zinc-800 bg-zinc-950 p-4">
             <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Master System</h3>
             <div className="space-y-1">
                 <button 
                    onClick={() => { setActiveTab('grid'); setIsAdding(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 ${activeTab === 'grid' ? 'bg-blue-900/20 text-blue-400 border border-blue-500/20' : 'text-zinc-400 hover:bg-zinc-900'}`}
                 >
                    <Grid size={14} /> Grid & Layout
                 </button>
                 <button 
                    onClick={() => { setActiveTab('type'); setIsAdding(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 ${activeTab === 'type' ? 'bg-blue-900/20 text-blue-400 border border-blue-500/20' : 'text-zinc-400 hover:bg-zinc-900'}`}
                 >
                    <Type size={14} /> Typography
                 </button>
                 <button 
                    onClick={() => { setActiveTab('color'); setIsAdding(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 ${activeTab === 'color' ? 'bg-blue-900/20 text-blue-400 border border-blue-500/20' : 'text-zinc-400 hover:bg-zinc-900'}`}
                 >
                    <Palette size={14} /> Color Palette
                 </button>
             </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
             <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50">
                 <h2 className="font-semibold text-white">
                     {activeTab === 'grid' && 'Grid Configuration'}
                     {activeTab === 'type' && 'Global Typography'}
                     {activeTab === 'color' && 'Color Palette'}
                 </h2>
                 <button onClick={onClose} className="text-zinc-500 hover:text-white">
                     <X size={20} />
                 </button>
             </div>
             
             <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                 {activeTab === 'grid' && (
                     <>
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Column Count</label>
                                <input 
                                type="number" 
                                value={config.columns} 
                                onChange={(e) => handleChange('columns', parseInt(e.target.value))}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 focus:outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Gutter Width (px)</label>
                                <input 
                                type="number" 
                                value={config.gutter} 
                                onChange={(e) => handleChange('gutter', parseInt(e.target.value))}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 focus:outline-none" 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Baseline Rhythm (pt)</label>
                                <input 
                                type="number" 
                                value={config.baseline} 
                                onChange={(e) => handleChange('baseline', parseInt(e.target.value))}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 focus:outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Side Margins (px)</label>
                                <input 
                                type="number" 
                                value={config.margin} 
                                onChange={(e) => handleChange('margin', parseInt(e.target.value))}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 focus:outline-none" 
                                />
                            </div>
                        </div>
                     </>
                 )}

                 {activeTab === 'type' && (
                     <div className="space-y-4">
                        {system.typography.map((style, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded group hover:border-zinc-700">
                                <div>
                                    <div className="text-white text-sm font-bold">{style.name}</div>
                                    <div className="text-zinc-500 text-xs">{style.family} • {style.weight} • {style.size}px • LH {style.lineHeight}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-white" style={{ fontFamily: style.family, fontWeight: style.weight, fontSize: '24px' }}>Aa</div>
                                    <button onClick={() => handleDeleteType(i)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                         
                         {!isAdding ? (
                             <button onClick={() => setIsAdding(true)} className="w-full py-2 bg-zinc-800 text-zinc-400 text-xs rounded hover:bg-zinc-700 border border-zinc-700 border-dashed flex items-center justify-center gap-2">
                                <Plus size={14} /> Add Typographic Scale
                             </button>
                         ) : (
                             <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded space-y-3">
                                <h4 className="text-xs font-bold text-zinc-300 uppercase">New Style</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <input placeholder="Style Name (e.g. H1)" className="bg-zinc-900 border border-zinc-700 p-2 rounded text-xs text-white" value={newType.name} onChange={e => setNewType({...newType, name: e.target.value})} />
                                    <select className="bg-zinc-900 border border-zinc-700 p-2 rounded text-xs text-white" value={newType.family} onChange={e => setNewType({...newType, family: e.target.value})}>
                                        <option value="Inter">Inter</option>
                                        <option value="JetBrains Mono">Mono</option>
                                        <option value="serif">Serif</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <input type="number" placeholder="Size" className="bg-zinc-900 border border-zinc-700 p-2 rounded text-xs text-white" value={newType.size} onChange={e => setNewType({...newType, size: parseInt(e.target.value)})} />
                                    <select className="bg-zinc-900 border border-zinc-700 p-2 rounded text-xs text-white" value={newType.weight} onChange={e => setNewType({...newType, weight: e.target.value})}>
                                        <option value="300">Light</option>
                                        <option value="400">Regular</option>
                                        <option value="600">SemiBold</option>
                                        <option value="700">Bold</option>
                                    </select>
                                    <input type="number" step="0.1" placeholder="LH" className="bg-zinc-900 border border-zinc-700 p-2 rounded text-xs text-white" value={newType.lineHeight} onChange={e => setNewType({...newType, lineHeight: parseFloat(e.target.value)})} />
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    <button onClick={() => setIsAdding(false)} className="px-3 py-1 text-xs text-zinc-400 hover:text-white">Cancel</button>
                                    <button onClick={handleAddType} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500">Add Style</button>
                                </div>
                             </div>
                         )}
                     </div>
                 )}

                {activeTab === 'color' && (
                     <div className="grid grid-cols-2 gap-4">
                        {system.colors.map((color, i) => (
                            <div key={i} className="p-4 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded border border-zinc-700" style={{ backgroundColor: color.value }}></div>
                                    <div>
                                        <div className="text-white text-sm font-bold">{color.name}</div>
                                        <div className="text-zinc-500 text-xs font-mono">{color.value}</div>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteColor(i)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                            </div>
                        ))}
                         
                         {!isAdding ? (
                             <button onClick={() => setIsAdding(true)} className="w-full py-2 bg-zinc-800 text-zinc-400 text-xs rounded hover:bg-zinc-700 border border-zinc-700 border-dashed col-span-2 flex items-center justify-center gap-2">
                                <Plus size={14} /> Add Global Color
                             </button>
                         ) : (
                             <div className="col-span-2 p-4 bg-zinc-800/50 border border-zinc-700 rounded space-y-3">
                                 <h4 className="text-xs font-bold text-zinc-300 uppercase">New Color</h4>
                                 <div className="flex gap-2">
                                    <input placeholder="Color Name" className="flex-1 bg-zinc-900 border border-zinc-700 p-2 rounded text-xs text-white" value={newColor.name} onChange={e => setNewColor({...newColor, name: e.target.value})} />
                                    <input type="color" className="bg-zinc-900 border border-zinc-700 h-9 w-12 rounded cursor-pointer" value={newColor.value} onChange={e => setNewColor({...newColor, value: e.target.value})} />
                                 </div>
                                 <div className="flex gap-2 justify-end pt-2">
                                    <button onClick={() => setIsAdding(false)} className="px-3 py-1 text-xs text-zinc-400 hover:text-white">Cancel</button>
                                    <button onClick={handleAddColor} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500">Add Color</button>
                                </div>
                             </div>
                         )}
                     </div>
                 )}
             </div>

             <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-end gap-3">
                 <button onClick={onClose} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded text-sm transition-colors">Done</button>
             </div>
        </div>

      </div>
    </div>
  );
};
