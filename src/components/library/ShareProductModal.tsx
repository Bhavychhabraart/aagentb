import { useState } from 'react';
import { Copy, Link2, Check, Globe, Lock, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ShareProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    item_name: string;
    share_token?: string | null;
    is_public?: boolean;
  } | null;
  onShareCreated?: (shareToken: string) => void;
}

export function ShareProductModal({ open, onOpenChange, product, onShareCreated }: ShareProductModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPublic, setIsPublic] = useState(product?.is_public || false);
  const [allowCopy, setAllowCopy] = useState(true);
  const [shareLink, setShareLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateShareToken = () => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;
  };

  const generateShareLink = async () => {
    if (!product || !user) return;
    
    setIsGenerating(true);
    try {
      const shareToken = product.share_token || generateShareToken();
      
      // Update staged_furniture with share token and public status
      const { error: updateError } = await supabase
        .from('staged_furniture')
        .update({ 
          share_token: shareToken,
          is_public: isPublic,
          shared_at: new Date().toISOString()
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      // Create shared_products entry
      const { error: shareError } = await supabase
        .from('shared_products')
        .upsert({
          product_id: product.id,
          shared_by_user_id: user.id,
          share_token: shareToken,
          is_public: isPublic,
          allow_copy: allowCopy
        }, { onConflict: 'share_token' });

      if (shareError) throw shareError;

      const link = `${window.location.origin}/shared/${shareToken}`;
      setShareLink(link);
      onShareCreated?.(shareToken);
      
      toast({ title: 'Share link created!', description: 'Copy the link to share this product.' });
    } catch (error) {
      console.error('Failed to generate share link:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate share link.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast({ title: 'Link copied!' });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to copy' });
    }
  };

  const handleClose = () => {
    setShareLink('');
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Share Product
          </DialogTitle>
          <DialogDescription>
            Share "{product?.item_name}" with others via link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Public toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="h-5 w-5 text-green-500" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="public-toggle" className="text-sm font-medium">
                  Make Public
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isPublic ? 'Anyone can discover this product' : 'Only people with the link can view'}
                </p>
              </div>
            </div>
            <Switch
              id="public-toggle"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {/* Allow copy toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="copy-toggle" className="text-sm font-medium">
                Allow Copy to Library
              </Label>
              <p className="text-xs text-muted-foreground">
                Others can save a copy to their own library
              </p>
            </div>
            <Switch
              id="copy-toggle"
              checked={allowCopy}
              onCheckedChange={setAllowCopy}
            />
          </div>

          {/* Generate / Show Link */}
          {!shareLink ? (
            <Button 
              onClick={generateShareLink} 
              disabled={isGenerating}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Generate Share Link
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <Label>Share Link</Label>
              <div className="flex gap-2">
                <Input 
                  value={shareLink} 
                  readOnly 
                  className="bg-muted/50 text-sm"
                />
                <Button 
                  size="icon" 
                  variant="outline" 
                  onClick={copyToClipboard}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can view this product
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
