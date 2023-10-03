import { PrismaClient } from '../prisma/generated/index.js'
import express from 'express'

const prisma = new PrismaClient()
const app = express()

app.use(express.json())

app.get('/users', async (req, res) => {
  const users = await prisma.user.findMany()
  res.json(users)
})

app.get('/', (req, res) => {
  res.send('Hey this is my API running 🥳')
})

app.get(`/useri`, async (req, res) => {
  const result = await prisma.user.create({
    data: {
      "email": "teste@#teste",
      "name": "name"
    },
  })
  res.json(result)
})


app.listen(3000, () =>
  console.log('REST API server ready at: http://localhost:3000'),
)