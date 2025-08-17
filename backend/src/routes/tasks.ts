import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { createTaskSchema, updateTaskSchema } from "../validators/taskSchemas";

const router = Router();

router.use(requireAuth);

// GET /api/tasks
router.get("/", async (req: AuthRequest, res) => {
  const tasks = await prisma.task.findMany({
    where: { userId: req.user!.id },
    include: { user: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(tasks);
});

// POST /api/tasks
router.post("/", async (req: AuthRequest, res) => {
  const parse = createTaskSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ message: "Invalid data", issues: parse.error.issues });

  const task = await prisma.task.create({
    data: { ...parse.data, userId: req.user!.id },
  });

  res.status(201).json(task);
});

// PUT /api/tasks/:id
router.put("/:id", async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

  const parse = updateTaskSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ message: "Invalid data", issues: parse.error.issues });

  const exists = await prisma.task.findFirst({
    where: { id, userId: req.user!.id },
  });

  if (!exists) return res.status(404).json({ message: "Task not found" });

  const updated = await prisma.task.update({
    where: { id },
    data: parse.data,
  });

  res.json(updated);
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

  const exists = await prisma.task.findFirst({
    where: { id, userId: req.user!.id },
  });

  if (!exists) return res.status(404).json({ message: "Task not found" });

  await prisma.task.delete({ where: { id } });

  res.status(204).send();
});

export default router;