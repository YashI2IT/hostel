import express from "express";
import { prisma } from "../prisma";
import { paymentCreateSchema } from "../utils/validation";

const router = express.Router();

// GET /payments - Get all payments (optionally filtered by bookingId)
router.get("/", async (req, res) => {
  try {
    const { bookingId } = req.query;

    const where: any = {};
    if (bookingId) where.bookingId = bookingId as string;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    res.json(payments.map(payment => ({
      id: payment.id,
      bookingId: payment.bookingId,
      booking: payment.booking,
      amount: payment.amount,
      date: payment.date,
      method: payment.method,
      transactionRef: payment.transactionRef,
    })));
  } catch (err) {
    console.error("Error fetching payments:", err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// GET /payments/:id - Get single payment
router.get("/:id", async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        booking: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json({
      id: payment.id,
      bookingId: payment.bookingId,
      booking: payment.booking,
      amount: payment.amount,
      date: payment.date,
      method: payment.method,
      transactionRef: payment.transactionRef,
    });
  } catch (err) {
    console.error("Error fetching payment:", err);
    res.status(500).json({ error: "Failed to fetch payment" });
  }
});

// POST /payments - Create new payment
router.post("/", async (req, res) => {
  const parse = paymentCreateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid input", details: parse.error.errors });
  }

  try {
    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: parse.data.bookingId },
      include: { payment: true },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check if payment already exists for this booking
    if (booking.payment) {
      return res.status(409).json({ error: "Payment already exists for this booking" });
    }

    // Validate payment amount matches booking total
    if (parse.data.amount !== booking.totalAmount) {
      return res.status(400).json({ 
        error: "Payment amount does not match booking total",
        expected: booking.totalAmount,
        received: parse.data.amount,
      });
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId: parse.data.bookingId,
        amount: parse.data.amount,
        method: parse.data.method,
        transactionRef: parse.data.transactionRef,
        date: new Date(),
      },
      include: {
        booking: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(payment);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Payment already exists for this booking" });
    }
    console.error("Error creating payment:", err);
    res.status(500).json({ error: "Failed to create payment" });
  }
});

// PUT /payments/:id - Update payment
router.put("/:id", async (req, res) => {
  try {
    const { method, transactionRef } = req.body;

    const updateData: any = {};
    if (method) {
      if (!["UPI_REQUEST", "QR_SCAN", "CASH_OFFLINE"].includes(method)) {
        return res.status(400).json({ error: "Invalid payment method" });
      }
      updateData.method = method;
    }
    if (transactionRef !== undefined) updateData.transactionRef = transactionRef;

    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        booking: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    res.json(payment);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Payment not found" });
    }
    console.error("Error updating payment:", err);
    res.status(500).json({ error: "Failed to update payment" });
  }
});

// DELETE /payments/:id - Delete payment
router.delete("/:id", async (req, res) => {
  try {
    await prisma.payment.delete({
      where: { id: req.params.id },
    });

    res.status(204).end();
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Payment not found" });
    }
    console.error("Error deleting payment:", err);
    res.status(500).json({ error: "Failed to delete payment" });
  }
});

export default router;

