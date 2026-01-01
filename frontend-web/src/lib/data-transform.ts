// Data transformation utilities to convert between backend API format and frontend format
import { Property, Resident, Complaint, Bed } from '@/types/hostel';

// Transform backend complaint status to frontend format
export function transformComplaintStatus(status: string): 'open' | 'in-progress' | 'resolved' {
  const statusMap: Record<string, 'open' | 'in-progress' | 'resolved'> = {
    'OPEN': 'open',
    'IN_PROGRESS': 'in-progress',
    'RESOLVED': 'resolved',
  };
  return statusMap[status.toUpperCase()] || 'open';
}

// Transform frontend complaint status to backend format
export function transformComplaintStatusToBackend(status: 'open' | 'in-progress' | 'resolved'): string {
  const statusMap: Record<string, string> = {
    'open': 'OPEN',
    'in-progress': 'IN_PROGRESS',
    'resolved': 'RESOLVED',
  };
  return statusMap[status] || 'OPEN';
}

// Transform backend frequency to frontend format
export function transformFrequency(frequency: string): 'monthly' | 'yearly' | 'custom' {
  const freqMap: Record<string, 'monthly' | 'yearly' | 'custom'> = {
    'MONTHLY': 'monthly',
    'YEARLY': 'yearly',
    'EXCEPTION': 'custom',
  };
  return freqMap[frequency.toUpperCase()] || 'monthly';
}

// Transform frontend frequency to backend format
export function transformFrequencyToBackend(frequency: 'monthly' | 'yearly' | 'custom'): string {
  const freqMap: Record<string, string> = {
    'monthly': 'MONTHLY',
    'yearly': 'YEARLY',
    'custom': 'EXCEPTION',
  };
  return freqMap[frequency] || 'MONTHLY';
}

// Transform backend payment method to frontend format
export function transformPaymentMethod(method: string): 'upi' | 'qr' | 'cash' {
  const methodMap: Record<string, 'upi' | 'qr' | 'cash'> = {
    'UPI_REQUEST': 'upi',
    'QR_SCAN': 'qr',
    'CASH_OFFLINE': 'cash',
  };
  return methodMap[method.toUpperCase()] || 'cash';
}

// Transform frontend payment method to backend format
export function transformPaymentMethodToBackend(method: 'upi' | 'qr' | 'cash'): string {
  const methodMap: Record<string, string> = {
    'upi': 'UPI_REQUEST',
    'qr': 'QR_SCAN',
    'cash': 'CASH_OFFLINE',
  };
  return methodMap[method] || 'CASH_OFFLINE';
}

// Transform backend complaint to frontend format
export function transformComplaint(backendComplaint: any): Complaint {
  return {
    id: backendComplaint.id,
    roomId: backendComplaint.roomId,
    roomNumber: backendComplaint.roomNumber,
    category: backendComplaint.category.toLowerCase() as Complaint['category'],
    description: backendComplaint.description,
    status: transformComplaintStatus(backendComplaint.status),
    createdAt: backendComplaint.createdAt,
    resolvedAt: backendComplaint.resolvedAt,
  };
}

// Transform backend student/resident to frontend format
export function transformResident(backendStudent: any): Resident {
  const booking = backendStudent.bookings?.[0];
  const payment = booking?.payment;
  
  return {
    id: backendStudent.id,
    name: backendStudent.name,
    age: backendStudent.age,
    contactNumber: backendStudent.phoneNumber,
    email: backendStudent.email || '',
    emergencyContact: backendStudent.emergencyContact,
    emergencyContactName: '', // Not provided by backend
    bedId: backendStudent.bedId || '',
    roomId: backendStudent.roomId || '',
    floorId: backendStudent.floorId || '',
    propertyId: backendStudent.propertyId || '',
    startDate: booking?.startDate ? new Date(booking.startDate).toISOString().split('T')[0] : '',
    endDate: booking?.endDate ? new Date(booking.endDate).toISOString().split('T')[0] : '',
    billingFrequency: booking?.frequency ? transformFrequency(booking.frequency) : 'monthly',
    monthlyRent: booking?.totalAmount ? booking.totalAmount / 12 : 0,
    paymentStatus: payment ? 'paid' : 'pending',
    lastPaymentDate: payment?.date ? new Date(payment.date).toISOString().split('T')[0] : undefined,
  };
}

// Transform backend bed to frontend format
export function transformBed(backendBed: any, resident?: Resident): Bed {
  return {
    id: backendBed.id,
    number: parseInt(backendBed.number || backendBed.label) || 1,
    roomId: backendBed.roomId,
    isOccupied: backendBed.isOccupied || backendBed.status === 'OCCUPIED',
    resident: resident,
  };
}

