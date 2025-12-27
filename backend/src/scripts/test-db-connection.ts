/**
 * Simple database connection test to identify errors
 */

import { prisma } from "../prisma";

async function testConnection() {
  try {
    console.log("Testing database connection...");
    
    // Test 1: Basic connection
    console.log("\n1. Testing Prisma Client connection...");
    await prisma.$connect();
    console.log("✅ Prisma Client connected");
    
    // Test 2: Raw query
    console.log("\n2. Testing raw SQL query...");
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Raw query successful:", result);
    
    // Test 3: Count query
    console.log("\n3. Testing model count query...");
    const userCount = await prisma.user.count();
    console.log("✅ User count query successful:", userCount);
    
    // Test 4: Try to query all tables
    console.log("\n4. Testing all table queries...");
    const counts = {
      users: await prisma.user.count(),
      properties: await prisma.property.count(),
      rooms: await prisma.room.count(),
      beds: await prisma.bed.count(),
      students: await prisma.student.count(),
      bookings: await prisma.booking.count(),
      payments: await prisma.payment.count(),
      complaints: await prisma.complaint.count(),
    };
    console.log("✅ All table queries successful");
    console.log("Counts:", counts);
    
    console.log("\n✅ All tests passed! Database is working correctly.");
    
  } catch (error: any) {
    console.error("\n❌ ERROR DETECTED:");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Name:", error.name);
    if (error.meta) {
      console.error("Meta:", error.meta);
    }
    console.error("\nFull error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

