import { useState } from "react";
import { WorkspaceHeader } from "@/components/moodboard/WorkspaceHeader";
import { LayersPanel } from "@/components/moodboard/LayersPanel";
import { CanvasArea } from "@/components/moodboard/CanvasArea";
import { CuratedLibrary } from "@/components/moodboard/CuratedLibrary";
import { WorkspaceFooter } from "@/components/moodboard/WorkspaceFooter";

export interface Material {
  id: string;
  name: string;
  color: string;
  texture?: string;
}

export interface DesignerNote {
  id: string;
  author: string;
  initials: string;
  content: string;
  timestamp: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  tagline?: string;
}

export interface Hotspot {
  id: string;
  x: number;
  y: number;
  productId: string;
}

const MoodBoardWorkspace = () => {
  const [currentProject] = useState({
    name: "Tranquil Loft",
    subtitle: "Intuitive Vision"
  });

  const [materials] = useState<Material[]>([
    { id: "1", name: "Oak Veneer", color: "#C4A77D" },
    { id: "2", name: "Polished Terrazzo", color: "#E8E4E1" },
    { id: "3", name: "Brushed Brass", color: "#D4A84B" }
  ]);

  const [designerNotes] = useState<DesignerNote[]>([
    {
      id: "1",
      author: "John Doe",
      initials: "JD",
      content: "Consider soft, diffused lighting for the lounge. Perhaps a minimalist pendant?",
      timestamp: "Just now"
    }
  ]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>({
    id: "1",
    name: "Elegant Lounge Chair",
    price: 4295,
    image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400",
    category: "Seating",
    tagline: "Timeless Design | Natural Wood & Fabric"
  });

  const [curatedProducts] = useState<Product[]>([
    { id: "1", name: "Minimalist Dining Chair", price: 1295, image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=200", category: "Seating" },
    { id: "2", name: "Elegant Lounge Chair", price: 4295, image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=200", category: "Seating" },
    { id: "3", name: "Orbital Pendant Light", price: 895, image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=200", category: "Illumination" },
    { id: "4", name: "Arc Floor Lamp", price: 1450, image: "https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?w=200", category: "Illumination" }
  ]);

  const [visionAIEnabled, setVisionAIEnabled] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [promptText, setPromptText] = useState("");

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 50));
  const handleAddProduct = (product: Product) => {
    console.log("Adding product:", product);
  };
  const handleSendPrompt = () => {
    if (promptText.trim()) {
      console.log("Sending prompt:", promptText);
      setPromptText("");
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 flex flex-col overflow-hidden">
      <WorkspaceHeader project={currentProject} />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <LayersPanel 
          materials={materials} 
          notes={designerNotes} 
        />
        
        {/* Main Canvas */}
        <CanvasArea 
          selectedProduct={selectedProduct}
          onProductSelect={setSelectedProduct}
          zoomLevel={zoomLevel}
        />
        
        {/* Right Panel */}
        <CuratedLibrary 
          products={curatedProducts}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddProduct={handleAddProduct}
        />
      </div>
      
      <WorkspaceFooter 
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        visionAIEnabled={visionAIEnabled}
        onToggleVisionAI={() => setVisionAIEnabled(!visionAIEnabled)}
        promptText={promptText}
        onPromptChange={setPromptText}
        onSendPrompt={handleSendPrompt}
      />
    </div>
  );
};

export default MoodBoardWorkspace;
