import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MoodBoardToolbar } from './MoodBoardToolbar';
import { ProductLibraryPanel } from './ProductLibraryPanel';
import { MoodBoardCanvas } from './MoodBoardCanvas';
import { PropertiesPanel } from './PropertiesPanel';
import { BottomDock } from './BottomDock';
import { BOQPanel } from './BOQPanel';
import { CustomProductModal } from './CustomProductModal';
import type { PlacedProduct, CustomProduct, StyleReference, BOQData, RoomDimensions } from '@/types/wizard';

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
  const [activeTool, setActiveTool] = useState('select');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showBOQ, setShowBOQ] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  const selectedProduct = placedProducts.find(p => p.id === selectedProductId) || null;

  const handleProductDrop = useCallback((catalogProduct: any, position: { x: number; y: number }) => {
    const newProduct: PlacedProduct = {
      id: crypto.randomUUID(),
      productId: catalogProduct.id,
      name: catalogProduct.name,
      category: catalogProduct.category,
      imageUrl: catalogProduct.imageUrl,
      position,
      rotation: 0,
      dimensions: catalogProduct.dimensions,
      price: catalogProduct.price,
      isCustom: false,
    };
    onAddProduct(newProduct);
    setSelectedProductId(newProduct.id);
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
    
    // Also add as placed product at center
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

  const handleDuplicateProduct = useCallback(() => {
    if (!selectedProduct) return;
    
    const duplicate: PlacedProduct = {
      ...selectedProduct,
      id: crypto.randomUUID(),
      position: {
        x: Math.min(90, selectedProduct.position.x + 5),
        y: Math.min(90, selectedProduct.position.y + 5),
      },
    };
    onAddProduct(duplicate);
    setSelectedProductId(duplicate.id);
  }, [selectedProduct, onAddProduct]);

  const canProceed = placedProducts.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-[calc(100vh-180px)] flex flex-col"
    >
      {/* Toolbar */}
      <MoodBoardToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onOpenBOQ={() => setShowBOQ(true)}
        onOpenCustomProduct={() => setShowCustomModal(true)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Product Library */}
        <div className="w-64 flex-shrink-0">
          <ProductLibraryPanel
            onProductSelect={(product) => {
              handleProductDrop(product, { x: 50, y: 50 });
            }}
            onCreateCustom={() => setShowCustomModal(true)}
          />
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
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
          />
        </div>

        {/* Right Panel - Properties */}
        <PropertiesPanel
          selectedProduct={selectedProduct}
          onClose={() => setSelectedProductId(null)}
          onUpdate={(updates) => {
            if (selectedProductId) {
              onUpdateProduct(selectedProductId, updates);
            }
          }}
          onDelete={() => {
            if (selectedProductId) {
              handleProductDelete(selectedProductId);
            }
          }}
          onDuplicate={handleDuplicateProduct}
        />
      </div>

      {/* Bottom Dock */}
      <BottomDock
        colorPalette={colorPalette}
        styleReferences={styleReferences}
        placedProducts={placedProducts}
        onAddColor={onAddColor}
        onRemoveColor={onRemoveColor}
        onAddStyleRef={onAddStyleRef}
        onRemoveStyleRef={onRemoveStyleRef}
        onProductClick={(productId) => setSelectedProductId(productId)}
        onGenerateStyle={() => {}}
      />

      {/* Navigation */}
      <div className="h-16 border-t border-border bg-card flex items-center justify-between px-6">
        <Button variant="outline" onClick={onBack}>
          ← Back to Layout
        </Button>
        <Button
          size="lg"
          className="gap-2 px-8"
          onClick={onNext}
          disabled={!canProceed}
        >
          Generate AI Render
          <motion.span
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            →
          </motion.span>
        </Button>
      </div>

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
