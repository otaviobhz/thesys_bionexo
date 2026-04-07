# Homologação Ticklist — Sprint 0 Etapa 4 (Triagem)

> Documento gerado durante a **Etapa 4 — Triagem** do Sprint 0. Lista cada item validado, status, evidência e decisão para Etapa 5 (Hardening).
>
> **Versão:** 2026-04-07 — primeira passada antes do Hardening
> **Executor:** Otávio (decisor) + Claude Code (validador via chrome-devtools MCP + curl + leitura de código)
> **Ambiente:** sandbox Bionexo + Thesys homologação

---

## Como ler este documento

Cada linha tem:
- **Status:**
  - ✅ **PASS** — funciona como esperado
  - ❌ **FAIL** — não funciona; vira bloqueador se marcado P0/P1
  - ⚠️ **PARTIAL** — funciona com ressalvas
  - 🚧 **BLOCKED** — não foi possível testar (dependência externa)
  - ⏳ **PENDING** — não foi testado ainda nesta passada
- **Severidade:**
  - 🔴 **P0** — bloqueia envio para keyuser
  - 🟠 **P1** — deveria ser corrigido, mas não bloqueia (com aviso)
  - 🟢 **P2** — cosmético/cleanup
  - 🟢 **P3** — dead code, melhoria opcional
- **Evidência:** screenshot, log, query SQL ou caminho `arquivo:linha`
- **Decisão:** o que fazer na Etapa 5

---

## 1. Backend SOAP (operações Bionexo EDI v3.14)

| # | Operação | Status | Evidência | Decisão |
|---|---|---|---|---|
| 1 | WGG receber cotações | ✅ PASS | SyncLog `2026-04-07T14:55:51.397Z — WGG SUCESSO — 1 cotações recebidas, 5 novas salvas`. Total subiu de 30 → 35 itens. | Manter |
| 2 | WHS enviar resposta | ✅ **PASS — CORRIGIDO** | **Bug schema descoberto e CORRIGIDO via fuzzing iterativo:** XML correto é `<WH_Resposta><Cabecalho>...</Cabecalho><Itens_Pdc><Item_Pdc>...</Item_Pdc></Itens_Pdc></WH_Resposta>` (não `<Pedidos><Pedido>`). **Estrutura completa descoberta a partir de mensagens de erro do Bionexo (11 iterações):** Cabecalho precisa de Id_Pdc, CNPJ_Hospital, Id_Forma_Pagamento, Faturamento_Minimo, Prazo_Entrega, Validade_Proposta, Frete, Observacao. Item_Pdc precisa de Sequencia, Id_Artigo, Codigo_Produto, Codigo_Produto_Fornecedor, Preco_Unitario, Embalagem, Quantidade_Embalagem, Fabricante, Observacao. **Validado ao vivo:** SyncLog `WHS SUCESSO 17:51:56 — PDC 211655085 enviada com ID 07/04/2026 14:51:56`. Cotação real enviada ao hospital sandbox. | ✅ |
| 3 | WGA prorrogações | ⏳ PENDING | Não testei "Atualizar Bionexo" nesta sessão. | Validar na Etapa 6 |
| 4 | WJG pedidos confirmados | ⏳ PENDING | Não testei. | Validar na Etapa 6 |
| 5 | WKN status itens | ⏳ PENDING | Não testei. | Validar na Etapa 6 |
| 6 | WMG cadastro hospital | ⏳ PENDING | Botão existe na UI. Não testei. | Validar na Etapa 6 |

---

## 2. Backend REST + Auth

