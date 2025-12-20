import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Download, FileJson, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LayoutCanvas } from '@/components/layout-creator/LayoutCanvas';
import { RoomSettingsModal } from '@/components/layout-creator/RoomSettingsModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RoomDimensions } from '@/types/layout-creator';
import { downloadDataUrl, downloadJSON, formatDimensions } from '@/utils/layoutExport';
import { useLayoutCanvas } from '@/hooks/useLayoutCanvas';
import { Json } from '@/integrations/supabase/types';

export default function LayoutCreator() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [layoutName, setLayoutName] = useState('Untitled Layout');
  const [roomDimensions, setRoomDimensions] = useState<RoomDimensions>({ width: 20, depth: 15, unit: 'ft' });
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [layoutId, setLayoutId] = useState<string | null>(id || null);
  const [isNewLayout, setIsNewLayout] = useState(!id);
  
  const canvasMethodsRef = useRef<ReturnType<typeof useLayoutCanvas> | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Load existing layout if ID provided
  useEffect(() => {
    if (id && user) {
      loadLayout(id);
    } else if (!id) {
      // New layout - show room settings modal
      setShowRoomSettings(true);
      setIsNewLayout(true);
    }
  }, [id, user]);

  // Listen for save event
  useEffect(() => {
    const handleSaveEvent = () => {
      handleSave();
    };
    window.addEventListener('save-layout', handleSaveEvent);
    return () => window.removeEventListener('save-layout', handleSaveEvent);
  }, [layoutId, layoutName, roomDimensions, user, projectId]);

  const loadLayout = async (layoutId: string) => {
    const { data, error } = await supabase
      .from('layouts')
      .select('*')
      .eq('id', layoutId)
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load layout.',
      });
      navigate('/layout-creator');
      return;
    }

    if (data) {
      setLayoutName(data.name || 'Untitled Layout');
      const dims = data.room_dimensions as unknown as RoomDimensions;
      if (dims) {
        setRoomDimensions(dims);
      }
      setLayoutId(data.id);
      setIsNewLayout(false);
    }
  };

  const handleRoomSettingsSave = (dimensions: RoomDimensions) => {
    setRoomDimensions(dimensions);
    setShowRoomSettings(false);
  };

  const handleCanvasReady = (methods: ReturnType<typeof useLayoutCanvas>) => {
    canvasMethodsRef.current = methods;
  };

  const handleSave = async () => {
    if (!user || !canvasMethodsRef.current?.canvas) return;

    setSaving(true);
    try {
      const canvasJson = canvasMethodsRef.current.exportAsJSON() as unknown as Json;
      
      if (layoutId && !isNewLayout) {
        // Update existing
        const { error } = await supabase
          .from('layouts')
          .update({
            name: layoutName,
            room_dimensions: roomDimensions as unknown as Json,
            canvas_data: canvasJson,
            updated_at: new Date().toISOString(),
          })
          .eq('id', layoutId);

        if (error) throw error;
        toast({ title: 'Layout saved' });
      } else {
        // Create new
        const { data, error } = await supabase
          .from('layouts')
          .insert({
            user_id: user.id,
            project_id: projectId,
            name: layoutName,
            room_dimensions: roomDimensions as unknown as Json,
            canvas_data: canvasJson,
          })
          .select()
          .single();

        if (error) throw error;
        setLayoutId(data.id);
        setIsNewLayout(false);
        toast({ title: 'Layout created' });
        
        // Update URL without reload
        window.history.replaceState(null, '', `/layout-creator/${data.id}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save layout.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportPNG = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      downloadDataUrl(canvas.toDataURL('image/png'), `${layoutName}.png`);
      toast({ title: 'PNG exported' });
    }
  };

  const handleExportJSON = () => {
    if (canvasMethodsRef.current?.exportAsJSON) {
      const json = canvasMethodsRef.current.exportAsJSON();
      if (json) {
        downloadJSON(json, `${layoutName}.json`);
        toast({ title: 'JSON exported' });
      }
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              className="text-lg font-semibold bg-transparent border-none outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
            />
            <span className="text-sm text-muted-foreground">
              ({formatDimensions(roomDimensions)})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRoomSettings(true)}
          >
            Room Settings
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPNG}>
                <Image className="h-4 w-4 mr-2" />
                Export as PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportJSON}>
                <FileJson className="h-4 w-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <div className="flex-1 overflow-hidden">
        <LayoutCanvas
          roomDimensions={roomDimensions}
          onCanvasReady={handleCanvasReady}
        />
      </div>

      {/* Room Settings Modal */}
      <RoomSettingsModal
        open={showRoomSettings}
        onOpenChange={setShowRoomSettings}
        onSave={handleRoomSettingsSave}
        initialDimensions={roomDimensions}
        isNewLayout={isNewLayout}
      />
    </div>
  );
}
