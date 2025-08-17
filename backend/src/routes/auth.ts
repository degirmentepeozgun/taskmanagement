import { Router } from "express";
import { prisma } from "../prisma";
import { registerSchema, loginSchema } from "../validators/authSchemas";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../env";
import { requireAuth } from "../middleware/auth";
const router = Router();

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid data", issues: parsed.error.issues });
  }
  const { username, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return res.status(409).json({ message: "Username already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { username, passwordHash } });

  return res.status(201).json({ id: user.id, username: user.username });
});

router.get("/users", requireAuth, async (_req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, username: true } });
  res.json(users);
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid data", issues: parsed.error.issues });
  }
  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

const token = jwt.sign(
  { id: user.id, username: user.username },
  env.JWT_SECRET as string,
  { expiresIn: env.JWT_EXPIRES_IN as string }
);
  return res.json({ token, user: { id: user.id, username: user.username } });
});

export default router;
