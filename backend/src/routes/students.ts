import express from "express";
import { prisma } from "../prisma";
import { studentCreateSchema, studentUpdateSchema } from "../utils/validation";

const router = express.Router();

// GET /students - Get all students (optionally filtered by isActive)
router.get("/", async (req, res) => {
  try {
    const { isActive } = req.query;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        assignedBed: {
          include: {
            room: {
              include: {
                property: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        bookings: {
          include: {
            payment: true,
          },
          orderBy: { startDate: "desc" },
        },
        complaints: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(students.map(student => ({
      id: student.id,
      name: student.name,
      age: student.age,
      phoneNumber: student.phoneNumber,
      email: student.email,
      emergencyContact: student.emergencyContact,
      address: student.address,
      isActive: student.isActive,
      bedId: student.assignedBed?.id,
      roomId: student.assignedBed?.roomId,
      floorId: student.assignedBed?.room ? `floor-${student.assignedBed.room.floorNumber}` : undefined,
      propertyId: student.assignedBed?.room?.propertyId,
      assignedBed: student.assignedBed ? {
        id: student.assignedBed.id,
        label: student.assignedBed.label,
        status: student.assignedBed.status,
        room: {
          id: student.assignedBed.room.id,
          roomNumber: student.assignedBed.room.roomNumber,
          floorNumber: student.assignedBed.room.floorNumber,
          type: student.assignedBed.room.type,
          property: student.assignedBed.room.property,
        },
      } : null,
      bookings: student.bookings,
      complaints: student.complaints,
      createdAt: student.createdAt,
    })));
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// GET /students/:id - Get single student
router.get("/:id", async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        assignedBed: {
          include: {
            room: {
              include: {
                property: true,
              },
            },
          },
        },
        bookings: {
          include: {
            payment: true,
          },
          orderBy: { startDate: "desc" },
        },
        complaints: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({
      id: student.id,
      name: student.name,
      age: student.age,
      phoneNumber: student.phoneNumber,
      email: student.email,
      emergencyContact: student.emergencyContact,
      address: student.address,
      isActive: student.isActive,
      assignedBed: student.assignedBed,
      bookings: student.bookings,
      complaints: student.complaints,
      createdAt: student.createdAt,
    });
  } catch (err) {
    console.error("Error fetching student:", err);
    res.status(500).json({ error: "Failed to fetch student" });
  }
});

// POST /students - Create new student
router.post("/", async (req, res) => {
  const parse = studentCreateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid input", details: parse.error.errors });
  }

  try {
    // Check if phone number already exists
    const existing = await prisma.student.findUnique({
      where: { phoneNumber: parse.data.phoneNumber },
    });

    if (existing) {
      return res.status(409).json({ error: "Student with this phone number already exists" });
    }

    const student = await prisma.student.create({
      data: {
        name: parse.data.name,
        age: parse.data.age,
        phoneNumber: parse.data.phoneNumber,
        email: parse.data.email || null,
        emergencyContact: parse.data.emergencyContact,
        address: parse.data.address || null,
        isActive: parse.data.isActive !== undefined ? parse.data.isActive : true,
      },
      include: {
        assignedBed: {
          include: {
            room: {
              include: {
                property: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      id: student.id,
      name: student.name,
      age: student.age,
      phoneNumber: student.phoneNumber,
      email: student.email,
      emergencyContact: student.emergencyContact,
      address: student.address,
      isActive: student.isActive,
      assignedBed: student.assignedBed,
      createdAt: student.createdAt,
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Student with this phone number already exists" });
    }
    console.error("Error creating student:", err);
    res.status(500).json({ error: "Failed to create student" });
  }
});

// PUT /students/:id - Update student
router.put("/:id", async (req, res) => {
  const parse = studentUpdateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid input", details: parse.error.errors });
  }

  try {
    const updateData: any = {};
    if (parse.data.name !== undefined) updateData.name = parse.data.name;
    if (parse.data.age !== undefined) updateData.age = parse.data.age;
    if (parse.data.phoneNumber !== undefined) updateData.phoneNumber = parse.data.phoneNumber;
    if (parse.data.email !== undefined) updateData.email = parse.data.email || null;
    if (parse.data.emergencyContact !== undefined) updateData.emergencyContact = parse.data.emergencyContact;
    if (parse.data.address !== undefined) updateData.address = parse.data.address || null;
    if (parse.data.isActive !== undefined) updateData.isActive = parse.data.isActive;

    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        assignedBed: {
          include: {
            room: {
              include: {
                property: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    res.json({
      id: student.id,
      name: student.name,
      age: student.age,
      phoneNumber: student.phoneNumber,
      email: student.email,
      emergencyContact: student.emergencyContact,
      address: student.address,
      isActive: student.isActive,
      assignedBed: student.assignedBed,
    });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Student not found" });
    }
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Student with this phone number already exists" });
    }
    console.error("Error updating student:", err);
    res.status(500).json({ error: "Failed to update student" });
  }
});

// DELETE /students/:id - Delete student (soft delete by setting isActive to false)
router.delete("/:id", async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        assignedBed: true,
      },
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // If student has an assigned bed, unassign it
    if (student.assignedBed) {
      await prisma.bed.update({
        where: { id: student.assignedBed.id },
        data: {
          currentStudentId: null,
          status: "AVAILABLE",
        },
      });
    }

    // Soft delete by setting isActive to false
    await prisma.student.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.status(204).end();
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Student not found" });
    }
    console.error("Error deleting student:", err);
    res.status(500).json({ error: "Failed to delete student" });
  }
});

export default router;

