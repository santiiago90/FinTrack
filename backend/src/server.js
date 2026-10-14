
import "dotenv/config";
import app from "./app.js";

// Definir a porta do servidor
const PORT = process.env.PORT || 3000;

// Iniciar o servidor Express
app.listen(PORT, () => {
  console.log(`Servidor FinTrack ativo na porta ${PORT}`);
});
