import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Send, Plus, Brain, Loader2, Image, Layout, Palette } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SleekChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  agentBEnabled?: boolean;
  onAgentBToggle?: (enabled: boolean) => void;
  onLayoutUpload?: () => void;
  onRoomPhotoUpload?: () => void;
  onStyleRefUpload?: () => void;
  onProductsPick?: () => void;
  placeholder?: string;
}

export function SleekChatInput({
  onSend,
  isLoading,
  agentBEnabled,
  onAgentBToggle,
  onLayoutUpload,
  onRoomPhotoUpload,
  onStyleRefUpload,
  onProductsPick,
  placeholder = 'Describe your vision...',
}: SleekChatInputProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="sleek-chat-input glass-premium rounded-2xl p-1.5 flex items-center gap-2">
        {/* Add menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'p-2.5 rounded-xl transition-all duration-200',
                'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                'focus:outline-none focus:ring-1 focus:ring-primary/30'
              )}
            >
              <Plus className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 glass-premium">
            {onLayoutUpload && (
              <DropdownMenuItem onClick={onLayoutUpload} className="gap-2">
                <Layout className="h-4 w-4" />
                Add 2D Layout
              </DropdownMenuItem>
            )}
            {onRoomPhotoUpload && (
              <DropdownMenuItem onClick={onRoomPhotoUpload} className="gap-2">
                <Image className="h-4 w-4" />
                Add Room Photo
              </DropdownMenuItem>
            )}
            {onStyleRefUpload && (
              <DropdownMenuItem onClick={onStyleRefUpload} className="gap-2">
                <Palette className="h-4 w-4" />
                Add Style Reference
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Agent B Toggle */}
        {onAgentBToggle && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onAgentBToggle(!agentBEnabled)}
                className={cn(
                  'p-2.5 rounded-xl transition-all duration-200',
                  'focus:outline-none focus:ring-1 focus:ring-primary/30',
                  agentBEnabled
                    ? 'text-primary bg-primary/10 hover:bg-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Brain className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <span>{agentBEnabled ? 'Agent B: On' : 'Agent B: Off'}</span>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className={cn(
            'flex-1 bg-transparent border-none outline-none',
            'text-sm text-foreground placeholder:text-muted-foreground/50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-w-0'
          )}
        />

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={!message.trim() || isLoading}
          className={cn(
            'p-2.5 rounded-xl transition-all duration-200',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            message.trim() && !isLoading
              ? 'btn-glow'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </TooltipProvider>
  );
}
