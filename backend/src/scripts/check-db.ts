/**
 * Script to check database connection and display stored values
 * Run with: npm run db:check
 */

import { prisma } from "../prisma";

async function checkDatabase() {
  try {
    console.log("🔍 Checking database connection...\n");

    // Test connection
    await prisma.$connect();
    console.log("✅ Database connected successfully!\n");

    // Get counts for each model
    const [users, properties, rooms, beds, students, bookings, payments, complaints] = await Promise.all([
      prisma.user.count(),
      prisma.property.count(),
      prisma.room.count(),
      prisma.bed.count(),
      prisma.student.count(),
      prisma.booking.count(),
      prisma.payment.count(),
      prisma.complaint.count(),
    ]);

    console.log("📊 Database Statistics:");
    console.log("─".repeat(50));
    console.log(`Users:        ${users}`);
    console.log(`Properties:   ${properties}`);
    console.log(`Rooms:        ${rooms}`);
    console.log(`Beds:         ${beds}`);
    console.log(`Students:     ${students}`);
    console.log(`Bookings:     ${bookings}`);
    console.log(`Payments:     ${payments}`);
    console.log(`Complaints:   ${complaints}`);
    console.log("─".repeat(50));
    console.log();

    // Display Users (without passwords)
    if (users > 0) {
      console.log("👤 Users:");
      const userList = await prisma.user.findMany({
        select: { id: true, username: true, name: true, role: true, createdAt: true },
      });
      userList.forEach((user) => {
        console.log(`  - ${user.username} (${user.name}) [${user.role}]`);
      });
      console.log();
    }

    // Display Properties
    if (properties > 0) {
      console.log("🏢 Properties:");
      const propertyList = await prisma.property.findMany({
        include: { _count: { select: { rooms: true } } },
      });
      propertyList.forEach((prop) => {
        console.log(`  - ${prop.name} (${prop._count.rooms} rooms, ${prop.totalFloors} floors)`);
        if (prop.address) console.log(`    Address: ${prop.address}`);
      });
      console.log();
    }

    // Display Students
    if (students > 0) {
      console.log("🎓 Students:");
      const studentList = await prisma.student.findMany({
        include: { assignedBed: { include: { room: { include: { property: true } } } } },
        take: 10, // Limit to first 10
      });
      studentList.forEach((student) => {
        const bedInfo = student.assignedBed
          ? `Bed ${student.assignedBed.label} in Room ${student.assignedBed.room.roomNumber}`
          : "No bed assigned";
        console.log(`  - ${student.name} (${student.phoneNumber}) - ${bedInfo}`);
      });
      if (students > 10) console.log(`  ... and ${students - 10} more`);
      console.log();
    }

    // Display Rooms with Bed Status
    if (rooms > 0) {
      console.log("🚪 Rooms (with bed status):");
      const roomList = await prisma.room.findMany({
        include: {
          property: true,
          beds: { include: { currentStudent: { select: { name: true } } } },
          _count: { select: { beds: true } },
        },
        take: 10,
      });
      roomList.forEach((room) => {
        const occupied = room.beds.filter((b) => b.status === "OCCUPIED").length;
        const available = room.beds.filter((b) => b.status === "AVAILABLE").length;
        console.log(`  - ${room.roomNumber} (${room.type}) - ${occupied} occupied, ${available} available`);
      });
      if (rooms > 10) console.log(`  ... and ${rooms - 10} more`);
      console.log();
    }

    console.log("✅ Database check completed!");
  } catch (error: any) {
    console.error("❌ Database connection failed!");
    console.error("Error:", error.message);
    if (error.code) console.error("Error code:", error.code);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

