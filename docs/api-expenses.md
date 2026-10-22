# API de despesas — Sprint 2 (XOPS-17)

Base: http://localhost:3000/api. Utilização local, de um único utilizador.

| Método | Endpoint | Resultado |
|---|---|---|
| GET | /health | Estado do processo HTTP (não verifica a base de dados) |
| GET | /expenses | Lista ordenada por data e identificador descendentes |
| GET | /expenses/:id | Uma despesa, ou 404 |
| POST | /expenses | Cria; responde 201 e cabeçalho Location |
| PUT | /expenses/:id | Substitui todos os campos; responde 200 ou 404 |
| DELETE | /expenses/:id | Elimina; responde 204 ou 404 |
| GET | /expenses/summary?month=2026-10 | Total mensal e totais por categoria |

Listagem e resumo aceitam month=AAAA-MM e category (igualdade exata,
sensível a maiúsculas). O mês é obrigatório no resumo. A interface mantém
o resumo do mês completo mesmo quando filtra a lista por categoria.

Exemplo de corpo POST/PUT:

~~~json
{"amount":"12.30","date":"2026-10-21","category":"Alimentação","description":"Almoço"}
~~~

~~~sh
curl -H "Content-Type: application/json" -d '{"amount":"12.30","date":"2026-10-21","category":"Alimentação"}' http://localhost:3000/api/expenses
curl "http://localhost:3000/api/expenses?month=2026-10"
curl "http://localhost:3000/api/expenses/summary?month=2026-10"
~~~

Montante positivo, até 9999999999.99 EUR, com até duas casas decimais.
A API recebe decimal com ponto (texto ou número) e devolve texto decimal;
a interface aceita vírgula e apresenta EUR em pt-PT. PostgreSQL NUMERIC(12,2)
e somas em cêntimos evitam erros de ponto flutuante.
Data de calendário real, AAAA-MM-DD, anos 0001–9999.
Categoria obrigatória, 1–80 caracteres após trim.
Descrição opcional, até 500 caracteres; omitida significa texto vazio.
PUT também exige todos os campos obrigatórios.

Erros de validação: 400, com message e fields (mensagens por campo).
JSON inválido: 400; corpo acima de 16 KB: 413; recurso inexistente: 404.
Falhas inesperadas: 500 com mensagem genérica e registo técnico no servidor,
sem devolver SQL, credenciais ou conteúdo do pedido.

database/001-expenses.sql cria a tabela e índice de forma idempotente.
Executar npm run migrate dentro de backend antes do primeiro arranque.
Não contém dados de demonstração. Os dados ficam no volume PostgreSQL,
independentes do processo Node e do ciclo de vida do container.
