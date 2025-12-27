/**
 * Fix database connection and ensure proper setup
 */

import { PrismaClient } from "../../generated/prisma";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function fixDatabase() {
  try {
    console.log("🔧 Fixing database connection...\n");

    // Test connection
    console.log("1. Testing connection...");
    await prisma.$connect();
    console.log("✅ Connected successfully\n");

    // Verify database URL
    const dbUrl = process.env.DATABASE_URL;
    console.log("2. Database URL:", dbUrl || "Not set (using default)\n");

    // Test read operation
    console.log("3. Testing read operation...");
    const userCount = await prisma.user.count();
    console.log(`✅ Read successful (Users: ${userCount})\n`);

    // Test write operation
    console.log("4. Testing write operation...");
    const testProp = await prisma.property.create({
      data: {
        name: "Connection Test Property",
        address: "Test",
        totalFloors: 1,
      },
    });
    console.log(`✅ Write successful (Created: ${testProp.id})\n`);

    // Test update operation
    console.log("5. Testing update operation...");
    const updated = await prisma.property.update({
      where: { id: testProp.id },
      data: { name: "Updated Connection Test" },
    });
    console.log(`✅ Update successful (Updated: ${updated.name})\n`);

    // Cleanup
    console.log("6. Cleaning up test data...");
    await prisma.property.delete({ where: { id: testProp.id } });
    console.log("✅ Cleanup successful\n");

    // Show all counts
    console.log("7. Current database state:");
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
    console.log(JSON.stringify(counts, null, 2));
    console.log();

    console.log("✅ Database is properly configured and working!");
    console.log("\nIf you're still seeing issues:");
    console.log("1. Make sure your .env file has: DATABASE_URL=\"file:./prisma/dev.db\"");
    console.log("2. Restart your development server");
    console.log("3. Run: npx prisma generate");

  } catch (error: any) {
    console.error("\n❌ Database fix failed!");
    console.error("Error:", error.message);
    console.error("Code:", error.code);
    
    if (error.code === "P1001") {
      console.error("\n💡 Tip: Cannot reach database server. Check DATABASE_URL in .env");
    } else if (error.code === "P1002") {
      console.error("\n💡 Tip: Database connection timeout. Check if database file exists.");
    } else if (error.message.includes("ENOENT")) {
      console.error("\n💡 Tip: Database file not found. Run: npx prisma db push");
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixDatabase();

