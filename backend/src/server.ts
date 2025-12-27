import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { prisma } from "./prisma";

import authRoutes from "./routes/auth";
import propertyRoutes from "./routes/properties";
import roomRoutes from "./routes/rooms";
import bedRoutes from "./routes/beds";
import studentRoutes from "./routes/students";
import bookingRoutes from "./routes/bookings";
import paymentRoutes from "./routes/payments";
import complaintRoutes from "./routes/complaints";
import onboardingRoutes from "./routes/onboarding";
import dashboardRoutes from "./routes/dashboard";

dotenv.config();

const app = express();
app.use(express.json());

// CORS: restrict to FRONTEND_URL in .env
const frontendOrigin = process.env.FRONTEND_URL || "*";
app.use(cors({ origin: frontendOrigin }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/beds", bedRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check
app.get("/", (_req, res) => res.json({ message: "Hostel Hub API is running" }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Database health check
app.get("/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
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
    res.json({ status: "connected", counts });
  } catch (error: any) {
    res.status(500).json({ status: "error", error: error.message });
  }
});

if (process.env.FRONTEND_BUILD === "true") {
  const frontendDist = path.resolve(__dirname, "..", "..", "frontend-web", "dist");
  app.use(express.static(frontendDist));
  app.get("*", (_req, res) => res.sendFile(path.join(frontendDist, "index.html")));
}

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Server listening on http://localhost:${port}`);
  console.log(`📚 API available at http://localhost:${port}/api`);
});

// graceful shutdown
const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log("Server closed");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
