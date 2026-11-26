## Como as peças comunicam

O navegador mostra a aplicação React. Os formulários enviam JSON para
/api/expenses através do proxy de desenvolvimento do Vite. Express valida
o pedido, chama o repositório e este executa SQL parametrizado no PostgreSQL.
A resposta atualiza a lista e o resumo. O resumo usa os dados do mês completo;
o filtro de categoria só restringe o histórico.

Os valores são armazenados em NUMERIC(12,2). A API devolve texto decimal,
e o total entre categorias é calculado em cêntimos com BigInt.
As datas são datas de calendário, sem conversão para um dia UTC diferente.

## Ficheiros alterados

| Ficheiro | O que faz e porquê |
|---|---|
| README.md | Acrescenta o estado real do Sprint 2, instalação, execução e validação antes do roadmap original. |
| .gitignore | Permite versionar exemplos .env e ignora relatórios gerados e o ambiente Python local. |
| backend/.env.example | Documenta apenas a configuração usada pelo MVP: servidor, origem frontend e PostgreSQL. |
| backend/package.json | Acrescenta o comando migrate e PGlite como dependência exclusiva de testes. |
| backend/package-lock.json | Fixa a árvore de dependências do backend, incluindo PGlite. |
| backend/src/app.js | Cria uma aplicação Express configurável para testes; liga as rotas e uniformiza erros JSON, limite do corpo e CORS. |
| backend/src/server.js | Liga o servidor a 127.0.0.1 por defeito, adequado ao MVP local sem autenticação; HOST permite configuração explícita. |
| .github/workflows/ci.yml | Mantém lint/build/testes, acrescenta PostgreSQL 16 de teste, build React e SAST em pushes e PRs. Guarda o relatório e verifica se o scanner deteta uma fixture insegura. |
| docs/ci-cd.md | Atualiza a documentação para indicar os jobs reais do Sprint 2. |
| docs/project-links.md | Corrige o URL do repositório e o caminho do ADR existente. |

## Ficheiros novos — backend e base de dados

| Ficheiro | O que faz |
|---|---|
| backend/src/db.js | Centraliza o pool de ligações PostgreSQL e lê as variáveis DB_*. Não guarda palavras-passe no código. |
| backend/src/expenses/validation.js | Valida montante, data real, categoria, descrição, filtros e identificadores; devolve erros por campo. |
| backend/src/expenses/repository.js | Isola SELECT/INSERT/UPDATE/DELETE e agregações mensais. Os valores do utilizador são sempre parâmetros SQL. |
| backend/src/expenses/routes.js | Define os endpoints HTTP, códigos 201/204/400/404 e entrega os dados validados ao repositório. |
| backend/src/migrate.js | Executa o ficheiro SQL e fecha a ligação; corre com npm run migrate. |
| database/001-expenses.sql | Cria a tabela expenses com restrições e um índice para consultas por data/categoria. É idempotente. |
| backend/tests/expenses.test.js | Testa o fluxo CRUD, filtros, precisão decimal, datas bissextas, erros, campos em falta e categorias com apóstrofo contra SQL real. Localmente usa PGlite; no CI usa PostgreSQL. |
| compose.yaml | Arranca apenas PostgreSQL para desenvolvimento, com volume persistente, healthcheck e porta exposta só no host local. |
| .env.example | Modelo da palavra-passe usada pelo serviço PostgreSQL do Compose. |

O Compose é um apoio mínimo à tua persistência e demonstração local.
Não substitui o trabalho XOPS-16 do João (Dockerfiles e aplicação completa
em containers).

## Ficheiros novos — interface

| Ficheiro | O que faz |
|---|---|
| frontend/package.json | Define React, Vite e os comandos dev/build/preview. |
| frontend/package-lock.json | Fixa versões para instalação reproduzível com npm ci. |
| frontend/index.html | Documento HTML de entrada, idioma português, título e raiz React. |
| frontend/vite.config.js | Configura o proxy /api para o backend local sem fixar URLs na interface. |
| frontend/src/api.js | Centraliza fetch, JSON e propagação dos erros por campo. |
| frontend/src/main.jsx | Gere formulário, edição, confirmação de eliminação, filtros, resumo, carregamento, lista vazia, mensagens e cancelamento de pedidos antigos. |
| frontend/src/styles.css | Define o aspeto visual, layout adaptável, foco de teclado e estilos de erro. |

As categorias sugeridas não são obrigatórias: é possível escrever outra.
A interface aceita vírgula decimal e apresenta datas e EUR em pt-PT.
O resumo mensal permanece visível quando o histórico é filtrado.

## Ficheiros novos — segurança

| Ficheiro | O que faz |
|---|---|
| .semgrep.yml | Regras locais para alguns padrões de execução dinâmica, shell, HTML não sanitizado e SQL interpolado. Todas têm severidade ERROR. |
| .semgrepignore | Exclui dependências, builds e a fixture deliberadamente insegura da análise normal. |
| security/requirements.txt | Fixa Semgrep 1.177.0 para uso local e no CI. |
| security/fixtures/unsafe.js | Contém eval deliberado para comprovar o funcionamento do gate; não é importado pela aplicação. |
| security/check-report.mjs | Lê o relatório Semgrep e falha se existir uma deteção ERROR ou qualquer erro de análise. |

O limiar inicial é zero deteções ERROR. Está explícito para revisão da equipa;
não foi inventado um acordo anterior. Não foram introduzidas supressões
na aplicação. A proteção de merge no GitHub continua a depender das regras
da branch, que não foram alteradas.

## Ficheiros novos — documentação

| Ficheiro | O que faz |
|---|---|
| docs/api-expenses.md | Contrato dos endpoints, exemplos e regras exatas de validação e persistência. |
| docs/security.md | Instalação e execução do Semgrep, política, falsos positivos e limites da cobertura. |
| docs/sprint-2-changes.md | Este guia: explica o fluxo, cada ficheiro e a entrega. |

## Como executar

1. Ter Node.js 22.12+ e PostgreSQL 16, ou Docker Desktop ativo.
2. Copiar os dois exemplos .env (raiz e backend), colocando a mesma
   palavra-passe local nos dois. Não versionar os ficheiros .env reais.
3. Na raiz: docker compose up -d db.
4. Dentro de backend: npm ci, npm run migrate, npm start.
5. Dentro de frontend, noutro terminal: npm ci e npm run dev.
6. Abrir http://127.0.0.1:5173.

O volume PostgreSQL mantém os dados depois de parar e arrancar os containers.
O ficheiro SQL não inclui dados de exemplo.

## Validação e limites

- Semgrep: cinco regras executadas, zero deteções e zero erros na aplicação; a fixture insegura foi detetada e bloqueada com código 1.
- Lint do backend: aprovado.
- Verificação de sintaxe do backend: aprovada.
- Testes: 17 aprovados (16 novos e o teste de saúde existente).
- Compilação de produção React/Vite: aprovada.
- Navegador: criação, listagem, edição, erros por campo e abertura/cancelamento
  do diálogo de eliminação verificados. A eliminação foi testada na API.
- Os testes locais usam PostgreSQL WASM (PGlite), não o serviço PostgreSQL 16.
  O Docker Desktop estava parado. O CI está configurado para PostgreSQL 16.
- Não foi executado o GitHub Actions remoto porque não houve push.
- MVP local de utilizador único, sem autenticação. Não publicar na Internet
  sem implementar os controlos adequados.
- SAST é uma barreira inicial com regras limitadas; não certifica ausência
  de vulnerabilidades. Ver docs/security.md.
