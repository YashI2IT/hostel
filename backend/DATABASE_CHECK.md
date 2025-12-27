# Database Connection & Data Viewing Guide

This guide explains how to check if your database is connected and view stored values.

## Database Setup

- **Database Type**: SQLite
- **Database File**: `prisma/dev.db`
- **ORM**: Prisma

## Methods to Check Database

### 1. Using NPM Scripts (Recommended)

#### Quick Database Check
Check connection status and see summary statistics:
```bash
npm run db:check
```

This will show:
- ✅ Connection status
- 📊 Count of records in each table
- 👤 List of users (without passwords)
- 🏢 Properties with room counts
- 🎓 Students with bed assignments
- 🚪 Rooms with bed status

#### View All Data (Detailed)
View complete database contents in JSON format:
```bash
npm run db:view
```

This shows all data from all tables in detail.

### 2. Using Prisma Studio (GUI)

Launch Prisma Studio for a visual database browser:
```bash
npm run prisma:studio
```

This opens a web interface at `http://localhost:5555` where you can:
- Browse all tables
- View, edit, and delete records
- Search and filter data

### 3. Using API Endpoint

If your server is running, check database health via HTTP:

```bash
# Basic health check
curl http://localhost:4000/health

# Database health check with counts
curl http://localhost:4000/health/db
```

The `/health/db` endpoint returns:
```json
{
  "status": "connected",
  "counts": {
    "users": 1,
    "properties": 2,
    "rooms": 10,
    "beds": 30,
    "students": 15,
    "bookings": 12,
    "payments": 12,
    "complaints": 3
  }
}
```

### 4. Using SQLite CLI (Direct)

If you have SQLite installed, you can directly query the database file:

```bash
sqlite3 prisma/dev.db

# Then run SQL queries:
.tables                    # List all tables
SELECT * FROM User;        # View users
SELECT * FROM Property;    # View properties
SELECT * FROM Student;     # View students
.quit                      # Exit
```

## Database Models

The database contains these main models:

1. **User** - Admin/owner accounts
2. **Property** - Hostel/PG buildings
3. **Room** - Rooms within properties
4. **Bed** - Individual beds in rooms
5. **Student** - Resident students
6. **Booking** - Student booking records
7. **Payment** - Payment transactions
8. **Complaint** - Room complaints

## Troubleshooting

### Database file not found
If you see connection errors, make sure the database has been initialized:
```bash
npm run prisma:push
```

### Connection errors
1. Check that `DATABASE_URL` in `.env` points to the correct file
2. Default location: `file:./prisma/dev.db`
3. Ensure the `prisma` directory exists

### View database path
The database file location is set in `prisma/schema.prisma` or via `DATABASE_URL` environment variable.

