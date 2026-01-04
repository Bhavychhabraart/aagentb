import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Send, Plus, Brain, Loader2, Image, Layout, Palette, Package, Sparkles, X, Wand2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UploadedProduct {
  id: string;
  name: string;
  imageUrl: string;
}

interface SleekChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  agentBEnabled?: boolean;
  onAgentBToggle?: (enabled: boolean) => void;
  onLayoutUpload?: () => void;
  onRoomPhotoUpload?: () => void;
  onStyleRefUpload?: () => void;
  onProductsPick?: () => void;
  onOpenCatalog?: () => void;
  placeholder?: string;
  uploadedProducts?: UploadedProduct[];
  onClearProducts?: () => void;
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
  onOpenCatalog,
  placeholder = 'Describe your vision...',
  uploadedProducts = [],
  onClearProducts,
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

  const handleQuickAction = (action: string) => {
    if (action === 'use-products') {
      const productNames = uploadedProducts.slice(0, 2).map(p => p.name).join(', ');
      const suffix = uploadedProducts.length > 2 ? ` and ${uploadedProducts.length - 2} more` : '';
      setMessage(`Generate a room design featuring ${productNames}${suffix}`);
    }
    inputRef.current?.focus();
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-2">
        {/* Uploaded products indicator */}
        {uploadedProducts.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-3 py-2 bg-amber-500/10 rounded-xl border border-amber-500/20 animate-fade-in">
            <div className="flex items-center gap-3 min-w-0">
              {/* Thumbnail stack */}
              <div className="flex -space-x-2 shrink-0">
                {uploadedProducts.slice(0, 3).map((product) => (
                  <div
                    key={product.id}
                    className="w-7 h-7 rounded-full border-2 border-background overflow-hidden bg-muted"
                  >
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Package className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {uploadedProducts.length > 3 && (
                  <div className="w-7 h-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium">
                    +{uploadedProducts.length - 3}
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 truncate">
                {uploadedProducts.length} product{uploadedProducts.length !== 1 ? 's' : ''} ready
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleQuickAction('use-products')}
                className="px-2.5 py-1 text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-400 rounded-lg transition-colors flex items-center gap-1"
              >
                <Wand2 className="h-3 w-3" />
                Use in render
              </button>
              {onClearProducts && (
                <button
                  onClick={onClearProducts}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                  title="Clear products"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

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
              {onOpenCatalog && (
                <DropdownMenuItem onClick={onOpenCatalog} className="gap-2">
                  <Package className="h-4 w-4" />
                  Browse Catalog
                </DropdownMenuItem>
              )}
              {onProductsPick && (
                <DropdownMenuItem onClick={onProductsPick} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Add Products
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
      </div>
    </TooltipProvider>
  );
}
