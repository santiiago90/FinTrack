export class ValidationError extends Error {
  constructor(fields) {
    super('Verifique os campos indicados.');
    this.fields = fields;
  }
}
export function validateExpense(body) {
  const fields = {};
  const { amount, date, category, description = '' } = body ?? {};
  const value = typeof amount === 'number' ? String(amount) : amount;
  if (typeof value !== 'string' || !/^\d{1,10}(\.\d{1,2})?$/.test(value) || Number(value) <= 0)
    fields.amount = 'Indique um montante positivo até 9999999999,99 EUR, com até duas casas decimais.';
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date.startsWith('0000') ||
      !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)
    fields.date = 'Indique uma data válida no formato AAAA-MM-DD.';
  if (typeof category !== 'string' || !category.trim() || category.trim().length > 80)
    fields.category = 'Indique uma categoria entre 1 e 80 caracteres.';
  if (typeof description !== 'string' || description.trim().length > 500)
    fields.description = 'A descrição pode ter até 500 caracteres.';
  if (Object.keys(fields).length) throw new ValidationError(fields);
  return { amount: value, date, category: category.trim(), description: description.trim() };
}
export function validateFilters(query, requireMonth = false) {
  const { month, category } = query;
  const fields = {};
  if (Object.keys(query).some(key => !['month', 'category'].includes(key)))
    fields.query = 'Filtros permitidos: month e category.';
  if ((requireMonth || month !== undefined) &&
      (typeof month !== 'string' || !/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(month)))
    fields.month = 'Indique um mês válido no formato AAAA-MM.';
  if (category !== undefined && (typeof category !== 'string' || !category.trim() || category.trim().length > 80))
    fields.category = 'Indique uma categoria válida.';
  if (Object.keys(fields).length) throw new ValidationError(fields);
  return { month, category: category?.trim() };
}
export function validateId(id) {
  if (!/^[1-9]\d{0,9}$/.test(id) || Number(id) > 2147483647)
    throw new ValidationError({ id: 'Identificador inválido.' });
  return Number(id);
}
