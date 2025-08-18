import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { createTaskSchema, updateTaskSchema } from "../validators/taskSchemas";

const router = Router();

router.use(requireAuth);

router.get("/", async (req: AuthRequest, res) => {
  const isAdmin = req.user?.role === "Admin";

  const tasks = await prisma.task.findMany({
    where: isAdmin ? {} : { userId: req.user!.id },
    include: { user: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const enrichedTasks = tasks.map(t => {
    if (t.dueDate && t.dueDate < now && t.status !== "completed") {
      return { ...t, status: "expired" };
    }
    return t;
  });

  res.json(enrichedTasks);
});

router.post("/", async (req: AuthRequest, res) => {
  if (req.user?.role !== "Admin") {
    return res.status(403).json({ message: "Only admins can create tasks." });
  }

  const parse = createTaskSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ message: "Invalid data", issues: parse.error.issues });

  const task = await prisma.task.create({
    data: { ...parse.data, userId: req.user!.id },
  });

  res.status(201).json(task);
});

router.put("/:id", async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

  const parse = updateTaskSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ message: "Invalid data", issues: parse.error.issues });

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return res.status(404).json({ message: "Task not found" });

  const isOwner = task.userId === req.user!.id;
  const isAdmin = req.user?.role === "Admin";

  if (!isAdmin && !isOwner) {
    return res.status(403).json({ message: "Not authorized to update this task." });
  }

  const dataToUpdate = isAdmin
    ? parse.data
    : {
        ...(typeof parse.data.description !== "undefined" && { description: parse.data.description }),
        ...(typeof parse.data.status !== "undefined" && { status: parse.data.status }),
      };

  const updated = await prisma.task.update({
    where: { id },
    data: dataToUpdate,
  });

  res.json(updated);
});


router.delete("/:id", async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

  if (req.user?.role !== "Admin") {
    return res.status(403).json({ message: "Only admins can delete tasks." });
  }

  const exists = await prisma.task.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ message: "Task not found" });

  await prisma.task.delete({ where: { id } });

  res.status(204).send();
});

export default router;
