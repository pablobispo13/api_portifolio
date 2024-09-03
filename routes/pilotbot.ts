import { Router, Request, Response } from "express";
import { PrismaClient } from "../prisma/generated/client";

const router = Router();
const prisma = new PrismaClient();

router.get(`/validate_token`, async (req: Request, res: Response) => {
  const { token } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { token },
    });

    if (user) {
      return res.json({ valid: true, user_id: user.userId });
    }

    return res.json({ valid: false });
  } catch (error) {
    console.error("Error validating token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/log", async (req: Request, res: Response) => {
  const { timestamp, logType, message, userId } = req.body;

  try {
    await prisma.log.create({
      data: {
        timestamp: new Date(timestamp),
        logType,
        message,
        userId,
      },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("Error logging:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});

router.post("/register-token", async (req: Request, res: Response) => {
  const { token, user_id } = req.body;

  if (!token || !user_id) {
    return res.status(400).json({ error: "Token e user_id são necessários" });
  }

  try {
    const existingEntry = await prisma.user.findUnique({ where: { token } });
    if (existingEntry) {
      return res.status(400).json({ error: "Este token já está registrado." });
    }

    const newUser = await prisma.user.create({
      data: { token, userId: user_id },
    });
    res.status(201).json({ message: "Bot registrado com sucesso!", newUser });
  } catch (error) {
    console.error("Erro ao registrar o token:", error);
    res.status(500).json({ error: "Erro ao registrar o token." });
  }
});

export default router;
