import { useState, useEffect } from 'react';
import { MoreHorizontal, Pencil, Trash2, Check, X, Home, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Room {
  id: string;
  name: string;
  project_id: string;
  thumbnail_url: string | null;
  created_at: string;
  is_locked: boolean;
  locked_at: string | null;
  locked_render_url: string | null;
}

interface RoomListPanelProps {
  projectId: string;
  currentRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
  onRoomsChange?: (rooms: Room[]) => void;
}

export function RoomListPanel({ 
  projectId, 
  currentRoomId, 
  onRoomSelect,
  onRoomsChange 
}: RoomListPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchRooms();
    }
  }, [projectId]);

  const fetchRooms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch rooms:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load rooms.',
      });
    } else {
      const roomList = data || [];
      setRooms(roomList);
      onRoomsChange?.(roomList);
      
      // Auto-select first room if none selected
      if (roomList.length > 0 && !currentRoomId) {
        onRoomSelect(roomList[0].id);
      }
    }
    setLoading(false);
  };

  const startEditing = (room: Room) => {
    setEditingId(room.id);
    setEditingName(room.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveRoomName = async () => {
    if (!editingId || !editingName.trim()) {
      cancelEditing();
      return;
    }

    const { error } = await supabase
      .from('rooms')
      .update({ name: editingName.trim(), updated_at: new Date().toISOString() })
      .eq('id', editingId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to rename room.',
      });
    } else {
      const updatedRooms = rooms.map(r => 
        r.id === editingId ? { ...r, name: editingName.trim() } : r
      );
      setRooms(updatedRooms);
      onRoomsChange?.(updatedRooms);
      toast({ title: 'Room renamed' });
    }
    cancelEditing();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveRoomName();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const toggleRoomLock = async (room: Room) => {
    const newLockedState = !room.is_locked;
    
    const { error } = await supabase
      .from('rooms')
      .update({ 
        is_locked: newLockedState,
        locked_at: newLockedState ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', room.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to ${newLockedState ? 'lock' : 'unlock'} room.`,
      });
    } else {
      const updatedRooms = rooms.map(r => 
        r.id === room.id ? { ...r, is_locked: newLockedState, locked_at: newLockedState ? new Date().toISOString() : null } : r
      );
      setRooms(updatedRooms);
      onRoomsChange?.(updatedRooms);
      toast({ title: newLockedState ? 'Room locked' : 'Room unlocked' });
    }
  };

  const confirmDelete = (room: Room) => {
    setRoomToDelete(room);
    setDeleteDialogOpen(true);
  };

  const deleteRoom = async () => {
    if (!roomToDelete) return;

    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomToDelete.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete room.',
      });
    } else {
      const updatedRooms = rooms.filter(r => r.id !== roomToDelete.id);
      setRooms(updatedRooms);
      onRoomsChange?.(updatedRooms);
      toast({ title: 'Room deleted' });
      
      // If deleted room was selected, select another one
      if (currentRoomId === roomToDelete.id && updatedRooms.length > 0) {
        onRoomSelect(updatedRooms[0].id);
      }
    }
    setDeleteDialogOpen(false);
    setRoomToDelete(null);
  };

  if (loading) {
    return (
      <div className="space-y-1 p-1">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-8 skeleton rounded" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {rooms.map((room) => (
          <div
            key={room.id}
            className={cn(
              'group flex items-center gap-1 rounded-md transition-colors ml-4',
              currentRoomId === room.id
                ? 'bg-sidebar-accent'
                : 'hover:bg-sidebar-accent/50'
            )}
          >
            {editingId === room.id ? (
              <div className="flex-1 flex items-center gap-1 p-1">
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={saveRoomName}
                  autoFocus
                  className="h-7 text-xs"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={saveRoomName}
                >
                  <Check className="h-3 w-3 text-success" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={cancelEditing}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => onRoomSelect(room.id)}
                  className={cn(
                    'flex-1 text-left px-2 py-1.5 text-xs transition-colors flex items-center gap-2',
                    currentRoomId === room.id
                      ? 'text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/80'
                  )}
                >
                  {room.is_locked ? (
                    <Lock className="h-3 w-3 text-warning" />
                  ) : (
                    <Home className="h-3 w-3" />
                  )}
                  <span className="block truncate">{room.name}</span>
                  {room.is_locked && (
                    <span className="ml-auto text-[10px] text-warning/80 uppercase tracking-wider">Locked</span>
                  )}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'h-6 w-6 shrink-0 mr-1',
                        'opacity-0 group-hover:opacity-100 transition-opacity',
                        currentRoomId === room.id && 'opacity-100'
                      )}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem onClick={() => toggleRoomLock(room)}>
                      {room.is_locked ? (
                        <>
                          <Unlock className="h-3 w-3 mr-2" />
                          Unlock
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3 mr-2" />
                          Lock
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => startEditing(room)}>
                      <Pencil className="h-3 w-3 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => confirmDelete(room)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        ))}

      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete room?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{roomToDelete?.name}" and all its data. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteRoom}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
