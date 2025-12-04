import React, { useState } from 'react';
import { Download, FileText, Image as ImageIcon, Printer, X, Check } from 'lucide-react';

interface ExportModalProps {
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [complete, setComplete] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
        setIsExporting(false);
        setComplete(true);
    }, 2000);
  };

  if (complete) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl w-[400px] p-8 text-center animate-in fade-in zoom-in duration-200">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check size={32} />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Export Complete</h2>
                <p className="text-zinc-400 text-sm mb-6">
                    Your package has been generated with 5 formats and a specifications document.
                </p>
                <div className="bg-zinc-950 border border-zinc-800 rounded p-4 mb-6 text-left">
                     <div className="text-xs text-zinc-500 font-mono mb-2">OUTPUT</div>
                     <ul className="text-xs text-zinc-300 space-y-1">
                        <li className="flex justify-between"><span>Print_CMYK.pdf</span> <span className="text-emerald-500">4.2MB</span></li>
                        <li className="flex justify-between"><span>Web_Assets.zip</span> <span className="text-emerald-500">12.1MB</span></li>
                        <li className="flex justify-between"><span>Specs_Sheet.pdf</span> <span className="text-emerald-500">0.8MB</span></li>
                     </ul>
                </div>
                <button 
                    onClick={onClose}
                    className="w-full py-2 bg-white text-black font-bold rounded hover:bg-zinc-200 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl w-[600px] flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <div>
                <h2 className="text-lg font-bold text-white">Smart Export</h2>
                <p className="text-xs text-zinc-400 mt-1">Generating production-ready assets based on constraints.</p>
            </div>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
                <div className="border border-blue-500/30 bg-blue-500/5 rounded p-4 relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-2">
                        <Printer className="text-blue-400" size={16} />
                        <span className="text-sm font-bold text-blue-100">Print Production</span>
                    </div>
                    <ul className="text-xs text-blue-200/60 space-y-2 mt-3">
                        <li className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-400 rounded-full"/> CMYK Color Separation</li>
                        <li className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-400 rounded-full"/> 300 DPI High-Res</li>
                        <li className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-400 rounded-full"/> Crop Marks & Bleed</li>
                    </ul>
                    <div className="absolute top-2 right-2">
                         <input type="checkbox" defaultChecked className="accent-blue-500" />
                    </div>
                </div>

                <div className="border border-zinc-800 bg-zinc-950/50 rounded p-4 relative">
                    <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="text-zinc-400" size={16} />
                        <span className="text-sm font-bold text-zinc-100">Digital Assets</span>
                    </div>
                    <ul className="text-xs text-zinc-500 space-y-2 mt-3">
                        <li className="flex items-center gap-2"><div className="w-1 h-1 bg-zinc-600 rounded-full"/> RGB (sRGB)</li>
                        <li className="flex items-center gap-2"><div className="w-1 h-1 bg-zinc-600 rounded-full"/> @1x, @2x, @3x Export</li>
                        <li className="flex items-center gap-2"><div className="w-1 h-1 bg-zinc-600 rounded-full"/> WebP Optimized</li>
                    </ul>
                    <div className="absolute top-2 right-2">
                         <input type="checkbox" defaultChecked className="accent-blue-500" />
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Include Documentation</label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                        <input type="checkbox" defaultChecked className="accent-blue-500" />
                        Style Guide PDF
                    </label>
                    <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                        <input type="checkbox" defaultChecked className="accent-blue-500" />
                        Developer Handoff (JSON)
                    </label>
                </div>
            </div>

            {/* Progress Bar (Visual) */}
            {isExporting && (
                <div className="space-y-2 animate-in fade-in">
                    <div className="flex justify-between text-xs text-zinc-400">
                        <span>Processing vector paths...</span>
                        <span>72%</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[72%] rounded-full animate-pulse" />
                    </div>
                </div>
            )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex justify-end">
            <button 
                onClick={handleExport}
                disabled={isExporting}
                className="px-6 py-2 bg-white text-black font-bold text-sm rounded hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
                {isExporting ? 'Generating...' : 'Export All Formats'}
            </button>
        </div>
      </div>
    </div>
  );
};