import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Brain, Plus, Search, LayoutGrid, Palette, 
  FileText, Image, Settings, Trash2, Star, StarOff,
  Filter, SlidersHorizontal, BookOpen, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BrainSidebar } from '@/components/brain/BrainSidebar';
import { KnowledgeGrid } from '@/components/brain/KnowledgeGrid';
import { AddKnowledgeModal } from '@/components/brain/AddKnowledgeModal';
import { LayoutTemplateCard } from '@/components/brain/LayoutTemplateCard';
import { StyleCollectionCard } from '@/components/brain/StyleCollectionCard';
import { RuleEditor } from '@/components/brain/RuleEditor';

export type KnowledgeType = 'layout' | 'design' | 'style' | 'rule' | 'preference';

export interface KnowledgeItem {
  id: string;
  user_id: string;
  knowledge_type: KnowledgeType;
  title: string;
  description: string | null;
  content: Record<string, unknown> | null;
  file_url: string | null;
  thumbnail_url: string | null;
  tags: string[] | null;
  weight: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LayoutTemplate {
  id: string;
  user_id: string;
  name: string;
  room_type: string | null;
  room_dimensions: Record<string, unknown> | null;
  canvas_data: Record<string, unknown>;
  thumbnail_url: string | null;
  is_favorite: boolean;
  use_count: number;
  created_at: string;
}

export interface StyleCollection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  colors: string[] | null;
  materials: string[] | null;
  furniture_styles: string[] | null;
  image_urls: string[] | null;
  is_active: boolean;
  created_at: string;
}

