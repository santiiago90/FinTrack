import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api } from './api';
import './styles.css';

const localDate = () => {
  const now = new Date();
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
};
const blank = () => ({ amount: '', date: localDate(), category: '', description: '' });
const euros = value => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
const displayDate = value => new Intl.DateTimeFormat('pt-PT').format(new Date(value + 'T12:00:00'));
const defaults = ['Alimentação', 'Transportes', 'Casa', 'Saúde', 'Lazer', 'Outros'];

function App() {
  const [month, setMonth] = useState(localDate().slice(0, 7));
  const [category, setCategory] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [fields, setFields] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const amountRef = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const query = new URLSearchParams({ month });
    if (category) query.set('category', category);
    Promise.all([
      api('?' + query, { signal: controller.signal }),
      api('/summary?' + new URLSearchParams({ month }), { signal: controller.signal }),
    ]).then(([list, totals]) => {
      setExpenses(list); setSummary(totals);
    }).catch(err => {
      if (err.name !== 'AbortError') { setExpenses([]); setSummary(null); setError('Não foi possível carregar as despesas. Verifique a ligação e tente novamente.'); }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [month, category, revision]);
  const reset = () => { setForm(blank()); setEditing(null); setFields({}); };
  async function save(event) {
    event.preventDefault();
    setBusy(true); setFields({}); setError(''); setMessage('');
    try {
      await api(editing ? '/' + editing : '', { method: editing ? 'PUT' : 'POST', body: JSON.stringify({ ...form, amount: form.amount.replace(',', '.') }) });
      setMessage(editing ? 'Despesa atualizada.' : 'Despesa registada.');
      reset(); setRevision(v => v + 1);
    } catch (err) {
      setFields(err.fields || {});
      setError(err.fields ? err.message : 'Não foi possível guardar a despesa. Tente novamente.');
    } finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true); setError(''); setMessage('');
    try {
      await api('/' + deleting.id, { method: 'DELETE' });
      if (editing === deleting.id) reset();
      setDeleting(null); setMessage('Despesa eliminada.'); setRevision(v => v + 1);
    } catch { setError('Não foi possível eliminar a despesa. Tente novamente.'); }
    finally { setBusy(false); }
  }
  const categories = [...new Set([...defaults, ...(summary?.categories.map(c => c.category) || []), category].filter(Boolean))];
  return <div className="shell">
    <header><a className="brand" href="/">f<span>FinTrack</span></a><span className="local-badge">O seu espaço pessoal · EUR</span></header>
    <main>
      <div className="intro"><div><p className="eyebrow">CLAREZA, TODOS OS DIAS</p><h1>As suas despesas,<br/><span>sob controlo.</span></h1><p>Acompanhe os pequenos gastos. Veja o mês por inteiro.</p></div><label className="month">Período em análise<input aria-label="Mês" type="month" required value={month} onChange={e => { if (e.target.value) { setMonth(e.target.value); setMessage(''); } }}/></label></div>
      <div aria-live="polite">{message && <p className="notice success">{message}</p>}</div>
      {error && <div className="notice error" role="alert">{error} <button onClick={() => setRevision(v => v + 1)}>Tentar carregar novamente</button></div>}
      <section className="overview" aria-label="Resumo mensal">
        <div className="total"><p>TOTAL DO MÊS</p><strong>{loading ? 'A carregar…' : summary ? euros(summary.total) : '—'}</strong><small>{summary ? summary.categories.reduce((n, c) => n + c.count, 0) : '—'} despesas registadas</small></div>
        <div className="breakdown"><h2>Por categoria</h2>{!loading && summary?.categories.length === 0 && <p>O seu mês começa aqui. Registe a primeira despesa.</p>}
          {!loading && summary?.categories.map(c => <div className="category-row" key={c.category}><div><span>{c.category}</span><b>{euros(c.total)}</b></div><progress aria-label={c.category} value={Number(c.total)} max={Number(summary.total) || 1}/></div>)}
          {loading && <p>A preparar o resumo…</p>}</div>
      </section>
      <div className="workspace">
        <section className="card form-card"><p className="eyebrow">REGISTAR & ORGANIZAR</p><h2>{editing ? 'Editar despesa' : 'Nova despesa'}</h2>
          <form onSubmit={save}>
            {[['amount', 'Montante (€)', 'text'], ['date', 'Data', 'date'], ['category', 'Categoria', 'text'], ['description', 'Descrição (opcional)', 'text']].map(([key, label, type]) =>
              <label key={key}>{label}<input ref={key === 'amount' ? amountRef : undefined} name={key} type={type} inputMode={key === 'amount' ? 'decimal' : undefined}
                list={key === 'category' ? 'categories' : undefined} placeholder={key === 'amount' ? '0,00' : key === 'category' ? 'Ex.: Alimentação' : ''}
                required={key !== 'description'} maxLength={key === 'category' ? 80 : key === 'description' ? 500 : undefined}
                value={form[key]} disabled={busy} aria-invalid={!!fields[key]} aria-describedby={fields[key] ? key + '-error' : undefined}
                onChange={e => setForm({ ...form, [key]: e.target.value })}/>
                {fields[key] && <small id={key + '-error'} className="field-error">{fields[key]}</small>}</label>)}
            <datalist id="categories">{categories.map(c => <option key={c} value={c}/>)}</datalist>
            <button className="primary" disabled={busy}>{busy ? 'A guardar…' : editing ? 'Guardar alterações' : '+ Registar despesa'}</button>
            {editing && <button type="button" disabled={busy} onClick={reset}>Cancelar edição</button>}
          </form>
        </section>
        <section className="card history"><div className="history-head"><div><p className="eyebrow">CADA MOVIMENTO CONTA</p><h2>Histórico de despesas</h2></div><label>Filtrar categoria<select value={category} onChange={e => setCategory(e.target.value)}><option value="">Todas as categorias</option>{categories.map(c => <option key={c}>{c}</option>)}</select></label></div>
          {loading ? <p role="status" className="empty">A carregar despesas…</p> : expenses.length === 0 ? <div className="empty"><span>↗</span><h3>Ainda sem despesas por aqui</h3><p>Registe uma despesa ou escolha outro mês ou categoria.</p></div> :
          <div className="table-wrap"><table><thead><tr><th>Despesa</th><th>Data</th><th>Montante</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{expenses.map(expense => <tr key={expense.id}>
            <td><strong>{expense.category}</strong><small>{expense.description || 'Sem descrição'}</small></td><td>{displayDate(expense.date)}</td><td className="money">{euros(expense.amount)}</td><td className="actions">
              <button disabled={busy} aria-label={'Editar despesa ' + expense.id} onClick={() => { setForm(expense); setEditing(expense.id); setFields({}); setMessage(''); amountRef.current?.focus(); }}>Editar</button>
              <button disabled={busy} className="danger" aria-label={'Eliminar despesa ' + expense.id} onClick={() => setDeleting(expense)}>Eliminar</button></td></tr>)}</tbody></table></div>}
        </section>
      </div>
      <footer>FinTrack <span>Um registo de cada vez.</span></footer>
    </main>
    {deleting && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="delete-title" onKeyDown={e => { if (e.key === 'Escape' && !busy) setDeleting(null); if (e.key === 'Tab') { e.preventDefault(); const buttons = [...e.currentTarget.querySelectorAll('button:not(:disabled)')]; const index = buttons.indexOf(document.activeElement); buttons[(index + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus(); } }}>
      <h2 id="delete-title">Eliminar esta despesa?</h2><p>{deleting.category} · {euros(deleting.amount)}. Esta ação não pode ser anulada.</p>
      <button autoFocus disabled={busy} onClick={() => setDeleting(null)}>Cancelar</button><button className="primary" disabled={busy} onClick={remove}>{busy ? 'A eliminar…' : 'Eliminar despesa'}</button>
    </section></div>}
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
