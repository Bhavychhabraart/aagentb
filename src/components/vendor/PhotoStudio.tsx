import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, User, Package, Check, Download, Trash2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VendorProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  sku: string | null;
  is_active: boolean;
}

interface GeneratedPhoto {
  id: string;
  product_id: string;
  image_url: string;
  template_name: string;
  photo_type: string;
  created_at: string;
}

interface PhotoStudioProps {
  products: VendorProduct[];
  vendorId: string;
}

// Classic Solo Templates
const SOLO_CLASSIC_TEMPLATES = [
  { id: "white-studio", name: "White Studio", description: "Pure white seamless background, soft shadows", preview: "bg-white" },
  { id: "black-studio", name: "Black Studio", description: "Dramatic black backdrop, rim lighting", preview: "bg-black" },
  { id: "gradient-gray", name: "Gradient Gray", description: "Subtle gray gradient, professional catalog style", preview: "bg-gradient-to-b from-gray-200 to-gray-400" },
  { id: "natural-wood", name: "Natural Wood", description: "Wooden surface, minimalist styling", preview: "bg-amber-700" },
  { id: "marble-elegance", name: "Marble Elegance", description: "White marble surface, luxury aesthetic", preview: "bg-gradient-to-br from-gray-100 via-white to-gray-200" },
  { id: "floating", name: "Floating", description: "Product floating with dramatic shadows", preview: "bg-gradient-to-t from-gray-300 to-gray-100" },
  { id: "colored-backdrop", name: "Colored Backdrop", description: "Vibrant solid color background", preview: "bg-gradient-to-br from-purple-500 to-pink-500" },
  { id: "soft-fabric", name: "Soft Fabric", description: "Neutral fabric draped background", preview: "bg-stone-300" },
  { id: "sunlit-natural", name: "Sunlit Natural", description: "Natural sunlight, soft shadows", preview: "bg-gradient-to-br from-amber-50 to-orange-100" },
  { id: "magazine-editorial", name: "Magazine Editorial", description: "High-end editorial styling", preview: "bg-gradient-to-r from-slate-100 to-slate-200" },
  { id: "360-showcase", name: "360 Showcase", description: "Multiple angles collage view", preview: "bg-gradient-to-r from-blue-100 to-cyan-100" },
  { id: "detail-focus", name: "Detail Focus", description: "Extreme close-up on textures", preview: "bg-gradient-to-br from-neutral-100 to-neutral-300" },
];

// Artistic Warm Tone Templates
const SOLO_ARTISTIC_TEMPLATES = [
  { id: "terracotta-studio", name: "Terracotta Studio", description: "Rich terracotta/burnt orange, warm dramatic lighting", preview: "bg-gradient-to-br from-orange-600 to-amber-700" },
  { id: "chocolate-moody", name: "Chocolate Moody", description: "Deep chocolate brown, sculptural shadows", preview: "bg-gradient-to-br from-amber-900 to-stone-800" },
  { id: "amber-glow", name: "Amber Glow", description: "Golden amber gradient, warm sculptural lighting", preview: "bg-gradient-to-br from-amber-500 to-orange-600" },
  { id: "ochre-earth", name: "Ochre Earth", description: "Earthy ochre/mustard tones, natural warmth", preview: "bg-gradient-to-br from-yellow-600 to-amber-600" },
  { id: "raw-wood-surface", name: "Raw Wood Surface", description: "Live-edge wood slab, organic styling", preview: "bg-gradient-to-br from-amber-800 to-yellow-900" },
  { id: "sculptural-shadow", name: "Sculptural Shadow", description: "Dramatic side lighting, deep shadows", preview: "bg-gradient-to-br from-stone-600 to-stone-800" },
  { id: "artisan-detail", name: "Artisan Detail", description: "Macro on wood grain, craftsmanship focus", preview: "bg-gradient-to-br from-amber-700 to-orange-800" },
  { id: "resin-art-surface", name: "Resin Art Surface", description: "Epoxy resin with natural wood patterns", preview: "bg-gradient-to-br from-amber-400 to-teal-600" },
  { id: "leather-backdrop", name: "Leather Backdrop", description: "Rich cognac leather texture background", preview: "bg-gradient-to-br from-orange-800 to-amber-900" },
  { id: "desert-warmth", name: "Desert Warmth", description: "Sand/terracotta gradient, minimalist", preview: "bg-gradient-to-br from-orange-200 to-amber-400" },
  { id: "museum-display", name: "Museum Display", description: "Gallery-style pedestal presentation", preview: "bg-gradient-to-br from-stone-100 to-stone-300" },
  { id: "organic-forms", name: "Organic Forms", description: "Curved surfaces, flowing shapes emphasized", preview: "bg-gradient-to-br from-stone-400 to-amber-500" },
];

// All Solo Templates Combined
const SOLO_TEMPLATES = [...SOLO_CLASSIC_TEMPLATES, ...SOLO_ARTISTIC_TEMPLATES];

