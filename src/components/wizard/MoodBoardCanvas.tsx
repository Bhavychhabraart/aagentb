import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Move, RotateCw, Trash2, Copy, ZoomIn, ZoomOut, Maximize2, Hand, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PlacedProduct, RoomDimensions } from '@/types/wizard';

interface MoodBoardCanvasProps {
  layoutUrl?: string;
  roomDimensions?: RoomDimensions;
  placedProducts: PlacedProduct[];
  selectedProductId?: string;
  onProductMove: (productId: string, position: { x: number; y: number }) => void;
  onProductRotate: (productId: string, rotation: number) => void;
  onProductSelect: (productId: string | null) => void;
  onProductDelete: (productId: string) => void;
  onProductDrop: (product: any, position: { x: number; y: number }) => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

export function MoodBoardCanvas({
  layoutUrl,
  roomDimensions,
  placedProducts,
  selectedProductId,
  onProductMove,
  onProductRotate,
  onProductSelect,
  onProductDelete,
  onProductDrop,
  zoom = 100,
  onZoomChange,
}: MoodBoardCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [internalZoom, setInternalZoom] = useState(zoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedProduct, setDraggedProduct] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [activeTool, setActiveTool] = useState<'select' | 'pan'>('select');

  const currentZoom = onZoomChange ? zoom : internalZoom;
  const setCurrentZoom = onZoomChange || setInternalZoom;

  // Category colors for product blocks
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Seating': 'hsl(var(--primary))',
      'Sofas & Benches': 'hsl(var(--primary))',
      'Chairs & Pouffes': 'hsl(220, 70%, 50%)',
      'Tables': 'hsl(280, 60%, 50%)',
      'Tables & Consoles': 'hsl(280, 60%, 50%)',
      'Lighting': 'hsl(45, 90%, 50%)',
      'Decor': 'hsl(340, 70%, 50%)',
      'Rugs': 'hsl(160, 60%, 40%)',
      'Bedroom': 'hsl(200, 60%, 50%)',
      'Outdoor': 'hsl(120, 50%, 45%)',
      'Custom': 'hsl(var(--primary))',
    };
    return colors[category] || 'hsl(var(--muted-foreground))';
  };

  // Handle drop from catalog panel
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    // Try new JSON format first
    const jsonData = e.dataTransfer.getData('application/json');
    if (jsonData && canvasRef.current) {
      try {
        const data = JSON.parse(jsonData);
        const rect = canvasRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        onProductDrop(data, { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) });
        return;
      } catch (err) {
        console.error('Failed to parse JSON drop data:', err);
      }
    }

    // Fallback to legacy format
    const productData = e.dataTransfer.getData('product');
    if (productData && canvasRef.current) {
      const product = JSON.parse(productData);
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      onProductDrop(product, { x, y });
    }
  }, [onProductDrop]);

  // Handle product drag start
  const handleProductMouseDown = (e: React.MouseEvent, product: PlacedProduct) => {
    if (activeTool === 'pan') return;
    e.stopPropagation();
    setDraggedProduct(product.id);
    setDragOffset({
      x: e.clientX - (product.position.x * (canvasRef.current?.clientWidth || 0) / 100),
      y: e.clientY - (product.position.y * (canvasRef.current?.clientHeight || 0) / 100),
    });
    onProductSelect(product.id);
  };

  // Handle canvas pan
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'pan' || e.button === 1) { // Middle click or pan tool
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else {
      onProductSelect(null);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (!draggedProduct || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scale = currentZoom / 100;
    const x = Math.max(5, Math.min(95, ((e.clientX - dragOffset.x - pan.x) / (rect.width * scale)) * 100));
    const y = Math.max(5, Math.min(95, ((e.clientY - dragOffset.y - pan.y) / (rect.height * scale)) * 100));

    onProductMove(draggedProduct, { x, y });
  }, [draggedProduct, dragOffset, onProductMove, isPanning, panStart, pan, currentZoom]);

  const handleMouseUp = useCallback(() => {
    setDraggedProduct(null);
    setIsPanning(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedProductId) {
          onProductDelete(selectedProductId);
        }
      }
      if (e.key === ' ') {
        e.preventDefault();
        setActiveTool('pan');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setActiveTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedProductId, onProductDelete]);

  // Mouse event listeners
  useEffect(() => {
    if (draggedProduct || isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedProduct, isPanning, handleMouseMove, handleMouseUp]);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -5 : 5;
      setCurrentZoom(Math.max(50, Math.min(200, currentZoom + delta)));
    }
  }, [currentZoom, setCurrentZoom]);

  const handleZoomIn = () => setCurrentZoom(Math.min(200, currentZoom + 10));
  const handleZoomOut = () => setCurrentZoom(Math.max(50, currentZoom - 10));
  const handleResetView = () => {
    setCurrentZoom(100);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative h-full flex flex-col bg-gradient-to-br from-muted/20 to-muted/40 overflow-hidden">
      {/* Canvas Area */}
      <div
        ref={canvasRef}
        className={cn(
          "flex-1 relative",
          activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        )}
        style={{
          transform: `scale(${currentZoom / 100}) translate(${pan.x / (currentZoom / 100)}px, ${pan.y / (currentZoom / 100)}px)`,
          transformOrigin: 'center',
        }}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onMouseDown={handleCanvasMouseDown}
        onWheel={handleWheel}
      >
        {/* Layout Background */}
        {layoutUrl ? (
          <img
            src={layoutUrl}
            alt="Floor plan"
            className="absolute inset-0 w-full h-full object-contain opacity-20 pointer-events-none select-none"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-muted/30" />
        )}

        {/* Grid Overlay */}
        <AnimatePresence>
          {showGrid && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none" 
              style={{
                backgroundImage: `
                  linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                  linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
              }}
            />
          )}
        </AnimatePresence>

        {/* Placed Products */}
        <AnimatePresence>
          {placedProducts.map((product) => {
            const isSelected = selectedProductId === product.id;
            const isDragging = draggedProduct === product.id;
            const color = getCategoryColor(product.category);

            return (
              <motion.div
                key={product.id}
                className={cn(
                  "absolute transition-shadow group",
                  activeTool === 'select' ? 'cursor-move' : 'cursor-default',
                  isSelected && 'z-20',
                  isDragging && 'z-30'
                )}
                style={{
                  left: `${product.position.x}%`,
                  top: `${product.position.y}%`,
                  transform: `translate(-50%, -50%) rotate(${product.rotation}deg)`,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: isDragging ? 1.05 : 1, 
                  opacity: 1,
                  boxShadow: isSelected ? '0 0 0 2px hsl(var(--primary))' : 'none'
                }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.02 }}
                onMouseDown={(e) => handleProductMouseDown(e, product)}
              >
                {/* Product Card */}
                <div
                  className={cn(
                    "relative rounded-xl overflow-hidden shadow-lg transition-all bg-card border-2",
                    isSelected ? "ring-2 ring-primary ring-offset-2 border-primary" : "border-border/50 hover:border-primary/30"
                  )}
                  style={{
                    width: `${Math.max(80, (product.dimensions.width || 100) / 2)}px`,
                    height: `${Math.max(60, (product.dimensions.depth || 80) / 2)}px`,
                  }}
                >
                  {/* Product Image */}
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover pointer-events-none select-none"
                      draggable={false}
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: `${color}30` }}
                    >
                      <span className="text-xs text-muted-foreground">{product.category}</span>
                    </div>
                  )}

                  {/* Category Indicator */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: color }}
                  />
                </div>

                {/* Product Label */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap"
                >
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full shadow-md"
                    style={{ 
                      backgroundColor: color, 
                      color: 'white',
                    }}
                  >
                    {product.name.length > 15 ? product.name.slice(0, 15) + '...' : product.name}
                  </span>
                </motion.div>

                {/* Selection Controls */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute -top-11 left-1/2 -translate-x-1/2 flex gap-1 bg-card/95 backdrop-blur-sm rounded-lg p-1 shadow-lg border border-border"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          onProductRotate(product.id, (product.rotation + 45) % 360);
                        }}
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onProductDelete(product.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty State */}
        {placedProducts.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Move className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <p className="text-lg font-medium text-foreground/80">Drag products here</p>
              <p className="text-sm text-muted-foreground mt-1">from the catalog on the left</p>
            </motion.div>
          </div>
        )}
      </div>

      {/* Floating Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-card/95 backdrop-blur-md border border-border rounded-full px-2 py-1.5 shadow-xl"
      >
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full" 
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium w-12 text-center tabular-nums">
          {currentZoom}%
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-full" 
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-5 bg-border mx-1" />
        
        <Button
          variant={activeTool === 'pan' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => setActiveTool(activeTool === 'pan' ? 'select' : 'pan')}
          title="Pan (hold Space)"
        >
          <Hand className="h-4 w-4" />
        </Button>
        <Button
          variant={showGrid ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => setShowGrid(!showGrid)}
          title="Toggle Grid"
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={handleResetView}
          title="Reset View"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}
