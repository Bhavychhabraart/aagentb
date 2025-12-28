import { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas as FabricCanvas, Rect, Circle, Group, FabricText, Line, FabricObject } from 'fabric';
import { 
  LayoutTool, 
  RoomDimensions, 
  FurnitureBlockDefinition,
  PIXELS_PER_INCH,
  DEFAULT_WALL_THICKNESS,
  AIZoneSelection
} from '@/types/layout-creator';

interface UseLayoutCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  roomDimensions: RoomDimensions;
}

interface HistoryEntry {
  json: object;
}

export function useLayoutCanvas({ canvasRef, roomDimensions }: UseLayoutCanvasProps) {
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<LayoutTool>('select');
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(12); // 1 foot
  const [zoom, setZoom] = useState(100);
  const [aiZoneSelection, setAIZoneSelection] = useState<AIZoneSelection | null>(null);
  
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);
  const isLoadingRef = useRef(false);
  const wallStartRef = useRef<{ x: number; y: number } | null>(null);
  const zoneStartRef = useRef<{ x: number; y: number } | null>(null);
  const zoneRectRef = useRef<Rect | null>(null);

  // Convert dimensions to pixels
  const getPixelDimensions = useCallback(() => {
    const multiplier = roomDimensions.unit === 'ft' ? 12 : 
                       roomDimensions.unit === 'm' ? 39.37 : 
                       roomDimensions.unit === 'cm' ? 0.3937 : 1;
    return {
      width: roomDimensions.width * multiplier * PIXELS_PER_INCH,
      depth: roomDimensions.depth * multiplier * PIXELS_PER_INCH,
    };
  }, [roomDimensions]);

  // Initialize canvas
  const initCanvas = useCallback(() => {
    if (!canvasRef.current) return null;

    const { width, depth } = getPixelDimensions();
    const padding = 100;
    
    const fabricCanvas = new FabricCanvas(canvasRef.current, {
      width: width + padding * 2,
      height: depth + padding * 2,
      backgroundColor: '#f8fafc',
      selection: true,
      preserveObjectStacking: true,
    });

    // Draw room outline
    const roomOutline = new Rect({
      left: padding,
      top: padding,
      width: width,
      height: depth,
      fill: '#ffffff',
      stroke: '#374151',
      strokeWidth: 3,
      selectable: false,
      evented: false,
      data: { type: 'room-outline' }
    });
    fabricCanvas.add(roomOutline);

    // Draw grid
    if (showGrid) {
      drawGrid(fabricCanvas, width, depth, padding);
    }

    setCanvas(fabricCanvas);
    saveToHistory(fabricCanvas);

    return fabricCanvas;
  }, [canvasRef, getPixelDimensions, showGrid]);

  // Draw grid
  const drawGrid = (fabricCanvas: FabricCanvas, width: number, depth: number, padding: number) => {
    const gridPixels = gridSize * PIXELS_PER_INCH;
    
    // Remove existing grid
    const existingGrid = fabricCanvas.getObjects().filter((obj) => 
      (obj as FabricObject & { data?: { type?: string } }).data?.type === 'grid'
    );
    existingGrid.forEach(obj => fabricCanvas.remove(obj));

    // Draw vertical lines
    for (let x = 0; x <= width; x += gridPixels) {
      const line = new Line([padding + x, padding, padding + x, padding + depth], {
        stroke: '#e5e7eb',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        data: { type: 'grid' }
      });
      fabricCanvas.add(line);
      fabricCanvas.sendObjectToBack(line);
    }

    // Draw horizontal lines
    for (let y = 0; y <= depth; y += gridPixels) {
      const line = new Line([padding, padding + y, padding + width, padding + y], {
        stroke: '#e5e7eb',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        data: { type: 'grid' }
      });
      fabricCanvas.add(line);
      fabricCanvas.sendObjectToBack(line);
    }

    // Send room outline to just above grid
    const roomOutline = fabricCanvas.getObjects().find((obj) => 
      (obj as FabricObject & { data?: { type?: string } }).data?.type === 'room-outline'
    );
    if (roomOutline) {
      fabricCanvas.bringObjectToFront(roomOutline);
      fabricCanvas.sendObjectBackwards(roomOutline);
    }
  };

  // Toggle grid
  const toggleGrid = useCallback(() => {
    if (!canvas) return;
    const newShowGrid = !showGrid;
    setShowGrid(newShowGrid);
    
    if (newShowGrid) {
      const { width, depth } = getPixelDimensions();
      drawGrid(canvas, width, depth, 100);
    } else {
      const gridLines = canvas.getObjects().filter((obj) => 
        (obj as FabricObject & { data?: { type?: string } }).data?.type === 'grid'
      );
      gridLines.forEach(obj => canvas.remove(obj));
    }
    canvas.renderAll();
  }, [canvas, showGrid, getPixelDimensions, gridSize]);

  // Save to history
  const saveToHistory = (fabricCanvas: FabricCanvas) => {
    if (isLoadingRef.current) return;
    
    const json = fabricCanvas.toJSON();
    historyIndexRef.current++;
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current);
    historyRef.current.push({ json });
  };

  // Undo
  const undo = useCallback(() => {
    if (!canvas || historyIndexRef.current <= 0) return;
    
    isLoadingRef.current = true;
    historyIndexRef.current--;
    const entry = historyRef.current[historyIndexRef.current];
    
    canvas.loadFromJSON(entry.json).then(() => {
      canvas.renderAll();
      isLoadingRef.current = false;
    });
  }, [canvas]);

  // Redo
  const redo = useCallback(() => {
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;
    
    isLoadingRef.current = true;
    historyIndexRef.current++;
    const entry = historyRef.current[historyIndexRef.current];
    
    canvas.loadFromJSON(entry.json).then(() => {
      canvas.renderAll();
      isLoadingRef.current = false;
    });
  }, [canvas]);

  // Snap to grid
  const snapPosition = useCallback((value: number): number => {
    if (!snapToGrid) return value;
    const gridPixels = gridSize * PIXELS_PER_INCH;
    return Math.round(value / gridPixels) * gridPixels;
  }, [snapToGrid, gridSize]);

  // Add wall
  const addWall = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    if (!canvas) return;

    const width = Math.abs(x2 - x1) || DEFAULT_WALL_THICKNESS * PIXELS_PER_INCH;
    const height = Math.abs(y2 - y1) || DEFAULT_WALL_THICKNESS * PIXELS_PER_INCH;

    const wall = new Rect({
      left: Math.min(x1, x2),
      top: Math.min(y1, y2),
      width: width,
      height: height < 10 ? DEFAULT_WALL_THICKNESS * PIXELS_PER_INCH : height,
      fill: '#374151',
      stroke: '#1f2937',
      strokeWidth: 1,
      data: { type: 'wall', thickness: DEFAULT_WALL_THICKNESS }
    });

    canvas.add(wall);
    canvas.renderAll();
    saveToHistory(canvas);
  }, [canvas]);

  // Add door
  const addDoor = useCallback(() => {
    if (!canvas) return;

    const doorWidth = 36 * PIXELS_PER_INCH;
    const doorDepth = 6 * PIXELS_PER_INCH;
    
    // Door frame
    const frame = new Rect({
      left: 0,
      top: 0,
      width: doorWidth,
      height: doorDepth,
      fill: '#fef3c7',
      stroke: '#d97706',
      strokeWidth: 2,
    });

    // Door swing arc (simplified as a line)
    const swing = new Line([0, doorDepth, doorWidth, doorDepth + doorWidth * 0.7], {
      stroke: '#d97706',
      strokeWidth: 1,
      strokeDashArray: [5, 5],
    });

    const door = new Group([frame, swing], {
      left: 200,
      top: 200,
    });
    (door as any).data = { type: 'door', swingDirection: 'right' };

    canvas.add(door);
    canvas.setActiveObject(door);
    canvas.renderAll();
    saveToHistory(canvas);
  }, [canvas]);

  // Add window
  const addWindow = useCallback(() => {
    if (!canvas) return;

    const windowWidth = 36 * PIXELS_PER_INCH;
    const windowDepth = 6 * PIXELS_PER_INCH;

    const windowRect = new Rect({
      left: 200,
      top: 200,
      width: windowWidth,
      height: windowDepth,
      fill: '#dbeafe',
      stroke: '#3b82f6',
      strokeWidth: 2,
      data: { type: 'window' }
    });

    canvas.add(windowRect);
    canvas.setActiveObject(windowRect);
    canvas.renderAll();
    saveToHistory(canvas);
  }, [canvas]);

  // Add furniture
  const addFurniture = useCallback((furniture: FurnitureBlockDefinition) => {
    if (!canvas) return;

    const width = furniture.width * PIXELS_PER_INCH;
    const depth = furniture.depth * PIXELS_PER_INCH;

    let shape: Rect | Circle;
    if (furniture.shape === 'circle') {
      shape = new Circle({
        radius: Math.min(width, depth) / 2,
        fill: furniture.color,
        stroke: '#1f2937',
        strokeWidth: 1,
        originX: 'center',
        originY: 'center',
      });
    } else {
      shape = new Rect({
        width: width,
        height: depth,
        fill: furniture.color,
        stroke: '#1f2937',
        strokeWidth: 1,
        rx: 4,
        ry: 4,
      });
    }

    const label = new FabricText(furniture.name, {
      fontSize: 12,
      fill: '#ffffff',
      fontFamily: 'sans-serif',
      originX: 'center',
      originY: 'center',
      left: furniture.shape === 'circle' ? 0 : width / 2,
      top: furniture.shape === 'circle' ? 0 : depth / 2,
    });

    const group = new Group([shape, label], {
      left: 200,
      top: 200,
    });
    (group as any).data = { 
      type: 'furniture',
      furnitureId: furniture.id,
      name: furniture.name,
      category: furniture.category,
    };

    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();
    saveToHistory(canvas);
  }, [canvas]);

  // Delete selected
  const deleteSelected = useCallback(() => {
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
      canvas.renderAll();
      saveToHistory(canvas);
      setSelectedObject(null);
    }
  }, [canvas]);

  // Rotate selected
  const rotateSelected = useCallback((degrees: number = 15) => {
    if (!canvas) return;
    
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      const currentAngle = activeObject.angle || 0;
      activeObject.rotate(currentAngle + degrees);
      canvas.renderAll();
      saveToHistory(canvas);
    }
  }, [canvas]);

  // Set zoom
  const setCanvasZoom = useCallback((newZoom: number) => {
    if (!canvas) return;
    
    const clampedZoom = Math.max(25, Math.min(200, newZoom));
    const scale = clampedZoom / 100;
    
    canvas.setZoom(scale);
    setZoom(clampedZoom);
  }, [canvas]);

  // Fit to screen
  const fitToScreen = useCallback(() => {
    if (!canvas || !canvasRef.current) return;
    
    const containerWidth = canvasRef.current.parentElement?.clientWidth || 800;
    const containerHeight = canvasRef.current.parentElement?.clientHeight || 600;
    
    const { width, depth } = getPixelDimensions();
    const padding = 200;
    
    const scaleX = containerWidth / (width + padding);
    const scaleY = containerHeight / (depth + padding);
    const scale = Math.min(scaleX, scaleY, 1);
    
    setCanvasZoom(scale * 100);
  }, [canvas, canvasRef, getPixelDimensions, setCanvasZoom]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    if (!canvas) return;
    
    canvas.getObjects().forEach((obj) => {
      const objData = (obj as FabricObject & { data?: { type?: string } }).data;
      if (objData?.type !== 'room-outline' && objData?.type !== 'grid') {
        canvas.remove(obj);
      }
    });
    canvas.renderAll();
    saveToHistory(canvas);
  }, [canvas]);

  // Export as JSON
  const exportAsJSON = useCallback(() => {
    if (!canvas) return null;
    return canvas.toJSON();
  }, [canvas]);

  // Load from JSON
  const loadFromJSON = useCallback((json: object) => {
    if (!canvas) return;
    
    isLoadingRef.current = true;
    canvas.loadFromJSON(json).then(() => {
      canvas.renderAll();
      isLoadingRef.current = false;
      saveToHistory(canvas);
    });
  }, [canvas]);

  // Export as image
  const exportAsImage = useCallback((format: 'png' | 'jpeg' = 'png') => {
    if (!canvas) return null;
    return canvas.toDataURL({ format, quality: 1, multiplier: 1 });
  }, [canvas]);

  // Add furniture at specific position (for AI zone generation)
  const addFurnitureAtPosition = useCallback((furniture: FurnitureBlockDefinition, x: number, y: number, rotation: number = 0) => {
    if (!canvas) return;

    const width = furniture.width * PIXELS_PER_INCH;
    const depth = furniture.depth * PIXELS_PER_INCH;

    let shape: Rect | Circle;
    if (furniture.shape === 'circle') {
      shape = new Circle({
        radius: Math.min(width, depth) / 2,
        fill: furniture.color,
        stroke: '#1f2937',
        strokeWidth: 1,
        originX: 'center',
        originY: 'center',
      });
    } else {
      shape = new Rect({
        width: width,
        height: depth,
        fill: furniture.color,
        stroke: '#1f2937',
        strokeWidth: 1,
        rx: 4,
        ry: 4,
      });
    }

    const label = new FabricText(furniture.name, {
      fontSize: 12,
      fill: '#ffffff',
      fontFamily: 'sans-serif',
      originX: 'center',
      originY: 'center',
      left: furniture.shape === 'circle' ? 0 : width / 2,
      top: furniture.shape === 'circle' ? 0 : depth / 2,
    });

    const group = new Group([shape, label], {
      left: x,
      top: y,
      angle: rotation,
    });
    (group as any).data = { 
      type: 'furniture',
      furnitureId: furniture.id,
      name: furniture.name,
      category: furniture.category,
    };

    canvas.add(group);
    canvas.renderAll();
  }, [canvas]);

  // Clear AI zone selection
  const clearAIZone = useCallback(() => {
    if (!canvas || !zoneRectRef.current) return;
    canvas.remove(zoneRectRef.current);
    zoneRectRef.current = null;
    setAIZoneSelection(null);
    canvas.renderAll();
  }, [canvas]);

  // Setup event listeners
  useEffect(() => {
    if (!canvas) return;

    const handleSelection = () => {
      setSelectedObject(canvas.getActiveObject() || null);
    };

    const handleModified = () => {
      saveToHistory(canvas);
    };

    const handleMouseDown = (e: { pointer?: { x: number; y: number } }) => {
      if (activeTool === 'wall' && e.pointer) {
        wallStartRef.current = { x: snapPosition(e.pointer.x), y: snapPosition(e.pointer.y) };
      }
      
      // AI Zone selection start
      if (activeTool === 'ai-zone' && e.pointer) {
        zoneStartRef.current = { x: e.pointer.x, y: e.pointer.y };
        
        // Remove any existing zone rect
        if (zoneRectRef.current) {
          canvas.remove(zoneRectRef.current);
        }
        
        // Create new zone selection rect
        zoneRectRef.current = new Rect({
          left: e.pointer.x,
          top: e.pointer.y,
          width: 0,
          height: 0,
          fill: 'rgba(99, 102, 241, 0.15)',
          stroke: '#6366f1',
          strokeWidth: 2,
          strokeDashArray: [8, 4],
          selectable: false,
          evented: false,
          data: { type: 'ai-zone-selection' }
        });
        canvas.add(zoneRectRef.current);
      }
    };

    const handleMouseMove = (e: { pointer?: { x: number; y: number } }) => {
      // Update zone rect while drawing
      if (activeTool === 'ai-zone' && zoneStartRef.current && zoneRectRef.current && e.pointer) {
        const left = Math.min(zoneStartRef.current.x, e.pointer.x);
        const top = Math.min(zoneStartRef.current.y, e.pointer.y);
        const width = Math.abs(e.pointer.x - zoneStartRef.current.x);
        const height = Math.abs(e.pointer.y - zoneStartRef.current.y);
        
        zoneRectRef.current.set({ left, top, width, height });
        canvas.renderAll();
      }
    };

    const handleMouseUp = (e: { pointer?: { x: number; y: number } }) => {
      if (activeTool === 'wall' && wallStartRef.current && e.pointer) {
        const endX = snapPosition(e.pointer.x);
        const endY = snapPosition(e.pointer.y);
        addWall(wallStartRef.current.x, wallStartRef.current.y, endX, endY);
        wallStartRef.current = null;
      }
      
      // AI Zone selection complete
      if (activeTool === 'ai-zone' && zoneStartRef.current && zoneRectRef.current && e.pointer) {
        const left = Math.min(zoneStartRef.current.x, e.pointer.x);
        const top = Math.min(zoneStartRef.current.y, e.pointer.y);
        const width = Math.abs(e.pointer.x - zoneStartRef.current.x);
        const height = Math.abs(e.pointer.y - zoneStartRef.current.y);
        
        // Only trigger if zone is large enough (at least 50px)
        if (width > 50 && height > 50) {
          setAIZoneSelection({ x: left, y: top, width, height });
        } else {
          // Zone too small, remove it
          canvas.remove(zoneRectRef.current);
          zoneRectRef.current = null;
        }
        
        zoneStartRef.current = null;
      }
    };

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', handleSelection);
    canvas.on('object:modified', handleModified);
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    // Snap to grid on move
    canvas.on('object:moving', (e) => {
      if (snapToGrid && e.target) {
        e.target.set({
          left: snapPosition(e.target.left || 0),
          top: snapPosition(e.target.top || 0),
        });
      }
    });

    return () => {
      canvas.off('selection:created', handleSelection);
      canvas.off('selection:updated', handleSelection);
      canvas.off('selection:cleared', handleSelection);
      canvas.off('object:modified', handleModified);
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [canvas, activeTool, snapToGrid, snapPosition, addWall]);

  // Handle tool changes
  useEffect(() => {
    if (!canvas) return;

    canvas.selection = activeTool === 'select';
    canvas.defaultCursor = activeTool === 'ai-zone' ? 'crosshair' : 'default';
    canvas.forEachObject((obj) => {
      const objData = (obj as FabricObject & { data?: { type?: string } }).data;
      if (objData?.type !== 'room-outline' && objData?.type !== 'grid' && objData?.type !== 'ai-zone-selection') {
        obj.selectable = activeTool === 'select';
      }
    });
    canvas.renderAll();
  }, [canvas, activeTool]);

  return {
    canvas,
    initCanvas,
    activeTool,
    setActiveTool,
    selectedObject,
    showGrid,
    toggleGrid,
    snapToGrid,
    setSnapToGrid,
    gridSize,
    setGridSize,
    zoom,
    setCanvasZoom,
    fitToScreen,
    undo,
    redo,
    addWall,
    addDoor,
    addWindow,
    addFurniture,
    addFurnitureAtPosition,
    deleteSelected,
    rotateSelected,
    clearCanvas,
    exportAsJSON,
    loadFromJSON,
    exportAsImage,
    aiZoneSelection,
    clearAIZone,
    saveToHistory,
  };
}
