import express from "express";
import cors from "cors";
import { env } from "./env";
import authRoutes from "./routes/auth";
import taskRoutes from "./routes/tasks";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

app.listen(env.PORT, () => {
  console.log(`API running on http://localhost:${env.PORT}`);
});