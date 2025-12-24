import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  Wand2,
  Download,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
  Grid3X3,
  Lightbulb,
  Zap,
  Droplets,
  Sofa,
  FileImage,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const toolConfig: Record<string, {
  title: string;
  subtitle: string;
  icon: typeof Grid3X3;
  color: string;
  description: string;
  features: string[];
}> = {
  "floor-plan": {
    title: "Architectural Floor Plan",
    subtitle: "Base Layout",
    icon: Grid3X3,
    color: "text-blue-400",
    description: "Generate a master reference drawing with walls, partitions, room dimensions, doors, and windows.",
    features: ["Wall detection", "Room tagging", "Scale calibration", "Opening markers"],
  },
  "rcp": {
    title: "RCP - Reflected Ceiling Plan",
    subtitle: "Ceiling Design",
    icon: Lightbulb,
    color: "text-amber-400",
    description: "Create a top-down ceiling view with lighting, AC diffusers, fans, and ceiling heights.",
    features: ["Ceiling types", "Light placement", "AC diffusers", "Height levels"],
  },
  "electrical": {
    title: "Electrical Plan",
    subtitle: "Power & Circuits",
    icon: Zap,
    color: "text-yellow-400",
    description: "Generate electrical layout with switchboards, sockets, light points, and circuit routing.",
    features: ["Switchboards", "Socket placement", "Circuit mapping", "DB location"],
  },
  "plumbing": {
    title: "Plumbing & Sanitary Plan",
    subtitle: "Water & Drainage",
    icon: Droplets,
    color: "text-cyan-400",
    description: "Design water supply and drainage systems with fixtures, pipes, and slopes.",
    features: ["Water lines", "Drainage routing", "Fixture placement", "Pipe sizing"],
  },
  "furniture": {
    title: "Furniture / Interior Layout",
    subtitle: "Furniture Plan",
    icon: Sofa,
    color: "text-purple-400",
    description: "Create furniture placement layouts with circulation paths and clearance validation.",
    features: ["Auto-placement", "Clearance check", "Style matching", "Circulation paths"],
  },
};

export default function DrawingToolWorkspace() {
  const { toolType } = useParams<{ toolType: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [uploadedLayout, setUploadedLayout] = useState<{
    file: File;
    preview: string;
    url?: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [zoom, setZoom] = useState(100);

  const tool = toolType ? toolConfig[toolType] : null;

  useEffect(() => {
    if (!tool) {
      navigate("/");
    }
  }, [tool, navigate]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setUploadedLayout({ file, preview });

    if (user) {
      setIsUploading(true);
      try {
        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}/drawing-tools/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("room-uploads")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from("room-uploads")
          .getPublicUrl(filePath);

        setUploadedLayout((prev) => prev ? { ...prev, url: publicUrl.publicUrl } : null);
        
        toast({
          title: "Layout uploaded",
          description: "Ready to generate your plan",
        });
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          title: "Upload failed",
          description: "Please try again",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  }, [user, toast]);

  const handleGenerate = async () => {
    if (!uploadedLayout?.url || !toolType) {
      toast({
        title: "Upload a layout first",
        description: "Please upload a base layout to generate your plan",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      navigate("/auth");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-drawing-plan", {
        body: {
          base_layout_url: uploadedLayout.url,
          plan_type: toolType,
          prompt: prompt || undefined,
          user_id: user.id,
        },
      });

      if (error) throw error;

      if (data?.plan_url) {
        setGeneratedPlan(data.plan_url);
        toast({
          title: "Plan generated!",
          description: `Your ${tool?.title} is ready`,
        });
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedPlan) {
      const link = document.createElement("a");
      link.href = generatedPlan;
      link.download = `${toolType}-plan.png`;
      link.click();
    }
  };

  if (!tool) return null;

  const ToolIcon = tool.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="glass-premium border-b border-border/30 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg bg-muted/50", tool.color)}>
                <ToolIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">{tool.title}</h1>
                <p className="text-xs text-muted-foreground">{tool.subtitle}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {generatedPlan && (
              <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Left Panel - Upload & Settings */}
        <aside className="w-80 border-r border-border/50 bg-card/30 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Upload Section */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Base Layout
                </h3>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.dwg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={cn(
                    "w-full aspect-[4/3] rounded-xl border-2 border-dashed",
                    "flex flex-col items-center justify-center gap-3",
                    "transition-all duration-300",
                    uploadedLayout
                      ? "border-primary/50 bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/30"
                  )}
                >
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  ) : uploadedLayout ? (
                    <div className="relative w-full h-full">
                      <img
                        src={uploadedLayout.preview}
                        alt="Uploaded layout"
                        className="w-full h-full object-contain rounded-lg"
                      />
                      <div className="absolute top-2 right-2 p-1.5 rounded-full bg-primary text-primary-foreground">
                        <Check className="w-3 h-3" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <FileImage className="w-8 h-8 text-muted-foreground" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">
                          Upload floor plan
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, DWG, or Image
                        </p>
                      </div>
                    </>
                  )}
                </motion.button>
              </div>

              {/* Description */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-sm text-muted-foreground">{tool.description}</p>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Plan Features
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {tool.features.map((feature) => (
                    <div
                      key={feature}
                      className="px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-xs text-muted-foreground"
                    >
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Prompt */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">
                  Additional Instructions (Optional)
                </h3>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., Use recessed lighting in living room, place DB near entrance..."
                  className="resize-none h-24 text-sm"
                />
              </div>
            </div>
          </ScrollArea>

          {/* Generate Button */}
          <div className="p-4 border-t border-border/50">
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleGenerate}
              disabled={!uploadedLayout?.url || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate {tool.subtitle}
                </>
              )}
            </Button>
          </div>
        </aside>

        {/* Main Canvas Area */}
        <main className="flex-1 flex flex-col">
          {/* Canvas Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-card/20">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Zoom: {zoom}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setZoom((z) => Math.max(25, z - 25))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setZoom((z) => Math.min(200, z + 25))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setZoom(100)}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center bg-muted/10 overflow-auto p-8">
            {generatedPlan ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ transform: `scale(${zoom / 100})` }}
                className="transition-transform origin-center"
              >
                <img
                  src={generatedPlan}
                  alt="Generated plan"
                  className="max-w-full rounded-lg shadow-2xl border border-border/50"
                />
              </motion.div>
            ) : uploadedLayout ? (
              <div className="text-center space-y-4">
                <div
                  style={{ transform: `scale(${zoom / 100})` }}
                  className="transition-transform origin-center"
                >
                  <img
                    src={uploadedLayout.preview}
                    alt="Base layout"
                    className="max-w-full max-h-[60vh] rounded-lg shadow-lg border border-border/50 opacity-50"
                  />
                </div>
                <p className="text-muted-foreground">
                  Click "Generate {tool.subtitle}" to create your plan
                </p>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="p-6 rounded-full bg-muted/30 inline-block">
                  <ToolIcon className={cn("w-12 h-12", tool.color)} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No layout uploaded
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Upload a base floor plan to generate your {tool.title.toLowerCase()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
