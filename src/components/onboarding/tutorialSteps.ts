import { Sparkles, Wand2, MessageSquare, Layers, Package, Camera, History, Grid3X3 } from 'lucide-react';

export interface TutorialStep {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  icon: React.ComponentType<{ className?: string }>;
  spotlightPadding?: number;
}

export const workspaceTutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    targetSelector: '[data-tutorial="canvas"]',
    title: 'Welcome to Your Workspace',
    description: 'This is your main design canvas where AI-generated renders appear. Upload a room photo or describe your vision to get started.',
    position: 'bottom',
    icon: Sparkles,
    spotlightPadding: 20,
  },
  {
    id: 'toolbar',
    targetSelector: '[data-tutorial="toolbar"]',
    title: 'Design Toolbar',
    description: 'Access all your design tools here — editing, views, placement, and export options are just a click away.',
    position: 'bottom',
    icon: Grid3X3,
    spotlightPadding: 12,
  },
  {
    id: 'chat',
    targetSelector: '[data-tutorial="chat-panel"]',
    title: 'Design Chat',
    description: 'Chat with AI to describe your design vision. Toggle Agent B for a guided experience or send prompts directly.',
    position: 'left',
    icon: MessageSquare,
    spotlightPadding: 12,
  },
  {
    id: 'zones',
    targetSelector: '[data-tutorial="zones-btn"]',
    title: 'Zone Editing',
    description: 'Draw zones on your render to edit specific areas independently. Perfect for focused redesigns.',
    position: 'bottom',
    icon: Layers,
    spotlightPadding: 8,
  },
  {
    id: 'furnish',
    targetSelector: '[data-tutorial="furnish-btn"]',
    title: 'Auto Furnish',
    description: 'Let AI automatically suggest and place furniture in your space based on the room layout.',
    position: 'bottom',
    icon: Wand2,
    spotlightPadding: 8,
  },
  {
    id: 'views',
    targetSelector: '[data-tutorial="views-btn"]',
    title: 'Multi-Camera Views',
    description: 'Generate different camera angles of your design — perspective, front, side, top, and cinematic views.',
    position: 'bottom',
    icon: Camera,
    spotlightPadding: 8,
  },
  {
    id: 'assets',
    targetSelector: '[data-tutorial="assets-btn"]',
    title: 'Product Catalog',
    description: 'Browse and stage furniture from our catalog. Drag items onto your render to visualize them.',
    position: 'bottom',
    icon: Package,
    spotlightPadding: 8,
  },
  {
    id: 'history',
    targetSelector: '[data-tutorial="render-history"]',
    title: 'Render History',
    description: 'All your generated designs are saved here. Click any version to view or compare designs side by side.',
    position: 'top',
    icon: History,
    spotlightPadding: 12,
  },
];
