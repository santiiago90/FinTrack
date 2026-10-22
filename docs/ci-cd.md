## Incremento Sprint 2

O workflow atual executa backend lint/build/testes com PostgreSQL 16,
build do frontend e Semgrep com regras locais versionadas. Consulte
[security.md](security.md) para o gate SAST e
[sprint-2-changes.md](sprint-2-changes.md) para a implementação.
O restante documento conserva a estratégia e o contexto do Sprint 1.

---
# Estratégia de CI/CD e Qualidade — FinTrack

## Configuração Atual (MVP)
O projeto utiliza **GitHub Actions** para Integração Contínua (CI). O workflow atual (`ci.yml`) é acionado automaticamente em eventos de `push` e `pull_request` para a branch `main`.

**Pipeline de validação:**
1. **Instalação reprodutível:** Utilização de `npm ci` para garantir que as dependências instaladas correspondem exatamente às versões bloqueadas no `package-lock.json`.
2. **Análise estática (Lint):** Validação de estilo e qualidade de código (`npm run lint`).
3. **Compilação (Build):** Verificação de que o projeto compila sem erros.
4. **Testes automatizados:** Execução da suite de testes (`npm run test`).
*Qualquer falha num comando devolve um exit code diferente de zero, interrompendo imediatamente o workflow e marcando o Pull Request com erro.*

## Extensão Futura (Sprints 3 e 4)
A arquitetura do pipeline foi desenhada para ser facilmente expansível. Nas próximas iterações, serão adicionados os seguintes *gates* de qualidade e segurança:

- **SAST (Static Application Security Testing):** Integração de ferramentas como Snyk ou SonarCloud no pipeline para detetar vulnerabilidades de código e dependências desatualizadas antes da compilação.
- **DAST (Dynamic Application Security Testing):** Implementação de OWASP ZAP (ZAP Baseline Scan) num ambiente de *staging* temporário para identificar vulnerabilidades de injeção ou problemas de configuração HTTP no serviço a correr.
- **Gates de IA e Observabilidade:** Inclusão de *Code Reviews* assistidos por IA através de Actions específicas (ex: ChatGPT Code Reviewer) e validação de métricas de cobertura de testes (Codecov) para garantir que a observabilidade arquitetural não sofre regressões.
