# Sprint 3 — Planeamento e roteiro de review

Documento de preparação. Não é uma ata nem prova de que a equipa reuniu.

## Planeamento

- Período registado no Jira: 11 a 25 de novembro de 2026.
- Product Owner proposto: Santiago; confirmar com João antes de registar a decisão como tomada.
- Objetivo: demonstrar staging isolado, um relatório DAST e um gate com duas decisões comparáveis.
- Dependências: staging saudável antes do ZAP; credencial OpenAI e permissão de execução antes da demonstração real P2.
- Riscos: indisponibilidade do fornecedor, alertas do ZAP por interpretar e confusão entre evidência sintética e testes reais.

## Roteiro da demonstração

1. Mostrar o sprint e as seis tarefas. Explicar por que staging usa PostgreSQL descartável e só expõe o frontend.
2. Executar `node scripts/staging-smoke.mjs` e explicar o trajeto navegador → Nginx → Express → PostgreSQL.
3. Abrir o relatório ZAP de uma execução identificada. Mostrar severidades, política de bloqueio e limites do baseline passivo.
4. Mostrar o gate de IA a aprovar o caso completo e a bloquear o incompleto. Comparar decisão e casos em falta das duas respostas da mesma execução. Assinalar se a fonte for simulada.
5. Mostrar P1-001 e explicar a relação entre a estrutura do checkout e os caminhos esperados pela pipeline.
6. Registar feedback, decisões e próximos passos após a review.

## Evidências a recolher depois

- Planning: data, participantes, PO confirmado, objetivo e alterações ao backlog.
- Daily: progresso, próximo passo e impedimentos.
- Review: data, presentes, links do CI e dos artefactos, feedback.
- Retrospetiva: melhoria concreta, responsável e forma de verificar o resultado.

