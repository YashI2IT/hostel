import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  Property, 
  Resident, 
  Complaint, 
  Bed,
  Room,
  Floor
} from '@/types/hostel';
import api from '@/lib/api';
import { transformComplaint, transformResident, transformFrequencyToBackend, transformPaymentMethodToBackend, transformComplaintStatusToBackend } from '@/lib/data-transform';

interface HostelContextType {
  user: User | null;
  properties: Property[];
  residents: Resident[];
  complaints: Complaint[];
  isAuthenticated: boolean;
  login: (email: string, password: string, orgId: string) => Promise<boolean>;
  logout: () => void;
  addResident: (resident: Resident) => void;
  updateBedStatus: (bedId: string, isOccupied: boolean, resident?: Resident) => void;
  addRoom: (floorId: string, roomNumber: string, bedCount: number) => void;
  updateRoomBeds: (roomId: string, bedCount: number) => void;
  addComplaint: (complaint: Omit<Complaint, 'id' | 'createdAt'>) => void;
  updateComplaintStatus: (complaintId: string, status: Complaint['status']) => void;
  getOccupancyStats: () => { total: number; occupied: number; available: number };
}

const HostelContext = createContext<HostelContextType | undefined>(undefined);

export function HostelProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = user !== null;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [propertiesData, complaintsData] = await Promise.all([
        api.getProperties(),
        api.getComplaints(),
      ]);
      
      setProperties(propertiesData);
      setComplaints(complaintsData.map(transformComplaint));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch properties and complaints when user logs in
  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const login = async (email: string, password: string, orgId: string): Promise<boolean> => {
    try {
      // Use email as username for now (backend uses username)
      const response = await api.login(email, password);
      
      if (response.user) {
        setUser({
          id: response.user.id,
          email: email, // Use email from input
          name: response.user.name,
          role: response.user.role.toLowerCase() as 'admin' | 'manager' | 'staff',
          tenantId: orgId || response.user.id, // Use orgId or user id as tenantId
        });
        await fetchData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setProperties([]);
    setComplaints([]);
  };

  const getAllResidents = (): Resident[] => {
    const allResidents: Resident[] = [];
    properties.forEach(property => {
      property.floors.forEach(floor => {
        floor.rooms.forEach(room => {
          room.beds.forEach(bed => {
            if (bed.resident) {
              allResidents.push(bed.resident);
            }
          });
        });
      });
    });
    return allResidents;
  };

  // Fetch residents from API
  const fetchResidents = async (): Promise<Resident[]> => {
    try {
      const students = await api.getStudents({ isActive: true });
      return students.map(transformResident);
    } catch (error) {
      console.error('Failed to fetch residents:', error);
      return [];
    }
  };

  const addResident = async (resident: Resident) => {
    try {
      // This is typically done through onboarding API
      // For now, we'll just refresh the data
      await fetchData();
    } catch (error) {
      console.error('Failed to add resident:', error);
      throw error;
    }
  };

  const updateBedStatus = async (bedId: string, isOccupied: boolean, resident?: Resident) => {
    try {
      await api.updateBed(bedId, {
        status: isOccupied ? 'OCCUPIED' : 'AVAILABLE',
        currentStudentId: isOccupied && resident ? resident.id : undefined,
      });
      await fetchData();
    } catch (error) {
      console.error('Failed to update bed status:', error);
      throw error;
    }
  };

  const addRoom = async (floorId: string, roomNumber: string, bedCount: number) => {
    try {
      // Extract propertyId and floorNumber from floorId (format: "floor-{number}")
      const floorNumber = parseInt(floorId.replace('floor-', ''));
      const property = properties.find(p => 
        p.floors.some(f => f.id === floorId)
      );
      
      if (!property) {
        throw new Error('Property not found for floor');
      }

      // Create room
      const room = await api.createRoom({
        roomNumber,
        floorNumber,
        type: 'STANDARD', // Default type
        capacity: bedCount,
        propertyId: property.id,
      });

      // Create beds
      for (let i = 0; i < bedCount; i++) {
        await api.createBed({
          label: String.fromCharCode(65 + i), // A, B, C, etc.
          roomId: room.id,
          status: 'AVAILABLE',
        });
      }

      await fetchData();
    } catch (error) {
      console.error('Failed to add room:', error);
      throw error;
    }
  };

  const updateRoomBeds = async (roomId: string, bedCount: number) => {
    try {
      // Get current room data
      const room = await api.getRoom(roomId);
      const currentBedCount = room.beds?.length || 0;
      const occupiedBeds = room.beds?.filter((b: any) => b.status === 'OCCUPIED') || [];
      
      if (bedCount < occupiedBeds.length) {
        throw new Error('Cannot reduce beds below occupied count');
      }

      // Update room capacity
      await api.updateRoom(roomId, {
        capacity: bedCount,
      });

      // Add new beds if needed
      if (bedCount > currentBedCount) {
        for (let i = currentBedCount; i < bedCount; i++) {
          await api.createBed({
            label: String.fromCharCode(65 + i), // A, B, C, etc.
            roomId: roomId,
            status: 'AVAILABLE',
          });
        }
      }

      await fetchData();
    } catch (error) {
      console.error('Failed to update room beds:', error);
      throw error;
    }
  };

  const addComplaint = async (complaint: Omit<Complaint, 'id' | 'createdAt'>) => {
    try {
      const newComplaint = await api.createComplaint({
        category: complaint.category.toUpperCase(),
        description: complaint.description,
        roomId: complaint.roomId,
        studentId: undefined, // Could be added if we track the student making the complaint
      });
      setComplaints(prev => [transformComplaint(newComplaint), ...prev]);
    } catch (error) {
      console.error('Failed to add complaint:', error);
      throw error;
    }
  };

  const updateComplaintStatus = async (complaintId: string, status: Complaint['status']) => {
    try {
      await api.updateComplaint(complaintId, {
        status: transformComplaintStatusToBackend(status),
      });
      await fetchData(); // Refresh to get updated resolvedAt
    } catch (error) {
      console.error('Failed to update complaint status:', error);
      throw error;
    }
  };

  const getOccupancyStats = () => {
    let total = 0;
    let occupied = 0;
    
    properties.forEach(property => {
      property.floors.forEach(floor => {
        floor.rooms.forEach(room => {
          room.beds.forEach(bed => {
            total++;
            if (bed.isOccupied) occupied++;
          });
        });
      });
    });

    return { total, occupied, available: total - occupied };
  };

  return (
    <HostelContext.Provider value={{
      user,
      properties,
      residents: getAllResidents(),
      complaints,
      isAuthenticated,
      login,
      logout,
      addResident,
      updateBedStatus,
      addRoom,
      updateRoomBeds,
      addComplaint,
      updateComplaintStatus,
      getOccupancyStats
    }}>
      {children}
    </HostelContext.Provider>
  );
}

export function useHostel() {
  const context = useContext(HostelContext);
  if (context === undefined) {
    throw new Error('useHostel must be used within a HostelProvider');
  }
  return context;
}
