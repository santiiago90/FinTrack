# Sprint 2 — MVP de despesas, persistência e SAST

[Visão geral do projeto](../../../README.md) · [Sprint 1](../sprint-1/README.md)

## Objetivo e âmbito

Entregar um fluxo local de gestão de despesas, com API, interface utilizável, dados persistentes e verificações automáticas de qualidade e segurança.

O incremento segue o [ADR-001](../../adr-001-modular-monolith.md): React + Vite, Node.js + Express e PostgreSQL. Funciona para **um único utilizador, sem autenticação**.

## Implementações

### API e persistência

- Criar, listar, consultar por identificador, editar e eliminar despesas.
- Guardar montante em EUR, data, categoria e descrição opcional.
- Filtrar por mês e categoria.
- Obter total mensal e totais por categoria.
- Validar os pedidos e devolver mensagens claras por campo.
- Usar consultas SQL parametrizadas e montantes `NUMERIC(12,2)`.
- Manter os dados num volume PostgreSQL independente do processo da aplicação.
- Documentar endpoints e regras de validação em [`docs/api-expenses.md`](../../api-expenses.md).

### Interface

- Formulário de criação e edição.
- Histórico de despesas e confirmação antes de eliminar.
- Seleção do mês e filtro por categoria.
- Resumo mensal e distribuição por categoria.
- Estados de carregamento, lista vazia, sucesso e erro.
- Apresentação de EUR e datas em `pt-PT`; o formulário aceita vírgula decimal.
- Layout adaptável a diferentes larguras de ecrã.

O filtro de categoria restringe o histórico. O resumo mantém o total do mês completo, incluindo todas as categorias.

### Qualidade e SAST

- Testes de endpoints, validações, filtros e somas monetárias.
- ESLint no backend e build do frontend.
- Semgrep com regras locais versionadas e verificação do relatório.
- Fixture insegura para confirmar que o scanner consegue bloquear uma deteção.
- Workflow GitHub Actions com jobs de backend, frontend e SAST.

## Organização das tarefas

| Tarefa | Responsável consultado | Âmbito |
|---|---|---|
| XOPS-16 | João | Aplicação executável e ambiente Docker |
| XOPS-17 | Santiago | API de despesas e persistência |
| XOPS-18 | Santiago | Interface do fluxo de despesas |
| XOPS-19 | João | Testes unitários e de integração do MVP |
| XOPS-20 | Santiago | SAST e gate de segurança no CI |
| XOPS-21 | João | Architectural Feedback Log, P1 |
| XOPS-22 | João | Planning, rotação de PO e evidências Scrum |

