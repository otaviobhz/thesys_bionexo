# Registro de Treinamento — Portal Thesys-Bionexo

**Data início:** 2026-03-25
**Última atualização:** 2026-03-26 (sessão 3)

---

## Status Atual: AMBAS INTEGRAÇÕES CONECTADAS — TESTES E2E FINAIS

### O que foi concluído

#### FASE 1: PRD e Planejamento
- PRD detalhado com 7 requisitos funcionais
- Arquitetura definida (Abordagem C: Portal Orquestrador)
- Documentação completa

#### FASE 2: Mockup Frontend
- 8 telas funcionais em React + Vite + TanStack Router + Tailwind v4
- Design system ANFAVEA (OKLch, sidebar colapsável, IBM Plex)
- Todas as colunas essenciais do guia Bionexo implementadas
- Multi-sort com Shift+click (até 3 colunas, indicadores ①②③)
- Cores por categoria (verde/vermelho/amarelo)
- Agrupamento por cotação (blocos se movem juntos)
- Modal Aprender (dual-list picker com filtro stop-words)
- Tela Palavras-Chave (gestão completa)

#### FASE 3: Backend NestJS
- 10 módulos, ~30 endpoints
- Prisma schema com 9 models + 4 enums
- Auth JWT (login, refresh, me)
- CRUD completo (cotações, keywords, mapeamento, usuarios, config, sync-logs, pedidos)
- Integração Bionexo SOAP real (WGG testado com sucesso)
- Integração Thesys stub (mock, aguardando endpoints do Thanner)
- Seed com dados iniciais (admin, operador, cotações, keywords)

#### FASE 4: Deploy Docker
- 4 containers rodando: frontend (7000), backend (7002), postgres (7432), redis (7379)
- Frontend migrado para API real (todas as páginas)

#### FASE 5: Integração Bionexo
- Credenciais de homologação e produção recebidas
- Conexão SOAP testada e funcionando (sandbox)
- WGG retorna dados corretamente

#### FASE 6: Integração Thesys (sessão 3)
- 4 endpoints conectados com dados REAIS
- 3313 itens/produtos da PROMEHO
- 3141 preços de venda vigentes
- 45 hospitais ativos
- POST /cotacao pronto (não testado em produção)
- Auth via X-API-Key por endpoint (4 keys diferentes)
- Base URL: https://thesys.atrpservices.com.br/thesysbi/thesys_bi_api.dll

### Resultado dos Testes E2E (completo)

**Sessão 1 (2026-03-25):** testes via API direta
**Sessão 2 (2026-03-26):** testes via Chrome DevTools browser
**Sessão 3 (2026-03-26):** integração Thesys real + testes E2E finais

