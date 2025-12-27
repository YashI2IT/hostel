import express from "express";
import { prisma } from "../prisma";
import { bookingCreateSchema, bookingUpdateSchema } from "../utils/validation";

const router = express.Router();

// GET /bookings - Get all bookings (optionally filtered by studentId)
router.get("/", async (req, res) => {
  try {
    const { studentId } = req.query;

    const where: any = {};
    if (studentId) where.studentId = studentId as string;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            email: true,
          },
        },
        payment: true,
      },
      orderBy: { startDate: "desc" },
    });

    res.json(bookings.map(booking => ({
      id: booking.id,
      studentId: booking.studentId,
      student: booking.student,
      frequency: booking.frequency,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalAmount: booking.totalAmount,
      payment: booking.payment,
      createdAt: booking.createdAt,
    })));
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// GET /bookings/:id - Get single booking
router.get("/:id", async (req, res) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        student: true,
        payment: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({
      id: booking.id,
      studentId: booking.studentId,
      student: booking.student,
      frequency: booking.frequency,
      startDate: booking.startDate,
      endDate: booking.endDate,
      totalAmount: booking.totalAmount,
      payment: booking.payment,
      createdAt: booking.createdAt,
    });
  } catch (err) {
    console.error("Error fetching booking:", err);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
});

// POST /bookings - Create new booking
router.post("/", async (req, res) => {
  const parse = bookingCreateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid input", details: parse.error.errors });
  }

  try {
    const startDate = new Date(parse.data.startDate);
    const endDate = new Date(parse.data.endDate);

    if (startDate >= endDate) {
      return res.status(400).json({ error: "startDate must be before endDate" });
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: parse.data.studentId },
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Check for overlapping bookings for the same student
    const overlapping = await prisma.booking.findFirst({
      where: {
        studentId: parse.data.studentId,
        AND: [
          { startDate: { lt: endDate } },
          { endDate: { gt: startDate } },
        ],
      },
    });

    if (overlapping) {
      return res.status(409).json({ error: "Student already has a booking for the selected dates" });
    }

    const booking = await prisma.booking.create({
      data: {
        studentId: parse.data.studentId,
        frequency: parse.data.frequency,
        startDate,
        endDate,
        totalAmount: parse.data.totalAmount,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
      },
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// PUT /bookings/:id - Update booking
router.put("/:id", async (req, res) => {
  const parse = bookingUpdateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid input", details: parse.error.errors });
  }

  try {
    const updateData: any = {};
    if (parse.data.frequency !== undefined) updateData.frequency = parse.data.frequency;
    if (parse.data.totalAmount !== undefined) updateData.totalAmount = parse.data.totalAmount;

    if (parse.data.startDate !== undefined) {
      updateData.startDate = new Date(parse.data.startDate);
    }
    if (parse.data.endDate !== undefined) {
      updateData.endDate = new Date(parse.data.endDate);
    }

    // Validate dates if both are being updated
    if (updateData.startDate && updateData.endDate) {
      if (updateData.startDate >= updateData.endDate) {
        return res.status(400).json({ error: "startDate must be before endDate" });
      }
    }

    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        payment: true,
      },
    });

    res.json(booking);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Booking not found" });
    }
    console.error("Error updating booking:", err);
    res.status(500).json({ error: "Failed to update booking" });
  }
});

// DELETE /bookings/:id - Delete booking
router.delete("/:id", async (req, res) => {
  try {
    // Check if booking has payment
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { payment: true },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // If payment exists, delete it first (due to foreign key constraint)
    if (booking.payment) {
      await prisma.payment.delete({
        where: { bookingId: req.params.id },
      });
    }

    await prisma.booking.delete({
      where: { id: req.params.id },
    });

    res.status(204).end();
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Booking not found" });
    }
    console.error("Error deleting booking:", err);
    res.status(500).json({ error: "Failed to delete booking" });
  }
});

export default router;
