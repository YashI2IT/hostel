import express from "express";
import { prisma } from "../prisma";

const router = express.Router();

// GET /dashboard/stats - Get dashboard statistics
router.get("/stats", async (_req, res) => {
  try {
    // Get all properties
    const properties = await prisma.property.findMany({
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

    // Calculate statistics
    let totalBeds = 0;
    let occupiedBeds = 0;
    let availableBeds = 0;
    let maintenanceBeds = 0;
    let totalRooms = 0;
    let totalStudents = 0;
    let activeStudents = 0;

    properties.forEach(property => {
      property.rooms.forEach(room => {
        totalRooms++;
        room.beds.forEach(bed => {
          totalBeds++;
          if (bed.status === "OCCUPIED") {
            occupiedBeds++;
            if (bed.currentStudent?.isActive) {
              totalStudents++;
              activeStudents++;
            }
          } else if (bed.status === "AVAILABLE") {
            availableBeds++;
          } else if (bed.status === "MAINTENANCE") {
            maintenanceBeds++;
          }
        });
      });
    });

    // Get complaints statistics
    const totalComplaints = await prisma.complaint.count();
    const openComplaints = await prisma.complaint.count({
      where: { status: "OPEN" },
    });
    const resolvedComplaints = await prisma.complaint.count({
      where: { status: "RESOLVED" },
    });

    // Get bookings statistics
    const totalBookings = await prisma.booking.count();
    const activeBookings = await prisma.booking.count({
      where: {
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });

    // Get payments statistics
    const totalPayments = await prisma.payment.count();
    const totalRevenue = await prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
    });

    // Get recent complaints
    const recentComplaints = await prisma.complaint.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        room: {
          select: {
            id: true,
            roomNumber: true,
            floorNumber: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get recent students
    const recentStudents = await prisma.student.findMany({
      take: 5,
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        assignedBed: {
          include: {
            room: {
              select: {
                id: true,
                roomNumber: true,
                floorNumber: true,
                property: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    res.json({
      occupancy: {
        totalBeds,
        occupiedBeds,
        availableBeds,
        maintenanceBeds,
        occupancyRate: totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0,
      },
      rooms: {
        total: totalRooms,
      },
      students: {
        total: totalStudents,
        active: activeStudents,
        inactive: totalStudents - activeStudents,
      },
      complaints: {
        total: totalComplaints,
        open: openComplaints,
        resolved: resolvedComplaints,
        recent: recentComplaints.map(c => ({
          id: c.id,
          category: c.category,
          description: c.description,
          status: c.status,
          roomNumber: c.room.roomNumber,
          studentName: c.student?.name,
          createdAt: c.createdAt,
        })),
      },
      bookings: {
        total: totalBookings,
        active: activeBookings,
      },
      payments: {
        total: totalPayments,
        totalRevenue: totalRevenue._sum.amount || 0,
      },
      recentStudents: recentStudents.map(s => ({
        id: s.id,
        name: s.name,
        phoneNumber: s.phoneNumber,
        email: s.email,
        roomNumber: s.assignedBed?.room.roomNumber,
        floorNumber: s.assignedBed?.room.floorNumber,
        propertyName: s.assignedBed?.room.property.name,
        createdAt: s.createdAt,
      })),
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
});

// GET /dashboard/occupancy - Get detailed occupancy by floor
router.get("/occupancy", async (req, res) => {
  try {
    const { propertyId } = req.query;

    const where: any = {};
    if (propertyId) where.propertyId = propertyId as string;

    const properties = await prisma.property.findMany({
      where: propertyId ? { id: propertyId as string } : undefined,
      include: {
        rooms: {
          include: {
            beds: {
              include: {
                currentStudent: {
                  select: {
                    id: true,
                    name: true,
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const occupancyByFloor: any = {};

    properties.forEach(property => {
      property.rooms.forEach(room => {
        const floorKey = `floor-${room.floorNumber}`;
        if (!occupancyByFloor[floorKey]) {
          occupancyByFloor[floorKey] = {
            floorNumber: room.floorNumber,
            propertyId: property.id,
            propertyName: property.name,
            rooms: [],
            totalBeds: 0,
            occupiedBeds: 0,
            availableBeds: 0,
          };
        }

        const floor = occupancyByFloor[floorKey];
        const roomBeds = room.beds.length;
        const occupiedRoomBeds = room.beds.filter(b => b.status === "OCCUPIED").length;

        floor.rooms.push({
          id: room.id,
          roomNumber: room.roomNumber,
          type: room.type,
          capacity: room.capacity,
          totalBeds: roomBeds,
          occupiedBeds: occupiedRoomBeds,
          availableBeds: roomBeds - occupiedRoomBeds,
        });

        floor.totalBeds += roomBeds;
        floor.occupiedBeds += occupiedRoomBeds;
        floor.availableBeds += (roomBeds - occupiedRoomBeds);
      });
    });

    res.json({
      properties: Object.values(occupancyByFloor),
    });
  } catch (err) {
    console.error("Error fetching occupancy:", err);
    res.status(500).json({ error: "Failed to fetch occupancy data" });
  }
});

export default router;

