/**
 * Script to view all data in the database in detail
 * Run with: npm run db:view
 */

import { prisma } from "../prisma";

async function viewAllData() {
  try {
    console.log("📋 Viewing all database data...\n");

    await prisma.$connect();
    console.log("✅ Connected to database\n");

    // Users
    console.log("=".repeat(60));
    console.log("👤 USERS");
    console.log("=".repeat(60));
    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, role: true, createdAt: true },
    });
    if (users.length === 0) {
      console.log("No users found.\n");
    } else {
      console.log(JSON.stringify(users, null, 2));
      console.log();
    }

    // Properties with Rooms
    console.log("=".repeat(60));
    console.log("🏢 PROPERTIES");
    console.log("=".repeat(60));
    const properties = await prisma.property.findMany({
      include: {
        rooms: {
          include: {
            beds: {
              include: {
                currentStudent: {
                  select: { id: true, name: true, phoneNumber: true },
                },
              },
            },
          },
        },
      },
    });
    if (properties.length === 0) {
      console.log("No properties found.\n");
    } else {
      // Format output nicely
      properties.forEach((prop) => {
        console.log(JSON.stringify(
          {
            id: prop.id,
            name: prop.name,
            address: prop.address,
            totalFloors: prop.totalFloors,
            rooms: prop.rooms.map((room) => ({
              id: room.id,
              roomNumber: room.roomNumber,
              floorNumber: room.floorNumber,
              type: room.type,
              capacity: room.capacity,
              beds: room.beds.map((bed) => ({
                id: bed.id,
                label: bed.label,
                status: bed.status,
                student: bed.currentStudent?.name || null,
              })),
            })),
          },
          null,
          2
        ));
      });
      console.log();
    }

    // Students
    console.log("=".repeat(60));
    console.log("🎓 STUDENTS");
    console.log("=".repeat(60));
    const students = await prisma.student.findMany({
      include: {
        assignedBed: {
          include: {
            room: {
              include: { property: { select: { name: true } } },
            },
          },
        },
        bookings: true,
      },
    });
    if (students.length === 0) {
      console.log("No students found.\n");
    } else {
      console.log(JSON.stringify(students, null, 2));
      console.log();
    }

    // Bookings
    console.log("=".repeat(60));
    console.log("📅 BOOKINGS");
    console.log("=".repeat(60));
    const bookings = await prisma.booking.findMany({
      include: {
        student: { select: { id: true, name: true, phoneNumber: true } },
        payment: true,
      },
    });
    if (bookings.length === 0) {
      console.log("No bookings found.\n");
    } else {
      console.log(JSON.stringify(bookings, null, 2));
      console.log();
    }

    // Complaints
    console.log("=".repeat(60));
    console.log("📢 COMPLAINTS");
    console.log("=".repeat(60));
    const complaints = await prisma.complaint.findMany({
      include: {
        room: { include: { property: { select: { name: true } } } },
        student: { select: { id: true, name: true } },
      },
    });
    if (complaints.length === 0) {
      console.log("No complaints found.\n");
    } else {
      console.log(JSON.stringify(complaints, null, 2));
      console.log();
    }

    console.log("✅ Data view completed!");
  } catch (error: any) {
    console.error("❌ Error viewing data!");
    console.error("Error:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

viewAllData();

