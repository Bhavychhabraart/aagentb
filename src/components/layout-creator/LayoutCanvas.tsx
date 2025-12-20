import { useRef, useEffect } from 'react';
import { RoomDimensions } from '@/types/layout-creator';
import { useLayoutCanvas } from '@/hooks/useLayoutCanvas';
import { LayoutToolbar } from './LayoutToolbar';
import { FurnitureLibrary } from './FurnitureLibrary';
import { PropertiesPanel } from './PropertiesPanel';
import { getRoomLabel } from '@/utils/layoutExport';

interface LayoutCanvasProps {
  roomDimensions: RoomDimensions;
  onCanvasReady: (methods: ReturnType<typeof useLayoutCanvas>) => void;
}

export function LayoutCanvas({ roomDimensions, onCanvasReady }: LayoutCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const canvasMethods = useLayoutCanvas({
    canvasRef,
    roomDimensions,
  });

  const {
    canvas,
    initCanvas,
    activeTool,
    setActiveTool,
    selectedObject,
    showGrid,
    toggleGrid,
    snapToGrid,
    setSnapToGrid,
    zoom,
    setCanvasZoom,
    fitToScreen,
    undo,
    redo,
    addDoor,
    addWindow,
    addFurniture,
    deleteSelected,
    rotateSelected,
  } = canvasMethods;

  // Initialize canvas
  useEffect(() => {
    const fabricCanvas = initCanvas();
    if (fabricCanvas) {
      onCanvasReady(canvasMethods);
    }
    
    return () => {
      fabricCanvas?.dispose();
    };
  }, [roomDimensions]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'v':
          setActiveTool('select');
          break;
        case 'w':
          setActiveTool('wall');
          break;
        case 'f':
          setActiveTool('furniture');
          break;
        case 'd':
          if (!e.ctrlKey && !e.metaKey) {
            addDoor();
          }
          break;
        case 'n':
          addWindow();
          break;
        case 'r':
          rotateSelected(e.shiftKey ? -15 : 15);
          break;
        case 'delete':
        case 'backspace':
          deleteSelected();
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
          break;
        case 'y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            redo();
          }
          break;
        case '=':
        case '+':
          setCanvasZoom(zoom + 10);
          break;
        case '-':
          setCanvasZoom(zoom - 10);
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            fitToScreen();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTool, addDoor, addWindow, rotateSelected, deleteSelected, undo, redo, zoom, setCanvasZoom, fitToScreen]);

  return (
    <div className="flex flex-col h-full">
      <LayoutToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        showGrid={showGrid}
        onToggleGrid={toggleGrid}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(!snapToGrid)}
        zoom={zoom}
        onZoomIn={() => setCanvasZoom(zoom + 10)}
        onZoomOut={() => setCanvasZoom(zoom - 10)}
        onFitToScreen={fitToScreen}
        onUndo={undo}
        onRedo={redo}
        onDelete={deleteSelected}
        onRotate={() => rotateSelected(15)}
        hasSelection={!!selectedObject}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Furniture Library */}
        <FurnitureLibrary onFurnitureSelect={addFurniture} />

        {/* Canvas Area */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto bg-muted/30 flex items-center justify-center p-4"
        >
          <div className="shadow-lg rounded-lg overflow-hidden bg-white">
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* Properties Panel */}
        <PropertiesPanel
          selectedObject={selectedObject}
          onRotate={rotateSelected}
          onDelete={deleteSelected}
          unit={roomDimensions.unit}
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Room: {getRoomLabel(roomDimensions)}</span>
          <span>Grid: {showGrid ? '1 ft' : 'Off'}</span>
          <span>Snap: {snapToGrid ? 'On' : 'Off'}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Objects: {canvas?.getObjects().filter(o => {
            const data = (o as { data?: { type?: string } }).data;
            return data?.type !== 'room-outline' && data?.type !== 'grid';
          }).length || 0}</span>
          <span>Zoom: {zoom}%</span>
        </div>
      </div>
    </div>
  );
}
