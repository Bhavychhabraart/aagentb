import { useRef, useEffect, useState } from 'react';
import { RoomDimensions, FURNITURE_LIBRARY, AIZoneSelection } from '@/types/layout-creator';
import { useLayoutCanvas } from '@/hooks/useLayoutCanvas';
import { LayoutToolbar } from './LayoutToolbar';
import { FurnitureLibrary } from './FurnitureLibrary';
import { PropertiesPanel } from './PropertiesPanel';
import { AIZonePromptModal } from './AIZonePromptModal';
import { getRoomLabel } from '@/utils/layoutExport';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface LayoutCanvasProps {
  roomDimensions: RoomDimensions;
  onCanvasReady: (methods: ReturnType<typeof useLayoutCanvas>) => void;
}

export function LayoutCanvas({ roomDimensions, onCanvasReady }: LayoutCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const [showAIZoneModal, setShowAIZoneModal] = useState(false);
  const [isGeneratingZone, setIsGeneratingZone] = useState(false);
  
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
    addFurnitureAtPosition,
    deleteSelected,
    rotateSelected,
    aiZoneSelection,
    clearAIZone,
    saveToHistory,
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

  // Show modal when zone is selected
  useEffect(() => {
    if (aiZoneSelection && aiZoneSelection.width > 50 && aiZoneSelection.height > 50) {
      setShowAIZoneModal(true);
    }
  }, [aiZoneSelection]);

  // Handle AI zone generation
  const handleAIZoneGenerate = async (prompt: string, useBrainKnowledge: boolean) => {
    if (!aiZoneSelection || !canvas) return;
    
    setIsGeneratingZone(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-layout', {
        body: {
          prompt,
          roomDimensions,
          useBrainKnowledge,
          userId: user?.id,
          zoneConstraints: {
            x: aiZoneSelection.x,
            y: aiZoneSelection.y,
            width: aiZoneSelection.width,
            height: aiZoneSelection.height,
          },
        },
      });

      if (error) throw error;

      if (data?.furniture && Array.isArray(data.furniture)) {
        // Add each furniture item at the specified position
        data.furniture.forEach((item: { id: string; x: number; y: number; rotation?: number }) => {
          const furnitureDef = FURNITURE_LIBRARY.find(f => f.id === item.id);
          if (furnitureDef) {
            addFurnitureAtPosition(furnitureDef, item.x, item.y, item.rotation || 0);
          }
        });
        
        // Save to history after all furniture added
        saveToHistory(canvas);
        
        toast.success(`Added ${data.furniture.length} items to the zone`);
        
        if (data.suggestions?.length > 0) {
          toast.info(data.suggestions[0], { duration: 5000 });
        }
      }
      
      // Clear zone and close modal
      clearAIZone();
      setShowAIZoneModal(false);
      setActiveTool('select');
      
    } catch (error) {
      console.error('AI zone generation error:', error);
      toast.error('Failed to generate furniture for zone');
    } finally {
      setIsGeneratingZone(false);
    }
  };

  // Handle modal close
  const handleModalClose = (open: boolean) => {
    setShowAIZoneModal(open);
    if (!open) {
      clearAIZone();
    }
  };

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
        case 'a':
          if (!e.ctrlKey && !e.metaKey) {
            setActiveTool('ai-zone');
          }
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
        case 'escape':
          if (activeTool === 'ai-zone') {
            clearAIZone();
            setActiveTool('select');
          }
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
  }, [setActiveTool, addDoor, addWindow, rotateSelected, deleteSelected, undo, redo, zoom, setCanvasZoom, fitToScreen, activeTool, clearAIZone]);

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
          {activeTool === 'ai-zone' && (
            <span className="text-primary font-medium">Draw a zone to generate furniture</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>Objects: {canvas?.getObjects().filter(o => {
            const data = (o as { data?: { type?: string } }).data;
            return data?.type !== 'room-outline' && data?.type !== 'grid' && data?.type !== 'ai-zone-selection';
          }).length || 0}</span>
          <span>Zoom: {zoom}%</span>
        </div>
      </div>

      {/* AI Zone Prompt Modal */}
      <AIZonePromptModal
        open={showAIZoneModal}
        onOpenChange={handleModalClose}
        zone={aiZoneSelection}
        onGenerate={handleAIZoneGenerate}
        isGenerating={isGeneratingZone}
        unit={roomDimensions.unit}
      />
    </div>
  );
}