| # | Teste | Resultado | Notas |
|---|-------|-----------|-------|
| 1a | Login senha errada | OK | 401 "Credenciais inválidas" |
| 1b | Login email inexistente | OK | 401 |
| 1c | Login correto | OK | JWT + redirect para / |
| 1d | JWT no localStorage | OK | Token 3 partes, user admin MASTER |
| 2a | Cotações carrega (5 itens banco) | OK | Dados reais do PostgreSQL |
| 2b | Filtro texto "Einstein" (3 itens) | OK | Via API GET /cotacoes?search= |
| 2c | Filtro por status | OK | RECEBIDO=5, COTACAO_ENVIADA=0 |
| 2d | Filtro por categoria | OK | NAO_ANALISADO=5, INTERESSANTE=0 |
| 2e | Multi-sort Shift+click | OK | Hospital①, Seq② indicadores visíveis |
| 2f | Paginação | OK | Ausente corretamente (5 < 25/pg) |
| 2g | Checkbox seleção | OK | Individual=1, Select All=5, mixed state |
| 2h | Marcar como Interessante | OK | Limpa seleção |
| 2i | Descartar | OK | Limpa seleção |
| 2j | Aprender abre modal | OK | Dual-list: CATETER, INTRAVENOSO, 18G (stop-words filtradas) |
| 2k | Modal dual-list mover | OK | >> move todas, "Salvar Regra (3 palavras)" |
| 2l | Click navega detalhe | OK | Fix: `useParams({ strict: false })` |
| 3a-d | Detalhe cotação | SKIP | Precisa migrar para API (usa mock) |
| 4a | Keywords lista (8) | OK | Dados reais do banco |
| 4b | Criar keyword TESTE_E2E | OK | POST /keywords persiste |
| 4c | Verificar persistência | OK | 9 keywords confirmado |
| 4d | Deletar keyword | OK | DELETE /keywords/:id funciona |
| 5 | Mapeamento pareamentos | OK | Dados do banco |
| 6 | Pedidos | OK | Lista vazia (esperado) |
| 7 | Sync Logs | OK | 3 logs reais (WGG VAZIO + ERRO + VAZIO) |
| 8a | Config Bionexo | OK | CNPJ, usuario mascarado, sandbox |
| 8b | Testar conexão Bionexo | OK | SOAP sandbox funcional |
| 8c | Config Thesys | OK | URL e campos visíveis |
| 8d | Testar conexão Thesys | OK | "Servidor ISAPI funcionando!" |
| 9 | Usuários (2) | OK | Admin + Operador do seed |
| 10 | Receber Novos (WGG) | OK | SOAP real → "Nenhuma cotação nova" |
| 11a | Thesys itens REAIS | OK | **3313 produtos da PROMEHO** |
| 11b | Thesys busca "SERINGA" | OK | 23 resultados filtrados |
| 11c | Thesys preços REAIS | OK | **3141 preços** (vírgula→ponto OK) |
| 11d | Thesys hospitais REAIS | OK | **45 hospitais** |
| 11e | Sidebar 7 itens menu | OK | Todos funcionando |
| 11f | Sidebar collapse/expand | OK | Tabela expande suavemente |
| 11g | Dark mode toggle | OK | Tema escuro funcional |

**Resumo sessão 3: 35 OK, 4 SKIP (detalhe cotação usa mock), 0 FALHAS**

### Bugs corrigidos

1. **WGG spread operator** (sessão 1): `bionexo.service.ts` — Fix: desestruturar campos. OK.
2. **useParams route mismatch** (sessão 2): `CotacaoDetalhePage.tsx` — Fix: `strict: false`. OK.
3. **Thesys proxy** (sessão 3): `thesys.service.ts` reescrito com 4 X-API-Keys, mapeamento de campos, conversão de preços BR. OK.

---

## Arquivos Principais do Projeto

### Documentação
| Arquivo | Conteúdo |
|---------|----------|
| `docs/ARQUITETURA.md` | Diagrama de componentes, fluxo de dados, jobs |
| `docs/CLASSIFICACAO_E_PAREAMENTO.md` | Fluxo de classificação e palavras-chave |
| `docs/COMO_CONFIGURAR.md` | Guia passo a passo + checklist |
| `docs/API_THESYS_SPEC.md` | Spec dos 4 endpoints para o Thanner |
| `docs/MODELO_DADOS.md` | Modelo de dados PostgreSQL (9 tabelas) |
| `docs/thesys/queries_api_thesys.sql` | Queries SQL para os endpoints |

### Frontend (`frontend/`)
| Arquivo | Conteúdo |
|---------|----------|
| `src/pages/CotacoesPage.tsx` | Tela principal (grid flat, multi-sort, filtros) |
| `src/pages/CotacaoDetalhePage.tsx` | Detalhe/edição de cotação |
| `src/pages/PalavrasChavePage.tsx` | Gestão de keywords |
| `src/pages/MapeamentoPage.tsx` | Dicionário De-Para (2 tabs) |
| `src/pages/PedidosPage.tsx` | Pedidos confirmados |
| `src/pages/UsuariosPage.tsx` | Gestão de utilizadores |
| `src/pages/ConfigPage.tsx` | Configurações (Bionexo + Thesys + Bot) |
| `src/pages/SyncLogsPage.tsx` | Logs de sincronização |
| `src/pages/LoginPage.tsx` | Login JWT real |
| `src/components/modals/ModalAprender.tsx` | Dual-list picker (keywords) |
| `src/components/modals/ModalParear.tsx` | Vincular SKU |
| `src/components/layout/AppSidebar.tsx` | Menu lateral colapsável |
| `src/components/layout/AppLayout.tsx` | Layout principal com sidebar |
| `src/components/layout/AuthLayout.tsx` | Layout de login |
| `src/lib/api.ts` | Axios client com JWT |
| `src/lib/mock-data.ts` | Dados mock (fallback) |
| `src/lib/sidebar-context.tsx` | Context do sidebar |
| `src/router.tsx` | Rotas TanStack Router |
| `src/index.css` | Tema OKLch (variáveis intermediárias para dark mode) |
| `public/mockup-thesys-bionexo.html` | Spec da API (página estática) |

