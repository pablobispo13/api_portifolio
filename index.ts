import { PrismaClient } from "./prisma/generated/client";
import express from "express";

const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

const prisma = new PrismaClient();
const app = express();
const port = 3000;

app.use(express.json());

app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.get("/", (req, res) => {
  res.send("Hey this is my API running 🥳");
});

app.get(`/useri`, async (req, res) => {
  const result = await prisma.user.create({
    data: {
      email: "teste@#teste",
      name: "name",
    },
  });
  res.json(result);
});

// Gera um segredo para o usuário
app.get("/generateSecret", (req, res) => {
  const secret = speakeasy.generateSecret();
  QRCode.toDataURL(secret.otpauth_url, (err: any, dataUrl: any) => {
    if (err) {
      res.status(500).send("Erro ao gerar o QR code");
    } else {
      res.send({ secret: secret.base32, qrcode: dataUrl });
    }
  });
});

// Verifica o token fornecido pelo usuário
app.post("/verifyToken", express.json(), (req, res) => {
  const { secret, token } = req.body;
  const verified = speakeasy.totp.verify({
    secret: secret,
    encoding: "base32",
    token: token,
    window: 1, // Permite um atraso de 1 passo para compensar a sincronização do relógio
  });
  if (verified) {
    res.send("Token válido");
  } else {
    res.status(401).send("Token inválido");
  }
});

app.listen(port, () =>
  console.log(`Servidor rodando em http://localhost:${port}`)
);
