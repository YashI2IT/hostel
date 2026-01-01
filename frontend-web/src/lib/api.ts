// API client for backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, ...fetchOptions } = options;

    // Build URL with query parameters
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      url += `?${searchParams.toString()}`;
    }

    // Set default headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Auth endpoints
  async login(username: string, password: string) {
    return this.request<{ user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async register(username: string, password: string, name: string, role = 'ADMIN') {
    return this.request<{ user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, name, role }),
    });
  }

  // Properties endpoints
  async getProperties() {
    return this.request<any[]>('/properties');
  }

  async getProperty(id: string) {
    return this.request<any>(`/properties/${id}`);
  }

  async createProperty(data: { name: string; address?: string; totalFloors: number }) {
    return this.request<any>('/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProperty(id: string, data: Partial<{ name: string; address: string; totalFloors: number }>) {
    return this.request<any>(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProperty(id: string) {
    return this.request<void>(`/properties/${id}`, {
      method: 'DELETE',
    });
  }

  // Rooms endpoints
  async getRooms(params?: { propertyId?: string; floorNumber?: number }) {
    return this.request<any[]>('/rooms', { params });
  }

  async getRoom(id: string) {
    return this.request<any>(`/rooms/${id}`);
  }

  async createRoom(data: {
    roomNumber: string;
    floorNumber: number;
    type: string;
    capacity: number;
    propertyId: string;
  }) {
    return this.request<any>('/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRoom(id: string, data: Partial<{
    roomNumber: string;
    floorNumber: number;
    type: string;
    capacity: number;
  }>) {
    return this.request<any>(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRoom(id: string) {
    return this.request<void>(`/rooms/${id}`, {
      method: 'DELETE',
    });
  }

  // Beds endpoints
  async getBeds(params?: { roomId?: string }) {
    return this.request<any[]>('/beds', { params });
  }

  async getBed(id: string) {
    return this.request<any>(`/beds/${id}`);
  }

  async createBed(data: { label: string; roomId: string; status?: string }) {
    return this.request<any>('/beds', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBed(id: string, data: Partial<{ status: string; currentStudentId?: string }>) {
    return this.request<any>(`/beds/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBed(id: string) {
    return this.request<void>(`/beds/${id}`, {
      method: 'DELETE',
    });
  }

  // Students endpoints
  async getStudents(params?: { isActive?: boolean }) {
    return this.request<any[]>('/students', { params });
  }

  async getStudent(id: string) {
    return this.request<any>(`/students/${id}`);
  }

  async createStudent(data: {
    name: string;
    age: number;
    phoneNumber: string;
    email?: string;
    emergencyContact: string;
    address?: string;
  }) {
    return this.request<any>('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStudent(id: string, data: Partial<{
    name: string;
    age: number;
    phoneNumber: string;
    email: string;
    emergencyContact: string;
    address: string;
    isActive: boolean;
  }>) {
    return this.request<any>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStudent(id: string) {
    return this.request<void>(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  // Bookings endpoints
  async getBookings(params?: { studentId?: string }) {
    return this.request<any[]>('/bookings', { params });
  }

  async getBooking(id: string) {
    return this.request<any>(`/bookings/${id}`);
  }

  async createBooking(data: {
    studentId: string;
    frequency: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
  }) {
    return this.request<any>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBooking(id: string, data: Partial<{
    frequency: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
  }>) {
    return this.request<any>(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBooking(id: string) {
    return this.request<void>(`/bookings/${id}`, {
      method: 'DELETE',
    });
  }

  // Payments endpoints
  async getPayments(params?: { bookingId?: string }) {
    return this.request<any[]>('/payments', { params });
  }

  async getPayment(id: string) {
    return this.request<any>(`/payments/${id}`);
  }

  async createPayment(data: {
    bookingId: string;
    amount: number;
    method: string;
    transactionRef?: string;
  }) {
    return this.request<any>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePayment(id: string, data: Partial<{
    method: string;
    transactionRef: string;
  }>) {
    return this.request<any>(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePayment(id: string) {
    return this.request<void>(`/payments/${id}`, {
      method: 'DELETE',
    });
  }

  // Complaints endpoints
  async getComplaints(params?: { status?: string; roomId?: string; studentId?: string }) {
    return this.request<any[]>('/complaints', { params });
  }

  async getComplaint(id: string) {
    return this.request<any>(`/complaints/${id}`);
  }

  async createComplaint(data: {
    category: string;
    description: string;
    roomId: string;
    studentId?: string;
  }) {
    return this.request<any>('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateComplaint(id: string, data: Partial<{ status: string; description?: string }>) {
    return this.request<any>(`/complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteComplaint(id: string) {
    return this.request<void>(`/complaints/${id}`, {
      method: 'DELETE',
    });
  }

  // Onboarding endpoint
  async createOnboarding(data: {
    name: string;
    age: number;
    phoneNumber: string;
    email?: string;
    emergencyContact: string;
    address?: string;
    bedId: string;
    frequency: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
    paymentMethod: string;
    transactionRef?: string;
  }) {
    return this.request<{
      student: any;
      booking: any;
      payment: any;
    }>('/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Dashboard endpoints
  async getDashboardStats() {
    return this.request<any>('/dashboard/stats');
  }

  async getDashboardOccupancy() {
    return this.request<any>('/dashboard/occupancy');
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;

