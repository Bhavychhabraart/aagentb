import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Sparkles, Check, ChevronRight, SkipForward, Loader2 } from 'lucide-react';
import { AgentBUnderstanding } from '@/components/canvas/AgentBBrief';
import { AgentBQuestion, AgentBAnswer } from '@/components/canvas/AgentBQuestions';
import { getPreferencesContext, UserPreferencesContext } from '@/services/designMemoryService';
import { cn } from '@/lib/utils';

type OnboardingStep = 'thinking' | 'brief' | 'questions' | 'confirmation' | 'transitioning';

const thinkingStages = [
  "Reading your creative brief...",
  "Analyzing spatial requirements...",
  "Understanding your style preferences...",
  "Reviewing staged products...",
  "Crafting personalized questions...",
];

export default function AgentBOnboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const projectId = searchParams.get('project');
  const initialPrompt = decodeURIComponent(searchParams.get('prompt') || '');

  const [step, setStep] = useState<OnboardingStep>('thinking');
  const [progress, setProgress] = useState(0);
  const [thinkingStage, setThinkingStage] = useState(0);
  const [dots, setDots] = useState('');

  // Agent B data
  const [understanding, setUnderstanding] = useState<AgentBUnderstanding | null>(null);
  const [questions, setQuestions] = useState<AgentBQuestion[]>([]);
  const [answers, setAnswers] = useState<AgentBAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userPreferences, setUserPreferences] = useState<UserPreferencesContext | null>(null);

  // Redirect if not logged in or no project
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
    if (!projectId) {
      navigate('/');
    }
  }, [user, authLoading, projectId, navigate]);

  // Load user preferences
  useEffect(() => {
    if (user) {
      getPreferencesContext(user.id).then(setUserPreferences);
    }
  }, [user]);

  // Animate thinking dots
  useEffect(() => {
    if (step !== 'thinking') return;
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);
    return () => clearInterval(interval);
  }, [step]);

  // Animate progress and thinking stages
  useEffect(() => {
    if (step !== 'thinking') return;

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 8;
      });
    }, 200);

    const stageInterval = setInterval(() => {
      setThinkingStage(prev => (prev + 1) % thinkingStages.length);
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stageInterval);
    };
  }, [step]);

  // Call Agent B analysis on mount
  useEffect(() => {
    if (!user || !projectId || step !== 'thinking') return;

    const analyze = async () => {
      try {
        // Build context for analysis
        const [projectData, uploadsData, stagedData, styleData] = await Promise.all([
          supabase.from('projects').select('*').eq('id', projectId).single(),
          supabase.from('room_uploads').select('*').eq('project_id', projectId),
          supabase.from('staged_furniture').select('*').eq('project_id', projectId),
          supabase.from('style_uploads').select('*').eq('project_id', projectId),
        ]);

        const roomUpload = uploadsData.data?.find(u => u.upload_type === 'room_photo');
        const layoutUpload = uploadsData.data?.find(u => u.upload_type === 'layout');

        const { data, error } = await supabase.functions.invoke('agent-b-analyze', {
          body: {
            prompt: initialPrompt,
            roomImageUrl: roomUpload?.file_url,
            layoutUrl: layoutUpload?.file_url,
            styleRefUrls: styleData.data?.map(s => s.file_url) || [],
            stagedProducts: stagedData.data?.map(s => ({
              name: s.item_name,
              category: s.item_category,
              imageUrl: s.item_image_url,
            })) || [],
            userPreferences: userPreferences,
          },
        });

        if (error) throw error;

        // Set understanding
        setUnderstanding({
          roomType: data.understanding?.roomType || 'Living Room',
          detectedStyle: data.understanding?.detectedStyle || 'Modern',
          dimensions: data.understanding?.dimensions || '',
          colorPalette: data.understanding?.colorPalette || ['#f5f5f0', '#2d3436', '#a8d8ea'],
          stagedProducts: data.understanding?.stagedProducts || [],
          hasLayout: !!layoutUpload,
          hasStyleRef: (styleData.data?.length || 0) > 0,
        });

        // Set questions
        setQuestions(data.questions || generateDefaultQuestions());
        setAnswers(data.questions?.map((q: AgentBQuestion) => ({
          questionId: q.id,
          selectedOptions: [],
        })) || generateDefaultQuestions().map(q => ({ questionId: q.id, selectedOptions: [] })));

        setProgress(100);
        
        // Transition to brief
        setTimeout(() => {
          setStep('brief');
        }, 500);

      } catch (error) {
        console.error('Agent B analysis error:', error);
        toast({
          title: 'Analysis failed',
          description: 'Using default questions. You can still proceed.',
          variant: 'destructive',
        });
        
        // Use defaults
        const defaultQs = generateDefaultQuestions();
        setUnderstanding({
          roomType: 'Room',
          detectedStyle: 'Contemporary',
          dimensions: '',
          colorPalette: ['#f5f5f0', '#2d3436', '#a8d8ea'],
          stagedProducts: [],
          hasLayout: false,
          hasStyleRef: false,
        });
        setQuestions(defaultQs);
        setAnswers(defaultQs.map(q => ({ questionId: q.id, selectedOptions: [] })));
        setProgress(100);
        setTimeout(() => setStep('brief'), 500);
      }
    };

    const timer = setTimeout(analyze, 1500);
    return () => clearTimeout(timer);
  }, [user, projectId, initialPrompt, userPreferences, step, toast]);

  const generateDefaultQuestions = (): AgentBQuestion[] => [
    {
      id: 1,
      question: 'What mood do you want to achieve?',
      options: ['Cozy & Warm', 'Clean & Minimal', 'Bold & Dramatic', 'Natural & Organic'],
      type: 'single',
    },
    {
      id: 2,
      question: 'What is your color preference?',
      options: ['Warm neutrals', 'Cool tones', 'Earth tones', 'Monochrome'],
      type: 'multiple',
    },
    {
      id: 3,
      question: 'What level of detail do you prefer?',
      options: ['Minimal decoration', 'Balanced', 'Richly layered', 'Maximalist'],
      type: 'single',
    },
    {
      id: 4,
      question: 'Any specific materials you prefer?',
      options: ['Wood & Natural', 'Metal & Glass', 'Fabric & Textiles', 'Mixed materials'],
      type: 'multiple',
    },
    {
      id: 5,
      question: 'What lighting atmosphere?',
      options: ['Bright & Airy', 'Soft & Ambient', 'Dramatic & Moody', 'Natural daylight'],
      type: 'single',
    },
  ];

  const handleAnswerSelect = (questionId: number, option: string) => {
    setAnswers(prev => prev.map(a => {
      if (a.questionId !== questionId) return a;
      
      const question = questions.find(q => q.id === questionId);
      if (question?.type === 'multiple') {
        const isSelected = a.selectedOptions.includes(option);
        return {
          ...a,
          selectedOptions: isSelected
            ? a.selectedOptions.filter(o => o !== option)
            : [...a.selectedOptions, option],
        };
      } else {
        return { ...a, selectedOptions: [option] };
      }
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setStep('confirmation');
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleConfirmAndGenerate = async () => {
    setStep('transitioning');
    
    // Save onboarding data to localStorage for workspace to pick up
    const onboardingData = {
      understanding,
      questions,
      answers,
      prompt: initialPrompt,
      timestamp: Date.now(),
    };
    localStorage.setItem(`agentb_onboarding_${projectId}`, JSON.stringify(onboardingData));

    // Smooth transition delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Navigate to workspace with generate flag
    navigate(`/workspace?project=${projectId}&generate=true&fromOnboarding=true`);
  };

  const handleSkip = () => {
    navigate(`/workspace?project=${projectId}`);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id);
  const stepProgress = step === 'thinking' ? 25 : step === 'brief' ? 50 : step === 'questions' ? 75 : 100;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="font-medium text-foreground">Agent B</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <span className={cn(step === 'thinking' && 'text-primary font-medium')}>Analyze</span>
            <ChevronRight className="w-4 h-4" />
            <span className={cn(step === 'brief' && 'text-primary font-medium')}>Brief</span>
            <ChevronRight className="w-4 h-4" />
            <span className={cn(step === 'questions' && 'text-primary font-medium')}>Refine</span>
            <ChevronRight className="w-4 h-4" />
            <span className={cn(step === 'confirmation' && 'text-primary font-medium')}>Generate</span>
          </div>
          
          <Button variant="ghost" size="sm" onClick={handleSkip} className="gap-2">
            <SkipForward className="w-4 h-4" />
            Skip
          </Button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="relative z-10 px-6 pt-4">
        <Progress value={stepProgress} className="h-1" />
      </div>

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 py-12 min-h-[calc(100vh-100px)]">
        
        {/* STEP 1: THINKING */}
        {step === 'thinking' && (
          <div className="flex flex-col items-center text-center animate-fade-in max-w-lg">
            {/* Animated brain/sparkles */}
            <div className="relative w-32 h-32 mb-8">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-2 bg-primary/30 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg shadow-primary/30">
                  <Sparkles className="w-10 h-10 text-primary-foreground" />
                </div>
              </div>
              {/* Orbiting dots */}
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="absolute w-3 h-3 bg-primary rounded-full"
                  style={{
                    animation: `orbit 3s linear infinite`,
                    animationDelay: `${i * 1}s`,
                    top: '50%',
                    left: '50%',
                    transformOrigin: '0 0',
                  }}
                />
              ))}
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Analyzing your vision{dots}
            </h2>
            <p className="text-muted-foreground mb-8 transition-all duration-300">
              {thinkingStages[thinkingStage]}
            </p>

            <div className="w-full max-w-sm">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">{Math.round(progress)}%</p>
            </div>
          </div>
        )}

        {/* STEP 2: BRIEF */}
        {step === 'brief' && understanding && (
          <div className="w-full max-w-2xl animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Here's what I understood
              </h2>
              <p className="text-muted-foreground">
                Review the brief and let me know if anything needs correction
              </p>
            </div>

            <div className="glass-premium rounded-2xl p-6 mb-8">
              {/* Understanding grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Room Type</p>
                  <p className="font-medium text-foreground">{understanding.roomType}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Style</p>
                  <p className="font-medium text-foreground">{understanding.detectedStyle}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Products</p>
                  <p className="font-medium text-foreground">{understanding.stagedProducts?.length || 0} staged</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">References</p>
                  <p className="font-medium text-foreground">{(understanding.hasStyleRef ? 1 : 0) + (understanding.hasLayout ? 1 : 0)}</p>
                </div>
              </div>

              {/* Color palette */}
              {understanding.colorPalette && understanding.colorPalette.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-muted-foreground mb-2">Detected Colors</p>
                  <div className="flex gap-2">
                    {understanding.colorPalette.map((color, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-lg border border-border/50 shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Prompt if provided */}
              {initialPrompt && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Your Brief</p>
                  <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3">
                    "{initialPrompt}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setStep('thinking')}>
                Re-analyze
              </Button>
              <Button onClick={() => setStep('questions')} className="gap-2">
                Looks Good
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: QUESTIONS */}
        {step === 'questions' && currentQuestion && (
          <div className="w-full max-w-xl animate-fade-in">
            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground mb-2">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
              <h2 className="text-2xl font-semibold text-foreground">
                {currentQuestion.question}
              </h2>
              {currentQuestion.type === 'multiple' && (
                <p className="text-sm text-muted-foreground mt-2">Select all that apply</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {currentQuestion.options.map((option) => {
                const isSelected = currentAnswer?.selectedOptions.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all duration-200",
                      "hover:border-primary/50 hover:bg-primary/5",
                      isSelected
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option}</span>
                      {isSelected && <Check className="w-5 h-5 text-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between">
              <Button
                variant="ghost"
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Back
              </Button>
              <Button onClick={handleNextQuestion} className="gap-2">
                {currentQuestionIndex === questions.length - 1 ? 'Review' : 'Next'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: CONFIRMATION */}
        {step === 'confirmation' && (
          <div className="w-full max-w-xl animate-fade-in text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-primary" />
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Ready to generate!
            </h2>
            <p className="text-muted-foreground mb-8">
              I've got everything I need. Let's create something beautiful.
            </p>

            {/* Summary */}
            <div className="glass-premium rounded-2xl p-6 mb-8 text-left">
              <h3 className="font-medium text-foreground mb-4">Summary</h3>
              <div className="space-y-3 text-sm">
                {understanding && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room & Style</span>
                    <span className="text-foreground">{understanding.roomType} • {understanding.detectedStyle}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Questions Answered</span>
                  <span className="text-foreground">{answers.filter(a => a.selectedOptions.length > 0).length} of {questions.length}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setStep('questions')}>
                Edit Answers
              </Button>
              <Button onClick={handleConfirmAndGenerate} className="gap-2 btn-glow">
                <Sparkles className="w-4 h-4" />
                Generate Render
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: TRANSITIONING */}
        {step === 'transitioning' && (
          <div className="flex flex-col items-center text-center animate-fade-in">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-foreground">
              Preparing your workspace...
            </h2>
          </div>
        )}
      </main>

      <style>{`
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(60px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(60px) rotate(-360deg); }
        }
      `}</style>
    </div>
  );
}
