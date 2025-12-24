import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Edit2, Check, X, GripVertical, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { KnowledgeItem } from '@/pages/AgentBBrain';

interface RuleEditorProps {
  rules: KnowledgeItem[];
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function RuleEditor({ rules, onDelete, onRefresh }: RuleEditorProps) {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const startEdit = (rule: KnowledgeItem) => {
    setEditingId(rule.id);
    setEditTitle(rule.title);
    setEditContent((rule.content as { text?: string })?.text || rule.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    
    const { error } = await supabase
      .from('agent_b_knowledge')
      .update({
        title: editTitle,
        content: { text: editContent },
        description: editContent.slice(0, 200),
      })
      .eq('id', editingId);

    if (error) {
      toast({ variant: 'destructive', title: 'Failed to update rule' });
    } else {
      toast({ title: 'Rule updated' });
      onRefresh();
      cancelEdit();
    }
  };

  const toggleActive = async (rule: KnowledgeItem) => {
    const { error } = await supabase
      .from('agent_b_knowledge')
      .update({ is_active: !rule.is_active })
      .eq('id', rule.id);

    if (!error) {
      onRefresh();
    }
  };

  if (rules.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No custom rules yet.</p>
        <p className="text-sm">Add rules like "Always use warm lighting" or "Prefer minimalist furniture".</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rules.map((rule, index) => (
        <motion.div
          key={rule.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="group relative p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all"
        >
          {editingId === rule.id ? (
            <div className="space-y-3">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Rule title..."
                className="font-medium"
              />
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Rule content..."
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={cancelEdit}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={saveEdit}>
                  <Check className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="text-muted-foreground cursor-grab">
                <GripVertical className="h-5 w-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{rule.title}</h4>
                  <div className={`h-2 w-2 rounded-full ${rule.is_active ? 'bg-green-500' : 'bg-muted'}`} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {(rule.content as { text?: string })?.text || rule.description || 'No content'}
                </p>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Switch
                  checked={rule.is_active}
                  onCheckedChange={() => toggleActive(rule)}
                  className="data-[state=checked]:bg-green-500"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => startEdit(rule)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete(rule.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}