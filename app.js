import express from "express";
import { connectPg } from "./src/config/database.js";

const app = express();
const port = process.env.PORT || 3000;

await connectPg();
app.listen(port, () => {
  console.log(`Servidor en linea conectado al puerto: ${port}`)
})