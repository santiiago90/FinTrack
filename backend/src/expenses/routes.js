import { Router } from 'express';
import { validateExpense, validateFilters, validateId } from './validation.js';
export function expenseRoutes(repository) {
  const router = Router();
  const missing = res => res.status(404).json({ message: 'Despesa não encontrada.' });
  router.get('/summary', async (req, res) => res.json(await repository.summary(validateFilters(req.query, true))));
  router.get('/', async (req, res) => res.json(await repository.list(validateFilters(req.query))));
  router.get('/:id', async (req, res) => {
    const expense = await repository.get(validateId(req.params.id));
    return expense ? res.json(expense) : missing(res);
  });
  router.post('/', async (req, res) => {
    const expense = await repository.create(validateExpense(req.body));
    res.location('/api/expenses/' + expense.id).status(201).json(expense);
  });
  router.put('/:id', async (req, res) => {
    const expense = await repository.update(validateId(req.params.id), validateExpense(req.body));
    return expense ? res.json(expense) : missing(res);
  });
  router.delete('/:id', async (req, res) => {
    return await repository.remove(validateId(req.params.id)) ? res.status(204).end() : missing(res);
  });
  return router;
}
