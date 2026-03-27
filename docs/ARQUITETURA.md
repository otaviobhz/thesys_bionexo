# Arquitetura — Portal Thesys-Bionexo

## Visão Geral

O Portal Bionexo é um sistema standalone que orquestra a comunicação entre a plataforma Bionexo (marketplace de cotações hospitalares) e o ERP Thesys, sem duplicar dados de cadastro.

**Abordagem:** Portal com Integração Profunda (Orquestrador)

```
┌─────────────┐     EDI/SOAP      ┌──────────┐     API REST    ┌──────────┐
│   BIONEXO   │ ◄──────────────► │  PORTAL   │ ◄────────────► │  THESYS   │
│ (Plataforma)│                  │ (React +  │   tempo real   │   ERP     │
│             │                  │  NestJS)  │                │ (SQL Srv) │
└─────────────┘                  └──────────┘                └──────────┘
```

**Princípio central:** O Portal NÃO armazena produtos, preços ou clientes. Esses dados vêm do Thesys em tempo real via API. O portal armazena apenas o que é específico do fluxo Bionexo (cotações recebidas, mapeamentos, status, logs).

---

## Stack Técnica

| Componente | Tecnologia | Porta | Função |
|-----------|-----------|-------|--------|
| Frontend | React 19 + Vite + TanStack Router + Tailwind v4 | 7000 | Interface do operador |
| Backend | NestJS 11 + Prisma 7 + BullMQ | 7001 | API + Jobs + Integração |
| Banco Local | PostgreSQL 18 | 7432 | Dados do portal |
| Fila | Redis 7 | 7379 | Jobs BullMQ (polling) |
| ERP | Thesys API (SQL Server) | Externo | Fonte de verdade |
| Marketplace | Bionexo EDI WebService v3.13 | Externo | Cotações hospitalares |

---

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PORTAL BIONEXO (Docker Compose)                  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    FRONTEND (React)                         │   │
│  │                                                             │   │
│  │  Login → Cotações (Home) → Detalhe/Edição → Envio          │   │
│  │  Dicionário De-Para → Pedidos → Config → Utilizadores      │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                              │ HTTP                                 │
│  ┌──────────────────────────┴──────────────────────────────────┐   │
│  │                    BACKEND (NestJS)                          │   │
│  │                                                             │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │   │
│  │  │   Auth   │ │ Cotações │ │ Mapeam.  │ │   Bionexo    │  │   │
│  │  │  (JWT)   │ │  (CRUD)  │ │ (De-Para)│ │ (SOAP Client)│  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │   │
│  │  │ Pedidos  │ │  Config  │ │   Sync   │ │   Thesys     │  │   │
│  │  │          │ │          │ │  (Logs)  │ │ (API Client) │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │              BullMQ Jobs (Redis)                      │  │   │
│  │  │  bionexo-download (3-5min) | thesys-sync (30min)     │  │   │
│  │  │  auto-parear (após download) | bionexo-update (5min) │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                              │                                      │
│  ┌──────────────────────────┴──────────────────────────────────┐   │
│  │                PostgreSQL (Dados Locais)                     │   │
│  │  cotacoes | cotacao_itens | mapeamentos | regras_keywords   │   │
│  │  pedidos | sync_logs | config | usuarios | hospital_cache   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
         │                                    │
         │ EDI SOAP                           │ API REST
         ▼                                    ▼
┌──────────────────┐               ┌──────────────────┐
│     BIONEXO      │               │     THESYS ERP   │
│                  │               │                  │
│ WGG: Download    │               │ GET /itens       │
│ WHS: Responder   │               │ GET /precos      │
│ WHU: Alterar     │               │ GET /hospitais   │
│ WGA: Prorrogar   │               │ PUT /cotacao     │
│ WJG: Pedidos     │               │                  │
│ WKN: Status      │               │ Tabelas:         │
│ WMG: Cadastro    │               │  Itens           │
│                  │               │  Unidades        │
│ Sandbox/Produção │               │  Compras_Precos  │
│ Token + CNPJ     │               │  CliFor          │
└──────────────────┘               │  Vendas_Cotacoes │
                                   └──────────────────┘
```

---

## Responsabilidade de Dados

### O que o Portal armazena (PostgreSQL local)

| Tabela | Descrição | Motivo |
|--------|-----------|--------|
| `cotacoes` | Cotações recebidas do Bionexo (PDC) | Dados Bionexo, não existem no Thesys |
| `cotacao_itens` | Itens de cada cotação com status/categoria | Workflow de classificação local |
| `mapeamentos_sku` | Pareamento Bionexo → SKU Thesys | Regra local de vinculação |
| `regras_keywords` | Palavras-chave para auto-classificação | Inteligência local |
| `pedidos` | Pedidos confirmados pelo hospital | Cache do WJG |
| `sync_logs` | Logs de todas as operações EDI e API | Auditoria e debug |
| `config_bionexo` | Token, CNPJ, polling, ambiente | Configuração local |
| `config_thesys` | URL, auth da API Thesys | Configuração local |
| `usuarios` | Usuários do portal (Master/Operador) | Auth local |
| `hospital_cache` | Cache de dados cadastrais dos hospitais | Performance |

### O que o Portal busca do Thesys (API REST)

| Dado | Endpoint | Frequência | Motivo |
|------|----------|------------|--------|
| Produtos ativos | `GET /itens` | Sob demanda + cache 30min | Pareamento e busca SKU |
| Preços | `GET /precos/:id/itens` | Sob demanda | Sugestão de preço |
| Hospitais | `GET /hospitais` | Cache refresh 1h | Validação de CNPJ |
| Criar cotação | `PUT /cotacao` | Ao enviar cotação | Registrar no ERP |

### O que o Portal envia/recebe do Bionexo (EDI SOAP)

| Operação | Código | Direção | Frequência |
|----------|--------|---------|------------|
| Download cotações | WGG | ← Bionexo | Polling 3-5min |
| Responder cotação | WHS | → Bionexo | Sob demanda |
| Alterar/Cancelar | WHU | → Bionexo | Sob demanda |
| Prorrogações | WGA | ← Bionexo | Polling 3-5min |
| Pedidos confirmados | WJG | ← Bionexo | Polling 3-5min |
| Status itens | WKN | → Bionexo | Sob demanda |
| Cadastro comprador | WMG | ← Bionexo | Sob demanda |

---

## Fluxo Principal do Operador

```
1. RECEBER                    2. CLASSIFICAR              3. PAREAR
   Bot baixa cotações            Operador analisa            Operador vincula
   do Bionexo (WGG)             cada item:                  produto Bionexo
   a cada 3-5 minutos           - Interessante              ao SKU do Thesys
                                - Descartar                 (busca via API)
        │                       - Ensinar keyword
        ▼                            │                           │
   ┌─────────┐                       ▼                           ▼
   │RECEBIDO │ ──────────────► ┌───────────┐ ────────────► ┌──────────┐
   └─────────┘                 │CLASSIFICADO│               │ PAREADO  │
                               └───────────┘               └──────────┘
                                                                │
