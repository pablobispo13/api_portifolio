import { Router, Request, Response } from "express";
import { PrismaClient } from "../prisma/generated/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();
const prisma = new PrismaClient();

// Função para verificar se o usuário existe
const userExists = async (phoneNumber: string) => {
  return await prisma.user.findUnique({
    where: {
      phoneNumber: phoneNumber,
    },
  });
};

// Rota para login
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "E-mail e senha são necessários." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: "Usuário não encontrado." });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Senha incorreta." });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || "secret",
      {
        expiresIn: "1h",
      }
    );

    return res.json({ token, id: user.id });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return res.status(500).json({ error: "Erro ao fazer login." });
  }
});

// Rota para criação de usuário
router.post("/register", async (req: Request, res: Response) => {
  const { email, password, phoneNumber } = req.body;

  if (!email || !password || !phoneNumber) {
    return res
      .status(400)
      .json({ error: "E-mail, senha e número de telefone são necessários." });
  }

  try {
    const existingUser = await userExists(phoneNumber);
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "E-mail ou número de telefone já registrados." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { email, password: hashedPassword, phoneNumber },
    });

    return res
      .status(201)
      .json({ message: "Usuário criado com sucesso!", id: newUser.id });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return res.status(500).json({ error: "Erro ao criar usuário." });
  }
});

// Valida o token do usuário
router.get("/validate_token", async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token é necessário." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const user = await prisma.user.findUnique({
      where: { id: (decoded as any).id },
    });

    return res.json({ valid: !!user, user_id: user?.id });
  } catch (error) {
    console.error("Erro ao validar token:", error);
    return res.status(401).json({ valid: false });
  }
});

// Registra um log
router.post("/log", async (req: Request, res: Response) => {
  const { timestamp, logType, message, id } = req.body;

  if (!timestamp || !logType || !message || !id) {
    return res
      .status(400)
      .json({ error: "Todos os campos de log são necessários." });
  }

  try {
    await prisma.log.create({
      data: { timestamp: new Date(timestamp), logType, message, id },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("Erro ao registrar log:", error);
    return res
      .status(500)
      .json({ success: false, error: "Erro ao registrar log." });
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
        where: { id: user.id },
        update: { accountSid, authToken, fromNumber, toNumber },
        create: {
          id_user: Number(user.id),
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
      where: { id: user.id },
      data: { accountSid, authToken, fromNumber, toNumber },
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
    const user = await prisma.user.findUnique({
      where: { phoneNumber: phone_number },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    await prisma.twilioSettings.deleteMany({ where: { id: user.id } });
    await prisma.user.delete({ where: { id: user.id } });

    return res.json({
      message: "Usuário e suas informações foram excluídos com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao excluir o usuário:", error);
    return res.status(500).json({ error: "Erro ao excluir o usuário." });
  }
});

export default router;
