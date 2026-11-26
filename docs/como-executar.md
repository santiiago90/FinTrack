# Como pôr o FinTrack a correr (Windows e macOS)

Este guia leva-te do zero até à aplicação aberta no navegador, com comandos para os dois sistemas.

- **Windows:** usa o **PowerShell**. Os blocos estão marcados com `powershell`.
- **macOS:** usa a app **Terminal**. Os blocos estão marcados com `bash`.

Há duas formas de executar. Para a maior parte dos casos, a **opção B** é a mais simples.

| | O que corre no Docker | Para quê |
|---|---|---|
| **A. Desenvolvimento** | Só o PostgreSQL | Alterar código e ver as mudanças logo, com o Vite |
| **B. Staging completo** | Tudo: PostgreSQL, API, frontend e Prometheus | Demonstração, testes de segurança e métricas |

---

## 1. Instalar as ferramentas (só uma vez)

São precisas três ferramentas:
- **Git**;
- **Node.js 22.12 ou superior**, com npm;
- **Docker Desktop**.

### Windows

No PowerShell:

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Docker.DockerDesktop -e
```

Depois:
1. Fecha e volta a abrir o PowerShell, para que reconheça os comandos novos.
2. Abre o **Docker Desktop** e aceita o uso do WSL 2 se ele o pedir. Pode ser preciso reiniciar o computador.

Se o `winget` não existir, instala a partir dos sites oficiais: [git-scm.com](https://git-scm.com/download/win), [nodejs.org](https://nodejs.org/) (versão LTS) e [docker.com](https://www.docker.com/products/docker-desktop/).

### macOS

No Terminal:

```bash
xcode-select --install
```

Isto instala o Git; se aparecer "already installed", podes avançar. Para o Node.js e o Docker Desktop, com o [Homebrew](https://brew.sh/):

```bash
brew install node@22
brew install --cask docker
```

Sem Homebrew, instala o Node.js LTS a partir de [nodejs.org](https://nodejs.org/) e o Docker Desktop a partir de [docker.com](https://www.docker.com/products/docker-desktop/). Escolhe **Apple Silicon** se o Mac tiver chip M1, M2, M3 ou M4, ou **Intel** nos outros. Depois abre o **Docker Desktop** a partir das Aplicações.

### Confirmar a instalação (Windows e macOS)

```bash
git --version
node --version
npm --version
docker --version
docker compose version
```

O `node --version` tem de mostrar `v22.12` ou superior. O comando `docker compose version` só funciona com o Docker Desktop aberto e com a baleia da barra de tarefas (ou da barra de menus) parada, sem animação.

---

## 2. Obter o projeto (só uma vez)

```bash
git clone https://github.com/santiiago90/FinTrack.git
cd FinTrack
```

Se já tens o repositório (por exemplo, no GitHub Desktop), abre um terminal na pasta dele: **Repository → Open in Terminal** (Mac) ou **Repository → Open in Command Prompt / PowerShell** (Windows). Depois atualiza-o:

```bash
git pull
```

**Todos os comandos a seguir partem da raiz do projeto**, ou seja, da pasta que tem `compose.yaml`, `backend` e `frontend`.

---

## 3. Opção B — Staging completo com Docker (recomendado)

Corre a aplicação inteira em containers com um só comando. Usa dados fictícios e uma base de dados temporária: **parar o staging apaga as despesas**.

### Arrancar

```bash
docker compose -p fintrack-staging -f compose.staging.yaml up -d --build --wait --wait-timeout 180
```

Da primeira vez descarrega as imagens e compila o frontend, o que pode demorar alguns minutos. Depois abre:

- **Aplicação:** http://127.0.0.1:8080
- **Prometheus (métricas):** http://127.0.0.1:9090
- **Grafana (dashboard FinTrack API):** http://127.0.0.1:3001, sem login

Para encher o dashboard com tráfego e dados fictícios, corre `node scripts/load-scenario.mjs`, que demora cerca de 4 minutos. Os detalhes estão no [README do Sprint 4](sprints/sprint-4/README.md#dashboard-e-cenário-controlado-xops-30).

### Verificar que tudo funciona

```bash
node scripts/staging-smoke.mjs
node scripts/metrics-check.mjs
```

| Script | Resultado esperado |
|---|---|
| `staging-smoke.mjs` | `Staging: frontend, proxy, API e PostgreSQL verificados.` |
| `metrics-check.mjs` | `Métricas: rotas HTTP normalizadas e operações PostgreSQL recolhidas pelo Prometheus.` |

### Ver os logs e parar

```bash
docker compose -p fintrack-staging -f compose.staging.yaml logs -f api
docker compose -p fintrack-staging -f compose.staging.yaml down
```

O primeiro comando mostra os logs da API; sai com `Ctrl+C`. O segundo para o staging.

### Se as portas 8080, 9090 ou 3001 estiverem ocupadas

**Windows:**

```powershell
$env:STAGING_PORT = '8081'
$env:PROMETHEUS_PORT = '9091'
$env:GRAFANA_PORT = '3002'
docker compose -p fintrack-staging -f compose.staging.yaml up -d --build --wait --wait-timeout 180
node scripts/staging-smoke.mjs
```

**macOS:**

```bash
export STAGING_PORT=8081
export PROMETHEUS_PORT=9091
export GRAFANA_PORT=3002
docker compose -p fintrack-staging -f compose.staging.yaml up -d --build --wait --wait-timeout 180
node scripts/staging-smoke.mjs
```

As variáveis só valem para esse terminal. Usa os mesmos valores nos comandos de verificação e de paragem.

---

## 4. Opção A — Desenvolvimento local

Nesta opção só o PostgreSQL corre no Docker. A API e o frontend correm no teu computador, cada um no seu terminal, e os dados ficam guardados entre utilizações.

### 4.1. Criar os ficheiros de configuração (só uma vez)

**Windows:**

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
notepad .env
notepad backend/.env
```

