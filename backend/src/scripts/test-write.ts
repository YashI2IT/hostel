/**
 * Test database write operations
 */

import { PrismaClient } from "../../generated/prisma";

const prisma = new PrismaClient();

async function testWrite() {
  try {
    console.log("Testing database write operations...\n");
    
    // Test 1: Create a test property
    console.log("1. Creating test property...");
    const property = await prisma.property.create({
      data: {
        name: "Test Property",
        address: "Test Address",
        totalFloors: 1,
      },
    });
    console.log("✅ Property created:", property.id);
    
    // Test 2: Update the property
    console.log("\n2. Updating property...");
    const updated = await prisma.property.update({
      where: { id: property.id },
      data: { name: "Updated Test Property" },
    });
    console.log("✅ Property updated:", updated.name);
    
    // Test 3: Delete the property
    console.log("\n3. Deleting test property...");
    await prisma.property.delete({
      where: { id: property.id },
    });
    console.log("✅ Property deleted");
    
    // Test 4: Count operations
    console.log("\n4. Counting records...");
    const counts = {
      users: await prisma.user.count(),
      properties: await prisma.property.count(),
      rooms: await prisma.room.count(),
      beds: await prisma.bed.count(),
      students: await prisma.student.count(),
    };
    console.log("✅ Counts:", counts);
    
    console.log("\n✅ All write operations successful!");
    
  } catch (error: any) {
    console.error("\n❌ Write operation failed!");
    console.error("Error:", error.message);
    console.error("Code:", error.code);
    console.error("Details:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testWrite();

