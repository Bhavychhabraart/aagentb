import { useState, useRef, useEffect } from 'react';
import { Send, Upload, Loader2, Image as ImageIcon, Sparkles, FileImage, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    type?: 'text' | 'upload' | 'render';
    imageUrl?: string;
    status?: string;
  };
  created_at: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  onUploadClick: () => void;
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

export function ChatPanel({ messages, isLoading, onSendMessage, onUploadClick }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-foreground">Command History</h2>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {messages.length}
          </span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <ImageIcon className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Upload a room image or describe what you want to create.
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
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
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
                    <img
                      src={message.metadata.imageUrl}
                      alt="Uploaded"
                      className="rounded-md mb-2 max-w-full border border-border/50"
                    />
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
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={onUploadClick}
              disabled={isLoading}
              className="shrink-0"
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your vision..."
              disabled={isLoading}
              className="min-h-[44px] max-h-[120px] resize-none"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
