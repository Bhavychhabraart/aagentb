import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ChatPanel, ChatMessage, ChatInputType } from '@/components/canvas/ChatPanel';
import { RenderViewer } from '@/components/canvas/RenderViewer';
import { UploadDialog } from '@/components/canvas/UploadDialog';
import { AssetsPanel } from '@/components/canvas/AssetsPanel';
import { ExportModal } from '@/components/canvas/ExportModal';
import { OrderFlowModal } from '@/components/canvas/OrderFlowModal';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CatalogFurnitureItem } from '@/services/catalogService';
import { FurniturePositioner, FurniturePlacement } from '@/components/canvas/FurniturePositioner';
import { ProjectData } from '@/services/documentService';
import { SelectionRegion } from '@/components/canvas/SelectionOverlay';
import { RenderHistoryItem } from '@/components/canvas/RenderHistoryCarousel';
import { CameraView } from '@/components/canvas/MulticamPanel';
import { LayoutUploadModal } from '@/components/creation/LayoutUploadModal';
import { RoomPhotoModal } from '@/components/creation/RoomPhotoModal';
import { StyleRefModal } from '@/components/creation/StyleRefModal';
import { ProductPickerModal, ProductItem } from '@/components/creation/ProductPickerModal';

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
  const [multicamViews, setMulticamViews] = useState<Record<CameraView, string | null>>({
    perspective: null,
    front: null,
    side: null,
    top: null,
    custom: null,
  });
  
  // Chat input modals
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  const [showRoomPhotoModal, setShowRoomPhotoModal] = useState(false);
  const [showStyleRefModal, setShowStyleRefModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);

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
      .select('id, render_url, prompt, parent_render_id, created_at')
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
    hasTriggeredGeneration.current = false;
    
    // Update URL with new project ID
    setSearchParams({ project: projectId }, { replace: true });
    
    // Set new project ID (triggers data reload via useEffect)
    setCurrentProjectId(projectId);
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

  // Edit existing render with staged furniture
  const editRender = useCallback(async (content: string, furnitureItems: CatalogFurnitureItem[]) => {
    if (!user || !currentProjectId || !currentRenderUrl) return;

    setIsGenerating(true);

    try {
      // Fetch project references for layout and style consistency
      const references = await fetchProjectReferences(currentProjectId);

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

      const furnitureNames = furnitureItems.map(i => i.name).join(', ');
      await addMessage('assistant', `Editing render: replacing furniture with ${furnitureNames}...`, 
        { type: 'text', status: 'pending' }
      );

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/edit-render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          currentRenderUrl,
          userPrompt: content,
          furnitureItems: furnitureItems.map(item => ({
            name: item.name,
            category: item.category,
            description: item.description,
            imageUrl: item.imageUrl,
          })),
          // Pass layout and style references for consistency
          layoutImageUrl: references.layoutUrl,
          styleRefUrls: references.styleRefUrls,
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

      await addMessage('assistant', 'Render updated with your furniture! The staged items have been placed in the room.', {
        type: 'render',
        imageUrl,
        status: 'ready',
      });

      toast({ title: 'Render updated', description: 'Furniture replaced successfully.' });

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
        references.roomPhotoUrl ? 'room photo' : null,
        references.styleRefUrls.length > 0 ? `${references.styleRefUrls.length} style ref${references.styleRefUrls.length > 1 ? 's' : ''}` : null,
        allProducts.length > 0 ? `${allProducts.length} product${allProducts.length > 1 ? 's' : ''}` : null,
      ].filter(Boolean).join(', ');

      await addMessage('assistant', allProducts.length > 0 
        ? `Generating your render with ${allProducts.length} product${allProducts.length > 1 ? 's' : ''}${refInfo ? ` using ${refInfo}` : ''}...`
        : `Generating your render${refInfo ? ` using ${refInfo}` : ''}...`, 
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

    // Determine if we should edit or generate
    const shouldEdit = currentRenderUrl && stagedItems.length > 0;

    // Build message content with staged items info
    const messageContent = stagedItems.length > 0
      ? `${content}\n\n📦 Staged furniture: ${stagedItems.map(i => i.name).join(', ')}`
      : content;

    // Add user message
    await addMessage('user', messageContent, { 
      type: 'text',
      stagedFurniture: stagedItems.length > 0 ? stagedItems.map(i => ({ id: i.id, name: i.name })) : undefined,
    } as ChatMessage['metadata']);

    // Choose edit or generate based on context
    if (shouldEdit) {
      // Edit existing render with staged furniture
      editRender(content, stagedItems);
    } else {
      // Generate new render
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
    }
  }, [user, currentProjectId, stagedItems]);

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

  // Determine if in edit mode
  const isEditMode = currentRenderUrl !== null && stagedItems.length > 0;

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
        })
        .select()
        .single();

      if (renderError) throw renderError;

      await addMessage('assistant', `Compositing ${placements.length} furniture items with precise positioning...`, 
        { type: 'text', status: 'pending' }
      );

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
  const handleSelectiveEdit = useCallback(async (region: SelectionRegion, prompt: string, catalogItem?: CatalogFurnitureItem) => {
    if (!user || !currentProjectId || !currentRenderUrl) return;

    setIsSelectiveEditing(true);

    try {
      const references = await fetchProjectReferences(currentProjectId);

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
          catalogItem: catalogItem ? {
            name: catalogItem.name,
            category: catalogItem.category,
            description: catalogItem.description,
            imageUrl: catalogItem.imageUrl,
          } : undefined,
          layoutImageUrl: references.layoutUrl,
          styleRefUrls: references.styleRefUrls,
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
      loadAllRenders();

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

  // Handle render selection from history carousel
  const handleRenderHistorySelect = useCallback((render: RenderHistoryItem) => {
    setCurrentRenderUrl(render.render_url);
    setCurrentRenderId(render.id);
    toast({ title: 'Render selected', description: 'Viewing selected render version.' });
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

      // Call edit-render with the global prompt
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/edit-render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          originalImageUrl: currentRenderUrl,
          prompt: prompt,
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

      loadAllRenders();
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

  // Handle Multicam view generation
  const handleMulticamGenerate = useCallback(async (view: CameraView, customPrompt?: string) => {
    if (!user || !currentProjectId || !currentRenderUrl) return;

    setIsMulticamGenerating(true);
    
    const viewPrompts: Record<CameraView, string> = {
      perspective: 'Render this room from a 3/4 perspective angle, showing depth and dimension',
      front: 'Render this room from a straight-on front view, facing the main focal wall',
      side: 'Render this room from a side view, showing the profile of the space',
      top: "Render this room from a bird's eye top-down view, showing the floor plan layout",
      custom: customPrompt || 'Render this room from a custom camera angle',
    };

    try {
      await addMessage('user', `📷 Generating ${view} view...`, { type: 'text' });

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/edit-render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          originalImageUrl: currentRenderUrl,
          prompt: view === 'custom' && customPrompt ? customPrompt : viewPrompts[view],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Multicam generation failed');
      }

      const { imageUrl } = await response.json();

      setMulticamViews(prev => ({ ...prev, [view]: imageUrl }));

      await addMessage('assistant', `${view.charAt(0).toUpperCase() + view.slice(1)} view generated!`, {
        type: 'render',
        imageUrl,
        status: 'ready',
      });

      toast({ title: 'View generated', description: `${view.charAt(0).toUpperCase() + view.slice(1)} view ready.` });
    } catch (error) {
      console.error('Multicam generation failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      await addMessage('assistant', `Failed to generate ${view} view: ${message}`, { type: 'text', status: 'failed' });
      toast({ variant: 'destructive', title: 'Failed', description: message });
    } finally {
      setIsMulticamGenerating(false);
    }
  }, [user, currentProjectId, currentRenderUrl, addMessage, toast]);

  // Handle setting a multicam view as main render
  const handleSetMulticamAsMain = useCallback((imageUrl: string) => {
    setCurrentRenderUrl(imageUrl);
  }, []);

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
      for (const product of products) {
        if (!product.id) {
          // New product - save to database
          await supabase.from('product_items').insert({
            project_id: currentProjectId,
            user_id: user.id,
            name: product.name,
            image_url: product.imageUrl,
          });
        }
      }
      
      await addMessage('user', `Added ${products.length} product${products.length > 1 ? 's' : ''} to project`, { type: 'upload' });
      toast({ title: 'Products added' });
      setShowProductsModal(false);
    } catch (error) {
      console.error('Products save failed:', error);
      toast({ variant: 'destructive', title: 'Failed to save products', description: 'Please try again' });
    }
  }, [user, currentProjectId, addMessage, toast]);

  // Check if undo is possible
  const canUndo = (() => {
    if (!currentRenderId || !allRenders.length) return false;
    const currentRender = allRenders.find(r => r.id === currentRenderId);
    return !!currentRender?.parent_render_id;
  })();

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
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar
          currentProjectId={currentProjectId}
          onProjectSelect={handleProjectSelect}
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
          
        <RenderViewer
          imageUrl={currentRenderUrl}
          isGenerating={isGenerating}
          layoutImageUrl={layoutImageUrl}
          roomPhotoUrl={roomPhotoUrl}
          onPositionFurniture={stagedItems.length > 0 && currentRenderUrl ? () => setShowPositioner(true) : undefined}
          onExport={() => setShowExportModal(true)}
          onStartOrder={stagedItems.length > 0 ? () => setShowOrderModal(true) : undefined}
          onSelectiveEdit={handleSelectiveEdit}
          onAIDirectorChange={handleAIDirectorChange}
          onMulticamGenerate={handleMulticamGenerate}
          isSelectiveEditing={isSelectiveEditing}
          isMulticamGenerating={isMulticamGenerating}
          multicamViews={multicamViews}
          onSetMulticamAsMain={handleSetMulticamAsMain}
          allRenders={allRenders}
          currentRenderId={currentRenderId}
          onRenderHistorySelect={handleRenderHistorySelect}
          onUndo={handleUndo}
          canUndo={canUndo}
        />
        
        <div className="w-96 shrink-0 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <ChatPanel
              messages={messages}
              isLoading={isProcessing || isGenerating || isSelectiveEditing}
              onSendMessage={handleSendMessage}
              onInputTypeSelect={handleChatInputTypeSelect}
              stagedItems={stagedItems}
              onClearStagedItems={handleClearStagedItems}
              isEditMode={isEditMode}
              currentRenderUrl={currentRenderUrl}
              onRenderSelect={(url) => setCurrentRenderUrl(url)}
            />
          </div>
          <AssetsPanel 
            projectId={currentProjectId} 
            onCatalogItemSelect={handleCatalogItemSelect}
            onCustomItemSelect={handleCatalogItemSelect}
            stagedItemIds={stagedItems.map(i => i.id)}
          />
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

      {showPositioner && currentRenderUrl && (
        <FurniturePositioner
          renderUrl={currentRenderUrl}
          stagedItems={stagedItems}
          onConfirm={handleCompositeConfirm}
          onCancel={() => setShowPositioner(false)}
          isProcessing={isGenerating}
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
    </div>
  </SidebarProvider>
);
};

export default Index;
