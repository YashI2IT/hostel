import { z } from "zod";

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const userCreateSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["ADMIN", "MANAGER", "STAFF"]).optional(),
});

// Property schemas
export const propertyCreateSchema = z.object({
  name: z.string().min(1, "Property name is required"),
  address: z.string().optional(),
  totalFloors: z.number().int().positive().default(1),
});

export const propertyUpdateSchema = propertyCreateSchema.partial();

// Room schemas
export const roomCreateSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required"),
  floorNumber: z.number().int().min(0, "Floor number must be non-negative"),
  type: z.enum(["AC", "NON_AC", "STANDARD"]).default("STANDARD"),
  capacity: z.number().int().positive("Capacity must be positive"),
  propertyId: z.string().uuid("Invalid property ID"),
});

export const roomUpdateSchema = roomCreateSchema.partial();

// Bed schemas
export const bedCreateSchema = z.object({
  label: z.string().min(1, "Bed label is required"),
  roomId: z.string().uuid("Invalid room ID"),
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE"]).optional(),
});

export const bedUpdateSchema = z.object({
  label: z.string().optional(),
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE"]).optional(),
  currentStudentId: z.string().uuid().nullable().optional(),
});

// Student/Resident schemas
export const studentCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().int().positive("Age must be positive"),
  phoneNumber: z.string().min(10, "Phone number is required"),
  email: z.string().email("Invalid email").optional(),
  emergencyContact: z.string().min(10, "Emergency contact is required"),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const studentUpdateSchema = studentCreateSchema.partial();

// Booking schemas
export const bookingCreateSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  frequency: z.enum(["MONTHLY", "YEARLY", "EXCEPTION"]),
  startDate: z.string().refine(s => !Number.isNaN(Date.parse(s)), { message: "Invalid start date" }),
  endDate: z.string().refine(s => !Number.isNaN(Date.parse(s)), { message: "Invalid end date" }),
  totalAmount: z.number().nonnegative("Total amount must be non-negative"),
});

export const bookingUpdateSchema = bookingCreateSchema.partial();

// Payment schemas
export const paymentCreateSchema = z.object({
  bookingId: z.string().uuid("Invalid booking ID"),
  amount: z.number().positive("Amount must be positive"),
  method: z.enum(["UPI_REQUEST", "QR_SCAN", "CASH_OFFLINE"]),
  transactionRef: z.string().optional(),
});

// Complaint schemas
export const complaintCreateSchema = z.object({
  category: z.enum(["PLUMBING", "ELECTRICAL", "CLEANING", "FURNITURE", "OTHER"]),
  description: z.string().min(1, "Description is required"),
  roomId: z.string().uuid("Invalid room ID"),
  studentId: z.string().uuid("Invalid student ID").optional(),
});

export const complaintUpdateSchema = z.object({
  category: z.enum(["PLUMBING", "ELECTRICAL", "CLEANING", "FURNITURE", "OTHER"]).optional(),
  description: z.string().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]).optional(),
});

// Onboarding schema (combines student, booking, and payment)
export const onboardingSchema = z.object({
  // Student data
  name: z.string().min(1),
  age: z.number().int().positive(),
  phoneNumber: z.string().min(10),
  email: z.string().email().optional(),
  emergencyContact: z.string().min(10),
  address: z.string().optional(),
  // Bed assignment
  bedId: z.string().uuid(),
  // Booking data
  frequency: z.enum(["MONTHLY", "YEARLY", "EXCEPTION"]),
  startDate: z.string().refine(s => !Number.isNaN(Date.parse(s))),
  endDate: z.string().refine(s => !Number.isNaN(Date.parse(s))),
  totalAmount: z.number().nonnegative(),
  // Payment data
  paymentMethod: z.enum(["UPI_REQUEST", "QR_SCAN", "CASH_OFFLINE"]),
  transactionRef: z.string().optional(),
});