O PO previsto para o Sprint 2 é João. A atribuição principal de uma tarefa não dispensa a colaboração e a revisão cruzada. O estado atualizado das tarefas deve ser consultado no [Jira](https://santiagoadaofernandes.atlassian.net/jira/software/projects/XOPS/boards/34/backlog).

## Requisitos para executar

- Git, para obter o repositório completo.
- Node.js **22.12 ou superior** numa versão compatível com as dependências, com npm. O CI usa Node.js 22.
- Docker Desktop com Docker Compose e suporte a containers Linux.
- Portas locais `3000` e `5432` disponíveis; o Vite tenta `5173` e pode escolher outra porta.
- Python com pip apenas se quiseres executar Semgrep localmente. O CI prepara Python 3.12.

**Nesta configuração, só PostgreSQL corre no Docker.** Backend e frontend arrancam em dois terminais separados.

## Primeira instalação

Os exemplos de terminal usam **PowerShell**. Executa os comandos a partir da raiz do repositório, a pasta que contém `compose.yaml`, `backend` e `frontend`.

### 1. Obter o projeto

```powershell
git clone https://github.com/santiiago90/FinTrack.git
cd FinTrack
```

Se já tens o repositório com as alterações do Sprint 2, abre essa pasta em vez de criar outra cópia. A versão obtida do GitHub tem de incluir este incremento; alterações apenas locais não aparecem num novo clone.

### 2. Preparar a configuração

Só numa instalação nova, quando ainda não existem ficheiros `.env`:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
```

Edita `DB_PASSWORD` nos **dois ficheiros**, substituindo o placeholder pela mesma palavra-passe local. Não publiques os `.env` reais; apenas os `.env.example` devem entrar no repositório.

As restantes opções do backend são:

| Variável | Valor do exemplo | Finalidade |
|---|---|---|
| `PORT` | `3000` | Porta HTTP da API |
| `HOST` | `127.0.0.1` | Escuta apenas no computador local |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Origem autorizada no CORS para acesso direto à API |
| `DB_HOST` | `localhost` | PostgreSQL publicado pelo Docker no host |
| `DB_PORT` | `5432` | Porta PostgreSQL |
| `DB_NAME` | `fintrack` | Base de dados |
| `DB_USER` | `fintrack` | Utilizador PostgreSQL |
| `DB_PASSWORD` | A definir | Credencial da base de dados |

O Vite encaminha `/api` para `http://127.0.0.1:3000`, pelo que a interface usa pedidos relativos à sua própria origem. Se mudares a porta da API, atualiza também [`frontend/vite.config.js`](../../../frontend/vite.config.js).

### 3. Criar e arrancar PostgreSQL

Abre o Docker Desktop e aguarda até o motor estar pronto. Na raiz do projeto:

```powershell
docker compose up -d --wait db
docker compose ps
```

O Compose descarrega `postgres:16` na primeira execução e cria o container, a rede e o volume. **Não é necessário criar o container manualmente no Docker Desktop.**

Com o nome de projeto predefinido `fintrack`, o container chama-se `fintrack-db-1` e o volume `fintrack_fintrack-data`. Os nomes podem mudar se alterares o nome do projeto Compose.

### 4. Instalar e arrancar o backend — terminal 1

```powershell
cd backend
npm ci
npm run migrate
npm start
```

Mensagem esperada:

```text
Servidor FinTrack ativo na porta 3000
```

Mantém o terminal aberto. A migração cria a tabela `expenses` e o índice inicial; não inclui dados de demonstração.

### 5. Instalar e arrancar o frontend — terminal 2

Abre outro terminal **na raiz do repositório**:

```powershell
cd frontend
npm ci
npm run dev
```

Abre o endereço `Local` apresentado pelo Vite, normalmente [http://127.0.0.1:5173](http://127.0.0.1:5173). Se a porta estiver ocupada, pode ser `5174` ou outra.

## Arranques seguintes

Não precisas de copiar novamente os `.env`, reinstalar dependências nem criar o container em cada utilização.

**Terminal 1, a partir da raiz:**

```powershell
docker compose up -d --wait db
cd backend
npm start
```

Em alternativa ao comando Compose, podes carregar em **Start** no container PostgreSQL existente, no Docker Desktop. Isso inicia apenas a base de dados.

**Terminal 2, a partir da raiz:**

```powershell
cd frontend
npm run dev
```

São necessários os três componentes: **PostgreSQL + backend + frontend**. Volta a executar `npm ci` quando uma instalação nova ou alterações nas dependências o exigirem.

## Verificar, parar e preservar os dados

Com os serviços em execução, noutro PowerShell:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health
Invoke-RestMethod http://127.0.0.1:3000/api/expenses
```

`/api/health` verifica o processo HTTP. Consultar `/api/expenses` também exercita a ligação à base e a tabela.

Para parar, usa `Ctrl+C` em cada terminal do backend/frontend. Se quiseres parar PostgreSQL, na raiz:

```powershell
docker compose stop db
```

As despesas ficam no volume nomeado. `docker compose down` preserva esse volume por defeito; **eliminar o volume ou usar `down -v` elimina os dados**. A migração inicial pode ser repetida, mas não substitui um sistema completo de migrações para futuras alterações do esquema.

Alterar `DB_PASSWORD` nos ficheiros não muda a credencial de uma base já inicializada. Para essa alteração, entra com `docker compose exec db psql -U fintrack -d fintrack`, usa `\password fintrack`, atualiza os dois `.env` e reinicia o backend.

## API e validação

| Método | Endpoint | Resultado |
|---|---|---|
| GET | `/api/health` | Estado do processo HTTP |
| GET | `/api/expenses` | Lista; filtros opcionais `month` e `category` |
| GET | `/api/expenses/:id` | Consulta uma despesa |
| POST | `/api/expenses` | Cria; responde `201` e `Location` |
| PUT | `/api/expenses/:id` | Atualiza todos os campos obrigatórios |
| DELETE | `/api/expenses/:id` | Elimina; responde `204` |
| GET | `/api/expenses/summary?month=2026-10` | Resumo mensal; mês obrigatório |

Exemplo de corpo POST/PUT:

```json
{
  "amount": "12.30",
  "date": "2026-10-21",
  "category": "Alimentação",
  "description": "Almoço"
}
```

- Montante positivo, até `9999999999.99`, com no máximo duas casas decimais.
- A API usa ponto decimal e devolve os montantes como texto decimal.
- Data real no formato `AAAA-MM-DD`; mês no formato `AAAA-MM`.
- Categoria obrigatória, entre 1 e 80 caracteres após remover espaços exteriores.
- Descrição opcional, até 500 caracteres; omitida significa texto vazio.
- Erros de validação devolvem `400` com `message` e `fields`; recursos inexistentes devolvem `404`.
- JSON inválido devolve `400`; corpo demasiado grande devolve `413`; falhas inesperadas devolvem `500` sem expor credenciais ou SQL.

O contrato completo está em [`docs/api-expenses.md`](../../api-expenses.md).

## Testes e qualidade

Na pasta `backend`:

```powershell
npm run lint
npm run build
npm test
```

Na pasta `frontend`:

```powershell
npm run build
```

A suite atual tem **17 testes**: o teste de saúde e 16 testes de despesas, incluindo CRUD, filtros, precisão monetária, datas, campos em falta e dados inválidos.

Localmente, os testes usam **PGlite**, PostgreSQL em WASM. No CI usam PostgreSQL 16, através de `TEST_DATABASE_URL`.

**`TEST_DATABASE_URL` deve apontar apenas a uma base de testes descartável:** a suite esvazia `expenses` antes de cada teste. Não uses a base com despesas pessoais.

O `build` do backend verifica a sintaxe de `app.js` e `server.js`. O build do frontend gera `frontend/dist`. Os builds não iniciam serviços nem publicam a aplicação.

## SAST e GitHub Actions

O workflow [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml) executa em `push` e `pull_request`:

| Job | Verificações |
|---|---|
| `backend-ci` | Instalação, ESLint, sintaxe e testes com PostgreSQL 16 de teste |
| `frontend-ci` | Instalação e build React/Vite |
| `sast` | Semgrep, fixture de deteção, verificação JSON e publicação do relatório |

O Semgrep está fixado na versão **1.177.0**. As cinco regras locais procuram alguns padrões de `eval`, construção dinâmica de funções, HTML não sanitizado, execução shell e SQL interpolado.

O gate configurado falha com **qualquer deteção `ERROR` ou erro de análise**. O limiar inicial deve ser revisto com a equipa. O relatório fica disponível nos artefactos da execução, incluindo em falha. O workflow também verifica que a fixture insegura é detetada.

Para executar localmente, na raiz, com Python instalado:

```powershell
python -m venv .venv-sast
.\.venv-sast\Scripts\python.exe -m pip install -r security/requirements.txt
.\.venv-sast\Scripts\semgrep.exe scan --config .semgrep.yml --metrics off --disable-version-check --strict --error --json-output security/semgrep-results.json backend/src frontend/src
node security/check-report.mjs security/semgrep-results.json
```

As regras são uma barreira inicial, não uma auditoria completa. Bloquear o job não impede por si só um merge: os checks obrigatórios dependem da proteção da branch no GitHub. Ver [`docs/security.md`](../../security.md).

## Problemas frequentes

| Sintoma | Verificação / solução |
|---|---|
| Vite mostra `ECONNREFUSED 127.0.0.1:3000` | O backend não está acessível. Abre outro terminal em `backend` e executa `npm start`. |
| `Cannot find package 'dotenv'` | Executa `npm ci` na pasta `backend` dessa cópia do projeto. |
| Erro de ligação PostgreSQL | Abre Docker Desktop, arranca `db` e confirma `DB_HOST` e `DB_PORT`. |
| `password authentication failed` | A credencial da base não corresponde a `backend/.env`; mudar só o ficheiro não altera a base existente. |
| `relation expenses does not exist` | Executa `npm run migrate` dentro de `backend`. |
| Vite escolhe `5174` | A `5173` está ocupada; usa o URL indicado e verifica se há um frontend antigo a correr. |
| `EADDRINUSE` na API | Já existe um processo na porta `3000`; confirma qual é a cópia ativa antes de iniciar outra. |

## Evidências e trabalho ainda por confirmar

Na validação local desta implementação foram aprovados os 17 testes, o lint do backend e o build do frontend. A aplicação foi ligada ao PostgreSQL Docker. O scan SAST não encontrou deteções nas regras configuradas e a fixture insegura foi bloqueada.

Estes resultados locais não substituem uma execução remota da mesma versão. Confirmar os jobs em [GitHub Actions](https://github.com/santiiago90/FinTrack/actions) e ligar as evidências às tarefas Jira antes do fecho.

Desde este sprint, as falhas reais da pipeline devem ser registadas no **Architectural Feedback Log (P1)** com causa, decisão arquitetural afetada, correção estrutural e evidência. O planning, daily, review, retrospetiva e rotação de PO precisam dos respetivos registos da equipa.

Este documento não declara concluídas todas as tarefas do sprint: a revisão cruzada, a execução remota do CI e os artefactos do colega devem ser confirmados separadamente.

## Limitações deste incremento

- Uso local e individual, sem autenticação nem isolamento por utilizador.
- Apenas PostgreSQL está containerizado; o ambiente completo em containers não está entregue nesta configuração.
- Sem deployment, DAST, gates de IA ou observabilidade implementados.
- Sem paginação, exportação, gestão de receitas ou orçamentos.
- Sem suite E2E automatizada da interface nesta entrega.

## Estrutura e documentação relacionada

| Caminho | Conteúdo |
|---|---|
| `backend/src/expenses/` | Validação, rotas e acesso SQL |
| `backend/src/db.js` | Pool PostgreSQL |
| `backend/src/migrate.js` | Execução do esquema inicial |
| `database/001-expenses.sql` | Tabela e índice |
| `frontend/src/` | Interface, cliente HTTP e estilos |
| `compose.yaml` | PostgreSQL local com volume |
| `.semgrep.yml` e `security/` | Regras, verificador e fixture SAST |
| `.github/workflows/ci.yml` | Pipeline CI |

- [Guia dos ficheiros do incremento](../../sprint-2-changes.md)
- [Contrato da API](../../api-expenses.md)
- [Política SAST](../../security.md)
- [Decisão arquitetural](../../adr-001-modular-monolith.md)
