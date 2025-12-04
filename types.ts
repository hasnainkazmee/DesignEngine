

export type ToolType = 'select' | 'type' | 'image' | 'shape' | 'frame' | 'hand' | 'lasso' | 'wand' | 'crop' | 'brush' | 'clone' | 'gradient';

export type ConstraintType = 'grid-snap' | 'baseline-snap' | 'aspect-ratio' | 'margin-bound';

export type DesignIntention = 'Corporate' | 'Luxury' | 'Punk' | 'Minimalist' | 'Editorial';

export interface GridConfig {
  columns: number;
  gutter: number;
  margin: number;
  baseline: number; // e.g., 18pt
  visible: boolean;
  width: number;
  height: number;
}

export interface DesignElement {
  id: string;
  type: 'text' | 'image' | 'box' | 'group';
  parentId?: string; // For grouping
  clip?: boolean; // For masking/clipping
  shapeType?: 'rectangle' | 'circle'; // For box types
  role?: 'background' | 'logo' | 'headline' | 'body' | 'decoration'; // For auto-layout intelligence
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  src?: string; // For images
  style?: {
    backgroundColor?: string;
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    opacity?: number;
    letterSpacing?: number;
    lineHeight?: number;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    
    // Advanced Styling
    backgroundImage?: string; // Gradients
    boxShadow?: string;
    transform?: string; // rotate(90deg)
    mixBlendMode?: string;
    backdropFilter?: string; // For Glassmorphism
    
    // Filters (Stored individually for UI sliders, combined at render)
    brightness?: number; // %
    contrast?: number; // %
    saturate?: number; // %
    blur?: number; // px
    hueRotate?: number; // deg
    rotation?: number; // deg
  };
  constraints: ConstraintType[];
}

export interface ValidationIssue {
  id: string;
  severity: 'info' | 'warning' | 'error';
  category: 'Typography' | 'Layout' | 'Color' | 'Production' | 'Soul';
  message: string;
  elementId?: string;
  autoFixAvailable?: boolean;
  fixAction?: 'snap-grid' | 'snap-color' | 'snap-type' | 'increase-contrast';
  fixValue?: any; // The value to apply
}

export interface DesignVitalSigns {
    heartbeat: number; // Grid/System adherence (0-100)
    breathing: number; // Whitespace ratio (0-100)
    temperature: 'Cool' | 'Warm' | 'Neutral';
    integrity: number; // Consistency score
    intentionMatch: number; // How well it matches selected intention
}

export interface ProjectMeta {
  name: string;
  media: string;
  dimensions: string;
  colorMode: 'CMYK' | 'RGB';
  status: string;
}

export interface Project {
    id: string;
    name: string;
    lastModified: number;
    gridConfig: GridConfig;
    elements: DesignElement[];
    designSystem: DesignSystem;
    vitalSigns: DesignVitalSigns;
    intention: DesignIntention;
}

export interface ComponentItem {
  id: string;
  name: string;
  element: Omit<DesignElement, 'id' | 'x' | 'y'>; // Template
}

export interface TypographyStyle {
    name: string;
    family: string;
    size: number;
    weight: string;
    lineHeight: number;
}

export interface DesignSystem {
  colors: { name: string; value: string }[];
  typography: TypographyStyle[];
}

// --- PLUGIN SYSTEM ---

export interface PluginContext {
  elements: DesignElement[];
  grid: GridConfig;
  selection: string[];
  system: DesignSystem;
}

export interface PluginAPI {
  create: (element: Partial<DesignElement>) => void;
  update: (id: string, updates: Partial<DesignElement>) => void;
  delete: (id: string) => void;
  notify: (message: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  getSelection: () => DesignElement[];
}

export interface PluginDefinition {
  id: string;
  name: string;
  description: string;
  code: string;
  author: string;
  version: string;
}

export const MOCK_PROJECT: ProjectMeta = {
  name: "Brew & Bean Coffee - Spring Campaign",
  media: "Print + Digital",
  dimensions: "A2 (420x594mm)",
  colorMode: "CMYK",
  status: "Active"
};

export const DEFAULT_SYSTEM: DesignSystem = {
  colors: [
    { name: 'Primary Blue', value: '#2A4B8D' },
    { name: 'Accent Orange', value: '#FF6B35' },
    { name: 'Neutral Dark', value: '#18181b' },
    { name: 'Neutral Light', value: '#f4f4f5' }
  ],
  typography: [
    { name: 'Headline 1', family: 'Inter', size: 72, weight: '700', lineHeight: 1.1 },
    { name: 'Headline 2', family: 'Inter', size: 48, weight: '600', lineHeight: 1.2 },
    { name: 'Body', family: 'Inter', size: 16, weight: '400', lineHeight: 1.5 }
  ]
};

export const ARTBOARD_PRESETS = [
    { name: 'A4 Print', width: 595, height: 842, label: '595x842' },
    { name: 'A3 Print', width: 842, height: 1191, label: '842x1191' },
    { name: 'Social Square', width: 1080, height: 1080, label: '1080x1080' },
    { name: 'Instagram Story', width: 1080, height: 1920, label: '1080x1920' },
    { name: 'Web Desktop', width: 1440, height: 900, label: '1440x900' },
    { name: 'Web Mobile', width: 375, height: 812, label: '375x812' }
];