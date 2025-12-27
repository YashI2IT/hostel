import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  User, 
  Property, 
  Resident, 
  Complaint, 
  Bed,
  Room,
  Floor
} from '@/types/hostel';

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

// Mock data for demonstration
const mockProperties: Property[] = [
  {
    id: 'prop-1',
    name: 'Sunrise Hostel',
    address: '123 University Road, City Center',
    tenantId: 'tenant-1',
    floors: [
      {
        id: 'floor-1',
        number: 1,
        propertyId: 'prop-1',
        rooms: [
          {
            id: 'room-1-1',
            number: '101',
            floorId: 'floor-1',
            beds: [
              { id: 'bed-1-1-1', number: 1, roomId: 'room-1-1', isOccupied: true, resident: {
                id: 'res-1',
                name: 'Rahul Sharma',
                age: 22,
                contactNumber: '+91 98765 43210',
                email: 'rahul@email.com',
                emergencyContact: '+91 98765 00000',
                emergencyContactName: 'Mr. Sharma (Father)',
                bedId: 'bed-1-1-1',
                roomId: 'room-1-1',
                floorId: 'floor-1',
                propertyId: 'prop-1',
                startDate: '2024-01-15',
                endDate: '2024-12-31',
                billingFrequency: 'monthly',
                monthlyRent: 8000,
                paymentStatus: 'paid',
                lastPaymentDate: '2024-12-01'
              }},
              { id: 'bed-1-1-2', number: 2, roomId: 'room-1-1', isOccupied: false },
              { id: 'bed-1-1-3', number: 3, roomId: 'room-1-1', isOccupied: true, resident: {
                id: 'res-2',
                name: 'Priya Patel',
                age: 21,
                contactNumber: '+91 87654 32109',
                email: 'priya@email.com',
                emergencyContact: '+91 87654 00000',
                emergencyContactName: 'Mrs. Patel (Mother)',
                bedId: 'bed-1-1-3',
                roomId: 'room-1-1',
                floorId: 'floor-1',
                propertyId: 'prop-1',
                startDate: '2024-02-01',
                endDate: '2025-01-31',
                billingFrequency: 'yearly',
                monthlyRent: 7500,
                paymentStatus: 'pending',
                lastPaymentDate: '2024-11-01'
              }},
            ]
          },
          {
            id: 'room-1-2',
            number: '102',
            floorId: 'floor-1',
            beds: [
              { id: 'bed-1-2-1', number: 1, roomId: 'room-1-2', isOccupied: false },
              { id: 'bed-1-2-2', number: 2, roomId: 'room-1-2', isOccupied: true, resident: {
                id: 'res-3',
                name: 'Amit Kumar',
                age: 23,
                contactNumber: '+91 76543 21098',
                email: 'amit@email.com',
                emergencyContact: '+91 76543 00000',
                emergencyContactName: 'Mr. Kumar (Father)',
                bedId: 'bed-1-2-2',
                roomId: 'room-1-2',
                floorId: 'floor-1',
                propertyId: 'prop-1',
                startDate: '2024-03-01',
                endDate: '2024-08-31',
                billingFrequency: 'monthly',
                monthlyRent: 8000,
                paymentStatus: 'overdue',
                lastPaymentDate: '2024-10-01'
              }},
            ]
          },
          {
            id: 'room-1-3',
            number: '103',
            floorId: 'floor-1',
            beds: [
              { id: 'bed-1-3-1', number: 1, roomId: 'room-1-3', isOccupied: false },
              { id: 'bed-1-3-2', number: 2, roomId: 'room-1-3', isOccupied: false },
              { id: 'bed-1-3-3', number: 3, roomId: 'room-1-3', isOccupied: false },
              { id: 'bed-1-3-4', number: 4, roomId: 'room-1-3', isOccupied: false },
            ]
          },
        ]
      },
      {
        id: 'floor-2',
        number: 2,
        propertyId: 'prop-1',
        rooms: [
          {
            id: 'room-2-1',
            number: '201',
            floorId: 'floor-2',
            beds: [
              { id: 'bed-2-1-1', number: 1, roomId: 'room-2-1', isOccupied: true, resident: {
                id: 'res-4',
                name: 'Sneha Reddy',
                age: 20,
                contactNumber: '+91 65432 10987',
                email: 'sneha@email.com',
                emergencyContact: '+91 65432 00000',
                emergencyContactName: 'Dr. Reddy (Father)',
                bedId: 'bed-2-1-1',
                roomId: 'room-2-1',
                floorId: 'floor-2',
                propertyId: 'prop-1',
                startDate: '2024-06-01',
                endDate: '2025-05-31',
                billingFrequency: 'yearly',
                monthlyRent: 8500,
                paymentStatus: 'paid',
                lastPaymentDate: '2024-06-01'
              }},
              { id: 'bed-2-1-2', number: 2, roomId: 'room-2-1', isOccupied: false },
            ]
          },
          {
            id: 'room-2-2',
            number: '202',
            floorId: 'floor-2',
            beds: [
              { id: 'bed-2-2-1', number: 1, roomId: 'room-2-2', isOccupied: false },
              { id: 'bed-2-2-2', number: 2, roomId: 'room-2-2', isOccupied: false },
              { id: 'bed-2-2-3', number: 3, roomId: 'room-2-2', isOccupied: false },
            ]
          },
        ]
      },
      {
        id: 'floor-3',
        number: 3,
        propertyId: 'prop-1',
        rooms: [
          {
            id: 'room-3-1',
            number: '301',
            floorId: 'floor-3',
            beds: [
              { id: 'bed-3-1-1', number: 1, roomId: 'room-3-1', isOccupied: true, resident: {
                id: 'res-5',
                name: 'Vikram Singh',
                age: 24,
                contactNumber: '+91 54321 09876',
                email: 'vikram@email.com',
                emergencyContact: '+91 54321 00000',
                emergencyContactName: 'Mrs. Singh (Mother)',
                bedId: 'bed-3-1-1',
                roomId: 'room-3-1',
                floorId: 'floor-3',
                propertyId: 'prop-1',
                startDate: '2024-04-01',
                endDate: '2024-09-30',
                billingFrequency: 'monthly',
                monthlyRent: 9000,
                paymentStatus: 'paid',
                lastPaymentDate: '2024-12-05'
              }},
              { id: 'bed-3-1-2', number: 2, roomId: 'room-3-1', isOccupied: false },
            ]
          },
        ]
      },
    ]
  }
];

