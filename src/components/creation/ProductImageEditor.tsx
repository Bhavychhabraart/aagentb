import { useState } from 'react';
import { Loader2, Wand2, X, RotateCcw, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ProductImageEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  productName: string;
  productCategory: string;
  onSave: (newImageUrl: string) => void;
}

const QUICK_EDITS = [
  { label: 'Change color', prompt: 'Change the color to' },
  { label: 'Different material', prompt: 'Change the material to' },
  { label: 'Add texture', prompt: 'Add a subtle texture to the surface' },
  { label: 'Darker tone', prompt: 'Make the overall color darker and richer' },
  { label: 'Lighter tone', prompt: 'Make the overall color lighter and brighter' },
  { label: 'Wood grain', prompt: 'Add natural wood grain texture' },
  { label: 'Metallic finish', prompt: 'Add a metallic sheen finish' },
  { label: 'Fabric texture', prompt: 'Change to soft fabric upholstery' },
];

export function ProductImageEditor({
  open,
  onOpenChange,
  imageUrl,
  productName,
  productCategory,
  onSave,
}: ProductImageEditorProps) {
  const { toast } = useToast();
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [editHistory, setEditHistory] = useState<string[]>([]);

  const currentImage = editedImage || imageUrl;

  const handleEdit = async () => {
    if (!editPrompt.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please describe what you want to change.' });
      return;
    }

    setIsEditing(true);
    try {
      const response = await supabase.functions.invoke('edit-furniture', {
        body: {
          imageUrl: currentImage,
          editPrompt: editPrompt.trim(),
          productName,
          productCategory,
        },
      });

      if (response.error) throw response.error;

      const { imageUrl: newImageUrl } = response.data;
      
      // Save to history
      setEditHistory(prev => [currentImage, ...prev].slice(0, 5));
      setEditedImage(newImageUrl);
      setEditPrompt('');
      
      toast({ title: 'Image updated!' });
    } catch (error) {
      console.error('Edit failed:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Edit failed', 
        description: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleQuickEdit = (prompt: string) => {
    setEditPrompt(prev => prev ? `${prev}. ${prompt}` : prompt);
  };

  const handleUndo = () => {
    if (editHistory.length === 0) {
      toast({ title: 'Nothing to undo', description: 'No previous versions available.' });
      return;
    }
    
    const [lastImage, ...rest] = editHistory;
    setEditedImage(lastImage === imageUrl ? null : lastImage);
    setEditHistory(rest);
    
    toast({ title: 'Undo successful', description: 'Reverted to previous version.' });
  };

  const handleAccept = () => {
    if (editedImage) {
      onSave(editedImage);
    }
    handleClose();
  };

  const handleClose = () => {
    setEditedImage(null);
    setEditHistory([]);
    setEditPrompt('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wand2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Edit Product Image</DialogTitle>
                <p className="text-sm text-muted-foreground">{productName}</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Left - Image Preview */}
          <div className="flex-1 flex flex-col p-6">
            <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-xl overflow-hidden relative">
              {isEditing ? (
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Applying changes...</p>
                </div>
              ) : (
                <img 
                  src={currentImage} 
                  alt={productName}
                  className="max-w-full max-h-full object-contain"
                />
              )}
              
              {editedImage && !isEditing && (
                <Badge className="absolute top-3 left-3 bg-primary">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Edited
                </Badge>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={editHistory.length === 0 || isEditing}
                  className="gap-1"
                >
                  <RotateCcw className="h-4 w-4" />
                  Undo
                </Button>
                {editHistory.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {editHistory.length} edit{editHistory.length > 1 ? 's' : ''} in history
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAccept}
                  disabled={!editedImage || isEditing}
                  className="gap-1"
                >
                  <Check className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>

          {/* Right - Edit Controls */}
          <div className="w-80 border-l border-border flex flex-col bg-card/50">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Edit prompt */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Describe your changes</label>
                  <Textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="e.g., Change the fabric to navy blue velvet, add gold metal legs..."
                    rows={4}
                    className="bg-muted/50 resize-none"
                  />
                </div>

                {/* Quick edits */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quick edits</label>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_EDITS.map((edit) => (
                      <Badge
                        key={edit.label}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
                        onClick={() => handleQuickEdit(edit.prompt)}
                      >
                        {edit.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Edit history preview */}
                {editHistory.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Previous versions</label>
                    <div className="grid grid-cols-3 gap-2">
                      {editHistory.map((historyImg, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            const oldHistory = editHistory.slice(0, idx);
                            setEditedImage(historyImg === imageUrl ? null : historyImg);
                            setEditHistory(oldHistory);
                          }}
                          className={cn(
                            "aspect-square rounded-lg overflow-hidden border-2 transition-all",
                            historyImg === currentImage
                              ? "border-primary"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <img
                            src={historyImg}
                            alt={`Version ${editHistory.length - idx}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Apply button */}
            <div className="p-4 border-t border-border">
              <Button
                onClick={handleEdit}
                disabled={isEditing || !editPrompt.trim()}
                className="w-full gap-2"
              >
                {isEditing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Editing...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Apply Edit
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
