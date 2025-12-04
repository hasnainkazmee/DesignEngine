

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CheckCircle2, 
  Eye,
  EyeOff,
} from 'lucide-react';
import { Canvas } from './components/Canvas';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ValidationPanel } from './components/ValidationPanel';
import { ExportModal } from './components/ExportModal';
import { DesignSystemModal } from './components/DesignSystemModal';
import { PluginModal } from './components/PluginModal';
import { SidePanels } from './components/SidePanels';
import { Dashboard } from './components/Dashboard';
import { 
  GridConfig, 
  DesignElement, 
  ToolType, 
  ValidationIssue, 
  MOCK_PROJECT, 
  ComponentItem, 
  DEFAULT_SYSTEM, 
  DesignSystem,
  DesignIntention,
  DesignVitalSigns,
  Project,
  PluginAPI,
  PluginContext
} from './types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Utility for color distance
const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
};

const getColorDistance = (color1: string, color2: string) => {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    return Math.sqrt(
        Math.pow(c2.r - c1.r, 2) +
        Math.pow(c2.g - c1.g, 2) +
        Math.pow(c2.b - c1.b, 2)
    );
};

export default function App() {
  // --- Global App State ---
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard');
  const [projects, setProjects] = useState<Project[]>(() => {
      const saved = localStorage.getItem('de_projects');
      return saved ? JSON.parse(saved) : [];
  });
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // --- Editor State ---
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [lastActiveTool, setLastActiveTool] = useState<ToolType>('select');
  const [activeSidePanel, setActiveSidePanel] = useState<'layers' | 'colors' | 'library' | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  
  // Canvas State
  const [canvasPan, setCanvasPan] = useState({ x: 50, y: 50 });
  const [canvasZoom, setCanvasZoom] = useState(1);

  // Design Data
  const [gridConfig, setGridConfig] = useState<GridConfig>({
      columns: 12, gutter: 24, margin: 48, baseline: 18, visible: true, width: 800, height: 600
  });
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [components, setComponents] = useState<ComponentItem[]>(() => {
      const saved = localStorage.getItem('de_components');
      return saved ? JSON.parse(saved) : [];
  });
  const [designSystem, setDesignSystem] = useState<DesignSystem>(DEFAULT_SYSTEM);
  const [designIntention, setDesignIntention] = useState<DesignIntention>('Corporate');
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Validation Outputs
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [vitalSigns, setVitalSigns] = useState<DesignVitalSigns>({
      heartbeat: 100, breathing: 80, temperature: 'Neutral', integrity: 100, intentionMatch: 100
  });

  const [showExport, setShowExport] = useState(false);
  const [showDesignSystem, setShowDesignSystem] = useState(false);
  const [showPlugins, setShowPlugins] = useState(false);

  // Image Upload Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImagePos, setPendingImagePos] = useState<{x: number, y: number} | null>(null);

  // --- Persistence & Routing Logic ---

  // Save projects whenever the list updates
  useEffect(() => {
      localStorage.setItem('de_projects', JSON.stringify(projects));
  }, [projects]);

  // Save components (Global)
  useEffect(() => {
      localStorage.setItem('de_components', JSON.stringify(components));
  }, [components]);

  // Auto-save active project state to the projects array
  useEffect(() => {
      if (currentView === 'editor' && activeProjectId) {
          const timeout = setTimeout(() => {
              setProjects(prev => prev.map(p => {
                  if (p.id === activeProjectId) {
                      return {
                          ...p,
                          lastModified: Date.now(),
                          elements,
                          gridConfig,
                          designSystem,
                          vitalSigns,
                          intention: designIntention
                      };
                  }
                  return p;
              }));
          }, 1000); // Debounce auto-save
          return () => clearTimeout(timeout);
      }
  }, [elements, gridConfig, designSystem, vitalSigns, designIntention, activeProjectId, currentView]);

  const handleCreateProject = (name: string, width: number, height: number) => {
      const newProject: Project = {
          id: `proj-${Date.now()}`,
          name,
          lastModified: Date.now(),
          gridConfig: {
              columns: 12,
              gutter: 24,
              margin: 48,
              baseline: 18,
              visible: true,
              width,
              height
          },
          elements: [],
          designSystem: DEFAULT_SYSTEM,
          vitalSigns: { heartbeat: 100, breathing: 100, temperature: 'Neutral', integrity: 100, intentionMatch: 100 },
          intention: 'Corporate'
      };

      setProjects(prev => [newProject, ...prev]);
      setActiveProjectId(newProject.id);
      
      // Load into Editor State
      setGridConfig(newProject.gridConfig);
      setElements(newProject.elements);
      setDesignSystem(newProject.designSystem);
      setDesignIntention(newProject.intention);
      setVitalSigns(newProject.vitalSigns);
      setCanvasZoom(0.8);
      setCanvasPan({ x: 50, y: 50 });

      setCurrentView('editor');
  };

  const handleSelectProject = (id: string) => {
      const project = projects.find(p => p.id === id);
      if (!project) return;

      setActiveProjectId(id);
      setGridConfig(project.gridConfig);
      setElements(project.elements);
      setDesignSystem(project.designSystem);
      setDesignIntention(project.intention);
      setVitalSigns(project.vitalSigns);
      
      // Reset view params
      setCanvasZoom(0.8);
      setCanvasPan({ x: 50, y: 50 });
      
      setCurrentView('editor');
  };

  const handleDeleteProject = (id: string) => {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (activeProjectId === id) setActiveProjectId(null);
  };

  const handleBackToDashboard = () => {
      // Force save before exit
      if (activeProjectId) {
          setProjects(prev => prev.map(p => {
              if (p.id === activeProjectId) {
                  return {
                      ...p,
                      lastModified: Date.now(),
                      elements,
                      gridConfig,
                      designSystem,
                      vitalSigns,
                      intention: designIntention
                  };
              }
              return p;
          }));
      }
      setCurrentView('dashboard');
      setActiveProjectId(null);
  };

  // --- Helpers ---
  
  const snapToGrid = useCallback((val: number, type: 'x' | 'y', closest = true) => {
    if (type === 'y') {
      const remainder = val % gridConfig.baseline;
      if (remainder < 5 || remainder > gridConfig.baseline - 5) {
        return Math.round(val / gridConfig.baseline) * gridConfig.baseline;
      }
    }
    
    if (type === 'x') {
      const colWidth = (gridConfig.width - (gridConfig.margin * 2) - ((gridConfig.columns - 1) * gridConfig.gutter)) / gridConfig.columns;
      if (Math.abs(val - gridConfig.margin) < 10) return gridConfig.margin;
      if (Math.abs(val - (gridConfig.width - gridConfig.margin)) < 10) return gridConfig.width - gridConfig.margin;

      for (let i = 0; i <= gridConfig.columns; i++) {
         const colStart = gridConfig.margin + (i * (colWidth + gridConfig.gutter));
         const colEnd = colStart + colWidth;
         
         if (Math.abs(val - colStart) < 8) return colStart;
         if (Math.abs(val - colEnd) < 8) return colEnd;
      }
    }
    return val;
  }, [gridConfig]);

  // --- PLUGIN ENGINE ---

  const handleRunPlugin = (code: string) => {
      try {
          const api: PluginAPI = {
              create: (el) => {
                  const newEl = {
                      id: `plug-${Date.now()}-${Math.random()}`,
                      constraints: ['grid-snap'],
                      style: { backgroundColor: '#888' },
                      ...el
                  } as DesignElement;
                  setElements(prev => [...prev, newEl]);
              },
              update: (id, updates) => {
                  setElements(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
              },
              delete: (id) => {
                  setElements(prev => prev.filter(e => e.id !== id));
              },
              notify: (msg) => {
                  alert(`Plugin: ${msg}`);
              },
              selectAll: () => {
                  setSelectedIds(elements.map(e => e.id));
              },
              deselectAll: () => {
                  setSelectedIds([]);
              },
              getSelection: () => {
                  return elements.filter(e => selectedIds.includes(e.id));
              }
          };

          const context: PluginContext = {
              elements,
              grid: gridConfig,
              selection: selectedIds,
              system: designSystem
          };

          // Safe-ish execution
          // eslint-disable-next-line no-new-func
          const pluginFn = new Function('kazm', 'context', code);
          pluginFn(api, context);

      } catch (err) {
          alert(`Plugin Execution Error: ${err}`);
      }
  };

  // --- GROUPING & CLIPPING LOGIC ---

  const handleGroup = () => {
      if (selectedIds.length < 1) return; // Can group single item to wrap it
      
      const selectedEls = elements.filter(e => selectedIds.includes(e.id));
      const minX = Math.min(...selectedEls.map(e => e.x));
      const minY = Math.min(...selectedEls.map(e => e.y));
      const maxX = Math.max(...selectedEls.map(e => e.x + e.width));
      const maxY = Math.max(...selectedEls.map(e => e.y + e.height));
      
      const groupId = `group-${Date.now()}`;
      const groupElement: DesignElement = {
          id: groupId,
          type: 'group',
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
          constraints: [],
          style: { backgroundColor: 'transparent' }
      };

      setElements(prev => {
          // Reparent children to new group
          const updated = prev.map(el => {
              if (selectedIds.includes(el.id)) {
                  return { ...el, parentId: groupId };
              }
              return el;
          });
          return [...updated, groupElement];
      });

      setSelectedIds([groupId]);
  };

  const handleUngroup = () => {
      const groupIds = selectedIds.filter(id => elements.find(e => e.id === id)?.type === 'group');
      if (groupIds.length === 0) return;

      setElements(prev => {
          // Find all children of these groups and remove their parentId
          const updated = prev.map(el => {
              if (el.parentId && groupIds.includes(el.parentId)) {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { parentId, ...rest } = el;
                  return rest as DesignElement;
              }
              return el;
          });
          // Remove the group elements themselves
          return updated.filter(el => !groupIds.includes(el.id));
      });
      
      // Select the children that were released
      const childrenIds = elements.filter(e => e.parentId && groupIds.includes(e.parentId)).map(e => e.id);
      setSelectedIds(childrenIds);
  };

  const handleMask = () => {
      if (selectedIds.length < 2) return;

      // Sort selected elements by visual order (Z-index logic via array index)
      const selectedIndices = selectedIds.map(id => elements.findIndex(e => e.id === id)).sort((a, b) => a - b);
      
      // The bottom-most element becomes the mask container
      const maskIndex = selectedIndices[0]; 
      const contentIndices = selectedIndices.slice(1);

      const maskElement = elements[maskIndex];
      const contentIds = contentIndices.map(i => elements[i].id);

      setElements(prev => {
          return prev.map(el => {
              // Enable clipping on the mask parent
              if (el.id === maskElement.id) {
                  return { ...el, clip: true };
              }
              // Move content inside the mask parent
              if (contentIds.includes(el.id)) {
                  return { ...el, parentId: maskElement.id };
              }
              return el;
          });
      });
      setSelectedIds([maskElement.id]);
  };

  const handleUnmask = () => {
      const maskIds = selectedIds.filter(id => {
          const el = elements.find(e => e.id === id);
          return el && (el.clip || elements.some(child => child.parentId === el.id));
      });

      if (maskIds.length === 0) return;

      setElements(prev => {
          return prev.map(el => {
              // Disable clipping on mask
              if (maskIds.includes(el.id)) {
                  return { ...el, clip: false };
              }
              // Release children
              if (el.parentId && maskIds.includes(el.parentId)) {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { parentId, ...rest } = el;
                  return rest as DesignElement;
              }
              return el;
          });
      });
  };

  const handleReorder = (id: string, action: 'front' | 'back' | 'forward' | 'backward') => {
      setElements(prev => {
          const index = prev.findIndex(e => e.id === id);
          if (index === -1) return prev;

          // Hierarchy-aware reordering
          // 1. Identify context: Root or a specific Parent Group
          const targetEl = prev[index];
          const parentId = targetEl.parentId;

          // 2. Extract all siblings in this context
          const siblings = prev.filter(e => e.parentId === parentId);
          const siblingIndices = siblings.map(s => prev.findIndex(p => p.id === s.id)).sort((a, b) => a - b);
          
          // 3. Find index of target *within siblings array*
          const localIndex = siblings.findIndex(s => s.id === id);
          if (localIndex === -1) return prev;

          // 4. Modify local order
          const newSiblings = [...siblings];
          const el = newSiblings[localIndex];
          newSiblings.splice(localIndex, 1);

          if (action === 'back') {
              newSiblings.unshift(el);
          } else if (action === 'front') {
              newSiblings.push(el);
          } else if (action === 'backward') {
              const newLocalIndex = Math.max(0, localIndex - 1);
              newSiblings.splice(newLocalIndex, 0, el);
          } else if (action === 'forward') {
              const newLocalIndex = Math.min(newSiblings.length, localIndex + 1);
              newSiblings.splice(newLocalIndex, 0, el);
          }

          // 5. Reconstruct global array
          // We map over the global array. If an element is part of this sibling group,
          // we pull from the newSiblings queue.
          const newGlobal = [...prev];
          let siblingCursor = 0;
          
          // We can't just map because we might have shifted positions relative to non-siblings 
          // (though z-index usually implies stack order). 
          // The safest way for "array index = z-index" logic:
          // Place the newSiblings back into the slots occupied by the old siblings.
          
          siblingIndices.forEach((globalIdx, i) => {
              newGlobal[globalIdx] = newSiblings[i];
          });

          return newGlobal;
      });
  };

  // --- IMAGE UPLOAD LOGIC ---
  
  const processImageFile = (file: File, x: number, y: number) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const src = e.target?.result as string;
        
        // Load image to get natural dimensions
        const img = new Image();
        img.onload = () => {
            let w = img.naturalWidth;
            let h = img.naturalHeight;
            const MAX_SIZE = 600;
            
            if (w > MAX_SIZE || h > MAX_SIZE) {
                const ratio = w / h;
                if (w > h) {
                    w = MAX_SIZE;
                    h = MAX_SIZE / ratio;
                } else {
                    h = MAX_SIZE;
                    w = MAX_SIZE * ratio;
                }
            }
            
            const newId = `img-${Date.now()}`;
            const newEl: DesignElement = {
                id: newId,
                type: 'image',
                role: 'decoration',
                x: snapToGrid(x, 'x'),
                y: snapToGrid(y, 'y'),
                width: w,
                height: h,
                src: src,
                constraints: ['grid-snap'],
                style: { backgroundColor: 'transparent' }
            };
            
            setElements(prev => [...prev, newEl]);
            setSelectedIds([newId]);
            setActiveTool('select');
        };
        img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const x = pendingImagePos?.x || gridConfig.width / 2 - 100;
          const y = pendingImagePos?.y || gridConfig.height / 2 - 100;
          processImageFile(file, x, y);
      }
      setPendingImagePos(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageDrop = (file: File, x: number, y: number) => {
      processImageFile(file, x, y);
  };


  // --- ORACLE VALIDATION ---
  
  useEffect(() => {
    if (currentView !== 'editor') return;

    const runValidationOracle = () => {
        const newIssues: ValidationIssue[] = [];
        let scoreHeartbeat = 100;
        let scoreBreathing = 0;
        let scoreIntegrity = 100;
        let scoreIntention = 100; 

        const totalArea = gridConfig.width * gridConfig.height;
        let filledArea = 0;

        const systemColors = designSystem.colors.map(c => c.value.toLowerCase());
        const systemSizes = designSystem.typography.map(t => t.size);

        elements.forEach(el => {
            if (el.type === 'group') return; 

            filledArea += el.width * el.height;
            const elColor = el.style?.backgroundColor || el.style?.color;
            if (elColor && typeof elColor === 'string' && !elColor.startsWith('url') && !systemColors.includes(elColor.toLowerCase())) {
                 if (elColor !== 'transparent') {
                    scoreIntegrity -= 2;
                 }
            }

            if (el.type === 'text' && el.style?.fontSize) {
                if (!systemSizes.includes(el.style.fontSize)) {
                    scoreIntegrity -= 5;
                }
            }

            if (el.constraints.includes('baseline-snap')) {
                if (Math.abs(el.y % gridConfig.baseline) > 1) {
                    scoreHeartbeat -= 5;
                }
            }
        });

        const whitespaceRatio = (totalArea - filledArea) / totalArea;
        scoreBreathing = Math.round(whitespaceRatio * 100);
        
        setIssues(newIssues);
        setVitalSigns({
            heartbeat: Math.max(0, scoreHeartbeat),
            breathing: scoreBreathing,
            temperature: 'Neutral',
            integrity: Math.max(0, scoreIntegrity),
            intentionMatch: Math.max(0, scoreIntention)
        });
    };

    runValidationOracle();
  }, [elements, gridConfig, designIntention, designSystem, currentView]);

  // --- ELEMENT UPDATES & HIERARCHY ---

  const handleElementUpdate = (id: string, updates: Partial<DesignElement>) => {
    setElements(prev => {
        const target = prev.find(e => e.id === id);
        if (!target) return prev;

        // Cascade parent updates to children
        if (target.type === 'group' && (updates.x !== undefined || updates.y !== undefined || updates.width !== undefined || updates.height !== undefined)) {
            const dx = updates.x !== undefined ? updates.x - target.x : 0;
            const dy = updates.y !== undefined ? updates.y - target.y : 0;
            const scaleX = updates.width !== undefined ? updates.width / target.width : 1;
            const scaleY = updates.height !== undefined ? updates.height / target.height : 1;

            return prev.map(el => {
                if (el.id === id) return { ...el, ...updates };
                
                if (el.parentId === id) {
                     // Relative positioning logic (Since state is global, we manually update children)
                     const relX = el.x - target.x;
                     const relY = el.y - target.y;
                     
                     let newX = updates.x !== undefined ? updates.x + (relX * scaleX) : el.x + dx;
                     let newY = updates.y !== undefined ? updates.y + (relY * scaleY) : el.y + dy;
                     let newW = el.width * scaleX;
                     let newH = el.height * scaleY;
                     
                     return { ...el, x: newX, y: newY, width: newW, height: newH };
                }
                return el;
            });
        }
        return prev.map(el => el.id === id ? { ...el, ...updates } : el);
    });
  };

  const handleCanvasAdd = (x: number, y: number, customWidth?: number, customHeight?: number) => {
     if (activeTool === 'select' || activeTool === 'hand') {
       if (activeTool !== 'hand') {
            setSelectedIds([]);
            setEditingTextId(null);
       }
       return;
     }

     if (['brush', 'lasso', 'wand', 'crop', 'clone', 'gradient'].includes(activeTool)) {
         return;
     }

     if (activeTool === 'image') {
         setPendingImagePos({ x, y });
         fileInputRef.current?.click();
         return;
     }

     const newId = `${activeTool}-${Date.now()}`;
     const defaultSize = activeTool === 'type' ? { w: 300, h: 50 } : { w: 100, h: 100 };
     
     // Use custom size if provided, otherwise default
     const finalW = customWidth || defaultSize.w;
     const finalH = customHeight || defaultSize.h;
     
     const snappedX = snapToGrid(x, 'x');
     const snappedY = snapToGrid(y, 'y');

     let role: DesignElement['role'] = 'decoration';
     if (activeTool === 'type') role = 'body';
     if (activeTool === 'type' && finalH > 40) role = 'headline';

     const newEl: DesignElement = {
       id: newId,
       type: activeTool === 'type' ? 'text' : 'box',
       shapeType: activeTool === 'shape' ? 'rectangle' : undefined,
       role,
       x: snappedX,
       y: snappedY,
       width: finalW,
       height: finalH,
       content: activeTool === 'type' ? 'Type something...' : undefined,
       constraints: ['grid-snap', 'baseline-snap'],
       style: activeTool === 'type' 
        ? { color: '#ffffff', fontSize: 24, fontFamily: 'Inter', fontWeight: '400', lineHeight: 1.2 }
        : { backgroundColor: '#2A4B8D' }
     };

     setElements(prev => [...prev, newEl]);
     setSelectedIds([newId]);
     if (activeTool === 'type') setTimeout(() => setEditingTextId(newId), 50);
     setActiveTool('select');
  };

  const addComponentToCanvas = (component: ComponentItem, dropX?: number, dropY?: number) => {
      const newId = `inst-${Date.now()}`;
      const xPos = dropX !== undefined ? snapToGrid(dropX, 'x') : gridConfig.margin;
      const yPos = dropY !== undefined ? snapToGrid(dropY, 'y') : gridConfig.margin;

      const newEl: DesignElement = {
          ...component.element,
          id: newId,
          x: xPos,
          y: yPos,
      };
      setElements(prev => [...prev, newEl]);
      setSelectedIds([newId]);
  };

  const createComponentFromSelection = () => {
    if (selectedIds.length !== 1) return;
    const el = elements.find(e => e.id === selectedIds[0]);
    if (!el) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, x, y, ...rest } = el;
    const newComp: ComponentItem = {
      id: `comp-${Date.now()}`,
      name: `Component ${components.length + 1}`,
      element: rest
    };
    setComponents(prev => [...prev, newComp]);
    setActiveSidePanel('library');
  };

  const handleZoom = (direction: 'in' | 'out') => {
      setCanvasZoom(prev => {
          const newZoom = direction === 'in' ? prev + 0.1 : prev - 0.1;
          return Math.max(0.1, Math.min(3, newZoom));
      });
  };

  // Keyboard Shortcuts
  useEffect(() => {
    if (currentView !== 'editor') return;

    const handleKeyDown = (e: KeyboardEvent) => {
        if (editingTextId) return;
        
        // Grouping & Masking
        if (e.metaKey || e.ctrlKey) {
            if (e.key.toLowerCase() === 'g') {
                e.preventDefault();
                if (e.shiftKey) handleUngroup();
                else handleGroup();
                return;
            }
            // Masking Shortcut (Cmd+Shift+M)
            if (e.shiftKey && e.key.toLowerCase() === 'm') {
                e.preventDefault();
                handleMask();
                return;
            }
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedIds.length > 0) {
                const idsToDelete = [...selectedIds];
                elements.forEach(el => {
                    if (el.parentId && idsToDelete.includes(el.parentId)) {
                        idsToDelete.push(el.id);
                    }
                });
                setElements(prev => prev.filter(el => !idsToDelete.includes(el.id)));
                setSelectedIds([]);
            }
        }
        if (e.key === 'v') setActiveTool('select');
        if (e.key === 't') setActiveTool('type');
        if (e.key === 'r') setActiveTool('shape');
        if (e.key === 'h') setActiveTool('hand');
        if (e.key === 'm') setActiveTool('image');
        if (e.code === 'Space' && activeTool !== 'hand') {
            e.preventDefault();
            setLastActiveTool(activeTool);
            setActiveTool('hand');
        }
        
        // Layer Reordering Shortcuts
        if ((e.metaKey || e.ctrlKey) && e.key === '[') {
            e.preventDefault();
            if (selectedIds.length > 0) handleReorder(selectedIds[0], e.shiftKey ? 'back' : 'backward');
        }
        if ((e.metaKey || e.ctrlKey) && e.key === ']') {
            e.preventDefault();
            if (selectedIds.length > 0) handleReorder(selectedIds[0], e.shiftKey ? 'front' : 'forward');
        }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space' && activeTool === 'hand') {
            setActiveTool(lastActiveTool);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedIds, editingTextId, activeTool, lastActiveTool, currentView, elements]);

  const generateVariation = () => {
      // Mock Variation
  };

  // --- RENDER ---
  
  if (currentView === 'dashboard') {
      return (
          <Dashboard 
             projects={projects}
             components={components}
             onCreateProject={handleCreateProject}
             onSelectProject={handleSelectProject}
             onDeleteProject={handleDeleteProject}
          />
      );
  }

  const activeProject = projects.find(p => p.id === activeProjectId) || MOCK_PROJECT as any;
  const selectedElements = elements.filter(e => selectedIds.includes(e.id));

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-300 overflow-hidden font-sans selection:bg-blue-500/30">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />
      
      <Toolbar 
        project={{ ...activeProject, dimensions: `${gridConfig.width}x${gridConfig.height}`, status: 'Active' }}
        onOpenExport={() => setShowExport(true)}
        onOpenDesignSystem={() => setShowDesignSystem(true)}
        onOpenPlugins={() => setShowPlugins(true)}
        issueCount={issues.length}
        zoom={canvasZoom}
        onZoom={handleZoom}
        onBack={handleBackToDashboard}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          activeTool={activeTool} 
          setActiveTool={setActiveTool} 
          activePanel={activeSidePanel}
          setActivePanel={setActiveSidePanel}
          onGenerateVariation={generateVariation}
        />

        {activeSidePanel && (
           <SidePanels 
             activePanel={activeSidePanel}
             onClose={() => setActiveSidePanel(null)}
             elements={elements}
             selectedId={selectedIds[0] || null}
             onSelect={(id) => setSelectedIds([id])}
             components={components}
             onAddComponent={addComponentToCanvas}
             system={designSystem}
           />
        )}

        <div className="flex-1 relative bg-zinc-900/50 overflow-hidden flex flex-col z-0">
           <div className="flex-1 relative overflow-hidden bg-zinc-900 cursor-default">
              <Canvas 
                elements={elements}
                gridConfig={gridConfig}
                selectedIds={selectedIds}
                onSelect={(ids) => setSelectedIds(ids)}
                onUpdate={handleElementUpdate}
                activeTool={activeTool}
                onCanvasClick={handleCanvasAdd}
                snapToGrid={snapToGrid}
                editingId={editingTextId}
                setEditingId={setEditingTextId}
                onComponentDrop={addComponentToCanvas}
                onImageDrop={handleImageDrop}
                pan={canvasPan}
                onPanChange={setCanvasPan}
                zoom={canvasZoom}
              />
           </div>
           
           <div className="h-8 bg-zinc-950 border-t border-zinc-800 flex items-center px-4 text-[10px] font-mono text-zinc-500 justify-between shrink-0 z-20">
              <div className="flex gap-4 items-center">
                <span>ZOOM: {Math.round(canvasZoom * 100)}%</span>
                <span>W: {gridConfig.width} H: {gridConfig.height}</span>
                <span>INTENTION: {designIntention.toUpperCase()}</span>
                {selectedIds.length > 1 && <span className="text-blue-400">{selectedIds.length} ITEMS SELECTED</span>}
              </div>
              <div className="flex gap-4 items-center">
                 <button 
                  onClick={() => setGridConfig(prev => ({ ...prev, visible: !prev.visible }))}
                  className="hover:text-zinc-300 flex items-center gap-1"
                >
                  {gridConfig.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                  GRID
                </button>
                <span className="flex items-center gap-1 text-emerald-500">
                  <CheckCircle2 size={10} /> ORACLE ACTIVE
                </span>
              </div>
           </div>
        </div>

        <div className="w-80 bg-zinc-950 border-l border-zinc-800 flex flex-col shrink-0 z-20">
          <div className="flex-1 min-h-0 overflow-hidden">
            <PropertiesPanel 
              elements={selectedElements} 
              onUpdate={(updates) => selectedIds.forEach(id => handleElementUpdate(id, updates))}
              onCreateComponent={createComponentFromSelection}
              onGroup={handleGroup}
              onUngroup={handleUngroup}
              onMask={handleMask}
              onUnmask={handleUnmask}
              onReorder={handleReorder}
              system={designSystem}
            />
          </div>
          
          <div className="shrink-0">
            <ValidationPanel 
              issues={issues} 
              vitalSigns={vitalSigns}
              intention={designIntention}
              onSetIntention={setDesignIntention}
              onFix={() => {}} 
              projectName={activeProject.name}
            />
          </div>
        </div>
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      {showDesignSystem && (
        <DesignSystemModal 
           config={gridConfig} 
           system={designSystem}
           onUpdateConfig={setGridConfig}
           onUpdateSystem={setDesignSystem}
           onClose={() => setShowDesignSystem(false)} 
        />
      )}
      {showPlugins && (
        <PluginModal 
            onClose={() => setShowPlugins(false)}
            onRun={handleRunPlugin}
        />
      )}
    </div>
  );
}