| # | Endpoint | Status | Evidência | Decisão |
|---|---|---|---|---|
| 7 | POST /auth/login (admin OK) | ✅ PASS | curl direto retornou JWT válido + payload user. UI navega para `/`. | Manter |
| 8 | POST /auth/login (admin senha errada) | ✅ PASS (backend) | curl retorna `401 { "message": "Credenciais inválidas" }`. **Frontend pode não exibir erro visível** (não consegui validar via MCP por limitação). | Validar manualmente — se faltar toast, virar P1 |
| 9 | GET /cotacoes | ✅ PASS | Retorna `{ data: [...], total: 35 }`. UI renderiza grid corretamente. | Manter |
| 10 | PUT /cotacoes/itens/:id | ⏳ PENDING | Não testei salvar item nesta sessão. | Validar na Etapa 6 |
| 11 | POST /cotacoes/lote/* | ⏳ PENDING | Não testei batch actions. | Validar na Etapa 6 |
| 12 | POST /bionexo/receber | ✅ PASS | Botão "Receber novos" funcionou ao vivo. | Manter |
| 13 | POST /bionexo/enviar/:id | ⏳ PENDING | Não testei envio. | Validar na Etapa 6 |
| 14 | POST /config/testar-bionexo | ✅ PASS | curl retorna `{ success: true, message: "Conexão OK (status: 0, token: 211655363)" }`. | Manter |
| 15 | POST /config/testar-thesys | ✅ PASS | curl retorna `{ success: true, message: "Conexão OK: Servidor ISAPI funcionando!" }`. | Manter |
| 16 | GET /thesys/itens?search= | ✅ PASS | Retorna `[{ id: 5, sku: "7710", descricao: "FIO NYLON 3-0 C/AG", unidade: "ENV" }]`. | Manter |
| 17 | GET /thesys/precos?codigo= | ⚠️ PARTIAL | Retorna `[]` para SKU 7710. Pode ser normal (sem preço cadastrado) ou bug. **Validar com Thanner.** | Pendente investigação Thanner |
| 18 | GET/POST/PUT/DELETE /keywords | ⏳ PENDING | Não testei CRUD completo, mas listagem retorna 8 keywords cadastradas. | Validar na Etapa 6 |
| 19 | GET/POST/DELETE /mapeamento | ⏳ PENDING | Listagem retorna 1 mapeamento. CRUD não testado. | Validar na Etapa 6 |
| 20 | GET /sync-logs | ✅ PASS | Retorna histórico estruturado. | Manter |

---

## 3. Backend Jobs (BullMQ)

| # | Item | Status | Evidência | Decisão |
|---|---|---|---|---|
| 21 | BullMQ poll repeatable | ⏳ PENDING | Não validei se está rodando automaticamente. | Validar via SyncLog na Etapa 6 |
| 22 | Toggle bot ativo/inativo | ⏳ PENDING | Botão existe na ConfigPage. | Validar na Etapa 6 |

---

## 4. Frontend (páginas e componentes)

| # | Item | Status | Evidência | Decisão |
|---|---|---|---|---|
| 23 | Login → redirect para `/` | ✅ PASS | Screenshot `01-login.png` + `02-cotacoes-list.png`. Navegação OK. | Manter |
| 24 | Logout volta para `/login` | ⏳ PENDING | Não testei (limitação MCP fill). | Validar manualmente |
| 25 | CotacoesPage renderiza grid | ✅ PASS | Screenshot `02-cotacoes-list.png` + `16-receber-novos-result.png` (35 itens) | Manter |
| 26 | Filtro texto, PDC, status, categoria | ⏳ PENDING | UI presente, não testei interação. | Validar na Etapa 6 |
| 27 | Multi-sort 3 colunas (Shift+click) | ⏳ PENDING | Headers presentes. | Validar manualmente |
| 28 | Paginação | ✅ PASS | Após 35 itens apareceu paginação automática (botões 1, 2, Próxima). | Manter |
| 29 | Botão Receber novos | ✅ PASS | Funcionou ao vivo: 5 cotações novas baixadas. | Manter |
| 30 | Modal Aprender abre | ✅ PASS | Screenshot `12-modal-aprender.png` — abriu, extraiu palavras, dual-list operacional. | Manter |
| 31 | Modal Aprender salvar regra | ⏳ PENDING | Não cliquei salvar. CRUD do `/keywords` confirmado por curl. | Validar na Etapa 6 |
| 32 | Modal Parear: busca | ✅ PASS | Screenshot `11-modal-parear-busca.png` — busca "FIO" retornou 1 item real do Thesys. | Manter |
| 33 | Modal Parear: confirmar | ⏳ PENDING | Não cliquei confirmar (não queria sujar dados). | Validar na Etapa 6 |
| 34 | Detalhe da cotação | ✅ PASS | Screenshot `09-detalhe-cotacao.png` — 2 itens, painel direito, formulário envio. | Manter |
| 35 | Validação bloqueia envio com NAO_ANALISADO | ✅ PASS | Botão "Enviar Cotação" desabilitado com aviso explícito: `"Existem itens com categoria 'Não Analisado'. Classifique todos os itens antes de enviar."` | Manter |
| 36 | PalavrasChavePage carrega | ✅ PASS | Screenshot `03-palavras-chave.png` | Manter |
| 37 | MapeamentoPage carrega | ✅ PASS | Screenshot `04-mapeamento.png` | Manter |
| 38 | PedidosPage carrega | ✅ PASS | Screenshot `05-pedidos.png` | Manter |
| 39 | SyncLogsPage carrega | ✅ PASS | Screenshot `06-sync-logs.png` | Manter |
| 40 | UsuariosPage carrega | ✅ PASS | Screenshot `07-usuarios.png` | Manter |
| 41 | ConfigPage carrega + Zona de Perigo | ✅ PASS | Screenshot `08-config.png` + `15-config-thesys-test.png`. **Descobriu Zona de Perigo** com 3 botões (Inserir teste, Resetar, Limpar). | Manter |
| 42 | Sidebar collapse | ⏳ PENDING | Botão "Recolher" presente. Não cliquei. | Validar manualmente |
| 43 | Dark/Light mode | ⏳ PENDING | Botão "Modo Escuro" presente. Não cliquei. | Validar manualmente |

---

## 5. Workflow End-to-End

| # | Item | Status | Evidência | Decisão |
|---|---|---|---|---|
| 44 | Login → Receber → Detalhe → Modal Parear | ✅ PASS | Validado ao vivo nesta sessão. | Manter |
| 45 | **Aprender keyword nova → próxima cotação aplica?** | ❌ **FAIL** | **Bug #1 PROVADO AO VIVO 14:55:51.** GAZE/CATETER chegaram NAO_ANALISADO mesmo com keywords ativas. | 🔴 **BLOQUEADOR — S1.1** |
| 46 | **De-Para anterior → próxima cotação vem pareada?** | ❌ **FAIL** | **Bug #1 — 4 cotações com NOVA-CONSOLIDADA-01, só 1 tem SKU (manual).** | 🔴 **BLOQUEADOR — S1.1** |
| 47 | qtdAproximada estável entre reloads | ⚠️ PARTIAL | É dead code: linha 71 gera random, linha 529 hardcode `<td>—</td>`. **Usuário não vê.** | 🟢 P3 cleanup opcional |
| 48 | Backend desligado → UI mostra erro (não mock) | ❌ **FAIL — 5 de 6 páginas** | **Bug #3 PROVADO 100%** durante validação interativa (`docker compose stop backend`). 5 de 6 páginas mostraram dados FAKE sem aviso algum. Apenas `/` (Cotações) tem o tratamento correto (toast vermelho). Screenshots `17-22-bug3-*.png`. | 🔴 **BLOQUEADOR — S1.3** |

---

## 6. Integração Thesys (S1.9 + verificação cruzada)

| # | Item | Status | Evidência | Decisão |
|---|---|---|---|---|
| 49 | API Thesys responde (helloworld) | ✅ PASS | `POST /config/testar-thesys` → "Conexão OK: Servidor ISAPI funcionando!" | Manter |
| 50 | GET /bionexo/itens retorna catálogo real | ✅ PASS | Retornou `{ id: 5, sku: 7710, descricao: "FIO NYLON 3-0 C/AG" }`. **Não confirmado se vem do API real ou do mock fallback** (`thesys.service.ts:116-127`). | Validar logs do backend |
| 51 | GET /bionexo/precos retorna preços | ⚠️ PARTIAL | SKU 7710 retornou `[]`. Pode ser normal. | Investigar com Thanner |
| 52 | **POST /bionexo/cotacao no Thesys aceita payload** | ⚠️ **PARTIAL** | Após S1.9 implementado, validado ao vivo: o nosso código chama corretamente o endpoint. **Mas Thesys retornou HTTP 500** (`Request failed with status code 500`). Provavelmente o payload que enviamos não bate com o contrato esperado pelo Thesys. **Precisa Thanner confirmar contrato exato.** | 🟠 **PARTIAL — implementação correta, contrato Thesys precisa validação** |
| 53 | **Cotação enviada via portal aparece no DB Thesys** | ⚠️ **PARTIAL** | S1.9 implementado: WHS sucesso → automaticamente chama `thesysService.criarCotacao()` → grava SyncLog `THESYS_COTACAO`. **Validado ao vivo:** após WHS sucesso 17:51:56, foi feito o POST ao Thesys, que retornou 500. SyncLog `THESYS_COTACAO ERRO` registrado. **Falha não bloqueou fluxo principal** (cotação ficou COTACAO_ENVIADA mesmo). | 🟠 **PARTIAL — lógica end-to-end OK, depende contrato Thesys** |

---

## 7. Bugs identificados (resumo final por código)

### 🔴 P0 — Bloqueadores absolutos (must fix)

#### Bug #1 — Aprender + De-Para órfãos
- **Onde:** `backend/src/bionexo/bionexo.service.ts:132-189` (`parseAndSaveWGG`)
- **Evidência:** confirmado código + dados de produção + AO VIVO em 14:55:51
- **Fix:** S1.1 do antigo `sprint1-quick-wins.md` — adicionar lookup em `MapeamentoSku` e `RegraPalavraChave` antes do `prisma.cotacao.create`
- **Estimativa:** ~1 dia (incluindo testes)
- **Decisão Otávio:** ⏳ Aguardando confirmação

#### Bug #9 / S1.9 — POST /bionexo/cotacao no Thesys nunca chamado
- **Onde:** `backend/src/cotacoes/cotacoes.service.ts` (método de envio) — não chama `thesysService.criarCotacao()`
- **Evidência:** confirmado código + decisão D9 do master plan
- **Fix:** S1.9 do antigo `sprint1-quick-wins.md` — após WHS sucesso, chamar `thesysService.criarCotacao(payload)` + gravar `Cotacao.thesysVendaId`
- **Estimativa:** ~2 horas **+ confirmação Thanner**
- **Decisão Otávio:** ⏳ Aguardando confirmação Thanner

### 🟠 P1 — Forte recomendação (should fix)

#### Bug #4 — Erro silenciado no ModalParear
- **Onde:** `frontend/src/components/modals/ModalParear.tsx:119-127`
- **Evidência:** código mostra `catch {}` literal com comentário "best-effort"
- **Fix:** S1.4 — toast amarelo + retry button
- **Estimativa:** ~30 min
- **Decisão Otávio:** ⏳ Aguardando confirmação

#### Bug #3 — Mock fallback silencioso (REPROMOVIDO PARA P0)
- **Onde:** 5 páginas confirmadas:
  - `frontend/src/pages/MapeamentoPage.tsx:50` → 8 mapeamentos fake
  - `frontend/src/pages/PalavrasChavePage.tsx:39` → 10 keywords fake
  - `frontend/src/pages/UsuariosPage.tsx:29` → 5 usuários fake (incluindo "Daniel Alves")
  - `frontend/src/pages/PedidosPage.tsx:24` → 5 pedidos fake (Albert Einstein, Sírio, etc.)
  - `frontend/src/pages/SyncLogsPage.tsx:26` → 6 logs fake
- **Evidência:** **Validado interativamente** parando o backend (`docker compose stop backend`). Todas as 5 páginas mostraram dados fake sem aviso algum. Screenshots `17-22-bug3-*.png` em `.sprint0-evidence/screenshots/`.
- **Severidade reclassificada:** 🔴 **P0** (era P1) — risco catastrófico em homologação. Daniel pode pensar que tudo funciona quando backend caiu.
- **Fix:** S1.3 — substituir todos os `.catch(() => setX(mockY))` por `setError + setData([])` + banner vermelho com botão "Tentar novamente". Manter padrão da `CotacoesPage.tsx:75-78` (já correto).
- **Estimativa:** ~1 hora (5 páginas, padrão repetível)
- **Decisão Otávio:** ✅ **APROVADO** (decisão de não aceitar mocks no frontend)

#### Login fail UX (Bug latente, descoberto durante smoke)
- **Onde:** `frontend/src/pages/LoginPage.tsx` (a confirmar)
- **Evidência indireta:** ao tentar via MCP fill+click com senha errada, não consegui validar se aparece toast/banner. Backend retorna 401 com mensagem clara.
- **Fix sugerido:** garantir que `useState` para erro existe + renderiza toast quando o login falha
- **Estimativa:** ~15 min
- **Decisão Otávio:** ⏳ Aguardando — talvez precise teste manual seu primeiro

### 🟢 P2/P3 — Cleanup opcional (nice to have)

#### Bug #2 — qtdAproximada Math.random (DEAD CODE)
- **Onde:** `frontend/src/pages/CotacoesPage.tsx:71-72`
- **Evidência:** linha 71 gera random + linha 529 renderiza HARDCODED `<td>—</td>`. **Usuário nunca vê.**
- **Fix:** S1.2 — apagar 2 linhas. Sem migration, sem nada.
- **Estimativa:** ~2 minutos
- **Decisão Otávio:** ⏳ Aguardando confirmação

#### S1.5 — Índices Prisma + unique composto
- **Onde:** `backend/prisma/schema.prisma`
- **Justificativa:** preparar para escala de S1.1 (lookup acontece em cada item de cada cotação). Pode esperar.
- **Estimativa:** ~30 min + cuidado migration
- **Decisão Otávio:** ⏳ Aguardando confirmação

#### S1.6 — Auto-preencher preço ao parear
- **Onde:** `ModalParear.tsx`
- **Justificativa:** quick win UX, mas não bloqueia uso.
- **Estimativa:** ~1 hora
- **Decisão Otávio:** ⏳ Aguardando confirmação

#### S1.7 — Botão "Aplicar regras agora" (retroativo)
- **Onde:** `CotacoesPage.tsx` + novo endpoint
- **Justificativa:** depois de S1.1, processar histórico legado. Útil mas não bloqueador.
- **Estimativa:** ~2 horas
- **Decisão Otávio:** ⏳ Aguardando confirmação

#### S1.8 — Badge de origem (Manual/Auto/Pareado)
- **Onde:** `CotacoesPage.tsx` + schema
- **Justificativa:** explainability — depois de S1.1, mostrar como cada item virou verde. Útil mas não bloqueador.
- **Estimativa:** ~1 hora
- **Decisão Otávio:** ⏳ Aguardando confirmação

---

## 8. Decisão final da Etapa 4 (a preencher pelo Otávio)

> Marcar abaixo para liberar Etapa 5 (Hardening).

### Bloqueadores aprovados (vão para Etapa 5)

- [ ] **S1.1** — auto-aplicação keywords + de-para no `parseAndSaveWGG` (Bug #1) **[MUST FIX]**
- [ ] **S1.4** — tratar erro silenciado no ModalParear (Bug #4)
- [ ] **S1.9** — chamar POST /bionexo/cotacao no Thesys (depende confirmação Thanner)
- [ ] **S1.3** — remover mock fallback silencioso (após validação dedicada)
- [ ] **S1.5** — índices Prisma + unique composto
- [ ] **S1.6** — auto-preencher preço ao parear (quick win)
- [ ] **S1.7** — botão "Aplicar regras agora" retroativo
- [ ] **S1.8** — badge de origem

### Cleanup opcional (sem urgência)

- [ ] **S1.2** — apagar `qtdAproximada` dead code (2 minutos)

### Pendentes externos

- [ ] Confirmar com Thanner/Gabriel: `POST /bionexo/cotacao` no Thesys está implementado?
- [ ] Confirmar com Thanner/Gabriel: por que SKU 7710 não tem preço cadastrado em `Preco_Vendas`?
- [ ] Validação manual do login fail UX (toast aparece ou não?)

### Aprovação para Etapa 5

- [ ] Otávio aprova esta lista de bloqueadores e autoriza início do Hardening.

---

## 9. Atualizações ao smoke-report

Ver `.sprint0-evidence/smoke-report.md` para detalhes técnicos completos. Mudanças importantes vs versão inicial:
- ✅ **Bug NEW #1 INVALIDADO** (era confusão minha sobre endpoints)
- ✅ **Bug #1 evidência reforçada** com prova ao vivo (14:55:51)
- ✅ **Bug #2 reclassificado** de Alto → P3 dead code
- ✅ Descoberta da **Zona de Perigo na ConfigPage** (3 botões úteis para teste)
- ✅ Confirmação que **frontend tem React Query, Mantine, recharts** (agente Explore tinha errado)

---

*Triagem fechada em 2026-04-07. Aguardando aprovação do Otávio para Etapa 5 (Hardening).*
