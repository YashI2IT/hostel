import { useState, useMemo } from 'react';
import { Filter, BedDouble, User } from 'lucide-react';
import { useHostel } from '@/context/HostelContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { OnboardingModal } from '@/components/modals/OnboardingModal';
import { ResidentInfoModal } from '@/components/modals/ResidentInfoModal';
import { Bed, Resident } from '@/types/hostel';
import { cn } from '@/lib/utils';

export default function FloorMap() {
  const { properties } = useHostel();
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [selectedBed, setSelectedBed] = useState<{
    bed: Bed;
    roomNumber: string;
    floorNumber: number;
    propertyId: string;
    floorId: string;
    roomId: string;
  } | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showResidentModal, setShowResidentModal] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);

  const property = properties[0]; // Using first property for demo

  const floors = useMemo(() => {
    if (!property) return [];
    if (selectedFloor === 'all') return property.floors;
    return property.floors.filter(f => f.id === selectedFloor);
  }, [property, selectedFloor]);

  const handleBedClick = (
    bed: Bed, 
    roomNumber: string, 
    floorNumber: number,
    propertyId: string,
    floorId: string,
    roomId: string
  ) => {
    if (bed.isOccupied && bed.resident) {
      setSelectedResident(bed.resident);
      setShowResidentModal(true);
    } else {
      setSelectedBed({ bed, roomNumber, floorNumber, propertyId, floorId, roomId });
      setShowOnboardingModal(true);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboardingModal(false);
    setSelectedBed(null);
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
            <h1 className="font-heading text-3xl font-bold text-foreground">Floor Map</h1>
            <p className="text-muted-foreground mt-1">{property.name} - {property.address}</p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-success"></div>
              <span className="text-sm text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-destructive"></div>
              <span className="text-sm text-muted-foreground">Occupied</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="stat-card">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Filters:</span>
            </div>
            
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="form-input w-auto"
            >
              <option value="all">All Floors</option>
              {property.floors.map((floor) => (
                <option key={floor.id} value={floor.id}>
                  Floor {floor.number}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showAvailableOnly}
                onChange={(e) => setShowAvailableOnly(e.target.checked)}
                className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">Show Only Available</span>
            </label>
          </div>
        </div>

        {/* Floor Grid */}
        <div className="space-y-8">
          {floors.map((floor) => (
            <div key={floor.id} className="stat-card animate-slide-up">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-sm font-bold text-primary">
                  {floor.number}
                </span>
                Floor {floor.number}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {floor.rooms
                  .filter((room) => {
                    if (!showAvailableOnly) return true;
                    return room.beds.some((bed) => !bed.isOccupied);
                  })
                  .map((room) => (
                    <div
                      key={room.id}
                      className="bg-muted/30 rounded-xl p-4 border border-border"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-foreground">Room {room.number}</h4>
                        <span className="text-xs text-muted-foreground">
                          {room.beds.filter((b) => !b.isOccupied).length}/{room.beds.length} available
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {room.beds
                          .filter((bed) => !showAvailableOnly || !bed.isOccupied)
                          .map((bed) => (
                            <button
                              key={bed.id}
                              onClick={() => handleBedClick(
                                bed, 
                                room.number, 
                                floor.number,
                                property.id,
                                floor.id,
                                room.id
                              )}
                              className={cn(
                                'relative p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1',
                                bed.isOccupied ? 'bed-occupied' : 'bed-available'
                              )}
                            >
                              {bed.isOccupied ? (
                                <User className="w-5 h-5" />
                              ) : (
                                <BedDouble className="w-5 h-5" />
                              )}
                              <span className="text-xs font-medium">Bed {bed.number}</span>
                              {bed.resident && (
                                <span className="text-[10px] truncate max-w-full opacity-80">
                                  {bed.resident.name.split(' ')[0]}
                                </span>
                              )}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Onboarding Modal */}
      {showOnboardingModal && selectedBed && (
        <OnboardingModal
          isOpen={showOnboardingModal}
          onClose={() => setShowOnboardingModal(false)}
          onComplete={handleOnboardingComplete}
          prefilledData={{
            propertyId: selectedBed.propertyId,
            floorId: selectedBed.floorId,
            roomId: selectedBed.roomId,
            bedId: selectedBed.bed.id,
            roomNumber: selectedBed.roomNumber,
            floorNumber: selectedBed.floorNumber,
            bedNumber: selectedBed.bed.number
          }}
        />
      )}

      {/* Resident Info Modal */}
      {showResidentModal && selectedResident && (
        <ResidentInfoModal
          isOpen={showResidentModal}
          onClose={() => {
            setShowResidentModal(false);
            setSelectedResident(null);
          }}
          resident={selectedResident}
        />
      )}
    </MainLayout>
  );
}
