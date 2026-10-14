# Visão Geral do Pipeline CI/CD e Hub de Links

## 1. Diagrama do Pipeline CI/CD

O diagrama seguinte ilustra o fluxo contínuo de integração e entrega (CI/CD) planeado para o projeto FinTrack, desde a submissão de código até à monitorização em produção.

```mermaid
flowchart TD
    A[Commit / Pull Request] --> B[Build, Lint & Testes]
    B --> C[Análise de Qualidade & SAST]
    C --> D[Deploy para Staging]
    D --> E[DAST - Testes Dinâmicos]
    E --> F[Gates de IA / Code Review]
    F --> G{Aprovação Automática?}
    G -->|Sucesso| H[Promoção para Produção]
    G -->|Falha| I[Rollback]
    H --> J[Observabilidade & Monitorização]
    I --> J
