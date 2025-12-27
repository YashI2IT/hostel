import express from "express";
import { prisma } from "../prisma";
import { complaintCreateSchema, complaintUpdateSchema } from "../utils/validation";

const router = express.Router();

// GET /complaints - Get all complaints (optionally filtered by status, roomId, studentId)
router.get("/", async (req, res) => {
  try {
    const { status, roomId, studentId } = req.query;

    const where: any = {};
    if (status) where.status = status as string;
    if (roomId) where.roomId = roomId as string;
    if (studentId) where.studentId = studentId as string;

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        room: {
          include: {
            property: {
              select: { id: true, name: true },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(complaints.map(complaint => ({
      id: complaint.id,
      category: complaint.category,
      description: complaint.description,
      status: complaint.status,
      roomId: complaint.roomId,
      roomNumber: complaint.room.roomNumber,
      room: {
        id: complaint.room.id,
        roomNumber: complaint.room.roomNumber,
        floorNumber: complaint.room.floorNumber,
        type: complaint.room.type,
        property: complaint.room.property,
      },
      studentId: complaint.studentId,
      student: complaint.student,
      createdAt: complaint.createdAt,
      resolvedAt: complaint.resolvedAt,
    })));
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
});

// GET /complaints/:id - Get single complaint
router.get("/:id", async (req, res) => {
  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: req.params.id },
      include: {
        room: {
          include: {
            property: true,
          },
        },
        student: true,
      },
    });

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    res.json({
      id: complaint.id,
      category: complaint.category,
      description: complaint.description,
      status: complaint.status,
      roomId: complaint.roomId,
      roomNumber: complaint.room.roomNumber,
      room: complaint.room,
      studentId: complaint.studentId,
      student: complaint.student,
      createdAt: complaint.createdAt,
      resolvedAt: complaint.resolvedAt,
    });
  } catch (err) {
    console.error("Error fetching complaint:", err);
    res.status(500).json({ error: "Failed to fetch complaint" });
  }
});

// POST /complaints - Create new complaint
router.post("/", async (req, res) => {
  const parse = complaintCreateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid input", details: parse.error.errors });
  }

  try {
    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: parse.data.roomId },
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Check if student exists (if provided)
    if (parse.data.studentId) {
      const student = await prisma.student.findUnique({
        where: { id: parse.data.studentId },
      });

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
    }

    const complaint = await prisma.complaint.create({
      data: {
        category: parse.data.category,
        description: parse.data.description,
        roomId: parse.data.roomId,
        studentId: parse.data.studentId || null,
        status: "OPEN",
      },
      include: {
        room: {
          include: {
            property: {
              select: { id: true, name: true },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
      },
    });

    res.status(201).json({
      id: complaint.id,
      category: complaint.category,
      description: complaint.description,
      status: complaint.status,
      roomId: complaint.roomId,
      roomNumber: complaint.room.roomNumber,
      room: complaint.room,
      studentId: complaint.studentId,
      student: complaint.student,
      createdAt: complaint.createdAt,
      resolvedAt: complaint.resolvedAt,
    });
  } catch (err) {
    console.error("Error creating complaint:", err);
    res.status(500).json({ error: "Failed to create complaint" });
  }
});

// PUT /complaints/:id - Update complaint
router.put("/:id", async (req, res) => {
  const parse = complaintUpdateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid input", details: parse.error.errors });
  }

  try {
    const updateData: any = {};
    if (parse.data.category !== undefined) updateData.category = parse.data.category;
    if (parse.data.description !== undefined) updateData.description = parse.data.description;
    if (parse.data.status !== undefined) {
      updateData.status = parse.data.status;
      if (parse.data.status === "RESOLVED") {
        updateData.resolvedAt = new Date();
      } else if (parse.data.status === "OPEN") {
        updateData.resolvedAt = null;
      }
    }

    const complaint = await prisma.complaint.update({
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
        student: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
      },
    });

    res.json({
      id: complaint.id,
      category: complaint.category,
      description: complaint.description,
      status: complaint.status,
      roomId: complaint.roomId,
      roomNumber: complaint.room.roomNumber,
      room: complaint.room,
      studentId: complaint.studentId,
      student: complaint.student,
      createdAt: complaint.createdAt,
      resolvedAt: complaint.resolvedAt,
    });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Complaint not found" });
    }
    console.error("Error updating complaint:", err);
    res.status(500).json({ error: "Failed to update complaint" });
  }
});

// DELETE /complaints/:id - Delete complaint
router.delete("/:id", async (req, res) => {
  try {
    await prisma.complaint.delete({
      where: { id: req.params.id },
    });

    res.status(204).end();
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Complaint not found" });
    }
    console.error("Error deleting complaint:", err);
    res.status(500).json({ error: "Failed to delete complaint" });
  }
});

export default router;

