
import React, { useState, useEffect } from 'react';
import { DesignElement, ToolType } from '../types';
import { GOOGLE_FONTS, loadFont } from '../utils/fonts';
import { Move, Ban, Lock, PaintBucket, Type, Square, Layers, Circle, Link, Plus, PenTool, Droplet } from 'lucide-react';
import { GradientPanel } from './GradientPanel';
import { createDefaultGradient } from '../utils/gradients';

interface PropertiesPanelProps {
  element?: DesignElement;
  elements: DesignElement[];
  selectedIds: string[];
  onUpdate: (updates: Partial<DesignElement>) => void;
  onCreateComponent: () => void;
  selectedCount: number;
  onGroup: () => void;
  onUngroup: () => void;
  activeTool?: ToolType;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  element,
  elements,
  selectedIds,
  onUpdate,
  onCreateComponent,
  selectedCount,
  onGroup,
  onUngroup,
  activeTool
}) => {
  const [showGradientPanel, setShowGradientPanel] = useState(false);

  // Auto-show gradient panel when gradient tool is active and element supports gradients
  useEffect(() => {
    if (activeTool === 'gradient' && element && (element.type === 'box' || element.type === 'image' || element.type === 'text' || element.type === 'path')) {
      setShowGradientPanel(true);
      // If element doesn't have a gradient, apply default one
      if (!element.style?.gradient) {
        onUpdate({
          style: {
            ...element.style,
            gradient: createDefaultGradient()
          }
        });
      }
    }
    // Note: We don't auto-close the panel when switching tools to preserve user's manual state
  }, [activeTool, element?.id, element?.style?.gradient]);
  if (selectedCount > 1) {
    const selectedElements = elements.filter(el => selectedIds.includes(el.id));
    const firstGroupId = selectedElements.length > 0 ? selectedElements[0].groupId : null;
    const allInSameGroup = selectedElements.every(el => el.groupId && el.groupId === firstGroupId);

    const canGroup = selectedCount > 1 && !allInSameGroup;
    const canUngroup = selectedCount > 0 && allInSameGroup && firstGroupId !== null;

    return (
      <div className="flex-1 p-4 flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
            <Layers size={20} className="text-blue-400" />
          </div>
          <p className="text-sm font-medium text-zinc-300">{selectedCount} items selected</p>
          {allInSameGroup && firstGroupId && <p className="text-xs mt-1 text-zinc-500 font-mono">GROUP:{firstGroupId.slice(-4)}</p>}
        </div>
        <div className="space-y-2 pt-4 border-t border-zinc-800">
          <button
            className="w-full text-center py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-500 transition-colors disabled:bg-zinc-700 disabled:cursor-not-allowed"
            onClick={onGroup}
            disabled={!canGroup}
          >
            Group
          </button>
          <button
            className="w-full text-center py-2 bg-zinc-800 text-zinc-400 rounded text-sm font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onUngroup}
            disabled={!canUngroup}
          >
            Ungroup
          </button>
        </div>
      </div>
    )
  }

  if (selectedCount === 0 || !element) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-zinc-600 text-center h-full">
        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
          <Layers size={20} />
        </div>
        <p className="text-sm font-medium text-zinc-400">No Selection</p>
        <p className="text-xs mt-2 text-zinc-500 max-w-[180px]">Select an element on the canvas to edit its properties.</p>
      </div>
    );
  }

  // Helper for input changes
  const handleStyleChange = (key: string, value: any) => {
    onUpdate({ style: { ...element.style, [key]: value } });
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-950 flex flex-col h-full border-l border-zinc-800">

      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
            {element.type === 'text' && <Type size={10} />}
            {element.type === 'image' && <Square size={10} />}
            {element.type === 'box' && element.shapeType === 'circle' && <Circle size={10} />}
            {element.type === 'box' && element.shapeType !== 'circle' && <Square size={10} />}
            {element.type === 'path' && <PenTool size={10} />}
            {element.type.toUpperCase()}
          </span>
          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono truncate max-w-[100px]">
            {element.id}
          </span>
        </div>

        <button
          onClick={onCreateComponent}
          className="w-full flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] py-1 rounded transition-colors"
        >
          <Plus size={10} /> Componentize
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Geometry */}
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-[10px] font-bold uppercase text-zinc-600 mb-3 flex items-center gap-2">
            <Move size={10} /> Dimensions & Position
          </h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-zinc-900 rounded p-1.5 border border-zinc-800 flex items-center gap-2 group focus-within:border-blue-500/50 transition-colors">
              <span className="text-zinc-500 text-[10px] font-mono w-3">X</span>
              <input
                type="number"
                value={Math.round(element.x)}
                onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })}
                className="bg-transparent w-full text-right text-xs font-mono focus:outline-none text-zinc-300"
              />
            </div>
            <div className="bg-zinc-900 rounded p-1.5 border border-zinc-800 flex items-center gap-2 group focus-within:border-blue-500/50 transition-colors">
              <span className="text-zinc-500 text-[10px] font-mono w-3">Y</span>
              <input
                type="number"
                value={Math.round(element.y)}
                onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })}
                className="bg-transparent w-full text-right text-xs font-mono focus:outline-none text-zinc-300"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-zinc-900 rounded p-1.5 border border-zinc-800 flex items-center gap-2 group focus-within:border-blue-500/50 transition-colors">
              <span className="text-zinc-500 text-[10px] font-mono w-3">W</span>
              <input
                type="number"
                value={Math.round(element.width)}
                onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 10 })}
                className="bg-transparent w-full text-right text-xs font-mono focus:outline-none text-zinc-300"
              />
            </div>
            <div className="bg-zinc-900 rounded p-1.5 border border-zinc-800 flex items-center gap-2 group focus-within:border-blue-500/50 transition-colors">
              <span className="text-zinc-500 text-[10px] font-mono w-3">H</span>
              <input
                type="number"
                value={Math.round(element.height)}
                onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 10 })}
                className="bg-transparent w-full text-right text-xs font-mono focus:outline-none text-zinc-300"
              />
            </div>
          </div>
        </div>

        {/* Typography specific */}
        {element.type === 'text' && (
          <div className="p-4 border-b border-zinc-800">
            <h3 className="text-[10px] font-bold uppercase text-zinc-600 mb-3 flex items-center gap-2">
              <Type size={10} /> Typography
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">


                <select
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 focus:border-blue-500 outline-none"
                  value={element.style?.fontFamily}
                  onChange={(e) => {
                    const font = e.target.value;
                    loadFont(font);
                    handleStyleChange('fontFamily', font);
                  }}
                >
                  <optgroup label="System">
                    <option value="sans-serif">Sans Serif</option>
                    <option value="serif">Serif</option>
                    <option value="monospace">Monospace</option>
                  </optgroup>
                  {['Sans Serif', 'Serif', 'Display', 'Mono', 'Handwriting'].map(category => (
                    <optgroup key={category} label={category}>
                      {GOOGLE_FONTS.filter(f => f.category === category).map(font => (
                        <option key={font.name} value={font.name}>{font.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <select
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 focus:border-blue-500 outline-none"
                  value={element.style?.fontWeight}
                  onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                >
                  <option value="300">Light</option>
                  <option value="400">Regular</option>
                  <option value="500">Medium</option>
                  <option value="600">SemiBold</option>
                  <option value="700">Bold</option>
                  <option value="800">ExtraBold</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-zinc-900 rounded p-1.5 border border-zinc-800 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500">Size</span>
                  <input
                    type="number"
                    value={element.style?.fontSize}
                    onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value))}
                    className="bg-transparent w-12 text-right text-xs font-mono focus:outline-none text-zinc-300"
                  />
                </div>
                <div className="bg-zinc-900 rounded p-1.5 border border-zinc-800 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500">Line</span>
                  <input
                    type="number"
                    step="0.1"
                    value={element.style?.lineHeight || 1.2}
                    onChange={(e) => handleStyleChange('lineHeight', parseFloat(e.target.value))}
                    className="bg-transparent w-12 text-right text-xs font-mono focus:outline-none text-zinc-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-zinc-400">Color</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-500 uppercase">{element.style?.color}</span>
                  <div className="w-6 h-6 rounded border border-zinc-700 overflow-hidden relative cursor-pointer">
                    <input
                      type="color"
                      value={element.style?.color || '#ffffff'}
                      onChange={(e) => handleStyleChange('color', e.target.value)}
                      className="absolute -top-1 -left-1 w-8 h-8 opacity-0 cursor-pointer"
                    />
                    <div className="w-full h-full" style={{ backgroundColor: element.style?.color || '#ffffff' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Box/Image Styling */}
        {(element.type === 'box' || element.type === 'image') && (
          <div className="p-4 border-b border-zinc-800">
            <h3 className="text-[10px] font-bold uppercase text-zinc-600 mb-3 flex items-center gap-2">
              <PaintBucket size={10} /> Style
            </h3>

            {/* Shape Switcher for Box */}
            {element.type === 'box' && (
              <div className="mb-4 bg-zinc-900 p-1 rounded border border-zinc-800 flex gap-1">
                <button
                  onClick={() => onUpdate({ shapeType: 'rectangle' })}
                  className={`flex-1 flex items-center justify-center py-1 rounded text-[10px] ${element.shapeType !== 'circle' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <Square size={12} className="mr-1" /> Rect
                </button>
                <button
                  onClick={() => onUpdate({ shapeType: 'circle' })}
                  className={`flex-1 flex items-center justify-center py-1 rounded text-[10px] ${element.shapeType === 'circle' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <Circle size={12} className="mr-1" /> Circle
                </button>
              </div>
            )}

            {element.type === 'box' && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-zinc-400">Fill</span>
                  <div className="flex items-center gap-2">
                    {element.style?.gradient ? (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-6 rounded border border-zinc-700 cursor-pointer"
                          style={{ 
                            background: element.style.gradient 
                              ? `linear-gradient(${element.style.gradient.angle || 0}deg, ${element.style.gradient.stops.map(s => `rgba(${s.color.r}, ${s.color.g}, ${s.color.b}, ${s.opacity / 100}) ${s.position}%)`).join(', ')})`
                              : undefined
                          }}
                          onClick={() => setShowGradientPanel(!showGradientPanel)}
                        />
                        <button
                          onClick={() => setShowGradientPanel(!showGradientPanel)}
                          className="text-[10px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors flex items-center gap-1"
                        >
                          <Droplet size={10} />
                          Edit
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-mono text-zinc-500 uppercase">{element.style?.backgroundColor}</span>
                        <div className="w-6 h-6 rounded border border-zinc-700 overflow-hidden relative cursor-pointer">
                          <input
                            type="color"
                            value={element.style?.backgroundColor || '#2A4B8D'}
                            onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                            className="absolute -top-1 -left-1 w-8 h-8 opacity-0 cursor-pointer"
                          />
                          <div className="w-full h-full" style={{ backgroundColor: element.style?.backgroundColor || '#2A4B8D' }} />
                        </div>
                        <button
                          onClick={() => {
                            handleStyleChange('gradient', createDefaultGradient());
                            setShowGradientPanel(true);
                          }}
                          className="text-[10px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors flex items-center gap-1"
                          title="Add gradient"
                        >
                          <Droplet size={10} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {showGradientPanel && element.style?.gradient && (
                  <div className="mb-3 -mx-4">
                    <GradientPanel
                      gradient={element.style.gradient}
                      onGradientChange={(gradient) => {
                        if (gradient) {
                          handleStyleChange('gradient', gradient);
                        } else {
                          handleStyleChange('gradient', undefined);
                          setShowGradientPanel(false);
                        }
                      }}
                      onClose={() => setShowGradientPanel(false)}
                    />
                  </div>
                )}
              </>
            )}

            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Opacity</span>
                  <span>{Math.round((element.style?.opacity ?? 1) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0" max="1" step="0.05"
                  value={element.style?.opacity ?? 1}
                  onChange={(e) => handleStyleChange('opacity', parseFloat(e.target.value))}
                  className="w-full accent-blue-600 h-1 bg-zinc-800 rounded appearance-none"
                />
              </div>

              {element.shapeType !== 'circle' && (
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Radius</span>
                    <span>{element.style?.borderRadius ?? 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="0" max="100"
                    value={element.style?.borderRadius ?? 0}
                    onChange={(e) => handleStyleChange('borderRadius', parseInt(e.target.value))}
                    className="w-full accent-blue-600 h-1 bg-zinc-800 rounded appearance-none"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Path Styling */}
        {element.type === 'path' && (
          <div className="p-4 border-b border-zinc-800">
            <h3 className="text-[10px] font-bold uppercase text-zinc-600 mb-3 flex items-center gap-2">
              <PaintBucket size={10} /> Path Style
            </h3>

            <div className="space-y-3">
              {/* Stroke */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Stroke</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStyleChange('stroke', 'none')}
                    className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                    title="Remove stroke"
                  >
                    None
                  </button>
                  <span className="text-xs font-mono text-zinc-500 uppercase">
                    {element.style?.stroke === 'none' || !element.style?.stroke ? 'NONE' : element.style.stroke}
                  </span>
                  {element.style?.stroke !== 'none' && (
                    <div className="w-6 h-6 rounded border border-zinc-700 overflow-hidden relative cursor-pointer">
                      <input
                        type="color"
                        value={element.style?.stroke || '#000000'}
                        onChange={(e) => handleStyleChange('stroke', e.target.value)}
                        className="absolute -top-1 -left-1 w-8 h-8 opacity-0 cursor-pointer"
                      />
                      <div className="w-full h-full" style={{ backgroundColor: element.style?.stroke || '#000000' }} />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Width</span>
                  <span>{element.style?.strokeWidth ?? 1}px</span>
                </div>
                <input
                  type="range"
                  min="0" max="20"
                  value={element.style?.strokeWidth ?? 1}
                  onChange={(e) => handleStyleChange('strokeWidth', parseInt(e.target.value))}
                  className="w-full accent-blue-600 h-1 bg-zinc-800 rounded appearance-none"
                />
              </div>

              {/* Fill */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                <span className="text-xs text-zinc-400">Fill</span>
                <div className="flex items-center gap-2">
                  {element.style?.gradient ? (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-6 rounded border border-zinc-700 cursor-pointer"
                        style={{ 
                          background: element.style.gradient 
                            ? `linear-gradient(${element.style.gradient.angle || 0}deg, ${element.style.gradient.stops.map(s => `rgba(${s.color.r}, ${s.color.g}, ${s.color.b}, ${s.opacity / 100}) ${s.position}%)`).join(', ')})`
                            : undefined
                        }}
                        onClick={() => setShowGradientPanel(!showGradientPanel)}
                      />
                      <button
                        onClick={() => setShowGradientPanel(!showGradientPanel)}
                        className="text-[10px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors flex items-center gap-1"
                      >
                        <Droplet size={10} />
                        Edit
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs font-mono text-zinc-500 uppercase">{element.style?.fill === 'none' ? 'NONE' : element.style?.fill}</span>

                      {element.style?.fill !== 'none' && (
                        <div className="w-6 h-6 rounded border border-zinc-700 overflow-hidden relative cursor-pointer">
                          <input
                            type="color"
                            value={element.style?.fill === 'none' ? '#ffffff' : element.style?.fill}
                            onChange={(e) => handleStyleChange('fill', e.target.value)}
                            className="absolute -top-1 -left-1 w-8 h-8 opacity-0 cursor-pointer"
                          />
                          <div className="w-full h-full" style={{ backgroundColor: element.style?.fill === 'none' ? 'transparent' : element.style?.fill }} />
                        </div>
                      )}

                      <button
                        onClick={() => {
                          handleStyleChange('fill', element.style?.fill === 'none' ? '#cccccc' : 'none');
                        }}
                        className="text-[10px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 hover:text-white"
                      >
                        {element.style?.fill === 'none' ? '+' : 'x'}
                      </button>
                      <button
                        onClick={() => {
                          handleStyleChange('gradient', createDefaultGradient());
                          setShowGradientPanel(true);
                        }}
                        className="text-[10px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors flex items-center gap-1"
                        title="Add gradient"
                      >
                        <Droplet size={10} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {showGradientPanel && element.style?.gradient && element.type === 'path' && (
                <div className="mb-3 -mx-4">
                  <GradientPanel
                    gradient={element.style.gradient}
                    onGradientChange={(gradient) => {
                      if (gradient) {
                        handleStyleChange('gradient', gradient);
                      } else {
                        handleStyleChange('gradient', undefined);
                        setShowGradientPanel(false);
                      }
                    }}
                    onClose={() => setShowGradientPanel(false)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Constraints */}
        <div className="p-4">
          <h3 className="text-[10px] font-bold uppercase text-zinc-600 mb-3 flex items-center gap-2">
            <Link size={10} /> Constraints
          </h3>
          <div className="space-y-2">
            {element.constraints.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-zinc-900 p-2 rounded border border-zinc-800 group hover:border-zinc-700 transition-colors">
                <span className="text-zinc-300 capitalize flex items-center gap-2">
                  <Lock size={10} className="text-blue-500" />
                  {c.replace('-', ' ')}
                </span>
                <button
                  onClick={() => onUpdate({ constraints: element.constraints.filter(con => con !== c) })}
                  className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                >
                  <Ban size={12} />
                </button>
              </div>
            ))}

            <div className="mt-3 grid grid-cols-2 gap-2">
              {!element.constraints.includes('grid-snap') && (
                <button
                  onClick={() => onUpdate({ constraints: [...element.constraints, 'grid-snap'] })}
                  className="text-[10px] bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 py-1.5 rounded transition-colors"
                >
                  + Grid Snap
                </button>
              )}
              {!element.constraints.includes('baseline-snap') && (
                <button
                  onClick={() => onUpdate({ constraints: [...element.constraints, 'baseline-snap'] })}
                  className="text-[10px] bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 py-1.5 rounded transition-colors"
                >
                  + Baseline
                </button>
              )}
              {!element.constraints.includes('aspect-ratio') && (
                <button
                  onClick={() => onUpdate({ constraints: [...element.constraints, 'aspect-ratio'] })}
                  className="text-[10px] bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 py-1.5 rounded transition-colors"
                >
                  + Ratio
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
