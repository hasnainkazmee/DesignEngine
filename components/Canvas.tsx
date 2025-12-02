import React, { useRef, useState, useEffect, useMemo } from 'react';
import { GridConfig, DesignElement, ToolType, ComponentItem, PathPoint } from '../types';
import { generateGradientCSS, sortColorStops } from '../utils/gradients';

interface CanvasProps {
  elements: DesignElement[];
  gridConfig: GridConfig;
  selectedIds: string[];
  onSelect: (ids: string[] | null) => void;
  onUpdate: (id: string, updates: Partial<DesignElement>) => void;
  activeTool: ToolType;
  onCanvasClick: (x: number, y: number) => void;
  snapToGrid: (val: number, type: 'x' | 'y', closest?: boolean) => number;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onComponentDrop: (component: ComponentItem, x: number, y: number) => void;
  pan: { x: number, y: number };
  onPanChange: (pan: { x: number, y: number }) => void;
  zoom: number;
  exportRef?: React.MutableRefObject<HTMLDivElement | null>;
  activePath?: { points: PathPoint[], isClosed: boolean } | null;
  penToolState?: { isDragging: boolean; startX: number; startY: number; currentPointIndex: number | null } | null;
  editingPathId?: string | null;
  onPenToolMouseDown?: (x: number, y: number) => void;
  onPenToolMouseMove?: (x: number, y: number) => void;
  onPenToolMouseUp?: () => void;
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
  pan,
  onPanChange,
  zoom,
  exportRef,
  activePath,
  penToolState,
  editingPathId,
  onPenToolMouseDown,
  onPenToolMouseMove,
  onPenToolMouseUp
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const artboardRef = useRef<HTMLDivElement>(null);
  const [marquee, setMarquee] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const [gradientEditState, setGradientEditState] = useState<{
    isDragging: boolean;
    handleType: 'start' | 'end' | 'center' | 'angle' | null;
    elementId: string | null;
    startX: number;
    startY: number;
    initialGradient: any;
  } | null>(null);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    isResizing: boolean;
    isPanning: boolean;
    isSelecting: boolean;
    handle?: string;
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
    elementId: string | null;
    initialPanX: number;
    initialPanY: number;
    initialElements: { id: string; x: number; y: number; width: number; height: number }[];
    initialBoundingBox: { x: number; y: number; width: number; height: number } | null;
  }>({
    isDragging: false,
    isResizing: false,
    isPanning: false,
    isSelecting: false,
    startX: 0,
    startY: 0,
    initialWidth: 0,
    initialHeight: 0,
    elementId: null,
    initialPanX: 0,
    initialPanY: 0,
    initialElements: [],
    initialBoundingBox: null,
  });

  const selectionBoundingBox = useMemo(() => {
    if (selectedIds.length === 0) return null;

    const selectedElements = elements.filter(el => selectedIds.includes(el.id));
    if (selectedElements.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedElements.forEach(el => {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + el.width);
      maxY = Math.max(maxY, el.y + el.height);
    });

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }, [selectedIds, elements]);

  useEffect(() => {
    if (!exportRef) return;
    exportRef.current = artboardRef.current;
    return () => {
      if (exportRef.current === artboardRef.current) {
        exportRef.current = null;
      }
    };
  }, [exportRef]);

  // --- Drag & Drop for Components ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!canvasRef.current) return;

    const json = e.dataTransfer.getData('application/json');
    if (json) {
      try {
        const component = JSON.parse(json) as ComponentItem;
        const rect = canvasRef.current.getBoundingClientRect();

        // Correct logic to account for pan and zoom
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const canvasX = (mouseX - pan.x) / zoom;
        const canvasY = (mouseY - pan.y) / zoom;

        const centeredX = canvasX - (component.element.width / 2);
        const centeredY = canvasY - (component.element.height / 2);

        onComponentDrop(component, centeredX, centeredY);
      } catch (err) {
        console.error("Failed to drop component", err);
      }
    }
  };

  // --- Interaction Logic ---

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const currentClientX = e.clientX;
      const currentClientY = e.clientY;

      // --- PEN TOOL DRAGGING ---
      if (activeTool === 'pen' && penToolState?.isDragging && onPenToolMouseMove) {
        const mouseX = currentClientX - rect.left;
        const mouseY = currentClientY - rect.top;
        const canvasX = (mouseX - pan.x) / zoom;
        const canvasY = (mouseY - pan.y) / zoom;
        onPenToolMouseMove(canvasX, canvasY);
        return;
      }

      // --- GRADIENT EDITING ---
      if (gradientEditState?.isDragging && gradientEditState.elementId) {
        const mouseX = currentClientX - rect.left;
        const mouseY = currentClientY - rect.top;
        const canvasX = (mouseX - pan.x) / zoom;
        const canvasY = (mouseY - pan.y) / zoom;

        const element = elements.find(el => el.id === gradientEditState.elementId);
        if (!element || !element.style?.gradient) return;

        const gradient = { ...element.style.gradient };
        const elX = element.x;
        const elY = element.y;
        const elW = element.width;
        const elH = element.height;

        if (gradient.type === 'linear' && (gradientEditState.handleType === 'start' || gradientEditState.handleType === 'end')) {
          const centerX = elX + elW / 2;
          const centerY = elY + elH / 2;

          // Calculate new angle based on mouse position relative to center
          const dx = canvasX - centerX;
          const dy = canvasY - centerY;
          const newAngle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;

          onUpdate(gradientEditState.elementId, {
            style: {
              ...element.style,
              gradient: { ...gradient, angle: newAngle }
            }
          });
        } else if (gradient.type === 'radial') {
          if (gradientEditState.handleType === 'center') {
            const newX = Math.max(0, Math.min(1, (canvasX - elX) / elW));
            const newY = Math.max(0, Math.min(1, (canvasY - elY) / elH));

            onUpdate(gradientEditState.elementId, {
              style: {
                ...element.style,
                gradient: { ...gradient, position: { x: newX, y: newY } }
              }
            });
          } else if (gradientEditState.handleType === 'radius') {
            const pos = gradient.position || { x: 0.5, y: 0.5 };
            const centerX = elX + pos.x * elW;
            const centerY = elY + pos.y * elH;

            const distance = Math.sqrt(
              Math.pow(canvasX - centerX, 2) + 
              Math.pow(canvasY - centerY, 2)
            );
            const maxRadius = Math.min(elW, elH) / 2;
            const newRadius = Math.max(0.1, Math.min(1, distance / maxRadius));

            onUpdate(gradientEditState.elementId, {
              style: {
                ...element.style,
                gradient: { ...gradient, radius: newRadius }
              }
            });
          }
        }
        return;
      }

      const deltaScreenX = currentClientX - dragState.startX;
      const deltaScreenY = currentClientY - dragState.startY;

      // --- PANNING ---
      if (dragState.isPanning) {
        onPanChange({
          x: dragState.initialPanX + deltaScreenX,
          y: dragState.initialPanY + deltaScreenY
        });
        return;
      }

      // --- SELECTION MARQUEE ---
      if (dragState.isSelecting) {
        const startCanvasX = (dragState.startX - rect.left - pan.x) / zoom;
        const startCanvasY = (dragState.startY - rect.top - pan.y) / zoom;
        const currentCanvasX = (currentClientX - rect.left - pan.x) / zoom;
        const currentCanvasY = (currentClientY - rect.top - pan.y) / zoom;

        const x = Math.min(startCanvasX, currentCanvasX);
        const y = Math.min(startCanvasY, currentCanvasY);
        const width = Math.abs(startCanvasX - currentCanvasX);
        const height = Math.abs(startCanvasY - currentCanvasY);

        setMarquee({ x, y, width, height });
        return;
      }

      // --- ELEMENT MANIPULATION ---
      const deltaX = deltaScreenX / zoom;
      const deltaY = deltaScreenY / zoom;

      // --- DRAGGING ---
      if (dragState.isDragging) {
        dragState.initialElements.forEach(initialEl => {
          const currentElement = elements.find(el => el.id === initialEl.id);
          if (!currentElement) return;

          let newX = initialEl.x + deltaX;
          let newY = initialEl.y + deltaY;

          if (currentElement.constraints.includes('grid-snap')) {
            newX = snapToGrid(newX, 'x');
          }
          if (currentElement.constraints.includes('baseline-snap')) {
            newY = snapToGrid(newY, 'y');
          }

          onUpdate(initialEl.id, { x: newX, y: newY });
        });
      }

      // --- RESIZING ---
      if (dragState.isResizing && dragState.handle && dragState.initialBoundingBox) {
        const { handle, initialBoundingBox, initialElements } = dragState;

        let newBoxX = initialBoundingBox.x;
        let newBoxY = initialBoundingBox.y;
        let newBoxW = initialBoundingBox.width;
        let newBoxH = initialBoundingBox.height;

        // Calculate new bounding box dimensions
        if (handle.includes('e')) newBoxW = initialBoundingBox.width + deltaX;
        if (handle.includes('w')) {
          newBoxW = initialBoundingBox.width - deltaX;
          newBoxX = initialBoundingBox.x + deltaX;
        }
        if (handle.includes('s')) newBoxH = initialBoundingBox.height + deltaY;
        if (handle.includes('n')) {
          newBoxH = initialBoundingBox.height - deltaY;
          newBoxY = initialBoundingBox.y + deltaY;
        }

        // Prevent flipping
        if (newBoxW < 1) newBoxW = 1;
        if (newBoxH < 1) newBoxH = 1;

        const scaleX = newBoxW / initialBoundingBox.width;
        const scaleY = newBoxH / initialBoundingBox.height;

        initialElements.forEach(initialEl => {
          const relativeX = initialEl.x - initialBoundingBox.x;
          const relativeY = initialEl.y - initialBoundingBox.y;

          const newX = newBoxX + (relativeX * scaleX);
          const newY = newBoxY + (relativeY * scaleY);
          const newW = initialEl.width * scaleX;
          const newH = initialEl.height * scaleY;

          onUpdate(initialEl.id, { x: newX, y: newY, width: newW, height: newH });
        });
      }
    };

    const handleMouseUp = () => {
      // --- PEN TOOL MOUSE UP ---
      if (activeTool === 'pen' && penToolState?.isDragging && onPenToolMouseUp) {
        onPenToolMouseUp();
      }

      // --- GRADIENT EDITING MOUSE UP ---
      if (gradientEditState?.isDragging) {
        setGradientEditState(null);
      }

      // If we were selecting, find elements in marquee
      if (dragState.isSelecting && marquee) {
        const selected = elements.filter(el => {
          const elRect = { x: el.x, y: el.y, width: el.width, height: el.height };
          const marqueeRect = marquee;
          // Check for intersection
          return (
            elRect.x < marqueeRect.x + marqueeRect.width &&
            elRect.x + elRect.width > marqueeRect.x &&
            elRect.y < marqueeRect.y + marqueeRect.height &&
            elRect.y + elRect.height > marqueeRect.y
          );
        }).map(el => el.id);

        onSelect(selected);
      } else if (!dragState.isDragging && !dragState.isResizing) {
        // If we just clicked the background, clear selection
        onSelect([]);
      }


      setDragState(prev => ({
        ...prev,
        isDragging: false,
        isResizing: false,
        isPanning: false,
        isSelecting: false,
        elementId: null
      }));
      setMarquee(null);
    };

    if (dragState.isDragging || dragState.isResizing || dragState.isPanning || dragState.isSelecting || (activeTool === 'pen' && penToolState?.isDragging) || gradientEditState?.isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, elements, onUpdate, snapToGrid, onPanChange, zoom, onSelect, pan.x, pan.y, activeTool, penToolState, onPenToolMouseMove, onPenToolMouseUp, gradientEditState]);


  const handleMouseDown = (e: React.MouseEvent) => {
    // Check if Hand tool
    if (activeTool === 'hand') {
      setDragState(prev => ({
        ...prev,
        isPanning: true,
        startX: e.clientX,
        startY: e.clientY,
        initialPanX: pan.x,
        initialPanY: pan.y,
        initialElements: [],
        initialBoundingBox: null,
      }));
      return;
    }

    // If not on an element, and we're using the select tool, start marquee selection
    if (activeTool === 'select') {
      setDragState(prev => ({
        ...prev,
        isSelecting: true,
        startX: e.clientX,
        startY: e.clientY,
        initialPanX: pan.x,
        initialPanY: pan.y,
        initialElements: [],
        initialBoundingBox: null,
      }));
    }

    // Normal Click logic handled by onClick mostly
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert to canvas coords
    const canvasX = (mouseX - pan.x) / zoom;
    const canvasY = (mouseY - pan.y) / zoom;

    // onSelect([]); // We do this on mouseUp now to allow clicking an item without clearing selection
    setEditingId(null);

    // Pen tool uses mouse down for better drag handling
    if (activeTool === 'pen' && onPenToolMouseDown) {
      onPenToolMouseDown(canvasX, canvasY);
    } else if (activeTool === 'gradient') {
      // Gradient tool: apply gradient to clicked element if it's a box/image
      const clickedElement = elements.find(el => {
        return canvasX >= el.x && canvasX <= el.x + el.width &&
               canvasY >= el.y && canvasY <= el.y + el.height;
      });
      
      if (clickedElement && (clickedElement.type === 'box' || clickedElement.type === 'image')) {
        if (!clickedElement.style?.gradient) {
          // Apply default gradient if element doesn't have one
          onUpdate(clickedElement.id, {
            style: {
              ...clickedElement.style,
              gradient: {
                type: 'linear',
                angle: 0,
                stops: [
                  { position: 0, color: { r: 0, g: 0, b: 0 }, opacity: 100 },
                  { position: 100, color: { r: 255, g: 255, b: 255 }, opacity: 100 }
                ]
              }
            }
          });
        }
        onSelect([clickedElement.id]);
      }
    } else if (activeTool !== 'select') {
      onCanvasClick(canvasX, canvasY);
    }
  };

  const handleElementMouseDown = (e: React.MouseEvent, id: string) => {
    // Allow pen tool to click through elements
    if (activeTool === 'pen') {
      // Don't stop propagation, let it reach canvas
      return;
    }

    e.stopPropagation();

    // If Hand tool, delegate to canvas pan
    if (activeTool === 'hand') {
      setDragState(prev => ({
        ...prev,
        isPanning: true,
        startX: e.clientX,
        startY: e.clientY,
        initialPanX: pan.x,
        initialPanY: pan.y,
        initialElements: [],
        initialBoundingBox: null,
      }));
      return;
    }

    // Gradient tool: apply gradient to clicked element
    if (activeTool === 'gradient') {
      const clickedElement = elements.find(el => el.id === id);
      if (clickedElement && (clickedElement.type === 'box' || clickedElement.type === 'image' || clickedElement.type === 'text' || clickedElement.type === 'path')) {
        if (!clickedElement.style?.gradient) {
          // Apply default gradient if element doesn't have one
          onUpdate(clickedElement.id, {
            style: {
              ...clickedElement.style,
              gradient: {
                type: 'linear',
                angle: 0,
                stops: [
                  { position: 0, color: { r: 0, g: 0, b: 0 }, opacity: 100 },
                  { position: 100, color: { r: 255, g: 255, b: 255 }, opacity: 100 }
                ]
              }
            }
          });
        }
        onSelect([clickedElement.id]);
      }
      return;
    }

    if (editingId === id) return;
    if (activeTool !== 'select') return;

    const clickedElement = elements.find(el => el.id === id);
    if (!clickedElement) return;

    let currentSelection = selectedIds;

    // Group selection logic
    if (clickedElement.groupId) {
      const groupMembers = elements.filter(el => el.groupId === clickedElement.groupId).map(el => el.id);
      onSelect(groupMembers);
      currentSelection = groupMembers;
    } else {
      // Multi-select logic (fallback for non-grouped items)
      if (e.shiftKey) {
        const isCurrentlySelected = selectedIds.includes(id);
        if (isCurrentlySelected) {
          const newSelection = selectedIds.filter(sid => sid !== id);
          onSelect(newSelection);
          currentSelection = newSelection;
        } else {
          const newSelection = [...selectedIds, id];
          onSelect(newSelection);
          currentSelection = newSelection;
        }
      } else {
        if (!selectedIds.includes(id)) {
          onSelect([id]);
          currentSelection = [id];
        }
      }
    }

    if (editingId && editingId !== id) setEditingId(null);

    // If the clicked element is part of a selection, prepare to drag all selected elements.
    // Otherwise, drag only the clicked element.
    const selectionToDrag = currentSelection.includes(id) ? currentSelection : [id];
    const initialElementsToDrag = elements
      .filter(elem => selectionToDrag.includes(elem.id))
      .map(elem => ({ id: elem.id, x: elem.x, y: elem.y, width: elem.width, height: elem.height }));

    setDragState({
      isDragging: true,
      isResizing: false,
      isPanning: false,
      isSelecting: false,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: 0,
      initialHeight: 0,
      elementId: id, // The "dragged" element is the one clicked
      initialPanX: 0,
      initialPanY: 0,
      initialElements: initialElementsToDrag,
      initialBoundingBox: null,
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!selectionBoundingBox) return;

    const selectedElements = elements.filter(el => selectedIds.includes(el.id));

    setDragState({
      isDragging: false,
      isResizing: true,
      isPanning: false,
      isSelecting: false,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: 0, // Not needed for group resize
      initialHeight: 0, // Not needed for group resize
      elementId: null, // Not tied to a single element
      initialPanX: 0,
      initialPanY: 0,
      initialElements: selectedElements.map(el => ({ ...el })), // Deep copy
      initialBoundingBox: selectionBoundingBox,
    });
  };

  const handleElementDoubleClick = (e: React.MouseEvent, id: string, type: string) => {
    e.stopPropagation();
    if (activeTool === 'hand') return;
    if (type === 'text') {
      setEditingId(id);
    }
  };

  // --- Path Rendering Helper ---
  const renderPath = (points: PathPoint[], isClosed: boolean, style: any, elementId?: string, width?: number, height?: number) => {
    if (points.length === 0) return null;

    // Calculate bounding box of the path to properly position gradients
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const allPoints = [...points];
    points.forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
      if (p.control1) {
        minX = Math.min(minX, p.control1.x);
        minY = Math.min(minY, p.control1.y);
        maxX = Math.max(maxX, p.control1.x);
        maxY = Math.max(maxY, p.control1.y);
      }
      if (p.control2) {
        minX = Math.min(minX, p.control2.x);
        minY = Math.min(minY, p.control2.y);
        maxX = Math.max(maxX, p.control2.x);
        maxY = Math.max(maxY, p.control2.y);
      }
    });
    const pathWidth = maxX - minX || 1;
    const pathHeight = maxY - minY || 1;

    // Build path using original coordinates
    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      const prev = points[i - 1];

      const hasPrevControl2 = prev.control2 !== undefined;
      const hasCurrControl1 = p.control1 !== undefined;

      if (hasPrevControl2) {
        if (hasCurrControl1) {
          d += ` C ${prev.control2.x} ${prev.control2.y}, ${p.control1.x} ${p.control1.y}, ${p.x} ${p.y}`;
        } else {
          d += ` Q ${prev.control2.x} ${prev.control2.y}, ${p.x} ${p.y}`;
        }
      } else {
        d += ` L ${p.x} ${p.y}`;
      }
    }

    if (isClosed) {
      const firstPoint = points[0];
      const lastPoint = points[points.length - 1];
      const hasLastControl = lastPoint.control2 !== undefined;
      const hasFirstControl = firstPoint.control1 !== undefined;

      if (hasLastControl && hasFirstControl) {
        d += ` C ${lastPoint.control2.x} ${lastPoint.control2.y}, ${firstPoint.control1.x} ${firstPoint.control1.y}, ${firstPoint.x} ${firstPoint.y}`;
      } else if (hasLastControl) {
        d += ` Q ${lastPoint.control2.x} ${lastPoint.control2.y}, ${firstPoint.x} ${firstPoint.y}`;
      } else if (hasFirstControl) {
        d += ` Q ${firstPoint.control1.x} ${firstPoint.control1.y}, ${firstPoint.x} ${firstPoint.y}`;
      } else {
        d += ' Z';
      }
    }

    const strokeColor = style?.stroke === 'none' || !style?.stroke ? 'none' : (style.stroke || 'black');
    const gradientId = elementId && style?.gradient ? `gradient-${elementId}` : null;
    
    // Generate gradient definition if needed - use path bounding box coordinates
    const gradientDef = gradientId && style?.gradient && pathWidth > 0 && pathHeight > 0 ? (
      <defs>
        {style.gradient.type === 'linear' ? (
          <linearGradient 
            id={gradientId} 
            x1={minX}
            y1={minY}
            x2={maxX}
            y2={minY}
            gradientUnits="userSpaceOnUse"
            gradientTransform={`rotate(${style.gradient.angle || 0} ${minX + pathWidth / 2} ${minY + pathHeight / 2})`}
          >
            {sortColorStops(style.gradient.stops).map((stop, idx) => (
              <stop
                key={idx}
                offset={`${stop.position}%`}
                stopColor={`rgb(${stop.color.r}, ${stop.color.g}, ${stop.color.b})`}
                stopOpacity={stop.opacity / 100}
              />
            ))}
          </linearGradient>
        ) : style.gradient.type === 'radial' ? (
          <radialGradient
            id={gradientId}
            cx={minX + (style.gradient.position?.x || 0.5) * pathWidth}
            cy={minY + (style.gradient.position?.y || 0.5) * pathHeight}
            r={(style.gradient.radius || 0.5) * Math.max(pathWidth, pathHeight)}
            gradientUnits="userSpaceOnUse"
          >
            {sortColorStops(style.gradient.stops).map((stop, idx) => (
              <stop
                key={idx}
                offset={`${stop.position}%`}
                stopColor={`rgb(${stop.color.r}, ${stop.color.g}, ${stop.color.b})`}
                stopOpacity={stop.opacity / 100}
              />
            ))}
          </radialGradient>
        ) : (
          <linearGradient 
            id={gradientId} 
            x1={minX}
            y1={minY}
            x2={maxX}
            y2={minY}
            gradientUnits="userSpaceOnUse"
          >
            {sortColorStops(style.gradient.stops).map((stop, idx) => (
              <stop
                key={idx}
                offset={`${stop.position}%`}
                stopColor={`rgb(${stop.color.r}, ${stop.color.g}, ${stop.color.b})`}
                stopOpacity={stop.opacity / 100}
              />
            ))}
          </linearGradient>
        )}
      </defs>
    ) : null;
    
    return (
      <>
        {gradientDef}
        <path
          d={d}
          stroke={strokeColor}
          strokeWidth={strokeColor === 'none' ? 0 : (style?.strokeWidth || 2)}
          fill={gradientId ? `url(#${gradientId})` : (style?.fill || 'none')}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    );
  };

  // --- Rendering ---

  const renderGrid = () => {
    if (!gridConfig.visible) return null;

    const colWidth = (gridConfig.width - (gridConfig.margin * 2) - ((gridConfig.columns - 1) * gridConfig.gutter)) / gridConfig.columns;

    const columns = [];
    for (let i = 0; i < gridConfig.columns; i++) {
      const left = gridConfig.margin + (i * (colWidth + gridConfig.gutter));
      columns.push(
        <div
          key={`col-${i}`}
          className="absolute top-0 bottom-0 bg-blue-500/5 pointer-events-none border-x border-blue-500/10"
          style={{ left, width: colWidth }}
        />
      );
    }

    const rows = [];
    const numRows = Math.floor(gridConfig.height / gridConfig.baseline);
    for (let i = 0; i < numRows; i++) {
      rows.push(
        <div
          key={`row-${i}`}
          className="absolute w-full border-b border-blue-500/10 pointer-events-none"
          style={{ top: i * gridConfig.baseline, height: 1 }}
        />
      );
    }

    return (
      <>
        {rows}
        {columns}
        <div
          className="absolute border border-purple-500/20 pointer-events-none"
          style={{
            top: gridConfig.margin,
            left: gridConfig.margin,
            right: gridConfig.margin,
            bottom: gridConfig.margin,
            width: gridConfig.width - (gridConfig.margin * 2),
            height: gridConfig.height - (gridConfig.margin * 2)
          }}
        />
      </>
    );
  };

  return (
    <div
      className={`w-full h-full relative overflow-hidden bg-zinc-900 ${activeTool === 'hand' || dragState.isPanning ? 'cursor-grab active:cursor-grabbing' : activeTool !== 'select' ? 'cursor-crosshair' : 'cursor-default'}`}
      onMouseDown={handleMouseDown}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      ref={canvasRef}
    >
      {/* Transform Container */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: gridConfig.width,
          height: gridConfig.height,
          backgroundColor: 'white',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}
        className="relative transition-transform duration-75 ease-out"
        ref={artboardRef}
      >
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" data-export-ignore="true">
          {renderGrid()}
        </div>

        <div className="absolute inset-0 z-10">
          {elements.map((el) => {
            const isSelected = selectedIds.includes(el.id);
            const isEditing = editingId === el.id;
            const isCircle = el.shapeType === 'circle';

            return (
              <div
                key={el.id}
                onMouseDown={(e) => handleElementMouseDown(e, el.id)}
                onDoubleClick={(e) => handleElementDoubleClick(e, el.id, el.type)}
                onClick={(e) => e.stopPropagation()}
                className={`
                            absolute group transition-none
                            ${isSelected && selectionBoundingBox === null ? 'z-50' : 'hover:ring-1 hover:ring-blue-400 z-10'}
                            ${activeTool === 'select' && !isEditing ? 'cursor-move' : ''}
                        `}
                style={{
                  left: el.x,
                  top: el.y,
                  width: el.width,
                  height: el.height,
                  ...el.style,
                  borderRadius: isCircle ? '50%' : (el.style?.borderRadius || 0),
                  color: el.type === 'text' && el.style?.color ? el.style.color : 'black',
                  fontSize: el.type === 'text' && el.style?.fontSize ? `${el.style.fontSize}px` : undefined,
                  lineHeight: el.type === 'text' && el.style?.lineHeight ? `${el.style.lineHeight}` : undefined,
                  display: 'flex',
                  alignItems: el.type === 'text' ? 'flex-start' : 'center',
                  justifyContent: 'center',
                  overflow: 'visible'
                }}
              >
                {/* Content */}
                <div 
                  className="w-full h-full overflow-hidden" 
                  style={{ 
                    borderRadius: isCircle ? '50%' : (el.style?.borderRadius || 0),
                    backgroundColor: el.style?.gradient && el.type !== 'path' ? undefined : (el.style?.backgroundColor || 'transparent'),
                    backgroundImage: el.style?.gradient && el.type !== 'text' && el.type !== 'path' ? generateGradientCSS(el.style.gradient, el.width, el.height) : undefined,
                    backgroundSize: el.style?.gradient && el.type !== 'text' && el.type !== 'path' ? '100% 100%' : undefined
                  }}
                >
                  {el.type === 'text' ? (
                    isEditing ? (
                      <div
                        className="w-full h-full outline-none p-0 m-0 bg-transparent resize-none"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          onUpdate(el.id, { content: e.currentTarget.innerText });
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        ref={(node) => {
                          if (node && document.activeElement !== node) {
                            node.focus();
                            try {
                              const range = document.createRange();
                              range.selectNodeContents(node);
                              range.collapse(false);
                              const sel = window.getSelection();
                              sel?.removeAllRanges();
                              sel?.addRange(range);
                            } catch (e) { }
                          }
                        }}
                        style={{
                          cursor: 'text',
                          caretColor: el.style?.gradient ? '#000' : (el.style?.color || 'black'),
                          whiteSpace: 'pre-wrap',
                          fontFamily: el.style?.fontFamily || 'Inter',
                          width: '100%',
                          height: '100%',
                          ...(el.style?.gradient ? {
                            backgroundImage: generateGradientCSS(el.style.gradient, el.width, el.height),
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            color: 'transparent'
                          } : {})
                        }}
                      >
                        {el.content}
                      </div>
                    ) : (
                      <div
                        className="w-full h-full whitespace-pre-wrap select-none"
                        style={{ 
                          fontFamily: el.style?.fontFamily || 'Inter',
                          ...(el.style?.gradient ? {
                            backgroundImage: generateGradientCSS(el.style.gradient, el.width, el.height),
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            color: 'transparent'
                          } : {
                            color: el.style?.color || 'black'
                          })
                        }}
                      >
                        {el.content || 'Double click to edit'}
                      </div>
                    )
                  ) : el.type === 'image' ? (
                    el.src ? (
                      <img
                        src={el.src}
                        alt={el.role || 'Imported asset'}
                        className="w-full h-full object-cover select-none pointer-events-none"
                        draggable={false}
                        style={{ borderRadius: isCircle ? '50%' : (el.style?.borderRadius || 0) }}
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-100 flex flex-col items-center justify-center text-zinc-400 select-none">
                        <span className="text-4xl">📷</span>
                        <span className="text-xs mt-1">Awaiting source</span>
                      </div>
                    )
                  ) : el.type === 'path' && el.points ? (
                    <svg className="overflow-visible w-full h-full absolute top-0 left-0 pointer-events-none">
                      {renderPath(el.points, el.isClosed || false, el.style, el.id, el.width, el.height)}
                    </svg>
                  ) : null}
                </div>

                {/* Individual Selection Highlight */}
                {isSelected && !isEditing && (
                  <div className="absolute inset-0 border border-blue-600/50 pointer-events-none" data-export-ignore="true" />
                )}
              </div>
            );
          })}

          {/* Selection Bounding Box and Resize Handles */}
          {selectionBoundingBox && !editingId && activeTool === 'select' && (
            <div
              className="absolute pointer-events-none z-50"
              style={{
                left: selectionBoundingBox.x,
                top: selectionBoundingBox.y,
                width: selectionBoundingBox.width,
                height: selectionBoundingBox.height,

              }}
            >
              <div className="absolute inset-0 border border-blue-600 pointer-events-none" data-export-ignore="true" />

              {/* Resize Handles */}
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-600 rounded-full cursor-nw-resize z-50 pointer-events-auto" data-export-ignore="true" onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} />
              <div className="absolute -top-1.5 right-[calc(50%-6px)] w-3 h-3 bg-white border border-blue-600 rounded-full cursor-n-resize z-50 pointer-events-auto" data-export-ignore="true" onMouseDown={(e) => handleResizeMouseDown(e, 'n')} />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-600 rounded-full cursor-ne-resize z-50 pointer-events-auto" data-export-ignore="true" onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} />
              <div className="absolute top-[calc(50%-6px)] -right-1.5 w-3 h-3 bg-white border border-blue-600 rounded-full cursor-e-resize z-50 pointer-events-auto" data-export-ignore="true" onMouseDown={(e) => handleResizeMouseDown(e, 'e')} />
              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-600 rounded-full cursor-se-resize z-50 pointer-events-auto" data-export-ignore="true" onMouseDown={(e) => handleResizeMouseDown(e, 'se')} />
              <div className="absolute -bottom-1.5 right-[calc(50%-6px)] w-3 h-3 bg-white border border-blue-600 rounded-full cursor-s-resize z-50 pointer-events-auto" data-export-ignore="true" onMouseDown={(e) => handleResizeMouseDown(e, 's')} />
              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-600 rounded-full cursor-sw-resize z-50 pointer-events-auto" data-export-ignore="true" onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} />
              <div className="absolute top-[calc(50%-6px)] -left-1.5 w-3 h-3 bg-white border border-blue-600 rounded-full cursor-w-resize z-50 pointer-events-auto" data-export-ignore="true" onMouseDown={(e) => handleResizeMouseDown(e, 'w')} />
            </div>
          )}

          {marquee && (
            <div
              className="absolute border border-blue-500 bg-blue-500/20 pointer-events-none z-50"
              style={{
                left: marquee.x,
                top: marquee.y,
                width: marquee.width,
                height: marquee.height,
              }}
            />
          )}

          {/* Active Path (Drawing) */}
          {activePath && (
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-50 overflow-visible">
              {renderPath(activePath.points, activePath.isClosed, { stroke: '#0066ff', strokeWidth: 2, fill: 'none' })}
              {activePath.points.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r={4} fill="white" stroke="#0066ff" strokeWidth={2} />
                  {p.control1 && (
                    <>
                      <line x1={p.x} y1={p.y} x2={p.control1.x} y2={p.control1.y} stroke="#0066ff" strokeWidth={1} strokeDasharray="2,2" opacity={0.5} />
                      <circle cx={p.control1.x} cy={p.control1.y} r={3} fill="#0066ff" stroke="white" strokeWidth={1} />
                    </>
                  )}
                  {p.control2 && (
                    <>
                      <line x1={p.x} y1={p.y} x2={p.control2.x} y2={p.control2.y} stroke="#0066ff" strokeWidth={1} strokeDasharray="2,2" opacity={0.5} />
                      <circle cx={p.control2.x} cy={p.control2.y} r={3} fill="#0066ff" stroke="white" strokeWidth={1} />
                    </>
                  )}
                </g>
              ))}
            </svg>
          )}

          {/* Path Editing Mode - Show control handles for selected path */}
          {editingPathId && (() => {
            const editingPath = elements.find(el => el.id === editingPathId && el.type === 'path');
            if (!editingPath || !editingPath.points) return null;

            return (
              <svg 
                className="absolute top-0 left-0 w-full h-full pointer-events-none z-50 overflow-visible"
                style={{ left: editingPath.x, top: editingPath.y }}
              >
                {editingPath.points.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r={5} fill="white" stroke="#0066ff" strokeWidth={2} className="pointer-events-auto cursor-move" />
                    {p.control1 && (
                      <>
                        <line x1={p.x} y1={p.y} x2={p.control1.x} y2={p.control1.y} stroke="#0066ff" strokeWidth={1} strokeDasharray="2,2" opacity={0.5} />
                        <circle cx={p.control1.x} cy={p.control1.y} r={4} fill="#0066ff" stroke="white" strokeWidth={1.5} className="pointer-events-auto cursor-pointer" />
                      </>
                    )}
                    {p.control2 && (
                      <>
                        <line x1={p.x} y1={p.y} x2={p.control2.x} y2={p.control2.y} stroke="#0066ff" strokeWidth={1} strokeDasharray="2,2" opacity={0.5} />
                        <circle cx={p.control2.x} cy={p.control2.y} r={4} fill="#0066ff" stroke="white" strokeWidth={1.5} className="pointer-events-auto cursor-pointer" />
                      </>
                    )}
                  </g>
                ))}
              </svg>
            );
          })()}

          {/* Gradient Handles - Show when gradient tool is active and element has gradient */}
          {activeTool === 'gradient' && selectedIds.length === 1 && (() => {
            const selectedElement = elements.find(el => el.id === selectedIds[0]);
            if (!selectedElement || !selectedElement.style?.gradient) return null;

            const gradient = selectedElement.style.gradient;
            const elX = selectedElement.x;
            const elY = selectedElement.y;
            const elW = selectedElement.width;
            const elH = selectedElement.height;

            // Calculate gradient line endpoints for linear gradients
            if (gradient.type === 'linear') {
              const angle = (gradient.angle || 0) * Math.PI / 180;
              const centerX = elX + elW / 2;
              const centerY = elY + elH / 2;
              const length = Math.sqrt(elW * elW + elH * elH) / 2;
              
              const startX = centerX - Math.cos(angle) * length;
              const startY = centerY - Math.sin(angle) * length;
              const endX = centerX + Math.cos(angle) * length;
              const endY = centerY + Math.sin(angle) * length;

              return (
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-50 overflow-visible" data-export-ignore="true">
                  <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke="#0066ff"
                    strokeWidth={2}
                    strokeDasharray="4,4"
                    opacity={0.6}
                  />
                  <circle
                    cx={startX}
                    cy={startY}
                    r={6}
                    fill="white"
                    stroke="#0066ff"
                    strokeWidth={2}
                    className="pointer-events-auto cursor-move"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setGradientEditState({
                        isDragging: true,
                        handleType: 'start',
                        elementId: selectedElement.id,
                        startX: e.clientX,
                        startY: e.clientY,
                        initialGradient: { ...gradient }
                      });
                    }}
                  />
                  <circle
                    cx={endX}
                    cy={endY}
                    r={6}
                    fill="white"
                    stroke="#0066ff"
                    strokeWidth={2}
                    className="pointer-events-auto cursor-move"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setGradientEditState({
                        isDragging: true,
                        handleType: 'end',
                        elementId: selectedElement.id,
                        startX: e.clientX,
                        startY: e.clientY,
                        initialGradient: { ...gradient }
                      });
                    }}
                  />
                </svg>
              );
            }

            // Radial gradient handles
            if (gradient.type === 'radial') {
              const pos = gradient.position || { x: 0.5, y: 0.5 };
              const centerX = elX + pos.x * elW;
              const centerY = elY + pos.y * elH;
              const radius = (gradient.radius || 0.5) * Math.min(elW, elH);

              return (
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-50 overflow-visible" data-export-ignore="true">
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r={radius}
                    fill="none"
                    stroke="#0066ff"
                    strokeWidth={2}
                    strokeDasharray="4,4"
                    opacity={0.6}
                  />
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r={6}
                    fill="white"
                    stroke="#0066ff"
                    strokeWidth={2}
                    className="pointer-events-auto cursor-move"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setGradientEditState({
                        isDragging: true,
                        handleType: 'center',
                        elementId: selectedElement.id,
                        startX: e.clientX,
                        startY: e.clientY,
                        initialGradient: { ...gradient }
                      });
                    }}
                  />
                  <circle
                    cx={centerX + radius}
                    cy={centerY}
                    r={5}
                    fill="#0066ff"
                    stroke="white"
                    strokeWidth={2}
                    className="pointer-events-auto cursor-ew-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setGradientEditState({
                        isDragging: true,
                        handleType: 'radius',
                        elementId: selectedElement.id,
                        startX: e.clientX,
                        startY: e.clientY,
                        initialGradient: { ...gradient }
                      });
                    }}
                  />
                </svg>
              );
            }

            return null;
          })()}
        </div>
      </div>
    </div>
  );
};