export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'staff';
  tenantId: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  tenantId: string;
  floors: Floor[];
}

export interface Floor {
  id: string;
  number: number;
  propertyId: string;
  rooms: Room[];
}

export interface Room {
  id: string;
  number: string;
  floorId: string;
  beds: Bed[];
}

export interface Bed {
  id: string;
  number: number;
  roomId: string;
  isOccupied: boolean;
  resident?: Resident;
}

export interface Resident {
  id: string;
  name: string;
  age: number;
  contactNumber: string;
  email: string;
  emergencyContact: string;
  emergencyContactName: string;
  bedId: string;
  roomId: string;
  floorId: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  billingFrequency: 'monthly' | 'yearly' | 'custom';
  customDays?: number;
  monthlyRent: number;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  lastPaymentDate?: string;
}

export interface Complaint {
  id: string;
  roomId: string;
  roomNumber: string;
  category: 'plumbing' | 'electrical' | 'furniture' | 'cleaning' | 'other';
  description: string;
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
}

export interface OnboardingFormData {
  // Step 1: Guest Details
  name: string;
  age: number;
  contactNumber: string;
  email: string;
  emergencyContactName: string;
  emergencyContact: string;
  
  // Allocation (pre-filled)
  propertyId: string;
  floorId: string;
  roomId: string;
  bedId: string;
  
  // Step 2: Duration & Billing
  billingFrequency: 'monthly' | 'yearly' | 'custom';
  customDays?: number;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  
  // Step 3: Payment
  paymentMethod: 'upi' | 'qr' | 'cash';
  upiId?: string;
  paymentVerified: boolean;
}
