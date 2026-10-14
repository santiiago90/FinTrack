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

O MVP do FinTrack corresponde à primeira versão funcional da aplicação
que permite ao utilizador registar e acompanhar as suas despesas pessoais.

O objetivo é disponibilizar as funcionalidades essenciais para consultar
os gastos mensais, identificar as categorias com maiores despesas e manter
um histórico organizado dos movimentos financeiros.

### 5.1. Funcionalidades essenciais

O MVP deverá incluir as seguintes funcionalidades:

#### RF01 — Criar despesas

O sistema deverá permitir registar uma nova despesa com os seguintes dados:

- Montante em euros (EUR).
- Data da despesa.
- Categoria.
- Descrição opcional.

#### RF02 — Listar despesas

O sistema deverá apresentar uma lista das despesas registadas,
incluindo o montante, a data, a categoria e a descrição, quando exista.

#### RF03 — Editar despesas

O sistema deverá permitir alterar os dados de uma despesa existente.

Após a edição, os dados atualizados deverão ser apresentados na lista
e considerados nos cálculos dos resumos financeiros.

#### RF04 — Eliminar despesas

O sistema deverá permitir eliminar uma despesa existente.

Após a eliminação, a despesa não deverá ser incluída nos totais
ou nos resumos mensais.

#### RF05 — Filtrar despesas

O sistema deverá permitir filtrar as despesas por:

- Mês.
- Categoria.

Os filtros deverão poder ser utilizados para consultar apenas
as despesas correspondentes aos critérios selecionados.

#### RF06 — Consultar resumo mensal

O sistema deverá apresentar um resumo das despesas de um mês,
incluindo:

- Total gasto no mês.
- Total gasto por categoria.

Os valores apresentados deverão corresponder às despesas registadas
que correspondam ao período selecionado.

### 5.2. Melhorias futuras

As seguintes funcionalidades não fazem parte do MVP inicial:

- Gráficos financeiros avançados.
- Definição de limites de despesas por categoria.
- Notificações quando um limite é ultrapassado.
- Exportação de relatórios para PDF ou Excel.
- Importação automática de movimentos bancários.
- Recomendações financeiras com Inteligência Artificial.
- Comparação avançada de despesas entre vários meses.

Estas funcionalidades poderão ser consideradas em versões futuras,
depois de as funcionalidades essenciais estarem implementadas e testadas.

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
