# FinTrack — Requisitos do MVP

## 1. Utilizador-alvo

O FinTrack destina-se principalmente a estudantes universitários e jovens adultos que pretendem gerir melhor as suas finanças pessoais.

A aplicação será direcionada para utilizadores que necessitam de uma forma simples e acessível de registar receitas e despesas, acompanhar os seus hábitos de consumo e controlar o orçamento mensal.

### Características do utilizador-alvo

- Pretende acompanhar as suas despesas e receitas.
- Necessita de perceber em que categorias gasta mais dinheiro.
- Quer consultar a evolução do seu saldo financeiro.
- Procura uma aplicação simples, intuitiva e acessível através do navegador.
- Pretende manter o histórico dos seus movimentos financeiros.

## 2. Problema

A gestão das finanças pessoais pode tornar-se difícil quando as receitas e despesas não são registadas ou estão dispersas por diferentes meios, como aplicações bancárias, folhas de cálculo e apontamentos manuais.

Esta situação dificulta a identificação dos principais gastos, o acompanhamento do saldo disponível e o cumprimento de um orçamento mensal.

O FinTrack pretende responder a estas dificuldades através de uma aplicação centralizada que permita registar, organizar e consultar os movimentos financeiros pessoais.

### Principais dificuldades identificadas

- Falta de controlo sobre o total das despesas.
- Dificuldade em identificar as categorias com maiores gastos.
- Ausência de um histórico centralizado de receitas e despesas.
- Dificuldade em comparar receitas e despesas de um determinado período.
- Falta de informação organizada para apoiar decisões financeiras.

## 3. Solução proposta

O FinTrack será uma aplicação web de gestão de despesas pessoais que permitirá aos utilizadores registar receitas e despesas, organizá-las por categorias e consultar resumos da sua situação financeira.

A aplicação será desenvolvida com uma arquitetura que separa a interface do utilizador, a lógica de negócio e o armazenamento dos dados.

### Tecnologias previstas

- **Frontend:** React e Vite.
- **Backend:** Node.js e Express.
- **Base de dados:** PostgreSQL.
- **Testes:** Vitest e Supertest.
- **Controlo de versões:** Git e GitHub.
- **Automatização:** GitHub Actions, a integrar progressivamente.

### Funcionamento previsto

1. O utilizador acede à aplicação através do navegador.
2. Consulta o resumo da sua situação financeira.
3. Regista receitas e despesas através de formulários.
4. Organiza os movimentos por categorias.
5. Consulta o histórico dos movimentos registados.
6. Visualiza os totais de receitas, despesas e saldo.
7. Os dados são guardados numa base de dados para consulta posterior.

As funcionalidades serão implementadas progressivamente ao longo dos sprints.

## 4. Requisitos funcionais

Os requisitos funcionais descrevem as operações que o sistema deverá permitir realizar.

| ID | Requisito | Descrição | Prioridade |
|---|---|---|---|
| RF01 | Registar receitas | Permitir ao utilizador registar uma receita com valor, data e descrição. | Alta |
| RF02 | Registar despesas | Permitir ao utilizador registar uma despesa com valor, data e descrição. | Alta |
| RF03 | Consultar movimentos | Apresentar o histórico das receitas e despesas registadas. | Alta |
| RF04 | Categorizar movimentos | Permitir associar uma categoria a cada movimento financeiro. | Alta |
| RF05 | Consultar saldo | Apresentar o saldo calculado a partir das receitas e despesas registadas. | Alta |
| RF06 | Consultar totais | Apresentar os totais de receitas e despesas. | Alta |
| RF07 | Guardar dados | Armazenar os movimentos financeiros numa base de dados persistente. | Alta |
| RF08 | Editar movimentos | Permitir alterar os dados de um movimento existente. | Média |
| RF09 | Eliminar movimentos | Permitir eliminar um movimento financeiro. | Média |
| RF10 | Filtrar movimentos | Permitir consultar movimentos por período e categoria. | Média |
| RF11 | Consultar orçamentos | Permitir consultar os orçamentos mensais definidos. | Baixa |
| RF12 | Autenticação | Permitir autenticar utilizadores e proteger os respetivos dados pessoais. | Alta para utilização multiutilizador |

