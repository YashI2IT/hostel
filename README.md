# Hostel Hub - Hostel Management System

A full-stack hostel management application with React frontend and Express backend.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: SQLite

## Project Structure

```
hostel-main/
├── backend/           # Express API server
│   ├── prisma/        # Database schema and migrations
│   ├── src/
│   │   ├── routes/    # API endpoints
│   │   ├── scripts/   # Seed data scripts
│   │   └── utils/     # Validation schemas
│   └── .env           # Backend environment variables
├── frontend-web/      # React application
│   ├── src/
│   │   ├── components/
│   │   ├── context/   # Global state management
│   │   ├── pages/
│   │   └── lib/       # API client and utilities
│   └── .env           # Frontend environment variables
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hostel-main
```

### 2. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file
echo 'DATABASE_URL="file:./dev.db"' > .env
echo 'PORT=4000' >> .env
echo 'FRONTEND_URL="*"' >> .env

# Generate Prisma client
npx prisma generate

# Create database and apply schema
npx prisma db push

# Seed the database with sample data
npx ts-node src/scripts/seed-data.ts

# Start the backend server
npm run dev
```

Backend will run on: http://localhost:4000

### 3. Frontend Setup

Open a new terminal:

```bash
# Navigate to frontend folder
cd frontend-web

# Install dependencies
npm install

# Create .env file
echo 'VITE_API_URL=http://localhost:4000/api' > .env

# Start the frontend server
npm run dev
```

Frontend will run on: http://localhost:8080

### 4. Access the Application

1. Open http://localhost:8080 in your browser
2. Login with:
   - **Username**: `admin`
   - **Password**: `password`
   - **Org ID**: any value (e.g., `1`)

## Database Management

### View Database (Prisma Studio)

```bash
cd backend
npx prisma studio
```

Opens at: http://localhost:5555

### Reset Database

```bash
cd backend
npx prisma db push --force-reset
npx ts-node src/scripts/seed-data.ts
```

### Copy Database to Another Computer

The database file is located at `backend/prisma/dev.db`. To transfer:

1. Copy the entire `hostel-main` folder
2. Or copy just `backend/prisma/dev.db` to the new setup after running `npx prisma db push`

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/properties` | Get all properties with rooms, beds, residents |
| `GET /api/complaints` | Get all complaints |
| `POST /api/onboarding` | Add new resident with booking and payment |
| `POST /api/complaints` | Create new complaint |
| `PUT /api/complaints/:id` | Update complaint status |
| `PUT /api/rooms/:id` | Update room (bed count) |
| `POST /api/auth/login` | User login |

## Features

- **Dashboard**: Overview of occupancy stats, residents, and complaints
- **Room Management**: Add rooms, modify bed counts
- **Bed Allocation**: Visual bed status (occupied/available)
- **Guest Onboarding**: Multi-step form with payment collection
- **Complaints**: Track and manage maintenance issues
- **Residents**: View all current residents with payment status

## Troubleshooting

### Backend not starting
- Check if port 4000 is already in use
- Verify `.env` file exists with correct DATABASE_URL

### Frontend not connecting to backend
- Ensure backend is running on port 4000
- Check `frontend-web/.env` has correct API URL
- Check browser console for CORS errors

### Database errors
- Run `npx prisma generate` to regenerate client
- Run `npx prisma db push` to sync schema

## License

MIT