const mockComplaints: Complaint[] = [
  {
    id: 'complaint-1',
    roomId: 'room-1-1',
    roomNumber: '101',
    category: 'plumbing',
    description: 'Water leakage in the bathroom sink. Needs immediate attention.',
    status: 'open',
    createdAt: '2024-12-18T10:30:00Z'
  },
  {
    id: 'complaint-2',
    roomId: 'room-2-1',
    roomNumber: '201',
    category: 'electrical',
    description: 'One of the ceiling fans is making noise and needs repair.',
    status: 'in-progress',
    createdAt: '2024-12-15T14:20:00Z'
  }
];

export function HostelProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints);

  const isAuthenticated = user !== null;

  const login = async (email: string, password: string, orgId: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful login
    if (email && password && orgId) {
      setUser({
        id: 'user-1',
        email,
        name: 'Admin User',
        role: 'admin',
        tenantId: 'tenant-1'
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
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

  const addResident = (resident: Resident) => {
    setProperties(prev => {
      return prev.map(property => {
        if (property.id !== resident.propertyId) return property;
        return {
          ...property,
          floors: property.floors.map(floor => {
            if (floor.id !== resident.floorId) return floor;
            return {
              ...floor,
              rooms: floor.rooms.map(room => {
                if (room.id !== resident.roomId) return room;
                return {
                  ...room,
                  beds: room.beds.map(bed => {
                    if (bed.id !== resident.bedId) return bed;
                    return { ...bed, isOccupied: true, resident };
                  })
                };
              })
            };
          })
        };
      });
    });
  };

  const updateBedStatus = (bedId: string, isOccupied: boolean, resident?: Resident) => {
    setProperties(prev => {
      return prev.map(property => ({
        ...property,
        floors: property.floors.map(floor => ({
          ...floor,
          rooms: floor.rooms.map(room => ({
            ...room,
            beds: room.beds.map(bed => {
              if (bed.id !== bedId) return bed;
              return { ...bed, isOccupied, resident };
            })
          }))
        }))
      }));
    });
  };

  const addRoom = (floorId: string, roomNumber: string, bedCount: number) => {
    const newRoomId = `room-${Date.now()}`;
    const newBeds: Bed[] = Array.from({ length: bedCount }, (_, i) => ({
      id: `bed-${newRoomId}-${i + 1}`,
      number: i + 1,
      roomId: newRoomId,
      isOccupied: false
    }));

    setProperties(prev => {
      return prev.map(property => ({
        ...property,
        floors: property.floors.map(floor => {
          if (floor.id !== floorId) return floor;
          return {
            ...floor,
            rooms: [...floor.rooms, {
              id: newRoomId,
              number: roomNumber,
              floorId,
              beds: newBeds
            }]
          };
        })
      }));
    });
  };

  const updateRoomBeds = (roomId: string, bedCount: number) => {
    setProperties(prev => {
      return prev.map(property => ({
        ...property,
        floors: property.floors.map(floor => ({
          ...floor,
          rooms: floor.rooms.map(room => {
            if (room.id !== roomId) return room;
            const currentBeds = room.beds;
            const occupiedBeds = currentBeds.filter(b => b.isOccupied);
            
            if (bedCount < occupiedBeds.length) {
              // Can't reduce beds below occupied count
              return room;
            }

            const newBeds: Bed[] = [];
            for (let i = 0; i < bedCount; i++) {
              const existingBed = currentBeds[i];
              if (existingBed) {
                newBeds.push(existingBed);
              } else {
                newBeds.push({
                  id: `bed-${roomId}-${Date.now()}-${i}`,
                  number: i + 1,
                  roomId,
                  isOccupied: false
                });
              }
            }

            return { ...room, beds: newBeds };
          })
        }))
      }));
    });
  };

  const addComplaint = (complaint: Omit<Complaint, 'id' | 'createdAt'>) => {
    const newComplaint: Complaint = {
      ...complaint,
      id: `complaint-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setComplaints(prev => [newComplaint, ...prev]);
  };

  const updateComplaintStatus = (complaintId: string, status: Complaint['status']) => {
    setComplaints(prev => prev.map(c => {
      if (c.id !== complaintId) return c;
      return {
        ...c,
        status,
        resolvedAt: status === 'resolved' ? new Date().toISOString() : undefined
      };
    }));
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
