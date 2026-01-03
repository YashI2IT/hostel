import express from "express";
import { prisma } from "../prisma";
import { roomCreateSchema, roomUpdateSchema } from "../utils/validation";

const router = express.Router();

// GET /rooms - Get all rooms (optionally filtered by propertyId or floorNumber)
router.get("/", async (req, res) => {
  try {
    const { propertyId, floorNumber } = req.query;

    const where: any = {};
    if (propertyId) where.propertyId = propertyId as string;
    if (floorNumber) where.floorNumber = parseInt(floorNumber as string);

    const rooms = await prisma.room.findMany({
      where,
      include: {
        property: {
          select: { id: true, name: true },
        },
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
        complaints: {
          where: { status: "OPEN" },
          select: { id: true, category: true, description: true },
        },
      },
      orderBy: [{ floorNumber: "asc" }, { roomNumber: "asc" }],
    });

    res.json(rooms.map(room => ({
      id: room.id,
      roomNumber: room.roomNumber,
      floorNumber: room.floorNumber,
      type: room.type,
      capacity: room.capacity,
      propertyId: room.propertyId,
      property: room.property,
      beds: room.beds.map(bed => ({
        id: bed.id,
        label: bed.label,
        status: bed.status,
        roomId: bed.roomId,
        currentStudentId: bed.currentStudentId,
        currentStudent: bed.currentStudent,
      })),
      complaints: room.complaints,
    })));
  } catch (err) {
    console.error("Error fetching rooms:", err);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

// GET /rooms/:id - Get single room
router.get("/:id", async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: {
        property: {
          select: { id: true, name: true, address: true },
        },
        beds: {
          include: {
            currentStudent: true,
          },
        },
        complaints: true,
      },
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    res.json({
      id: room.id,
      roomNumber: room.roomNumber,
      floorNumber: room.floorNumber,
      type: room.type,
      capacity: room.capacity,
      propertyId: room.propertyId,
      property: room.property,
      beds: room.beds,
      complaints: room.complaints,
    });
  } catch (err) {
    console.error("Error fetching room:", err);
    res.status(500).json({ error: "Failed to fetch room" });
  }
});

// POST /rooms - Create new room
router.post("/", async (req, res) => {
  const parse = roomCreateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid input", details: parse.error.errors });
  }

  try {
    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: parse.data.propertyId },
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Check if room number already exists in this property
    const existing = await prisma.room.findUnique({
      where: {
        propertyId_roomNumber: {
          propertyId: parse.data.propertyId,
          roomNumber: parse.data.roomNumber,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ error: "Room number already exists in this property" });
    }

    const room = await prisma.room.create({
      data: {
        roomNumber: parse.data.roomNumber,
        floorNumber: parse.data.floorNumber,
        type: parse.data.type,
        capacity: parse.data.capacity,
        propertyId: parse.data.propertyId,
      },
      include: {
        property: {
          select: { id: true, name: true },
        },
        beds: true,
      },
    });

    res.status(201).json({
      id: room.id,
      roomNumber: room.roomNumber,
      floorNumber: room.floorNumber,
      type: room.type,
      capacity: room.capacity,
      propertyId: room.propertyId,
      property: room.property,
      beds: room.beds,
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Room number already exists in this property" });
    }
    console.error("Error creating room:", err);
    res.status(500).json({ error: "Failed to create room" });
  }
});

// PUT /rooms/:id - Update room
router.put("/:id", async (req, res) => {
  const parse = roomUpdateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid input", details: parse.error.errors });
  }

  try {
    // Get current room with beds
    const currentRoom = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: { beds: true },
    });

    if (!currentRoom) {
      return res.status(404).json({ error: "Room not found" });
    }

    const updateData: any = {};
    if (parse.data.roomNumber !== undefined) updateData.roomNumber = parse.data.roomNumber;
    if (parse.data.floorNumber !== undefined) updateData.floorNumber = parse.data.floorNumber;
    if (parse.data.type !== undefined) updateData.type = parse.data.type;
    if (parse.data.capacity !== undefined) updateData.capacity = parse.data.capacity;
    if (parse.data.propertyId !== undefined) updateData.propertyId = parse.data.propertyId;

    // Handle bed count changes
    if (parse.data.capacity !== undefined) {
      const currentBedCount = currentRoom.beds.length;
      const newBedCount = parse.data.capacity;

      if (newBedCount > currentBedCount) {
        // Add new beds
        const bedsToAdd = newBedCount - currentBedCount;
        const existingLabels = currentRoom.beds.map(b => b.label);
        
        for (let i = 0; i < bedsToAdd; i++) {
          // Find next available label (A, B, C, ...)
          let label = String.fromCharCode(65 + currentBedCount + i);
          // If label exists, find next available
          while (existingLabels.includes(label)) {
            label = String.fromCharCode(label.charCodeAt(0) + 1);
          }
          
          await prisma.bed.create({
            data: {
              label,
              roomId: req.params.id,
              status: "AVAILABLE",
            },
          });
        }
      } else if (newBedCount < currentBedCount) {
        // Remove unoccupied beds (from the end)
        const bedsToRemove = currentBedCount - newBedCount;
        const unoccupiedBeds = currentRoom.beds
          .filter(b => b.status !== "OCCUPIED")
          .sort((a, b) => b.label.localeCompare(a.label)); // Sort descending to remove from end

        if (unoccupiedBeds.length < bedsToRemove) {
          return res.status(400).json({ 
            error: `Cannot reduce bed count. ${currentRoom.beds.filter(b => b.status === "OCCUPIED").length} beds are occupied.` 
          });
        }

        for (let i = 0; i < bedsToRemove; i++) {
          await prisma.bed.delete({
            where: { id: unoccupiedBeds[i].id },
          });
        }
      }
    }

    const room = await prisma.room.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        property: {
          select: { id: true, name: true },
        },
        beds: {
          include: {
            currentStudent: {
              select: { id: true, name: true, phoneNumber: true, email: true },
            },
          },
        },
      },
    });

    res.json({
      id: room.id,
      roomNumber: room.roomNumber,
      floorNumber: room.floorNumber,
      type: room.type,
      capacity: room.capacity,
      propertyId: room.propertyId,
      property: room.property,
      beds: room.beds,
    });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Room not found" });
    }
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Room number already exists in this property" });
    }
    console.error("Error updating room:", err);
    res.status(500).json({ error: "Failed to update room" });
  }
});

// DELETE /rooms/:id - Delete room
router.delete("/:id", async (req, res) => {
  try {
    // Check if room has occupied beds
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: {
        beds: {
          where: { status: "OCCUPIED" },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (room.beds.length > 0) {
      return res.status(400).json({ error: "Cannot delete room with occupied beds" });
    }

    await prisma.room.delete({
      where: { id: req.params.id },
    });

    res.status(204).end();
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Room not found" });
    }
    console.error("Error deleting room:", err);
    res.status(500).json({ error: "Failed to delete room" });
  }
});

export default router;