**macOS:**

```bash
cp .env.example .env
cp backend/.env.example backend/.env
open -e .env
open -e backend/.env
```

Nos **dois ficheiros**:
1. Troca `replace_with_local_password` pela **mesma** palavra-passe, à tua escolha, sem espaços.
2. Guarda e fecha.

Os ficheiros `.env` nunca entram no Git.

### 4.2. Arrancar o PostgreSQL

```bash
docker compose up -d --wait db
```

### 4.3. Backend — terminal 1

```bash
cd backend
npm ci
npm run migrate
npm start
```

Deve aparecer `Servidor FinTrack ativo na porta 3000`. Deixa este terminal aberto.

O `npm ci` e o `npm run migrate` só são precisos da primeira vez e sempre que as dependências ou a base de dados mudarem.

### 4.4. Frontend — terminal 2

Abre **outro** terminal na raiz do projeto:

```bash
cd frontend
npm ci
npm run dev
```

Abre o endereço `Local` que o Vite mostra, normalmente http://127.0.0.1:5173. A API também mostra as métricas em http://127.0.0.1:3000/metrics.

### 4.5. Parar

1. Carrega em `Ctrl+C` nos dois terminais.
2. Para parar a base de dados, na raiz do projeto:

```bash
docker compose stop db
```

As despesas ficam guardadas no volume do Docker. **Nunca uses `docker compose down -v`**, porque apaga os dados.

### 4.6. Utilizações seguintes

Basta repetir três comandos, sem copiar `.env` nem reinstalar dependências:
1. `docker compose up -d --wait db`
2. `cd backend` e `npm start`
3. noutro terminal, `cd frontend` e `npm run dev`

---

## 5. Correr os testes

```bash
cd backend
npm ci
npm run lint
npm run build
npm test
```

O resultado esperado é **25 testes aprovados**. Os testes locais usam uma base de dados PostgreSQL em memória (PGlite), por isso **não precisam do Docker**.

Para os testes do gate de IA, na raiz do projeto:

```bash
node --test ai-gate/gate.test.mjs
```

---

## 6. Problemas frequentes

| Sintoma | Sistema | Solução |
|---|---|---|
| `npm : ... running scripts is disabled on this system` | Windows | Corre uma vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` e responde `S` ou `Y`. Em alternativa, usa `npm.cmd` em vez de `npm`. |
| `docker: command not found` ou `Cannot connect to the Docker daemon` / `error during connect` | Ambos | Abre o Docker Desktop e espera que fique pronto. |
| `WSL 2 installation is incomplete` | Windows | `wsl --install` num PowerShell aberto como administrador, depois reinicia o computador. |
| `Defina DB_PASSWORD no ambiente ou no ficheiro .env da raiz` | Ambos | Falta o `.env` na raiz do projeto (ver 4.1). |
| `password authentication failed` | Ambos | A palavra-passe do `backend/.env` não é a mesma com que a base foi criada. Põe os dois `.env` iguais à primeira palavra-passe usada. |
| `relation "expenses" does not exist` | Ambos | Corre `npm run migrate` dentro de `backend`. |
| `Cannot find package 'dotenv'` ou `'prom-client'` | Ambos | Corre `npm ci` dentro de `backend`. |
| Vite mostra `ECONNREFUSED 127.0.0.1:3000` | Ambos | O backend não está a correr. Corre `npm start` em `backend`, no terminal 1. |
| `EADDRINUSE` ou `port is already allocated` | Ambos | A porta está ocupada. Descobre o processo com `Get-NetTCPConnection -LocalPort 3000` (Windows) ou `lsof -i :3000` (macOS), ou usa outra porta (ver secção 3). |
| `node --version` mostra menos de v22.12 | Ambos | Atualiza o Node.js (secção 1). No Mac com Homebrew: `brew link --overwrite node@22`. |
| O staging fica preso em `Waiting` | Ambos | Vê os logs com `docker compose -p fintrack-staging -f compose.staging.yaml logs api db` e confirma que tens memória livre no Docker Desktop (Settings → Resources). |

---

## Documentação relacionada

- [README do projeto](../README.md)
- [Contrato da API](api-expenses.md)
- [Sprint 3 — staging, DAST e gate de IA](sprints/sprint-3/README.md)
- [Sprint 4 — métricas com Prometheus](sprints/sprint-4/README.md)
