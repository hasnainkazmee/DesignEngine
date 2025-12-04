

import React, { useRef, useState, useEffect } from 'react';
import { GridConfig, DesignElement, ToolType, ComponentItem } from '../types';

interface CanvasProps {
  elements: DesignElement[];
  gridConfig: GridConfig;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onUpdate: (id: string, updates: Partial<DesignElement>) => void;
  activeTool: ToolType;
  onCanvasClick: (x: number, y: number, w?: number, h?: number) => void;
  snapToGrid: (val: number, type: 'x' | 'y', closest?: boolean) => number;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onComponentDrop: (component: ComponentItem, x: number, y: number) => void;
  onImageDrop: (file: File, x: number, y: number) => void;
  pan: { x: number, y: number };
  onPanChange: (pan: { x: number, y: number }) => void;
  zoom: number;
}

export const Canvas: React.FC<CanvasProps> = ({ 
  elements, 
  gridConfig, 
  selectedIds, 
  onSelect,
  onUpdate,
  activeTool,
  onCanvasClick,
  snapToGrid,
  editingId,
  setEditingId,
  onComponentDrop,
  onImageDrop,
  pan,
  onPanChange,
  zoom
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    isResizing: boolean;
    isPanning: boolean;
    isCreating: boolean;
    handle?: string; 
    startX: number;
    startY: number;
    currentX: number; // Used for ghost element
    currentY: number; // Used for ghost element
    initialElX: number;
    initialElY: number;
    initialWidth: number;
    initialHeight: number;
    elementId: string | null;
    initialPanX: number;
    initialPanY: number;
  }>({
    isDragging: false,
    isResizing: false,
    isPanning: false,
    isCreating: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    initialElX: 0,
    initialElY: 0,
    initialWidth: 0,
    initialHeight: 0,
    elementId: null,
    initialPanX: 0,
    initialPanY: 0
  });

  // --- RULERS ---
  const Ruler = ({ orientation }: { orientation: 'horizontal' | 'vertical' }) => {
     const ticks = [];
     const start = orientation === 'horizontal' ? -pan.x / zoom : -pan.y / zoom;
     const length = orientation === 'horizontal' ? window.innerWidth : window.innerHeight;
     const end = start + (length / zoom);
     let step = 100;
     if (zoom > 1.5) step = 50;
     if (zoom > 2.5) step = 10;
     if (zoom < 0.5) step = 200;
     const firstTick = Math.floor(start / step) * step;

     for (let i = firstTick; i < end; i += step) {
         const pos = (i * zoom) + (orientation === 'horizontal' ? pan.x : pan.y);
         ticks.push(
             <div 
                key={i} 
                className="absolute text-[8px] text-zinc-500 font-mono flex items-center justify-center pointer-events-none"
                style={{ 
                    left: orientation === 'horizontal' ? pos : 0, 
                    top: orientation === 'vertical' ? pos : 0,
                    width: orientation === 'horizontal' ? 1 : '100%',
                    height: orientation === 'vertical' ? 1 : '100%'
                }}
             >
                 <div className={`bg-zinc-700 ${orientation === 'horizontal' ? 'w-px h-2 mt-auto' : 'h-px w-2 ml-auto'}`} />
                 <span className={`absolute ${orientation === 'horizontal' ? 'top-1 ml-1' : 'left-1 mt-3 -rotate-90 origin-top-left'}`}>{i}</span>
             </div>
         );
     }
     return (
         <div className={`absolute bg-zinc-950 border-zinc-800 z-30 select-none overflow-hidden ${orientation === 'horizontal' ? 'top-0 left-0 right-0 h-6 border-b' : 'top-6 left-0 bottom-0 w-6 border-r'}`}>
             {ticks}
         </div>
     );
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const canvasX = (mouseX - pan.x) / zoom;
      const canvasY = (mouseY - pan.y) / zoom;
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
              onImageDrop(file, canvasX, canvasY);
              return;
          }
      }

      const json = e.dataTransfer.getData('application/json');
      if (json) {
          try {
              const component = JSON.parse(json) as ComponentItem;
              const centeredX = canvasX - (component.element.width / 2);
              const centeredY = canvasY - (component.element.height / 2);
              onComponentDrop(component, centeredX, centeredY);
          } catch (err) {}
      }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const currentClientX = e.clientX;
      const currentClientY = e.clientY;
      const deltaScreenX = currentClientX - dragState.startX;
      const deltaScreenY = currentClientY - dragState.startY;

      // Update current mouse position in canvas coordinates for ghosting
      const canvasX = (e.clientX - rect.left - pan.x) / zoom;
      const canvasY = (e.clientY - rect.top - pan.y) / zoom;
      
      if (dragState.isCreating) {
          setDragState(prev => ({ ...prev, currentX: canvasX, currentY: canvasY }));
          return;
      }

      if (dragState.isPanning) {
          onPanChange({ x: dragState.initialPanX + deltaScreenX, y: dragState.initialPanY + deltaScreenY });
          return;
      }

      if (!dragState.elementId) return;
      const element = elements.find(el => el.id === dragState.elementId);
      if (!element) return;
      const deltaX = deltaScreenX / zoom;
      const deltaY = deltaScreenY / zoom;

      if (dragState.isDragging) {
        let newX = dragState.initialElX + deltaX;
        let newY = dragState.initialElY + deltaY;
        if (element.constraints.includes('grid-snap')) newX = snapToGrid(newX, 'x');
        if (element.constraints.includes('baseline-snap')) newY = snapToGrid(newY, 'y');
        onUpdate(element.id, { x: newX, y: newY });
      }

      if (dragState.isResizing && dragState.handle) {
         let newX = dragState.initialElX;
         let newY = dragState.initialElY;
         let newW = dragState.initialWidth;
         let newH = dragState.initialHeight;
         const { handle } = dragState;

         // Calculate raw new dimensions
         if (handle.includes('e')) newW = dragState.initialWidth + deltaX;
         else if (handle.includes('w')) { newW = dragState.initialWidth - deltaX; newX = dragState.initialElX + deltaX; }
         if (handle.includes('s')) newH = dragState.initialHeight + deltaY;
         else if (handle.includes('n')) { newH = dragState.initialHeight - deltaY; newY = dragState.initialElY + deltaY; }
         
         // Aspect Ratio Locking (Shift Key)
         if (e.shiftKey) {
             const ratio = dragState.initialWidth / dragState.initialHeight;
             if (handle.includes('e') || handle.includes('w')) {
                 newH = newW / ratio;
                 // If growing 'north', we need to adjust Y based on the locked height
                 if (handle.includes('n')) {
                     newY = dragState.initialElY + (dragState.initialHeight - newH);
                 }
             } else if (handle.includes('s') || handle.includes('n')) {
                 newW = newH * ratio;
                 // If growing 'west', we need to adjust X based on the locked width
                 if (handle.includes('w')) {
                    newX = dragState.initialElX + (dragState.initialWidth - newW);
                 }
             }
         }

         if (newW < 10) newW = 10;
         if (newH < 10) newH = 10;
         onUpdate(element.id, { x: newX, y: newY, width: newW, height: newH });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (dragState.isCreating) {
         if (!canvasRef.current) return;
         const rect = canvasRef.current.getBoundingClientRect();
         const endX = (e.clientX - rect.left - pan.x) / zoom;
         const endY = (e.clientY - rect.top - pan.y) / zoom;
         
         // Initial Canvas Coords stored in currentX/Y at start are actually screen coords in startX/startY
         // We need the Canvas Coords of start
         const startCanvasX = (dragState.startX - rect.left - pan.x) / zoom;
         const startCanvasY = (dragState.startY - rect.top - pan.y) / zoom;

         let w = Math.abs(endX - startCanvasX);
         let h = Math.abs(endY - startCanvasY);
         const x = Math.min(startCanvasX, endX);
         const y = Math.min(startCanvasY, endY);

         // Creation Aspect Lock
         if (e.shiftKey) {
             const max = Math.max(w, h);
             w = max;
             h = max;
         }

         if (w > 5 && h > 5) {
            onCanvasClick(x, y, w, h);
         } else {
            // It was just a click
            onCanvasClick(startCanvasX, startCanvasY);
         }
      }
      setDragState(prev => ({ ...prev, isDragging: false, isResizing: false, isPanning: false, isCreating: false, elementId: null }));
    };

    if (dragState.isDragging || dragState.isResizing || dragState.isPanning || dragState.isCreating) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, elements, onUpdate, snapToGrid, onPanChange, zoom, pan, onCanvasClick]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const canvasX = (mouseX - pan.x) / zoom;
    const canvasY = (mouseY - pan.y) / zoom;

    if (activeTool === 'hand') {
        setDragState(prev => ({ ...prev, isPanning: true, startX: e.clientX, startY: e.clientY, initialPanX: pan.x, initialPanY: pan.y }));
        return;
    }

    // Start Creation Drag for Shapes
    if (activeTool === 'shape' || activeTool === 'type') {
         setDragState(prev => ({
             ...prev,
             isCreating: true,
             startX: e.clientX,
             startY: e.clientY,
             currentX: canvasX,
             currentY: canvasY
         }));
         return;
    }
    
    if (!e.shiftKey) onSelect([]);
    setEditingId(null);
  };

  const handleElementMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (activeTool === 'hand') {
         setDragState(prev => ({ ...prev, isPanning: true, startX: e.clientX, startY: e.clientY, initialPanX: pan.x, initialPanY: pan.y }));
         return;
    }

    // Allow creating on top of existing elements
    if (['shape', 'image', 'brush', 'lasso', 'wand', 'crop', 'clone', 'gradient'].includes(activeTool)) {
        // Trigger canvas logic instead
        const rect = canvasRef.current!.getBoundingClientRect();
        const canvasX = (e.clientX - rect.left - pan.x) / zoom;
        const canvasY = (e.clientY - rect.top - pan.y) / zoom;

        if (activeTool === 'shape' || activeTool === 'type') {
            // SPECIAL CASE: Type tool edits if clicking text, otherwise creates new
            const clickedEl = elements.find(el => el.id === id);
            if (activeTool === 'type' && clickedEl?.type === 'text') {
                 // Fall through to selection/edit logic
            } else {
                 setDragState(prev => ({
                     ...prev,
                     isCreating: true,
                     startX: e.clientX,
                     startY: e.clientY,
                     currentX: canvasX,
                     currentY: canvasY
                 }));
                 return;
            }
        }
    }

    if (editingId === id || activeTool !== 'select' && activeTool !== 'type') return;

    let targetId = id;
    const el = elements.find(e => e.id === id);
    if (!el) return;

    // Group traversal: Select parent unless drilling down
    if (el.parentId && !e.metaKey) { // Meta key to drill down
        const parent = elements.find(p => p.id === el.parentId);
        if (parent) targetId = parent.id;
    }

    if (e.shiftKey) {
        onSelect(selectedIds.includes(targetId) ? selectedIds.filter(sid => sid !== targetId) : [...selectedIds, targetId]);
    } else {
        if (!selectedIds.includes(targetId)) onSelect([targetId]);
    }
    
    if (editingId && editingId !== targetId) setEditingId(null);

    const targetEl = elements.find(e => e.id === targetId);
    if (!targetEl) return;

    setDragState({
      isDragging: true,
      isResizing: false,
      isPanning: false,
      isCreating: false,
      startX: e.clientX,
      startY: e.clientY,
      currentX: 0,
      currentY: 0,
      initialElX: targetEl.x,
      initialElY: targetEl.y,
      initialWidth: targetEl.width,
      initialHeight: targetEl.height,
      elementId: targetId,
      initialPanX: 0,
      initialPanY: 0
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, id: string, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    const el = elements.find(e => e.id === id);
    if (!el) return;
    setDragState({
        isDragging: false,
        isResizing: true,
        isPanning: false,
        isCreating: false,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        currentX: 0, 
        currentY: 0,
        initialElX: el.x,
        initialElY: el.y,
        initialWidth: el.width,
        initialHeight: el.height,
        elementId: id,
        initialPanX: 0,
        initialPanY: 0
    });
  };

  // --- RECURSIVE RENDERER ---
  
  const renderElement = (el: DesignElement, parentX = 0, parentY = 0) => {
      const isSelected = selectedIds.includes(el.id);
      const isEditing = editingId === el.id;
      const isCircle = el.shapeType === 'circle';
      const isGroup = el.type === 'group';

      const { 
          brightness, contrast, saturate, blur, hueRotate, 
          rotation, mixBlendMode, boxShadow, backgroundImage, transform, backdropFilter, ...baseStyle 
      } = el.style || {};

      const filterString = [
          brightness && `brightness(${brightness}%)`,
          contrast && `contrast(${contrast}%)`,
          saturate && `saturate(${saturate}%)`,
          blur && `blur(${blur}px)`,
          hueRotate && `hue-rotate(${hueRotate}deg)`,
      ].filter(Boolean).join(' ');

      const wrapperTransform = [transform, rotation && `rotate(${rotation}deg)`].filter(Boolean).join(' ');

      const relativeLeft = el.x - parentX;
      const relativeTop = el.y - parentY;

      const children = elements.filter(child => child.parentId === el.id);
      
      // Improve Clipping Logic to support Circles
      const clipStyle = el.clip 
        ? (isCircle ? 'circle(50% at 50% 50%)' : `inset(0px round ${baseStyle.borderRadius || 0}px)`)
        : undefined;

      return (
          <div
              key={el.id}
              onMouseDown={(e) => handleElementMouseDown(e, el.id)}
              onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (el.type === 'text') setEditingId(el.id);
              }}
              onClick={(e) => e.stopPropagation()}
              className={`absolute group transition-none ${isSelected ? 'z-50' : 'z-10'}`}
              style={{
                  left: relativeLeft,
                  top: relativeTop,
                  width: el.width,
                  height: el.height,
                  transform: wrapperTransform,
                  pointerEvents: 'auto',
              }}
          >
              <div 
                  className="w-full h-full relative"
                  style={{ 
                      ...baseStyle,
                      borderRadius: isCircle ? '50%' : (baseStyle.borderRadius || 0),
                      filter: filterString,
                      mixBlendMode: mixBlendMode as any,
                      boxShadow: boxShadow,
                      backgroundImage: backgroundImage,
                      backdropFilter: backdropFilter,
                      color: el.type === 'text' && baseStyle.color ? baseStyle.color : 'black',
                      fontSize: el.type === 'text' && baseStyle.fontSize ? `${baseStyle.fontSize}px` : undefined,
                      lineHeight: el.type === 'text' && baseStyle.lineHeight ? `${baseStyle.lineHeight}` : undefined,
                      display: 'flex',
                      alignItems: el.type === 'text' ? 'flex-start' : 'center',
                      justifyContent: 'center',
                      overflow: 'visible', // Visible wrapper, actual clip happens via clipPath
                      clipPath: clipStyle
                  }}
              >
                  {/* Content */}
                  {el.type === 'text' ? (
                      isEditing ? (
                          <div 
                              className="w-full h-full outline-none bg-transparent resize-none"
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => onUpdate(el.id, { content: e.currentTarget.innerText })}
                              ref={(node) => { if (node && document.activeElement !== node) node.focus(); }}
                              style={{ cursor: 'text', whiteSpace: 'pre-wrap', fontFamily: baseStyle.fontFamily || 'Inter', width: '100%', height: '100%' }}
                          >{el.content}</div>
                      ) : (
                          <div className="w-full h-full whitespace-pre-wrap select-none" style={{ fontFamily: baseStyle.fontFamily || 'Inter' }}>
                              {el.content || 'Double click to edit'}
                          </div>
                      )
                  ) : el.type === 'image' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden">
                          {el.src ? (
                              <img src={el.src} className="w-full h-full object-cover pointer-events-none" alt="element" />
                          ) : (
                              <span className="text-4xl">📷</span>
                          )}
                      </div>
                  ) : null}

                  {/* Children Rendered Here (Recursion) */}
                  {children.map(child => renderElement(child, el.x, el.y))}
              </div>
          </div>
      );
  };

  const renderSelectionOverlay = () => {
      return selectedIds.map(id => {
          const el = elements.find(e => e.id === id);
          if (!el || editingId === id || activeTool === 'hand') return null;
          
          const isCircle = el.shapeType === 'circle';
          
          return (
             <div 
                key={`overlay-${id}`}
                className="absolute pointer-events-none z-[100]"
                style={{
                    left: el.x,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                    transform: el.style?.rotation ? `rotate(${el.style.rotation}deg)` : 'none'
                }}
             >
                 {selectedIds.length === 1 && (
                    <div className="absolute -top-7 left-0 text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded-sm font-mono whitespace-nowrap shadow-sm z-50">
                        x:{Math.round(el.x)} y:{Math.round(el.y)}
                    </div>
                 )}
                 <div className="absolute inset-0 border border-blue-600 pointer-events-none" style={{ borderRadius: isCircle ? '50%' : (el.style?.borderRadius || 0) }} />
                 {/* Handles */}
                 <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white border border-blue-600 cursor-nw-resize pointer-events-auto" onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'nw')} />
                 <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white border border-blue-600 cursor-ne-resize pointer-events-auto" onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'ne')} />
                 <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-white border border-blue-600 cursor-sw-resize pointer-events-auto" onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'sw')} />
                 <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-white border border-blue-600 cursor-se-resize pointer-events-auto" onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'se')} />
             </div>
          );
      });
  };

  const renderGhostElement = () => {
      if (!dragState.isCreating || !canvasRef.current) return null;
      const rect = canvasRef.current.getBoundingClientRect();
      const startCanvasX = (dragState.startX - rect.left - pan.x) / zoom;
      const startCanvasY = (dragState.startY - rect.top - pan.y) / zoom;
      
      let w = Math.abs(dragState.currentX - startCanvasX);
      let h = Math.abs(dragState.currentY - startCanvasY);
      const x = Math.min(startCanvasX, dragState.currentX);
      const y = Math.min(startCanvasY, dragState.currentY);

      return (
          <div 
            className="absolute border border-dashed border-blue-500 bg-blue-500/10 z-[100] pointer-events-none"
            style={{
                left: x,
                top: y,
                width: w,
                height: h
            }}
          />
      );
  };

  return (
    <div 
      className={`w-full h-full relative overflow-hidden bg-zinc-950 ${activeTool === 'hand' || dragState.isPanning ? 'cursor-grab active:cursor-grabbing' : activeTool !== 'select' ? 'cursor-crosshair' : 'cursor-default'}`}
      onMouseDown={handleMouseDown}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      ref={canvasRef}
    >
      <Ruler orientation="horizontal" />
      <Ruler orientation="vertical" />
      <div className="absolute top-0 left-0 w-6 h-6 bg-zinc-950 border-r border-b border-zinc-800 z-40" />
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundPosition: `${pan.x % 20}px ${pan.y % 20}px` }} 
      />

      <div 
        style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: gridConfig.width,
            height: gridConfig.height,
            backgroundColor: '#ffffff',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 25px 50px -12px rgba(0,0,0,0.5)'
        }}
        className="relative transition-transform duration-75 ease-out select-none"
      >
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
             {gridConfig.visible && (
                <div className="absolute inset-0 pointer-events-none" style={{ 
                    backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent ${gridConfig.baseline - 1}px, rgba(59, 130, 246, 0.1) ${gridConfig.baseline - 1}px, rgba(59, 130, 246, 0.1) ${gridConfig.baseline}px)`,
                    backgroundPosition: '0 -1px'
                }}>
                  <div className="absolute border border-blue-500/20" style={{ top: gridConfig.margin, left: gridConfig.margin, right: gridConfig.margin, bottom: gridConfig.margin }}>
                     <div className="w-full h-full flex justify-between">
                        {Array.from({length: gridConfig.columns}).map((_, i) => <div key={i} className="h-full bg-blue-500/5" style={{ width: (gridConfig.width - (gridConfig.margin * 2) - ((gridConfig.columns - 1) * gridConfig.gutter)) / gridConfig.columns }}></div>)}
                     </div>
                  </div>
                </div>
             )}
        </div>

        <div className="absolute inset-0 z-10">
            {elements.filter(el => !el.parentId).map(el => renderElement(el))}
        </div>
        
        {renderSelectionOverlay()}
        {renderGhostElement()}

      </div>
    </div>
  );
};