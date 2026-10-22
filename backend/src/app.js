import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import { expenseRepository } from './expenses/repository.js';
import { expenseRoutes } from './expenses/routes.js';
export function createApp(repository = expenseRepository(pool)) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'API FinTrack em funcionamento' }));
  app.use('/api/expenses', expenseRoutes(repository));
  app.use((req, res) => res.status(404).json({ message: 'Endpoint não encontrado.' }));
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    if (err.fields) return res.status(400).json({ message: err.message, fields: err.fields });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'JSON inválido.' });
    if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Pedido demasiado grande.' });
    console.error('Falha no pedido', { method: req.method, path: req.path, code: err.code || err.name });
    return res.status(500).json({ message: 'Não foi possível concluir a operação. Tente novamente mais tarde.' });
  });
  return app;
}
export default createApp();
