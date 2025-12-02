import { Gradient, ColorStop } from '../types';

/**
 * Convert RGB color to hex string
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${[r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('')}`;
};

/**
 * Convert hex string to RGB
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    }
    : { r: 0, g: 0, b: 0 };
};

/**
 * Convert RGB to HSL
 */
export const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
};

/**
 * Convert HSL to RGB
 */
export const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
};

/**
 * Interpolate between two color stops
 */
export const interpolateColor = (stop1: ColorStop, stop2: ColorStop, position: number): { r: number; g: number; b: number; opacity: number } => {
  if (position <= stop1.position) return { ...stop1.color, opacity: stop1.opacity };
  if (position >= stop2.position) return { ...stop2.color, opacity: stop2.opacity };

  const t = (position - stop1.position) / (stop2.position - stop1.position);
  
  return {
    r: Math.round(stop1.color.r + (stop2.color.r - stop1.color.r) * t),
    g: Math.round(stop1.color.g + (stop2.color.g - stop1.color.g) * t),
    b: Math.round(stop1.color.b + (stop2.color.b - stop1.color.b) * t),
    opacity: stop1.opacity + (stop2.opacity - stop1.opacity) * t
  };
};

/**
 * Generate CSS gradient string for linear gradient
 */
export const generateLinearGradientCSS = (gradient: Gradient, width: number, height: number): string => {
  const sortedStops = [...gradient.stops].sort((a, b) => a.position - b.position);
  const angle = gradient.angle || 0;
  
  const stops = sortedStops.map(stop => {
    const color = rgbToHex(stop.color.r, stop.color.g, stop.color.b);
    const opacity = stop.opacity / 100;
    return `rgba(${stop.color.r}, ${stop.color.g}, ${stop.color.b}, ${opacity}) ${stop.position}%`;
  }).join(', ');

  return `linear-gradient(${angle}deg, ${stops})`;
};

/**
 * Generate CSS gradient string for radial gradient
 */
export const generateRadialGradientCSS = (gradient: Gradient, width: number, height: number): string => {
  const sortedStops = [...gradient.stops].sort((a, b) => a.position - b.position);
  const position = gradient.position || { x: 0.5, y: 0.5 };
  const radius = gradient.radius || 0.5;
  
  const centerX = position.x * 100;
  const centerY = position.y * 100;
  // Calculate radius based on element dimensions
  const maxDimension = Math.max(width, height);
  const radiusPixels = radius * maxDimension;
  
  const stops = sortedStops.map(stop => {
    const opacity = stop.opacity / 100;
    return `rgba(${stop.color.r}, ${stop.color.g}, ${stop.color.b}, ${opacity}) ${stop.position}%`;
  }).join(', ');

  return `radial-gradient(circle ${radiusPixels}px at ${centerX}% ${centerY}%, ${stops})`;
};

/**
 * Generate CSS gradient string for angular/conic gradient
 */
export const generateAngularGradientCSS = (gradient: Gradient, width: number, height: number): string => {
  const sortedStops = [...gradient.stops].sort((a, b) => a.position - b.position);
  const position = gradient.position || { x: 0.5, y: 0.5 };
  
  const centerX = position.x * 100;
  const centerY = position.y * 100;
  const angle = gradient.angle || 0;
  
  const stops = sortedStops.map(stop => {
    const color = rgbToHex(stop.color.r, stop.color.g, stop.color.b);
    const opacity = stop.opacity / 100;
    return `rgba(${stop.color.r}, ${stop.color.g}, ${stop.color.b}, ${opacity}) ${stop.position}%`;
  }).join(', ');

  return `conic-gradient(from ${angle}deg at ${centerX}% ${centerY}%, ${stops})`;
};

/**
 * Generate CSS gradient string based on gradient type
 */
export const generateGradientCSS = (gradient: Gradient, width: number, height: number): string => {
  switch (gradient.type) {
    case 'linear':
      return generateLinearGradientCSS(gradient, width, height);
    case 'radial':
      return generateRadialGradientCSS(gradient, width, height);
    case 'angular':
      return generateAngularGradientCSS(gradient, width, height);
    default:
      return '';
  }
};

/**
 * Create default gradient (black to white, linear, 0 degrees)
 */
export const createDefaultGradient = (): Gradient => ({
  type: 'linear',
  angle: 0,
  stops: [
    { position: 0, color: { r: 0, g: 0, b: 0 }, opacity: 100 },
    { position: 100, color: { r: 255, g: 255, b: 255 }, opacity: 100 }
  ]
});

/**
 * Sort color stops by position
 */
export const sortColorStops = (stops: ColorStop[]): ColorStop[] => {
  return [...stops].sort((a, b) => a.position - b.position);
};

