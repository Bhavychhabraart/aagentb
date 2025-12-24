import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Image as ImageIcon, Sparkles, FileImage, Clock, Package, Edit3, Eye, Plus, Grid3X3, Camera, Palette, Box, Brain, ToggleLeft, ToggleRight, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { AgentBThinking } from './AgentBThinking';
import { AgentBBrief, AgentBUnderstanding } from './AgentBBrief';
import { AgentBQuestions, AgentBQuestion, AgentBAnswer } from './AgentBQuestions';
import { AgentBConfirmation } from './AgentBConfirmation';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    type?: 'text' | 'upload' | 'render';
    imageUrl?: string;
    status?: string;
    stagedFurniture?: { id: string; name: string }[];
  };
  created_at: string;
}

export type ChatInputType = 'layout' | 'room' | 'style' | 'products';

export type AgentBState = 'idle' | 'thinking' | 'brief' | 'questions' | 'confirmation' | 'generating';

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  onInputTypeSelect: (type: ChatInputType) => void;
  stagedItems?: CatalogFurnitureItem[];
  onClearStagedItems?: () => void;
  isEditMode?: boolean;
  currentRenderUrl?: string | null;
  onRenderSelect?: (imageUrl: string) => void;
  // Agent B props
  agentBEnabled?: boolean;
  onAgentBToggle?: (enabled: boolean) => void;
  agentBState?: AgentBState;
  agentBUnderstanding?: AgentBUnderstanding | null;
  agentBQuestions?: AgentBQuestion[];
  agentBAnswers?: AgentBAnswer[];
  agentBProgress?: number;
  onAgentBConfirmBrief?: () => void;
  onAgentBCorrectBrief?: () => void;
  onAgentBAnswer?: (answer: AgentBAnswer) => void;
  onAgentBNextQuestion?: () => void;
  onAgentBPreviousQuestion?: () => void;
  onAgentBSkipQuestion?: () => void;
  onAgentBCompleteQuestions?: () => void;
  onAgentBGenerate?: () => void;
  onAgentBEditBrief?: () => void;
  onAgentBEditQuestions?: () => void;
  currentQuestionIndex?: number;
  userPrompt?: string;
  // New render mode props
  wantsNewRender?: boolean;
  onToggleNewRenderMode?: (wantsNew: boolean) => void;
}

function getMessageIcon(metadata?: ChatMessage['metadata']) {
  if (metadata?.type === 'upload') return <FileImage className="h-3.5 w-3.5" />;
  if (metadata?.type === 'render') return <Sparkles className="h-3.5 w-3.5" />;
  return null;
}

function formatTimestamp(dateString: string) {
  try {
    const date = new Date(dateString);
    return format(date, 'HH:mm');
  } catch {
    return '';
  }
}

