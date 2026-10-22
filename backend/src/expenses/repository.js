const columns = "id, amount::text, to_char(date, 'YYYY-MM-DD') AS date, category, description";
function where({ month, category }) {
  const clauses = [], values = [];
  if (month) {
    values.push(month + '-01');
    clauses.push('date >= $1::date AND date < ($1::date + interval \'1 month\')');
  }
  if (category) {
    values.push(category);
    clauses.push('category = $' + values.length);
  }
  return { sql: clauses.length ? 'WHERE ' + clauses.join(' AND ') : '', values };
}
export function expenseRepository(db) {
  return {
    async list(filters) {
      const { sql, values } = where(filters);
      return (await db.query('SELECT ' + columns + ' FROM expenses ' + sql + ' ORDER BY date DESC, id DESC', values)).rows;
    },
    async get(id) {
      return (await db.query('SELECT ' + columns + ' FROM expenses WHERE id=$1', [id])).rows[0];
    },
    async create({ amount, date, category, description }) {
      return (await db.query('INSERT INTO expenses (amount,date,category,description) VALUES ($1,$2,$3,$4) RETURNING ' + columns,
        [amount, date, category, description])).rows[0];
    },
    async update(id, { amount, date, category, description }) {
      return (await db.query('UPDATE expenses SET amount=$1,date=$2,category=$3,description=$4 WHERE id=$5 RETURNING ' + columns,
        [amount, date, category, description, id])).rows[0];
    },
    async remove(id) {
      return (await db.query('DELETE FROM expenses WHERE id=$1 RETURNING id', [id])).rowCount > 0;
    },
    async summary(filters) {
      const { sql, values } = where(filters);
      const rows = (await db.query('SELECT category, SUM(amount)::text AS total, COUNT(*)::int AS count FROM expenses ' + sql + ' GROUP BY category ORDER BY category', values)).rows;
      const cents = rows.reduce((sum, row) => sum + BigInt(row.total.replace('.', '')), 0n);
      return { month: filters.month, currency: 'EUR', total: String(cents / 100n) + '.' + String(cents % 100n).padStart(2, '0'), categories: rows };
    },
  };
}
