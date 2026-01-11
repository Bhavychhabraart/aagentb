import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WizardProgress } from '@/components/wizard/WizardProgress';
import { LayoutUploadStep } from '@/components/wizard/LayoutUploadStep';
import { MoodBoardStep } from '@/components/wizard/MoodBoardStep';
import { RenderViewStep } from '@/components/wizard/RenderViewStep';
import { useWizardSession } from '@/hooks/useWizardSession';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import type { PlacedProduct, CustomProduct, StyleReference } from '@/types/wizard';

export default function DesignWizard() {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const {
    session,
    isLoading,
    isSaving,
    currentStep,
    setLayoutFile,
    setRoomDimensions,
    setRoomType,
    addPlacedProduct,
    updatePlacedProduct,
    removePlacedProduct,
    addCustomProduct,
    addColor,
    removeColor,
    addStyleReference,
    removeStyleReference,
    goToStep,
    nextStep,
    prevStep,
    calculateBOQ,
    completeSession,
  } = useWizardSession(sessionId);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user && !isLoading) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  // Update URL when session is created
  useEffect(() => {
    if (session?.id && !sessionId) {
      navigate(`/design-wizard/${session.id}`, { replace: true });
    }
  }, [session?.id, sessionId, navigate]);

  const handleAddProduct = (product: PlacedProduct) => {
    addPlacedProduct(product);
  };

  const handleUpdateProduct = (productId: string, updates: Partial<PlacedProduct>) => {
    updatePlacedProduct(productId, updates);
  };

  const handleRemoveProduct = (productId: string) => {
    removePlacedProduct(productId);
  };

  const handleAddCustomProduct = (product: CustomProduct) => {
    addCustomProduct(product);
  };

  const handleAddStyleRef = (ref: StyleReference) => {
    addStyleReference(ref);
  };

  const handleRemoveStyleRef = (refId: string) => {
    removeStyleReference(refId);
  };

  const handleComplete = async () => {
    if (session?.generated_render_url) {
      await completeSession(session.generated_render_url);
    }
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your design session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load session</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const boqData = calculateBOQ();

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Design Wizard</h1>
            <p className="text-xs text-muted-foreground">
              {session.room_type || 'New Design'} • {isSaving ? 'Saving...' : 'Saved'}
            </p>
          </div>
        </div>

        {/* Progress */}
        <WizardProgress currentStep={currentStep} />

        {/* Close */}
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <X className="w-5 h-5" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="h-full"
            >
              <LayoutUploadStep
                layoutUrl={session.layout_file_url || undefined}
                roomDimensions={session.room_dimensions || undefined}
                roomType={session.room_type || undefined}
                onLayoutUpload={setLayoutFile}
                onDimensionsChange={setRoomDimensions}
                onRoomTypeChange={setRoomType}
                onNext={nextStep}
              />
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="h-full"
            >
              <MoodBoardStep
                layoutUrl={session.layout_file_url || undefined}
                roomDimensions={session.room_dimensions || undefined}
                placedProducts={session.placed_products || []}
                colorPalette={session.color_palette || []}
                styleReferences={session.style_references || []}
                boqData={boqData}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onRemoveProduct={handleRemoveProduct}
                onAddCustomProduct={handleAddCustomProduct}
                onAddColor={addColor}
                onRemoveColor={removeColor}
                onAddStyleRef={handleAddStyleRef}
                onRemoveStyleRef={handleRemoveStyleRef}
                onNext={nextStep}
                onBack={prevStep}
              />
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="h-full"
            >
              <RenderViewStep
                layoutUrl={session.layout_file_url || undefined}
                roomDimensions={session.room_dimensions || undefined}
                roomType={session.room_type || undefined}
                placedProducts={session.placed_products || []}
                colorPalette={session.color_palette || []}
                styleReferences={session.style_references || []}
                boqData={boqData}
                generatedRenderUrl={session.generated_render_url || undefined}
                onRenderComplete={(url) => {
                  // Save render URL to session
                }}
                onBack={prevStep}
                onComplete={handleComplete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
