export interface FontOption {
  name: string;
  category: 'Sans Serif' | 'Serif' | 'Display' | 'Mono' | 'Handwriting';
}

export const GOOGLE_FONTS: FontOption[] = [
  // Sans Serif
  { name: 'Inter', category: 'Sans Serif' },
  { name: 'Roboto', category: 'Sans Serif' },
  { name: 'Open Sans', category: 'Sans Serif' },
  { name: 'Lato', category: 'Sans Serif' },
  { name: 'Poppins', category: 'Sans Serif' },
  { name: 'Montserrat', category: 'Sans Serif' },
  
  // Serif
  { name: 'Playfair Display', category: 'Serif' },
  { name: 'Merriweather', category: 'Serif' },
  { name: 'Lora', category: 'Serif' },
  { name: 'PT Serif', category: 'Serif' },
  { name: 'Crimson Text', category: 'Serif' },

  // Display
  { name: 'Oswald', category: 'Display' },
  { name: 'Bebas Neue', category: 'Display' },
  { name: 'Abril Fatface', category: 'Display' },
  { name: 'Lobster', category: 'Display' },

  // Mono
  { name: 'JetBrains Mono', category: 'Mono' },
  { name: 'Roboto Mono', category: 'Mono' },
  { name: 'Fira Code', category: 'Mono' },
  { name: 'Space Mono', category: 'Mono' },

  // Handwriting
  { name: 'Dancing Script', category: 'Handwriting' },
  { name: 'Pacifico', category: 'Handwriting' },
];

const loadedFonts = new Set<string>();

export const loadFont = (fontFamily: string) => {
  if (loadedFonts.has(fontFamily)) return;

  // Check if it's a standard web font or already loaded by other means
  if (['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'inherit'].includes(fontFamily.toLowerCase())) {
    return;
  }

  const linkId = `font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(linkId)) {
    loadedFonts.add(fontFamily);
    return;
  }

  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  // Request weights 300, 400, 500, 600, 700 to cover most use cases
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
  
  document.head.appendChild(link);
  loadedFonts.add(fontFamily);
};
