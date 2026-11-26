# XOPS-30: dashboard Grafana com evidência arquitetural (desenho)

## Intenção
A XOPS-29 já publica métricas HTTP e PostgreSQL no Prometheus do staging. Falta tornar essas métricas legíveis e usá-las para **explicar o comportamento da arquitetura**: onde está o gargalo e o que acontece quando uma dependência falha. É evidência para a Sprint Review do Sprint 4, para a XOPS-31 (alertas) e para a XOPS-34 (Feedback Log).

## Critérios de aceitação (Jira)
1. Mostrar tráfego, erros, duração HTTP e comportamento das operações PostgreSQL.
2. Pelo menos uma vista que revele um gargalo ou uma dependência entre componentes.
3. Executar um cenário controlado com dados fictícios e interpretar as curvas observadas.
4. Guardar capturas, consulta usada, resultado e instruções de reprodução.

## Fora do âmbito
- Alertas e diagnóstico com IA: XOPS-31, que reaproveita este cenário.
- Tracing, logs centralizados e persistência do Prometheus ou do Grafana entre execuções.
- Dados reais. O staging continua descartável.

## Anti-objetivos
- Um dashboard bonito que não sirva para tirar nenhuma conclusão sobre a arquitetura.
- Capturas tiradas à mão e impossíveis de reproduzir.
- Forçar números: a interpretação descreve o que foi observado, mesmo que não seja o esperado.

## Abordagens consideradas (escolha do utilizador: C)
- **A. Só a saturação do pool:** uma rajada concorrente esgota as 10 ligações do `pg.Pool`. Mostra o gargalo, mas não a dependência.
- **B. Só a falha da base de dados:** mostra a dependência, mas não a carga.
- **C. Cenário em fases (escolhida):** base → rajada → base de dados indisponível → recuperação. Cobre os dois tipos de vista e dá também a evidência de disparo e recuperação para a XOPS-31.

## Descobertas que mudam o desenho
- `backend/src/db.js` não ouve o evento `error` do `pg.Pool`. Se a base de dados cair, o `pg-pool` emite `error` sem ouvinte e **o processo da API termina**. O container `api` não tem `restart`, por isso ficaria em baixo.
- Não há timeouts de ligação nem de query: uma base de dados que deixe de responder deixa os pedidos pendurados indefinidamente.
- O PostgreSQL do staging usa `tmpfs`. Parar o container (`stop`) apaga a tabela, e a migração só corre no arranque da API.

Por isso, a falha da base de dados é simulada com **`docker compose pause db` durante 30 s**: o processo congela, os dados mantêm-se e o `unpause` recupera. Para a API responder com erro em vez de ficar pendurada, entram duas correções de resiliência, documentadas como observação para a XOPS-34.

## Desenho
### 1. Resiliência da ligação à base de dados (`backend/src/db.js`)
- `connectionTimeoutMillis` vem de `DB_CONNECTION_TIMEOUT_MS` (por omissão 2000).
- `query_timeout` vem de `DB_QUERY_TIMEOUT_MS` (por omissão 5000).
- `pool.on('error', ...)` regista `Falha numa ligação inativa do PostgreSQL` com o `code`, sem SQL e sem credenciais, e não termina o processo.
- Testes: um servidor TCP falso que aceita e nunca responde faz falhar um pedido em menos de 3 s; um erro emitido pelo pool não termina o processo.

### 2. Grafana provisionado (`observability/grafana/`)
- `compose.staging.yaml`: serviço `grafana` com `grafana/grafana-oss:13.0.1`, porta `127.0.0.1:${GRAFANA_PORT:-3001}:3000`, `depends_on: prometheus`, healthcheck em `/api/health`. A porta 3001 evita conflito com a API do modo de desenvolvimento.
- Acesso anónimo só de leitura (`Viewer`). O administrador `admin` usa a palavra-passe `staging_only_password`, apenas para a API de anotações; o staging só escuta em `127.0.0.1`.
- `provisioning/datasources/prometheus.yml`: datasource `Prometheus` com uid fixo `fintrack-prometheus`, apontado a `http://prometheus:9090`.
- `provisioning/dashboards/fintrack.yml` e `dashboards/fintrack-api.json`: dashboard com uid fixo `fintrack-api`, intervalo de atualização de 5 s, em três linhas:
  - **Tráfego e erros:** pedidos/s por rota, percentagem de 5xx, 4xx por rota.
  - **Latência:** p50 e p95 HTTP por rota, p95 por operação PostgreSQL.
  - **Dependência API → PostgreSQL (a vista arquitetural):** num só painel, p95 HTTP de `/api/expenses*` ao lado do p95 das operações DB; ligações do pool `total`, `idle` e `waiting`; erros DB por operação.
