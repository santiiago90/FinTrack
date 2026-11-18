# Sprint 3 — Staging, DAST e gate de IA

**Datas no Jira:** 11 a 25 de novembro de 2026. **PO proposto:** Santiago, seguindo a rotação após João no Sprint 2; confirmar na equipa.

O objetivo é testar a aplicação completa num ambiente isolado, analisar a superfície HTTP e demonstrar uma verificação de qualidade que possa ser repetida com a mesma configuração.

| Tarefa | Responsável no Jira | Critério de aceitação |
|---|---|---|
| [XOPS-23](https://santiagoadaofernandes.atlassian.net/jira/browse/XOPS-23) | João | Frontend, API e PostgreSQL saudáveis em staging; criar, consultar e apagar uma despesa fictícia. |
| [XOPS-24](https://santiagoadaofernandes.atlassian.net/jira/browse/XOPS-24) | Santiago | ZAP analisa a interface e a API; falhas técnicas e alertas médios/altos bloqueiam; relatório publicado no CI. |
| [XOPS-25](https://santiagoadaofernandes.atlassian.net/jira/browse/XOPS-25) | Santiago | Contrato de decisão explícito, testes de aprovação e bloqueio, erros do fornecedor não aprovam. |
| [XOPS-26](https://santiagoadaofernandes.atlassian.net/jira/browse/XOPS-26) | João | Duas chamadas reais equivalentes; relatório com decisões, modelo, parâmetros e hashes; divergências bloqueiam. |
| [XOPS-27](https://santiagoadaofernandes.atlassian.net/jira/browse/XOPS-27) | João | [Registo P1](architectural-feedback.md) com falha observada, causa, contrato afetado, correção e evidência. |
| [XOPS-28](https://santiagoadaofernandes.atlassian.net/jira/browse/XOPS-28) | Santiago | [Planeamento e roteiro de review](review.md) disponíveis; cerimónias e decisão de PO registadas após acontecerem. |

## Executar staging

Da raiz do repositório, com Docker Desktop e Node.js 22:

~~~powershell
docker compose -p fintrack-sprint3 -f compose.staging.yaml up -d --build --wait --wait-timeout 120 web
node scripts/staging-smoke.mjs
~~~

Abre http://127.0.0.1:8080. Se a porta estiver ocupada, define `$env:STAGING_PORT = '8081'` antes dos dois comandos. Nginx serve o frontend compilado e encaminha `/api` para Express. PostgreSQL e Express ficam internos à rede do Compose. O PostgreSQL de staging usa armazenamento temporário; reiniciar o container perde os dados. Não usar dados reais. O Compose de desenvolvimento continua disponível em `compose.yaml`.

Para parar apenas o staging:

~~~powershell
docker compose -p fintrack-sprint3 -f compose.staging.yaml down
~~~

## DAST

Com o staging em execução:

~~~powershell
node scripts/dast.mjs
~~~

O ZAP Baseline visita a interface e o endpoint de consulta da API. A análise é passiva, sem exploração ativa nem testes de sessão. Os resultados HTML e JSON ficam em `artifacts/dast/run-*/`. O script exige um relatório válido do alvo esperado e bloqueia risco médio ou alto. Alertas de risco baixo e informativos continuam visíveis. Não há lista de supressões.

O workflow **FinTrack DAST** prepara um staging novo em cada execução, verifica o percurso HTTP e publica logs e relatórios mesmo em caso de falha. O artefacto chama-se `fintrack-dast`. Um resultado local não substitui a execução remota no commit entregue.

A execução local de 11 de novembro passou no smoke test e nos dois alvos do ZAP. Cada relatório apresentou seis tipos de alerta de risco baixo ou informativo, sem alertas de risco médio ou alto.

## Gate de IA e P2

O protótipo avalia evidência de testes para alterações ao contrato da API. Exige que a suite tenha passado e que tenham sido verificados um fluxo válido e uma entrada inválida. A entrada aceita apenas um booleano e identificadores de casos previstos; não envia código, diffs, credenciais nem despesas.

- `ai-gate/prompt.md`: instruções e critérios.
- `ai-gate/config.json`: snapshot do modelo, parâmetros, timeout, repetições e casos obrigatórios.
- `ai-gate/gate.mjs`: valida a evidência, faz duas chamadas com o mesmo pedido e escreve o relatório.
- `ai-gate/fixtures/`: exemplos sintéticos de evidência completa e incompleta.

A regra local é a autoridade final. O gate só aprova se as duas decisões coincidirem com essa regra. Divergência, recusa, versão inesperada, resposta inválida ou indisponibilidade bloqueiam. A comparação usa decisão e casos em falta, não o texto livre da justificação. Fixar um snapshot não garante determinismo.

~~~powershell
node --test ai-gate/gate.test.mjs
# Depois de configurar OPENAI_API_KEY de forma segura:
node ai-gate/gate.mjs ai-gate/fixtures/complete.json
~~~

No GitHub Actions, o workflow **FinTrack AI Gate** corre os testes de contrato em pushes e PRs. A etapa que chama a OpenAI é manual e usa o secret `OPENAI_API_KEY`. Seleciona `complete` para demonstrar aprovação e `incomplete` para demonstrar bloqueio. Guarda o artefacto `fintrack-p2`, os hashes e a ligação à execução. O cenário sintético demonstra a política; não substitui uma verificação independente de que os testes declarados existem.

**Evidência disponível:** seis testes de contrato locais passaram com respostas simuladas. A comparação P2 com respostas reais está pendente de uma chave válida e de executar o workflow ou o comando local. Não usar os testes simulados como prova de reprodutibilidade do modelo.

## Apoio de IA e revisão

Codex apoiou a implementação e a documentação. A equipa deve conseguir reproduzir os comandos, explicar as decisões e rever as limitações antes da apresentação. A execução real do gate usa a [Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create), com [um snapshot do modelo](https://developers.openai.com/api/docs/models/gpt-5.4-mini) e saída estruturada. A cobertura do scanner segue a documentação do [ZAP Baseline](https://www.zaproxy.org/docs/docker/baseline-scan/).

