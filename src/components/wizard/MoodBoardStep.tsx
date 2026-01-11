import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MoodBoardCanvas } from './MoodBoardCanvas';
import { CatalogPanel } from './CatalogPanel';
import { CanvasSidebar } from './CanvasSidebar';
import { BOQPanel } from './BOQPanel';
import { CustomProductModal } from './CustomProductModal';
import { BentChairProduct } from '@/services/bentchairCatalogService';
import type { PlacedProduct, CustomProduct, StyleReference, BOQData, RoomDimensions } from '@/types/wizard';
import { toast } from 'sonner';

interface MoodBoardStepProps {
  layoutUrl?: string;
  roomDimensions?: RoomDimensions;
  placedProducts: PlacedProduct[];
  colorPalette: string[];
  styleReferences: StyleReference[];
  boqData: BOQData;
  onAddProduct: (product: PlacedProduct) => void;
  onUpdateProduct: (productId: string, updates: Partial<PlacedProduct>) => void;
  onRemoveProduct: (productId: string) => void;
  onAddCustomProduct: (product: CustomProduct) => void;
  onAddColor: (color: string) => void;
  onRemoveColor: (color: string) => void;
  onAddStyleRef: (ref: StyleReference) => void;
  onRemoveStyleRef: (refId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function MoodBoardStep({
  layoutUrl,
  roomDimensions,
  placedProducts,
  colorPalette,
  styleReferences,
  boqData,
  onAddProduct,
  onUpdateProduct,
  onRemoveProduct,
  onAddCustomProduct,
  onAddColor,
  onRemoveColor,
  onAddStyleRef,
  onRemoveStyleRef,
  onNext,
  onBack,
}: MoodBoardStepProps) {
  const [catalogOpen, setCatalogOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showBOQ, setShowBOQ] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [zoom, setZoom] = useState(100);

  const selectedProduct = placedProducts.find(p => p.id === selectedProductId) || null;

  // Convert BentChair product to PlacedProduct
  const handleAddCatalogProduct = useCallback((product: BentChairProduct) => {
    const newProduct: PlacedProduct = {
      id: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      category: product.category,
      imageUrl: product.image,
      position: { x: 30 + Math.random() * 40, y: 30 + Math.random() * 40 },
      rotation: 0,
      dimensions: {
        width: product.dimensions?.width || 100,
        depth: product.dimensions?.depth || 100,
        height: product.dimensions?.height || 80,
      },
      price: product.price,
      isCustom: false,
    };
    onAddProduct(newProduct);
    setSelectedProductId(newProduct.id);
    toast.success(`Added ${product.name} to canvas`);
  }, [onAddProduct]);

  const handleProductDrop = useCallback((catalogProduct: any, position: { x: number; y: number }) => {
    // Handle drop from catalog panel (drag and drop)
    if (catalogProduct.type === 'product') {
      const product = catalogProduct.product as BentChairProduct;
      const newProduct: PlacedProduct = {
        id: crypto.randomUUID(),
        productId: product.id,
        name: product.name,
        category: product.category,
        imageUrl: product.image,
        position,
        rotation: 0,
        dimensions: {
          width: product.dimensions?.width || 100,
          depth: product.dimensions?.depth || 100,
          height: product.dimensions?.height || 80,
        },
        price: product.price,
        isCustom: false,
      };
      onAddProduct(newProduct);
      setSelectedProductId(newProduct.id);
      toast.success(`Added ${product.name} to canvas`);
    } else {
      // Legacy format
      const newProduct: PlacedProduct = {
        id: crypto.randomUUID(),
        productId: catalogProduct.id,
        name: catalogProduct.name,
        category: catalogProduct.category,
        imageUrl: catalogProduct.imageUrl || catalogProduct.image,
        position,
        rotation: 0,
        dimensions: catalogProduct.dimensions || { width: 100, depth: 100, height: 80 },
        price: catalogProduct.price,
        isCustom: false,
      };
      onAddProduct(newProduct);
      setSelectedProductId(newProduct.id);
    }
  }, [onAddProduct]);

  const handleProductSelect = useCallback((productId: string | null) => {
    setSelectedProductId(productId);
  }, []);

  const handleProductMove = useCallback((productId: string, position: { x: number; y: number }) => {
    onUpdateProduct(productId, { position });
  }, [onUpdateProduct]);

  const handleProductRotate = useCallback((productId: string, rotation: number) => {
    onUpdateProduct(productId, { rotation });
  }, [onUpdateProduct]);

  const handleProductDelete = useCallback((productId: string) => {
    onRemoveProduct(productId);
    if (selectedProductId === productId) {
      setSelectedProductId(null);
    }
  }, [onRemoveProduct, selectedProductId]);

  const handleCustomProductCreated = useCallback((customProduct: CustomProduct) => {
    onAddCustomProduct(customProduct);
    
    const placedProduct: PlacedProduct = {
      id: crypto.randomUUID(),
      productId: customProduct.id,
      name: customProduct.name,
      category: customProduct.category,
      imageUrl: customProduct.imageUrl,
      position: { x: 50, y: 50 },
      rotation: 0,
      dimensions: customProduct.dimensions,
      price: (customProduct.estimatedPrice.min + customProduct.estimatedPrice.max) / 2,
      description: customProduct.description,
      isCustom: true,
    };
    onAddProduct(placedProduct);
    setSelectedProductId(placedProduct.id);
  }, [onAddCustomProduct, onAddProduct]);

  // Convert style references to simple string array for sidebar
  const referenceUrls = styleReferences.filter(ref => ref.url).map(ref => ref.url);
  const notes: string[] = []; // Notes are managed separately - styleReferences only has url/name

  const canProceed = placedProducts.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-[calc(100vh-180px)] flex"
    >
      {/* Left - BentChair Catalog Panel */}
      <CatalogPanel
        isOpen={catalogOpen}
        onToggle={() => setCatalogOpen(!catalogOpen)}
        onAddProduct={handleAddCatalogProduct}
        onOpenCustomProduct={() => setShowCustomModal(true)}
      />

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-muted/10">
        {/* Canvas Header */}
        <div className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-foreground">Mood Board Canvas</h2>
            <span className="text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
              {placedProducts.length} items
            </span>
            {roomDimensions && (
              <span className="text-xs text-muted-foreground">
                {roomDimensions.width} × {roomDimensions.depth} {roomDimensions.unit}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowBOQ(true)}
            >
              View BOQ
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => toast.info('AI Style Suggestions coming soon!')}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Suggest
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <MoodBoardCanvas
            layoutUrl={layoutUrl}
            roomDimensions={roomDimensions}
            placedProducts={placedProducts}
            selectedProductId={selectedProductId || undefined}
            onProductMove={handleProductMove}
            onProductRotate={handleProductRotate}
            onProductSelect={handleProductSelect}
            onProductDelete={handleProductDelete}
            onProductDrop={handleProductDrop}
            zoom={zoom}
            onZoomChange={setZoom}
          />
        </div>

        {/* Bottom Navigation */}
        <div className="h-16 border-t border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
          <Button variant="outline" onClick={onBack}>
            ← Back to Layout
          </Button>
          <Button
            size="lg"
            className="gap-2 px-8"
            onClick={onNext}
            disabled={!canProceed}
          >
            <Wand2 className="h-4 w-4" />
            Generate AI Render
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </Button>
        </div>
      </div>

      {/* Right - Canvas Sidebar */}
      <CanvasSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        references={referenceUrls}
        onAddReference={(url) => {
          const newRef: StyleReference = {
            id: crypto.randomUUID(),
            url,
            type: 'uploaded',
          };
          onAddStyleRef(newRef);
        }}
        onRemoveReference={(idx) => {
          const urlRefs = styleReferences.filter(ref => ref.url);
          const ref = urlRefs[idx];
          if (ref) onRemoveStyleRef(ref.id);
        }}
        notes={notes}
        onAddNote={() => {
          // Notes could be stored in a separate state or as part of wizard session
          // For now, just show a toast
          toast.info('Design notes feature coming soon!');
        }}
        onRemoveNote={() => {}}
        colorPalette={colorPalette}
        onAddColor={onAddColor}
        onRemoveColor={(idx) => {
          const color = colorPalette[idx];
          if (color) onRemoveColor(color);
        }}
      />

      {/* BOQ Panel */}
      <BOQPanel
        boqData={boqData}
        isOpen={showBOQ}
        onClose={() => setShowBOQ(false)}
      />

      {/* Custom Product Modal */}
      <CustomProductModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onProductCreated={handleCustomProductCreated}
      />
    </motion.div>
  );
}
