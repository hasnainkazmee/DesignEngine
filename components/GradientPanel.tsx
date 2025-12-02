import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Gradient, ColorStop } from '../types';
import { X, Plus, Trash2, RotateCw } from 'lucide-react';
import { rgbToHex, hexToRgb, createDefaultGradient, sortColorStops } from '../utils/gradients';

interface GradientPanelProps {
  gradient: Gradient | null;
  onGradientChange: (gradient: Gradient | null) => void;
  onClose?: () => void;
}

export const GradientPanel: React.FC<GradientPanelProps> = ({
  gradient,
  onGradientChange,
  onClose
}) => {
  const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(null);
  const [colorInputMode, setColorInputMode] = useState<'hex' | 'rgb' | 'hsl'>('hex');
  const [draggingStopIndex, setDraggingStopIndex] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const currentGradient = gradient || createDefaultGradient();
  const sortedStops = currentGradient && currentGradient.stops ? sortColorStops(currentGradient.stops) : [];

  const handleGradientTypeChange = (type: 'linear' | 'radial' | 'angular') => {
    const newGradient: Gradient = {
      ...currentGradient,
      type,
      angle: type === 'linear' ? (currentGradient.angle || 0) : undefined,
      position: type === 'radial' || type === 'angular' 
        ? (currentGradient.position || { x: 0.5, y: 0.5 })
        : undefined,
      radius: type === 'radial' ? (currentGradient.radius || 0.5) : undefined
    };
    onGradientChange(newGradient);
  };

  const handleAngleChange = (angle: number) => {
    onGradientChange({
      ...currentGradient,
      angle: angle % 360
    });
  };

  const handleAddStop = (position: number) => {
    // Find the two stops this position is between
    let insertIndex = 0;
    for (let i = 0; i < sortedStops.length - 1; i++) {
      if (position > sortedStops[i].position && position < sortedStops[i + 1].position) {
        insertIndex = i + 1;
        break;
      }
    }

    // Interpolate color between adjacent stops
    const prevStop = sortedStops[insertIndex - 1] || sortedStops[0];
    const nextStop = sortedStops[insertIndex] || sortedStops[sortedStops.length - 1];
    
    const t = (position - prevStop.position) / (nextStop.position - prevStop.position);
    const newColor = {
      r: Math.round(prevStop.color.r + (nextStop.color.r - prevStop.color.r) * t),
      g: Math.round(prevStop.color.g + (nextStop.color.g - prevStop.color.g) * t),
      b: Math.round(prevStop.color.b + (nextStop.color.b - prevStop.color.b) * t)
    };
    const newOpacity = Math.round(prevStop.opacity + (nextStop.opacity - prevStop.opacity) * t);

    const newStop: ColorStop = {
      position: Math.max(0, Math.min(100, position)),
      color: newColor,
      opacity: newOpacity
    };

    const newStops = [...currentGradient.stops, newStop];
    onGradientChange({
      ...currentGradient,
      stops: newStops
    });
    setSelectedStopIndex(newStops.length - 1);
  };

  // Handle dragging color stops
  const handleStopMouseDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingStopIndex(index);
    setSelectedStopIndex(index);
  };

  useEffect(() => {
    if (draggingStopIndex === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!previewRef.current || draggingStopIndex === null) return;
      
      const rect = previewRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const position = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
      
      const newStops = [...currentGradient.stops];
      newStops[draggingStopIndex] = {
        ...newStops[draggingStopIndex],
        position: position
      };
      onGradientChange({
        ...currentGradient,
        stops: newStops
      });
      setSelectedStopIndex(draggingStopIndex);
    };

    const handleMouseUp = () => {
      setDraggingStopIndex(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingStopIndex, currentGradient, onGradientChange]);

  const handleStopPositionChange = (index: number, position: number) => {
    const newStops = [...currentGradient.stops];
    newStops[index] = {
      ...newStops[index],
      position: Math.max(0, Math.min(100, position))
    };
    onGradientChange({
      ...currentGradient,
      stops: newStops
    });
    // Keep the same stop selected after position change
    setSelectedStopIndex(index);
  };

  const handleStopColorChange = (index: number, color: { r: number; g: number; b: number }) => {
    const newStops = [...currentGradient.stops];
    newStops[index] = {
      ...newStops[index],
      color
    };
    onGradientChange({
      ...currentGradient,
      stops: newStops
    });
    // Keep the same stop selected after color change
    setSelectedStopIndex(index);
  };

  const handleStopOpacityChange = (index: number, opacity: number) => {
    const newStops = [...currentGradient.stops];
    newStops[index] = {
      ...newStops[index],
      opacity: Math.max(0, Math.min(100, opacity))
    };
    onGradientChange({
      ...currentGradient,
      stops: newStops
    });
    // Keep the same stop selected after opacity change
    setSelectedStopIndex(index);
  };

  const handleDeleteStop = (index: number) => {
    if (currentGradient.stops.length <= 2) return; // Minimum 2 stops required
    
    const newStops = currentGradient.stops.filter((_, i) => i !== index);
    onGradientChange({
      ...currentGradient,
      stops: newStops
    });
    
    if (selectedStopIndex === index) {
      setSelectedStopIndex(null);
    } else if (selectedStopIndex !== null && selectedStopIndex > index) {
      setSelectedStopIndex(selectedStopIndex - 1);
    }
  };

  const selectedStop = selectedStopIndex !== null ? currentGradient.stops[selectedStopIndex] : null;

  // Generate preview gradient
  const generatePreviewGradient = () => {
    if (!currentGradient || !currentGradient.stops || currentGradient.stops.length === 0) {
      return 'linear-gradient(90deg, #000000 0%, #ffffff 100%)';
    }
    
    const sorted = sortColorStops(currentGradient.stops);
    if (sorted.length === 0) {
      return 'linear-gradient(90deg, #000000 0%, #ffffff 100%)';
    }
    
    const stops = sorted.map(stop => {
      const opacity = stop.opacity / 100;
      return `rgba(${stop.color.r}, ${stop.color.g}, ${stop.color.b}, ${opacity}) ${stop.position}%`;
    }).join(', ');

    switch (currentGradient.type) {
      case 'linear':
        return `linear-gradient(${currentGradient.angle || 0}deg, ${stops})`;
      case 'radial':
        const pos = currentGradient.position || { x: 0.5, y: 0.5 };
        // For preview, use ellipse with equal dimensions to create a circle
        const radiusPercent = (currentGradient.radius || 0.5) * 100;
        return `radial-gradient(ellipse ${radiusPercent}% ${radiusPercent}% at ${pos.x * 100}% ${pos.y * 100}%, ${stops})`;
      case 'angular':
        const angPos = currentGradient.position || { x: 0.5, y: 0.5 };
        const angle = currentGradient.angle || 0;
        return `conic-gradient(from ${angle}deg at ${angPos.x * 100}% ${angPos.y * 100}%, ${stops})`;
      default:
        return `linear-gradient(90deg, ${stops})`;
    }
  };

  return (
    <div className="w-full bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Gradient Editor</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Gradient Type Selector */}
        <div>
          <label className="text-[10px] font-bold uppercase text-zinc-600 mb-2 block">Type</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleGradientTypeChange('linear')}
              className={`px-3 py-2 rounded text-[10px] font-medium transition-colors ${
                currentGradient.type === 'linear'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              Linear
            </button>
            <button
              onClick={() => handleGradientTypeChange('radial')}
              className={`px-3 py-2 rounded text-[10px] font-medium transition-colors ${
                currentGradient.type === 'radial'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              Radial
            </button>
            <button
              onClick={() => handleGradientTypeChange('angular')}
              className={`px-3 py-2 rounded text-[10px] font-medium transition-colors ${
                currentGradient.type === 'angular'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              Angular
            </button>
          </div>
        </div>

        {/* Gradient Preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-bold uppercase text-zinc-600">Preview</label>
            <button
              onClick={() => {
                // Add a stop in the middle
                const middlePosition = 50;
                handleAddStop(middlePosition);
              }}
              className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] rounded transition-colors"
              title="Add color stop"
            >
              <Plus size={10} />
              Add Color
            </button>
          </div>
          <div
            ref={previewRef}
            className="w-full h-32 rounded border-2 border-zinc-800 relative overflow-visible cursor-crosshair group"
            style={{ 
              background: currentGradient && currentGradient.stops && currentGradient.stops.length > 0 
                ? generatePreviewGradient() 
                : 'linear-gradient(90deg, #000000 0%, #ffffff 100%)'
            }}
            onClick={(e) => {
              // Only add stop if not clicking on an existing stop
              if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.color-stop-handle') === null) {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const position = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                handleAddStop(position);
              }
            }}
          >
            {/* Hint text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] text-zinc-500 bg-zinc-900/80 px-2 py-1 rounded">Click to add color stop</span>
            </div>
            {/* Color Stop Markers */}
            {sortedStops.map((stop, sortedIndex) => {
              // Find the actual index in the original stops array
              const actualIndex = currentGradient.stops.findIndex((s, idx) => 
                Math.abs(s.position - stop.position) < 0.01 &&
                s.color.r === stop.color.r && 
                s.color.g === stop.color.g && 
                s.color.b === stop.color.b &&
                Math.abs(s.opacity - stop.opacity) < 0.01
              );
              const isSelected = selectedStopIndex === actualIndex && actualIndex !== -1;
              const isDragging = draggingStopIndex === actualIndex;
              
              return (
                <div
                  key={`${stop.position}-${sortedIndex}-${actualIndex}`}
                  className="color-stop-handle absolute top-0 bottom-0 z-20"
                  style={{ left: `${stop.position}%`, transform: 'translateX(-50%)' }}
                >
                  {/* Vertical line indicator */}
                  <div
                    className={`absolute top-0 bottom-0 w-0.5 transition-all ${
                      isSelected || isDragging ? 'bg-white shadow-lg' : 'bg-zinc-400/50'
                    }`}
                    style={{ left: '50%' }}
                  />
                  
                  {/* Color stop handle */}
                  <div
                    className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full border-2 transition-all cursor-grab active:cursor-grabbing ${
                      isSelected || isDragging 
                        ? 'border-white bg-zinc-900 scale-125 shadow-xl ring-2 ring-blue-500/50' 
                        : 'border-zinc-600 bg-zinc-800 hover:scale-110 hover:border-zinc-400'
                    }`}
                    style={{
                      backgroundColor: rgbToHex(stop.color.r, stop.color.g, stop.color.b),
                      boxShadow: isSelected || isDragging ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : undefined
                    }}
                    onMouseDown={(e) => handleStopMouseDown(e, actualIndex)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (actualIndex !== -1) {
                        setSelectedStopIndex(actualIndex);
                      }
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (actualIndex !== -1) {
                        setSelectedStopIndex(actualIndex);
                        // Trigger color picker by programmatically clicking the color input
                        setTimeout(() => {
                          const colorInput = document.querySelector(`input[type="color"]`) as HTMLInputElement;
                          if (colorInput) {
                            colorInput.click();
                          }
                        }, 100);
                      }
                    }}
                    title="Double-click to change color"
                  />
                  
                  {/* Position label on hover/select */}
                  {(isSelected || isDragging) && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-zinc-900 text-white text-[10px] px-2 py-0.5 rounded border border-zinc-700 whitespace-nowrap pointer-events-none">
                      {stop.position.toFixed(1)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Angle Control (for linear and angular) */}
        {(currentGradient.type === 'linear' || currentGradient.type === 'angular') && (
          <div>
            <label className="text-[10px] font-bold uppercase text-zinc-600 mb-2 block">
              Angle: {Math.round(currentGradient.angle || 0)}°
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="360"
                value={currentGradient.angle || 0}
                onChange={(e) => handleAngleChange(parseInt(e.target.value))}
                className="flex-1 accent-blue-600 h-1 bg-zinc-800 rounded appearance-none"
              />
              <input
                type="number"
                min="0"
                max="360"
                value={Math.round(currentGradient.angle || 0)}
                onChange={(e) => handleAngleChange(parseInt(e.target.value) || 0)}
                className="w-16 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 font-mono focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* Selected Color Stop Editor */}
        {selectedStop ? (
          <div className="border-t border-zinc-800 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase text-zinc-600">
                Color Stop {selectedStopIndex !== null ? `#${selectedStopIndex + 1}` : ''}
              </label>
              <div className="flex items-center gap-2">
                {currentGradient.stops.length > 2 && (
                  <button
                    onClick={() => handleDeleteStop(selectedStopIndex!)}
                    className="text-red-400 hover:text-red-300 transition-colors p-1 hover:bg-red-500/10 rounded"
                    title="Delete stop"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Position */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] text-zinc-500">Position</label>
                <span className="text-[10px] text-zinc-400 font-mono">{selectedStop.position.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={selectedStop.position}
                  onChange={(e) => handleStopPositionChange(selectedStopIndex!, parseFloat(e.target.value))}
                  className="flex-1 accent-blue-600 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      #3b82f6 0%, 
                      #3b82f6 ${selectedStop.position}%, 
                      #27272a ${selectedStop.position}%, 
                      #27272a 100%)`
                  }}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={selectedStop.position.toFixed(1)}
                  onChange={(e) => handleStopPositionChange(selectedStopIndex!, parseFloat(e.target.value) || 0)}
                  className="w-20 bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                />
              </div>
            </div>

            {/* Color Input Mode Toggle */}
            <div className="flex gap-1 bg-zinc-900 p-1 rounded border border-zinc-800">
              {(['hex', 'rgb', 'hsl'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setColorInputMode(mode)}
                  className={`flex-1 py-1 text-[10px] rounded transition-colors ${
                    colorInputMode === mode
                      ? 'bg-zinc-700 text-white'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Color Picker */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div 
                  className="w-16 h-16 rounded-lg border-2 border-zinc-700 overflow-hidden relative cursor-pointer shadow-lg hover:border-zinc-600 transition-all"
                  style={{
                    backgroundColor: rgbToHex(selectedStop.color.r, selectedStop.color.g, selectedStop.color.b),
                    boxShadow: `0 0 0 2px ${rgbToHex(selectedStop.color.r, selectedStop.color.g, selectedStop.color.b)}40`
                  }}
                >
                  <input
                    type="color"
                    value={rgbToHex(selectedStop.color.r, selectedStop.color.g, selectedStop.color.b)}
                    onChange={(e) => {
                      const rgb = hexToRgb(e.target.value);
                      handleStopColorChange(selectedStopIndex!, rgb);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundColor: rgbToHex(selectedStop.color.r, selectedStop.color.g, selectedStop.color.b)
                    }}
                  />
                </div>
                {/* Opacity overlay indicator */}
                {selectedStop.opacity < 100 && (
                  <div 
                    className="absolute inset-0 rounded-lg border-2 border-dashed border-zinc-600 pointer-events-none"
                    style={{ opacity: 1 - (selectedStop.opacity / 100) }}
                  />
                )}
              </div>

              <div className="flex-1 space-y-2">
                {colorInputMode === 'hex' && (
                  <input
                    type="text"
                    value={rgbToHex(selectedStop.color.r, selectedStop.color.g, selectedStop.color.b)}
                    onChange={(e) => {
                      const hex = e.target.value.trim();
                      // Allow partial input, but only update when valid
                      if (hex === '' || hex === '#') {
                        return; // Don't update on empty or just #
                      }
                      // Try to parse hex (with or without #)
                      const normalizedHex = hex.startsWith('#') ? hex : `#${hex}`;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(normalizedHex)) {
                        // If it's a valid 6-character hex, update immediately
                        if (normalizedHex.length === 7) {
                          const rgb = hexToRgb(normalizedHex);
                          handleStopColorChange(selectedStopIndex!, rgb);
                        }
                      }
                    }}
                    onBlur={(e) => {
                      // On blur, try to fix incomplete hex values
                      const hex = e.target.value.trim();
                      if (hex && hex !== '#') {
                        const normalizedHex = hex.startsWith('#') ? hex : `#${hex}`;
                        // Pad with zeros if needed
                        if (normalizedHex.length < 7) {
                          const padded = normalizedHex + '0'.repeat(7 - normalizedHex.length);
                          const rgb = hexToRgb(padded);
                          handleStopColorChange(selectedStopIndex!, rgb);
                        } else if (normalizedHex.length === 7) {
                          const rgb = hexToRgb(normalizedHex);
                          handleStopColorChange(selectedStopIndex!, rgb);
                        }
                      }
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                    placeholder="#000000"
                  />
                )}

                {colorInputMode === 'rgb' && (
                  <div className="grid grid-cols-3 gap-2">
                    {(['r', 'g', 'b'] as const).map(channel => (
                      <div key={channel} className="flex flex-col">
                        <label className="text-[9px] text-zinc-500 mb-1 uppercase">{channel}</label>
                        <input
                          type="number"
                          min="0"
                          max="255"
                          value={selectedStop.color[channel]}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            handleStopColorChange(selectedStopIndex!, {
                              ...selectedStop.color,
                              [channel]: Math.max(0, Math.min(255, value))
                            });
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                          placeholder={channel.toUpperCase()}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {colorInputMode === 'hsl' && (
                  <div className="text-xs text-zinc-500 italic">
                    HSL input coming soon
                  </div>
                )}
              </div>
            </div>

            {/* Opacity */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] text-zinc-500">Opacity</label>
                <span className="text-[10px] text-zinc-400 font-mono">{Math.round(selectedStop.opacity)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedStop.opacity}
                  onChange={(e) => handleStopOpacityChange(selectedStopIndex!, parseInt(e.target.value))}
                  className="flex-1 accent-blue-600 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      #3b82f6 0%, 
                      #3b82f6 ${selectedStop.opacity}%, 
                      #27272a ${selectedStop.opacity}%, 
                      #27272a 100%)`
                  }}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round(selectedStop.opacity)}
                  onChange={(e) => handleStopOpacityChange(selectedStopIndex!, parseInt(e.target.value) || 0)}
                  className="w-20 bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="border-t border-zinc-800 pt-4">
            <div className="text-center py-4">
              <p className="text-xs text-zinc-500 mb-2">No color stop selected</p>
              <p className="text-[10px] text-zinc-600">Click on a color stop above or click the gradient bar to add one</p>
            </div>
          </div>
        )}

        {/* Remove Gradient Button */}
        <div className="pt-4 border-t border-zinc-800">
          <button
            onClick={() => onGradientChange(null)}
            className="w-full py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-400 hover:text-red-400 hover:border-red-500/50 transition-colors"
          >
            Remove Gradient
          </button>
        </div>
      </div>
    </div>
  );
};

