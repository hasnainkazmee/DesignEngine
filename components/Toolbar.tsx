
import React from 'react';
import { ProjectMeta } from '../types';
import { Layout, Download, Settings, Bell, ChevronRight, ZoomIn, ZoomOut, Image as ImageIcon } from 'lucide-react';

interface ToolbarProps {
  project: ProjectMeta;
  onOpenExport: () => void;
  onOpenDesignSystem: () => void;
  onImportImage: () => void;
  issueCount: number;
  zoom?: number;
  onZoom?: (dir: 'in' | 'out') => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ project, onOpenExport, onOpenDesignSystem, onImportImage, issueCount, zoom, onZoom }) => {
  return (
    <header className="h-14 bg-zinc-950 border-b border-zinc-800 flex items-center px-4 justify-between shrink-0 z-20 select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-white font-bold tracking-tight">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <Layout size={18} />
          </div>
          <span className="hidden md:inline">DESIGN ENGINE</span>
        </div>

        <div className="h-6 w-px bg-zinc-800 mx-2" />

        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
            <span>PROJECT</span>
            <ChevronRight size={10} />
            <span className="text-zinc-300">{project.name}</span>
          </div>
          <div className="flex gap-3 text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
            <span>{project.media}</span>
            <span className="text-zinc-700">•</span>
            <span>{project.dimensions}</span>
            <span className="text-zinc-700">•</span>
            <span>{project.colorMode}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onZoom && zoom && (
          <div className="flex items-center gap-1 bg-zinc-900 rounded border border-zinc-800 px-1 mr-2">
            <button onClick={() => onZoom('out')} className="p-1 text-zinc-400 hover:text-white"><ZoomOut size={12} /></button>
            <span className="text-[10px] font-mono text-zinc-500 w-8 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => onZoom('in')} className="p-1 text-zinc-400 hover:text-white"><ZoomIn size={12} /></button>
          </div>
        )}

        <button
          onClick={onOpenDesignSystem}
          className="h-8 px-3 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-medium flex items-center gap-2 transition-colors"
        >
          <Settings size={14} />
          <span>SYSTEM</span>
        </button>

        <button
          onClick={onImportImage}
          className="h-8 px-3 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-medium flex items-center gap-2 transition-colors"
        >
          <ImageIcon size={14} />
          <span>IMPORT IMG</span>
        </button>

        <button
          className="h-8 px-3 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-medium flex items-center gap-2 transition-colors relative"
        >
          <Bell size={14} />
          {issueCount > 0 && (
            <span className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
          )}
        </button>

        <div className="h-6 w-px bg-zinc-800 mx-2" />

        <button
          onClick={onOpenExport}
          className="h-8 px-4 bg-white text-zinc-950 hover:bg-zinc-200 rounded text-xs font-bold flex items-center gap-2 transition-colors"
        >
          <Download size={14} />
          <span>EXPORT</span>
        </button>
      </div>
    </header>
  );
};