// Classic Model/Lifestyle Templates
const MODEL_CLASSIC_TEMPLATES = [
  { id: "modern-living-room", name: "Modern Living Room", description: "Model interacting in contemporary living space", preview: "bg-gradient-to-br from-slate-200 to-slate-400" },
  { id: "cozy-bedroom", name: "Cozy Bedroom", description: "Warm, inviting bedroom setting", preview: "bg-gradient-to-br from-amber-100 to-orange-200" },
  { id: "home-office", name: "Home Office", description: "Professional work-from-home environment", preview: "bg-gradient-to-br from-blue-100 to-indigo-200" },
  { id: "kitchen-scene", name: "Kitchen Scene", description: "Bright kitchen setting with model", preview: "bg-gradient-to-br from-green-100 to-emerald-200" },
  { id: "outdoor-patio", name: "Outdoor Patio", description: "Outdoor lifestyle photography", preview: "bg-gradient-to-br from-green-200 to-teal-300" },
  { id: "restaurant-cafe", name: "Restaurant/Cafe", description: "Hospitality setting with ambiance", preview: "bg-gradient-to-br from-amber-200 to-yellow-300" },
  { id: "hotel-suite", name: "Hotel Suite", description: "Luxury hotel room ambiance", preview: "bg-gradient-to-br from-purple-100 to-violet-200" },
  { id: "balcony-view", name: "Balcony View", description: "Urban balcony with city backdrop", preview: "bg-gradient-to-br from-sky-200 to-blue-300" },
  { id: "garden-setting", name: "Garden Setting", description: "Lush garden outdoor scene", preview: "bg-gradient-to-br from-lime-200 to-green-300" },
  { id: "minimal-apartment", name: "Minimal Apartment", description: "Scandinavian minimal interior", preview: "bg-gradient-to-br from-gray-100 to-stone-200" },
  { id: "industrial-loft", name: "Industrial Loft", description: "Exposed brick, industrial styling", preview: "bg-gradient-to-br from-orange-200 to-red-300" },
  { id: "coastal-home", name: "Coastal Home", description: "Beach house, natural light", preview: "bg-gradient-to-br from-cyan-100 to-blue-200" },
  { id: "traditional-indian", name: "Traditional Indian", description: "Indian home interior styling", preview: "bg-gradient-to-br from-orange-300 to-amber-400" },
];

// Editorial Warm Tone Templates with Models
const MODEL_EDITORIAL_TEMPLATES = [
  { id: "warm-editorial", name: "Warm Editorial", description: "Model seated, warm brown studio, editorial pose", preview: "bg-gradient-to-br from-orange-700 to-amber-800" },
  { id: "sculptural-interaction", name: "Sculptural Interaction", description: "Model touching furniture as art piece", preview: "bg-gradient-to-br from-amber-800 to-stone-700" },
  { id: "intimate-moment", name: "Intimate Moment", description: "Casual seated pose, warm intimate lighting", preview: "bg-gradient-to-br from-orange-600 to-rose-700" },
  { id: "fashion-forward", name: "Fashion Forward", description: "Designer outfit with furniture as prop", preview: "bg-gradient-to-br from-stone-700 to-amber-700" },
  { id: "contemplative-pose", name: "Contemplative Pose", description: "Thoughtful position, sculptural composition", preview: "bg-gradient-to-br from-amber-600 to-orange-700" },
  { id: "artisan-workshop", name: "Artisan Workshop", description: "Model examining craftsmanship details", preview: "bg-gradient-to-br from-yellow-800 to-amber-900" },
  { id: "books-and-style", name: "Books & Style", description: "Model with books/accessories on furniture", preview: "bg-gradient-to-br from-stone-600 to-amber-700" },
  { id: "warm-earth-tones", name: "Warm Earth Tones", description: "Terracotta setting, lifestyle editorial", preview: "bg-gradient-to-br from-orange-500 to-red-600" },
  { id: "tropical-accent", name: "Tropical Accent", description: "Furniture with plant accents, model in scene", preview: "bg-gradient-to-br from-green-600 to-amber-600" },
  { id: "heritage-craftsmanship", name: "Heritage Craft", description: "Indian artisan aesthetic, traditional meets modern", preview: "bg-gradient-to-br from-amber-600 to-orange-700" },
  { id: "fabric-draped", name: "Fabric Draped", description: "Luxurious throw on furniture with model", preview: "bg-gradient-to-br from-rose-600 to-amber-600" },
  { id: "golden-hour-interior", name: "Golden Hour Interior", description: "Warm sunset light flooding interior", preview: "bg-gradient-to-br from-yellow-500 to-orange-500" },
];

// All Model Templates Combined
const MODEL_TEMPLATES = [...MODEL_CLASSIC_TEMPLATES, ...MODEL_EDITORIAL_TEMPLATES];

