import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Wand2, X, Loader2, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface AILayoutPanelProps {
  onGenerate: (prompt: string, useBrainKnowledge: boolean) => Promise<void>;
  isGenerating: boolean;
  suggestions?: string[];
  onClose: () => void;
}

const promptExamples = [
  "Create a cozy living room with a sofa facing the window",
  "Design a modern bedroom with a king bed and two nightstands",
  "Set up a home office with desk near natural light",
  "Arrange a dining area for 6 people with buffet storage",
];

export function AILayoutPanel({ onGenerate, isGenerating, suggestions, onClose }: AILayoutPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [useBrainKnowledge, setUseBrainKnowledge] = useState(true);
  const [showExamples, setShowExamples] = useState(false);

  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerate(prompt.trim(), useBrainKnowledge);
    }
  };

  const handleSurpriseMe = () => {
    const randomPrompt = promptExamples[Math.floor(Math.random() * promptExamples.length)];
    setPrompt(randomPrompt);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute top-2 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
    >
      <div className="relative bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Gradient accent */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 blur-md opacity-50" />
              <div className="relative p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold">AI Layout Assistant</h3>
              <p className="text-xs text-muted-foreground">Describe your ideal room layout</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Prompt Input */}
        <div className="p-4 space-y-3">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your room layout... e.g., 'Create a cozy living room with a 3-seater sofa facing the window, a coffee table in the center, and a reading corner with an armchair...'"
            className="min-h-[100px] resize-none bg-background/50"
          />

          {/* Examples */}
          <Collapsible open={showExamples} onOpenChange={setShowExamples}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                <Lightbulb className="h-3 w-3 mr-1" />
                Example prompts
                {showExamples ? (
                  <ChevronUp className="h-3 w-3 ml-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 ml-1" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="flex flex-wrap gap-2 pt-2">
                {promptExamples.map((example, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
                    onClick={() => setPrompt(example)}
                  >
                    {example}
                  </Badge>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Options */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={useBrainKnowledge}
                onCheckedChange={setUseBrainKnowledge}
                id="use-brain"
              />
              <label htmlFor="use-brain" className="text-sm flex items-center gap-1.5 cursor-pointer">
                <Brain className="h-4 w-4 text-violet-500" />
                Use Brain Knowledge
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
          <Button variant="outline" size="sm" onClick={handleSurpriseMe}>
            <Wand2 className="h-4 w-4 mr-2" />
            Surprise Me
          </Button>

          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Layout
              </>
            )}
          </Button>
        </div>

        {/* AI Suggestions */}
        <AnimatePresence>
          {suggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border overflow-hidden"
            >
              <div className="p-4 bg-violet-500/5">
                <p className="text-xs font-medium text-violet-500 mb-2">AI Suggestions:</p>
                <ul className="space-y-1">
                  {suggestions.map((suggestion, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-violet-500">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}