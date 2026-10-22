export async function api(path = '', options = {}) {
  const response = await fetch('/api/expenses' + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.message || 'Ocorreu um erro.'), { fields: data.fields });
  return data;
}
