import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { 
  WizardSession, 
  RoomDimensions, 
  PlacedProduct, 
  CustomProduct, 
  StyleReference,
  BOQData,
  BOQItem
} from '@/types/wizard';
import { toast } from 'sonner';

export function useWizardSession(sessionId?: string) {
  const { user } = useAuth();
  const [session, setSession] = useState<WizardSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch or create session
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchOrCreateSession = async () => {
      try {
        if (sessionId) {
          const { data, error } = await supabase
            .from('design_wizard_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

          if (error) throw error;
          setSession(data as unknown as WizardSession);
        } else {
          // Create new session
          const { data, error } = await supabase
            .from('design_wizard_sessions')
            .insert({
              user_id: user.id,
              current_step: 1,
              status: 'in_progress'
            })
            .select()
            .single();

          if (error) throw error;
          setSession(data as unknown as WizardSession);
        }
      } catch (error) {
        console.error('Error fetching wizard session:', error);
        toast.error('Failed to load wizard session');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrCreateSession();
  }, [user, sessionId]);

  // Update session helper
  const updateSession = useCallback(async (updates: Partial<WizardSession>) => {
    if (!session) return;

    setIsSaving(true);
    try {
      // Convert to database-compatible format
      const dbUpdates: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };
      
      Object.entries(updates).forEach(([key, value]) => {
        dbUpdates[key] = value;
      });

      const { error } = await supabase
        .from('design_wizard_sessions')
        .update(dbUpdates)
        .eq('id', session.id);

      if (error) throw error;
      setSession(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [session]);

  // Step 1: Layout functions
  const setLayoutFile = useCallback(async (url: string, thumbnailUrl?: string) => {
    await updateSession({ 
      layout_file_url: url, 
      layout_thumbnail_url: thumbnailUrl || url 
    });
  }, [updateSession]);

  const setRoomDimensions = useCallback(async (dimensions: RoomDimensions) => {
    await updateSession({ room_dimensions: dimensions });
  }, [updateSession]);

  const setRoomType = useCallback(async (type: string) => {
    await updateSession({ room_type: type });
  }, [updateSession]);

  // Step 2: Mood Board functions
  const setColorPalette = useCallback(async (colors: string[]) => {
    await updateSession({ color_palette: colors });
  }, [updateSession]);

  const addColor = useCallback(async (color: string) => {
    const currentColors = session?.color_palette || [];
    if (!currentColors.includes(color)) {
      await updateSession({ color_palette: [...currentColors, color] });
    }
  }, [session, updateSession]);

  const removeColor = useCallback(async (color: string) => {
    const currentColors = session?.color_palette || [];
    await updateSession({ color_palette: currentColors.filter(c => c !== color) });
  }, [session, updateSession]);

  const addStyleReference = useCallback(async (ref: StyleReference) => {
    const currentRefs = session?.style_references || [];
    await updateSession({ style_references: [...currentRefs, ref] });
  }, [session, updateSession]);

  const removeStyleReference = useCallback(async (refId: string) => {
    const currentRefs = session?.style_references || [];
    await updateSession({ style_references: currentRefs.filter(r => r.id !== refId) });
  }, [session, updateSession]);

  const addPlacedProduct = useCallback(async (product: PlacedProduct) => {
    const currentProducts = session?.placed_products || [];
    await updateSession({ placed_products: [...currentProducts, product] });
  }, [session, updateSession]);

  const updatePlacedProduct = useCallback(async (productId: string, updates: Partial<PlacedProduct>) => {
    const currentProducts = session?.placed_products || [];
    const updatedProducts = currentProducts.map(p => 
      p.id === productId ? { ...p, ...updates } : p
    );
    await updateSession({ placed_products: updatedProducts });
  }, [session, updateSession]);

  const removePlacedProduct = useCallback(async (productId: string) => {
    const currentProducts = session?.placed_products || [];
    await updateSession({ placed_products: currentProducts.filter(p => p.id !== productId) });
  }, [session, updateSession]);

  const addCustomProduct = useCallback(async (product: CustomProduct) => {
    const currentCustom = session?.custom_products || [];
    await updateSession({ custom_products: [...currentCustom, product] });
  }, [session, updateSession]);

  // Navigation
  const goToStep = useCallback(async (step: number) => {
    if (step >= 1 && step <= 3) {
      await updateSession({ current_step: step });
    }
  }, [updateSession]);

  const nextStep = useCallback(async () => {
    const current = session?.current_step || 1;
    if (current < 3) {
      await goToStep(current + 1);
    }
  }, [session, goToStep]);

  const prevStep = useCallback(async () => {
    const current = session?.current_step || 1;
    if (current > 1) {
      await goToStep(current - 1);
    }
  }, [session, goToStep]);

  // BOQ Calculation
  const calculateBOQ = useCallback((): BOQData => {
    const placedProducts = session?.placed_products || [];
    const customProducts = session?.custom_products || [];

    const items: BOQItem[] = [
      ...placedProducts.map(p => ({
        id: p.id,
        productId: p.productId,
        name: p.name,
        category: p.category,
        imageUrl: p.imageUrl,
        quantity: 1,
        unitPrice: p.price || 0,
        totalPrice: p.price || 0,
        isCustom: p.isCustom,
      })),
      ...customProducts.map(p => ({
        id: p.id,
        productId: p.id,
        name: p.name,
        category: p.category,
        imageUrl: p.imageUrl,
        quantity: 1,
        unitPrice: (p.estimatedPrice.min + p.estimatedPrice.max) / 2,
        totalPrice: (p.estimatedPrice.min + p.estimatedPrice.max) / 2,
        isCustom: true,
      }))
    ];

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const designFeePercent = 15;
    const designFee = subtotal * (designFeePercent / 100);

    return {
      items,
      subtotal,
      designFee,
      designFeePercent,
      grandTotal: subtotal + designFee,
      currency: 'INR'
    };
  }, [session]);

  // Complete session
  const completeSession = useCallback(async (renderUrl: string) => {
    const boq = calculateBOQ();
    await updateSession({
      generated_render_url: renderUrl,
      boq_data: boq,
      status: 'completed'
    });
  }, [updateSession, calculateBOQ]);

  return {
    session,
    isLoading,
    isSaving,
    currentStep: session?.current_step || 1,
    
    // Step 1
    setLayoutFile,
    setRoomDimensions,
    setRoomType,
    
    // Step 2
    setColorPalette,
    addColor,
    removeColor,
    addStyleReference,
    removeStyleReference,
    addPlacedProduct,
    updatePlacedProduct,
    removePlacedProduct,
    addCustomProduct,
    
    // Navigation
    goToStep,
    nextStep,
    prevStep,
    
    // BOQ
    calculateBOQ,
    
    // Complete
    completeSession
  };
}
