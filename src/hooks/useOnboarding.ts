import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface OnboardingState {
  workspace_tutorial_completed: boolean;
  workspace_tutorial_step: number;
  skipped_at: string | null;
  completed_at: string | null;
}

export function useOnboarding() {
  const { user } = useAuth();
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Fetch onboarding state from database
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchOnboardingState = async () => {
      try {
        const { data, error } = await supabase
          .from('user_onboarding')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching onboarding state:', error);
          setIsLoading(false);
          return;
        }

        if (data) {
          setOnboardingState({
            workspace_tutorial_completed: data.workspace_tutorial_completed ?? false,
            workspace_tutorial_step: data.workspace_tutorial_step ?? 0,
            skipped_at: data.skipped_at,
            completed_at: data.completed_at,
          });
          
          // Show tutorial if not completed and not skipped
          if (!data.workspace_tutorial_completed && !data.skipped_at) {
            setShowTutorial(true);
            setCurrentStep(data.workspace_tutorial_step ?? 0);
          }
        } else {
          // No record exists - first time user, create record and show tutorial
          const { error: insertError } = await supabase
            .from('user_onboarding')
            .insert({
              user_id: user.id,
              workspace_tutorial_completed: false,
              workspace_tutorial_step: 0,
            });

          if (!insertError) {
            setOnboardingState({
              workspace_tutorial_completed: false,
              workspace_tutorial_step: 0,
              skipped_at: null,
              completed_at: null,
            });
            setShowTutorial(true);
            setCurrentStep(0);
          }
        }
      } catch (error) {
        console.error('Error in onboarding fetch:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOnboardingState();
  }, [user]);

  // Update step in database
  const updateStep = useCallback(async (step: number) => {
    if (!user) return;
    
    setCurrentStep(step);
    
    try {
      await supabase
        .from('user_onboarding')
        .update({
          workspace_tutorial_step: step,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error updating onboarding step:', error);
    }
  }, [user]);

  // Go to next step
  const nextStep = useCallback(async (totalSteps: number) => {
    const next = currentStep + 1;
    if (next >= totalSteps) {
      await completeTutorial();
    } else {
      await updateStep(next);
    }
  }, [currentStep, updateStep]);

  // Go to previous step
  const prevStep = useCallback(async () => {
    if (currentStep > 0) {
      await updateStep(currentStep - 1);
    }
  }, [currentStep, updateStep]);

  // Complete tutorial
  const completeTutorial = useCallback(async () => {
    if (!user) return;
    
    setShowTutorial(false);
    setOnboardingState(prev => prev ? {
      ...prev,
      workspace_tutorial_completed: true,
      completed_at: new Date().toISOString(),
    } : null);
    
    try {
      await supabase
        .from('user_onboarding')
        .update({
          workspace_tutorial_completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error completing tutorial:', error);
    }
  }, [user]);

  // Skip tutorial
  const skipTutorial = useCallback(async () => {
    if (!user) return;
    
    setShowTutorial(false);
    setOnboardingState(prev => prev ? {
      ...prev,
      skipped_at: new Date().toISOString(),
    } : null);
    
    try {
      await supabase
        .from('user_onboarding')
        .update({
          skipped_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error skipping tutorial:', error);
    }
  }, [user]);

  // Reset tutorial (for testing or user request)
  const resetTutorial = useCallback(async () => {
    if (!user) return;
    
    setCurrentStep(0);
    setShowTutorial(true);
    setOnboardingState({
      workspace_tutorial_completed: false,
      workspace_tutorial_step: 0,
      skipped_at: null,
      completed_at: null,
    });
    
    try {
      await supabase
        .from('user_onboarding')
        .update({
          workspace_tutorial_completed: false,
          workspace_tutorial_step: 0,
          skipped_at: null,
          completed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error resetting tutorial:', error);
    }
  }, [user]);

  return {
    isLoading,
    showTutorial,
    currentStep,
    onboardingState,
    nextStep,
    prevStep,
    completeTutorial,
    skipTutorial,
    resetTutorial,
    setShowTutorial,
  };
}
