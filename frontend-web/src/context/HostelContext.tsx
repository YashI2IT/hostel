import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Property, Resident, Complaint } from '@/types/hostel';
import api from '@/lib/api';
import { transformComplaint, transformComplaintStatusToBackend } from '@/lib/data-transform';

interface HostelContextType {
  user: User | null;
  properties: Property[];
  residents: Resident[];
  complaints: Complaint[];
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, orgId: string) => Promise<boolean>;
  logout: () => void;
  refreshData: () => Promise<void>;
  addResident: (resident: Resident) => Promise<void>;
  updateBedStatus: (bedId: string, isOccupied: boolean, resident?: Resident) => Promise<void>;
  addRoom: (floorId: string, roomNumber: string, bedCount: number) => Promise<void>;
  updateRoomBeds: (roomId: string, bedCount: number) => Promise<void>;
  addComplaint: (complaint: Omit<Complaint, 'id' | 'createdAt'>) => Promise<void>;
  updateComplaintStatus: (complaintId: string, status: Complaint['status']) => Promise<void>;
  getOccupancyStats: () => { total: number; occupied: number; available: number };
}

const HostelContext = createContext<HostelContextType | undefined>(undefined);

export function HostelProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);

  const isAuthenticated = user !== null;

  // Fetch all data from database
  const refreshData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data from database...');
      
      const [propertiesData, complaintsData] = await Promise.all([
        api.getProperties(),
        api.getComplaints(),
      ]);
      
      console.log('Properties from DB:', propertiesData);
      console.log('Complaints from DB:', complaintsData);
      
      if (!propertiesData || propertiesData.length === 0) {
        console.log('No data from API, check backend connection');
        return;
      }
      
      // Transform properties data
      const transformedProperties = propertiesData.map((property: any) => ({
        ...property,
        floors: property.floors?.map((floor: any) => ({
          ...floor,
          rooms: floor.rooms?.map((room: any) => ({
            ...room,
            type: room.type || 'STANDARD',
            beds: room.beds?.map((bed: any, bedIndex: number) => {
              // Convert bed label (A, B, C) to number (1, 2, 3)
              let bedNumber = bedIndex + 1;
              if (typeof bed.number === 'string' && bed.number.length === 1) {
                bedNumber = bed.number.charCodeAt(0) - 64; // A=1, B=2, C=3
              } else if (typeof bed.number === 'number') {
                bedNumber = bed.number;
              }
              
              // Calculate monthly rent from total amount and frequency
              let monthlyRent = 0;
              if (bed.resident?.totalAmount) {
                const freq = bed.resident.frequency || 'MONTHLY';
                if (freq === 'YEARLY') {
                  monthlyRent = bed.resident.totalAmount / 12;
                } else if (freq === 'MONTHLY') {
                  // For monthly, totalAmount is yearly total, so divide by 12
                  // Or if totalAmount > 50000, assume it's yearly total
                  if (bed.resident.totalAmount > 50000) {
                    monthlyRent = bed.resident.totalAmount / 12;
                  } else {
                    monthlyRent = bed.resident.totalAmount;
                  }
                } else {
                  monthlyRent = bed.resident.totalAmount;
                }
              }
              
              return {
                id: bed.id,
                number: bedNumber,
                roomId: bed.roomId,
                isOccupied: bed.isOccupied,
                resident: bed.resident ? {
                  id: bed.resident.id,
                  name: bed.resident.name,
                  age: bed.resident.age || 0,
                  contactNumber: bed.resident.phoneNumber || '',
                  email: bed.resident.email || '',
                  emergencyContact: bed.resident.emergencyContact || '',
                  emergencyContactName: '',
                  bedId: bed.id,
                  roomId: room.id,
                  floorId: floor.id,
                  propertyId: property.id,
                  startDate: bed.resident.startDate || '',
                  endDate: bed.resident.endDate || '',
                  billingFrequency: (bed.resident.frequency === 'YEARLY' ? 'yearly' : 
                                     bed.resident.frequency === 'EXCEPTION' ? 'custom' : 'monthly') as 'monthly' | 'yearly' | 'custom',
                  monthlyRent: monthlyRent,
                  paymentStatus: (bed.resident.paymentStatus || 'pending') as 'paid' | 'pending' | 'overdue',
                  lastPaymentDate: bed.resident.lastPaymentDate,
                } : undefined,
              };
            }) || [],
          })) || [],
        })) || [],
      }));
      
      console.log('Transformed properties:', transformedProperties);
      setProperties(transformedProperties);
      setComplaints(complaintsData.map(transformComplaint));
    } catch (error) {
      console.error('Failed to fetch data from database:', error);
      alert('Failed to connect to backend. Make sure backend server is running on http://localhost:4000');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when user logs in
  useEffect(() => {
    if (user) {
      console.log('User logged in, fetching data...');
      refreshData();
    }
  }, [user]);

  // Debug: Log state changes
  useEffect(() => {
    console.log('Properties state updated:', properties.length, 'properties');
    if (properties.length > 0) {
      const totalBeds = properties.reduce((acc, p) => 
        acc + p.floors.reduce((fAcc, f) => 
          fAcc + f.rooms.reduce((rAcc, r) => rAcc + r.beds.length, 0), 0), 0);
      console.log('Total beds in state:', totalBeds);
    }
  }, [properties]);

  const login = async (email: string, password: string, orgId: string): Promise<boolean> => {
    try {
      const response = await api.login(email, password);
      
      if (response.user) {
        setUser({
          id: response.user.id,
          email: email,
          name: response.user.name,
          role: response.user.role.toLowerCase() as 'admin' | 'manager' | 'staff',
          tenantId: orgId || response.user.id,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      // Dev fallback
      if (email && password && orgId) {
        setUser({
          id: 'dev-user-1',
          email: email,
          name: 'Dev User',
          role: 'admin',
          tenantId: orgId,
        });
        return true;
      }
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

  const addResident = async (resident: Resident) => {
    try {
      // Save to database via onboarding API
      await api.createOnboarding({
        name: resident.name,
        age: resident.age,
        phoneNumber: resident.contactNumber,
        email: resident.email || undefined,
        emergencyContact: resident.emergencyContact,
        address: '',
        bedId: resident.bedId,
        frequency: resident.billingFrequency === 'monthly' ? 'MONTHLY' : resident.billingFrequency === 'yearly' ? 'YEARLY' : 'EXCEPTION',
        startDate: resident.startDate,
        endDate: resident.endDate,
        totalAmount: resident.monthlyRent * 12,
        paymentMethod: 'CASH_OFFLINE',
      });
      
      // Refresh data from database
      await refreshData();
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
      
      await refreshData();
    } catch (error) {
      console.error('Failed to update bed status:', error);
      throw error;
    }
  };

  const addRoom = async (floorId: string, roomNumber: string, bedCount: number) => {
    try {
      const property = properties.find(p => p.floors.some(f => f.id === floorId));
      if (!property) throw new Error('Property not found');

      const floorNumber = parseInt(floorId.replace('floor-', ''));
      
      // Create room in database
      const room = await api.createRoom({
        roomNumber,
        floorNumber,
        type: 'STANDARD',
        capacity: bedCount,
        propertyId: property.id,
      });

      // Create beds in database
      for (let i = 0; i < bedCount; i++) {
        await api.createBed({
          label: String.fromCharCode(65 + i),
          roomId: room.id,
          status: 'AVAILABLE',
        });
      }
      
      await refreshData();
    } catch (error) {
      console.error('Failed to add room:', error);
      throw error;
    }
  };

  const updateRoomBeds = async (roomId: string, bedCount: number) => {
    try {
      await api.updateRoom(roomId, { capacity: bedCount });
      await refreshData();
    } catch (error) {
      console.error('Failed to update room beds:', error);
      throw error;
    }
  };

  const addComplaint = async (complaint: Omit<Complaint, 'id' | 'createdAt'>) => {
    try {
      await api.createComplaint({
        category: complaint.category.toUpperCase(),
        description: complaint.description,
        roomId: complaint.roomId,
        studentId: undefined,
      });
      
      await refreshData();
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
      
      await refreshData();
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
      loading,
      login,
      logout,
      refreshData,
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