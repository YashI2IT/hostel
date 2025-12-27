import express from "express";
import { prisma } from "../prisma";
import { onboardingSchema } from "../utils/validation";

const router = express.Router();

// POST /onboarding - Complete onboarding process (creates student, booking, payment, and assigns bed)
router.post("/", async (req, res) => {
  const parse = onboardingSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid input", details: parse.error.errors });
  }

  try {
    const {
      name,
      age,
      phoneNumber,
      email,
      emergencyContact,
      address,
      bedId,
      frequency,
      startDate,
      endDate,
      totalAmount,
      paymentMethod,
      transactionRef,
    } = parse.data;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return res.status(400).json({ error: "startDate must be before endDate" });
    }

    // Check if bed exists and is available
    const bed = await prisma.bed.findUnique({
      where: { id: bedId },
      include: {
        room: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!bed) {
      return res.status(404).json({ error: "Bed not found" });
    }

    if (bed.status === "OCCUPIED") {
      return res.status(409).json({ error: "Bed is already occupied" });
    }

    // Check if phone number already exists
    const existingStudent = await prisma.student.findUnique({
      where: { phoneNumber },
    });

    if (existingStudent) {
      return res.status(409).json({ error: "Student with this phone number already exists" });
    }

    // Create everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create student
      const student = await tx.student.create({
        data: {
          name,
          age,
          phoneNumber,
          email: email || null,
          emergencyContact,
          address: address || null,
          isActive: true,
        },
      });

      // 2. Assign bed to student
      await tx.bed.update({
        where: { id: bedId },
        data: {
          currentStudentId: student.id,
          status: "OCCUPIED",
        },
      });

      // 3. Create booking
      const booking = await tx.booking.create({
        data: {
          studentId: student.id,
          frequency,
          startDate: start,
          endDate: end,
          totalAmount,
        },
      });

      // 4. Create payment
      const payment = await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: totalAmount,
          method: paymentMethod,
          transactionRef: transactionRef || null,
          date: new Date(),
        },
      });

      // 5. Fetch complete data
      const completeStudent = await tx.student.findUnique({
        where: { id: student.id },
        include: {
          assignedBed: {
            include: {
              room: {
                include: {
                  property: {
                    select: { id: true, name: true, address: true },
                  },
                },
              },
            },
          },
          bookings: {
            include: {
              payment: true,
            },
          },
        },
      });

      return {
        student: completeStudent,
        booking,
        payment,
      };
    });

    res.status(201).json({
      student: {
        id: result.student!.id,
        name: result.student!.name,
        age: result.student!.age,
        phoneNumber: result.student!.phoneNumber,
        email: result.student!.email,
        emergencyContact: result.student!.emergencyContact,
        address: result.student!.address,
        isActive: result.student!.isActive,
        bedId: result.student!.assignedBed?.id,
        roomId: result.student!.assignedBed?.roomId,
        floorId: result.student!.assignedBed?.room
          ? `floor-${result.student!.assignedBed.room.floorNumber}`
          : undefined,
        propertyId: result.student!.assignedBed?.room?.propertyId,
        assignedBed: result.student!.assignedBed,
        bookings: result.student!.bookings,
      },
      booking: result.booking,
      payment: result.payment,
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Student with this phone number already exists" });
    }
    console.error("Error during onboarding:", err);
    res.status(500).json({ error: "Failed to complete onboarding" });
  }
});

export default router;

