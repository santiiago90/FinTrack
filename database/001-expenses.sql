CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  category VARCHAR(80) NOT NULL CHECK (length(trim(category)) > 0),
  description VARCHAR(500) NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS expenses_date_category_idx ON expenses(date, category);
