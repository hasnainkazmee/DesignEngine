

import React from 'react';
import { DesignElement, ComponentItem, DesignSystem } from '../types';
import { X, Box, Type, Image as ImageIcon, Plus, Group } from 'lucide-react';

interface SidePanelsProps {
  activePanel: 'layers' | 'colors' | 'library';
  onClose: () => void;
  elements: DesignElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  components: ComponentItem[];
  onAddComponent: (component: ComponentItem) => void;
  system: DesignSystem;
}

export const SidePanels: React.FC<SidePanelsProps> = ({ 
    activePanel, 
    onClose, 
    elements, 
    selectedId, 
    onSelect,
    components,
    onAddComponent,
    system
}) => {
  
  const handleDragStart = (e: React.DragEvent, component: ComponentItem) => {
      e.dataTransfer.setData('application/json', JSON.stringify(component));
      e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col animate-in slide-in-from-left duration-200 relative z-20">
      <div className="h-10 border-b border-zinc-800 flex items-center justify-between px-3">
          <span className="text-xs font-bold uppercase text-zinc-400">
              {activePanel}
          </span>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300">
              <X size={14} />
          </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
          {activePanel === 'layers' && (
              <div className="space-y-1">
                  {[...elements].reverse().map((el) => {
                      // Add simple visual nesting
                      const isChild = !!el.parentId;
                      return (
                      <div 
                        key={el.id}
                        onClick={() => onSelect(el.id)}
                        className={`
                            flex items-center gap-2 p-2 rounded text-xs cursor-pointer
                            ${selectedId === el.id ? 'bg-blue-900/30 text-blue-200' : 'hover:bg-zinc-900 text-zinc-400'}
                            ${isChild ? 'ml-4 border-l border-zinc-800 pl-2' : ''}
                        `}
                      >
                          {el.type === 'text' && <Type size={12} />}
                          {el.type === 'box' && <Box size={12} />}
                          {el.type === 'image' && <ImageIcon size={12} />}
                          {el.type === 'group' && <Group size={12} />}
                          <span className="truncate flex-1">
                              {el.type === 'text' ? (el.content?.slice(0, 20) || 'Text') : el.id}
                          </span>
                      </div>
                  )})}
              </div>
          )}

          {activePanel === 'colors' && (
              <div className="space-y-4 p-2">
                  <div>
                      <h4 className="text-[10px] font-bold text-zinc-600 uppercase mb-2">System Colors</h4>
                      <div className="grid grid-cols-2 gap-2">
                          {system.colors.map(color => (
                              <div key={color.name} className="flex flex-col gap-1 group cursor-pointer">
                                  <div className="h-12 rounded border border-zinc-800 relative overflow-hidden">
                                      <div className="absolute inset-0" style={{ backgroundColor: color.value }}></div>
                                  </div>
                                  <div className="flex flex-col">
                                      <span className="text-[10px] text-zinc-300 font-medium truncate">{color.name}</span>
                                      <span className="text-[9px] text-zinc-600 font-mono">{color.value}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {activePanel === 'library' && (
              <div className="space-y-2">
                   <div className="text-[10px] text-zinc-500 text-center py-2 border-b border-zinc-900 mb-2">
                      Drag to Canvas or Click to Add
                   </div>
                   {components.length === 0 && (
                       <div className="text-xs text-zinc-600 text-center py-4">
                           No components yet.<br/>Select an element and click "Componentize" in the properties panel.
                       </div>
                   )}
                   {components.map((comp) => (
                       <div
                         key={comp.id}
                         draggable="true"
                         onDragStart={(e) => handleDragStart(e, comp)}
                         onClick={() => onAddComponent(comp)}
                         className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 hover:border-blue-500/50 hover:bg-zinc-800 transition-all text-left group cursor-grab active:cursor-grabbing"
                       >
                           <div className="flex items-center justify-between mb-2">
                               <span className="text-xs font-medium text-zinc-300">{comp.name}</span>
                               <Plus size={12} className="opacity-0 group-hover:opacity-100 text-blue-400" />
                           </div>
                           <div className="h-16 bg-zinc-950 rounded border border-zinc-800/50 flex items-center justify-center overflow-hidden pointer-events-none relative">
                                {/* Live Component Preview */}
                                <div 
                                    className="scale-[0.3] origin-center absolute"
                                    style={{
                                        width: comp.element.width,
                                        height: comp.element.height,
                                        backgroundColor: comp.element.style?.backgroundColor || 'transparent',
                                        color: comp.element.style?.color,
                                        borderRadius: comp.element.style?.borderRadius,
                                        border: comp.element.style?.borderWidth ? `${comp.element.style.borderWidth}px solid ${comp.element.style.borderColor}` : 'none',
                                        boxShadow: comp.element.style?.boxShadow,
                                        backgroundImage: comp.element.style?.backgroundImage,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {comp.element.type === 'text' && <span className="text-4xl whitespace-nowrap">{comp.element.content || 'Aa'}</span>}
                                    {comp.element.type === 'image' && <ImageIcon size={48} className="text-zinc-600" />}
                                </div>
                           </div>
                       </div>
                   ))}
              </div>
          )}
      </div>
    </div>
  );
};