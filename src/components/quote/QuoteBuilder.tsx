import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  FileText, 
  Sparkles, 
  Loader2, 
  Download, 
  Send, 
  Check,
  Image,
  Package,
  Palette,
  ChevronRight,
  Crown,
  Coins,
  Star
} from 'lucide-react';
import { QuoteItemRow } from './QuoteItemRow';
import { MaterialTierSelector } from './MaterialTierSelector';
import { RenderAnalysisPanel } from './RenderAnalysisPanel';
import { formatCurrency } from '@/utils/formatCurrency';

interface QuoteBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  roomId?: string;
  sourceRenderUrl?: string;
  sourceLayoutUrl?: string;
  stagedItems?: any[];
  quoteType?: 'manual' | 'render_analysis' | 'custom_products' | 'full_layout';
}

interface QuoteVersion {
  version_name: string;
  tier_level: number;
  items: any[];
  subtotal: number;
  commission: number;
  grand_total: number;
  is_recommended: boolean;
}

interface DetectedItem {
  label: string;
  category: string;
  position_x: number;
  position_y: number;
  style: string;
  color: string;
  features: string[];
  estimated_dimensions: { width: number; depth: number; height: number };
  base_price_estimate: number;
  catalog_match_id: string | null;
  catalog_match_name: string | null;
  match_confidence: number;
  materials_detected: string[];
}

