import { useState, useEffect, useCallback } from 'react';
import {
  GridConfig,
  DesignElement,
  ToolType,
  ValidationIssue,
  ComponentItem,
  DEFAULT_SYSTEM,
  DesignSystem,
  DesignIntention,
  DesignVitalSigns
} from '../types';

// Utility for color distance
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    }
    : { r: 0, g: 0, b: 0 };
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

export const useDesignEngine = () => {
  // --- State ---
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [lastActiveTool, setLastActiveTool] = useState<ToolType>('select'); // For spacebar panning
  const [activeSidePanel, setActiveSidePanel] = useState<'layers' | 'colors' | 'library' | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Canvas State
  const [canvasPan, setCanvasPan] = useState({ x: 50, y: 50 }); // Initial margin
  const [canvasZoom, setCanvasZoom] = useState(1);

  // Validation State
  const [designIntention, setDesignIntention] = useState<DesignIntention>('Corporate');

  const [gridConfig, setGridConfig] = useState<GridConfig>(() => {
    try {
      const saved = localStorage.getItem('de_gridConfig');
      return saved
        ? JSON.parse(saved)
        : {
          columns: 12,
          gutter: 24,
          margin: 48,
          baseline: 18,
          visible: true,
          width: 595, // A4ish scaled
          height: 842
        };
    } catch {
      return {
        columns: 12,
        gutter: 24,
        margin: 48,
        baseline: 18,
        visible: true,
        width: 595,
        height: 842
      };
    }
  });

  const [elements, setElements] = useState<DesignElement[]>(() => {
    try {
      const saved = localStorage.getItem('de_elements');
      return saved
        ? JSON.parse(saved)
        : [
          {
            id: 'logo-mark',
            type: 'box',
            role: 'logo',
            shapeType: 'rectangle',
            x: 48,
            y: 48,
            width: 100,
            height: 100,
            constraints: ['margin-bound', 'aspect-ratio', 'grid-snap'],
            style: { backgroundColor: '#2A4B8D', opacity: 1, borderRadius: 0 }
          },
          {
            id: 'headline-1',
            type: 'text',
            role: 'headline',
            x: 48,
            y: 198, // Snapped to baseline 18*11
            width: 500,
            height: 100,
            content: 'SPRING BLENDS ARRIVE',
            constraints: ['grid-snap', 'baseline-snap'],
            style: {
              color: '#ffffff',
              fontSize: 64,
              fontFamily: 'Inter',
              fontWeight: '700',
              lineHeight: 1.1
            }
          }
        ];
    } catch {
      return [
        {
          id: 'logo-mark',
          type: 'box',
          role: 'logo',
          shapeType: 'rectangle',
          x: 48,
          y: 48,
          width: 100,
          height: 100,
          constraints: ['margin-bound', 'aspect-ratio', 'grid-snap'],
          style: { backgroundColor: '#2A4B8D', opacity: 1, borderRadius: 0 }
        },
        {
          id: 'headline-1',
          type: 'text',
          role: 'headline',
          x: 48,
          y: 198,
          width: 500,
          height: 100,
          content: 'SPRING BLENDS ARRIVE',
          constraints: ['grid-snap', 'baseline-snap'],
          style: {
            color: '#ffffff',
            fontSize: 64,
            fontFamily: 'Inter',
            fontWeight: '700',
            lineHeight: 1.1
          }
        }
      ];
    }
  });

  const [components, setComponents] = useState<ComponentItem[]>(() => {
    try {
      const saved = localStorage.getItem('de_components');
      return saved
        ? JSON.parse(saved)
        : [
          {
            id: 'comp-1',
            name: 'Call to Action',
            element: {
              type: 'box',
              shapeType: 'rectangle',
              width: 200,
              height: 60,
              style: { backgroundColor: '#FF6B35', borderRadius: 30 },
              constraints: []
            }
          }
        ];
    } catch {
      return [
        {
          id: 'comp-1',
          name: 'Call to Action',
          element: {
            type: 'box',
            shapeType: 'rectangle',
            width: 200,
            height: 60,
            style: { backgroundColor: '#FF6B35', borderRadius: 30 },
            constraints: []
          }
        }
      ];
    }
  });

  const [designSystem, setDesignSystem] = useState<DesignSystem>(() => {
    try {
      const saved = localStorage.getItem('de_designSystem');
      return saved ? JSON.parse(saved) : DEFAULT_SYSTEM;
    } catch {
      return DEFAULT_SYSTEM;
    }
  });

  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);

  // Validation Outputs
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [vitalSigns, setVitalSigns] = useState<DesignVitalSigns>({
    heartbeat: 100,
    breathing: 80,
    temperature: 'Neutral',
    integrity: 100,
    intentionMatch: 100
  });

  const [showExport, setShowExport] = useState(false);
  const [showDesignSystem, setShowDesignSystem] = useState(false);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('de_gridConfig', JSON.stringify(gridConfig));
  }, [gridConfig]);
  useEffect(() => {
    localStorage.setItem('de_elements', JSON.stringify(elements));
  }, [elements]);
  useEffect(() => {
    localStorage.setItem('de_components', JSON.stringify(components));
  }, [components]);
  useEffect(() => {
    localStorage.setItem('de_designSystem', JSON.stringify(designSystem));
  }, [designSystem]);

  // --- Helpers ---

  const snapToGrid = useCallback(
    (val: number, type: 'x' | 'y', closest = true) => {
      // Only apply if we want strict snapping, otherwise we use this for calculation
      if (type === 'y') {
        const remainder = val % gridConfig.baseline;
        if (remainder < 5 || remainder > gridConfig.baseline - 5) {
          return Math.round(val / gridConfig.baseline) * gridConfig.baseline;
        }
      }

      if (type === 'x') {
        // Calculate column lines
        const colWidth =
          (gridConfig.width -
            gridConfig.margin * 2 -
            (gridConfig.columns - 1) * gridConfig.gutter) /
          gridConfig.columns;

        // Check margins
        if (Math.abs(val - gridConfig.margin) < 10) return gridConfig.margin;
        if (
          Math.abs(val - (gridConfig.width - gridConfig.margin)) < 10
        )
          return gridConfig.width - gridConfig.margin;

        // Check column starts/ends
        for (let i = 0; i <= gridConfig.columns; i++) {
          const colStart =
            gridConfig.margin + i * (colWidth + gridConfig.gutter);
          const colEnd = colStart + colWidth;

          if (Math.abs(val - colStart) < 8) return colStart;
          if (Math.abs(val - colEnd) < 8) return colEnd;
        }
      }
      return val;
    },
    [gridConfig]
  );

  // --- THE ORACLE: Validation Logic ---

  useEffect(() => {
    const runValidationOracle = () => {
      const newIssues: ValidationIssue[] = [];
      let scoreHeartbeat = 100; // Grid
      let scoreBreathing = 0; // Whitespace
      let scoreIntegrity = 100; // System Adherence
      let scoreIntention = 100;

      const totalArea = gridConfig.width * gridConfig.height;
      let filledArea = 0;

      // SYSTEM CHECK LISTS
      const systemColors = designSystem.colors.map((c) =>
        c.value.toLowerCase()
      );
      const systemSizes = designSystem.typography.map((t) => t.size);
      const systemFonts = new Set(designSystem.typography.map((t) => t.family));

      elements.forEach((el) => {
        filledArea += el.width * el.height;

        // 1. SYSTEM INTEGRITY CHECKS

        // Color Check
        const elColor = el.style?.backgroundColor || el.style?.color;
        if (elColor && !systemColors.includes(elColor.toLowerCase())) {
          scoreIntegrity -= 5;
          // Find nearest color
          let minDist = Infinity;
          let nearestColor = null;
          systemColors.forEach((sc) => {
            const dist = getColorDistance(elColor, sc);
            if (dist < minDist) {
              minDist = dist;
              nearestColor = sc;
            }
          });

          // Only warn if it's somewhat close but wrong (off-brand), allows for explicit deviations if very different
          if (minDist < 100) {
            newIssues.push({
              id: `sys-col-${el.id}`,
              severity: 'warning',
              category: 'Color',
              message: `Color ${elColor} is not in design system.`,
              elementId: el.id,
              autoFixAvailable: true,
              fixAction: 'snap-color',
              fixValue: nearestColor
            });
          }
        }

        // Typography Check
        if (el.type === 'text' && el.style?.fontSize) {
          if (!systemSizes.includes(el.style.fontSize)) {
            scoreIntegrity -= 5;
            // Find nearest size
            const nearestSize = systemSizes.reduce((prev, curr) =>
              Math.abs(curr - el.style!.fontSize!) <
                Math.abs(prev - el.style!.fontSize!)
                ? curr
                : prev
            );

            newIssues.push({
              id: `sys-type-${el.id}`,
              severity: 'info',
              category: 'Typography',
              message: `Font size ${el.style.fontSize}px is not in typographic scale.`,
              elementId: el.id,
              autoFixAvailable: true,
              fixAction: 'snap-type',
              fixValue: nearestSize
            });
          }
        }

        // 2. HEARTBEAT (GRID) CHECKS
        if (el.constraints.includes('baseline-snap')) {
          if (Math.abs(el.y % gridConfig.baseline) > 1) {
            scoreHeartbeat -= 5;
            newIssues.push({
              id: `base-${el.id}`,
              severity: 'info',
              category: 'Layout',
              message: 'Element off baseline grid.',
              elementId: el.id,
              autoFixAvailable: true,
              fixAction: 'snap-grid'
            });
          }
        }

        // 3. LEGIBILITY
        if (el.type === 'text' && el.style?.fontSize && el.style.fontSize < 9) {
          newIssues.push({
            id: `legibility-${el.id}`,
            severity: 'error',
            category: 'Typography',
            message: 'Text size below minimum legibility (9pt)',
            elementId: el.id,
            autoFixAvailable: true,
            fixAction: 'snap-type',
            fixValue: 12
          });
        }
      });

      // Calculate Scores
      const whitespaceRatio = (totalArea - filledArea) / totalArea;
      scoreBreathing = Math.round(whitespaceRatio * 100);
      scoreHeartbeat = Math.max(0, scoreHeartbeat);
      scoreIntegrity = Math.max(0, scoreIntegrity);

      // 4. INTENTION ANALYSIS (The Soul)
      const uniqueFonts = new Set(
        elements.filter((e) => e.type === 'text').map((e) => e.style?.fontFamily)
      );

      if (designIntention === 'Luxury') {
        if (scoreBreathing < 60) {
          scoreIntention -= 20;
          newIssues.push({
            id: 'lux-space',
            severity: 'warning',
            category: 'Soul',
            message: 'Luxury requires breathing room. Increase whitespace to >60%.'
          });
        }
        // Check for serif usage
        const hasSerif = Array.from(uniqueFonts).some(
          (f) =>
            f?.toLowerCase().includes('serif') &&
            !f?.toLowerCase().includes('sans')
        );
        if (!hasSerif && elements.some((e) => e.type === 'text')) {
          newIssues.push({
            id: 'lux-font',
            severity: 'info',
            category: 'Soul',
            message: 'Consider a serif typeface for elegance.'
          });
        }
      } else if (designIntention === 'Punk') {
        if (scoreHeartbeat > 90) {
          scoreIntention -= 30;
          newIssues.push({
            id: 'punk-grid',
            severity: 'info',
            category: 'Soul',
            message: 'Too orderly for Punk. Break the grid.'
          });
        }
      } else if (designIntention === 'Corporate') {
        // Strict margin enforcement
        const marginViolations = elements.filter(
          (el) =>
            el.x < gridConfig.margin ||
            el.x + el.width > gridConfig.width - gridConfig.margin
        );
        if (marginViolations.length > 0) {
          scoreIntention -= marginViolations.length * 10;
          marginViolations.forEach((el) => {
            newIssues.push({
              id: `corp-mar-${el.id}`,
              severity: 'error',
              category: 'Layout',
              message: 'Corporate standards strictly forbid margin bleed.',
              elementId: el.id
            });
          });
        }
      }

      setIssues(newIssues);
      setVitalSigns({
        heartbeat: scoreHeartbeat,
        breathing: scoreBreathing,
        temperature: 'Neutral',
        integrity: scoreIntegrity,
        intentionMatch: Math.max(0, scoreIntention)
      });
    };

    runValidationOracle();
  }, [elements, gridConfig, designIntention, designSystem]);

  // --- Handlers ---

  const handleElementUpdate = useCallback(
    (id: string, updates: Partial<DesignElement>) => {
      setElements((prev) =>
        prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
      );
    },
    []
  );

  const handleCanvasAdd = useCallback(
    (x: number, y: number) => {
      if (activeTool === 'select' || activeTool === 'hand') {
        if (activeTool !== 'hand') {
          setSelectedElementIds([]);
          setEditingTextId(null);
        }
        return;
      }

      const newId = `${activeTool}-${Date.now()}`;
      const defaultSize =
        activeTool === 'type' ? { w: 300, h: 50 } : { w: 100, h: 100 };

      const snappedX = snapToGrid(x, 'x');
      const snappedY = snapToGrid(y, 'y');

      // Infer role based on size/type
      let role: DesignElement['role'] = 'decoration';
      if (activeTool === 'type') role = 'body';
      if (activeTool === 'type' && defaultSize.h > 40) role = 'headline';

      const newEl: DesignElement = {
        id: newId,
        type: activeTool === 'type' ? 'text' : activeTool === 'image' ? 'image' : 'box',
        shapeType: activeTool === 'shape' ? 'rectangle' : undefined,
        role,
        x: snappedX,
        y: snappedY,
        width: defaultSize.w,
        height: defaultSize.h,
        content: activeTool === 'type' ? 'Type something...' : undefined,
        constraints: ['grid-snap', 'baseline-snap'],
        style:
          activeTool === 'type'
            ? {
              color: '#ffffff',
              fontSize: 24,
              fontFamily: 'Inter',
              fontWeight: '400',
              lineHeight: 1.2
            }
            : {
              backgroundColor:
                activeTool === 'image' ? '#333' : '#2A4B8D'
            }
      };

      setElements((prev) => [...prev, newEl]);
      setSelectedElementIds([newId]);

      if (activeTool === 'type') {
        setTimeout(() => setEditingTextId(newId), 50);
      }

      setActiveTool('select');
    },
    [activeTool, snapToGrid]
  );

  const addComponentToCanvas = useCallback(
    (component: ComponentItem, dropX?: number, dropY?: number) => {
      const newId = `inst-${Date.now()}`;
      const xPos =
        dropX !== undefined ? snapToGrid(dropX, 'x') : gridConfig.margin;
      const yPos =
        dropY !== undefined ? snapToGrid(dropY, 'y') : gridConfig.margin;

      const newEl: DesignElement = {
        ...component.element,
        id: newId,
        x: xPos,
        y: yPos
      };
      setElements((prev) => [...prev, newEl]);
      setSelectedElementIds([newId]);
    },
    [snapToGrid, gridConfig.margin]
  );

  const createComponentFromElements = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const firstId = selectedElementIds[0];
    const el = elements.find((e) => e.id === firstId);
    if (!el) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, x, y, ...rest } = el;
    const newComp: ComponentItem = {
      id: `comp-${Date.now()}`,
      name: `Component ${components.length + 1}`,
      element: rest
    };
    setComponents((prev) => [...prev, newComp]);
    setActiveSidePanel('library');
  }, [selectedElementIds, elements, components.length]);

  const addImageElement = useCallback(
    (src: string, naturalWidth?: number, naturalHeight?: number) => {
      const fallbackWidth = naturalWidth && naturalWidth > 0 ? naturalWidth : 400;
      const fallbackHeight =
        naturalHeight && naturalHeight > 0 ? naturalHeight : 300;

      const maxWidth = gridConfig.width - gridConfig.margin * 2;
      const maxHeight = gridConfig.height - gridConfig.margin * 2;
      const scale = Math.min(
        1,
        maxWidth / fallbackWidth,
        maxHeight / fallbackHeight
      );

      const width = Math.round(fallbackWidth * scale);
      const height = Math.round(fallbackHeight * scale);

      const x = snapToGrid(
        gridConfig.margin + Math.max(0, (maxWidth - width) / 2),
        'x'
      );
      const y = snapToGrid(
        gridConfig.margin + Math.max(0, (maxHeight - height) / 2),
        'y'
      );

      const newEl: DesignElement = {
        id: `image-${Date.now()}`,
        type: 'image',
        role: 'decoration',
        x,
        y,
        width,
        height,
        src,
        constraints: ['grid-snap', 'baseline-snap'],
        style: { backgroundColor: 'transparent' }
      };

      setElements((prev) => [...prev, newEl]);
      setSelectedElementIds([newEl.id]);
      setActiveTool('select');
    },
    [gridConfig, snapToGrid]
  );

  const handleAutoFix = useCallback(
    (issueId: string) => {
      const issue = issues.find((i) => i.id === issueId);
      if (!issue || !issue.elementId) return;

      const el = elements.find((e) => e.id === issue.elementId);
      if (!el) return;

      const updates: Partial<DesignElement> = {};

      if (issue.fixAction === 'snap-grid') {
        updates.y = Math.round(el.y / gridConfig.baseline) * gridConfig.baseline;
      } else if (issue.fixAction === 'snap-color' && issue.fixValue) {
        updates.style = { ...el.style };
        if (updates.style.color) updates.style.color = issue.fixValue;
        if (updates.style.backgroundColor)
          updates.style.backgroundColor = issue.fixValue;
      } else if (issue.fixAction === 'snap-type' && issue.fixValue) {
        updates.style = { ...el.style, fontSize: issue.fixValue };
      }

      handleElementUpdate(el.id, updates);
      setIssues((prev) => prev.filter((i) => i.id !== issueId));
    },
    [issues, elements, gridConfig.baseline, handleElementUpdate]
  );

  // --- AUTO LAYOUT VARIATION ENGINE ---
  const generateVariation = useCallback(() => {
    // Logic: Create a Social Square (1080x1080) variation
    const TARGET_W = 600; // Scaled down for screen
    const TARGET_H = 600;

    const newGridConfig = {
      ...gridConfig,
      width: TARGET_W,
      height: TARGET_H,
      columns: 6, // Fewer columns for smaller size
      margin: 32
    };

    const scaleX = TARGET_W / gridConfig.width;
    const scaleY = TARGET_H / gridConfig.height;

    const newElements = elements.map((el) => {
      const newEl = { ...el, id: `${el.id}-var` };

      // Role-based logic
      if (
        el.role === 'background' ||
        (el.width > gridConfig.width * 0.9 &&
          el.height > gridConfig.height * 0.9)
      ) {
        // Backgrounds stretch to fill
        newEl.x = 0;
        newEl.y = 0;
        newEl.width = TARGET_W;
        newEl.height = TARGET_H;
      } else if (el.role === 'logo' || (el.width < 150 && el.y < 100)) {
        // Logos stay anchored top-left or relative corner, maintain scale
        newEl.x =
          el.x < gridConfig.width / 2
            ? newGridConfig.margin
            : TARGET_W - newGridConfig.margin - el.width;
        newEl.y = newGridConfig.margin;
        // Don't scale dimensions of logo usually, or maybe slight scale
      } else if (el.type === 'text') {
        // Text needs to reflow.
        // Scale font size slightly but not fully linear
        const scaleFactor = Math.min(scaleX, scaleY);
        const newFontSize = el.style?.fontSize
          ? Math.round(el.style.fontSize * 0.8)
          : 16;

        newEl.x = el.x * scaleX;
        newEl.y = el.y * scaleY;
        newEl.width = el.width * scaleX;
        if (newEl.style) newEl.style.fontSize = newFontSize;
      } else {
        // Generic boxes scale proportionally
        newEl.x = el.x * scaleX;
        newEl.y = el.y * scaleY;
        newEl.width = el.width * scaleX;
        newEl.height = el.height * scaleY;
      }

      // Ensure Snapping
      newEl.x = snapToGrid(newEl.x, 'x', false); // soft snap
      return newEl;
    });

    setGridConfig(newGridConfig);
    setElements(newElements);
    setCanvasZoom(0.8);
    // Center canvas
    setCanvasPan({ x: 50, y: 50 });
  }, [elements, gridConfig, snapToGrid]);

  const handleGroup = useCallback(() => {
    if (selectedElementIds.length <= 1) return;
    const newGroupId = `group-${Date.now()}`;
    const updatedElements = elements.map(el => {
      if (selectedElementIds.includes(el.id)) {
        return { ...el, groupId: newGroupId };
      }
      return el;
    });
    setElements(updatedElements);
  }, [elements, selectedElementIds]);

  const handleUngroup = useCallback(() => {
    if (selectedElementIds.length === 0) return;

    const firstSelected = elements.find(el => el.id === selectedElementIds[0]);
    if (!firstSelected || !firstSelected.groupId) return;

    const groupId = firstSelected.groupId;
    const updatedElements = elements.map(el => {
      if (el.groupId === groupId) {
        // Create a new object without the groupId property
        const { groupId: _, ...rest } = el;
        return { ...rest, groupId: null };
      }
      return el;
    });
    setElements(updatedElements);
  }, [elements, selectedElementIds]);

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    setCanvasZoom((prev) => {
      const newZoom = direction === 'in' ? prev + 0.1 : prev - 0.1;
      return Math.max(0.1, Math.min(3, newZoom));
    });
  }, []);

  // --- Keyboard Handlers ---
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (editingTextId) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementIds.length > 0) {
          setElements((prev) =>
            prev.filter((el) => !selectedElementIds.includes(el.id))
          );
          setSelectedElementIds([]);
        }
      }

      // Tools
      if (e.key === 'v') setActiveTool('select');
      if (e.key === 't') setActiveTool('type');
      if (e.key === 'r') setActiveTool('shape');
      if (e.key === 'h') setActiveTool('hand');

      // Spacebar Pan Toggle
      if (e.code === 'Space' && activeTool !== 'hand') {
        e.preventDefault(); // prevent scroll
        setLastActiveTool(activeTool);
        setActiveTool('hand');
      }
    },
    [selectedElementIds, editingTextId, activeTool]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space' && activeTool === 'hand') {
        setActiveTool(lastActiveTool);
      }
    },
    [activeTool, lastActiveTool]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return {
    // State
    activeTool,
    setActiveTool,
    lastActiveTool,
    setLastActiveTool,
    activeSidePanel,
    setActiveSidePanel,
    editingTextId,
    setEditingTextId,
    canvasPan,
    setCanvasPan,
    canvasZoom,
    setCanvasZoom,
    designIntention,
    setDesignIntention,
    gridConfig,
    setGridConfig,
    elements,
    setElements,
    components,
    setComponents,
    designSystem,
    setDesignSystem,
    selectedElementIds,
    setSelectedElementIds,
    issues,
    vitalSigns,
    showExport,
    setShowExport,
    showDesignSystem,
    setShowDesignSystem,

    // Helpers
    snapToGrid,

    // Handlers
    handleElementUpdate,
    handleCanvasAdd,
    addComponentToCanvas,
    createComponentFromElements,
    addImageElement,
    handleAutoFix,
    generateVariation,
    handleGroup,
    handleUngroup,
    handleZoom
  };
};

