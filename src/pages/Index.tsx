import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ChatPanel, ChatMessage, ChatInputType, AgentBState } from '@/components/canvas/ChatPanel';
import { AgentBUnderstanding } from '@/components/canvas/AgentBBrief';
import { AgentBQuestion, AgentBAnswer } from '@/components/canvas/AgentBQuestions';
import { RenderViewer } from '@/components/canvas/RenderViewer';
import { PremiumWorkspace, Zone, PolygonPoint, ViewType, viewTypeOptions } from '@/components/canvas/PremiumWorkspace';
import { SleekChatInput } from '@/components/canvas/SleekChatInput';
import { StagedItemsDock } from '@/components/canvas/StagedItemsDock';
import { StagedItemsModal } from '@/components/canvas/StagedItemsModal';
import { CameraData } from '@/components/canvas/CameraPlacement';
import { UploadDialog } from '@/components/canvas/UploadDialog';
import { ExportModal } from '@/components/canvas/ExportModal';
import { OrderFlowModal } from '@/components/canvas/OrderFlowModal';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CatalogFurnitureItem, fetchFurnitureCatalog } from '@/services/catalogService';
import { FurniturePositioner, FurniturePlacement } from '@/components/canvas/FurniturePositioner';
import { ProjectData } from '@/services/documentService';
import { SelectionRegion } from '@/components/canvas/SelectionOverlay';
import { SelectiveEditPanel } from '@/components/canvas/SelectiveEditPanel';
import { generateSelectionMask } from '@/utils/generateSelectionMask';
import { RenderHistoryItem } from '@/components/canvas/RenderHistoryCarousel';
import { CameraView, ZoneRegion } from '@/components/canvas/MulticamPanel';
import { LayoutUploadModal } from '@/components/creation/LayoutUploadModal';
import { LayoutZoneModal } from '@/components/canvas/LayoutZoneModal';
import { ZoneComparisonModal } from '@/components/canvas/ZoneComparisonModal';
import { RoomPhotoModal } from '@/components/creation/RoomPhotoModal';
import { StyleRefModal } from '@/components/creation/StyleRefModal';
import { ProductPickerModal, ProductItem } from '@/components/creation/ProductPickerModal';
import { PageTransition } from '@/components/layout/PageTransition';
import { AIDetectionOverlay, DetectedItem } from '@/components/canvas/AIDetectionOverlay';
import { FloatingAssetsPanel } from '@/components/canvas/FloatingAssetsPanel';
import { AutoFurnishPanel } from '@/components/canvas/AutoFurnishPanel';
import { FullScreenCatalogModal } from '@/components/canvas/FullScreenCatalogModal';
import { MarkerStagingPanel, StagingMarker } from '@/components/canvas/MarkerStagingPanel';
import { Button } from '@/components/ui/button';
import { Move, Plus } from 'lucide-react';
import { formatDownloadFilename } from '@/utils/formatDownloadFilename';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cropZoneFromRender, cropPolygonFromRender } from '@/utils/cropZoneImage';
import { getImageAspectRatio } from '@/utils/imageAspectRatio';
import {
  getMemorySettings,
  setMemoryEnabled,
  getPreferencesContext,
  recordPreferences,
  mapQuestionToCategory,
  UserPreferencesContext,
} from '@/services/designMemoryService';

interface RoomUpload {
  id: string;
  file_url: string;
  upload_type: string;
  analysis_status: string;
  analysis_result: Record<string, unknown> | null;
}