### Regras de negócio iniciais

- Cada movimento financeiro deve ter um valor positivo.
- Cada movimento deve ser identificado como receita ou despesa.
- Cada movimento deve ter uma data.
- Cada movimento deve possuir uma descrição.
- Os movimentos podem ser organizados por categoria.
- O saldo corresponde ao total das receitas menos o total das despesas.
- Os valores monetários devem ser armazenados com precisão adequada para operações financeiras.
- Os dados financeiros devem ser persistidos e disponibilizados após reiniciar a aplicação.

## 5. MVP — Produto Mínimo Viável

O MVP corresponde à primeira versão funcional do FinTrack. Deve incluir apenas as funcionalidades essenciais para demonstrar que a aplicação resolve o problema identificado.

### 5.1. Funcionalidades incluídas

- [ ] Registar receitas.
- [ ] Registar despesas.
- [ ] Consultar o histórico de movimentos financeiros.
- [ ] Categorizar receitas e despesas.
- [ ] Visualizar o saldo total.
- [ ] Visualizar os totais de receitas e despesas.
- [ ] Guardar os movimentos numa base de dados PostgreSQL.
- [ ] Disponibilizar uma interface web simples e responsiva.
- [ ] Validar os dados introduzidos pelo utilizador.
- [ ] Executar testes automatizados das funcionalidades principais.

### 5.2. Critérios de aceitação do MVP

O MVP será considerado funcional quando:

1. For possível registar uma receita com os dados obrigatórios.
2. For possível registar uma despesa com os dados obrigatórios.
3. Os movimentos registados forem apresentados no histórico.
4. Os movimentos puderem ser associados a categorias.
5. O saldo apresentado corresponder à diferença entre receitas e despesas.
6. Os totais de receitas e despesas forem calculados corretamente.
7. Os dados permanecerem disponíveis depois de reiniciar o servidor.
8. A API validar os dados recebidos e devolver respostas HTTP adequadas.
9. Os testes automatizados das funcionalidades principais forem aprovados.
10. A interface permitir utilizar as funcionalidades essenciais sem erros impeditivos.

### 5.3. Funcionalidades fora do MVP

As seguintes funcionalidades poderão ser desenvolvidas em versões posteriores:

- Gestão avançada de orçamentos mensais.
- Gráficos detalhados de evolução financeira.
- Notificações sobre limites de despesa.
- Exportação de relatórios financeiros.
- Importação automática de movimentos bancários.
- Integração com serviços bancários externos.
- Recomendações financeiras assistidas por Inteligência Artificial.

Estas funcionalidades não são necessárias para demonstrar o funcionamento essencial do produto.

## 6. Relação com os sprints

A implementação dos requisitos será distribuída pelos cinco sprints do projeto.

| Sprint | Objetivo principal |
|---|---|
| Sprint 1 | Preparação do projeto, documentação, arquitetura e integração contínua inicial. |
| Sprint 2 | Implementação das funcionalidades principais do MVP, persistência de dados e qualidade do código. |
| Sprint 3 | Ambiente de staging, testes dinâmicos de segurança e verificações assistidas por IA. |
| Sprint 4 | Observabilidade, análise de desempenho e melhorias arquiteturais. |
| Sprint 5 | Estabilização, validação final, documentação e demonstração do projeto. |

A distribuição definitiva das tarefas deverá ser confirmada no Product Backlog e no planeamento de cada sprint.

## 7. Estado atual

Na fase inicial do projeto, já foram preparados o ambiente Node.js e Express, o endpoint de verificação da API e um teste automatizado inicial.

O frontend e a base de dados ainda não estão implementados.

O presente documento define os requisitos pretendidos, não significando que todas as funcionalidades estejam concluídas.

O estado de cada requisito deverá ser atualizado à medida que as funcionalidades forem implementadas e validadas.

---

**Projeto:** FinTrack — Gestor de Despesas Pessoais  
**Unidade Curricular:** Plataformas e Serviços X-Ops  
**Instituição:** Universidade da Beira Interior  
**Ano letivo:** 2026/2027  
**Documento:** Requisitos do MVP  
**Estado:** Definição inicial dos requisitos
