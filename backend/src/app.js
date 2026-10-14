
import express from "express";
import cors from "cors";

const app = express();

// Permitir pedidos do frontend
app.use(cors());

// Permitir receber dados em formato JSON
app.use(express.json());

// Endpoint para verificar o funcionamento da API
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API FinTrack em funcionamento"
  });
});

// Exportar a aplicação para o servidor e os testes
export default app;
