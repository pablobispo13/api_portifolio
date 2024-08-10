import { PrismaClient } from "./prisma/generated/client";
import express, { Request, Response } from "express";

const prisma = new PrismaClient();
const app = express();
const port = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hey this is my API running 🥳");
});

app.get(`/validate_token`, async (req: Request, res: Response) => {
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

app.post("/log", async (req: Request, res: Response) => {
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

// Rota para registrar o token
app.post("/register-token", async (req, res) => {
  const { token, user_id } = req.body;

  if (!token || !user_id) {
    return res.status(400).json({ error: "Token e user_id são necessários" });
  }

  try {
    // Verifique se o token já está registrado
    const existingEntry = await prisma.user.findUnique({ where: { token } });
    if (existingEntry) {
      return res.status(400).json({ error: "Este token já está registrado." });
    }

    // Adicionar o novo usuário ao banco de dados
    const newUser = await prisma.user.create({
      data: { token, userId: user_id },
    });
    res.status(201).json({ message: "Bot registrado com sucesso!" });
  } catch (error) {
    console.error("Erro ao registrar o token:", error);
    res.status(500).json({ error: "Erro ao registrar o token." });
  }
});
// Implementação de autenticação de dois fatores utilizando o speakeasy e geração de qrcode

// const speakeasy = require("speakeasy");
// const QRCode = require("qrcode");

// // Gera um segredo para o usuário
// app.get("/generateSecret", (req, res) => {
//   const secret = speakeasy.generateSecret();
//   QRCode.toDataURL(secret.otpauth_url, (err: any, dataUrl: any) => {
//     if (err) {
//       res.status(500).send("Erro ao gerar o QR code");
//     } else {
//       res.send({ secret: secret.base32, qrcode: dataUrl });
//     }
//   });
// });

// // Verifica o token fornecido pelo usuário
// app.post("/verifyToken", express.json(), (req, res) => {
//   const { secret, token } = req.body;
//   const verified = speakeasy.totp.verify({
//     secret: secret,
//     encoding: "base32",
//     token: token,
//     window: 1, // Permite um atraso de 1 passo para compensar a sincronização do relógio
//   });
//   if (verified) {
//     res.send("Token válido");
//   } else {
//     res.status(401).send("Token inválido");
//   }
// });

app.listen(port, () =>
  console.log(`Servidor rodando em http://localhost:${port}`)
);
