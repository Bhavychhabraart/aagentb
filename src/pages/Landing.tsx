import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LayoutUploadModal } from "@/components/creation/LayoutUploadModal";
import { RoomPhotoModal } from "@/components/creation/RoomPhotoModal";
import { StyleRefModal } from "@/components/creation/StyleRefModal";
import { ProductPickerModal } from "@/components/creation/ProductPickerModal";
import { getMemorySettings, setMemoryEnabled } from "@/services/designMemoryService";

// Landing page components
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { InputCards } from "@/components/landing/InputCards";
import { ControlButtons } from "@/components/landing/ControlButtons";
import { PromptSection } from "@/components/landing/PromptSection";
import { BackgroundEffects } from "@/components/landing/BackgroundEffects";

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

  const handleMemoryToggle = useCallback(async () => {
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
  }, [user, memoryEnabled, toast]);

  // Keyboard shortcut for generate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerate();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [session, projectName, user, agentBModeEnabled, memoryEnabled]);

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

      const uploadPromises: Promise<void>[] = [];

      if (session.layout?.file) {
        uploadPromises.push(uploadFile(session.layout.file, project.id, user.id, "layout"));
      }

      if (session.roomPhoto?.file) {
        uploadPromises.push(uploadFile(session.roomPhoto.file, project.id, user.id, "room_photo"));
      }

      for (const styleRef of session.styleRefs) {
        if (styleRef.file) {
          uploadPromises.push(uploadStyleRef(styleRef.file, project.id, user.id));
        }
      }

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

      const isRoomPhotoOnlyFlow = 
        session.roomPhoto && 
        !session.layout && 
        !session.prompt.trim() && 
        session.styleRefs.length === 0 &&
        session.products.length === 0;

      const params = new URLSearchParams({ project: project.id });

      if (isRoomPhotoOnlyFlow) {
        params.set("mode", "staging");
        params.set("hasRoom", "true");
        navigate(`/workspace?${params.toString()}`);
        return;
      }

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

  const handleClearItem = (id: "layout" | "room" | "style" | "products") => {
    if (id === "layout") {
      setSession((prev) => ({ ...prev, layout: undefined }));
    } else if (id === "room") {
      setSession((prev) => ({ ...prev, roomPhoto: undefined }));
    } else if (id === "style") {
      setSession((prev) => ({ ...prev, styleRefs: [] }));
    } else {
      setSession((prev) => ({ ...prev, products: [] }));
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <BackgroundEffects />
      
      <Header user={user} />

      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-12 pb-24">
        <HeroSection />

        <InputCards
          layout={session.layout}
          roomPhoto={session.roomPhoto}
          styleRefs={session.styleRefs}
          products={session.products}
          onCardClick={setActiveModal}
          onClear={handleClearItem}
        />

        <ControlButtons
          memoryEnabled={memoryEnabled}
          agentBEnabled={agentBModeEnabled}
          onMemoryToggle={handleMemoryToggle}
          onAgentBToggle={() => setAgentBModeEnabled(!agentBModeEnabled)}
        />

        <PromptSection
          projectName={projectName}
          prompt={session.prompt}
          isGenerating={isGenerating}
          onProjectNameChange={setProjectName}
          onPromptChange={(prompt) => setSession((prev) => ({ ...prev, prompt }))}
          onGenerate={handleGenerate}
        />
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
        onSave={(products) => {
          setSession((prev) => ({ ...prev, products }));
          setActiveModal(null);
        }}
        currentProducts={session.products}
        userId={user?.id}
      />
    </div>
  );
}
