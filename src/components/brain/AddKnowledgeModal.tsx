import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { KnowledgeType } from '@/pages/AgentBBrain';

interface AddKnowledgeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: KnowledgeType;
  onSuccess: () => void;
}

export function AddKnowledgeModal({ open, onOpenChange, type, onSuccess }: AddKnowledgeModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  
  // For style collections
  const [colors, setColors] = useState<string[]>(['#3b82f6', '#8b5cf6', '#ec4899']);
  const [newColor, setNewColor] = useState('#000000');

  const handleSave = async () => {
    if (!user || !title.trim()) return;
    
    setSaving(true);
    try {
      if (type === 'style') {
        // Save as style collection
        const { error } = await supabase.from('agent_b_style_collections').insert({
          user_id: user.id,
          name: title,
          description,
          colors,
          materials: [],
          furniture_styles: tags.split(',').map(t => t.trim()).filter(Boolean),
        });
        if (error) throw error;
      } else {
        // Save as knowledge
        const { error } = await supabase.from('agent_b_knowledge').insert({
          user_id: user.id,
          knowledge_type: type,
          title,
          description,
          content: content ? { text: content } : null,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        });
        if (error) throw error;
      }
      
      toast({ title: 'Knowledge added successfully' });
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving knowledge:', error);
      toast({ variant: 'destructive', title: 'Failed to save knowledge' });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTags('');
    setContent('');
    setColors(['#3b82f6', '#8b5cf6', '#ec4899']);
  };

  const addColor = () => {
    if (!colors.includes(newColor)) {
      setColors([...colors, newColor]);
    }
  };

  const removeColor = (color: string) => {
    setColors(colors.filter(c => c !== color));
  };

  const getTitle = () => {
    switch (type) {
      case 'layout': return 'Add Layout Template';
      case 'style': return 'Add Style Collection';
      case 'rule': return 'Add Custom Rule';
      case 'design': return 'Add Design Reference';
      default: return 'Add Knowledge';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter a descriptive title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe this knowledge..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {type === 'style' && (
            <div className="space-y-2">
              <Label>Color Palette</Label>
              <div className="flex flex-wrap gap-2">
                {colors.map(color => (
                  <div
                    key={color}
                    className="relative group"
                  >
                    <div
                      className="h-10 w-10 rounded-lg border border-border cursor-pointer"
                      style={{ backgroundColor: color }}
                    />
                    <button
                      onClick={() => removeColor(color)}
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="h-10 w-10 p-1 cursor-pointer"
                  />
                  <Button variant="outline" size="sm" onClick={addColor}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {type === 'rule' && (
            <div className="space-y-2">
              <Label htmlFor="content">Rule Content</Label>
              <Textarea
                id="content"
                placeholder="e.g., 'Always use warm lighting in living rooms' or 'Prefer minimalist furniture styles'"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="modern, living room, cozy"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Knowledge
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}