export function PhotoStudio({ products, vendorId }: PhotoStudioProps) {
  const [selectedProduct, setSelectedProduct] = useState<VendorProduct | null>(null);
  const [photoMode, setPhotoMode] = useState<"solo" | "model">("solo");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPhotos, setGeneratedPhotos] = useState<GeneratedPhoto[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);

  const templates = photoMode === "solo" ? SOLO_TEMPLATES : MODEL_TEMPLATES;

  useEffect(() => {
    fetchGeneratedPhotos();
  }, [vendorId]);

  const fetchGeneratedPhotos = async () => {
    setIsLoadingPhotos(true);
    const { data, error } = await supabase
      .from("vendor_product_photos")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching photos:", error);
    } else {
      setGeneratedPhotos(data || []);
    }
    setIsLoadingPhotos(false);
  };

  const handleGenerate = async () => {
    if (!selectedProduct || !selectedTemplate) {
      toast.error("Please select a product and template");
      return;
    }

    if (!selectedProduct.image_url) {
      toast.error("Selected product has no image");
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-product-photo", {
        body: {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          productCategory: selectedProduct.category,
          productImageUrl: selectedProduct.image_url,
          templateId: selectedTemplate,
          templateName: templates.find(t => t.id === selectedTemplate)?.name || selectedTemplate,
          photoType: photoMode,
        },
      });

      if (error) throw error;

      if (data?.imageUrl) {
        // Save to database
        const { error: insertError } = await supabase
          .from("vendor_product_photos")
          .insert({
            vendor_id: vendorId,
            product_id: selectedProduct.id,
            image_url: data.imageUrl,
            template_name: templates.find(t => t.id === selectedTemplate)?.name || selectedTemplate,
            photo_type: photoMode,
          });

        if (insertError) throw insertError;

        toast.success("Photo generated successfully!");
        fetchGeneratedPhotos();
      }
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate photo");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from("vendor_product_photos")
        .delete()
        .eq("id", photoId);

      if (error) throw error;

      toast.success("Photo deleted");
      setGeneratedPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (error: any) {
      toast.error("Failed to delete photo");
    }
  };

  const handleSetAsProductImage = async (photo: GeneratedPhoto) => {
    try {
      const { error } = await supabase
        .from("vendor_products")
        .update({ image_url: photo.image_url })
        .eq("id", photo.product_id);

      if (error) throw error;

      toast.success("Product image updated!");
    } catch (error: any) {
      toast.error("Failed to update product image");
    }
  };

  const handleDownload = async (imageUrl: string, productName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${productName.replace(/\s+/g, "-").toLowerCase()}-studio-photo.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Select Product */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Step 1: Select Product
          </CardTitle>
          <CardDescription>Choose a product from your catalog to photograph</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No products found. Add products first to use Photo Studio.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className={cn(
                    "relative cursor-pointer rounded-lg border-2 p-2 transition-all hover:border-primary/50",
                    selectedProduct?.id === product.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border"
                  )}
                >
                  {selectedProduct?.id === product.id && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                  <div className="aspect-square rounded bg-muted mb-2 overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{product.category}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Choose Photography Style */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Step 2: Choose Photography Style
          </CardTitle>
          <CardDescription>Select how you want your product to be photographed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => {
                setPhotoMode("solo");
                setSelectedTemplate(null);
              }}
              className={cn(
                "cursor-pointer rounded-xl border-2 p-6 text-center transition-all hover:border-primary/50",
                photoMode === "solo"
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              <Package className="h-12 w-12 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-1">Solo Shot</h3>
              <p className="text-sm text-muted-foreground">
                Clean studio backgrounds, professional product photography
              </p>
              <Badge variant="secondary" className="mt-3">24 templates</Badge>
            </div>
            <div
              onClick={() => {
                setPhotoMode("model");
                setSelectedTemplate(null);
              }}
              className={cn(
                "cursor-pointer rounded-xl border-2 p-6 text-center transition-all hover:border-primary/50",
                photoMode === "model"
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              <User className="h-12 w-12 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-1">With Model</h3>
              <p className="text-sm text-muted-foreground">
                Lifestyle photography with models in real settings
              </p>
              <Badge variant="secondary" className="mt-3">25 templates</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Select Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Step 3: Select Template
          </CardTitle>
          <CardDescription>
            Choose from {templates.length} professional {photoMode === "solo" ? "studio" : "lifestyle"} templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={cn(
                  "cursor-pointer rounded-lg border-2 overflow-hidden transition-all hover:border-primary/50",
                  selectedTemplate === template.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border"
                )}
              >
                <div className={cn("aspect-square", template.preview)} />
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{template.name}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={!selectedProduct || !selectedTemplate || isGenerating}
          className="min-w-[200px]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Photo
            </>
          )}
        </Button>
      </div>

      {/* Generated Photos Gallery */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Photos Gallery</CardTitle>
          <CardDescription>
            Your AI-generated product photos ({generatedPhotos.length} photos)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPhotos ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : generatedPhotos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No photos generated yet. Select a product and template to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {generatedPhotos.map((photo) => {
                const product = products.find(p => p.id === photo.product_id);
                return (
                  <div key={photo.id} className="group relative rounded-lg overflow-hidden border">
                    <div className="aspect-square">
                      <img
                        src={photo.image_url}
                        alt={`${product?.name || "Product"} - ${photo.template_name}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleDownload(photo.image_url, product?.name || "product")}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleSetAsProductImage(photo)}
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDeletePhoto(photo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{product?.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="outline" className="text-[10px]">
                          {photo.photo_type}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {photo.template_name}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
