import { Sparkles, Edit3, ChevronLeft, Home, Palette, Package, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AgentBUnderstanding } from './AgentBBrief';
import { AgentBAnswer, AgentBQuestion } from './AgentBQuestions';

interface AgentBConfirmationProps {
  understanding: AgentBUnderstanding;
  questions: AgentBQuestion[];
  answers: AgentBAnswer[];
  userPrompt: string;
  onGenerate: () => void;
  onEditBrief: () => void;
  onEditQuestions: () => void;
  isGenerating?: boolean;
}

export function AgentBConfirmation({
  understanding,
  questions,
  answers,
  userPrompt,
  onGenerate,
  onEditBrief,
  onEditQuestions,
  isGenerating = false,
}: AgentBConfirmationProps) {
  // Build prompt preview
  const getAnswerText = (questionId: number) => {
    const answer = answers.find((a) => a.questionId === questionId);
    if (!answer) return 'Skipped';
    if (answer.customText) return answer.customText;
    return answer.selectedOptions.join(', ');
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/30">
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center animate-glow-pulse">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Ready to Generate</h3>
          <p className="text-xs text-muted-foreground">Final review before creation</p>
        </div>
      </div>

      {/* Summary sections */}
      <div className="space-y-3 mb-4">
        {/* Understanding summary */}
        <div className="glass rounded-xl p-3 border border-border/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Home className="h-3 w-3" />
              Context
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditBrief}
              className="h-5 px-1.5 text-xs"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
              {understanding.roomType}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs">
              {understanding.detectedStyle}
            </span>
            {understanding.stagedProducts.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs flex items-center gap-1">
                <Package className="h-3 w-3" />
                {understanding.stagedProducts.length} products
              </span>
            )}
          </div>
        </div>

        {/* Answers summary */}
        <div className="glass rounded-xl p-3 border border-border/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="h-3 w-3" />
              Your Preferences
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEditQuestions}
              className="h-5 px-1.5 text-xs"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
          <div className="space-y-1.5">
            {questions.slice(0, 3).map((q) => (
              <div key={q.id} className="flex items-start gap-2 text-xs">
                <span className="text-muted-foreground/60 shrink-0">Q{q.id}:</span>
                <span className="text-foreground/80 truncate">{getAnswerText(q.id)}</span>
              </div>
            ))}
            {questions.length > 3 && (
              <p className="text-xs text-muted-foreground/50">+{questions.length - 3} more answers</p>
            )}
          </div>
        </div>

        {/* User prompt */}
        {userPrompt && (
          <div className="glass rounded-xl p-3 border border-border/20">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <Palette className="h-3 w-3" />
              Your Vision
            </span>
            <p className="text-sm text-foreground/90 line-clamp-2">{userPrompt}</p>
          </div>
        )}
      </div>

      {/* Prompt preview */}
      <div className="mb-4 p-3 rounded-xl bg-muted/20 border border-border/10">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-mono">
          Generated Prompt Preview
        </span>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-3 font-mono">
          "{understanding.roomType} with {understanding.detectedStyle} style
          {understanding.stagedProducts.length > 0 && `, featuring ${understanding.stagedProducts.join(', ')}`}
          {userPrompt && `. ${userPrompt}`}..."
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onEditBrief}
          className="glass-input"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Button
          size="sm"
          onClick={onGenerate}
          disabled={isGenerating}
          className={cn(
            "flex-1 relative overflow-hidden",
            "bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%]",
            "animate-gradient-shift hover:shadow-[0_0_40px_hsl(217_100%_58%/0.5)]",
            "transition-all duration-300"
          )}
        >
          {isGenerating ? (
            <>
              <div className="h-4 w-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Render
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
