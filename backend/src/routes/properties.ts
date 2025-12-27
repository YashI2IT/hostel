import express from "express";
import { prisma } from "../prisma";
import { propertyCreateSchema, propertyUpdateSchema } from "../utils/validation";

const router = express.Router();

// GET /properties - Get all properties
router.get("/", async (_req, res) => {
  try {
    const properties = await prisma.property.findMany({
      include: {
        rooms: {
          include: {
            beds: {
              include: {
                currentStudent: {
                  select: {
                    id: true,
                    name: true,
                    phoneNumber: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform to match frontend structure (group rooms by floor)
    const transformed = properties.map(property => {
      const floorsMap = new Map<number, any[]>();
      
      property.rooms.forEach(room => {
        if (!floorsMap.has(room.floorNumber)) {
          floorsMap.set(room.floorNumber, []);
        }
        floorsMap.get(room.floorNumber)!.push({
          id: room.id,
          number: room.roomNumber,
          floorId: `floor-${room.floorNumber}`,
          beds: room.beds.map(bed => ({
            id: bed.id,
            number: bed.label,
            roomId: room.id,
            isOccupied: bed.status === "OCCUPIED",
            resident: bed.currentStudent ? {
              id: bed.currentStudent.id,
              name: bed.currentStudent.name,
              phoneNumber: bed.currentStudent.phoneNumber,
              email: bed.currentStudent.email,
            } : undefined,
          })),
        });
      });

      const floors = Array.from(floorsMap.entries()).map(([floorNumber, rooms]) => ({
        id: `floor-${floorNumber}`,
        number: floorNumber,
        propertyId: property.id,
        rooms,
      }));

      return {
        id: property.id,
        name: property.name,
        address: property.address || "",
        tenantId: property.id, // Using property ID as tenant ID for now
        floors,
      };
    });

    res.json(transformed);
  } catch (err) {
    console.error("Error fetching properties:", err);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

// GET /properties/:id - Get single property
router.get("/:id", async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: {
        rooms: {
          include: {
            beds: {
              include: {
                currentStudent: true,
              },
            },
          },
        },
      },
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Transform similar to GET /properties
    const floorsMap = new Map<number, any[]>();
    
    property.rooms.forEach(room => {
      if (!floorsMap.has(room.floorNumber)) {
        floorsMap.set(room.floorNumber, []);
      }
      floorsMap.get(room.floorNumber)!.push({
        id: room.id,
        number: room.roomNumber,
        floorId: `floor-${room.floorNumber}`,
        beds: room.beds.map(bed => ({
          id: bed.id,
          number: bed.label,
          roomId: room.id,
          isOccupied: bed.status === "OCCUPIED",
          resident: bed.currentStudent ? {
            id: bed.currentStudent.id,
            name: bed.currentStudent.name,
            phoneNumber: bed.currentStudent.phoneNumber,
            email: bed.currentStudent.email,
          } : undefined,
        })),
      });
    });

    const floors = Array.from(floorsMap.entries()).map(([floorNumber, rooms]) => ({
      id: `floor-${floorNumber}`,
      number: floorNumber,
      propertyId: property.id,
      rooms,
    }));

    res.json({
      id: property.id,
      name: property.name,
      address: property.address || "",
      tenantId: property.id,
      floors,
    });
  } catch (err) {
    console.error("Error fetching property:", err);
    res.status(500).json({ error: "Failed to fetch property" });
  }
});

// POST /properties - Create new property
router.post("/", async (req, res) => {
  const parse = propertyCreateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid input", details: parse.error.errors });
  }

  try {
    const property = await prisma.property.create({
      data: {
        name: parse.data.name,
        address: parse.data.address || null,
        totalFloors: parse.data.totalFloors || 1,
      },
      include: {
        rooms: true,
      },
    });

    res.status(201).json({
      id: property.id,
      name: property.name,
      address: property.address || "",
      tenantId: property.id,
      floors: [],
    });
  } catch (err) {
    console.error("Error creating property:", err);
    res.status(500).json({ error: "Failed to create property" });
  }
});

// PUT /properties/:id - Update property
router.put("/:id", async (req, res) => {
  const parse = propertyUpdateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid input", details: parse.error.errors });
  }

  try {
    const property = await prisma.property.update({
      where: { id: req.params.id },
      data: parse.data,
    });

    res.json({
      id: property.id,
      name: property.name,
      address: property.address || "",
      tenantId: property.id,
    });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Property not found" });
    }
    console.error("Error updating property:", err);
    res.status(500).json({ error: "Failed to update property" });
  }
});

// DELETE /properties/:id - Delete property
router.delete("/:id", async (req, res) => {
  try {
    await prisma.property.delete({
      where: { id: req.params.id },
    });

    res.status(204).end();
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Property not found" });
    }
    console.error("Error deleting property:", err);
    res.status(500).json({ error: "Failed to delete property" });
  }
});

export default router;

