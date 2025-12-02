import React, { useEffect, useState } from 'react';
import { Download, Image as ImageIcon, X, Check, Info } from 'lucide-react';
import { toJpeg, toPng } from 'html-to-image';

interface ExportModalProps {
  onClose: () => void;
  exportTargetRef: React.RefObject<HTMLDivElement | null>;
}

type ExportFormat = 'png' | 'jpg';

const formatBytes = (bytes: number) => {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const shouldIncludeNode = (node: Node | null) => {
  if (!(node instanceof HTMLElement)) return true;
  let current: HTMLElement | null = node;
  while (current) {
    if (current.dataset?.exportIgnore === 'true') {
      return false;
    }
    current = current.parentElement;
  }
  return true;
};

export const ExportModal: React.FC<ExportModalProps> = ({ onClose, exportTargetRef }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState(0.92);
  const [fileName, setFileName] = useState('design-export');
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [exportMeta, setExportMeta] = useState<{ name: string; size: string } | null>(null);

  useEffect(() => {
    if (!exportTargetRef.current) return;
    const node = exportTargetRef.current;
    const updateSize = () => {
      setDimensions({ width: Math.round(node.offsetWidth), height: Math.round(node.offsetHeight) });
    };
    updateSize();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateSize);
      observer.observe(node);
      return () => observer.disconnect();
    }
  }, [exportTargetRef]);

  const handleExport = async () => {
    const node = exportTargetRef.current;
    if (!node) {
      setError('Nothing to export — the canvas is not mounted.');
      return;
    }

    setError(null);
    setIsExporting(true);
    setComplete(false);

    try {
      const sanitizedName = fileName.trim() || 'design-export';
      const actualFormat = format === 'png' ? 'png' : 'jpg';
      const pixelRatio = Math.min(4, window.devicePixelRatio || 2);

      const commonOptions = {
        backgroundColor: '#ffffff',
        width: node.offsetWidth,
        height: node.offsetHeight,
        pixelRatio,
        style: {
          transform: 'none',
          transformOrigin: '0 0',
          boxShadow: 'none'
        },
        filter: (n: Node) => shouldIncludeNode(n)
      };

      const dataUrl =
        actualFormat === 'png'
          ? await toPng(node, commonOptions)
          : await toJpeg(node, { ...commonOptions, quality });

      const link = document.createElement('a');
      link.download = `${sanitizedName}.${actualFormat}`;
      link.href = dataUrl;
      link.click();

      const approxBytes = Math.max(0, Math.round((dataUrl.length * 3) / 4 - 2));
      setExportMeta({
        name: link.download,
        size: formatBytes(approxBytes)
      });
      setComplete(true);
    } catch (err) {
      console.error('Failed to export canvas', err);
      setError(err instanceof Error ? err.message : 'Unknown error while exporting.');
    } finally {
      setIsExporting(false);
    }
  };

  if (complete && exportMeta) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl w-[420px] p-8 text-center animate-in fade-in zoom-in duration-200">
          <div className="w-16 h-16 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Export ready</h2>
          <p className="text-zinc-400 text-sm mb-6">Your {format.toUpperCase()} file has been downloaded.</p>
          <div className="bg-zinc-950 border border-zinc-800 rounded p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-xs text-zinc-500 font-mono">
              <span>FILE</span>
              <span>SIZE</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-100">
              <span className="truncate" title={exportMeta.name}>{exportMeta.name}</span>
              <span className="text-emerald-400">{exportMeta.size}</span>
            </div>
            <div className="flex justify-between text-xs text-zinc-500 font-mono">
              <span>DIMENSIONS</span>
              <span>{dimensions.width} × {dimensions.height}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setComplete(false);
                setExportMeta(null);
              }}
              className="flex-1 py-2 border border-zinc-700 text-zinc-200 rounded hover:border-zinc-500 transition-colors"
            >
              Export another
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-white text-black font-bold rounded hover:bg-zinc-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl w-[640px] flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-white">Export artboard</h2>
            <p className="text-xs text-zinc-400 mt-1">Download a flattened snapshot of the active canvas.</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            {(['png', 'jpg'] as ExportFormat[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFormat(option)}
                className={`border rounded p-4 text-left transition-all ${
                  format === option
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                    : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={16} className="text-blue-300" />
                    <span className="text-sm font-semibold text-white uppercase">{option}</span>
                  </div>
                  {format === option && (
                    <span className="text-[10px] font-mono text-blue-300">ACTIVE</span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-2">
                  {option === 'png' ? 'Lossless RGB with transparency' : 'Compressed RGB, smallest size'}
                </p>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">File name</label>
              <input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950/40 border border-zinc-800 rounded text-sm text-white focus:border-blue-500 focus:outline-none"
                placeholder="design-export"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Dimensions</label>
              <div className="px-3 py-2 bg-zinc-950/40 border border-zinc-800 rounded text-sm text-zinc-400">
                {dimensions.width && dimensions.height ? (
                  <>
                    {dimensions.width}px × {dimensions.height}px
                  </>
                ) : (
                  'Canvas not ready'
                )}
              </div>
            </div>
          </div>

          {format === 'jpg' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                JPEG quality ({Math.round(quality * 100)}%)
              </label>
              <input
                type="range"
                min={0.5}
                max={1}
                step={0.01}
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          )}

          <div className="flex items-start gap-3 text-xs text-zinc-400 bg-zinc-950/40 border border-zinc-800 rounded p-3">
            <Info size={14} className="mt-0.5 text-blue-300" />
            <p>
              Exports capture the visible artboard only. Hide grids or overlays before exporting if you want a clean
              result.
            </p>
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded p-3">
              {error}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-zinc-700 rounded text-zinc-300 hover:border-zinc-500 transition-colors"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-2 bg-white text-black font-bold text-sm rounded flex items-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {isExporting ? 'Rendering…' : `Export as ${format.toUpperCase()}`}
            {!isExporting && <Download size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};