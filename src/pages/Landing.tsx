import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, Grid3X3, Image, Palette, Package, Settings2, Loader2, X, Brain, Sparkles } from "lucide-react";
import { LayoutUploadModal } from "@/components/creation/LayoutUploadModal";
import { RoomPhotoModal } from "@/components/creation/RoomPhotoModal";
import { StyleRefModal } from "@/components/creation/StyleRefModal";
import { ProductPickerModal } from "@/components/creation/ProductPickerModal";
import { getMemorySettings, setMemoryEnabled } from "@/services/designMemoryService";
import { cn } from "@/lib/utils";

interface UploadedItem {
  file?: File;
  preview: string;
  name: string;
}

interface CreationSession {
  layout?: UploadedItem;
  roomPhoto?: UploadedItem;
  styleRefs: UploadedItem[];
  products: Array<{ name: string; imageUrl?: string }>;
  prompt: string;
}

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [session, setSession] = useState<CreationSession>({
    styleRefs: [],
    products: [],
    prompt: "",
  });

  const [projectName, setProjectName] = useState("");
  const [activeModal, setActiveModal] = useState<"layout" | "room" | "style" | "products" | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [memoryEnabled, setMemoryEnabledState] = useState(true);
  const [agentBModeEnabled, setAgentBModeEnabled] = useState(true);

  // Load memory settings
  useEffect(() => {
    if (user) {
      getMemorySettings(user.id).then(settings => {
        if (settings) {
          setMemoryEnabledState(settings.memory_enabled);
        }
      });
    }
  }, [user]);

  const handleMemoryToggle = async () => {
    if (!user) return;
    const newValue = !memoryEnabled;
    setMemoryEnabledState(newValue);
    await setMemoryEnabled(user.id, newValue);
    toast({
      title: newValue ? "Design Memory enabled" : "Design Memory disabled",
      description: newValue 
        ? "Your preferences will be learned and remembered." 
        : "Preferences won't be tracked.",
    });
  };

  const inputCards = [
    {
      id: "layout" as const,
      icon: Grid3X3,
      title: "2D Layout",
      description: "Upload floor plan",
      hasContent: !!session.layout,
    },
    {
      id: "room" as const,
      icon: Image,
      title: "Room Photo",
      description: "Upload room image",
      hasContent: !!session.roomPhoto,
    },
    {
      id: "style" as const,
      icon: Palette,
      title: "Style Ref",
      description: "Add mood board",
      hasContent: session.styleRefs.length > 0,
    },
    {
      id: "products" as const,
      icon: Package,
      title: "Products",
      description: "Add furniture",
      hasContent: session.products.length > 0,
    },
  ];

  const handleGenerate = async () => {
    if (!session.prompt.trim() && !session.layout && !session.roomPhoto && session.styleRefs.length === 0) {
      toast({
        title: "Add something to generate",
        description: "Please add a prompt or upload some references.",
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
      // Create a new project with name or fallback
      const finalProjectName = projectName.trim() || session.prompt.slice(0, 50) || "New Design";
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: finalProjectName,
          description: session.prompt,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Upload files and create records
      const uploadPromises: Promise<void>[] = [];

      // Upload layout
      if (session.layout?.file) {
        uploadPromises.push(
          uploadFile(session.layout.file, project.id, user.id, "layout")
        );
      }

      // Upload room photo
      if (session.roomPhoto?.file) {
        uploadPromises.push(
          uploadFile(session.roomPhoto.file, project.id, user.id, "room_photo")
        );
      }

      // Upload style refs
      for (const styleRef of session.styleRefs) {
        if (styleRef.file) {
          uploadPromises.push(
            uploadStyleRef(styleRef.file, project.id, user.id)
          );
        }
      }

      // Save products
      if (session.products.length > 0) {
        const { error: productsError } = await supabase.from("product_items").insert(
          session.products.map((p) => ({
            user_id: user.id,
            project_id: project.id,
            name: p.name,
            image_url: p.imageUrl,
          }))
        );
        if (productsError) throw productsError;
      }

      await Promise.all(uploadPromises);

      // Check if this is a "room photo only" scenario - go to staging mode
      const isRoomPhotoOnlyFlow = 
        session.roomPhoto && 
        !session.layout && 
        !session.prompt.trim() && 
        session.styleRefs.length === 0 &&
        session.products.length === 0;

      const params = new URLSearchParams({ project: project.id });

      if (isRoomPhotoOnlyFlow) {
        // Navigate to staging mode instead of triggering AI generation
        params.set("mode", "staging");
        params.set("hasRoom", "true");
        navigate(`/workspace?${params.toString()}`);
        return;
      }

      // If Agent B mode is enabled, go to Agent B onboarding flow
      if (agentBModeEnabled && (session.prompt.trim() || session.layout || session.roomPhoto)) {
        if (session.prompt.trim()) {
          params.set("prompt", encodeURIComponent(session.prompt));
        }
        if (memoryEnabled) {
          params.set("memoryEnabled", "true");
        }
        navigate(`/onboarding?${params.toString()}`);
        return;
      }

      // Standard flow (memory off) - navigate with generation params
      if (session.prompt.trim()) {
        params.set("prompt", encodeURIComponent(session.prompt));
      }
      if (session.layout) {
        params.set("hasLayout", "true");
      }
      if (session.roomPhoto) {
        params.set("hasRoom", "true");
      }
      if (session.styleRefs.length > 0) {
        params.set("styleCount", session.styleRefs.length.toString());
      }
      // Set generate flag if we have prompt or uploads
      if (session.prompt.trim() || session.layout || session.roomPhoto) {
        params.set("generate", "true");
      }
      navigate(`/workspace?${params.toString()}`);
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const uploadFile = async (file: File, projectId: string, userId: string, type: string) => {
    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/${projectId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("room-uploads")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage
      .from("room-uploads")
      .getPublicUrl(filePath);

    await supabase.from("room_uploads").insert({
      user_id: userId,
      project_id: projectId,
      file_url: publicUrl.publicUrl,
      file_name: file.name,
      upload_type: type,
    });
  };

  const uploadStyleRef = async (file: File, projectId: string, userId: string) => {
    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/${projectId}/style_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("room-uploads")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage
      .from("room-uploads")
      .getPublicUrl(filePath);

    await supabase.from("style_uploads").insert({
      user_id: userId,
      project_id: projectId,
      file_url: publicUrl.publicUrl,
      file_name: file.name,
    });
  };

  const clearItem = (type: "layout" | "room") => {
    setSession((prev) => ({
      ...prev,
      [type === "layout" ? "layout" : "roomPhoto"]: undefined,
    }));
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-[60%]">
          <svg
            viewBox="0 0 1440 600"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(217 91% 60% / 0.3)" />
                <stop offset="50%" stopColor="hsl(217 91% 50% / 0.15)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d="M0,100 C150,200 350,0 500,100 C650,200 750,0 900,100 C1050,200 1250,0 1440,100 L1440,600 L0,600 Z"
              fill="url(#wave-gradient)"
            />
          </svg>
        </div>
        {/* Glow orbs */}
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-semibold text-foreground">Agent B</h1>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Product
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Button variant="secondary" onClick={() => navigate("/workspace")}>
              Go to Workspace
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Log In
              </Button>
              <Button onClick={() => navigate("/auth")}>Try for free</Button>
            </>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-16 pb-32">
        {/* Hero text */}
        <div className="text-center mb-12 max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-4 leading-tight">
            Stage and Sell
            <br />
            Beautiful Spaces
          </h2>
          <p className="text-lg text-muted-foreground">
            Design, visualize, collaborate and present, all in one platform.
          </p>
        </div>

        {/* Input cards grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 w-full max-w-3xl">
          {inputCards.map((card) => (
            <button
              key={card.id}
              onClick={() => setActiveModal(card.id)}
              className={`relative group flex flex-col items-center justify-center p-6 rounded-xl border transition-all duration-200 ${
                card.hasContent
                  ? "bg-primary/10 border-primary/30 hover:border-primary/50"
                  : "bg-card/50 border-border hover:border-primary/30 hover:bg-card"
              }`}
            >
              {card.hasContent && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (card.id === "layout" || card.id === "room") {
                      clearItem(card.id === "layout" ? "layout" : "room");
                    } else if (card.id === "style") {
                      setSession((prev) => ({ ...prev, styleRefs: [] }));
                    } else {
                      setSession((prev) => ({ ...prev, products: [] }));
                    }
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
              <card.icon
                className={`w-8 h-8 mb-3 ${
                  card.hasContent ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span className="text-sm font-medium text-foreground">{card.title}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {card.hasContent
                  ? card.id === "style"
                    ? `${session.styleRefs.length} added`
                    : card.id === "products"
                    ? `${session.products.length} added`
                    : "Added"
                  : card.description}
              </span>
            </button>
          ))}
        </div>

        {/* Tools + Memory + Agent B buttons */}
        <div className="flex justify-center gap-2 mb-4">
          <Button variant="outline" size="sm" className="gap-2">
            <Settings2 className="w-4 h-4" />
            Tools
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleMemoryToggle}
            className={cn(
              "gap-2 transition-all duration-200",
              memoryEnabled && "border-primary/50 bg-primary/5 text-primary hover:bg-primary/10"
            )}
          >
            <Brain className={cn(
              "w-4 h-4 transition-colors",
              memoryEnabled && "text-primary"
            )} />
            Memory: {memoryEnabled ? "ON" : "OFF"}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAgentBModeEnabled(!agentBModeEnabled)}
            className={cn(
              "gap-2 transition-all duration-200",
              agentBModeEnabled && "border-violet-500/50 bg-violet-500/5 text-violet-500 hover:bg-violet-500/10"
            )}
          >
            <Sparkles className={cn(
              "w-4 h-4 transition-colors",
              agentBModeEnabled && "text-violet-500"
            )} />
            Agent B: {agentBModeEnabled ? "ON" : "OFF"}
          </Button>
        </div>

        {/* Project name + Prompt input */}
        <div className="w-full max-w-2xl space-y-3">
          {/* Project Name Input */}
          <div className="relative">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name (optional)"
              className="w-full px-4 py-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border focus:border-primary/50 focus:outline-none text-sm"
            />
          </div>
          
          {/* Prompt Textarea */}
          <div className="relative">
            <Textarea
              value={session.prompt}
              onChange={(e) => setSession((prev) => ({ ...prev, prompt: e.target.value }))}
              placeholder="Generate a cozy bedroom with warm tones and natural materials..."
              className="min-h-[100px] pr-14 resize-none bg-card/80 backdrop-blur-sm border-border focus:border-primary/50"
            />
            <Button
              size="icon"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="absolute bottom-3 right-3"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Modals */}
      <LayoutUploadModal
        open={activeModal === "layout"}
        onOpenChange={(open) => !open && setActiveModal(null)}
        onUpload={(item) => {
          setSession((prev) => ({ ...prev, layout: item }));
          setActiveModal(null);
        }}
        currentUpload={session.layout}
      />

      <RoomPhotoModal
        open={activeModal === "room"}
        onOpenChange={(open) => !open && setActiveModal(null)}
        onUpload={(item) => {
          setSession((prev) => ({ ...prev, roomPhoto: item }));
          setActiveModal(null);
        }}
        currentUpload={session.roomPhoto}
      />

      <StyleRefModal
        open={activeModal === "style"}
        onOpenChange={(open) => !open && setActiveModal(null)}
        onUpload={(items) => {
          setSession((prev) => ({ ...prev, styleRefs: items }));
          setActiveModal(null);
        }}
        currentUploads={session.styleRefs}
      />

      <ProductPickerModal
        open={activeModal === "products"}
        onOpenChange={(open) => !open && setActiveModal(null)}
        onSave={(products, asCollage) => {
          setSession((prev) => ({ ...prev, products }));
          // TODO: Handle asCollage flag for generation
          setActiveModal(null);
        }}
        currentProducts={session.products}
        userId={user?.id}
      />
    </div>
  );
}