4. COTAR                      5. ENVIAR                    6. ACOMPANHAR
   Operador preenche             Portal envia ao              Hospital avalia,
   preço e comentário            Bionexo (WHS) e ao           aceita ou rejeita.
   para cada item               Thesys (PUT /cotacao)        Pedido confirmado
   pareado                       simultaneamente              baixado (WJG)
        │                            │                           │
        ▼                            ▼                           ▼
   ┌──────────┐               ┌─────────────┐             ┌────────────┐
   │ COTADO   │ ────────────► │COT. ENVIADA │ ──────────► │PEDIDO GERADO│
   └──────────┘               └─────────────┘             └────────────┘
```

---

## Fluxo de Envio (Momento Crítico)

Quando o operador clica "Enviar Cotação", acontecem 2 coisas simultaneamente:

```
                    ┌──────────────────┐
                    │  Operador clica  │
                    │  "Enviar Cotação"│
                    └────────┬─────────┘
                             │
                    ┌────────┴─────────┐
                    │                  │
                    ▼                  ▼
           ┌──────────────┐   ┌──────────────┐
           │  1. BIONEXO  │   │  2. THESYS   │
           │  WHS Upload  │   │ PUT /cotacao  │
           │  (XML SOAP)  │   │  (JSON REST) │
           └──────┬───────┘   └──────┬───────┘
                  │                  │
                  ▼                  ▼
           ┌──────────────┐   ┌──────────────┐
           │ Cotação       │   │ Vendas_      │
           │ respondida    │   │ Cotacoes +   │
           │ na plataforma │   │ Itens criados│
           └──────────────┘   └──────────────┘
```

**Se Bionexo OK + Thesys OK:** Status → "Cotação Enviada"
**Se Bionexo OK + Thesys FALHA:** Retry automático para Thesys, aviso ao operador
**Se Bionexo FALHA:** Não cria no Thesys, mostra erro ao operador

---

## Jobs Automáticos (BullMQ + Redis)

| Job | Intervalo | Ações | Fallback |
|-----|-----------|-------|----------|
| `bionexo-download` | 3-5min (config) | WGG → parse XML → salvar novas cotações → auto-parear | Retry com backoff |
| `bionexo-update` | 5min | WGA (prorrogações) + WJG (pedidos confirmados) | Retry com backoff |
| `thesys-sync` | 30min | GET /itens → atualizar cache local de produtos | Usa cache anterior |
| `auto-parear` | Após cada download | Aplica regras de keywords + SKU mappings | Log de falhas |

**Controle:**
- Toggle ON/OFF na tela de Configurações
- Botão "Receber Novos" para trigger manual (bypass do intervalo)
- Dashboard de jobs com último status e horário

---

## Segurança

| Aspecto | Implementação |
|---------|---------------|
| Auth Portal | JWT (access + refresh token), bcrypt para senhas |
| Perfis | Master (tudo) / Operador (apenas cotações) |
| Bionexo | Token + CNPJ por fornecedor (SSL em produção) |
| Thesys API | Bearer token ou API key (definir com Thanner/Gabriel) |
| LGPD | Logs de auditoria por operação, nunca apagar usuários |
| Rate Limiting | Bionexo: mínimo 1min entre downloads |

---

## Evolução Futura

### Curto prazo (MVP)
- Portal standalone funcional
- Integração EDI Bionexo completa
- Integração API Thesys (GET itens + PUT cotação)

### Médio prazo
- LLM middleware para sugestão de pareamento (Interest Score 0-100)
- Dashboard analítico com métricas de conversão
- Notificações push para cotações vencendo

### Longo prazo
- Módulo integrado ao Thesys v2 (quando migração TypeScript concluir)
- Multi-marketplace (outros portais além do Bionexo)
- App mobile para aprovação rápida

---

## Dependências Externas

| Item | Responsável | Status |
|------|-------------|--------|
| API REST do Thesys (4 endpoints) | Thanner/Gabriel | Pendente — queries prontas em `docs/thesys/queries_api_thesys.sql` |
| Token Bionexo sandbox | Otávio/Bionexo | Pendente |
| Renomear Compras_Precos → Preço_Vendas | Time Thesys | Pendente |
| Planilha De-Para existente | Daniel Alves | Pendente |
| Ambiente de teste Thesys (URL) | Thanner/Gabriel | Pendente |