interface ProjectReferences {
  layoutUrl: string | null;
  roomPhotoUrl: string | null;
  styleRefUrls: string[];
  productItems: Array<{ name: string; imageUrl: string }>;
}

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentRenderUrl, setCurrentRenderUrl] = useState<string | null>(null);
  const [currentRenderId, setCurrentRenderId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUpload, setCurrentUpload] = useState<RoomUpload | null>(null);
  const hasTriggeredGeneration = useRef(false);
  const [stagedItems, setStagedItems] = useState<CatalogFurnitureItem[]>([]);
  const [layoutImageUrl, setLayoutImageUrl] = useState<string | null>(null);
  const [roomPhotoUrl, setRoomPhotoUrl] = useState<string | null>(null);
  const [isStagingMode, setIsStagingMode] = useState(false);
  const [showPositioner, setShowPositioner] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [styleRefUrls, setStyleRefUrls] = useState<string[]>([]);
  const [allRenderUrls, setAllRenderUrls] = useState<string[]>([]);
  const [allRenders, setAllRenders] = useState<RenderHistoryItem[]>([]);
  const [isSelectiveEditing, setIsSelectiveEditing] = useState(false);
  const [isProjectSwitching, setIsProjectSwitching] = useState(false);
  const [isMulticamGenerating, setIsMulticamGenerating] = useState(false);
  const [showMulticamPanel, setShowMulticamPanel] = useState(false);
  const [generatingZoneName, setGeneratingZoneName] = useState<string | null>(null);
  const [generatingViewType, setGeneratingViewType] = useState<ViewType | null>(null);
  const [multicamViews, setMulticamViews] = useState<Record<CameraView, string | null>>({
    perspective: null,
    front: null,
    side: null,
    top: null,
    cinematic: null,
    custom: null,
  });
  
  // Camera placement state
  const [cameras, setCameras] = useState<CameraData[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [isRoomLocked, setIsRoomLocked] = useState(false);
  const [useSplitWorkspace, setUseSplitWorkspace] = useState(true); // New dual-pane mode
  
  // Chat input modals
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  const [showRoomPhotoModal, setShowRoomPhotoModal] = useState(false);
  const [showStyleRefModal, setShowStyleRefModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);

  // Zone selection state
  const [showZonesPanel, setShowZonesPanel] = useState(false);
  const [showLayoutZoneModal, setShowLayoutZoneModal] = useState(false);
  const [isDrawingZone, setIsDrawingZone] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  
  // Zone comparison state
  const [comparisonZone, setComparisonZone] = useState<Zone | null>(null);

  // Agent B state
  const [agentBEnabled, setAgentBEnabled] = useState(false);
  const [agentBState, setAgentBState] = useState<AgentBState>('idle');
  const [agentBUnderstanding, setAgentBUnderstanding] = useState<AgentBUnderstanding | null>(null);
  const [agentBQuestions, setAgentBQuestions] = useState<AgentBQuestion[]>([]);
  const [agentBAnswers, setAgentBAnswers] = useState<AgentBAnswer[]>([]);
  const [agentBProgress, setAgentBProgress] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [agentBUserPrompt, setAgentBUserPrompt] = useState('');
  const [wantsNewRender, setWantsNewRender] = useState(true); // Controls whether to use Agent B flow for new generation

  // Design Memory state
  const [memoryEnabled, setMemoryEnabledState] = useState(true);
  const [userPreferences, setUserPreferences] = useState<UserPreferencesContext | null>(null);
  const [isLearning, setIsLearning] = useState(false);

  // Enhanced tools state
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isAIDetectionActive, setIsAIDetectionActive] = useState(false);
  const [selectedDetections, setSelectedDetections] = useState<string[]>([]);
  const [isEraserMode, setIsEraserMode] = useState(false);
  const [showAutoFurnish, setShowAutoFurnish] = useState(false);
  const [showAssetsPanel, setShowAssetsPanel] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogItems, setCatalogItems] = useState<CatalogFurnitureItem[]>([]);
  
  // Detection replacement tracking state
  const [detectionReplacements, setDetectionReplacements] = useState<Map<string, CatalogFurnitureItem>>(new Map());
  const [lockedDetections, setLockedDetections] = useState<Set<string>>(new Set());
  const [replacingDetectionId, setReplacingDetectionId] = useState<string | null>(null);
  
  // Uploaded products state - tracks recently uploaded products for display
  const [uploadedProducts, setUploadedProducts] = useState<Array<{ id: string; name: string; imageUrl: string }>>([]);
  const [replacingDetectionLabel, setReplacingDetectionLabel] = useState<string>('');
  
  // Find similar AI state
  const [isFindingSimilar, setIsFindingSimilar] = useState(false);
  const [similarSearchData, setSimilarSearchData] = useState<{
    searchTerms: string[];
    category: string;
    itemLabel: string;
  } | null>(null);
  
  // Selection tool state
  const [selectionMode, setSelectionMode] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<SelectionRegion | null>(null);

  // Start Over and Upscale state
  const [showStartOverDialog, setShowStartOverDialog] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [showStagedItemsModal, setShowStagedItemsModal] = useState(false);

  // Marker staging state
  const [showMarkerStaging, setShowMarkerStaging] = useState(false);
  const [stagingMarkers, setStagingMarkers] = useState<Array<{
    id: string;
    position: { x: number; y: number };
    product: CatalogFurnitureItem | null;
    existingLabel?: string;
    confirmed: boolean;
  }>>([]);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [isMarkerCatalogOpen, setIsMarkerCatalogOpen] = useState(false);

  // Load memory settings on user login
  useEffect(() => {
    if (user) {
      getMemorySettings(user.id).then(settings => {
        setMemoryEnabledState(settings?.memory_enabled ?? true);
      });
      getPreferencesContext(user.id).then(setUserPreferences);
    }
  }, [user]);

  // Load catalog items for the full-screen modal
  useEffect(() => {
    fetchFurnitureCatalog().then(setCatalogItems);
  }, []);

  // Toggle memory enabled
  const handleMemoryToggle = useCallback(async (enabled: boolean) => {
    if (!user) return;
    setMemoryEnabledState(enabled);
    await setMemoryEnabled(user.id, enabled);
  }, [user]);

  // Learn from Agent B answers
  const learnFromAgentBAnswers = useCallback(async () => {
    if (!user || !memoryEnabled || !agentBUnderstanding) return;
    
    setIsLearning(true);
    const prefsToRecord: Array<{ category: any; key: string; source: any; weight?: number }> = [];

    // Learn detected style
    if (agentBUnderstanding.detectedStyle) {
      prefsToRecord.push({ category: 'style', key: agentBUnderstanding.detectedStyle, source: 'agent_b_analysis', weight: 2 });
    }

    // Learn colors
    for (const color of agentBUnderstanding.colorPalette || []) {
      prefsToRecord.push({ category: 'color', key: color, source: 'agent_b_analysis', weight: 1 });
    }

    // Learn from answers
    for (const answer of agentBAnswers) {
      const question = agentBQuestions.find(q => q.id === answer.questionId);
      if (question) {
        const category = mapQuestionToCategory(question.question);
        for (const option of answer.selectedOptions) {
          if (option !== 'custom') {
            prefsToRecord.push({ category, key: option, source: 'agent_b_answer', weight: 3 });
          }
        }
        if (answer.customText) {
          prefsToRecord.push({ category, key: answer.customText, source: 'agent_b_answer', weight: 3 });
        }
      }
    }

    await recordPreferences(user.id, prefsToRecord);
    // Refresh preferences
    getPreferencesContext(user.id).then(setUserPreferences);
    setIsLearning(false);
  }, [user, memoryEnabled, agentBUnderstanding, agentBAnswers, agentBQuestions]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Load project from URL or auto-create
  useEffect(() => {
    if (user) {
      const projectIdFromUrl = searchParams.get('project');
      if (projectIdFromUrl && projectIdFromUrl !== currentProjectId) {
        setCurrentProjectId(projectIdFromUrl);
      } else if (!currentProjectId) {
        loadOrCreateProject();
      }
    }
  }, [user, searchParams, currentProjectId]);

  // Load messages when project changes
  useEffect(() => {
    if (currentProjectId) {
      const loadProjectData = async () => {
        try {
          await Promise.all([
            loadMessages(),
            loadLatestUpload(),
            loadLatestRender(),
            loadStagedFurniture(),
            loadLayoutImage(),
            loadRoomPhoto(),
            loadProjectDetails(),
            loadAllRenders(),
          ]);
        } finally {
          setIsProjectSwitching(false);
        }
      };
      
      loadProjectData();
      
      // Check for staging mode from URL params
      const mode = searchParams.get('mode');
      if (mode === 'staging') {
        setIsStagingMode(true);
        // Clear the mode param from URL
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('mode');
        newParams.delete('hasRoom');
        setSearchParams(newParams, { replace: true });
        
        // Add welcome message for staging mode
        addStagingWelcomeMessage();
      }

      // Check for Agent B onboarding data from /onboarding page
      const fromOnboarding = searchParams.get('fromOnboarding');
      if (fromOnboarding === 'true') {
        const onboardingDataStr = localStorage.getItem(`agentb_onboarding_${currentProjectId}`);
        if (onboardingDataStr) {
          try {
            const onboardingData = JSON.parse(onboardingDataStr);
            // Set Agent B state from onboarding
            setAgentBUnderstanding(onboardingData.understanding);
            setAgentBQuestions(onboardingData.questions || []);
            setAgentBAnswers(onboardingData.answers || []);
            setAgentBUserPrompt(onboardingData.prompt || '');
            setAgentBState('confirmation');
            // Clear from localStorage
            localStorage.removeItem(`agentb_onboarding_${currentProjectId}`);
            // Clear URL params
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('fromOnboarding');
            setSearchParams(newParams, { replace: true });
          } catch (e) {
            console.error('Failed to parse onboarding data:', e);
          }
        }
      }
    }
  }, [currentProjectId]);

  // Load layout image for comparison view
  const loadLayoutImage = async () => {
    if (!currentProjectId) return;
    
    const { data } = await supabase
      .from('room_uploads')
      .select('file_url')
      .eq('project_id', currentProjectId)
      .eq('upload_type', 'layout')
      .limit(1)
      .maybeSingle();
    
    setLayoutImageUrl(data?.file_url || null);
  };

  // Load room photo for staging mode
  const loadRoomPhoto = async () => {
    if (!currentProjectId) return;
    
    const { data } = await supabase
      .from('room_uploads')
      .select('file_url')
      .eq('project_id', currentProjectId)
      .eq('upload_type', 'room_photo')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    setRoomPhotoUrl(data?.file_url || null);
  };

  // Add staging mode welcome message
  const addStagingWelcomeMessage = async () => {
    if (!currentProjectId || !user) return;
    
    const welcomeContent = `Room photo uploaded! You're now in staging mode.\n\nBrowse the **Catalog** tab to add furniture, then use **Position Furniture** to place items in your room. When you're ready, describe your design vision to generate an AI render.`;
    
    // Check if we already have a welcome message
    const { data: existingMessages } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('project_id', currentProjectId)
      .limit(1);
    
    if (existingMessages && existingMessages.length > 0) return;
    
    await supabase.from('chat_messages').insert({
      project_id: currentProjectId,
      user_id: user.id,
      role: 'assistant',
      content: welcomeContent,
      metadata: { type: 'text' },
    });
    
    setMessages(prev => [...prev, {
      id: `staging-welcome-${Date.now()}`,
      role: 'assistant',
      content: welcomeContent,
      metadata: { type: 'text' },
      created_at: new Date().toISOString(),
    }]);
  };

  // Load project name and style references
  const loadProjectDetails = async () => {
    if (!currentProjectId) return;
    
    // Load project name
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', currentProjectId)
      .single();
    
    if (project?.name) {
      setProjectName(project.name);
    }
    
    // Load style reference URLs
    const { data: styleUploads } = await supabase
      .from('style_uploads')
      .select('file_url')
      .eq('project_id', currentProjectId);
    
    setStyleRefUrls(styleUploads?.map(s => s.file_url) || []);
  };

  // Load all renders for the project
  const loadAllRenders = async () => {
    if (!currentProjectId) return;
    
    const { data: renders } = await supabase
      .from('renders')
      .select('id, render_url, prompt, parent_render_id, created_at, view_type')
      .eq('project_id', currentProjectId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    
    const historyItems: RenderHistoryItem[] = (renders || [])
      .filter(r => r.render_url)
      .map(r => ({
        id: r.id,
        render_url: r.render_url!,
        prompt: r.prompt,
        parent_render_id: r.parent_render_id,
        created_at: r.created_at,
        view_type: r.view_type || 'original',
      }));
    
    setAllRenders(historyItems);
    setAllRenderUrls(historyItems.map(r => r.render_url));
  };

  const loadOrCreateProject = async () => {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Failed to load projects:', error);
      return;
    }

    if (projects && projects.length > 0) {
      setCurrentProjectId(projects[0].id);
    } else {
      // Create first project
      const { data: newProject, error: createError } = await supabase
        .from('projects')
        .insert({ user_id: user!.id, name: 'My First Project' })
        .select('id')
        .single();

      if (createError) {
        console.error('Failed to create project:', createError);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to create project.' });
      } else {
        setCurrentProjectId(newProject.id);
      }
    }
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load messages:', error);
      return;
    }

    const formattedMessages: ChatMessage[] = (data || []).map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      metadata: msg.metadata as ChatMessage['metadata'],
      created_at: msg.created_at,
    }));
    setMessages(formattedMessages);

    // Check if we should auto-trigger generation (coming from Landing page)
    const shouldGenerate = searchParams.get('generate') === 'true';
    const promptFromUrl = searchParams.get('prompt');
    const hasLayout = searchParams.get('hasLayout') === 'true';
    const hasRoom = searchParams.get('hasRoom') === 'true';
    const styleCount = parseInt(searchParams.get('styleCount') || '0', 10);
    
    if (shouldGenerate && !hasTriggeredGeneration.current) {
      hasTriggeredGeneration.current = true;
      
      // Remove all landing params from URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('generate');
      newParams.delete('prompt');
      newParams.delete('hasLayout');
      newParams.delete('hasRoom');
      newParams.delete('styleCount');
      setSearchParams(newParams, { replace: true });
      
      const newMessages: ChatMessage[] = [];
      
      // Add upload info messages
      if (hasLayout || hasRoom || styleCount > 0) {
        const uploadParts: string[] = [];
        if (hasLayout) uploadParts.push('2D layout');
        if (hasRoom) uploadParts.push('room photo');
        if (styleCount > 0) uploadParts.push(`${styleCount} style reference${styleCount > 1 ? 's' : ''}`);
        
        const uploadMessage: ChatMessage = {
          id: `upload-${Date.now()}`,
          role: 'user',
          content: `Uploaded: ${uploadParts.join(', ')}`,
          metadata: { type: 'upload' },
          created_at: new Date().toISOString(),
        };
        newMessages.push(uploadMessage);
        
        // Save upload message
        supabase.from('chat_messages').insert({
          project_id: currentProjectId,
          user_id: user!.id,
          role: 'user',
          content: uploadMessage.content,
          metadata: { type: 'upload' },
        });
      }
      
      // Add prompt message if present
      if (promptFromUrl) {
        const decodedPrompt = decodeURIComponent(promptFromUrl);
        const promptMessage: ChatMessage = {
          id: `prompt-${Date.now()}`,
          role: 'user',
          content: decodedPrompt,
          metadata: { type: 'text' },
          created_at: new Date().toISOString(),
        };
        newMessages.push(promptMessage);
        
        // Save prompt message
        supabase.from('chat_messages').insert({
          project_id: currentProjectId,
          user_id: user!.id,
          role: 'user',
          content: decodedPrompt,
          metadata: { type: 'text' },
        });
      }
      
      if (newMessages.length > 0) {
        setMessages(prev => [...prev, ...newMessages]);
        
        // Trigger generation with prompt or generic message
        const generationPrompt = promptFromUrl 
          ? decodeURIComponent(promptFromUrl)
          : 'Generate a design based on the uploaded references';
        triggerGeneration(generationPrompt);
      }
    }
  };

  const loadLatestUpload = async () => {
    const { data, error } = await supabase
      .from('room_uploads')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setCurrentUpload({
        id: data.id,
        file_url: data.file_url,
        upload_type: data.upload_type,
        analysis_status: data.analysis_status,
        analysis_result: data.analysis_result as Record<string, unknown> | null,
      });
    }
  };

  const loadLatestRender = async () => {
    const { data, error } = await supabase
      .from('renders')
      .select('id, render_url')
      .eq('project_id', currentProjectId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data?.render_url) {
      setCurrentRenderUrl(data.render_url);
      setCurrentRenderId(data.id);
    }
  };

  // Fetch all project reference images (layout, room photo, style refs, products)
  const fetchProjectReferences = async (projectId: string): Promise<ProjectReferences> => {
    // Get layout and room photos from room_uploads
    const { data: uploads } = await supabase
      .from('room_uploads')
      .select('file_url, upload_type')
      .eq('project_id', projectId);
    
    // Get style references from style_uploads
    const { data: styleRefs } = await supabase
      .from('style_uploads')
      .select('file_url')
      .eq('project_id', projectId);
    
    // Get product items
    const { data: products } = await supabase
      .from('product_items')
      .select('name, image_url')
      .eq('project_id', projectId);
    
    return {
      layoutUrl: uploads?.find(u => u.upload_type === 'layout')?.file_url || null,
      roomPhotoUrl: uploads?.find(u => u.upload_type === 'room_photo')?.file_url || null,
      styleRefUrls: styleRefs?.map(s => s.file_url) || [],
      productItems: (products || [])
        .filter(p => p.image_url)
        .map(p => ({ name: p.name, imageUrl: p.image_url! })),
    };
  };

  const handleNewProject = () => {
    // Navigate to Landing page to start fresh project creation flow
    navigate('/');
  };

  const handleProjectSelect = (projectId: string) => {
    // Show loading indicator
    setIsProjectSwitching(true);
    
    // Reset all state immediately before switching
    setMessages([]);
    setCurrentRenderUrl(null);
    setCurrentRenderId(null);
    setCurrentUpload(null);
    setStagedItems([]);
    setLayoutImageUrl(null);
    setRoomPhotoUrl(null);
    setStyleRefUrls([]);
    setAllRenderUrls([]);
    setAllRenders([]);
    setProjectName('Untitled Project');
    setIsStagingMode(false);
    setShowPositioner(false);
    setIsSelectiveEditing(false);
    setCurrentRoomId(null); // Reset room when switching projects
    hasTriggeredGeneration.current = false;
    
    // Update URL with new project ID
    setSearchParams({ project: projectId }, { replace: true });
    
    // Set new project ID (triggers data reload via useEffect)
    setCurrentProjectId(projectId);
  };

  const handleRoomSelect = (roomId: string) => {
    // For now, just track the room - future: filter data by room
    setCurrentRoomId(roomId);
  };

  const addMessage = useCallback(async (role: 'user' | 'assistant', content: string, metadata?: ChatMessage['metadata']) => {
    if (!currentProjectId || !user) return null;

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        project_id: currentProjectId,
        user_id: user.id,
        role,
        content,
        metadata: metadata || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save message:', error);
      return null;
    }

    const newMessage: ChatMessage = {
      id: data.id,
      role: data.role as 'user' | 'assistant',
      content: data.content,
      metadata: data.metadata as ChatMessage['metadata'],
      created_at: data.created_at,
    };

    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, [currentProjectId, user]);

  const handleUpload = async (file: File) => {
    if (!user || !currentProjectId) return;

    setIsUploading(true);

    try {
      const fileName = `${user.id}/${currentProjectId}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('room-uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('room-uploads')
        .getPublicUrl(fileName);

      // Create room upload record
      const { data: uploadRecord, error: recordError } = await supabase
        .from('room_uploads')
        .insert({
          project_id: currentProjectId,
          user_id: user.id,
          file_name: file.name,
          file_url: publicUrl,
          analysis_status: 'pending',
        })
        .select()
        .single();

      if (recordError) throw recordError;

      setCurrentUpload({
        id: uploadRecord.id,
        file_url: publicUrl,
        upload_type: 'room_photo',
        analysis_status: 'pending',
        analysis_result: null,
      });

      // Add user message with image
      await addMessage('user', `Uploaded room image: ${file.name}`, {
        type: 'upload',
        imageUrl: publicUrl,
        status: 'pending',
      });

      toast({ title: 'Upload complete', description: 'Analyzing room...' });

      // Trigger room analysis
      analyzeRoom(uploadRecord.id, publicUrl);

    } catch (error) {
      console.error('Upload failed:', error);
      toast({ variant: 'destructive', title: 'Upload failed', description: 'Could not upload image.' });
    } finally {
      setIsUploading(false);
    }
  };

  const analyzeRoom = async (uploadId: string, imageUrl: string) => {
    setIsProcessing(true);

    try {
      // Update status to analyzing
      await supabase
        .from('room_uploads')
        .update({ analysis_status: 'analyzing' })
        .eq('id', uploadId);

      setCurrentUpload((prev) => prev ? { ...prev, analysis_status: 'analyzing' } : null);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const { analysis } = await response.json();

      // Update upload record
      await supabase
        .from('room_uploads')
        .update({
          analysis_status: 'completed',
          analysis_result: analysis,
        })
        .eq('id', uploadId);

      setCurrentUpload((prev) => prev ? {
        ...prev,
        analysis_status: 'completed',
        analysis_result: analysis,
      } : null);

      // Add assistant message with analysis
      const analysisText = `
Room Analysis Complete:
• Type: ${analysis.roomType}
• Style: ${analysis.currentStyle}
• Dimensions: ${analysis.dimensions}
• Lighting: ${analysis.lighting}

Key Elements: ${analysis.keyElements?.join(', ') || 'N/A'}

Suggestions:
${analysis.suggestedImprovements?.map((s: string) => `• ${s}`).join('\n') || 'N/A'}

Ready to generate a render! Describe your vision.`;

      await addMessage('assistant', analysisText.trim(), { type: 'text', status: 'ready' });

    } catch (error) {
      console.error('Analysis failed:', error);
      
      await supabase
        .from('room_uploads')
        .update({ analysis_status: 'failed' })
        .eq('id', uploadId);

      setCurrentUpload((prev) => prev ? { ...prev, analysis_status: 'failed' } : null);

      await addMessage('assistant', 'Sorry, I could not analyze the room image. Please try uploading again.', {
        type: 'text',
        status: 'failed',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Edit existing render - works with or without staged furniture
  const editRender = useCallback(async (content: string, furnitureItems: CatalogFurnitureItem[]) => {
    if (!user || !currentProjectId || !currentRenderUrl) return;

    setIsGenerating(true);

    try {
      // Fetch project references for layout and style consistency
      const references = await fetchProjectReferences(currentProjectId);

      // NEW: Analyze layout for 111% accuracy mode if layout exists
      let layoutAnalysis = null;
      if (references.layoutUrl) {
        try {
          await addMessage('assistant', 'Analyzing layout for precise positioning...', { type: 'text', status: 'pending' });
          
          const analysisResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-layout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ layoutImageUrl: references.layoutUrl }),
          });
          
          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            layoutAnalysis = analysisData.analysis;
            console.log('Layout analysis complete for edit:', layoutAnalysis?.roomShape, layoutAnalysis?.dimensions);
          } else {
            console.warn('Layout analysis failed for edit, proceeding without:', await analysisResponse.text());
          }
        } catch (analysisError) {
          console.warn('Layout analysis error for edit, proceeding without:', analysisError);
        }
      }

      // Create render record with parent reference
      const { data: renderRecord, error: renderError } = await supabase
        .from('renders')
        .insert({
          project_id: currentProjectId,
          user_id: user.id,
          prompt: content,
          room_upload_id: currentUpload?.id || null,
          parent_render_id: currentRenderId,
          status: 'generating',
        })
        .select()
        .single();

      if (renderError) throw renderError;

      // Different message depending on whether we have furniture items
      const hasFurniture = furnitureItems.length > 0;
      const furnitureNames = furnitureItems.map(i => i.name).join(', ');
      
      await addMessage('assistant', 
        layoutAnalysis
          ? `Layout analyzed: ${layoutAnalysis.roomShape} room. Editing with 111% accuracy...`
          : (hasFurniture 
            ? `Editing render: replacing furniture with ${furnitureNames}...`
            : `Editing render: "${content}"...`), 
        { type: 'text', status: 'pending' }
      );

      // Detect aspect ratio to preserve from source image
      const sourceAspectRatio = await getImageAspectRatio(currentRenderUrl);
      console.log('Preserving aspect ratio:', sourceAspectRatio);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/edit-render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          currentRenderUrl,
          userPrompt: content,
          // Only pass furniture items if we have them
          furnitureItems: hasFurniture ? furnitureItems.map(item => ({
            name: item.name,
            category: item.category,
            description: item.description,
            imageUrl: item.imageUrl,
          })) : [],
          // Pass layout and style references for consistency
          layoutImageUrl: references.layoutUrl,
          styleRefUrls: references.styleRefUrls,
          // NEW: Signal text-only edit mode when no furniture
          textOnlyEdit: !hasFurniture,
          // NEW: Pass layout analysis for 111% accuracy mode
          layoutAnalysis,
          // NEW: Preserve source image aspect ratio
          preserveAspectRatio: sourceAspectRatio,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Edit failed');
      }

      const { imageUrl } = await response.json();

      // Update render record
      await supabase
        .from('renders')
        .update({ render_url: imageUrl, status: 'completed' })
        .eq('id', renderRecord.id);

      setCurrentRenderUrl(imageUrl);
      setCurrentRenderId(renderRecord.id);

      await addMessage('assistant', 
        hasFurniture 
          ? 'Render updated with your furniture! The staged items have been placed in the room.'
          : 'Render updated with your changes!', 
        {
          type: 'render',
          imageUrl,
          status: 'ready',
        }
      );

      toast({ title: 'Render updated', description: hasFurniture ? 'Furniture replaced successfully.' : 'Changes applied.' });

    } catch (error) {
      console.error('Render edit failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      await addMessage('assistant', `Sorry, editing failed: ${message}`, { type: 'text', status: 'failed' });
      toast({ variant: 'destructive', title: 'Edit failed', description: message });
    } finally {
      setIsGenerating(false);
    }
  }, [user, currentProjectId, currentRenderUrl, currentRenderId, currentUpload, addMessage, toast]);

  // Generate new render (no existing render)
  const triggerGeneration = useCallback(async (content: string, furnitureItems: CatalogFurnitureItem[] = []) => {
    if (!user || !currentProjectId) return;

    setIsGenerating(true);

    try {
      // Fetch all project reference images
      const references = await fetchProjectReferences(currentProjectId);
      
      // Combine staged furniture with project products
      const allProducts = [
        ...furnitureItems.map(item => ({
          name: item.name,
          category: item.category,
          description: item.description,
          imageUrl: item.imageUrl,
        })),
        ...references.productItems.map(p => ({
          name: p.name,
          category: 'Product',
          description: `User-uploaded product: ${p.name}`,
          imageUrl: p.imageUrl,
        })),
      ];
      
      console.log('Generation references:', {
        hasLayout: !!references.layoutUrl,
        hasRoomPhoto: !!references.roomPhotoUrl,
        styleCount: references.styleRefUrls.length,
        productCount: allProducts.length,
      });

      // NEW: Analyze layout for 111% accuracy mode if layout exists
      let layoutAnalysis = null;
      if (references.layoutUrl) {
        try {
          await addMessage('assistant', 'Analyzing layout for precise positioning...', { type: 'text', status: 'pending' });
          
          const analysisResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-layout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ layoutImageUrl: references.layoutUrl }),
          });
          
          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            layoutAnalysis = analysisData.analysis;
            console.log('Layout analysis complete:', layoutAnalysis?.roomShape, layoutAnalysis?.dimensions);
          } else {
            console.warn('Layout analysis failed, proceeding without:', await analysisResponse.text());
          }
        } catch (analysisError) {
          console.warn('Layout analysis error, proceeding without:', analysisError);
        }
      }

      // Build enhanced prompt with furniture context
      let enhancedPrompt = content;
      if (allProducts.length > 0) {
        const furnitureContext = allProducts.map(item => 
          `- ${item.name} (${item.category}): ${item.description}`
        ).join('\n');
        enhancedPrompt = `${content}\n\n[Include these specific products/furniture in the design:\n${furnitureContext}]`;
      }

      // Create render record
      const { data: renderRecord, error: renderError } = await supabase
        .from('renders')
        .insert({
          project_id: currentProjectId,
          user_id: user.id,
          prompt: enhancedPrompt,
          room_upload_id: currentUpload?.id || null,
          status: 'generating',
        })
        .select()
        .single();

      if (renderError) throw renderError;

      const refInfo = [
        references.layoutUrl ? 'layout' : null,
        layoutAnalysis ? '111% accuracy' : null,
        references.roomPhotoUrl ? 'room photo' : null,
        references.styleRefUrls.length > 0 ? `${references.styleRefUrls.length} style ref${references.styleRefUrls.length > 1 ? 's' : ''}` : null,
        allProducts.length > 0 ? `${allProducts.length} product${allProducts.length > 1 ? 's' : ''}` : null,
      ].filter(Boolean).join(', ');

      await addMessage('assistant', layoutAnalysis 
        ? `Layout analyzed: ${layoutAnalysis.roomShape} room (${layoutAnalysis.dimensions?.width}×${layoutAnalysis.dimensions?.depth}ft). Generating precise render...`
        : (allProducts.length > 0 
          ? `Generating your render with ${allProducts.length} product${allProducts.length > 1 ? 's' : ''}${refInfo ? ` using ${refInfo}` : ''}...`
          : `Generating your render${refInfo ? ` using ${refInfo}` : ''}...`), 
        { type: 'text', status: 'pending' }
      );

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          // Pass all reference images
          layoutImageUrl: references.layoutUrl,
          roomPhotoUrl: references.roomPhotoUrl,
          styleRefUrls: references.styleRefUrls,
          furnitureItems: allProducts,
          // NEW: Pass layout analysis for 111% accuracy mode
          layoutAnalysis,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Generation failed');
      }

      const { imageUrl } = await response.json();

      // Update render record
      await supabase
        .from('renders')
        .update({ render_url: imageUrl, status: 'completed' })
        .eq('id', renderRecord.id);

      setCurrentRenderUrl(imageUrl);
      setCurrentRenderId(renderRecord.id);

      await addMessage('assistant', 'Your render is ready! You can download it using the controls above.', {
        type: 'render',
        imageUrl,
        status: 'ready',
      });

      toast({ title: 'Render complete', description: 'Your design is ready to view.' });

    } catch (error) {
      console.error('Render generation failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      await addMessage('assistant', `Sorry, generation failed: ${message}`, { type: 'text', status: 'failed' });
      toast({ variant: 'destructive', title: 'Generation failed', description: message });
    } finally {
      setIsGenerating(false);
    }
  }, [user, currentProjectId, currentUpload, addMessage, toast]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!user || !currentProjectId) return;

    // KEY FIX: If a render already exists, ALWAYS use edit mode (not regenerate)
    // - First message (no render): Generate new render
    // - Subsequent messages (render exists): Edit existing render
    const shouldEdit = currentRenderUrl !== null;

    // Build message content with staged items info
    const messageContent = stagedItems.length > 0
      ? `${content}\n\n📦 Staged furniture: ${stagedItems.map(i => i.name).join(', ')}`
      : content;

    // Add user message
    await addMessage('user', messageContent, { 
      type: 'text',
      stagedFurniture: stagedItems.length > 0 ? stagedItems.map(i => ({ id: i.id, name: i.name })) : undefined,
    } as ChatMessage['metadata']);

    // Choose edit or generate based on whether a render exists
    if (shouldEdit) {
      // Edit existing render (with or without staged furniture)
      editRender(content, stagedItems);
    } else {
      // Generate first render
      triggerGeneration(content, stagedItems);
    }
    
    // Clear staged items from DB and state after sending
    if (stagedItems.length > 0) {
      await supabase
        .from('staged_furniture')
        .delete()
        .eq('project_id', currentProjectId);
    }
    setStagedItems([]);
  }, [user, currentProjectId, addMessage, triggerGeneration, editRender, stagedItems, currentRenderUrl]);

  // ========== AGENT B HANDLERS ==========
  
  // Start Agent B analysis flow
  const handleAgentBAnalysis = useCallback(async (userPrompt: string) => {
    if (!currentProjectId) return;

    setAgentBState('thinking');
    setAgentBProgress(0);
    setAgentBUserPrompt(userPrompt);

    // Animate progress
    const progressInterval = setInterval(() => {
      setAgentBProgress(prev => Math.min(prev + 5, 90));
    }, 200);

    try {
      // Fetch project references
      const references = await fetchProjectReferences(currentProjectId);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-b-analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          userPrompt,
          layoutUrl: references.layoutUrl,
          roomPhotoUrl: references.roomPhotoUrl,
          styleRefUrls: references.styleRefUrls,
          stagedProducts: stagedItems.map(item => ({
            name: item.name,
            category: item.category,
            imageUrl: item.imageUrl,
          })),
          // Pass memory context
          userPreferences: memoryEnabled ? userPreferences : undefined,
          memoryEnabled,
        }),
      });

      clearInterval(progressInterval);
      setAgentBProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Agent B analysis failed');
      }

      const data = await response.json();

      setAgentBUnderstanding(data.understanding);
      setAgentBQuestions(data.questions || []);
      setAgentBAnswers([]);
      setCurrentQuestionIndex(0);
      
      // Pre-fill answers from preselected options if memory returned them
      if (data.questions) {
        const prefilledAnswers: AgentBAnswer[] = [];
        for (const q of data.questions) {
          if (q.preselected && q.preselected.length > 0) {
            prefilledAnswers.push({
              questionId: q.id,
              selectedOptions: q.preselected,
            });
          }
        }
        if (prefilledAnswers.length > 0) {
          setAgentBAnswers(prefilledAnswers);
        }
      }
      
      // Transition to brief view
      setTimeout(() => {
        setAgentBState('brief');
      }, 500);

    } catch (error) {
      console.error('Agent B analysis failed:', error);
      clearInterval(progressInterval);
      setAgentBState('idle');
      toast({
        variant: 'destructive',
        title: 'Agent B Error',
        description: error instanceof Error ? error.message : 'Analysis failed',
      });
    }
  }, [currentProjectId, stagedItems, toast, memoryEnabled, userPreferences]);

  // Handle Agent B brief confirmation
  const handleAgentBConfirmBrief = useCallback(() => {
    if (agentBQuestions.length > 0) {
      setAgentBState('questions');
    } else {
      setAgentBState('confirmation');
    }
  }, [agentBQuestions.length]);

  // Handle Agent B brief correction (go back to chat)
  const handleAgentBCorrectBrief = useCallback(() => {
    setAgentBState('idle');
  }, []);

  // Handle Agent B question answer
  const handleAgentBAnswer = useCallback((answer: AgentBAnswer) => {
    setAgentBAnswers(prev => {
      const existing = prev.findIndex(a => a.questionId === answer.questionId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = answer;
        return updated;
      }
      return [...prev, answer];
    });
  }, []);

  // Navigate to next question
  const handleAgentBNextQuestion = useCallback(() => {
    if (currentQuestionIndex < agentBQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, agentBQuestions.length]);

  // Navigate to previous question
  const handleAgentBPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  // Skip current question
  const handleAgentBSkipQuestion = useCallback(() => {
    if (currentQuestionIndex < agentBQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setAgentBState('confirmation');
    }
  }, [currentQuestionIndex, agentBQuestions.length]);

  // Complete questions phase
  const handleAgentBCompleteQuestions = useCallback(() => {
    setAgentBState('confirmation');
  }, []);

  // Go back to edit brief
  const handleAgentBEditBrief = useCallback(() => {
    setAgentBState('brief');
  }, []);

  // Go back to edit questions
  const handleAgentBEditQuestions = useCallback(() => {
    setAgentBState('questions');
    setCurrentQuestionIndex(0);
  }, []);

  // Final generation with Agent B context
  const handleAgentBGenerate = useCallback(async () => {
    if (!user || !currentProjectId || !agentBUnderstanding) return;

    // Learn from Agent B session before generating
    await learnFromAgentBAnswers();

    setAgentBState('generating');

    // Build enhanced prompt from Agent B context
    let enhancedPrompt = agentBUserPrompt || 'Design my space';
    
    // Add understanding context
    enhancedPrompt += `\n\n[Room: ${agentBUnderstanding.roomType}, Style: ${agentBUnderstanding.detectedStyle}]`;
    
    // Add answers context
    if (agentBAnswers.length > 0) {
      const answersText = agentBAnswers.map(a => {
        const question = agentBQuestions.find(q => q.id === a.questionId);
        const answerText = a.customText || a.selectedOptions.join(', ');
        return question ? `${question.question}: ${answerText}` : answerText;
      }).join('; ');
      enhancedPrompt += `\n[Preferences: ${answersText}]`;
    }

    // Add staged products
    if (agentBUnderstanding.stagedProducts.length > 0) {
      enhancedPrompt += `\n[Featured products: ${agentBUnderstanding.stagedProducts.join(', ')}]`;
    }

    // Add user message
    await addMessage('user', `🧠 Agent B: ${agentBUserPrompt}\n\n📋 ${agentBUnderstanding.roomType} • ${agentBUnderstanding.detectedStyle}`, {
      type: 'text',
      stagedFurniture: stagedItems.length > 0 ? stagedItems.map(i => ({ id: i.id, name: i.name })) : undefined,
    } as ChatMessage['metadata']);

    // Reset Agent B state
    setAgentBState('idle');
    setAgentBUnderstanding(null);
    setAgentBQuestions([]);
    setAgentBAnswers([]);
    setCurrentQuestionIndex(0);
    setAgentBUserPrompt('');

    // Check if we should edit or generate
    const shouldEdit = currentRenderUrl !== null;

    if (shouldEdit) {
      editRender(enhancedPrompt, stagedItems);
    } else {
      triggerGeneration(enhancedPrompt, stagedItems);
    }

    // Clear staged items
    if (stagedItems.length > 0) {
      await supabase
        .from('staged_furniture')
        .delete()
        .eq('project_id', currentProjectId);
    }
    setStagedItems([]);
  }, [user, currentProjectId, agentBUnderstanding, agentBUserPrompt, agentBAnswers, agentBQuestions, stagedItems, currentRenderUrl, addMessage, editRender, triggerGeneration, learnFromAgentBAnswers]);

  // Modified handleSendMessage to support Agent B
  const handleSendMessageWithAgentB = useCallback(async (content: string) => {
    if (!user || !currentProjectId) return;

    // If Agent B is enabled and user wants a new render (not editing), start Agent B flow
    if (agentBEnabled && wantsNewRender) {
      handleAgentBAnalysis(content);
      return;
    }

    // Otherwise, use normal flow (edit mode or Agent B disabled)
    const shouldEdit = currentRenderUrl !== null;

    const messageContent = stagedItems.length > 0
      ? `${content}\n\n📦 Staged furniture: ${stagedItems.map(i => i.name).join(', ')}`
      : content;

    await addMessage('user', messageContent, { 
      type: 'text',
      stagedFurniture: stagedItems.length > 0 ? stagedItems.map(i => ({ id: i.id, name: i.name })) : undefined,
    } as ChatMessage['metadata']);

    if (shouldEdit) {
      editRender(content, stagedItems);
    } else {
      triggerGeneration(content, stagedItems);
    }

    if (stagedItems.length > 0) {
      await supabase
        .from('staged_furniture')
        .delete()
        .eq('project_id', currentProjectId);
    }
    setStagedItems([]);
  }, [user, currentProjectId, agentBEnabled, wantsNewRender, currentRenderUrl, stagedItems, addMessage, editRender, triggerGeneration, handleAgentBAnalysis]);
  
  // Toggle between new render mode and edit mode
  const handleToggleNewRenderMode = useCallback((wantsNew: boolean) => {
    setWantsNewRender(wantsNew);
    // Reset Agent B state when switching modes
    if (wantsNew) {
      setAgentBState('idle');
    }
  }, []);

  const handleCatalogItemSelect = useCallback(async (item: CatalogFurnitureItem) => {
    if (!user || !currentProjectId) return;

    const exists = stagedItems.find(i => i.id === item.id);
    
    if (exists) {
      // Remove from DB
      await supabase
        .from('staged_furniture')
        .delete()
        .eq('project_id', currentProjectId)
        .eq('catalog_item_id', item.id);
      
      setStagedItems(prev => prev.filter(i => i.id !== item.id));
      toast({ 
        title: 'Item removed', 
        description: `${item.name} unstaged` 
      });
    } else {
      // Add to DB
      await supabase
        .from('staged_furniture')
        .insert({
          project_id: currentProjectId,
          user_id: user.id,
          catalog_item_id: item.id,
          item_name: item.name,
          item_category: item.category,
          item_description: item.description,
          item_image_url: item.imageUrl,
          item_price: item.price,
        });
      
      setStagedItems(prev => [...prev, item]);
      
      // Show toast with action buttons
      toast({
        title: `${item.name} staged`,
        description: 'Ready to place in your design',
        action: (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setShowPositioner(true)}
              disabled={!currentRenderUrl && !roomPhotoUrl}
            >
              <Move className="h-3 w-3 mr-1" />
              Position
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setShowCatalogModal(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add More
            </Button>
          </div>
        ),
      });
    }
  }, [user, currentProjectId, stagedItems, currentRenderUrl, roomPhotoUrl, toast]);

  const handleClearStagedItems = useCallback(async () => {
    if (!currentProjectId) return;
    
    await supabase
      .from('staged_furniture')
      .delete()
      .eq('project_id', currentProjectId);
    
    setStagedItems([]);
  }, [currentProjectId]);

  const loadStagedFurniture = async () => {
    if (!currentProjectId) return;

    const { data, error } = await supabase
      .from('staged_furniture')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load staged furniture:', error);
      return;
    }

    const items: CatalogFurnitureItem[] = (data || []).map(row => ({
      id: row.catalog_item_id,
      name: row.item_name,
      category: row.item_category,
      description: row.item_description || '',
      imageUrl: row.item_image_url || undefined,
      price: row.item_price || 0,
    }));

    setStagedItems(items);
  };

  // =========== SELECTION TOOL HANDLERS (Part 1 - no dependencies) ===========

  // Enter selection mode
  const handleEnterSelectionMode = useCallback(() => {
    // Disable other modes when entering selection
    setIsAIDetectionActive(false);
    setIsEraserMode(false);
    setShowAutoFurnish(false);
    setSelectionMode(true);
    setCurrentSelection(null);
  }, []);

  // Handle selection complete (user finished drawing rectangle)
  const handleSelectionComplete = useCallback((region: SelectionRegion | null) => {
    setCurrentSelection(region);
  }, []);

  // Handle cancel selection
  const handleSelectiveEditCancel = useCallback(() => {
    setCurrentSelection(null);
    setSelectionMode(false);
  }, []);

  // Keyboard shortcut for escaping selection mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectionMode) {
        handleSelectiveEditCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectionMode, handleSelectiveEditCancel]);

  // =========== ENHANCED TOOLS HANDLERS ===========

  // Toggle multi-select mode for batch operations
  const handleToggleMultiSelect = useCallback(() => {
    setIsMultiSelectMode(prev => !prev);
    if (!isMultiSelectMode) {
      setSelectedDetections([]);
    }
  }, [isMultiSelectMode]);

  // Handle detection item selection
  const handleDetectionSelect = useCallback((itemId: string) => {
    setSelectedDetections(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  // Handle detection item action (replace, similar, remove, lock)
  const handleDetectionAction = useCallback(async (
    item: DetectedItem,
    action: 'replace' | 'similar' | 'custom' | 'remove' | 'lock'
  ) => {
    if (action === 'lock') {
      // Toggle locked state
      setLockedDetections(prev => {
        const next = new Set(prev);
        if (next.has(item.id)) {
          next.delete(item.id);
          toast({ title: 'Unlocked', description: `${item.label} can now be modified` });
        } else {
          next.add(item.id);
          // Remove from replacements if locking
          setDetectionReplacements(prevReplacements => {
            const nextReplacements = new Map(prevReplacements);
            nextReplacements.delete(item.id);
            return nextReplacements;
          });
          toast({ title: 'Locked', description: `${item.label} will be kept as-is` });
        }
        return next;
      });
    } else if (action === 'replace') {
      setReplacingDetectionId(item.id);
      setReplacingDetectionLabel(item.label);
      setSimilarSearchData(null); // Clear any previous similarity data
      setShowCatalogModal(true);
    } else if (action === 'similar') {
      // AI-powered similarity search
      setReplacingDetectionId(item.id);
      setReplacingDetectionLabel(item.label);
      setIsFindingSimilar(true);
      
      try {
        const { data, error } = await supabase.functions.invoke('find-similar-furniture', {
          body: { 
            roomImageUrl: currentRenderUrl || roomPhotoUrl,
            itemLabel: item.label,
            boundingBox: item.box_2d
          },
        });

        if (error) throw error;

        if (data?.success) {
          setSimilarSearchData({
            searchTerms: data.searchTerms || [],
            category: data.category || '',
            itemLabel: item.label,
          });
          toast({ 
            title: 'Similar items found', 
            description: `Found ${data.searchTerms?.length || 0} matching keywords` 
          });
        }
        setShowCatalogModal(true);
      } catch (error) {
        console.error('Find similar error:', error);
        toast({ 
          variant: 'destructive', 
          title: 'Could not find similar items', 
          description: 'Showing full catalog instead' 
        });
        setSimilarSearchData(null);
        setShowCatalogModal(true);
      } finally {
        setIsFindingSimilar(false);
      }
    } else if (action === 'custom') {
      toast({ title: 'Create Custom', description: `Creating custom ${item.label}` });
      navigate('/custom-furniture');
    } else if (action === 'remove') {
      // Trigger erase action for the detected item
      await handleEraserAction(item);
    } else if (action === 'upload') {
      // Set up for upload replacement
      setReplacingDetectionId(item.id);
      setReplacingDetectionLabel(item.label);
      toast({ title: 'Upload Product', description: 'Upload a product image to replace this item' });
      // Open catalog modal in upload mode - user can use the upload tab
      setShowCatalogModal(true);
    }
  }, [toast, navigate]);

  // Handle replacement selection from catalog
  const handleReplacementSelect = useCallback((item: CatalogFurnitureItem) => {
    if (replacingDetectionId) {
      setDetectionReplacements(prev => {
        const next = new Map(prev);
        next.set(replacingDetectionId, item);
        return next;
      });
      // Remove from locked if selecting replacement
      setLockedDetections(prev => {
        const next = new Set(prev);
        next.delete(replacingDetectionId);
        return next;
      });
      toast({ 
        title: 'Replacement selected', 
        description: `${item.name} will replace ${replacingDetectionLabel}` 
      });
    }
    setShowCatalogModal(false);
    setReplacingDetectionId(null);
    setReplacingDetectionLabel('');
  }, [replacingDetectionId, replacingDetectionLabel, toast]);

  // Handle apply furnish - apply all replacements
  const handleApplyFurnish = useCallback(async () => {
    if (!currentRenderUrl || detectionReplacements.size === 0) {
      toast({ title: 'No changes to apply', description: 'Select replacements first' });
      return;
    }

    setIsGenerating(true);
    setIsAIDetectionActive(false);

    try {
      // Build prompt for all replacements
      const replacementDescriptions = Array.from(detectionReplacements.entries()).map(([_, replacement]) => {
        return replacement.name;
      });

      const prompt = `Replace the existing furniture with: ${replacementDescriptions.join(', ')}. Keep the room layout, lighting and style consistent.`;

      // Use the edit-render flow with staged items
      const response = await supabase.functions.invoke('edit-render', {
        body: {
          originalUrl: currentRenderUrl,
          prompt,
          stagedItems: Array.from(detectionReplacements.values()).map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            imageUrl: item.imageUrl,
          })),
        },
      });

      if (response.error) throw response.error;

      if (response.data?.editedUrl) {
        setCurrentRenderUrl(response.data.editedUrl);
        setAllRenderUrls(prev => [...prev, response.data.editedUrl]);
        toast({ 
          title: 'Furnish applied!', 
          description: `Applied ${detectionReplacements.size} replacement${detectionReplacements.size > 1 ? 's' : ''}` 
        });
      }
      
      // Clear state
      setDetectionReplacements(new Map());
      setLockedDetections(new Set());
      setSelectedDetections([]);
    } catch (error) {
      console.error('Furnish failed:', error);
      toast({ variant: 'destructive', title: 'Failed to apply changes' });
    } finally {
      setIsGenerating(false);
    }
  }, [currentRenderUrl, detectionReplacements, toast]);

  // Clear all detection selections
  const handleClearDetectionState = useCallback(() => {
    setDetectionReplacements(new Map());
    setLockedDetections(new Set());
    setSelectedDetections([]);
    toast({ title: 'Cleared', description: 'All selections cleared' });
  }, [toast]);

  // Handle batch generation for multiple selected items
  const handleBatchGenerate = useCallback(async (items: DetectedItem[]) => {
    setShowCatalogModal(true);
    toast({ title: `${items.length} items selected`, description: 'Choose replacements from catalog' });
  }, [toast]);

  // Handle eraser action - remove element from render
  const handleEraserAction = useCallback(async (item?: DetectedItem) => {
    if (!currentRenderUrl) return;

    // If erasing a detected item, create a selection region from its bounding box
    if (item?.box_2d) {
      const [ymin, xmin, ymax, xmax] = item.box_2d;
      const region: SelectionRegion = {
        x: xmin / 10,
        y: ymin / 10,
        width: (xmax - xmin) / 10,
        height: (ymax - ymin) / 10,
      };

      // Call selective edit with erase prompt
      await handleSelectiveEdit(
        region,
        `Remove the ${item.label} and fill with appropriate background that matches the room`,
        undefined,
        undefined
      );
    }

    setIsEraserMode(false);
    setIsAIDetectionActive(false);
  }, [currentRenderUrl]);

  // Handle auto-furnish apply - receive actual catalog items from panel
  const handleAutoFurnishApply = useCallback(async (selectedItems: CatalogFurnitureItem[]) => {
    if (!currentRenderUrl || selectedItems.length === 0) return;

    setShowAutoFurnish(false);
    setIsGenerating(true);

    try {
      // Build prompt with actual catalog item names
      const furnitureNames = selectedItems.map(item => item.name).join(', ');
      const prompt = `Add the following furniture in appropriate positions: ${furnitureNames}. Integrate seamlessly with the room's existing style and elements.`;

      // Call edit-render with actual catalog item images
      const response = await supabase.functions.invoke('edit-render', {
        body: {
          originalUrl: currentRenderUrl,
          prompt,
          stagedItems: selectedItems.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            imageUrl: item.imageUrl,
          })),
        },
      });

      if (response.error) throw response.error;

      if (response.data?.editedUrl) {
        setCurrentRenderUrl(response.data.editedUrl);
        setAllRenderUrls(prev => [...prev, response.data.editedUrl]);
        
        // Add selected items to staged items
        const newStagedItems = selectedItems.filter(item => !stagedItems.some(s => s.id === item.id));
        if (newStagedItems.length > 0) {
          setStagedItems(prev => [...prev, ...newStagedItems]);
        }
        
        toast({ 
          title: 'Auto-furnish applied', 
          description: `Added ${selectedItems.length} catalog items` 
        });
      }
    } catch (error) {
      console.error('Auto-furnish failed:', error);
      toast({ variant: 'destructive', title: 'Failed', description: 'Could not apply furniture suggestions' });
    } finally {
      setIsGenerating(false);
    }
  }, [currentRenderUrl, stagedItems, toast]);

  // Handle catalog item preview
  const handleCatalogItemPreview = useCallback((item: CatalogFurnitureItem) => {
    toast({ title: item.name, description: item.description || item.category });
  }, [toast]);

  // Determine if in edit mode - any render exists means we're in edit mode
  const isEditMode = currentRenderUrl !== null;

  // Handle composite mode with positioned furniture - MUST be before early returns
  const handleCompositeConfirm = useCallback(async (placements: FurniturePlacement[]) => {
    if (!user || !currentProjectId || !currentRenderUrl) return;

    setIsGenerating(true);
    setShowPositioner(false);

    try {
      const references = await fetchProjectReferences(currentProjectId);

      const { data: renderRecord, error: renderError } = await supabase
        .from('renders')
        .insert({
          project_id: currentProjectId,
          user_id: user.id,
          prompt: 'Composite furniture staging',
          room_upload_id: currentUpload?.id || null,
          parent_render_id: currentRenderId,
          status: 'generating',
          view_type: 'composite',
        })
        .select()
        .single();

      if (renderError) throw renderError;

      await addMessage('assistant', `Compositing ${placements.length} furniture items with precise positioning...`, 
        { type: 'text', status: 'pending' }
      );

      // Detect aspect ratio to preserve from source image
      const sourceAspectRatio = await getImageAspectRatio(currentRenderUrl);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/edit-render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          currentRenderUrl,
          compositeMode: true,
          furnitureItems: placements.map(p => ({
            name: p.item.name,
            category: p.item.category,
            description: p.item.description,
            imageUrl: p.item.imageUrl,
            position: p.position,
            scale: p.scale,
          })),
          layoutImageUrl: references.layoutUrl,
          styleRefUrls: references.styleRefUrls,
          preserveAspectRatio: sourceAspectRatio,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Composite failed');
      }

      const { imageUrl } = await response.json();

      await supabase
        .from('renders')
        .update({ render_url: imageUrl, status: 'completed' })
        .eq('id', renderRecord.id);

      // Refresh render history so the composite appears in the carousel
      await loadAllRenders();

      setCurrentRenderUrl(imageUrl);
      setCurrentRenderId(renderRecord.id);

      await addMessage('assistant', 'Furniture composited with pixel-perfect accuracy!', {
        type: 'render',
        imageUrl,
        status: 'ready',
      });

      // Clear staged items
      await supabase.from('staged_furniture').delete().eq('project_id', currentProjectId);
      setStagedItems([]);

      toast({ title: 'Composite complete', description: 'Furniture staged with precise positioning.' });
    } catch (error) {
      console.error('Composite failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      await addMessage('assistant', `Composite failed: ${message}`, { type: 'text', status: 'failed' });
      toast({ variant: 'destructive', title: 'Composite failed', description: message });
    } finally {
      setIsGenerating(false);
    }
  }, [user, currentProjectId, currentRenderUrl, currentRenderId, currentUpload, addMessage, toast]);

  // Handle selective area edit
  const handleSelectiveEdit = useCallback(async (region: SelectionRegion, prompt: string, catalogItem?: CatalogFurnitureItem, referenceImageUrl?: string) => {
    if (!user || !currentProjectId || !currentRenderUrl) return;

    setIsSelectiveEditing(true);

    try {
      const references = await fetchProjectReferences(currentProjectId);

      // Generate mask image from selection region
      const maskImageBase64 = await generateSelectionMask(region);
      console.log('Generated mask for region:', region);

      const promptText = catalogItem 
        ? `[Catalog item: ${catalogItem.name}] ${prompt}`
        : prompt;

      const { data: renderRecord, error: renderError } = await supabase
        .from('renders')
        .insert({
          project_id: currentProjectId,
          user_id: user.id,
          prompt: `[Selective edit at ${Math.round(region.x)}%,${Math.round(region.y)}%] ${promptText}`,
          room_upload_id: currentUpload?.id || null,
          parent_render_id: currentRenderId,
          status: 'generating',
          view_type: 'edit',
        })
        .select()
        .single();

      if (renderError) throw renderError;

      const messageText = catalogItem
        ? `[Selected area: ${Math.round(region.x)}%, ${Math.round(region.y)}% → ${Math.round(region.width)}% × ${Math.round(region.height)}%]\nReplacing with: ${catalogItem.name}\n${prompt}`
        : `[Selected area: ${Math.round(region.x)}%, ${Math.round(region.y)}% → ${Math.round(region.width)}% × ${Math.round(region.height)}%]\n${prompt}`;

      await addMessage('user', messageText, {
        type: 'text',
      });

      await addMessage('assistant', catalogItem 
        ? `Placing ${catalogItem.name} in the selected region...`
        : 'Applying selective edit to the selected region...', {
        type: 'text',
        status: 'pending',
      });

      // Detect aspect ratio to preserve from source image
      const sourceAspectRatio = await getImageAspectRatio(currentRenderUrl);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/edit-render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          currentRenderUrl,
          userPrompt: prompt,
          maskRegion: region,
          maskImageBase64, // NEW: Pass the generated mask image
          catalogItem: catalogItem ? {
            name: catalogItem.name,
            category: catalogItem.category,
            description: catalogItem.description,
            imageUrl: catalogItem.imageUrl,
          } : undefined,
          referenceImageUrl, // NEW: Pass reference image for upload mode
          layoutImageUrl: references.layoutUrl,
          styleRefUrls: references.styleRefUrls,
          preserveAspectRatio: sourceAspectRatio,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Selective edit failed');
      }

      const { imageUrl } = await response.json();

      await supabase
        .from('renders')
        .update({ render_url: imageUrl, status: 'completed' })
        .eq('id', renderRecord.id);

      setCurrentRenderUrl(imageUrl);
      setCurrentRenderId(renderRecord.id);

      await addMessage('assistant', catalogItem 
        ? `${catalogItem.name} placed successfully!`
        : 'Selective edit applied successfully!', {
        type: 'render',
        imageUrl,
        status: 'ready',
      });

      // Reload all renders to include the new one
      await loadAllRenders();

      toast({ title: 'Edit complete', description: catalogItem ? `${catalogItem.name} placed in selected area.` : 'Selected area has been updated.' });
    } catch (error) {
      console.error('Selective edit failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      await addMessage('assistant', `Selective edit failed: ${message}`, { type: 'text', status: 'failed' });
      toast({ variant: 'destructive', title: 'Edit failed', description: message });
    } finally {
      setIsSelectiveEditing(false);
    }
  }, [user, currentProjectId, currentRenderUrl, currentRenderId, currentUpload, addMessage, toast]);

  // Handle selective edit submit (user submitted prompt) - defined after handleSelectiveEdit
  const handleSelectiveEditSubmit = useCallback((
    prompt: string,
    catalogItem?: CatalogFurnitureItem,
    referenceImageUrl?: string
  ) => {
    if (currentSelection) {
      handleSelectiveEdit(currentSelection, prompt, catalogItem, referenceImageUrl);
      
      // Add catalog item to staged items if used and not already staged
      if (catalogItem && !stagedItems.find(i => i.id === catalogItem.id)) {
        handleCatalogItemSelect(catalogItem);
      }
      
      // Clear selection after submitting
      setCurrentSelection(null);
      setSelectionMode(false);
    }
  }, [currentSelection, handleSelectiveEdit, stagedItems, handleCatalogItemSelect]);

  // === MARKER STAGING HANDLERS ===
  
  // Add a new marker at position
  const handleMarkerAdd = useCallback((position: { x: number; y: number }) => {
    const newMarker: StagingMarker = {
      id: `marker-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      position,
      product: null,
      confirmed: false,
    };
    setStagingMarkers(prev => [...prev, newMarker]);
    // Auto-open catalog for product selection
    setActiveMarkerId(newMarker.id);
    setIsMarkerCatalogOpen(true);
  }, []);

  // Remove a marker
  const handleMarkerRemove = useCallback((markerId: string) => {
    setStagingMarkers(prev => prev.filter(m => m.id !== markerId));
    if (activeMarkerId === markerId) {
      setActiveMarkerId(null);
    }
  }, [activeMarkerId]);

  // Open catalog for marker product selection
  const handleMarkerProductSelectStart = useCallback((markerId: string) => {
    setActiveMarkerId(markerId);
    setIsMarkerCatalogOpen(true);
  }, []);

  // Assign product to marker (called from catalog modal)
  const handleMarkerProductAssign = useCallback((product: CatalogFurnitureItem) => {
    if (!activeMarkerId) return;
    
    setStagingMarkers(prev => prev.map(m => 
      m.id === activeMarkerId 
        ? { ...m, product, confirmed: true }
        : m
    ));
    setActiveMarkerId(null);
    setIsMarkerCatalogOpen(false);
  }, [activeMarkerId]);

  // Clear all markers
  const handleMarkerClearAll = useCallback(() => {
    setStagingMarkers([]);
    setActiveMarkerId(null);
  }, []);

  // Generate batch staging with all confirmed markers
  const handleMarkerBatchGenerate = useCallback(async () => {
    if (!user || !currentProjectId || !currentRenderUrl) {
      toast({ variant: 'destructive', title: 'Error', description: 'Missing required data for generation' });
      return;
    }

    const confirmedMarkers = stagingMarkers.filter(m => m.product !== null);
    if (confirmedMarkers.length === 0) {
      toast({ variant: 'destructive', title: 'No products', description: 'Add products to at least one marker' });
      return;
    }

    setIsGenerating(true);
    setShowMarkerStaging(false);

    try {
      // Create render record
      const { data: renderRecord, error: renderError } = await supabase
        .from('renders')
        .insert({
          project_id: currentProjectId,
          user_id: user.id,
          prompt: `Batch staging: ${confirmedMarkers.map(m => m.product?.name).join(', ')}`,
          status: 'pending',
          parent_render_id: currentRenderId,
        })
        .select()
        .single();

      if (renderError) throw renderError;

      await addMessage('user', `🎯 Placing ${confirmedMarkers.length} item${confirmedMarkers.length > 1 ? 's' : ''} via marker staging`, { type: 'text' });

      // Detect aspect ratio
      const sourceAspectRatio = await getImageAspectRatio(currentRenderUrl);

      // Build batch markers payload
      const batchMarkers = confirmedMarkers.map(m => ({
        position: m.position,
        product: {
          name: m.product!.name,
          category: m.product!.category,
          description: m.product!.description || '',
          imageUrl: m.product!.imageUrl || '',
        },
      }));

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/edit-render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          currentRenderUrl,
          batchMarkers,
          preserveAspectRatio: sourceAspectRatio,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Batch staging failed');
      }

      const { imageUrl } = await response.json();

      // Update render record
      await supabase
        .from('renders')
        .update({ render_url: imageUrl, status: 'completed' })
        .eq('id', renderRecord.id);

      setCurrentRenderUrl(imageUrl);
      setCurrentRenderId(renderRecord.id);

      // Add all products to staged items
      for (const marker of confirmedMarkers) {
        if (marker.product && !stagedItems.find(i => i.id === marker.product!.id)) {
          handleCatalogItemSelect(marker.product);
        }
      }

      await addMessage('assistant', `Successfully placed ${confirmedMarkers.length} item${confirmedMarkers.length > 1 ? 's' : ''}!`, {
        type: 'render',
        imageUrl,
        status: 'ready',
      });

      await loadAllRenders();

      // Clear markers
      setStagingMarkers([]);

      toast({ 
        title: 'Batch staging complete', 
        description: `${confirmedMarkers.length} products placed with Gemini 3 Pro` 
      });
    } catch (error) {
      console.error('Batch staging failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      await addMessage('assistant', `Batch staging failed: ${message}`, { type: 'text', status: 'failed' });
      toast({ variant: 'destructive', title: 'Staging failed', description: message });
    } finally {
      setIsGenerating(false);
    }
  }, [user, currentProjectId, currentRenderUrl, currentRenderId, stagingMarkers, stagedItems, handleCatalogItemSelect, addMessage, toast, loadAllRenders]);

  // Handle render selection from history carousel
  const handleRenderHistorySelect = useCallback((render: RenderHistoryItem) => {
    setCurrentRenderUrl(render.render_url);
    setCurrentRenderId(render.id);
    toast({ title: 'Render selected', description: 'Viewing selected render version.' });
  }, [toast]);

  // Handle render deletion from history carousel
  const handleDeleteRender = useCallback(async (renderId: string) => {
    try {
      // Remove from local state
      setAllRenders(prev => prev.filter(r => r.id !== renderId));
      
      // Delete from database
      await supabase.from('renders').delete().eq('id', renderId);
      
      toast({ title: 'Render deleted', description: 'Version removed from history.' });
    } catch (error) {
      console.error('Error deleting render:', error);
      toast({ variant: 'destructive', title: 'Delete failed', description: 'Could not delete render.' });
    }
  }, [toast]);

  // Handle undo - go back to parent render
  const handleUndo = useCallback(async () => {
    if (!currentRenderId || !allRenders.length) return;

    // Find current render in history
    const currentRender = allRenders.find(r => r.id === currentRenderId);
    if (!currentRender?.parent_render_id) {
      toast({ variant: 'destructive', title: 'Cannot undo', description: 'No previous version available.' });
      return;
    }

    // Find parent render
    const parentRender = allRenders.find(r => r.id === currentRender.parent_render_id);
    if (!parentRender) {
      toast({ variant: 'destructive', title: 'Cannot undo', description: 'Parent render not found.' });
      return;
    }

    setCurrentRenderUrl(parentRender.render_url);
    setCurrentRenderId(parentRender.id);
    toast({ title: 'Undo successful', description: 'Reverted to previous render version.' });
  }, [currentRenderId, allRenders, toast]);

  // Handle AI Director changes - applies global prompt to current render
  const handleAIDirectorChange = useCallback(async (prompt: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in' });
      return;
    }
    if (!currentProjectId) {
      toast({ variant: 'destructive', title: 'Error', description: 'No project selected' });
      return;
    }
    if (!currentRenderUrl) {
      toast({ variant: 'destructive', title: 'Render required', description: 'Generate a render first to use AI Director' });
      return;
    }

    setIsSelectiveEditing(true);
    
    try {
      // Create a new render record as a child of current
      const { data: renderRecord, error: renderError } = await supabase
        .from('renders')
        .insert({
          project_id: currentProjectId,
          user_id: user.id,
          prompt: `AI Director: ${prompt}`,
          status: 'pending',
          room_upload_id: currentUpload?.id || null,
          parent_render_id: currentRenderId,
        })
        .select()
        .single();

      if (renderError) throw renderError;

      await addMessage('user', `🎬 AI Director: ${prompt}`, { type: 'text' });

      // Detect aspect ratio to preserve from source image
      const sourceAspectRatio = await getImageAspectRatio(currentRenderUrl);

      // Call edit-render with the global prompt
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/edit-render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          currentRenderUrl: currentRenderUrl,
          userPrompt: prompt,
          preserveAspectRatio: sourceAspectRatio,
          // No region = global edit
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'AI Director edit failed');
      }

      const { imageUrl } = await response.json();

      await supabase
        .from('renders')
        .update({ render_url: imageUrl, status: 'completed' })
        .eq('id', renderRecord.id);

      setCurrentRenderUrl(imageUrl);
      setCurrentRenderId(renderRecord.id);

      await addMessage('assistant', 'AI Director changes applied successfully!', {
        type: 'render',
        imageUrl,
        status: 'ready',
      });

      await loadAllRenders();
      toast({ title: 'Changes applied', description: 'AI Director modifications complete.' });
    } catch (error) {
      console.error('AI Director failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      await addMessage('assistant', `AI Director failed: ${message}`, { type: 'text', status: 'failed' });
      toast({ variant: 'destructive', title: 'Failed', description: message });
    } finally {
      setIsSelectiveEditing(false);
    }
  }, [user, currentProjectId, currentRenderUrl, currentRenderId, currentUpload, addMessage, toast]);

  // Handle Multicam view generation (with optional zone focus)
  // IMPORTANT: Passes furniture items and style references for CONSISTENT rendering across views
  // SAVES to renders table so views appear in Render History carousel
  const handleMulticamGenerate = useCallback(async (view: CameraView, customPrompt?: string, zone?: ZoneRegion) => {
    if (!user || !currentProjectId || !currentRenderUrl) return;

    setIsMulticamGenerating(true);
    
    // View labels for display
    const viewLabels: Record<CameraView, string> = {
      perspective: '📷 Perspective View',
      front: '📷 Front View',
      side: '📷 Side View',
      top: "📷 Bird's Eye View",
      cinematic: '📷 Cinematic View',
      custom: '📷 Custom View',
    };
    
    // Camera-specific prompts with STRICT consistency requirements
    const viewPrompts: Record<CameraView, string> = {
      perspective: 'CRITICAL: Render this EXACT same room from a 3/4 perspective angle. MAINTAIN all furniture items EXACTLY as they appear - same colors, same positions, same products. Only change the camera angle to a 3/4 perspective view showing depth and dimension.',
      front: 'CRITICAL: Render this EXACT same room from a straight-on front view. MAINTAIN all furniture items EXACTLY as they appear - same colors, same positions, same products. Only change the camera angle to face the main focal wall directly.',
      side: 'CRITICAL: Render this EXACT same room from a side view. MAINTAIN all furniture items EXACTLY as they appear - same colors, same positions, same products. Only change the camera angle to show the profile of the space from the side.',
      top: "CRITICAL: Render this EXACT same room from a bird's eye top-down view. MAINTAIN all furniture items EXACTLY as they appear - same colors, same positions, same products. Only change the camera angle to an overhead view showing the floor plan layout.",
      cinematic: 'CRITICAL: Render this EXACT same room from a dramatic cinematic wide-angle view. Use a low camera angle with a wide field of view for a hero shot. MAINTAIN all furniture items EXACTLY as they appear - same colors, same positions, same products. Only change the camera angle for maximum visual impact.',
      custom: customPrompt || 'Render this room from a custom camera angle while MAINTAINING all furniture items EXACTLY as they appear.',
    };

    // Build zone-specific prompt if zone is provided
    let prompt = view === 'custom' && customPrompt ? customPrompt : viewPrompts[view];
    const zoneLabel = zone ? ' (zone focus)' : '';
    const displayPrompt = viewLabels[view] + zoneLabel;
    
    if (zone) {
      const zoneDesc = `Focus specifically on the region from ${zone.x_start.toFixed(0)}% to ${zone.x_end.toFixed(0)}% horizontally and ${zone.y_start.toFixed(0)}% to ${zone.y_end.toFixed(0)}% vertically. Crop or zoom the view to focus on this specific area of the room. `;
      prompt = zoneDesc + prompt;
    }

    // Add strict consistency requirements to the prompt
    const consistencyPrompt = `

ABSOLUTE REQUIREMENTS FOR CONSISTENCY:
1. ALL furniture items MUST appear EXACTLY as in the reference image
2. Product COLORS must be IDENTICAL - no color shifts, no "improvements"
3. Product POSITIONS must be the SAME relative to each other
4. Do NOT add new furniture or remove existing furniture
5. Do NOT change materials, textures, or finishes
6. The ONLY change allowed is the camera angle/viewpoint
7. This is the SAME room, SAME moment in time, just a different camera position

` + prompt;

    // Create a pending render record in the database BEFORE generating
    let pendingRenderId: string | null = null;
    
    try {
      // Determine view_type based on the camera view
      const viewTypeMap: Record<CameraView, string> = {
        perspective: 'view_perspective',
        front: 'view_front',
        side: 'view_side',
        top: 'view_top',
        cinematic: 'view_cinematic',
        custom: 'view_custom',
      };
      
      const { data: pendingRender, error: insertError } = await supabase
        .from('renders')
        .insert({
          user_id: user.id,
          project_id: currentProjectId,
          prompt: displayPrompt,
          status: 'pending',
          parent_render_id: currentRenderId || null,
          view_type: viewTypeMap[view] || 'view_custom',
        })
        .select('id')
        .single();
      
      if (insertError) {
        console.error('Failed to create pending render:', insertError);
      } else {
        pendingRenderId = pendingRender.id;
      }
    } catch (err) {
      console.error('Error creating pending render:', err);
    }

    try {
      await addMessage('user', `📷 Generating ${view} view${zoneLabel}...`, { type: 'text' });

      // Build furniture items with images for reference
      const furnitureForConsistency = stagedItems.map(item => ({
        name: item.name,
        category: item.category,
        description: item.description,
        imageUrl: item.imageUrl,
      }));

      // Detect aspect ratio to preserve from source image
      const sourceAspectRatio = await getImageAspectRatio(currentRenderUrl);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/edit-render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          currentRenderUrl: currentRenderUrl,
          userPrompt: consistencyPrompt,
          // Pass furniture items for visual reference and consistency
          furnitureItems: furnitureForConsistency.length > 0 ? furnitureForConsistency : undefined,
          // Pass style references for consistent aesthetic
          styleRefUrls: styleRefUrls.length > 0 ? styleRefUrls : undefined,
          // Pass zone as a crop/focus region if provided
          focusRegion: zone ? {
            x: zone.x_start,
            y: zone.y_start,
            width: zone.x_end - zone.x_start,
            height: zone.y_end - zone.y_start,
          } : undefined,
          // Indicate this is a multicam view for consistency handling
          viewType: view === 'top' ? 'bird-eye' : view === 'perspective' ? 'cinematic' : 'eye-level',
          preserveAspectRatio: sourceAspectRatio,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Multicam generation failed');
      }

      const { imageUrl } = await response.json();

      // Update the render record with the generated image URL
      if (pendingRenderId) {
        const { error: updateError } = await supabase
          .from('renders')
          .update({
            render_url: imageUrl,
            status: 'completed',
          })
          .eq('id', pendingRenderId);
        
        if (updateError) {
          console.error('Failed to update render record:', updateError);
        } else {
          // Refresh render history so the new view appears in the carousel
          await loadAllRenders();
        }
      }

      setMulticamViews(prev => ({ ...prev, [view]: imageUrl }));

      await addMessage('assistant', `${view.charAt(0).toUpperCase() + view.slice(1)} view${zoneLabel} generated!`, {
        type: 'render',
        imageUrl,
        status: 'ready',
      });

      toast({ title: 'View generated', description: `${view.charAt(0).toUpperCase() + view.slice(1)} view ready.` });
    } catch (error) {
      console.error('Multicam generation failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      // Clean up the pending render record on failure
      if (pendingRenderId) {
        await supabase
          .from('renders')
          .delete()
          .eq('id', pendingRenderId);
      }
      
      await addMessage('assistant', `Failed to generate ${view} view: ${message}`, { type: 'text', status: 'failed' });
      toast({ variant: 'destructive', title: 'Failed', description: message });
    } finally {
      setIsMulticamGenerating(false);
    }
  }, [user, currentProjectId, currentRenderUrl, currentRenderId, stagedItems, styleRefUrls, addMessage, toast, loadAllRenders]);

  // Handle setting a multicam view as main render
  const handleSetMulticamAsMain = useCallback((imageUrl: string) => {
    setCurrentRenderUrl(imageUrl);
  }, []);

  // =========== ZONE OPERATIONS ===========

  // Load zones for current project
  const loadZones = useCallback(async () => {
    if (!currentProjectId) return;

    const { data, error } = await supabase
      .from('staging_zones')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load zones:', error);
      return;
    }

    setZones(data?.map(z => ({
      id: z.id,
      name: z.name,
      polygon_points: (z.polygon_points as unknown as PolygonPoint[] | null) || [],
      x_start: Number(z.x_start),
      y_start: Number(z.y_start),
      x_end: Number(z.x_end),
      y_end: Number(z.y_end),
      camera_position: z.camera_position || undefined,
    })) || []);
  }, [currentProjectId]);

  // Load zones when project changes
  useEffect(() => {
    if (currentProjectId) {
      loadZones();
    }
  }, [currentProjectId, loadZones]);

  // Create a new zone (now with layout reference)
  const handleZoneCreate = useCallback(async (zone: Omit<Zone, 'id'>, layoutUrl?: string) => {
    if (!user || !currentProjectId) return;

    const { data, error } = await supabase
      .from('staging_zones')
      .insert([{
        project_id: currentProjectId,
        user_id: user.id,
        name: zone.name,
        polygon_points: JSON.parse(JSON.stringify(zone.polygon_points)),
        x_start: zone.x_start,
        y_start: zone.y_start,
        x_end: zone.x_end,
        y_end: zone.y_end,
        layout_reference_url: layoutUrl || layoutImageUrl || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Failed to create zone:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create zone' });
      return;
    }

    const newZone: Zone = {
      id: data.id,
      name: data.name,
      polygon_points: (data.polygon_points as unknown as PolygonPoint[] | null) || [],
      x_start: Number(data.x_start),
      y_start: Number(data.y_start),
      x_end: Number(data.x_end),
      y_end: Number(data.y_end),
    };

    setZones(prev => [...prev, newZone]);
    setSelectedZoneId(data.id);
    toast({ title: 'Zone created', description: `"${zone.name}" added` });
  }, [user, currentProjectId, layoutImageUrl, toast]);

  // Delete a zone
  const handleZoneDelete = useCallback(async (zoneId: string) => {
    const { error } = await supabase
      .from('staging_zones')
      .delete()
      .eq('id', zoneId);

    if (error) {
      console.error('Failed to delete zone:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete zone' });
      return;
    }

    setZones(prev => prev.filter(z => z.id !== zoneId));
    if (selectedZoneId === zoneId) {
      setSelectedZoneId(null);
    }
    toast({ title: 'Zone deleted' });
  }, [selectedZoneId, toast]);

  // Select a zone
  const handleZoneSelect = useCallback((zone: Zone | null) => {
    setSelectedZoneId(zone?.id || null);
  }, []);

  // Generate a focused render of a zone with specific view type
  const handleGenerateZoneView = useCallback(async (zone: Zone, viewType: ViewType = 'detail') => {
    if (!user || !currentProjectId || !layoutImageUrl) {
      toast({ variant: 'destructive', title: 'Error', description: 'Upload a layout first to create zone views' });
      return;
    }

    setIsMulticamGenerating(true);
    setGeneratingZoneName(zone.name);
    setGeneratingViewType(viewType);

    try {
      // Get view type label for display
      const viewLabel = viewTypeOptions.find(v => v.id === viewType)?.label || 'Detail';
      
      // Create render record FIRST to save to history
      const { data: renderRecord, error: renderError } = await supabase
        .from('renders')
        .insert({
          project_id: currentProjectId,
          user_id: user.id,
          prompt: `Zone: ${zone.name} - ${viewLabel} view`,
          status: 'generating',
          room_upload_id: currentUpload?.id || null,
          parent_render_id: currentRenderId,
        })
        .select()
        .single();

      if (renderError) throw renderError;

      // Crop the zone from the LAYOUT IMAGE (not the render) to provide visual reference
      await addMessage('user', `🎯 Cropping zone "${zone.name}" from layout for accurate rendering...`, { type: 'text' });
      
      let layoutZoneBase64: string | null = null;
      try {
        // Use polygon cropping if available, otherwise fall back to rectangle
        if (zone.polygon_points && zone.polygon_points.length >= 3 && layoutImageUrl) {
          layoutZoneBase64 = await cropPolygonFromRender(layoutImageUrl, zone.polygon_points);
          console.log('Zone cropped from layout (polygon) successfully');
        } else if (layoutImageUrl) {
          layoutZoneBase64 = await cropZoneFromRender(layoutImageUrl, {
            x: zone.x_start,
            y: zone.y_start,
            width: zone.x_end - zone.x_start,
            height: zone.y_end - zone.y_start,
          });
          console.log('Zone cropped from layout (rectangle) successfully');
        }
      } catch (cropError) {
        console.warn('Failed to crop zone from layout, proceeding without visual reference:', cropError);
      }

      const zonePrompt = `Generate a photorealistic 3D render of this specific area from the 2D floor plan. Zone: "${zone.name}". Interpret the 2D layout and create an immersive ${viewLabel.toLowerCase()} perspective view.`;

      await addMessage('user', `🎯 Generating ${viewLabel} view for zone: ${zone.name}...`, { type: 'text' });

      // Detect aspect ratio to preserve from source image (use render if exists, otherwise default)
      const sourceAspectRatio = currentRenderUrl ? await getImageAspectRatio(currentRenderUrl) : '16:9';

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/edit-render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          currentRenderUrl: currentRenderUrl || layoutImageUrl, // Use layout as base if no render
          layoutImageUrl: layoutImageUrl, // Full layout for context
          layoutZoneBase64: layoutZoneBase64, // Cropped layout section (the source of truth)
          userPrompt: zonePrompt,
          focusRegion: {
            x: zone.x_start,
            y: zone.y_start,
            width: zone.x_end - zone.x_start,
            height: zone.y_end - zone.y_start,
          },
          viewType: viewType,
          styleRefUrls: styleRefUrls,
          preserveAspectRatio: sourceAspectRatio,
          layoutBasedZone: true, // Flag to use layout-based generation
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Zone view generation failed');
      }

      const { imageUrl } = await response.json();

      // Update render record with the generated image
      await supabase
        .from('renders')
        .update({ render_url: imageUrl, status: 'completed' })
        .eq('id', renderRecord.id);

      // Update current render state
      setCurrentRenderUrl(imageUrl);
      setCurrentRenderId(renderRecord.id);

      await addMessage('assistant', `${viewLabel} view of "${zone.name}" generated!`, {
        type: 'render',
        imageUrl,
        status: 'ready',
      });

      // Reload all renders to include the new one in history
      await loadAllRenders();

      toast({ title: 'Zone view ready', description: `"${zone.name}" ${viewLabel} view generated` });
    } catch (error) {
      console.error('Zone view generation failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      await addMessage('assistant', `Failed to generate zone view: ${message}`, { type: 'text', status: 'failed' });
      toast({ variant: 'destructive', title: 'Failed', description: message });
    } finally {
      setIsMulticamGenerating(false);
      setGeneratingZoneName(null);
      setGeneratingViewType(null);
    }
  }, [user, currentProjectId, currentRenderUrl, currentRenderId, currentUpload, styleRefUrls, layoutImageUrl, addMessage, toast, loadAllRenders]);

  // =========== CAMERA CRUD OPERATIONS ===========

  // Load cameras for current room
  const loadCameras = useCallback(async () => {
    if (!currentProjectId) return;
    
    let query = supabase
      .from('cameras')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: true });
    
    // Use .is() for null, .eq() for non-null values (PostgreSQL requires IS NULL syntax)
    if (currentRoomId === null) {
      query = query.is('room_id', null);
    } else {
      query = query.eq('room_id', currentRoomId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Failed to load cameras:', error);
      return;
    }
    
    const cameraData: CameraData[] = (data || []).map(c => ({
      id: c.id,
      name: c.name,
      x: Number(c.x_position),
      y: Number(c.y_position),
      rotation: Number(c.rotation),
      fovAngle: Number(c.fov_angle),
      captureWidth: Number(c.capture_width),
      captureHeight: Number(c.capture_height),
    }));
    
    setCameras(cameraData);
  }, [currentProjectId, currentRoomId]);

  // Load cameras when project/room changes
  useEffect(() => {
    if (currentProjectId) {
      loadCameras();
    }
  }, [currentProjectId, currentRoomId, loadCameras]);

  // Add new camera
  const handleCameraAdd = useCallback(async () => {
    if (!user || !currentProjectId) return;
    
    const newCameraName = `Camera ${cameras.length + 1}`;
    
    const { data, error } = await supabase
      .from('cameras')
      .insert({
        project_id: currentProjectId,
        room_id: currentRoomId,
        user_id: user.id,
        name: newCameraName,
        x_position: 50,
        y_position: 50,
        rotation: 0,
        fov_angle: 60,
        capture_width: 100,
        capture_height: 75,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Failed to create camera:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create camera' });
      return;
    }
    
    const newCamera: CameraData = {
      id: data.id,
      name: data.name,
      x: Number(data.x_position),
      y: Number(data.y_position),
      rotation: Number(data.rotation),
      fovAngle: Number(data.fov_angle),
      captureWidth: Number(data.capture_width),
      captureHeight: Number(data.capture_height),
    };
    
    setCameras(prev => [...prev, newCamera]);
    setSelectedCameraId(data.id);
    toast({ title: 'Camera added', description: 'Drag to position, then generate a view' });
  }, [user, currentProjectId, currentRoomId, cameras.length, toast]);

  // Update camera
  const handleCameraUpdate = useCallback(async (camera: CameraData) => {
    // Update local state immediately for smooth UX
    setCameras(prev => prev.map(c => c.id === camera.id ? camera : c));
    
    // Debounced save to database
    const { error } = await supabase
      .from('cameras')
      .update({
        name: camera.name,
        x_position: camera.x,
        y_position: camera.y,
        rotation: camera.rotation,
        fov_angle: camera.fovAngle,
        capture_width: camera.captureWidth,
        capture_height: camera.captureHeight,
      })
      .eq('id', camera.id);
    
    if (error) {
      console.error('Failed to update camera:', error);
    }
  }, []);

  // Delete camera
  const handleCameraDelete = useCallback(async (cameraId: string) => {
    const { error } = await supabase
      .from('cameras')
      .delete()
      .eq('id', cameraId);
    
    if (error) {
      console.error('Failed to delete camera:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete camera' });
      return;
    }
    
    setCameras(prev => prev.filter(c => c.id !== cameraId));
    if (selectedCameraId === cameraId) {
      setSelectedCameraId(null);
    }
    toast({ title: 'Camera deleted' });
  }, [selectedCameraId, toast]);

  // Generate view from camera position
  const handleGenerateFromCamera = useCallback(async (cameraId: string, prompt: string) => {
    if (!user || !currentProjectId || !currentRenderUrl) return;
    
    const camera = cameras.find(c => c.id === cameraId);
    if (!camera) return;
    
    setIsGenerating(true);
    
    try {
      // Build camera-aware prompt
      const cameraPrompt = `Generate a perspective view from camera position at ${camera.x.toFixed(0)}%, ${camera.y.toFixed(0)}% of the room, looking at angle ${camera.rotation}° with ${camera.fovAngle}° field of view. ${prompt}`;
      
      const { data: renderRecord, error: renderError } = await supabase
        .from('renders')
        .insert({
          project_id: currentProjectId,
          user_id: user.id,
          prompt: `Camera ${camera.name}: ${prompt}`,
          status: 'generating',
          room_upload_id: currentUpload?.id || null,
          parent_render_id: currentRenderId,
        })
        .select()
        .single();
      
      if (renderError) throw renderError;
      
      await addMessage('user', `📷 ${camera.name}: ${prompt}`, { type: 'text' });
      await addMessage('assistant', `Generating view from ${camera.name}...`, { type: 'text', status: 'pending' });
      
      // Detect aspect ratio to preserve from source image
      const sourceAspectRatio = await getImageAspectRatio(currentRenderUrl);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/edit-render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          currentRenderUrl,
          userPrompt: cameraPrompt,
          cameraPosition: {
            x: camera.x,
            y: camera.y,
            rotation: camera.rotation,
            fov: camera.fovAngle,
          },
          preserveAspectRatio: sourceAspectRatio,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Camera render failed');
      }
      
      const { imageUrl } = await response.json();
      
      await supabase
        .from('renders')
        .update({ render_url: imageUrl, status: 'completed' })
        .eq('id', renderRecord.id);
      
      setCurrentRenderUrl(imageUrl);
      setCurrentRenderId(renderRecord.id);
      
      await addMessage('assistant', `View from ${camera.name} generated!`, {
        type: 'render',
        imageUrl,
        status: 'ready',
      });
      
      await loadAllRenders();
      toast({ title: 'Camera view generated', description: `${camera.name} perspective ready` });
    } catch (error) {
      console.error('Camera render failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      await addMessage('assistant', `Camera render failed: ${message}`, { type: 'text', status: 'failed' });
      toast({ variant: 'destructive', title: 'Generation failed', description: message });
    } finally {
      setIsGenerating(false);
    }
  }, [user, currentProjectId, currentRenderUrl, currentRenderId, currentUpload, cameras, addMessage, toast, loadAllRenders]);

  // Toggle room lock
  const handleToggleRoomLock = useCallback(async () => {
    if (!currentRoomId) return;
    
    const newLockedState = !isRoomLocked;
    
    const { error } = await supabase
      .from('rooms')
      .update({
        is_locked: newLockedState,
        locked_at: newLockedState ? new Date().toISOString() : null,
        locked_render_url: newLockedState ? currentRenderUrl : null,
      })
      .eq('id', currentRoomId);
    
    if (error) {
      console.error('Failed to toggle room lock:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update room lock' });
      return;
    }
    
    setIsRoomLocked(newLockedState);
    toast({ 
      title: newLockedState ? 'Room locked' : 'Room unlocked',
      description: newLockedState ? 'Room is now in view-only mode' : 'You can now edit this room',
    });
  }, [currentRoomId, isRoomLocked, currentRenderUrl, toast]);

  // Load room lock status when room changes
  useEffect(() => {
    const loadRoomLockStatus = async () => {
      if (!currentRoomId) {
        setIsRoomLocked(false);
        return;
      }
      
      const { data } = await supabase
        .from('rooms')
        .select('is_locked')
        .eq('id', currentRoomId)
        .maybeSingle();
      
      setIsRoomLocked(data?.is_locked ?? false);
    };
    
    loadRoomLockStatus();
  }, [currentRoomId]);

  // Handle chat input type selection (open modals)
  const handleChatInputTypeSelect = useCallback((type: ChatInputType) => {
    switch (type) {
      case 'layout':
        setShowLayoutModal(true);
        break;
      case 'room':
        setShowRoomPhotoModal(true);
        break;
      case 'style':
        setShowStyleRefModal(true);
        break;
      case 'products':
        setShowProductsModal(true);
        break;
    }
  }, []);

  // Handle layout upload from chat
  const handleLayoutUploadFromChat = useCallback(async (item: { file?: File; preview: string; name: string }) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to upload' });
      return;
    }
    if (!currentProjectId) {
      toast({ variant: 'destructive', title: 'Error', description: 'No project selected' });
      return;
    }
    if (!item.file) {
      toast({ variant: 'destructive', title: 'Error', description: 'No file selected' });
      return;
    }
    
    try {
      const fileName = `${user.id}/${currentProjectId}/${Date.now()}-${item.name}`;
      const { error: uploadError } = await supabase.storage
        .from('room-uploads')
        .upload(fileName, item.file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('room-uploads')
        .getPublicUrl(fileName);
      
      await supabase.from('room_uploads').insert({
        project_id: currentProjectId,
        user_id: user.id,
        file_name: item.name,
        file_url: publicUrl,
        upload_type: 'layout',
        analysis_status: 'completed',
      });
      
      setLayoutImageUrl(publicUrl);
      await addMessage('user', `Added 2D layout: ${item.name}`, { type: 'upload', imageUrl: publicUrl });
      toast({ title: 'Layout added' });
      setShowLayoutModal(false);
    } catch (error) {
      console.error('Layout upload failed:', error);
      toast({ variant: 'destructive', title: 'Upload failed', description: 'Please try again' });
    }
  }, [user, currentProjectId, addMessage, toast]);

  // Handle room photo upload from chat
  const handleRoomPhotoFromChat = useCallback(async (item: { file?: File; preview: string; name: string }) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to upload' });
      return;
    }
    if (!currentProjectId) {
      toast({ variant: 'destructive', title: 'Error', description: 'No project selected' });
      return;
    }
    if (!item.file) {
      toast({ variant: 'destructive', title: 'Error', description: 'No file selected' });
      return;
    }
    
    try {
      const fileName = `${user.id}/${currentProjectId}/${Date.now()}-${item.name}`;
      const { error: uploadError } = await supabase.storage
        .from('room-uploads')
        .upload(fileName, item.file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('room-uploads')
        .getPublicUrl(fileName);
      
      const { data: uploadRecord } = await supabase.from('room_uploads').insert({
        project_id: currentProjectId,
        user_id: user.id,
        file_name: item.name,
        file_url: publicUrl,
        upload_type: 'room_photo',
        analysis_status: 'pending',
      }).select().single();
      
      setRoomPhotoUrl(publicUrl);
      await addMessage('user', `Added room photo: ${item.name}`, { type: 'upload', imageUrl: publicUrl });
      toast({ title: 'Room photo added', description: 'Analyzing room...' });
      setShowRoomPhotoModal(false);
      
      if (uploadRecord) {
        analyzeRoom(uploadRecord.id, publicUrl);
      }
    } catch (error) {
      console.error('Room photo upload failed:', error);
      toast({ variant: 'destructive', title: 'Upload failed', description: 'Please try again' });
    }
  }, [user, currentProjectId, addMessage, toast]);

  // Handle style references from chat
  const handleStyleRefsFromChat = useCallback(async (items: Array<{ file?: File; preview: string; name: string }>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to upload' });
      return;
    }
    if (!currentProjectId) {
      toast({ variant: 'destructive', title: 'Error', description: 'No project selected' });
      return;
    }
    if (!items.length || items.every(i => !i.file)) {
      toast({ variant: 'destructive', title: 'Error', description: 'No files selected' });
      return;
    }
    
    try {
      const uploadedUrls: string[] = [];
      
      for (const item of items) {
        if (!item.file) continue;
        
        const fileName = `${user.id}/${currentProjectId}/style-${Date.now()}-${item.name}`;
        const { error: uploadError } = await supabase.storage
          .from('room-uploads')
          .upload(fileName, item.file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('room-uploads')
          .getPublicUrl(fileName);
        
        await supabase.from('style_uploads').insert({
          project_id: currentProjectId,
          user_id: user.id,
          file_name: item.name,
          file_url: publicUrl,
        });
        
        uploadedUrls.push(publicUrl);
      }
      
      setStyleRefUrls(prev => [...prev, ...uploadedUrls]);
      await addMessage('user', `Added ${uploadedUrls.length} style reference${uploadedUrls.length > 1 ? 's' : ''}`, { type: 'upload' });
      toast({ title: 'Style references added' });
      setShowStyleRefModal(false);
    } catch (error) {
      console.error('Style refs upload failed:', error);
      toast({ variant: 'destructive', title: 'Upload failed', description: 'Please try again' });
    }
  }, [user, currentProjectId, addMessage, toast]);

  // Handle products from chat
  const handleProductsFromChat = useCallback(async (products: ProductItem[], asCollage: boolean) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in' });
      return;
    }
    if (!currentProjectId) {
      toast({ variant: 'destructive', title: 'Error', description: 'No project selected' });
      return;
    }
    if (!products.length) {
      toast({ variant: 'destructive', title: 'Error', description: 'No products selected' });
      return;
    }
    
    try {
      const savedProducts: Array<{ id: string; name: string; imageUrl: string }> = [];
      
      for (const product of products) {
        if (!product.id) {
          // New product - save to database
          const { data, error } = await supabase.from('product_items').insert({
            project_id: currentProjectId,
            user_id: user.id,
            name: product.name,
            image_url: product.imageUrl,
          }).select().single();
          
          if (!error && data) {
            savedProducts.push({
              id: data.id,
              name: data.name,
              imageUrl: data.image_url || '',
            });
          }
        } else {
          // Existing product
          savedProducts.push({
            id: product.id,
            name: product.name,
            imageUrl: product.imageUrl || '',
          });
        }
      }
      
      // Update uploaded products state for display in chat input
      setUploadedProducts(prev => [...savedProducts, ...prev].slice(0, 10));
      
      await addMessage('user', `Added ${products.length} product${products.length > 1 ? 's' : ''} to project`, { type: 'upload' });
      toast({ 
        title: 'Products added!',
        description: 'Use "Generate with my products" to include them in your render.',
      });
      setShowProductsModal(false);
    } catch (error) {
      console.error('Products save failed:', error);
      toast({ variant: 'destructive', title: 'Failed to save products', description: 'Please try again' });
    }
  }, [user, currentProjectId, addMessage, toast]);
  
  // Handle using products in render
  const handleUseProducts = useCallback(() => {
    if (uploadedProducts.length === 0) return;
    // This will be triggered when user clicks "Use in Render"
    // Pre-fill message will happen in SleekChatInput
  }, [uploadedProducts]);
  
  // Clear uploaded products
  const handleClearProducts = useCallback(() => {
    setUploadedProducts([]);
  }, []);

  // Check if undo is possible
  const canUndo = (() => {
    if (!currentRenderId || !allRenders.length) return false;
    const currentRender = allRenders.find(r => r.id === currentRenderId);
    return !!currentRender?.parent_render_id;
  })();

  // Handle Start Over - creates a new project but KEEPS uploaded assets
  const handleStartOver = useCallback(async () => {
    if (!user) return;
    
    try {
      // Store current assets to copy to new project
      const currentLayoutUrl = layoutImageUrl;
      const currentRoomPhotoUrl = roomPhotoUrl;
      const currentStyleRefUrls = [...styleRefUrls];
      const currentUploadedProducts = [...uploadedProducts];
      const oldProjectId = currentProjectId;
      
      // Create a new project
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({ user_id: user.id, name: 'New Project' })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Copy room uploads (layout and room photo) to new project
      if (oldProjectId) {
        const { data: oldUploads } = await supabase
          .from('room_uploads')
          .select('*')
          .eq('project_id', oldProjectId)
          .in('upload_type', ['layout', 'room_photo']);
        
        if (oldUploads && oldUploads.length > 0) {
          const newUploads = oldUploads.map(upload => ({
            project_id: newProject.id,
            user_id: user.id,
            file_name: upload.file_name,
            file_url: upload.file_url,
            upload_type: upload.upload_type,
            analysis_status: upload.analysis_status,
            analysis_result: upload.analysis_result,
          }));
          await supabase.from('room_uploads').insert(newUploads);
        }
        
        // Copy style uploads to new project
        const { data: oldStyleUploads } = await supabase
          .from('style_uploads')
          .select('*')
          .eq('project_id', oldProjectId);
        
        if (oldStyleUploads && oldStyleUploads.length > 0) {
          const newStyleUploads = oldStyleUploads.map(upload => ({
            project_id: newProject.id,
            user_id: user.id,
            file_name: upload.file_name,
            file_url: upload.file_url,
          }));
          await supabase.from('style_uploads').insert(newStyleUploads);
        }
        
        // Copy product items to new project
        const { data: oldProducts } = await supabase
          .from('product_items')
          .select('*')
          .eq('project_id', oldProjectId);
        
        if (oldProducts && oldProducts.length > 0) {
          const newProducts = oldProducts.map(product => ({
            project_id: newProject.id,
            user_id: user.id,
            name: product.name,
            image_url: product.image_url,
            product_url: product.product_url,
          }));
          await supabase.from('product_items').insert(newProducts);
        }
      }
      
      // Reset render-related state but KEEP assets
      setMessages([]);
      setCurrentRenderUrl(null);
      setCurrentRenderId(null);
      setCurrentUpload(null);
      setStagedItems([]);
      setAllRenderUrls([]);
      setAllRenders([]);
      setZones([]);
      setAgentBState('idle');
      setAgentBUnderstanding(null);
      setAgentBQuestions([]);
      setAgentBAnswers([]);
      setMulticamViews({ perspective: null, front: null, side: null, top: null, cinematic: null, custom: null });
      setIsAIDetectionActive(false);
      setSelectedDetections([]);
      setDetectionReplacements(new Map());
      setLockedDetections(new Set());
      
      // KEEP the assets - restore them after project switch
      setLayoutImageUrl(currentLayoutUrl);
      setRoomPhotoUrl(currentRoomPhotoUrl);
      setStyleRefUrls(currentStyleRefUrls);
      setUploadedProducts(currentUploadedProducts);
      
      // Navigate to new project
      setCurrentProjectId(newProject.id);
      setSearchParams({ project: newProject.id }, { replace: true });
      setProjectName('New Project');
      
      toast({ title: 'Starting fresh render...', description: 'Generating new render with your assets' });
      setShowStartOverDialog(false);
      
      // Automatically trigger a new render generation with the kept assets
      setTimeout(() => {
        const hasAssets = currentLayoutUrl || currentRoomPhotoUrl || currentStyleRefUrls.length > 0;
        if (hasAssets) {
          // Build a prompt based on available assets
          let prompt = 'Generate a fresh interior design render';
          if (currentLayoutUrl) prompt += ' based on the floor plan layout';
          if (currentRoomPhotoUrl) prompt += ' for the uploaded room photo';
          if (currentStyleRefUrls.length > 0) prompt += ' with the selected style references';
          if (currentUploadedProducts.length > 0) {
            const productNames = currentUploadedProducts.slice(0, 3).map(p => p.name).join(', ');
            prompt += ` featuring ${productNames}`;
          }
          
          // Trigger the generation
          handleSendMessageWithAgentB(prompt);
        }
      }, 500);
    } catch (error) {
      console.error('Failed to start over:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create new project' });
    }
  }, [user, toast, setSearchParams, layoutImageUrl, roomPhotoUrl, styleRefUrls, uploadedProducts, currentProjectId, handleSendMessageWithAgentB]);

  // Handle Upscale Render
  const handleUpscaleRender = useCallback(async () => {
    if (!currentRenderUrl) {
      toast({ variant: 'destructive', title: 'No render to upscale', description: 'Generate a render first' });
      return;
    }
    
    setIsUpscaling(true);
    
    try {
      const response = await supabase.functions.invoke('upscale-image', {
        body: { imageUrl: currentRenderUrl }
      });
      
      if (response.error) throw response.error;
      
      const upscaledUrl = response.data?.upscaledUrl;
      if (!upscaledUrl) throw new Error('No upscaled URL returned');
      
      // Download the upscaled image
      const link = document.createElement('a');
      link.href = upscaledUrl;
      link.download = formatDownloadFilename('upscaled', projectName, 'png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({ title: 'Upscaled!', description: 'HD image downloaded' });
    } catch (error) {
      console.error('Upscale failed:', error);
      toast({ variant: 'destructive', title: 'Upscale failed', description: 'Please try again' });
    } finally {
      setIsUpscaling(false);
    }
  }, [currentRenderUrl, projectName, toast]);

  // Loading state - early returns AFTER all hooks
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-gradient-brand mx-auto mb-4 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <PageTransition>
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar
          currentProjectId={currentProjectId}
          currentRoomId={currentRoomId}
          onProjectSelect={handleProjectSelect}
          onRoomSelect={handleRoomSelect}
          onNewProject={handleNewProject}
        />
        
        <div className="flex flex-1 overflow-hidden relative">
          {/* Project switching overlay */}
          {isProjectSwitching && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="text-center">
                <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Loading project...</p>
              </div>
            </div>
          )}
          
          {/* Premium Workspace */}
          <PremiumWorkspace
            renderUrl={currentRenderUrl || roomPhotoUrl}
            isGenerating={isGenerating}
            allRenders={allRenders}
            currentRenderId={currentRenderId}
            onRenderHistorySelect={handleRenderHistorySelect}
            onDeleteRender={handleDeleteRender}
            onSelectiveEdit={handleEnterSelectionMode}
            onAIDirectorChange={handleAIDirectorChange}
            onMulticamGenerate={handleMulticamGenerate}
            onToggleMulticamPanel={() => setShowMulticamPanel(!showMulticamPanel)}
            showMulticamPanel={showMulticamPanel}
            onPositionFurniture={stagedItems.length > 0 && (currentRenderUrl || roomPhotoUrl) ? () => { setShowCatalogModal(false); setShowPositioner(true); } : undefined}
            onExport={() => setShowExportModal(true)}
            onUndo={handleUndo}
            canUndo={canUndo}
            isSelectiveEditing={isSelectiveEditing}
            isMulticamGenerating={isMulticamGenerating}
            multicamViews={multicamViews}
            onSetMulticamAsMain={handleSetMulticamAsMain}
            stagedItems={stagedItems}
            projectId={currentProjectId || undefined}
            zones={zones}
            selectedZoneId={selectedZoneId}
            isDrawingZone={false}
            showZonesPanel={showZonesPanel}
            onZoneCreate={handleZoneCreate}
            onZoneDelete={handleZoneDelete}
            onZoneSelect={handleZoneSelect}
            onStartZoneDrawing={() => {}}
            onStopZoneDrawing={() => {}}
            onGenerateZoneView={handleGenerateZoneView}
            onCompareZone={(zone) => setComparisonZone(zone)}
            onToggleZonesPanel={() => {
              if (layoutImageUrl) {
                setShowLayoutZoneModal(true);
              } else {
                toast({ 
                  variant: 'destructive', 
                  title: 'No layout available', 
                  description: 'Upload a 2D layout first to define zones' 
                });
              }
            }}
            generatingZoneName={generatingZoneName}
            generatingViewType={generatingViewType}
            // Enhanced tools props
            onToggleAIDetection={() => {
              if (!currentRenderUrl && !roomPhotoUrl) {
                toast({
                  variant: 'destructive',
                  title: 'No image available',
                  description: 'Upload a room photo or generate a render first'
                });
                return;
              }
              setIsAIDetectionActive(prev => !prev);
            }}
            isAIDetectionActive={isAIDetectionActive}
            onToggleAutoFurnish={() => setShowAutoFurnish(prev => !prev)}
            showAutoFurnish={showAutoFurnish}
            onToggleAssetsPanel={() => setShowAssetsPanel(prev => !prev)}
            showAssetsPanel={showAssetsPanel}
            onOpenCatalog={() => setShowCatalogModal(true)}
            // Selection tool props
            isSelectionMode={selectionMode && !currentSelection}
            onSelectionComplete={handleSelectionComplete}
            // Start Over and Upscale props
            onStartOver={() => setShowStartOverDialog(true)}
            onUpscale={handleUpscaleRender}
            isUpscaling={isUpscaling}
          />

          {/* Selection is now handled inside PremiumWorkspace */}

          {/* Selective Edit Panel - shows after selection is made */}
          {currentSelection && selectionMode && (currentRenderUrl || roomPhotoUrl) && (
            <SelectiveEditPanel
              selection={currentSelection}
              renderUrl={currentRenderUrl || roomPhotoUrl || ''}
              onSubmit={handleSelectiveEditSubmit}
              onCancel={handleSelectiveEditCancel}
              isProcessing={isSelectiveEditing}
            />
          )}

          {/* AI Detection Overlay */}
          {isAIDetectionActive && (currentRenderUrl || roomPhotoUrl) && (
            <AIDetectionOverlay
              renderUrl={currentRenderUrl || roomPhotoUrl || ''}
              isActive={isAIDetectionActive}
              onClose={() => {
                setIsAIDetectionActive(false);
                setIsEraserMode(false);
                setSelectedDetections([]);
              }}
              isMultiSelectMode={isMultiSelectMode}
              selectedItems={selectedDetections}
              onItemSelect={handleDetectionSelect}
              onItemAction={handleDetectionAction}
              onBatchGenerate={handleBatchGenerate}
              lockedItems={Array.from(lockedDetections)}
              replacementItems={new Map(
                Array.from(detectionReplacements.entries()).map(([id, item]) => [
                  id,
                  { name: item.name, imageUrl: item.imageUrl }
                ])
              )}
              onApplyFurnish={handleApplyFurnish}
              onClearAll={handleClearDetectionState}
              isFindingSimilar={isFindingSimilar}
            />
          )}

          {/* Floating Assets Panel */}
          <FloatingAssetsPanel
            isOpen={showAssetsPanel}
            onClose={() => setShowAssetsPanel(false)}
            projectId={currentProjectId || undefined}
            stagedItems={stagedItems}
            onAssetClick={(url) => {
              toast({ title: 'Asset selected', description: 'Reference loaded' });
            }}
          />

          {/* Auto-Furnish Panel */}
          <AutoFurnishPanel
            isOpen={showAutoFurnish}
            onClose={() => setShowAutoFurnish(false)}
            renderUrl={currentRenderUrl}
            catalogItems={catalogItems}
            onApply={handleAutoFurnishApply}
          />
          
          {/* Bottom Controls Container - Staged Items Dock + Chat Input */}
          <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none flex flex-col items-center pb-6 px-4 gap-3">
            {/* Staged Items Dock */}
            <div className="pointer-events-auto w-full flex justify-center">
              <StagedItemsDock
                stagedItems={stagedItems}
                onPositionFurniture={() => setShowPositioner(true)}
                onGenerateWithItems={() => {
                  const itemNames = stagedItems.slice(0, 3).map(i => i.name).join(', ');
                  handleSendMessageWithAgentB(`Generate a render with ${itemNames} placed naturally in the room`);
                }}
                onClearAll={handleClearStagedItems}
                onRemoveItem={handleCatalogItemSelect}
                onViewAll={() => setShowStagedItemsModal(true)}
                onPlaceMarkers={() => setShowMarkerStaging(true)}
                canPosition={!!(currentRenderUrl || roomPhotoUrl)}
                isGenerating={isGenerating}
              />
            </div>
            
            {/* Floating Chat Input */}
            <div className="pointer-events-auto w-full max-w-2xl">
              <SleekChatInput
                onSend={(message) => handleSendMessageWithAgentB(message)}
                isLoading={isProcessing || isGenerating || isSelectiveEditing || agentBState === 'generating'}
                agentBEnabled={agentBEnabled}
                onAgentBToggle={setAgentBEnabled}
                onLayoutUpload={() => setShowLayoutModal(true)}
                onRoomPhotoUpload={() => setShowRoomPhotoModal(true)}
                onStyleRefUpload={() => setShowStyleRefModal(true)}
                onProductsPick={() => setShowProductsModal(true)}
                placeholder={agentBEnabled ? "Describe your vision (Agent B will guide you)..." : "Describe your vision..."}
                stagedItems={stagedItems}
                onOpenCatalog={() => setShowCatalogModal(true)}
                uploadedProducts={uploadedProducts}
                onClearProducts={handleClearProducts}
              />
            </div>
          </div>
        </div>

      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUpload}
        isUploading={isUploading}
      />

      <ExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        projectData={{
          projectName,
          projectId: currentProjectId || '',
          layoutImageUrl,
          roomPhotoUrl: currentUpload?.file_url || null,
          styleRefUrls,
          renderUrls: allRenderUrls,
          currentRenderUrl,
          furnitureItems: stagedItems.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            description: item.description,
            imageUrl: item.imageUrl,
            price: item.price || 0,
          })),
        }}
      />

      <OrderFlowModal
        open={showOrderModal}
        onOpenChange={setShowOrderModal}
        projectId={currentProjectId || ''}
        projectName={projectName}
        stagedItems={stagedItems.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price || 0,
          imageUrl: item.imageUrl,
        }))}
        projectData={{
          projectName,
          projectId: currentProjectId || '',
          layoutImageUrl,
          roomPhotoUrl: currentUpload?.file_url || null,
          styleRefUrls,
          renderUrls: allRenderUrls,
          currentRenderUrl,
          furnitureItems: stagedItems.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            description: item.description,
            imageUrl: item.imageUrl,
            price: item.price || 0,
          })),
        }}
        onOrderComplete={() => {
          toast({ title: 'Order created successfully!' });
          loadStagedFurniture();
        }}
      />

      <StagedItemsModal
        open={showStagedItemsModal}
        onOpenChange={setShowStagedItemsModal}
        stagedItems={stagedItems}
        onRemoveItem={handleCatalogItemSelect}
        onClearAll={handleClearStagedItems}
        onPositionFurniture={() => {
          setShowStagedItemsModal(false);
          setShowPositioner(true);
        }}
        onOpenInvoice={() => setShowExportModal(true)}
        onOpenPPT={() => setShowExportModal(true)}
        canPosition={!!(currentRenderUrl || roomPhotoUrl)}
      />

      {/* Marker Staging Panel */}
      {(currentRenderUrl || roomPhotoUrl) && (
        <MarkerStagingPanel
          isOpen={showMarkerStaging}
          onClose={() => {
            setShowMarkerStaging(false);
            setActiveMarkerId(null);
          }}
          renderUrl={currentRenderUrl || roomPhotoUrl!}
          markers={stagingMarkers}
          onMarkerAdd={handleMarkerAdd}
          onMarkerRemove={handleMarkerRemove}
          onMarkerProductSelect={handleMarkerProductSelectStart}
          onClearAll={handleMarkerClearAll}
          onGenerate={handleMarkerBatchGenerate}
          isGenerating={isGenerating}
          activeMarkerId={activeMarkerId}
        />
      )}

      {/* Marker Catalog Modal - for selecting products for markers */}
      <FullScreenCatalogModal
        isOpen={isMarkerCatalogOpen}
        onClose={() => {
          setIsMarkerCatalogOpen(false);
          setActiveMarkerId(null);
        }}
        catalogItems={catalogItems}
        stagedItemIds={[]}
        onToggleStage={(item) => {
          handleMarkerProductAssign(item);
        }}
        onPreviewItem={(item) => {
          handleMarkerProductAssign(item);
        }}
        title={activeMarkerId ? 'Select Product for Marker' : 'Select Product'}
        subtitle="Click a product to assign it to the selected marker"
        selectionMode={true}
      />

      {showPositioner && (currentRenderUrl || roomPhotoUrl) && (
        <FurniturePositioner
          renderUrl={currentRenderUrl || roomPhotoUrl!}
          stagedItems={stagedItems}
          onConfirm={handleCompositeConfirm}
          onCancel={() => setShowPositioner(false)}
          isProcessing={isGenerating}
        />
      )}

      {/* Layout Zone Modal - Full screen zone drawing on layout */}
      {layoutImageUrl && currentProjectId && (
        <LayoutZoneModal
          isOpen={showLayoutZoneModal}
          onClose={() => setShowLayoutZoneModal(false)}
          projectId={currentProjectId}
          layoutImageUrl={layoutImageUrl}
          renderUrl={currentRenderUrl}
          onZoneCreate={handleZoneCreate}
          onZoneDelete={handleZoneDelete}
          onGenerateZoneView={handleGenerateZoneView}
          onCompareZone={(zone) => setComparisonZone(zone)}
          isGenerating={isGenerating || isMulticamGenerating}
        />
      )}

      {/* Chat input modals */}
      <LayoutUploadModal
        open={showLayoutModal}
        onOpenChange={setShowLayoutModal}
        onUpload={handleLayoutUploadFromChat}
      />
      
      <RoomPhotoModal
        open={showRoomPhotoModal}
        onOpenChange={setShowRoomPhotoModal}
        onUpload={handleRoomPhotoFromChat}
      />
      
      <StyleRefModal
        open={showStyleRefModal}
        onOpenChange={setShowStyleRefModal}
        onUpload={handleStyleRefsFromChat}
        currentUploads={[]}
      />
      
      <ProductPickerModal
        open={showProductsModal}
        onOpenChange={setShowProductsModal}
        onSave={handleProductsFromChat}
        currentProducts={[]}
        userId={user?.id}
        projectId={currentProjectId || undefined}
      />

      {/* Full-Screen Catalog Modal */}
      <FullScreenCatalogModal
        isOpen={showCatalogModal}
        onClose={() => {
          setShowCatalogModal(false);
          setReplacingDetectionId(null);
          setReplacingDetectionLabel('');
          setSimilarSearchData(null);
        }}
        catalogItems={catalogItems}
        stagedItemIds={stagedItems.map(i => i.id)}
        onToggleStage={replacingDetectionId ? handleReplacementSelect : handleCatalogItemSelect}
        onPreviewItem={handleCatalogItemPreview}
        title={replacingDetectionId 
          ? similarSearchData 
            ? `Similar to "${replacingDetectionLabel}"`
            : `Select replacement for "${replacingDetectionLabel}"`
          : undefined}
        subtitle={replacingDetectionId 
          ? similarSearchData 
            ? 'AI found these items based on visual characteristics'
            : 'Choose a furniture item to replace the detected piece' 
          : undefined}
        selectionMode={!!replacingDetectionId}
        initialSearchQuery={similarSearchData?.searchTerms?.[0] || ''}
        suggestedCategory={similarSearchData?.category || undefined}
        similarityBadge={similarSearchData?.itemLabel}
        isLoading={isFindingSimilar}
      />

      {/* Start Over Confirmation Dialog */}
      <AlertDialog open={showStartOverDialog} onOpenChange={setShowStartOverDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Over?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new project and discard your current work. Your existing project will still be saved and accessible from the sidebar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartOver}>Start Fresh</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Zone Comparison Modal */}
      {comparisonZone && layoutImageUrl && currentRenderUrl && (
        <ZoneComparisonModal
          zone={comparisonZone}
          layoutImageUrl={layoutImageUrl}
          generatedRenderUrl={currentRenderUrl}
          onClose={() => setComparisonZone(null)}
        />
      )}
    </div>
  </SidebarProvider>
  </PageTransition>
);
};

export default Index;
