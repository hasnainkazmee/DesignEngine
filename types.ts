

export type ToolType = 'select' | 'type' | 'image' | 'shape' | 'frame' | 'hand';

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
  parentId: string | null;
  groupId: string | null;
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