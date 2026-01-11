import type { DesignerNote } from "@/pages/MoodBoardWorkspace";

interface DesignerNotesProps {
  notes: DesignerNote[];
}

export const DesignerNotes = ({ notes }: DesignerNotesProps) => {
  return (
    <div className="flex-1 p-3 overflow-auto">
      <div className="space-y-3">
        {notes.map((note) => (
          <div 
            key={note.id}
            className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
          >
            <p className="text-sm text-white/80 italic leading-relaxed mb-3">
              "{note.content}"
            </p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white">
                {note.initials}
              </div>
              <span className="text-xs text-white/50">{note.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
