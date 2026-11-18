# Architectural Feedback Log — Sprint 3

## P1-001 — CI falhou antes de instalar as dependências

**Origem:** incidente real do Sprint 2, recuperado para o registo de continuidade do P1. Não é uma nova falha ocorrida no Sprint 3.

- **Falha:** a [execução do commit `0a7d3b3`](https://github.com/santiiago90/FinTrack/actions/runs/39768008713) falhou no setup de Node. A cache esperava `backend/package-lock.json`, que não existia na raiz do commit.
- **Causa:** o commit retirou os ficheiros da raiz esperada; a cópia com a implementação tinha ficado numa pasta FinTrack aninhada.
- **Decisão exposta:** a organização do repositório é um contrato entre checkout, configuração de cache, diretórios de trabalho dos jobs e build. O problema não se resolvia desativando a cache: `npm ci` também precisava dos ficheiros nos caminhos corretos.
- **Correção estrutural:** colocar `backend/`, `frontend/` e os lockfiles diretamente na raiz versionada.
- **Evidência:** [execução da correção `5bdad7b`](https://github.com/santiiago90/FinTrack/actions/runs/39768618334) com sucesso. [Execução de `f063988`](https://github.com/santiiago90/FinTrack/actions/runs/39771310368) também bem-sucedida.
- **Prevenção:** rever no GitHub Desktop se o commit inclui os lockfiles nas mesmas pastas que o workflow indica. Staging e CI continuam a usar `npm ci` para tornar a dependência explícita.

## Como acrescentar uma entrada

Para cada falha real, registar no Jira com a etiqueta de Architectural Feedback: execução e commit, sintoma observado, causa confirmada, decisão arquitetural exposta, correção e evidência de nova execução. Uma fixture intencional de teste não é um incidente operacional. Se a causa ainda for hipótese, assinalá-la como hipótese.

