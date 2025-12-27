# Hostel Hub API Documentation

Complete API documentation for the Hostel Hub backend system.

## Base URL
```
http://localhost:4000/api
```

## Authentication

### POST /auth/login
Login with username and password.

**Request Body:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "username": "admin",
    "name": "Admin User",
    "role": "ADMIN",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /auth/register
Register a new admin user (for initial setup).

**Request Body:**
```json
{
  "username": "admin",
  "password": "password123",
  "name": "Admin User",
  "role": "ADMIN"
}
```

---

## Properties

### GET /properties
Get all properties with rooms and beds.

**Query Parameters:**
- None

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Sunrise Hostel",
    "address": "123 University Road",
    "tenantId": "uuid",
    "floors": [
      {
        "id": "floor-1",
        "number": 1,
        "propertyId": "uuid",
        "rooms": [...]
      }
    ]
  }
]
```

### GET /properties/:id
Get a single property by ID.

### POST /properties
Create a new property.

**Request Body:**
```json
{
  "name": "Sunrise Hostel",
  "address": "123 University Road",
  "totalFloors": 3
}
```

### PUT /properties/:id
Update a property.

### DELETE /properties/:id
Delete a property.

---

## Rooms

### GET /rooms
Get all rooms (optionally filtered).

**Query Parameters:**
- `propertyId` (optional): Filter by property
- `floorNumber` (optional): Filter by floor number

**Response:**
```json
[
  {
    "id": "uuid",
    "roomNumber": "101",
    "floorNumber": 1,
    "type": "AC",
    "capacity": 4,
    "propertyId": "uuid",
    "property": {...},
    "beds": [...],
    "complaints": [...]
  }
]
```

### GET /rooms/:id
Get a single room by ID.

### POST /rooms
Create a new room.

**Request Body:**
```json
{
  "roomNumber": "101",
  "floorNumber": 1,
  "type": "AC",
  "capacity": 4,
  "propertyId": "uuid"
}
```

### PUT /rooms/:id
Update a room.

### DELETE /rooms/:id
Delete a room (only if no occupied beds).

---

## Beds

### GET /beds
Get all beds (optionally filtered by roomId).

**Query Parameters:**
- `roomId` (optional): Filter by room

**Response:**
```json
[
  {
    "id": "uuid",
    "label": "A",
    "status": "OCCUPIED",
    "roomId": "uuid",
    "room": {...},
    "currentStudentId": "uuid",
    "currentStudent": {...}
  }
]
```

### GET /beds/:id
Get a single bed by ID.

### POST /beds
Create a new bed.

**Request Body:**
```json
{
  "label": "A",
  "roomId": "uuid",
  "status": "AVAILABLE"
}
```

### PUT /beds/:id
Update a bed (status, assignment, etc.).

**Request Body:**
```json
{
  "status": "OCCUPIED",
  "currentStudentId": "uuid"
}
```

### DELETE /beds/:id
Delete a bed (only if not occupied).

---

## Students (Residents)

### GET /students
Get all students (optionally filtered by isActive).

**Query Parameters:**
- `isActive` (optional): Filter by active status (true/false)

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "age": 22,
    "phoneNumber": "+91 98765 43210",
    "email": "john@example.com",
    "emergencyContact": "+91 98765 00000",
    "address": "Home Address",
    "isActive": true,
    "bedId": "uuid",
    "roomId": "uuid",
    "floorId": "floor-1",
    "propertyId": "uuid",
    "assignedBed": {...},
    "bookings": [...],
    "complaints": [...]
  }
]
```

### GET /students/:id
Get a single student by ID.

### POST /students
Create a new student.

**Request Body:**
```json
{
  "name": "John Doe",
  "age": 22,
  "phoneNumber": "+91 98765 43210",
  "email": "john@example.com",
  "emergencyContact": "+91 98765 00000",
  "address": "Home Address",
  "isActive": true
}
```

### PUT /students/:id
Update a student.

### DELETE /students/:id
Soft delete a student (sets isActive to false and unassigns bed).

---

## Bookings

### GET /bookings
Get all bookings (optionally filtered by studentId).

**Query Parameters:**
- `studentId` (optional): Filter by student