- As fases do cenário aparecem como **anotações** no dashboard.

### 3. Cenário controlado (`scripts/load-scenario.mjs`)
Corre contra o staging através do nginx, para o tráfego passar pelo percurso real. Tem cinco fases, com durações configuráveis por variáveis de ambiente:

| Fase | Duração por omissão | Tráfego |
|---|---|---|
| `seed` | — | 300 despesas fictícias por `POST`, com 6 categorias, 3 meses e montantes de 2 € a 82 € |
| `base` | 60 s | concorrência 2; mistura de list, summary, get, post e pedidos inválidos (400) |
| `rajada` | 60 s | concorrência 60; sobretudo summary e list |
| `db-indisponivel` | 30 s | `docker compose pause db`, concorrência 2, depois `unpause` |
| `recuperacao` | 60 s | concorrência 2 |

O script:
- regista o início e o fim de cada fase em `artifacts/observability/scenario-timeline.json` e cria a anotação correspondente no Grafana;
- garante o `unpause` mesmo em falha (`finally`);
- não usa dados reais: categorias e descrições começam por "Cenário".

### 4. Evidência (`scripts/scenario-report.mjs` e `observability/capture/`)
- `scenario-report.mjs` consulta o Prometheus com `query_range` sobre a janela do cenário, usando as mesmas expressões dos painéis. Escreve `scenario-queries.json` (consultas e séries) e `scenario-summary.json` e `.md`, com uma tabela por fase:
  - pedidos/s;
  - percentagem de 5xx;
  - p95 HTTP;
  - p95 DB;
  - máximo de `waiting`;
  - erros DB.
- `observability/capture/` é um pacote próprio, com `playwright@1.65.1` e lockfile, para não pesar no backend. O `capture.mjs` abre o dashboard com `from` e `to` iguais à janela do cenário e guarda `dashboard.png` (página inteira) e uma captura por linha.
- O workflow `observability.yml` ganha um job `scenario`, que corre em `workflow_dispatch` e em pushes para `main`. Arranca o staging com o Grafana, corre o cenário, o relatório e as capturas, e publica o artefacto `fintrack-scenario`. O job `metrics` atual mantém-se igual em todos os pushes e PRs, porque o cenário demora cerca de 5 minutos.

### 5. Documentação e interpretação
- `docs/sprints/sprint-4/README.md` ganha a secção "Dashboard e cenário": comandos de Windows e macOS, URLs, o significado de cada painel e como ler o relatório.
- `docs/sprints/sprint-4/xops-30-evidencia.md` tem a execução identificada (link do run e commit), a tabela do resumo, as capturas copiadas do artefacto e a **interpretação das curvas por fase**, escrita depois da primeira execução real no CI e com os números observados.
- `docs/como-executar.md` ganha o Grafana na lista de URLs.

## Restrições
- Mesmas restrições da XOPS-29: nenhum SQL, valor de despesa ou credencial nas métricas, etiquetas ou anotações.
- Imagens com versão fixa; tudo exposto apenas em `127.0.0.1`.
- Os commits são feitos pelo utilizador, através do GitHub Desktop. Esta sessão não faz push (403).

## O que fica ao critério de quem implementa
- A disposição exata dos painéis, as cores e as unidades.
- A mistura exata de pedidos em cada fase, desde que a `rajada` seja dominada por leituras.
- Os nomes internos das funções dos scripts.

## Verificação
- Backend: lint, build e testes, incluindo os novos de timeouts e do erro do pool.
- `node --check` nos scripts novos e validação de YAML e JSON do provisioning.
- Sem Docker neste ambiente, a prova final é o job `scenario` no GitHub Actions: artefacto com capturas, consultas e resumo, e Grafana a mostrar os dados de cada fase.
