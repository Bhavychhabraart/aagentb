import { useState, useRef, useEffect } from 'react';
import { Send, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-medium text-foreground">Command</h2>
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
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm animate-slide-up',
                  message.role === 'user'
                    ? 'chat-message-user ml-4'
                    : 'chat-message-assistant mr-4'
                )}
              >
                {message.metadata?.imageUrl && (
                  <img
                    src={message.metadata.imageUrl}
                    alt="Uploaded"
                    className="rounded-md mb-2 max-w-full"
                  />
                )}
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.metadata?.status && (
                  <p className={cn(
                    'text-xs mt-1 font-mono',
                    message.metadata.status === 'pending' && 'status-pending',
                    message.metadata.status === 'analyzing' && 'status-analyzing',
                    message.metadata.status === 'ready' && 'status-ready',
                    message.metadata.status === 'failed' && 'status-failed'
                  )}>
                    {message.metadata.status}
                  </p>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="chat-message-assistant mr-4 px-3 py-2 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
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