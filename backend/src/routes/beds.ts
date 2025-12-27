import express from "express";
import { prisma } from "../prisma";
import { bedCreateSchema, bedUpdateSchema } from "../utils/validation";

const router = express.Router();

// GET /beds - Get all beds (optionally filtered by roomId)
router.get("/", async (req, res) => {
  try {
    const { roomId } = req.query;

    const where: any = {};
    if (roomId) where.roomId = roomId as string;

    const beds = await prisma.bed.findMany({
      where,
      include: {
        room: {
          include: {
            property: {
              select: { id: true, name: true },
            },
          },
        },
        currentStudent: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            email: true,
            age: true,
          },
        },
      },
      orderBy: [{ room: { floorNumber: "asc" } }, { room: { roomNumber: "asc" } }, { label: "asc" }],
    });

    res.json(beds.map(bed => ({
      id: bed.id,
      label: bed.label,
      status: bed.status,
      roomId: bed.roomId,
      room: {
        id: bed.room.id,
        roomNumber: bed.room.roomNumber,
        floorNumber: bed.room.floorNumber,
        type: bed.room.type,
        property: bed.room.property,
      },
      currentStudentId: bed.currentStudentId,
      currentStudent: bed.currentStudent,
    })));
  } catch (err) {
    console.error("Error fetching beds:", err);
    res.status(500).json({ error: "Failed to fetch beds" });
  }
});

// GET /beds/:id - Get single bed
router.get("/:id", async (req, res) => {
  try {
    const bed = await prisma.bed.findUnique({
      where: { id: req.params.id },
      include: {
        room: {
          include: {
            property: true,
          },
        },
        currentStudent: true,
      },
    });

    if (!bed) {
      return res.status(404).json({ error: "Bed not found" });
    }

    res.json({
      id: bed.id,
      label: bed.label,
      status: bed.status,
      roomId: bed.roomId,
      room: bed.room,
      currentStudentId: bed.currentStudentId,
      currentStudent: bed.currentStudent,
    });
  } catch (err) {
    console.error("Error fetching bed:", err);
    res.status(500).json({ error: "Failed to fetch bed" });
  }
});

// POST /beds - Create new bed
router.post("/", async (req, res) => {
  const parse = bedCreateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid input", details: parse.error.errors });
  }

  try {
    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: parse.data.roomId },
      include: { beds: true },
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Check if bed count exceeds room capacity
    if (room.beds.length >= room.capacity) {
      return res.status(400).json({ error: "Room capacity reached" });
    }

    const bed = await prisma.bed.create({
      data: {
        label: parse.data.label,
        roomId: parse.data.roomId,
        status: parse.data.status || "AVAILABLE",
      },
      include: {
        room: {
          include: {
            property: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    res.status(201).json({
      id: bed.id,
      label: bed.label,
      status: bed.status,
      roomId: bed.roomId,
      room: bed.room,
      currentStudentId: bed.currentStudentId,
    });
  } catch (err) {
    console.error("Error creating bed:", err);
    res.status(500).json({ error: "Failed to create bed" });
  }
});

// PUT /beds/:id - Update bed
router.put("/:id", async (req, res) => {
  const parse = bedUpdateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid input", details: parse.error.errors });
  }

  try {
    const updateData: any = {};
    if (parse.data.label !== undefined) updateData.label = parse.data.label;
    if (parse.data.status !== undefined) updateData.status = parse.data.status;
    if (parse.data.currentStudentId !== undefined) {
      updateData.currentStudentId = parse.data.currentStudentId;

      // If assigning a student, set status to OCCUPIED
      if (parse.data.currentStudentId) {
        updateData.status = "OCCUPIED";
      } else {
        // If unassigning, set status to AVAILABLE
        updateData.status = "AVAILABLE";
      }
    }

    const bed = await prisma.bed.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        room: {
          include: {
            property: {
              select: { id: true, name: true },
            },
          },
        },
        currentStudent: true,
      },
    });

    res.json({
      id: bed.id,
      label: bed.label,
      status: bed.status,
      roomId: bed.roomId,
      room: bed.room,
      currentStudentId: bed.currentStudentId,
      currentStudent: bed.currentStudent,
    });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Bed not found" });
    }
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Bed is already assigned to another student" });
    }
    console.error("Error updating bed:", err);
    res.status(500).json({ error: "Failed to update bed" });
  }
});

// DELETE /beds/:id - Delete bed
router.delete("/:id", async (req, res) => {
  try {
    const bed = await prisma.bed.findUnique({
      where: { id: req.params.id },
    });

    if (!bed) {
      return res.status(404).json({ error: "Bed not found" });
    }

    if (bed.status === "OCCUPIED") {
      return res.status(400).json({ error: "Cannot delete occupied bed" });
    }

    await prisma.bed.delete({
      where: { id: req.params.id },
    });

    res.status(204).end();
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Bed not found" });
    }
    console.error("Error deleting bed:", err);
    res.status(500).json({ error: "Failed to delete bed" });
  }
});

export default router;