export function QuoteBuilder({
  open,
  onOpenChange,
  projectId,
  roomId,
  sourceRenderUrl,
  sourceLayoutUrl,
  stagedItems = [],
  quoteType = 'manual'
}: QuoteBuilderProps) {
  const [step, setStep] = useState<'source' | 'analysis' | 'items' | 'client' | 'review'>('source');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Quote data
  const [selectedTier, setSelectedTier] = useState<'budget' | 'standard' | 'premium'>('standard');
  const [versions, setVersions] = useState<QuoteVersion[]>([]);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [roomAnalysis, setRoomAnalysis] = useState<any>(null);
  
  // Client info
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      if (sourceRenderUrl) {
        setStep('source');
      } else if (stagedItems.length > 0) {
        setStep('items');
        generateVariantsFromStaged();
      } else {
        setStep('source');
      }
    }
  }, [open, sourceRenderUrl, stagedItems]);

  const generateVariantsFromStaged = async () => {
    if (stagedItems.length === 0) return;

    setIsAnalyzing(true);
    try {
      const products = stagedItems.map(item => ({
        name: item.item_name,
        category: item.item_category,
        base_price: item.item_price || 15000,
        materials_detected: ['wood', 'fabric'],
        item_image_url: item.item_image_url
      }));

      const { data, error } = await supabase.functions.invoke('generate-quote', {
        body: {
          action: 'generate_variants',
          existingProducts: products,
          materialPricing: []
        }
      });

      if (error) throw error;
      if (data.versions) {
        setVersions(data.versions);
      }
    } catch (error) {
      console.error('Error generating variants:', error);
      toast.error('Failed to generate quote variants');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeRender = async () => {
    if (!sourceRenderUrl) {
      toast.error('No render image to analyze');
      return;
    }

    setIsAnalyzing(true);
    setStep('analysis');

    try {
      const { data, error } = await supabase.functions.invoke('generate-quote', {
        body: {
          action: 'analyze_render',
          renderUrl: sourceRenderUrl,
          catalogItems: []
        }
      });

      if (error) throw error;

      if (data.detected_items) {
        setDetectedItems(data.detected_items);
        setRoomAnalysis(data.room_analysis);
        
        // Auto-generate variants
        const variantsResult = await supabase.functions.invoke('generate-quote', {
          body: {
            action: 'generate_variants',
            existingProducts: data.detected_items.map((item: DetectedItem) => ({
              name: item.label,
              category: item.category,
              base_price: item.base_price_estimate,
              materials_detected: item.materials_detected,
              position_x: item.position_x,
              position_y: item.position_y
            })),
            materialPricing: []
          }
        });

        if (variantsResult.data?.versions) {
          setVersions(variantsResult.data.versions);
        }

        setStep('items');
      }
    } catch (error) {
      console.error('Error analyzing render:', error);
      toast.error('Failed to analyze render');
      setStep('source');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createCustomProducts = async () => {
    if (!sourceRenderUrl) return;

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quote', {
        body: {
          action: 'create_custom',
          renderUrl: sourceRenderUrl
        }
      });

      if (error) throw error;

      if (data.custom_products) {
        // Convert custom products to detected items format
        const customItems = data.custom_products.map((p: any) => ({
          label: p.name,
          category: p.category,
          position_x: p.position_x || 50,
          position_y: p.position_y || 50,
          style: data.overall_style || 'Modern',
          base_price_estimate: p.pricing?.standard?.price || 50000,
          materials_detected: Object.keys(p.materials || {}),
          catalog_match_id: null,
          catalog_match_name: null,
          match_confidence: 0,
          is_custom: true,
          dimensions: p.dimensions,
          pricing: p.pricing
        }));

        setDetectedItems(customItems);

        // Generate variants with custom pricing
        const products = customItems.map((item: any) => ({
          name: item.label,
          category: item.category,
          base_price: item.base_price_estimate,
          materials_detected: item.materials_detected,
          pricing: item.pricing
        }));

        // Use custom pricing tiers
        const budgetItems = products.map((p: any) => ({
          ...p,
          final_price: p.pricing?.budget?.price || p.base_price * 0.7,
          material_name: p.pricing?.budget?.materials || 'Budget materials'
        }));

        const standardItems = products.map((p: any) => ({
          ...p,
          final_price: p.pricing?.standard?.price || p.base_price,
          material_name: p.pricing?.standard?.materials || 'Standard materials'
        }));

        const premiumItems = products.map((p: any) => ({
          ...p,
          final_price: p.pricing?.premium?.price || p.base_price * 1.8,
          material_name: p.pricing?.premium?.materials || 'Premium materials'
        }));

        const commissionRate = 0.15;
        const budgetTotal = budgetItems.reduce((sum: number, i: any) => sum + i.final_price, 0);
        const standardTotal = standardItems.reduce((sum: number, i: any) => sum + i.final_price, 0);
        const premiumTotal = premiumItems.reduce((sum: number, i: any) => sum + i.final_price, 0);

        setVersions([
          {
            version_name: 'Budget',
            tier_level: 1,
            items: budgetItems,
            subtotal: budgetTotal,
            commission: Math.round(budgetTotal * commissionRate),
            grand_total: Math.round(budgetTotal * (1 + commissionRate)),
            is_recommended: false
          },
          {
            version_name: 'Standard',
            tier_level: 2,
            items: standardItems,
            subtotal: standardTotal,
            commission: Math.round(standardTotal * commissionRate),
            grand_total: Math.round(standardTotal * (1 + commissionRate)),
            is_recommended: true
          },
          {
            version_name: 'Premium',
            tier_level: 3,
            items: premiumItems,
            subtotal: premiumTotal,
            commission: Math.round(premiumTotal * commissionRate),
            grand_total: Math.round(premiumTotal * (1 + commissionRate)),
            is_recommended: false
          }
        ]);

        setStep('items');
      }
    } catch (error) {
      console.error('Error creating custom products:', error);
      toast.error('Failed to create custom products');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateQuoteNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `QT-${year}${month}-${random}`;
  };

  const saveQuote = async () => {
    if (!clientName) {
      toast.error('Please enter client name');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create quote
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          user_id: user.id,
          project_id: projectId,
          room_id: roomId || null,
          quote_number: generateQuoteNumber(),
          quote_type: quoteType,
          status: 'draft',
          source_render_url: sourceRenderUrl || null,
          source_layout_url: sourceLayoutUrl || null,
          client_name: clientName,
          client_email: clientEmail || null,
          client_phone: clientPhone || null,
          notes: notes || null,
          valid_until: validUntil || null
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create versions
      for (const version of versions) {
        const { data: versionData, error: versionError } = await supabase
          .from('quote_versions')
          .insert({
            quote_id: quote.id,
            version_name: version.version_name,
            tier_level: version.tier_level,
            subtotal: version.subtotal,
            commission: version.commission,
            grand_total: version.grand_total,
            is_recommended: version.is_recommended
          })
          .select()
          .single();

        if (versionError) throw versionError;

        // Create items for this version
        const itemsToInsert = version.items.map(item => ({
          quote_version_id: versionData.id,
          item_type: item.catalog_match_id ? 'catalog' : 'custom',
          catalog_item_id: item.catalog_match_id || null,
          item_name: item.name || item.label,
          item_category: item.category,
          item_description: item.description || null,
          item_image_url: item.item_image_url || null,
          material_name: item.material_name || null,
          material_category: item.materials_detected?.[0] || null,
          base_price: item.base_price || 0,
          material_upcharge: item.material_upcharge || 0,
          final_price: item.final_price || 0,
          quantity: 1,
          position_x: item.position_x || null,
          position_y: item.position_y || null,
          ai_confidence: item.match_confidence || null
        }));

        if (itemsToInsert.length > 0) {
          const { error: itemsError } = await supabase
            .from('quote_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }
      }

      toast.success('Quote saved successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving quote:', error);
      toast.error('Failed to save quote');
    } finally {
      setIsSaving(false);
    }
  };

  const currentVersion = versions.find(
    v => v.version_name.toLowerCase() === selectedTier
  ) || versions[1];

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'budget': return <Coins className="h-4 w-4" />;
      case 'standard': return <Star className="h-4 w-4" />;
      case 'premium': return <Crown className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Intelligent Quote Builder
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 py-3 border-b">
          {['source', 'analysis', 'items', 'client', 'review'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div 
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                  step === s 
                    ? 'bg-primary text-primary-foreground' 
                    : i < ['source', 'analysis', 'items', 'client', 'review'].indexOf(step)
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {s}
              </div>
              {i < 4 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
            </div>
          ))}
        </div>

        <ScrollArea className="flex-1 pr-4">
          {/* Source Selection Step */}
          {step === 'source' && (
            <div className="space-y-6 py-4">
              <h3 className="font-semibold">Select Quote Source</h3>
              
              {sourceRenderUrl && (
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start gap-4">
                    <img 
                      src={sourceRenderUrl} 
                      alt="Source render" 
                      className="w-48 h-32 object-cover rounded-lg"
                    />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Generate quote from this render
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          onClick={analyzeRender}
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                          )}
                          Analyze & Match Catalog
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={createCustomProducts}
                          disabled={isAnalyzing}
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Create Custom Products
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {stagedItems.length > 0 && (
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Staged Items ({stagedItems.length})</h4>
                      <p className="text-sm text-muted-foreground">
                        Generate quote from staged furniture
                      </p>
                    </div>
                    <Button onClick={() => { generateVariantsFromStaged(); setStep('items'); }}>
                      <Palette className="h-4 w-4 mr-2" />
                      Generate Material Variants
                    </Button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {stagedItems.slice(0, 6).map((item, i) => (
                      <div key={i} className="flex-shrink-0 w-20">
                        {item.item_image_url ? (
                          <img 
                            src={item.item_image_url} 
                            alt={item.item_name}
                            className="w-20 h-20 object-cover rounded"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-muted rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <p className="text-xs truncate mt-1">{item.item_name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!sourceRenderUrl && stagedItems.length === 0 && (
                <div className="text-center py-12 border border-dashed rounded-lg">
                  <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No render or staged items available.
                    <br />
                    Generate a render first or add items to stage.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Analysis Loading Step */}
          {step === 'analysis' && isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">Analyzing Render...</p>
              <p className="text-sm text-muted-foreground">
                Detecting furniture and matching to catalog
              </p>
            </div>
          )}

          {/* Items & Tiers Step */}
          {step === 'items' && (
            <div className="space-y-6 py-4">
              {/* Render Analysis Panel */}
              {detectedItems.length > 0 && sourceRenderUrl && (
                <RenderAnalysisPanel 
                  renderUrl={sourceRenderUrl}
                  detectedItems={detectedItems}
                  roomAnalysis={roomAnalysis}
                />
              )}

              <Separator />

              {/* Tier Selector */}
              <MaterialTierSelector
                versions={versions}
                selectedTier={selectedTier}
                onTierChange={setSelectedTier}
              />

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  {getTierIcon(selectedTier)}
                  {currentVersion?.version_name || 'Standard'} Tier Items
                  <Badge variant="outline" className="ml-2">
                    {currentVersion?.items.length || 0} items
                  </Badge>
                </h4>

                {currentVersion?.items.map((item, index) => (
                  <QuoteItemRow 
                    key={index} 
                    item={item}
                    tier={selectedTier}
                  />
                ))}
              </div>

              {/* Summary */}
              {currentVersion && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(currentVersion.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Commission (15%)</span>
                    <span>{formatCurrency(currentVersion.commission)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Grand Total</span>
                    <span className="text-primary">
                      {formatCurrency(currentVersion.grand_total)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setStep('client')}>
                  Continue to Client Details
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Client Details Step */}
          {step === 'client' && (
            <div className="space-y-6 py-4">
              <h3 className="font-semibold">Client Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Enter client name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Phone</Label>
                  <Input
                    id="clientPhone"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes or terms..."
                  rows={4}
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('items')}>
                  Back to Items
                </Button>
                <Button onClick={() => setStep('review')}>
                  Review Quote
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Review Step */}
          {step === 'review' && (
            <div className="space-y-6 py-4">
              <h3 className="font-semibold">Review Quote</h3>

              {/* Client Summary */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Client</h4>
                <p className="text-sm">{clientName}</p>
                {clientEmail && <p className="text-sm text-muted-foreground">{clientEmail}</p>}
                {clientPhone && <p className="text-sm text-muted-foreground">{clientPhone}</p>}
              </div>

              {/* Quote Versions Summary */}
              <div className="space-y-3">
                <h4 className="font-medium">Quote Versions</h4>
                {versions.map((version) => (
                  <div 
                    key={version.tier_level}
                    className={`border rounded-lg p-4 ${
                      version.is_recommended ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTierIcon(version.version_name.toLowerCase())}
                        <span className="font-medium">{version.version_name}</span>
                        {version.is_recommended && (
                          <Badge className="bg-primary/20 text-primary">Recommended</Badge>
                        )}
                      </div>
                      <span className="font-semibold text-lg">
                        {formatCurrency(version.grand_total)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {version.items.length} items • Subtotal: {formatCurrency(version.subtotal)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('client')}>
                  Back to Client
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button onClick={saveQuote} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Save Quote
                  </Button>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
