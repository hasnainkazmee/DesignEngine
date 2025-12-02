
import React, { useRef, useEffect } from 'react';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Canvas } from './components/Canvas';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ValidationPanel } from './components/ValidationPanel';
import { ExportModal } from './components/ExportModal';
import { DesignSystemModal } from './components/DesignSystemModal';
import { SidePanels } from './components/SidePanels';
import { MOCK_PROJECT } from './types';
import { useDesignEngine } from './hooks/useDesignEngine';
import { loadFont } from './utils/fonts';

export default function App() {
  const exportTargetRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const {
    // State
    activeTool,
    setActiveTool,
    activeSidePanel,
    setActiveSidePanel,
    editingTextId,
    setEditingTextId,
    canvasPan,
    setCanvasPan,
    canvasZoom,
    designIntention,
    setDesignIntention,
    gridConfig,
    setGridConfig,
    elements,
    components,
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
    handleAutoFix,
    generateVariation,
    handleGroup,
    handleUngroup,
    handleZoom,
    addImageElement,
    activePath,
    penToolState,
    editingPathId,
    handlePenToolMouseDown,
    handlePenToolMouseMove,
    handlePenToolMouseUp
  } = useDesignEngine();

  // Preload default fonts
  useEffect(() => {
    loadFont('Inter');
    loadFont('Roboto');
    loadFont('Playfair Display');
    loadFont('JetBrains Mono');
  }, []);

  const handleImportImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const probe = new Image();
      probe.onload = () => {
        addImageElement(result, probe.naturalWidth, probe.naturalHeight);
      };
      probe.onerror = () => {
        addImageElement(result);
      };
      probe.src = result;
    };
    reader.readAsDataURL(file);
    if (event.target.value) {
      event.target.value = '';
    }
  };

  const lastSelectedId = selectedElementIds.length > 0 ? selectedElementIds[selectedElementIds.length - 1] : null;

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-300 overflow-hidden font-sans selection:bg-blue-500/30">
      <Toolbar
        project={MOCK_PROJECT}
        onOpenExport={() => setShowExport(true)}
        onOpenDesignSystem={() => setShowDesignSystem(true)}
        issueCount={issues.length}
        zoom={canvasZoom}
        onZoom={handleZoom}
        onImportImage={handleImportImageClick}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          activePanel={activeSidePanel}
          setActivePanel={setActiveSidePanel}
          onGenerateVariation={generateVariation}
        />

        {activeSidePanel && (
          <SidePanels
            activePanel={activeSidePanel}
            onClose={() => setActiveSidePanel(null)}
            elements={elements}
            selectedIds={selectedElementIds}
            onSelect={setSelectedElementIds}
            components={components}
            onAddComponent={addComponentToCanvas}
            system={designSystem}
          />
        )}

        <div className="flex-1 relative bg-zinc-900/50 overflow-hidden flex flex-col">
          {/* Canvas Container */}
          <div className="flex-1 relative overflow-hidden bg-zinc-900 cursor-default">
            <Canvas
              elements={elements}
              gridConfig={gridConfig}
              selectedIds={selectedElementIds}
              onSelect={setSelectedElementIds}
              onUpdate={handleElementUpdate}
              activeTool={activeTool}
              onCanvasClick={handleCanvasAdd}
              snapToGrid={snapToGrid}
              editingId={editingTextId}
              setEditingId={setEditingTextId}
              onComponentDrop={addComponentToCanvas}
              pan={canvasPan}
              onPanChange={setCanvasPan}
              zoom={canvasZoom}
              exportRef={exportTargetRef}
              activePath={activePath}
              penToolState={penToolState}
              editingPathId={editingPathId}
              onPenToolMouseDown={handlePenToolMouseDown}
              onPenToolMouseMove={handlePenToolMouseMove}
              onPenToolMouseUp={handlePenToolMouseUp}
            />
          </div>

          {/* Status Bar */}
          <div className="h-8 bg-zinc-950 border-t border-zinc-800 flex items-center px-4 text-[10px] font-mono text-zinc-500 justify-between shrink-0 z-20">
            <div className="flex gap-4 items-center">
              <span>ZOOM: {Math.round(canvasZoom * 100)}%</span>
              <span>W: {gridConfig.width} H: {gridConfig.height}</span>
              <span>INTENTION: {designIntention.toUpperCase()}</span>
            </div>
            <div className="flex gap-4 items-center">
              <button
                onClick={() => setGridConfig(prev => ({ ...prev, visible: !prev.visible }))}
                className="hover:text-zinc-300 flex items-center gap-1"
              >
                {gridConfig.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                GRID
              </button>
              <span className="flex items-center gap-1 text-emerald-500">
                <CheckCircle2 size={10} /> ORACLE ACTIVE
              </span>
            </div>
          </div>
        </div>

        <div className="w-80 bg-zinc-950 border-l border-zinc-800 flex flex-col shrink-0 z-20">
          <PropertiesPanel
            element={elements.find(e => e.id === lastSelectedId)}
            elements={elements}
            selectedIds={selectedElementIds}
            onUpdate={(updates) => lastSelectedId && handleElementUpdate(lastSelectedId, updates)}
            onCreateComponent={createComponentFromElements}
            selectedCount={selectedElementIds.length}
            onGroup={handleGroup}
            onUngroup={handleUngroup}
          />
          <ValidationPanel
            issues={issues}
            vitalSigns={vitalSigns}
            intention={designIntention}
            onSetIntention={setDesignIntention}
            onFix={handleAutoFix}
            projectName={MOCK_PROJECT.name}
          />
        </div>
      </div>

      {showExport && (
        <ExportModal
          onClose={() => setShowExport(false)}
          exportTargetRef={exportTargetRef}
        />
      )}
      {showDesignSystem && (
        <DesignSystemModal
          config={gridConfig}
          system={designSystem}
          onUpdateConfig={setGridConfig}
          onUpdateSystem={setDesignSystem}
          onClose={() => setShowDesignSystem(false)}
        />
      )}

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={imageInputRef}
        onChange={handleImageFileChange}
      />
    </div>
  );
}
