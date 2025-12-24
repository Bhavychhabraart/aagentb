import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Check, ChevronRight, SkipForward, Loader2 } from 'lucide-react';
import { AgentBUnderstanding } from '@/components/canvas/AgentBBrief';
import { AgentBQuestion, AgentBAnswer } from '@/components/canvas/AgentBQuestions';
import { getPreferencesContext, UserPreferencesContext } from '@/services/designMemoryService';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type OnboardingStep = 'thinking' | 'brief' | 'questions' | 'confirmation' | 'transitioning';

const thinkingStages = [
  "Reading your creative brief...",
  "Analyzing spatial requirements...",
  "Understanding your style preferences...",
  "Reviewing staged products...",
  "Crafting personalized questions...",
];

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.98 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// Sleek Thinking Animation Component
function ThinkingAnimation({ progress }: { progress: number }) {
  return (
    <div className="relative w-16 h-16">
      {/* Outer ring - rotating */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-primary/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Middle ring - counter-rotating with gradient */}
      <motion.div
        className="absolute inset-1 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, hsl(var(--primary)) ${progress}%, transparent ${progress}%)`,
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Inner glow */}
      <motion.div
        className="absolute inset-2 rounded-full bg-background"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Core with pulsing dot */}
      <div className="absolute inset-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
        <motion.div
          className="w-2 h-2 rounded-full bg-primary"
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      
      {/* Orbiting particles */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-primary/60"
          style={{
            top: '50%',
            left: '50%',
            marginTop: -3,
            marginLeft: -3,
          }}
          animate={{
            x: [0, Math.cos((i * 2 * Math.PI) / 3) * 28, 0],
            y: [0, Math.sin((i * 2 * Math.PI) / 3) * 28, 0],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  );
}

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

  // Animate progress and thinking stages
  useEffect(() => {
    if (step !== 'thinking') return;

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 5;
      });
    }, 150);

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

        setUnderstanding({
          roomType: data.understanding?.roomType || 'Living Room',
          detectedStyle: data.understanding?.detectedStyle || 'Modern',
          dimensions: data.understanding?.dimensions || '',
          colorPalette: data.understanding?.colorPalette || ['#f5f5f0', '#2d3436', '#a8d8ea'],
          stagedProducts: data.understanding?.stagedProducts || [],
          hasLayout: !!layoutUpload,
          hasStyleRef: (styleData.data?.length || 0) > 0,
        });

        setQuestions(data.questions || generateDefaultQuestions());
        setAnswers(data.questions?.map((q: AgentBQuestion) => ({
          questionId: q.id,
          selectedOptions: [],
        })) || generateDefaultQuestions().map(q => ({ questionId: q.id, selectedOptions: [] })));

        setProgress(100);
        setTimeout(() => setStep('brief'), 600);

      } catch (error) {
        console.error('Agent B analysis error:', error);
        toast({
          title: 'Analysis failed',
          description: 'Using default questions. You can still proceed.',
          variant: 'destructive',
        });
        
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
        setTimeout(() => setStep('brief'), 600);
      }
    };

    const timer = setTimeout(analyze, 1500);
    return () => clearTimeout(timer);
  }, [user, projectId, initialPrompt, userPreferences, step, toast]);

  const generateDefaultQuestions = (): AgentBQuestion[] => [
    { id: 1, question: 'What mood do you want to achieve?', options: ['Cozy & Warm', 'Clean & Minimal', 'Bold & Dramatic', 'Natural & Organic'], type: 'single' },
    { id: 2, question: 'What is your color preference?', options: ['Warm neutrals', 'Cool tones', 'Earth tones', 'Monochrome'], type: 'multiple' },
    { id: 3, question: 'What level of detail do you prefer?', options: ['Minimal decoration', 'Balanced', 'Richly layered', 'Maximalist'], type: 'single' },
    { id: 4, question: 'Any specific materials you prefer?', options: ['Wood & Natural', 'Metal & Glass', 'Fabric & Textiles', 'Mixed materials'], type: 'multiple' },
    { id: 5, question: 'What lighting atmosphere?', options: ['Bright & Airy', 'Soft & Ambient', 'Dramatic & Moody', 'Natural daylight'], type: 'single' },
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
    
    const onboardingData = {
      understanding,
      questions,
      answers,
      prompt: initialPrompt,
      timestamp: Date.now(),
    };
    localStorage.setItem(`agentb_onboarding_${projectId}`, JSON.stringify(onboardingData));

    await new Promise(resolve => setTimeout(resolve, 800));
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
      {/* Subtle background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-4 h-4 rounded-full bg-primary/60"
            />
          </div>
          <span className="font-medium text-foreground">Agent B</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            {['Analyze', 'Brief', 'Refine', 'Generate'].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="w-3 h-3" />}
                <span className={cn(
                  'transition-colors duration-300',
                  (step === 'thinking' && i === 0) ||
                  (step === 'brief' && i === 1) ||
                  (step === 'questions' && i === 2) ||
                  (step === 'confirmation' && i === 3)
                    ? 'text-primary font-medium'
                    : ''
                )}>{label}</span>
              </div>
            ))}
          </div>
          
          <Button variant="ghost" size="sm" onClick={handleSkip} className="gap-2 text-muted-foreground hover:text-foreground">
            Skip
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="relative z-10 px-6 pt-4">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          className="origin-left"
        >
          <Progress value={stepProgress} className="h-0.5" />
        </motion.div>
      </div>

      {/* Main content with AnimatePresence for smooth transitions */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 py-16 min-h-[calc(100vh-100px)]">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: THINKING */}
          {step === 'thinking' && (
            <motion.div
              key="thinking"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col items-center text-center max-w-md"
            >
              <ThinkingAnimation progress={progress} />
              
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-medium text-foreground mt-8 mb-2"
              >
                Analyzing your vision
              </motion.h2>
              
              <motion.p
                key={thinkingStage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground mb-6 h-5"
              >
                {thinkingStages[thinkingStage]}
              </motion.p>

              <div className="w-48">
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: BRIEF */}
          {step === 'brief' && understanding && (
            <motion.div
              key="brief"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-2xl"
            >
              <motion.div variants={staggerContainer} initial="initial" animate="animate" className="text-center mb-8">
                <motion.h2 variants={fadeInUp} className="text-2xl font-semibold text-foreground mb-2">
                  Here's what I understood
                </motion.h2>
                <motion.p variants={fadeInUp} className="text-muted-foreground">
                  Review and confirm, or re-analyze
                </motion.p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-premium rounded-2xl p-6 mb-8"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Room Type', value: understanding.roomType },
                    { label: 'Style', value: understanding.detectedStyle },
                    { label: 'Products', value: `${understanding.stagedProducts?.length || 0} staged` },
                    { label: 'References', value: `${(understanding.hasStyleRef ? 1 : 0) + (understanding.hasLayout ? 1 : 0)}` },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="p-4 bg-muted/30 rounded-xl"
                    >
                      <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                      <p className="font-medium text-foreground">{item.value}</p>
                    </motion.div>
                  ))}
                </div>

                {understanding.colorPalette && understanding.colorPalette.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mb-6"
                  >
                    <p className="text-xs text-muted-foreground mb-2">Detected Colors</p>
                    <div className="flex gap-2">
                      {understanding.colorPalette.map((color, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.6 + i * 0.1 }}
                          className="w-8 h-8 rounded-lg border border-border/50 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {initialPrompt && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <p className="text-xs text-muted-foreground mb-2">Your Brief</p>
                    <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3">"{initialPrompt}"</p>
                  </motion.div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex justify-center gap-3"
              >
                <Button variant="outline" onClick={() => { setProgress(0); setStep('thinking'); }}>
                  Re-analyze
                </Button>
                <Button onClick={() => setStep('questions')} className="gap-2">
                  Looks Good
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* STEP 3: QUESTIONS */}
          {step === 'questions' && currentQuestion && (
            <motion.div
              key={`question-${currentQuestionIndex}`}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-xl"
            >
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
                {currentQuestion.options.map((option, i) => {
                  const isSelected = currentAnswer?.selectedOptions.includes(option);
                  return (
                    <motion.button
                      key={option}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                      className={cn(
                        "p-4 rounded-xl border-2 text-left transition-colors duration-200",
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{option}</span>
                        {isSelected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <Check className="w-5 h-5 text-primary" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0}>
                  Back
                </Button>
                <Button onClick={handleNextQuestion} className="gap-2">
                  {currentQuestionIndex === questions.length - 1 ? 'Review' : 'Next'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: CONFIRMATION */}
          {step === 'confirmation' && (
            <motion.div
              key="confirmation"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-xl text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
              >
                <Check className="w-8 h-8 text-primary" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-semibold text-foreground mb-2"
              >
                Ready to generate!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground mb-8"
              >
                Let's create something beautiful.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-premium rounded-2xl p-6 mb-8 text-left"
              >
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
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center gap-3"
              >
                <Button variant="outline" onClick={() => setStep('questions')}>
                  Edit Answers
                </Button>
                <Button onClick={handleConfirmAndGenerate} className="gap-2 btn-glow">
                  Generate Render
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* STEP 5: TRANSITIONING */}
          {step === 'transitioning' && (
            <motion.div
              key="transitioning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-8 h-8 text-primary" />
              </motion.div>
              <p className="text-sm text-muted-foreground mt-4">
                Preparing your workspace...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
