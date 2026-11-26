# Registo de Planeamento - Sprint 1

**Data do Planeamento:** 15 de Outubro de 2026
**Product Owner (Sprint 1):** Santiago Fernandes
**Participantes:** Santiago Fernandes e João

## 1. Objetivo do Sprint
Estabelecer a infraestrutura base do projeto FinTrack, definir a arquitetura fundacional (Monolito Modular) e configurar o pipeline de CI/CD primário para garantir qualidade e automatização desde o início.

## 2. Capacidade e Distribuição de Esforço
- **Capacidade Equipa:** 2 membros.
- **Distribuição:** A disponibilidade de ambos foi revista em conjunto. O esforço para este sprint foi dimensionado para acomodar o setup inicial de ferramentas, focando na configuração de repositórios, documentação de requisitos e integração contínua.

## 3. Tarefas Selecionadas
1. Definição e documentação dos requisitos do MVP.
2. Definição da arquitetura (ADR-001: Arquitetura Monolítica Modular).
3. Configuração do Pipeline de CI/CD (Lint, Build e Testes em Node.js).
4. Criação do hub central de documentação e links.
5. Registo do planeamento do Sprint 1.

## 4. Divisão de Responsabilidades e Rotação do PO
- **Santiago Fernandes (PO Sprint 1):** Responsável por guiar os requisitos, validar critérios de aceitação, aprovar documentação arquitetural e organizar o backlog.
- **João (Developer Sprint 1):** Focado na implementação técnica da infraestrutura, configuração do ESLint e criação do workflow no GitHub Actions.
- **Plano de Rotação de PO:** Foi acordado que **o João assumirá o papel de Product Owner no Sprint 2**. A partir daí, o papel de PO alternará entre os dois membros nos sprints seguintes.

## 5. Dependências e Riscos
- **Dependências:** Acesso configurado ao GitHub e permissões adequadas no quadro do Jira. O setup de CI depende da correta inicialização do backend em Node.js.
- **Riscos:** Configurações erradas de ambiente no GitHub Actions (como versões de Node ou conflitos de pacotes de Lint). *Mitigação:* Trabalho conjunto de depuração (pair programming) e validação através de commits incrementais.

## 6. Revisão Cruzada (Cross-Review)
Para garantir a qualidade e partilha de conhecimento, todas as implementações técnicas (como o `ci.yml` ou `eslint.config.js`) e documentos estruturais requerem revisão cruzada. Nenhum código/documento é promovido para a branch principal (`main`) sem a validação do outro membro da equipa.

## 7. Definição de Concluído (Definition of Done - DoD)
Uma tarefa é considerada concluída neste sprint quando:
- O código ou documento está na branch `main` do repositório GitHub.
- O Pipeline de CI/CD corre com sucesso (indicador verde em Build, Lint e Testes).
- A documentação correspondente está atualizada e acessível no repositório.
- A tarefa foi movida para "Done" no quadro do Jira, com as devidas provas anexadas (links ou capturas de ecrã).