**Response:**
```json
[
  {
    "id": "uuid",
    "studentId": "uuid",
    "student": {...},
    "frequency": "MONTHLY",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-12-31T00:00:00.000Z",
    "totalAmount": 96000,
    "payment": {...},
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### GET /bookings/:id
Get a single booking by ID.

### POST /bookings
Create a new booking.

**Request Body:**
```json
{
  "studentId": "uuid",
  "frequency": "MONTHLY",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "totalAmount": 96000
}
```

### PUT /bookings/:id
Update a booking.

### DELETE /bookings/:id
Delete a booking (also deletes associated payment).

---

## Payments

### GET /payments
Get all payments (optionally filtered by bookingId).

**Query Parameters:**
- `bookingId` (optional): Filter by booking

**Response:**
```json
[
  {
    "id": "uuid",
    "bookingId": "uuid",
    "booking": {...},
    "amount": 96000,
    "date": "2024-01-01T00:00:00.000Z",
    "method": "UPI_REQUEST",
    "transactionRef": "TXN123456"
  }
]
```

### GET /payments/:id
Get a single payment by ID.

### POST /payments
Create a new payment.

**Request Body:**
```json
{
  "bookingId": "uuid",
  "amount": 96000,
  "method": "UPI_REQUEST",
  "transactionRef": "TXN123456"
}
```

**Note:** Payment amount must match booking total amount.

### PUT /payments/:id
Update a payment (method, transactionRef).

### DELETE /payments/:id
Delete a payment.

---

## Complaints

### GET /complaints
Get all complaints (optionally filtered).

**Query Parameters:**
- `status` (optional): Filter by status (OPEN, RESOLVED)
- `roomId` (optional): Filter by room
- `studentId` (optional): Filter by student

**Response:**
```json
[
  {
    "id": "uuid",
    "category": "PLUMBING",
    "description": "Water leakage in bathroom",
    "status": "OPEN",
    "roomId": "uuid",
    "roomNumber": "101",
    "room": {...},
    "studentId": "uuid",
    "student": {...},
    "createdAt": "2024-01-01T00:00:00.000Z",
    "resolvedAt": null
  }
]
```

### GET /complaints/:id
Get a single complaint by ID.

### POST /complaints
Create a new complaint.

**Request Body:**
```json
{
  "category": "PLUMBING",
  "description": "Water leakage in bathroom",
  "roomId": "uuid",
  "studentId": "uuid"
}
```

### PUT /complaints/:id
Update a complaint (including status change).

**Request Body:**
```json
{
  "status": "RESOLVED"
}
```

### DELETE /complaints/:id
Delete a complaint.

---

## Onboarding

### POST /onboarding
Complete onboarding process (creates student, booking, payment, and assigns bed in one transaction).

**Request Body:**
```json
{
  "name": "John Doe",
  "age": 22,
  "phoneNumber": "+91 98765 43210",
  "email": "john@example.com",
  "emergencyContact": "+91 98765 00000",
  "address": "Home Address",
  "bedId": "uuid",
  "frequency": "MONTHLY",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "totalAmount": 96000,
  "paymentMethod": "UPI_REQUEST",
  "transactionRef": "TXN123456"
}
```

**Response:**
```json
{
  "student": {...},
  "booking": {...},
  "payment": {...}
}
```

---

## Dashboard

### GET /dashboard/stats
Get comprehensive dashboard statistics.

**Response:**
```json
{
  "occupancy": {
    "totalBeds": 100,
    "occupiedBeds": 75,
    "availableBeds": 20,
    "maintenanceBeds": 5,
    "occupancyRate": 75
  },
  "rooms": {
    "total": 25
  },
  "students": {
    "total": 75,
    "active": 75,
    "inactive": 0
  },
  "complaints": {
    "total": 10,
    "open": 5,
    "resolved": 5,
    "recent": [...]
  },
  "bookings": {
    "total": 75,
    "active": 75
  },
  "payments": {
    "total": 75,
    "totalRevenue": 7200000
  },
  "recentStudents": [...]
}
```

### GET /dashboard/occupancy
Get detailed occupancy by floor.

**Query Parameters:**
- `propertyId` (optional): Filter by property

**Response:**
```json
{
  "properties": [
    {
      "floorNumber": 1,
      "propertyId": "uuid",
      "propertyName": "Sunrise Hostel",
      "rooms": [...],
      "totalBeds": 20,
      "occupiedBeds": 15,
      "availableBeds": 5
    }
  ]
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message",
  "details": [...] // Optional: validation error details
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `204` - No Content (successful delete)
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

---

## Data Models

### Property
- `id`: UUID
- `name`: String
- `address`: String (optional)
- `totalFloors`: Number

### Room
- `id`: UUID
- `roomNumber`: String (unique per property)
- `floorNumber`: Number
- `type`: "AC" | "NON_AC"
- `capacity`: Number
- `propertyId`: UUID

### Bed
- `id`: UUID
- `label`: String
- `status`: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE"
- `roomId`: UUID
- `currentStudentId`: UUID (optional)

### Student
- `id`: UUID
- `name`: String
- `age`: Number
- `phoneNumber`: String (unique)
- `email`: String (optional)
- `emergencyContact`: String
- `address`: String (optional)
- `isActive`: Boolean

### Booking
- `id`: UUID
- `studentId`: UUID
- `frequency`: "MONTHLY" | "YEARLY" | "EXCEPTION"
- `startDate`: DateTime
- `endDate`: DateTime
- `totalAmount`: Number

### Payment
- `id`: UUID
- `bookingId`: UUID (unique)
- `amount`: Number
- `date`: DateTime
- `method`: "UPI_REQUEST" | "QR_SCAN" | "CASH_OFFLINE"
- `transactionRef`: String (optional)

### Complaint
- `id`: UUID
- `category`: "PLUMBING" | "ELECTRICAL" | "CLEANING" | "OTHER"
- `description`: String
- `status`: "OPEN" | "RESOLVED"
- `roomId`: UUID
- `studentId`: UUID (optional)
- `createdAt`: DateTime
- `resolvedAt`: DateTime (optional)

