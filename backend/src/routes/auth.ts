import express from "express";
import { prisma } from "../prisma";
import { compare, hash } from "bcryptjs";
import { loginSchema, userCreateSchema } from "../utils/validation";

const router = express.Router();

// POST /auth/login
router.post("/login", async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid input", details: parse.error.errors });
  }

  const { username, password } = parse.data;

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const { password: _p, ...safe } = user;
    res.json({ user: safe });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /auth/register (for initial admin setup)
router.post("/register", async (req, res) => {
  const parse = userCreateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid input", details: parse.error.errors });
  }

  const { username, password, name, role } = parse.data;

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const hashed = await hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashed,
        name,
        role: role || "ADMIN",
      },
      select: { id: true, username: true, name: true, role: true, createdAt: true },
    });

    res.status(201).json({ user });
  } catch (err: any) {
    console.error("Register error:", err);
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "User with this username already exists" });
    }
    res.status(500).json({ error: "Failed to create user" });
  }
});

// GET /auth/me (get current user - would need auth middleware in production)
router.get("/me", async (req, res) => {
  // In production, extract user from JWT token
  // For now, return error or implement basic auth
  res.status(401).json({ error: "Authentication required" });
});

export default router;
