import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Package, Loader2, User, Calendar, Check, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SharedProduct {
  id: string;
  item_name: string;
  item_category: string;
  item_description: string | null;
  item_image_url: string | null;
  item_price: number | null;
  created_at: string;
  is_public: boolean;
}

interface ShareInfo {
  shared_by_user_id: string;
  allow_copy: boolean;
  created_at: string;
}

export default function SharedProductView() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<SharedProduct | null>(null);
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shareToken) {
      fetchSharedProduct();
    }
  }, [shareToken]);

  const fetchSharedProduct = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First get the share info
      const { data: shareData, error: shareError } = await supabase
        .from('shared_products')
        .select('product_id, shared_by_user_id, allow_copy, created_at')
        .eq('share_token', shareToken)
        .single();

      if (shareError || !shareData) {
        // Try direct token on staged_furniture
        const { data: directProduct, error: directError } = await supabase
          .from('staged_furniture')
          .select('*')
          .eq('share_token', shareToken)
          .single();

        if (directError || !directProduct) {
          setError('This share link is invalid or has expired.');
          return;
        }

        setProduct({
          id: directProduct.id,
          item_name: directProduct.item_name,
          item_category: directProduct.item_category,
          item_description: directProduct.item_description,
          item_image_url: directProduct.item_image_url,
          item_price: directProduct.item_price,
          created_at: directProduct.created_at,
          is_public: directProduct.is_public || false
        });
        setShareInfo({
          shared_by_user_id: directProduct.user_id,
          allow_copy: true,
          created_at: directProduct.shared_at || directProduct.created_at
        });
        return;
      }

      setShareInfo({
        shared_by_user_id: shareData.shared_by_user_id,
        allow_copy: shareData.allow_copy,
        created_at: shareData.created_at
      });

      // Get the product details
      const { data: productData, error: productError } = await supabase
        .from('staged_furniture')
        .select('*')
        .eq('id', shareData.product_id)
        .single();

      if (productError || !productData) {
        setError('This product is no longer available.');
        return;
      }

      setProduct({
        id: productData.id,
        item_name: productData.item_name,
        item_category: productData.item_category,
        item_description: productData.item_description,
        item_image_url: productData.item_image_url,
        item_price: productData.item_price,
        created_at: productData.created_at,
        is_public: productData.is_public || false
      });
    } catch (err) {
      console.error('Error fetching shared product:', err);
      setError('Failed to load shared product.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToLibrary = async () => {
    if (!user) {
      toast({ 
        title: 'Sign in required', 
        description: 'Please sign in to copy this product to your library.',
        action: <Button size="sm" onClick={() => navigate('/auth')}>Sign In</Button>
      });
      return;
    }

    if (!product || !shareInfo?.allow_copy) return;

    setCopying(true);
    try {
      const { error } = await supabase
        .from('staged_furniture')
        .insert({
          user_id: user.id,
          project_id: product.id, // Temporary, would need a default project
          catalog_item_id: `custom-copy-${Date.now()}`,
          item_name: `${product.item_name} (Copy)`,
          item_category: product.item_category,
          item_description: product.item_description,
          item_image_url: product.item_image_url,
          item_price: product.item_price
        });

      if (error) throw error;

      setCopied(true);
      toast({ title: 'Copied to library!', description: 'This product has been added to your custom library.' });
    } catch (err) {
      console.error('Failed to copy product:', err);
      toast({ variant: 'destructive', title: 'Failed to copy', description: 'Could not copy this product to your library.' });
    } finally {
      setCopying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading shared product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Shared Product</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                {product.is_public ? (
                  <>
                    <Globe className="h-3 w-3" />
                    Public product
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" />
                    Shared via link
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="aspect-square rounded-xl overflow-hidden bg-muted">
            {product.item_image_url ? (
              <img 
                src={product.item_image_url} 
                alt={product.item_name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-24 w-24 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <Badge className="mb-2">{product.item_category}</Badge>
              <h2 className="text-3xl font-bold">{product.item_name}</h2>
            </div>

            {product.item_description && (
              <p className="text-muted-foreground">{product.item_description}</p>
            )}

            {product.item_price && (
              <p className="text-3xl font-bold text-primary">
                ₹{product.item_price.toLocaleString('en-IN')}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Shared {new Date(shareInfo?.created_at || product.created_at).toLocaleDateString()}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 space-y-3">
              {shareInfo?.allow_copy && (
                <Button 
                  onClick={handleCopyToLibrary} 
                  disabled={copying || copied}
                  className="w-full gap-2"
                  size="lg"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Added to Library
                    </>
                  ) : copying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Copying...
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy to My Library
                    </>
                  )}
                </Button>
              )}

              {!user && (
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/auth')}
                  className="w-full"
                >
                  Sign in to save products
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
