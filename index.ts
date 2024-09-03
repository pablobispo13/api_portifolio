import express from 'express';
import pilotbotRoutes from './routes/pilotbot';

const app = express();
const port = 3000;

app.use(express.json());

// Use o roteador para diferentes caminhos
app.use('/pilotbot', pilotbotRoutes);

// Rota de teste
app.get("/", (req, res) => {
  res.send("Hey this is my API running 🥳");
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