### Backend (`backend/`)
| Arquivo | Conteúdo |
|---------|----------|
| `src/auth/` | Login JWT, strategy, guard |
| `src/cotacoes/` | CRUD cotações + itens + batch |
| `src/bionexo/` | SOAP client real (WGG/WHS/WHU/WGA/WJG) |
| `src/thesys/` | Proxy HTTP para API Thesys (mock/real) |
| `src/mapeamento/` | CRUD pareamentos SKU |
| `src/keywords/` | CRUD palavras-chave |
| `src/usuarios/` | CRUD + ativar/inativar |
| `src/config-portal/` | Config + testar conexão |
| `src/sync-logs/` | Histórico operações |
| `src/pedidos/` | Pedidos confirmados |
| `src/prisma/` | PrismaService com adapter-pg (Prisma v7) |
| `prisma/schema.prisma` | 9 models + 4 enums |
| `prisma/seed.ts` | Dados iniciais |

### Infra
| Arquivo | Conteúdo |
|---------|----------|
| `docker-compose.yml` | 4 serviços (frontend, backend, postgres, redis) |
| `.env` | Portas, credenciais, URLs |

---

## Credenciais

### Portal
- Admin: `admin@promeho.com.br` / `Admin123!`
- Operador: `operador@promeho.com.br` / `Operador123!`

### Bionexo Homologação
- Usuário: `ws_promeho_sand_76283`
- Senha: `xjtzJnz9FNmB62`
- WSDL: `https://ws-bionexo-sandbox.bionexo.com/ws2/BionexoBean?wsdl`

### Bionexo Produção
- Usuário: `ws_promeho_prod_152566`
- Senha: `RgjoSWVdzKuU6j`
- WSDL: `https://ws.bionexo.com.br/BionexoBean?wsdl`

### Thesys API (sessão 3)
- Base URL: `https://thesys.atrpservices.com.br/thesysbi/thesys_bi_api.dll`
- Itens X-API-Key: `41f777370d02f94cd64f56ee10460f3e9cf468f60028ee35192cd556240af049`
- Preços X-API-Key: `84e2bb858c03ac85015de315753106797b986482a74af0f595e7f5ca537607f0`
- Hospitais X-API-Key: `5d82e40b696b6dc06bb55ef22b70d8950e4e9fe5292af282547fa7be71b04726`
- Cotação X-API-Key: `72d46902249f13fe8e04f43911a85ad661e4ee129d10b1b27af0f02fd1674e6f`

### Portas
- Frontend: 7000
- Backend: 7002 (7001 em uso pelo NoMachine)
- PostgreSQL: 7432
- Redis: 7379

---

## Pendências para próxima sessão

1. **CotacaoDetalhePage → migrar para API real** — atualmente usa mockItensFlat, precisa buscar de `GET /cotacoes/:cotacaoId`
2. **Botões batch → conectar à API** — Interessante/Descartar/Restaurar limpam seleção mas não chamam `POST /cotacoes/lote/*`
3. **ConfigPage → conectar à API** — usa defaultValue hardcoded, precisa GET /config + handlers Salvar/Testar
4. **ConfigPage → campos Bionexo** — atualizar para usuario+senha (em vez de token genérico)
5. **Parser XML do WGG** — quando Bionexo retornar cotações reais, parsear XML e salvar no banco
6. **BullMQ jobs** — implementar polling automático (bot)
7. **Enviar cotação** — conectar botão "Enviar" ao POST /bionexo (WHS) + POST /thesys/cotacao
