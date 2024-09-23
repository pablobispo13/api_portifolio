import { Router, Request, Response } from "express";
import { PrismaClient } from "../prisma/generated/client";

const router = Router();
const prisma = new PrismaClient();

// Valida o token do usuário
router.get(`/validate_token`, async (req: Request, res: Response) => {
  const { token } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { token },
    });

    if (user) {
      return res.json({ valid: true, user_id: user.id_user });
    }

    return res.json({ valid: false });
  } catch (error) {
    console.error("Error validating token:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Registra um log
router.post("/log", async (req: Request, res: Response) => {
  const { timestamp, logType, message, id_user } = req.body;

  try {
    await prisma.log.create({
      data: {
        timestamp: new Date(timestamp),
        logType,
        message,
        id_user,
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

// Registra um token com um número de telefone
router.post("/register-token", async (req: Request, res: Response) => {
  const { token, user_id, phone_number } = req.body;

  if (!token || !user_id || !phone_number) {
    return res
      .status(400)
      .json({ error: "Token, user_id e phone_number são necessários" });
  }

  try {
    const existingEntry = await prisma.user.findUnique({ where: { token } });
    if (existingEntry) {
      return res.status(400).json({ error: "Este token já está registrado." });
    }

    const newUser = await prisma.user.create({
      data: { token, id_user: user_id, phoneNumber: phone_number },
    });
    res.status(201).json({ message: "Bot registrado com sucesso!", newUser });
  } catch (error) {
    console.error("Erro ao registrar o token:", error);
    res.status(500).json({ error: "Erro ao registrar o token." });
  }
});

// Atualiza o número de telefone associado a um token
router.post("/update-phone", async (req: Request, res: Response) => {
  const { token, phone_number } = req.body;

  if (!token || !phone_number) {
    return res
      .status(400)
      .json({ error: "Token e phone_number são necessários" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { token } });
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const updatedUser = await prisma.user.update({
      where: { token },
      data: { phoneNumber: phone_number },
    });

    return res.json({
      message: "Número de telefone atualizado com sucesso!",
      updatedUser,
    });
  } catch (error) {
    console.error("Erro ao atualizar o número de telefone:", error);
    return res
      .status(500)
      .json({ error: "Erro ao atualizar o número de telefone." });
  }
});

// Registra as configurações do Twilio
router.post(
  "/register-twilio-settings",
  async (req: Request, res: Response) => {
    const { token, accountSid, authToken, fromNumber, toNumber } = req.body;

    if (!token || !accountSid || !authToken || !fromNumber || !toNumber) {
      return res.status(400).json({ error: "Todos os campos são necessários" });
    }

    try {
      const user = await prisma.user.findUnique({ where: { token } });
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      const updatedSettings = await prisma.twilioSettings.upsert({
        where: { id_user: user.id_user },
        update: {
          accountSid,
          authToken,
          fromNumber,
          toNumber,
        },
        create: {
          id_user: user.id_user,
          accountSid,
          authToken,
          fromNumber,
          toNumber,
        },
      });

      return res.json({
        message: "Configurações do Twilio registradas com sucesso!",
        updatedSettings,
      });
    } catch (error) {
      console.error("Erro ao registrar as configurações do Twilio:", error);
      return res
        .status(500)
        .json({ error: "Erro ao registrar as configurações do Twilio." });
    }
  }
);

// Atualiza as configurações do Twilio
router.post("/update-twilio-settings", async (req: Request, res: Response) => {
  const { token, accountSid, authToken, fromNumber, toNumber } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token é necessário" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { token } });
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const updatedSettings = await prisma.twilioSettings.update({
      where: { id_user: user.id_user },
      data: {
        accountSid,
        authToken,
        fromNumber,
        toNumber,
      },
    });

    return res.json({
      message: "Configurações do Twilio atualizadas com sucesso!",
      updatedSettings,
    });
  } catch (error) {
    console.error("Erro ao atualizar as configurações do Twilio:", error);
    return res
      .status(500)
      .json({ error: "Erro ao atualizar as configurações do Twilio." });
  }
});

// Rota para validar e excluir um usuário baseado no número de telefone
router.delete("/delete-user", async (req: Request, res: Response) => {
  const { phone_number } = req.body;

  if (!phone_number) {
    return res
      .status(400)
      .json({ error: "O número de telefone é necessário." });
  }

  try {
    // Buscar o usuário pelo número de telefone
    const user = await prisma.user.findUnique({
      where: { phoneNumber: phone_number },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    // Excluir o usuário e suas configurações do Twilio
    await prisma.twilioSettings.deleteMany({
      where: { id_user: user.id_user },
    });

    await prisma.user.delete({
      where: { id_user: user.id_user },
    });

    return res.json({
      message: "Usuário e suas informações foram excluídos com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao excluir o usuário:", error);
    return res.status(500).json({ error: "Erro ao excluir o usuário." });
  }
});

export default router;
