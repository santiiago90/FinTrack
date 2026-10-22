# SAST — XOPS-20

Ferramenta: Semgrep Community Edition 1.177.0, fixada em
security/requirements.txt. O ADR permite análise estática; Semgrep concretiza
a ferramenta já planeada no README. Não exige conta ou token.

## Política versionada

.semgrep.yml contém regras ERROR para eval, construtor Function, HTML React
não sanitizado, alguns padrões de execução shell e interpolação SQL.
Limiar inicial implementado: zero deteções ERROR e zero erros de análise.
A equipa deve rever este limiar no Sprint Review; não existe evidência
de um limiar anteriormente acordado.

~~~sh
pip install -r security/requirements.txt
semgrep scan --config .semgrep.yml --metrics off --disable-version-check --strict --error --json-output security/semgrep-results.json backend/src frontend/src
node security/check-report.mjs security/semgrep-results.json
~~~

O workflow executa em cada push e pull_request, sem segredos, com permissão
contents: read. Guarda relatório JSON como artefacto mesmo em falha.
O verificador JSON também rejeita erros de análise, para que uma análise
incompleta não seja interpretada como aprovação.

Uma fixture deliberadamente insegura em security/fixtures/unsafe.js testa
que o scanner devolve código 1 antes de analisar a aplicação. Não pertence
ao código executável e é analisada separadamente. .semgrepignore exclui
dependências, builds e essa fixture da análise normal.

Falsos positivos: consultar o relatório, discutir no PR/Jira e documentar
regra, ficheiro, risco e motivo antes de qualquer supressão. Não há
supressões no código da aplicação nesta entrega.

## Limitações

Estas regras locais são uma primeira barreira pequena e auditável,
não uma cobertura completa de OWASP ou análise de dependências.
Não detetam todas as variantes de SQL injection, XSS ou execução de comandos.
Não substituem testes, revisão humana, SCA ou DAST.
O estado do job falha, mas impedir merge exige configurar o check SAST como
obrigatório nas regras de proteção da branch GitHub; isso não é alterado aqui.
A execução remota só acontecerá quando a equipa publicar as alterações.

Referência: https://semgrep.dev/docs/semgrep-ci/sample-ci-configs