export default function AgentBBrain() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [activeSection, setActiveSection] = useState<'overview' | KnowledgeType | 'all'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState<KnowledgeType>('layout');
  
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [layoutTemplates, setLayoutTemplates] = useState<LayoutTemplate[]>([]);
  const [styleCollections, setStyleCollections] = useState<StyleCollection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const [knowledgeRes, layoutsRes, stylesRes] = await Promise.all([
        supabase.from('agent_b_knowledge').select('*').order('created_at', { ascending: false }),
        supabase.from('agent_b_layout_templates').select('*').order('created_at', { ascending: false }),
        supabase.from('agent_b_style_collections').select('*').order('created_at', { ascending: false }),
      ]);

      if (knowledgeRes.data) setKnowledge(knowledgeRes.data as unknown as KnowledgeItem[]);
      if (layoutsRes.data) setLayoutTemplates(layoutsRes.data as unknown as LayoutTemplate[]);
      if (stylesRes.data) setStyleCollections(stylesRes.data as unknown as StyleCollection[]);
    } catch (error) {
      console.error('Error fetching brain data:', error);
      toast({ variant: 'destructive', title: 'Error loading brain data' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddKnowledge = (type: KnowledgeType) => {
    setAddModalType(type);
    setShowAddModal(true);
  };

  const handleDeleteKnowledge = async (id: string) => {
    const { error } = await supabase.from('agent_b_knowledge').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting item' });
    } else {
      setKnowledge(prev => prev.filter(k => k.id !== id));
      toast({ title: 'Knowledge removed' });
    }
  };

  const handleToggleLayoutFavorite = async (id: string, isFavorite: boolean) => {
    const { error } = await supabase
      .from('agent_b_layout_templates')
      .update({ is_favorite: !isFavorite })
      .eq('id', id);
    
    if (!error) {
      setLayoutTemplates(prev => 
        prev.map(t => t.id === id ? { ...t, is_favorite: !isFavorite } : t)
      );
    }
  };

  const handleDeleteLayout = async (id: string) => {
    const { error } = await supabase.from('agent_b_layout_templates').delete().eq('id', id);
    if (!error) {
      setLayoutTemplates(prev => prev.filter(t => t.id !== id));
      toast({ title: 'Layout template removed' });
    }
  };

  const handleDeleteStyle = async (id: string) => {
    const { error } = await supabase.from('agent_b_style_collections').delete().eq('id', id);
    if (!error) {
      setStyleCollections(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Style collection removed' });
    }
  };

  const stats = {
    layouts: layoutTemplates.length,
    styles: styleCollections.length,
    rules: knowledge.filter(k => k.knowledge_type === 'rule').length,
    designs: knowledge.filter(k => k.knowledge_type === 'design').length,
    total: knowledge.length + layoutTemplates.length + styleCollections.length,
  };

  const filteredKnowledge = knowledge.filter(k => {
    const matchesSearch = k.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          k.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSection = activeSection === 'all' || activeSection === 'overview' || 
                           k.knowledge_type === activeSection;
    return matchesSearch && matchesSection;
  });

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 blur-lg opacity-50" />
              <div className="relative p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                <Brain className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-semibold">Agent B Brain</h1>
              <p className="text-xs text-muted-foreground">Knowledge Center</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Memory</span>
            <Switch checked={memoryEnabled} onCheckedChange={setMemoryEnabled} />
          </div>
          
          <Button variant="outline" size="sm" onClick={() => {/* Clear all confirmation */}}>
            Clear All
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <BrainSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          stats={stats}
          onAddKnowledge={handleAddKnowledge}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Search & Filters */}
          <div className="p-4 border-b border-border bg-card/50">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search knowledge..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Content Area */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeSection === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { label: 'Layouts', value: stats.layouts, icon: LayoutGrid, color: 'from-blue-500 to-cyan-500' },
                        { label: 'Styles', value: stats.styles, icon: Palette, color: 'from-pink-500 to-rose-500' },
                        { label: 'Rules', value: stats.rules, icon: FileText, color: 'from-amber-500 to-orange-500' },
                        { label: 'Designs', value: stats.designs, icon: Image, color: 'from-green-500 to-emerald-500' },
                      ].map((stat, i) => (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="relative p-4 rounded-xl border border-border bg-card overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() => setActiveSection(stat.label.toLowerCase().slice(0, -1) as KnowledgeType)}
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                          <stat.icon className="h-5 w-5 text-muted-foreground mb-2" />
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Recent Items */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-amber-500" />
                        Recent Knowledge
                      </h3>
                      
                      {loading ? (
                        <div className="grid grid-cols-3 gap-4">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
                          ))}
                        </div>
                      ) : knowledge.length === 0 && layoutTemplates.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No knowledge yet. Add layouts, styles, or rules to train Agent B.</p>
                          <Button className="mt-4" onClick={() => handleAddKnowledge('layout')}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Knowledge
                          </Button>
                        </div>
                      ) : (
                        <KnowledgeGrid
                          items={filteredKnowledge.slice(0, 6)}
                          onDelete={handleDeleteKnowledge}
                        />
                      )}
                    </div>
                  </motion.div>
                )}

                {activeSection === 'layout' && (
                  <motion.div
                    key="layouts"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Layout Templates</h3>
                      <Button size="sm" onClick={() => handleAddKnowledge('layout')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Layout
                      </Button>
                    </div>
                    
                    {layoutTemplates.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
                        <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No layout templates saved yet.</p>
                        <p className="text-sm">Save layouts from the Layout Creator to use as references.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-4">
                        {layoutTemplates.map(template => (
                          <LayoutTemplateCard
                            key={template.id}
                            template={template}
                            onToggleFavorite={() => handleToggleLayoutFavorite(template.id, template.is_favorite)}
                            onDelete={() => handleDeleteLayout(template.id)}
                            onUse={() => navigate(`/layout-creator?template=${template.id}`)}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeSection === 'style' && (
                  <motion.div
                    key="styles"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Style Collections</h3>
                      <Button size="sm" onClick={() => handleAddKnowledge('style')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Style
                      </Button>
                    </div>
                    
                    {styleCollections.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
                        <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No style collections yet.</p>
                        <p className="text-sm">Create color palettes and material preferences.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-4">
                        {styleCollections.map(style => (
                          <StyleCollectionCard
                            key={style.id}
                            style={style}
                            onDelete={() => handleDeleteStyle(style.id)}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeSection === 'rule' && (
                  <motion.div
                    key="rules"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Custom Rules</h3>
                      <Button size="sm" onClick={() => handleAddKnowledge('rule')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Rule
                      </Button>
                    </div>
                    
                    <RuleEditor
                      rules={knowledge.filter(k => k.knowledge_type === 'rule')}
                      onDelete={handleDeleteKnowledge}
                      onRefresh={fetchAllData}
                    />
                  </motion.div>
                )}

                {activeSection === 'design' && (
                  <motion.div
                    key="designs"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Design References</h3>
                      <Button size="sm" onClick={() => handleAddKnowledge('design')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Design
                      </Button>
                    </div>
                    
                    <KnowledgeGrid
                      items={knowledge.filter(k => k.knowledge_type === 'design')}
                      onDelete={handleDeleteKnowledge}
                    />
                  </motion.div>
                )}

                {activeSection === 'all' && (
                  <motion.div
                    key="all"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold">All Knowledge ({stats.total})</h3>
                    <KnowledgeGrid
                      items={filteredKnowledge}
                      onDelete={handleDeleteKnowledge}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </main>
      </div>

      {/* Add Knowledge Modal */}
      <AddKnowledgeModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        type={addModalType}
        onSuccess={fetchAllData}
      />
    </div>
  );
}