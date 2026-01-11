import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Image, StickyNote, Palette, 
  Plus, X, Upload, Trash2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface CanvasSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  references: string[];
  onAddReference: (url: string) => void;
  onRemoveReference: (index: number) => void;
  notes: string[];
  onAddNote: (note: string) => void;
  onRemoveNote: (index: number) => void;
  colorPalette: string[];
  onAddColor: (color: string) => void;
  onRemoveColor: (index: number) => void;
}

export function CanvasSidebar({
  isOpen,
  onToggle,
  references,
  onAddReference,
  onRemoveReference,
  notes,
  onAddNote,
  onRemoveNote,
  colorPalette,
  onAddColor,
  onRemoveColor,
}: CanvasSidebarProps) {
  const [newNote, setNewNote] = useState('');

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(newNote.trim());
      setNewNote('');
    }
  };

  return (
    <>
      {/* Toggle Button when closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={onToggle}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-card border border-border rounded-l-lg p-3 shadow-lg hover:bg-accent transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="h-full bg-card border-l border-border flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Design Tools</h2>
              <Button variant="ghost" size="icon" onClick={onToggle}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                {/* References Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Image className="h-3.5 w-3.5" />
                    References
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {references.map((ref, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-md overflow-hidden bg-muted">
                        <img src={ref} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => onRemoveReference(idx)}
                          className="absolute top-1 right-1 p-1 bg-background/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const url = prompt('Enter image URL:');
                        if (url) onAddReference(url);
                      }}
                      className="aspect-square rounded-md border-2 border-dashed border-border flex items-center justify-center hover:border-primary/50 hover:bg-muted/50 transition-colors"
                    >
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Design Notes Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <StickyNote className="h-3.5 w-3.5" />
                    Design Notes
                  </div>
                  <div className="space-y-2">
                    {notes.map((note, idx) => (
                      <div key={idx} className="group relative p-3 bg-amber-100/80 dark:bg-amber-900/30 rounded-md text-sm">
                        <p className="text-foreground pr-6">{note}</p>
                        <button
                          onClick={() => onRemoveNote(idx)}
                          className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                    <div className="space-y-2">
                      <Textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a design note..."
                        className="min-h-[60px] text-sm resize-none"
                      />
                      <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()} className="w-full">
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Note
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Color Palette Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Palette className="h-3.5 w-3.5" />
                    Color Palette
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {colorPalette.map((color, idx) => (
                      <button
                        key={idx}
                        onClick={() => onRemoveColor(idx)}
                        className="group relative w-10 h-10 rounded-full border-2 border-border hover:border-destructive transition-colors"
                        style={{ backgroundColor: color }}
                        title={`Click to remove ${color}`}
                      >
                        <X className="absolute inset-0 m-auto h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        const color = prompt('Enter color (hex or name):');
                        if (color) onAddColor(color);
                      }}
                      className="w-10 h-10 rounded-full border-2 border-dashed border-border flex items-center justify-center hover:border-primary/50 transition-colors"
                    >
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
