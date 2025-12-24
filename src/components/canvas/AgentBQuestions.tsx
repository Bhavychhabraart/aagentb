import { useState } from 'react';
import { ChevronRight, SkipForward, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface AgentBQuestion {
  id: number;
  question: string;
  options: string[];
  type: 'single' | 'multiple';
}

export interface AgentBAnswer {
  questionId: number;
  selectedOptions: string[];
  customText?: string;
}

interface AgentBQuestionsProps {
  questions: AgentBQuestion[];
  answers: AgentBAnswer[];
  currentQuestionIndex: number;
  onAnswer: (answer: AgentBAnswer) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

export function AgentBQuestions({
  questions,
  answers,
  currentQuestionIndex,
  onAnswer,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
}: AgentBQuestionsProps) {
  const [customInput, setCustomInput] = useState('');
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.find((a) => a.questionId === currentQuestion?.id);
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  if (!currentQuestion) return null;

  const handleOptionSelect = (option: string) => {
    const existing = currentAnswer?.selectedOptions || [];
    let newSelected: string[];

    if (currentQuestion.type === 'single') {
      newSelected = [option];
    } else {
      if (existing.includes(option)) {
        newSelected = existing.filter((o) => o !== option);
      } else {
        newSelected = [...existing, option];
      }
    }

    onAnswer({
      questionId: currentQuestion.id,
      selectedOptions: newSelected,
      customText: currentAnswer?.customText,
    });
  };

  const handleCustomSubmit = () => {
    if (!customInput.trim()) return;
    
    onAnswer({
      questionId: currentQuestion.id,
      selectedOptions: ['custom'],
      customText: customInput.trim(),
    });
    setCustomInput('');
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete();
    } else {
      onNext();
    }
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="animate-fade-in">
      {/* Progress header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            Q{currentQuestionIndex + 1}/{questions.length}
          </span>
          <div className="w-24 h-1 rounded-full bg-muted/30 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkip}
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
        >
          Skip
          <SkipForward className="h-3 w-3 ml-1" />
        </Button>
      </div>

      {/* Question card */}
      <div className="glass-premium rounded-xl p-4 mb-4 border border-border/30">
        <h4 className="text-sm font-medium text-foreground mb-4">
          {currentQuestion.question}
        </h4>

        {/* Options */}
        <div className="space-y-2">
          {currentQuestion.options.map((option) => {
            const isSelected = currentAnswer?.selectedOptions?.includes(option);
            return (
              <button
                key={option}
                onClick={() => handleOptionSelect(option)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all duration-200",
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/30 bg-background/50 text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all",
                    currentQuestion.type === 'single' ? 'rounded-full' : 'rounded',
                    isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/50'
                  )}
                >
                  {isSelected && (
                    <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                  )}
                </div>
                <span className="text-sm">{option}</span>
              </button>
            );
          })}

          {/* Custom option */}
          <div className="flex gap-2 mt-3">
            <Input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Or type your own..."
              className="flex-1 h-9 text-sm glass-input"
              onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
            />
            {customInput && (
              <Button
                size="sm"
                onClick={handleCustomSubmit}
                className="h-9 px-3"
              >
                Add
              </Button>
            )}
          </div>

          {/* Show custom answer if set */}
          {currentAnswer?.customText && (
            <div className="p-3 rounded-lg border border-primary bg-primary/10 text-sm text-foreground">
              Custom: {currentAnswer.customText}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={currentQuestionIndex === 0}
          className="glass-input"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button
          size="sm"
          onClick={handleNext}
          disabled={!currentAnswer?.selectedOptions?.length && !currentAnswer?.customText}
          className={cn(
            "flex-1",
            isLastQuestion ? "btn-glow" : ""
          )}
        >
          {isLastQuestion ? 'Complete' : 'Next'}
          {!isLastQuestion && <ChevronRight className="h-4 w-4 ml-1" />}
        </Button>
      </div>
    </div>
  );
}
