import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Move, RotateCw, Trash2, Copy, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
}: MoodBoardCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedProduct, setDraggedProduct] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Seating': 'hsl(var(--primary))',
      'Tables': 'hsl(220, 70%, 50%)',
      'Storage': 'hsl(280, 60%, 50%)',
      'Lighting': 'hsl(45, 90%, 50%)',
      'Decor': 'hsl(340, 70%, 50%)',
      'Rugs': 'hsl(160, 60%, 40%)',
      'Beds': 'hsl(200, 60%, 50%)',
      'Custom': 'hsl(var(--primary))',
    };
    return colors[category] || 'hsl(var(--muted-foreground))';
  };

  // Handle drop from library
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const productData = e.dataTransfer.getData('product');
    if (!productData || !canvasRef.current) return;

    const product = JSON.parse(productData);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onProductDrop(product, { x, y });
  }, [onProductDrop]);

  // Handle product drag
  const handleProductMouseDown = (e: React.MouseEvent, product: PlacedProduct) => {
    e.stopPropagation();
    setDraggedProduct(product.id);
    setDragOffset({
      x: e.clientX - (product.position.x * (canvasRef.current?.clientWidth || 0) / 100),
      y: e.clientY - (product.position.y * (canvasRef.current?.clientHeight || 0) / 100),
    });
    onProductSelect(product.id);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedProduct || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - dragOffset.x) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - dragOffset.y) / rect.height) * 100));

    onProductMove(draggedProduct, { x, y });
  }, [draggedProduct, dragOffset, onProductMove]);

  const handleMouseUp = useCallback(() => {
    setDraggedProduct(null);
  }, []);

  useEffect(() => {
    if (draggedProduct) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedProduct, handleMouseMove, handleMouseUp]);

  return (
    <div className="relative h-full flex flex-col bg-muted/20">
      {/* Canvas Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setZoom(z => Math.min(2, z + 0.1))}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Grid Overlay Info */}
      {roomDimensions && (
        <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-muted-foreground">
          {roomDimensions.width} × {roomDimensions.depth} {roomDimensions.unit}
        </div>
      )}

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden"
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'center',
        }}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => onProductSelect(null)}
      >
        {/* Layout Background */}
        {layoutUrl ? (
          <img
            src={layoutUrl}
            alt="Floor plan"
            className="absolute inset-0 w-full h-full object-contain opacity-30"
          />
        ) : (
          <div className="absolute inset-0 grid-bg opacity-10" />
        )}

        {/* Grid Overlay */}
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: 'linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            opacity: 0.3
          }}
        />

        {/* Placed Products */}
        {placedProducts.map((product) => {
          const isSelected = selectedProductId === product.id;
          const color = getCategoryColor(product.category);

          return (
            <motion.div
              key={product.id}
              className={`
                absolute cursor-move transition-shadow
                ${isSelected ? 'z-20' : 'z-10'}
              `}
              style={{
                left: `${product.position.x}%`,
                top: `${product.position.y}%`,
                transform: `translate(-50%, -50%) rotate(${product.rotation}deg)`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              onMouseDown={(e) => handleProductMouseDown(e, product)}
            >
              {/* Product Block */}
              <div
                className={`
                  relative rounded-lg border-2 shadow-lg transition-all
                  ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                `}
                style={{
                  width: `${Math.max(60, product.dimensions.width / 3)}px`,
                  height: `${Math.max(40, product.dimensions.depth / 3)}px`,
                  backgroundColor: `${color}20`,
                  borderColor: color,
                }}
              >
                {/* Product Image */}
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="absolute inset-1 rounded object-cover"
                  />
                )}

                {/* Label */}
                <div
                  className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: color, color: 'white' }}
                >
                  {product.name}
                </div>

                {/* Selection Controls */}
                {isSelected && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        onProductRotate(product.id, (product.rotation + 45) % 360);
                      }}
                    >
                      <RotateCw className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        onProductDelete(product.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Empty State */}
        {placedProducts.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Move className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Drag products here</p>
              <p className="text-sm">from the library on the left</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
