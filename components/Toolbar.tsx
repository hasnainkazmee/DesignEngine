

import React from 'react';
import { ProjectMeta } from '../types';
import { Download, Settings, Bell, ZoomIn, ZoomOut, ChevronLeft, Puzzle } from 'lucide-react';

interface ToolbarProps {
  project: ProjectMeta;
  onOpenExport: () => void;
  onOpenDesignSystem: () => void;
  onOpenPlugins?: () => void;
  issueCount: number;
  zoom?: number;
  onZoom?: (dir: 'in' | 'out') => void;
  onBack?: () => void;
}

const KazmLogo = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="currentColor"/>
        <path d="M7 5H14V14.5L21.5 6H29.5L19.5 16L29.5 26H21.5L14 17.5V26H7V5Z" fill="white"/>
    </svg>
);

export const Toolbar: React.FC<ToolbarProps> = ({ project, onOpenExport, onOpenDesignSystem, onOpenPlugins, issueCount, zoom, onZoom, onBack }) => {
  return (
    <header className="h-12 bg-zinc-950 border-b border-zinc-800 flex items-center px-4 justify-between shrink-0 z-20 select-none">
      <div className="flex items-center gap-4">
        {onBack ? (
            <button 
               onClick={onBack}
               className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
            >
                <div className="w-6 h-6 bg-zinc-800 group-hover:bg-zinc-700 rounded flex items-center justify-center">
                    <ChevronLeft size={14} />
                </div>
                <span className="font-bold tracking-tight text-sm">DASHBOARD</span>
            </button>
        ) : (
            <div className="flex items-center gap-2 text-white font-bold tracking-tight">
                <div className="text-blue-600 flex items-center">
                    <KazmLogo />
                </div>
                <span className="hidden md:inline text-sm font-mono tracking-wide">KAZM</span>
            </div>
        )}
        
        <div className="h-4 w-px bg-zinc-800 mx-2" />
        
        <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
            <span className="text-zinc-300">{project.name}</span>
            <span className="text-zinc-700">/</span>
            <span>{project.dimensions}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onZoom && zoom && (
            <div className="flex items-center gap-1 bg-zinc-900 rounded border border-zinc-800 px-1 mr-2">
                <button onClick={() => onZoom('out')} className="p-1 text-zinc-400 hover:text-white"><ZoomOut size={12} /></button>
                <button onClick={() => onZoom('in')} className="p-1 text-zinc-400 hover:text-white"><ZoomIn size={12} /></button>
            </div>
        )}

        {onOpenPlugins && (
            <button 
              onClick={onOpenPlugins}
              className="h-7 px-2 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white text-[10px] font-medium flex items-center gap-2 transition-colors uppercase tracking-wide"
              title="Plugins"
            >
              <Puzzle size={14} />
            </button>
        )}

        <button 
          onClick={onOpenDesignSystem}
          className="h-7 px-3 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white text-[10px] font-medium flex items-center gap-2 transition-colors uppercase tracking-wide"
        >
          <Settings size={12} />
          <span>System</span>
        </button>
        
        <button 
          className="h-7 px-2 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors relative"
        >
          <Bell size={14} />
          {issueCount > 0 && (
             <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
          )}
        </button>

        <div className="h-4 w-px bg-zinc-800 mx-2" />

        <button 
          onClick={onOpenExport}
          className="h-7 px-3 bg-white text-zinc-950 hover:bg-zinc-200 rounded text-[10px] font-bold flex items-center gap-2 transition-colors uppercase tracking-wide"
        >
          <Download size={12} />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
