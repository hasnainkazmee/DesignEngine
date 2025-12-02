
import React from 'react';
import { ToolType } from '../types';
import {
  MousePointer2,
  Type,
  Image as ImageIcon,
  BoxSelect,
  Palette,
  Layers,
  Sparkles,
  Library,
  Hand
} from 'lucide-react';

interface SidebarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  activePanel: 'layers' | 'colors' | 'library' | null;
  setActivePanel: (panel: 'layers' | 'colors' | 'library' | null) => void;
  onGenerateVariation: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTool, setActiveTool, activePanel, setActivePanel, onGenerateVariation }) => {
  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select (V)' },
    { id: 'hand', icon: Hand, label: 'Pan (H/Space)' },
    { id: 'type', icon: Type, label: 'Type (T)' },
    { id: 'shape', icon: BoxSelect, label: 'Shape (R)' },
    { id: 'image', icon: ImageIcon, label: 'Media (M)' },
  ];

  const handlePanelToggle = (panel: 'layers' | 'colors' | 'library') => {
    if (activePanel === panel) {
      setActivePanel(null);
    } else {
      setActivePanel(panel);
    }
  };

  return (
    <div className="w-14 bg-zinc-950 border-r border-zinc-800 flex flex-col items-center py-4 gap-4 shrink-0 z-10">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(tool.id as ToolType)}
          className={`
            w-10 h-10 rounded flex items-center justify-center transition-all group relative
            ${activeTool === tool.id
              ? 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/50'
              : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}
          `}
          title={tool.label}
        >
          <tool.icon size={20} strokeWidth={1.5} />
          {/* Tooltip */}
          <span className="absolute left-12 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border border-zinc-700 shadow-xl">
            {tool.label}
          </span>
        </button>
      ))}

      <div className="w-8 h-px bg-zinc-800 my-2" />

      <button
        onClick={onGenerateVariation}
        className="w-10 h-10 rounded flex items-center justify-center text-zinc-500 hover:text-purple-400 hover:bg-purple-900/20 transition-colors group relative animate-pulse-slow"
        title="Generate Variation"
      >
        <Sparkles size={20} strokeWidth={1.5} />
        <span className="absolute left-12 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity border border-zinc-700 shadow-xl">
          Auto-Layout Variation
        </span>
      </button>

      <div className="mt-auto flex flex-col gap-4">
        <button
          onClick={() => handlePanelToggle('library')}
          className={`w-10 h-10 rounded flex items-center justify-center transition-colors group relative ${activePanel === 'library' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
          title="Component Library"
        >
          <Library size={20} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => handlePanelToggle('layers')}
          className={`w-10 h-10 rounded flex items-center justify-center transition-colors group relative ${activePanel === 'layers' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
          title="Layers"
        >
          <Layers size={20} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => handlePanelToggle('colors')}
          className={`w-10 h-10 rounded flex items-center justify-center transition-colors group relative ${activePanel === 'colors' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}`}
          title="Colors"
        >
          <Palette size={20} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};
