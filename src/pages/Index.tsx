import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ChatPanel, ChatMessage } from '@/components/canvas/ChatPanel';
import { RenderViewer } from '@/components/canvas/RenderViewer';
import { UploadDialog } from '@/components/canvas/UploadDialog';
import { AssetsPanel } from '@/components/canvas/AssetsPanel';
import { SidebarProvider } from '@/components/ui/sidebar';
import { CatalogFurnitureItem } from '@/services/catalogService';

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
      loadMessages();
      loadLatestUpload();
      loadLatestRender();
      loadStagedFurniture();
    }
  }, [currentProjectId]);

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

  // Fetch all project reference images (layout, room photo, style refs)
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
    
    return {
      layoutUrl: uploads?.find(u => u.upload_type === 'layout')?.file_url || null,
      roomPhotoUrl: uploads?.find(u => u.upload_type === 'room_photo')?.file_url || null,
      styleRefUrls: styleRefs?.map(s => s.file_url) || [],
    };
  };

  const handleNewProject = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: user.id, name: 'Untitled Project' })
      .select('id')
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create project.' });
    } else {
      setCurrentProjectId(data.id);
      setMessages([]);
      setCurrentRenderUrl(null);
      setCurrentRenderId(null);
      setCurrentUpload(null);
      toast({ title: 'Project created', description: 'New project ready.' });
    }
  };

  const handleProjectSelect = (projectId: string) => {
    setCurrentProjectId(projectId);
    setMessages([]);
    setCurrentRenderUrl(null);
    setCurrentRenderId(null);
    setCurrentUpload(null);
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
      
      console.log('Generation references:', {
        hasLayout: !!references.layoutUrl,
        hasRoomPhoto: !!references.roomPhotoUrl,
        styleCount: references.styleRefUrls.length,
      });

      // Build enhanced prompt with furniture context
      let enhancedPrompt = content;
      if (furnitureItems.length > 0) {
        const furnitureContext = furnitureItems.map(item => 
          `- ${item.name} (${item.category}): ${item.description}`
        ).join('\n');
        enhancedPrompt = `${content}\n\n[Include these specific furniture pieces in the design:\n${furnitureContext}]`;
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
      ].filter(Boolean).join(', ');

      await addMessage('assistant', furnitureItems.length > 0 
        ? `Generating your render with ${furnitureItems.length} furniture piece${furnitureItems.length > 1 ? 's' : ''}${refInfo ? ` using ${refInfo}` : ''}...`
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
          furnitureItems: furnitureItems.map(item => ({
            name: item.name,
            category: item.category,
            description: item.description,
            imageUrl: item.imageUrl,
          })),
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

  // Loading state
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
        
        <div className="flex flex-1 overflow-hidden">
          <RenderViewer
            imageUrl={currentRenderUrl}
            isGenerating={isGenerating}
          />
          
          <div className="w-96 shrink-0 flex flex-col">
            <div className="flex-1 overflow-hidden">
              <ChatPanel
                messages={messages}
                isLoading={isProcessing || isGenerating}
                onSendMessage={handleSendMessage}
                onUploadClick={() => setUploadDialogOpen(true)}
                stagedItems={stagedItems}
                onClearStagedItems={handleClearStagedItems}
                isEditMode={isEditMode}
              />
            </div>
            <AssetsPanel 
              projectId={currentProjectId} 
              onCatalogItemSelect={handleCatalogItemSelect}
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
      </div>
    </SidebarProvider>
  );
};

export default Index;
