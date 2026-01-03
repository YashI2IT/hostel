import { useState } from 'react';
import { Plus, Edit2, BedDouble, Save, X } from 'lucide-react';
import { useHostel } from '@/context/HostelContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function RoomManagement() {
  const { properties, addRoom, updateRoomBeds } = useHostel();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomBeds, setNewRoomBeds] = useState(2);
  const [editingRoom, setEditingRoom] = useState<{ id: string; bedCount: number } | null>(null);

  const property = properties[0];

  const handleAddRoom = () => {
    if (!selectedFloorId || !newRoomNumber) {
      toast({
        title: 'Missing Information',
        description: 'Please select a floor and enter a room number.',
        variant: 'destructive'
      });
      return;
    }

    addRoom(selectedFloorId, newRoomNumber, newRoomBeds);
    
    toast({
      title: 'Room Added',
      description: `Room ${newRoomNumber} with ${newRoomBeds} beds has been added.`,
    });

    setShowAddRoomModal(false);
    setNewRoomNumber('');
    setNewRoomBeds(2);
    setSelectedFloorId(null);
  };

  const handleUpdateBeds = (roomId: string, newBedCount: number) => {
    updateRoomBeds(roomId, newBedCount);
    
    toast({
      title: 'Room Updated',
      description: `Room bed count updated to ${newBedCount}.`,
    });

    setEditingRoom(null);
  };

  if (!property) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">No properties found</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Room Management</h1>
            <p className="text-muted-foreground mt-1">Add rooms and modify bed configurations</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={isEditMode ? 'default' : 'outline'}
              onClick={() => setIsEditMode(!isEditMode)}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              {isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
            </Button>
            {isEditMode && (
              <Button onClick={() => setShowAddRoomModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Room
              </Button>
            )}
          </div>
        </div>

        {isEditMode && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm text-primary">
              <strong>Edit Mode Active:</strong> Click on any room to modify its bed count, or use the "Add Room" button to create new rooms.
            </p>
          </div>
        )}

        {/* Floors & Rooms */}
        <div className="space-y-6">
          {property.floors.map((floor) => (
            <div key={floor.id} className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
                  <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-sm font-bold text-primary">
                    {floor.number}
                  </span>
                  Floor {floor.number}
                </h3>
                {isEditMode && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedFloorId(floor.id);
                      setShowAddRoomModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Room to Floor
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {floor.rooms.map((room) => {
                  const occupiedBeds = room.beds.filter(b => b.isOccupied).length;
                  const isEditing = editingRoom?.id === room.id;

                  return (
                    <div
                      key={room.id}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all',
                        isEditMode 
                          ? 'border-primary/30 bg-primary/5 cursor-pointer hover:border-primary' 
                          : 'border-border bg-muted/30'
                      )}
                      onClick={() => {
                        if (isEditMode && !isEditing) {
                          setEditingRoom({ id: room.id, bedCount: room.beds.length });
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-foreground">Room {room.number}</h4>
                        <span className="text-xs text-muted-foreground">
                          {occupiedBeds}/{room.beds.length} occupied
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Number of Beds</label>
                            <input
                              type="number"
                              value={editingRoom.bedCount}
                              onChange={(e) => setEditingRoom({ ...editingRoom, bedCount: parseInt(e.target.value) || 1 })}
                              min={occupiedBeds || 1}
                              className="form-input mt-1"
                              onClick={(e) => e.stopPropagation()}
                            />
                            {occupiedBeds > 0 && (
                              <p className="text-xs text-warning mt-1">
                                Min: {occupiedBeds} (occupied beds)
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateBeds(room.id, editingRoom.bedCount);
                              }}
                              className="flex-1"
                            >
                              <Save className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingRoom(null);
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                          {room.beds.map((bed) => (
                            <div
                              key={bed.id}
                              className={cn(
                                'aspect-square rounded-lg flex items-center justify-center',
                                bed.isOccupied 
                                  ? 'bg-destructive/20 text-destructive' 
                                  : 'bg-success/20 text-success'
                              )}
                            >
                              <BedDouble className="w-4 h-4" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Room Modal */}
      {showAddRoomModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowAddRoomModal(false)}>
          <div 
            className="modal-content w-full max-w-md animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border">
              <h2 className="font-heading text-xl font-semibold text-foreground">Add New Room</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="form-label">Select Floor</label>
                <select
                  value={selectedFloorId || ''}
                  onChange={(e) => setSelectedFloorId(e.target.value)}
                  className="form-input"
                >
                  <option value="">Choose a floor</option>
                  {property.floors.map((floor) => (
                    <option key={floor.id} value={floor.id}>
                      Floor {floor.number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Room Number</label>
                <input
                  type="text"
                  value={newRoomNumber}
                  onChange={(e) => setNewRoomNumber(e.target.value)}
                  placeholder="e.g., 104"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Number of Beds</label>
                <input
                  type="number"
                  value={newRoomBeds}
                  onChange={(e) => setNewRoomBeds(parseInt(e.target.value) || 1)}
                  min={1}
                  max={10}
                  className="form-input"
                />
              </div>
            </div>

            <div className="p-6 border-t border-border flex gap-3">
              <Button variant="outline" onClick={() => setShowAddRoomModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAddRoom} className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Add Room
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}