export function ChatPanel({ 
  messages, 
  isLoading, 
  onSendMessage, 
  onInputTypeSelect, 
  stagedItems = [], 
  onClearStagedItems,
  isEditMode = false,
  currentRenderUrl,
  onRenderSelect,
  // Agent B
  agentBEnabled = false,
  onAgentBToggle,
  agentBState = 'idle',
  agentBUnderstanding,
  agentBQuestions = [],
  agentBAnswers = [],
  agentBProgress = 0,
  onAgentBConfirmBrief,
  onAgentBCorrectBrief,
  onAgentBAnswer,
  onAgentBNextQuestion,
  onAgentBPreviousQuestion,
  onAgentBSkipQuestion,
  onAgentBCompleteQuestions,
  onAgentBGenerate,
  onAgentBEditBrief,
  onAgentBEditQuestions,
  currentQuestionIndex = 0,
  userPrompt = '',
  // New render mode
  wantsNewRender = true,
  onToggleNewRenderMode,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, agentBState]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || agentBState !== 'idle') return;
    
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Check if Agent B flow is active (not idle)
  const isAgentBActive = agentBState !== 'idle' && agentBState !== 'generating';

  return (
    <div className="flex flex-col h-full glass-premium border-l border-border/30">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between bg-background/30">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-foreground">Command History</h2>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {messages.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Agent B Toggle */}
          {onAgentBToggle && agentBState === 'idle' && (
            <button
              onClick={() => onAgentBToggle(!agentBEnabled)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200",
                agentBEnabled 
                  ? "bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/40 text-primary"
                  : "bg-muted/50 border border-border/30 text-muted-foreground hover:text-foreground hover:border-primary/30"
              )}
            >
              <Brain className="h-3 w-3" />
              <span>Agent B</span>
              {agentBEnabled ? (
                <ToggleRight className="h-3.5 w-3.5" />
              ) : (
                <ToggleLeft className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          {/* Mode Selector - Only show when renders exist and Agent B is enabled */}
          {currentRenderUrl && agentBEnabled && onToggleNewRenderMode && agentBState === 'idle' && (
            <div className="flex items-center rounded-full bg-muted/50 border border-border/30 p-0.5">
              <button
                onClick={() => onToggleNewRenderMode(true)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200",
                  wantsNewRender
                    ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Wand2 className="h-3 w-3" />
                <span>New</span>
              </button>
              <button
                onClick={() => onToggleNewRenderMode(false)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200",
                  !wantsNewRender
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Edit3 className="h-3 w-3" />
                <span>Edit</span>
              </button>
            </div>
          )}
          {/* Mode Indicator - When Agent B is off or no render exists */}
          {(!currentRenderUrl || !agentBEnabled) && (
            isEditMode ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
                <Edit3 className="h-3 w-3 text-amber-500" />
                <span className="text-xs font-medium text-amber-500">Edit Mode</span>
              </div>
            ) : !agentBEnabled && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/30">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-primary">Generate</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Messages / Agent B Flow */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {/* Show Agent B Flow if active */}
        {isAgentBActive ? (
          <div className="space-y-4">
            {/* Show previous messages condensed */}
            {messages.length > 0 && (
              <div className="mb-4 pb-4 border-b border-border/20">
                <p className="text-xs text-muted-foreground mb-2">Previous conversation</p>
                <div className="space-y-1">
                  {messages.slice(-3).map((msg) => (
                    <p key={msg.id} className="text-xs text-muted-foreground/60 truncate">
                      {msg.role === 'user' ? 'You: ' : 'Agent: '}{msg.content}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Agent B States */}
            {agentBState === 'thinking' && (
              <AgentBThinking progress={agentBProgress} />
            )}

            {agentBState === 'brief' && agentBUnderstanding && (
              <AgentBBrief
                understanding={agentBUnderstanding}
                onConfirm={onAgentBConfirmBrief}
                onCorrect={onAgentBCorrectBrief}
              />
            )}

            {agentBState === 'questions' && agentBQuestions.length > 0 && (
              <AgentBQuestions
                questions={agentBQuestions}
                answers={agentBAnswers}
                currentQuestionIndex={currentQuestionIndex}
                onAnswer={onAgentBAnswer || (() => {})}
                onNext={onAgentBNextQuestion || (() => {})}
                onPrevious={onAgentBPreviousQuestion || (() => {})}
                onSkip={onAgentBSkipQuestion || (() => {})}
                onComplete={onAgentBCompleteQuestions || (() => {})}
              />
            )}

            {agentBState === 'confirmation' && agentBUnderstanding && (
              <AgentBConfirmation
                understanding={agentBUnderstanding}
                questions={agentBQuestions}
                answers={agentBAnswers}
                userPrompt={userPrompt}
                onGenerate={onAgentBGenerate || (() => {})}
                onEditBrief={onAgentBEditBrief || (() => {})}
                onEditQuestions={onAgentBEditQuestions || (() => {})}
                isGenerating={false}
              />
            )}
          </div>
        ) : (
          /* Normal chat view */
          messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                {agentBEnabled ? (
                  <Brain className="h-6 w-6 text-primary" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground max-w-[200px]">
                {agentBEnabled 
                  ? "Describe your design vision. Agent B will guide you through the process."
                  : "Upload a room image or describe what you want to create."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'relative rounded-lg text-sm animate-slide-up',
                    message.role === 'user'
                      ? 'chat-message-user ml-4'
                      : 'chat-message-assistant mr-4'
                  )}
                >
                  {/* Message header with icon and timestamp */}
                  <div className="flex items-center justify-between gap-2 px-3 pt-2 pb-1">
                    <div className="flex items-center gap-1.5">
                      {message.role === 'user' ? (
                        <>
                          {getMessageIcon(message.metadata)}
                          <span className="text-xs font-medium text-primary/80">You</span>
                        </>
                      ) : (
                        <>
                          {agentBEnabled ? (
                            <Brain className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                          )}
                          <span className="text-xs font-medium text-primary/80">Agent B</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="text-[10px] font-mono">{formatTimestamp(message.created_at)}</span>
                    </div>
                  </div>
                  
                  {/* Message content */}
                  <div className="px-3 pb-2">
                    {message.metadata?.imageUrl && (
                      <div className="relative group mb-2">
                        <img
                          src={message.metadata.imageUrl}
                          alt={message.metadata.type === 'render' ? 'Generated render' : 'Uploaded'}
                          className={cn(
                            "rounded-md max-w-full border transition-all duration-200",
                            message.metadata.type === 'render' && onRenderSelect && "cursor-pointer",
                            message.metadata.imageUrl === currentRenderUrl 
                              ? "border-primary ring-2 ring-primary/30" 
                              : "border-border/50 hover:border-primary/50"
                          )}
                          onClick={() => {
                            if (message.metadata?.type === 'render' && message.metadata.imageUrl && onRenderSelect) {
                              onRenderSelect(message.metadata.imageUrl);
                            }
                          }}
                        />
                        {/* View indicator on hover for render images */}
                        {message.metadata.type === 'render' && onRenderSelect && (
                          <div className={cn(
                            "absolute inset-0 rounded-md flex items-center justify-center transition-opacity",
                            message.metadata.imageUrl === currentRenderUrl 
                              ? "opacity-0" 
                              : "opacity-0 group-hover:opacity-100 bg-black/40"
                          )}>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary rounded-full text-primary-foreground text-xs font-medium">
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </div>
                          </div>
                        )}
                        {/* Current indicator badge */}
                        {message.metadata.type === 'render' && message.metadata.imageUrl === currentRenderUrl && (
                          <div className="absolute top-2 right-2 px-2 py-1 bg-primary text-primary-foreground text-[10px] font-medium rounded-full">
                            Current
                          </div>
                        )}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap text-foreground/90">{message.content}</p>
                    {message.metadata?.status && (
                      <div className={cn(
                        'inline-flex items-center gap-1 text-xs mt-2 px-2 py-0.5 rounded-full font-mono',
                        message.metadata.status === 'pending' && 'bg-muted text-muted-foreground',
                        message.metadata.status === 'analyzing' && 'bg-warning/10 text-warning',
                        message.metadata.status === 'ready' && 'bg-success/10 text-success',
                        message.metadata.status === 'failed' && 'bg-destructive/10 text-destructive'
                      )}>
                        <span className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          message.metadata.status === 'pending' && 'bg-muted-foreground',
                          message.metadata.status === 'analyzing' && 'bg-warning animate-pulse',
                          message.metadata.status === 'ready' && 'bg-success',
                          message.metadata.status === 'failed' && 'bg-destructive'
                        )} />
                        {message.metadata.status}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="chat-message-assistant mr-4 rounded-lg">
                  <div className="px-3 py-2.5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      Processing...
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </ScrollArea>

      {/* Input - Glass UI (hidden during Agent B flow except idle) */}
      {!isAgentBActive && (
        <div className="p-4 border-t border-border/30 bg-background/20">
          {/* Staged items display */}
          {stagedItems.length > 0 && (
            <div className={cn(
              "mb-3 p-2 rounded-lg border",
              isEditMode 
                ? "bg-amber-500/5 border-amber-500/30" 
                : "bg-primary/5 border-primary/20"
            )}>
              <div className="flex items-center justify-between mb-2">
                <div className={cn(
                  "flex items-center gap-1.5 text-xs font-medium",
                  isEditMode ? "text-amber-500" : "text-primary"
                )}>
                  {isEditMode ? (
                    <>
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Replace Furniture ({stagedItems.length})</span>
                    </>
                  ) : (
                    <>
                      <Package className="h-3.5 w-3.5" />
                      <span>Staged Furniture ({stagedItems.length})</span>
                    </>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClearStagedItems}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {stagedItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs",
                      isEditMode 
                        ? "bg-amber-500/10 text-amber-600" 
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {item.imageUrl && (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className="h-4 w-4 rounded object-cover"
                      />
                    )}
                    <span className="truncate max-w-[80px]">{item.name}</span>
                    <span className="text-[10px] opacity-60">→ {item.category}</span>
                  </div>
                ))}
              </div>
              {isEditMode && (
                <p className="text-[10px] text-amber-600/70 mt-2">
                  Products will replace matching furniture in the current render
                </p>
              )}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    disabled={isLoading}
                    className="shrink-0 btn-glass border-border/50 hover:border-primary/40"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => onInputTypeSelect('layout')}>
                    <Grid3X3 className="h-4 w-4 mr-2" />
                    2D Layout
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onInputTypeSelect('room')}>
                    <Camera className="h-4 w-4 mr-2" />
                    Room Photo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onInputTypeSelect('style')}>
                    <Palette className="h-4 w-4 mr-2" />
                    Style Reference
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onInputTypeSelect('products')}>
                    <Box className="h-4 w-4 mr-2" />
                    Products
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  agentBEnabled
                    ? "Describe your design vision for Agent B..."
                    : isEditMode 
                      ? stagedItems.length > 0 
                        ? "Describe changes (staged items will replace furniture)..." 
                        : "Describe what to change (e.g., 'make walls blue', 'add plants')..."
                      : stagedItems.length > 0 
                        ? "Describe your design with staged furniture..." 
                        : "Describe your vision..."
                }
                disabled={isLoading}
                className="min-h-[44px] max-h-[120px] resize-none glass-input rounded-xl"
                rows={1}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className={cn(
                  "shrink-0",
                  agentBEnabled 
                    ? "bg-gradient-to-r from-primary to-accent hover:shadow-[0_0_20px_hsl(217_100%_58%/0.4)]"
                    : isEditMode 
                      ? "bg-amber-500 hover:bg-amber-600" 
                      : "btn-glow"
                )}
              >
                {agentBEnabled ? (
                  <Brain className="h-4 w-4" />
                ) : isEditMode ? (
                  <Edit3 className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
