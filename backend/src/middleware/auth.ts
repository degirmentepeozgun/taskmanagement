import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env";

// Role tipi enum gibi tanımlanabilir
export type Role = "Admin" | "User";

// Kullanıcı bilgisini taşıyan genişletilmiş Request
export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: Role;
  };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing token" });
  }

  const token = header.substring("Bearer ".length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      id: number;
      username: string;
      role: Role;
    };

    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
