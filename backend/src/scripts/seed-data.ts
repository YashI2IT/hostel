import { PrismaClient } from "../../generated/prisma";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function seedData() {
  try {
    console.log("🌱 Seeding database...");

    // Create admin user
    const hashedPassword = await hash("password", 10);
    const user = await prisma.user.upsert({
      where: { username: "admin" },
      update: {},
      create: {
        username: "admin",
        password: hashedPassword,
        name: "Admin User",
        role: "ADMIN",
      },
    });
    console.log("✅ User created:", user.username);

    // Create property
    const property = await prisma.property.create({
      data: {
        name: "Sunrise Hostel",
        address: "123 University Road, City Center",
        totalFloors: 3,
      },
    });
    console.log("✅ Property created:", property.name);

    // Create rooms
    const roomsData = [
      { roomNumber: "101", floorNumber: 1, type: "AC", capacity: 3 },
      { roomNumber: "102", floorNumber: 1, type: "NON_AC", capacity: 2 },
      { roomNumber: "103", floorNumber: 1, type: "AC", capacity: 4 },
      { roomNumber: "201", floorNumber: 2, type: "AC", capacity: 2 },
      { roomNumber: "202", floorNumber: 2, type: "NON_AC", capacity: 3 },
      { roomNumber: "301", floorNumber: 3, type: "AC", capacity: 2 },
    ];

    const rooms: any[] = [];
    for (const roomData of roomsData) {
      const room = await prisma.room.create({
        data: {
          ...roomData,
          propertyId: property.id,
        },
      });
      rooms.push(room);
    }
    console.log("✅ Rooms created:", rooms.length);

    // Create beds for each room
    for (const room of rooms) {
      for (let i = 0; i < room.capacity; i++) {
        await prisma.bed.create({
          data: {
            label: String.fromCharCode(65 + i), // A, B, C, etc.
            roomId: room.id,
            status: "AVAILABLE",
          },
        });
      }
    }
    console.log("✅ Beds created for all rooms");

    // Create students
    const studentsData = [
      { name: "Rahul Sharma", age: 22, phoneNumber: "+919876543210", email: "rahul@email.com", emergencyContact: "+919876500000" },
      { name: "Priya Patel", age: 21, phoneNumber: "+918765432109", email: "priya@email.com", emergencyContact: "+918765400000" },
      { name: "Amit Kumar", age: 23, phoneNumber: "+917654321098", email: "amit@email.com", emergencyContact: "+917654300000" },
      { name: "Sneha Reddy", age: 20, phoneNumber: "+916543210987", email: "sneha@email.com", emergencyContact: "+916543200000" },
      { name: "Vikram Singh", age: 24, phoneNumber: "+915432109876", email: "vikram@email.com", emergencyContact: "+915432100000" },
    ];

    const students: any[] = [];
    for (const studentData of studentsData) {
      const student = await prisma.student.create({
        data: studentData,
      });
      students.push(student);
    }
    console.log("✅ Students created:", students.length);

    // Assign students to beds
    const beds = await prisma.bed.findMany({ take: 5 });
    for (let i = 0; i < Math.min(students.length, beds.length); i++) {
      await prisma.bed.update({
        where: { id: beds[i].id },
        data: {
          status: "OCCUPIED",
          currentStudentId: students[i].id,
        },
      });
    }
    console.log("✅ Students assigned to beds");

    // Create complaints
    await prisma.complaint.create({
      data: {
        category: "PLUMBING",
        description: "Water leakage in the bathroom sink.",
        status: "OPEN",
        roomId: rooms[0].id,
        studentId: students[0].id,
      },
    });

    await prisma.complaint.create({
      data: {
        category: "ELECTRICAL",
        description: "Ceiling fan making noise.",
        status: "OPEN",
        roomId: rooms[3].id,
        studentId: students[3].id,
      },
    });
    console.log("✅ Complaints created");

    console.log("\n🎉 Database seeded successfully!");
    console.log("Login: username='admin', password='password'");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedData();