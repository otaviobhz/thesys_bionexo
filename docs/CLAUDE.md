# Thesys ERP Web — Guia para IA

## Projeto
Thesys ERP v2 — migração do sistema Delphi/UniGUI para stack TypeScript moderna.
**Projeto legado:** `F:\dev2\thesys` (Delphi) — NÃO MODIFICAR.
**DB legado:** thesys_dev em 10.200.0.4 (referência para migração)
**DB novo:** thesys_dev_new em Docker local e depois em meu servidor em 10.200.0.8 (PostgreSQL)

## Abordagem: Framework First
O foco atual é construir o **framework do ERP** (auth, RBAC, multi-tenancy, auditoria).
Módulos de negócio serão migrados incrementalmente usando `/migrate-module`.

## Stack (manter atualizado — usar sempre a versao mais recente)
- **Frontend:** Next.js 16+ (App Router), React 19+, TanStack Query v5, TanStack Table v8, Zustand v5, React Hook Form 7+ + Zod 4
- **UI:** shadcn/ui + Tailwind CSS v4, IBM Plex Sans/Mono
- **Backend:** NestJS 11+, Prisma ORM 7+, PostgreSQL 18+, Redis 7+, BullMQ
- **Auth/Seguranca:** Passport 0.7+, passport-jwt 4+, bcrypt 6+, @nestjs/jwt 11+
- **Infra:** Docker Compose, Nginx, Turborepo + pnpm
- **Linguagem:** TypeScript 5.9+ end-to-end, Zod como contrato compartilhado

### Versoes Atuais Instaladas (atualizado 2026-03-19)
| Pacote | Range no package.json | Latest disponivel | Notas |
|--------|----------------------|-------------------|-------|
| Next.js | ^16.1.6 | 16.1.7 | OK — auto-resolve |
| React | ^19.2.4 | 19.2.4 | OK |
| TypeScript | ^5.9.0 | 5.9.3 | OK |
| NestJS | ^11.0.0 | 11.1.17 | OK — auto-resolve |
| Prisma | ^7.0.0 | 7.5.0 | OK — migrado para v7 com adapter-pg + prisma.config.ts |
| Zod | ^4.3.6 | 4.3.6 | OK — migrado de v3, `z.record()` agora requer 2 args |
| bcrypt | ^6.0.0 | 6.0.0 | OK — migrado de v5, binários via prebuildify |
| TanStack Query | ^5.62.0 | 5.90.21 | OK — auto-resolve |
| TanStack Table | ^8.20.0 | 8.21.3 | OK — auto-resolve |
| Zustand | ^5.0.0 | 5.0.12 | OK — auto-resolve |
| Tailwind CSS | ^4.0.0 | 4.2.1 | OK — auto-resolve |
| React Hook Form | ^7.54.0 | 7.71.2 | OK — auto-resolve |
| @hookform/resolvers | ^4.1.3 | 4.1.3 | OK — atualizado para compat com Zod 4 |
| @nestjs/jwt | ^11.0.0 | 11.0.2 | OK |
| Passport | ^0.7.0 | 0.7.0 | OK |
| passport-jwt | ^4.0.1 | 4.0.1 | OK |

### Zod 4 — Notas de Migração (concluída 2026-03-19)
- `z.record(valueSchema)` agora requer 2 args: `z.record(z.string(), valueSchema)`
- Validadores string (`.email()`, `.uuid()`, `.url()`) também disponíveis como top-level (`z.email()`, `z.uuid()`)
- `z.uuid()` no v4 é strict RFC 4122 — usar `z.guid()` se precisar do comportamento lenient do v3
- `.merge()` deprecated → usar `.extend()`
- `.deepPartial()` removido
- `.pick()`/`.omit()` em schemas com `.refine()` agora lança erro
- Error API: `message` param → `error`, `.format()`/`.flatten()` → `z.treeifyError()`
- `z.nativeEnum()` removido → `z.enum()` aceita enums nativos
- `z.record()` com enum key agora exige todas as chaves (usar `z.partialRecord()` para parcial)
- Performance: parsing 7-15x mais rápido, bundle 57% menor, tsc 100x menos instanciações
- `@hookform/resolvers` atualizado para ^4.1.3 (compat Zod 4)

### bcrypt 6 — Notas de Migração (concluída 2026-03-19)
- API idêntica ao v5 (`hash`, `compare`, `genSalt`) — zero alterações de código
- Binários pré-compilados via `prebuildify` (dentro do pacote npm) em vez de download externo via `node-pre-gyp`
- Elimina vetor de ataque supply-chain (sem download de binários de servidor externo)
- Requer Node.js 18+ (já atendido)
- Hashes gerados com v5 são 100% compatíveis com v6

### Prisma 7 — Notas de Migração (concluída 2026-03-18)
- `prisma.config.ts` em `packages/prisma/` com `datasource.url` para CLI
- Generator: `provider = "prisma-client"`, `moduleFormat = "cjs"`
- `url` removido do `datasource` no schema (agora via adapter no runtime)
- PrismaService usa `@prisma/adapter-pg` com `PrismaPg({ connectionString })`
- Seed usa adapter diretamente
- Exports via `dist/src/index.js` (compilado pelo tsc)

### Politica de Versoes
- **Ao iniciar trabalho no projeto**, verificar se Next.js, NestJS, Prisma, e libs de seguranca (bcrypt, passport, jwt) estao na versao mais recente com `npm view <pkg> version`
- **Ao adicionar dependencias**, sempre usar `pnpm add <pkg>@latest` (exceto Prisma que requer planejamento para upgrades major)
- **Nunca fixar versoes antigas** — usar range `^` para permitir patches automaticos

## Monorepo
```
apps/
  api/          → NestJS (porta 3001)
  web/          → Next.js (porta 3000)
packages/
  prisma/       → Schema Prisma + client singleton
  schemas/      → Contratos Zod (compartilhados front/back)
  ui/           → Design system tokens + componentes
  utils/        → Formatters, validators, masks, buildWhere, pagination
  fiscal/       → NF-e types (stub, expansão futura)
```

## Comandos
```bash
pnpm install                    # Instalar dependências
pnpm dev                        # Dev local (api + web via turbo)
pnpm build                      # Build de produção
pnpm docker:up                  # Subir Postgres + Redis + Nginx
pnpm db:generate                # Gerar Prisma Client
pnpm db:migrate                 # Rodar migrations
pnpm db:seed                    # Seed inicial
```

## Deploy para Teste
O ambiente de teste roda via **Docker Compose**. Após alterações no código:
```bash
docker compose up -d --build api web   # Rebuild e restart dos containers
docker compose exec api npx tsx node_modules/@thesys/prisma/src/seed.ts  # Re-seed se necessário
```
- **Web:** http://localhost:3000
- **API:** http://localhost:3001
- **NUNCA usar `pnpm dev` para testes** — sempre rebuildar os containers Docker

## Design System
- **Tokens exatos:** `packages/ui/src/tokens/` (colors, theme, typography, spacing)
- **Referência visual:** `packages/ui/src/reference/ThesysDesignSystem.tsx`
- **CSS Variables:** `apps/web/src/app/globals.css` (light/dark com hex exatos)
- **Primary:** Cyan (#0891B2 light, #22D3EE dark)
- **Neutral:** Slate
- **Status badges:** PAGO(green), ABERTO(amber), VENCIDO(rose), EMITIDA(violet), CANCELADA(slate)
- **Dark mode:** Zustand + localStorage, sem FOUC (script no <head>)

## Padrões de Código

### Backend (NestJS)
- Cada entidade: Controller → Service → Repository → DTO
- Repository sempre filtra por `empresaId` (multi-tenant)
- Soft delete via Prisma middleware (`deletedAt`)
- Validação com `ZodValidationPipe` usando schemas de `@thesys/schemas`
- Audit interceptor para LGPD em operações de escrita
- Auth via JWT + Passport (access + refresh tokens)
- RBAC via GrupoUsuario → GrupoUsuarioPermissao → Permissao (recurso + ação)

### Frontend (Next.js)
- App Router com layout aninhado (auth / dashboard)
- `DynamicFormBuilder` para formulários baseados em schema JSON
- `DataTable` headless com TanStack Table v8
- `FilterPanel` para filtros dinâmicos
- API client em `src/lib/api.ts` com auth automático
- Hooks Zustand: `use-theme.ts`, `use-auth.ts`

### Persistencia de Aba Ativa (OBRIGATÓRIO)

Ao salvar/adicionar/remover um registro dentro de uma aba ou sub-aba, o usuario DEVE permanecer na aba corrente apos a operacao. Nunca resetar a aba ativa ao recarregar dados — so mudar automaticamente quando o **contexto muda** (ex: selecionar outro usuario), nao quando os dados do contexto atual sao atualizados.

### Ordenação Multi-Coluna (OBRIGATÓRIO em toda tela com grid)

Toda tabela deve suportar ordenação por múltiplas colunas usando o hook `useMultiSort`.

**Hook:** `apps/web/src/hooks/use-multi-sort.ts` — `useMultiSort(data)`
**Componentes:** `apps/web/src/components/tables/sortable-header.tsx` — `SortableHeader` + `SortChipsBar`

**Comportamento:**
- 1o clique: ordena ascendente
- 2o clique: ordena descendente
- 3o clique: remove da ordenação
- Máximo 3 colunas simultâneas
- Chips de ordenação aparecem quando há 2+ colunas ativas

**Padrão de implementação:**
```typescript
const { sortedData, sorting, toggleSort, clearSort, removeSort, getSortState } = useMultiSort(data);
const COLUMN_LABELS: Record<string, string> = { campo: "Label", ... };

// Entre filtros e tabela:
<SortChipsBar sorting={sorting} labels={COLUMN_LABELS} onRemove={removeSort} onClearAll={clearSort} />

// No th:
<SortableHeader label="Label" onClick={() => toggleSort("campo")} {...getSortState("campo")} />

// No tbody: usar sortedData.map() em vez de data.map()
```

**Colunas não-ordenáveis:** Manter texto plano no th (ex: "Acoes", "Membros", colunas com dados aninhados)

### Clonagem de Registros (OBRIGATÓRIO em toda tela CRUD)

Toda tela CRUD deve incluir o botão **Duplicar** nas ações de cada linha da tabela.

**Utilitário:** `apps/web/src/lib/clone-utils.ts` — função `prepareCloneData(record, config)`

**Como funciona (frontend-only, sem endpoint extra):**
1. Botão `Copy` (lucide-react) na coluna de ações, ao lado de Editar/Excluir
2. onClick: busca registro completo via `GET /:id`
3. Executa `prepareCloneData(record, cloneConfig)` para:
   - Remover campos de sistema (`id`, `createdAt`, `updatedAt`, `deletedAt`, `createdBy`)
   - Adicionar " (Copia)" em campos de nome (`suffixFields`)
   - Limpar campos únicos como CNPJ/email (`clearFields`) — usuário deve preencher novo valor
   - Extrair IDs de relações aninhadas (`relationExtractors`) — ex: permissões de grupo
4. Abre o modal de criação (NÃO edição) com dados pré-preenchidos via prop `initialData`
5. Salva via `POST /` normal (endpoint de criação existente)

**Interface do `CloneConfig`:**
```typescript
interface CloneConfig {
  stripFields?: string[];      // Campos extras a remover
  suffixFields?: string[];     // Campos para adicionar " (Copia)"
  clearFields?: string[];      // Campos para limpar (usuario preenche)
  relationExtractors?: Record<string, (record: any) => unknown>;  // Relações → IDs
}
```

**Padrão de implementação na página:**
```typescript
// Estado
const [cloneData, setCloneData] = useState<Partial<EntityRow> | null>(null);

// Handler do botão Duplicar
async function handleClone(id: string) {
  const record = await api.get<EntityRow>(`/entidade/${id}`);
  const data = prepareCloneData(record, {
    suffixFields: ['nome'],
    clearFields: ['cnpj'],
    stripFields: ['_count'],
    relationExtractors: { permissaoIds: (r) => r.permissoes.map(p => p.permissao.id) }
  });
  setCloneData(data);
  setEditingEntity(null);
  setShowModal(true);
}

// Modal recebe initialData
<EntityFormModal
  entity={editingEntity}
  initialData={cloneData}
  onClose={() => { setShowModal(false); setCloneData(null); }}
  onSaved={() => { setShowModal(false); setCloneData(null); fetchEntities(); }}
/>
```

**Regras do modal com `initialData`:**
- Inicializar campos: `entity?.campo ?? initialData?.campo ?? ""`
- Título: `entity ? "Editar X" : initialData ? "Duplicar X" : "Novo X"`
- Modo de submissão: sempre `POST /` (criação), nunca `PUT /` (edição)
- Limpar `cloneData` no `onClose` para evitar dados residuais

**Quando desabilitar Duplicar:**
- Registros com flag `sistema: true` (grupos do sistema)
- Entidades que não fazem sentido clonar (User — email/senha são únicos por natureza)

**Para entidades com relações profundas** (ex: Pedido → Itens): criar endpoint `POST /:id/clone` no backend com `$transaction`, mas manter o mesmo padrão de UX no frontend (botão → modal pré-preenchido).

### Schemas (Zod)
- Todo schema exporta o objeto Zod + tipo TypeScript inferido
- Create schemas omitem campos gerenciados pelo servidor
- Update schemas são `.partial()` dos create schemas
- Validações brasileiras: CPF/CNPJ, CEP, NCM, UF

## Prisma Schema (Framework)
Modelos ativos:
- **Empresa** — Tenant root, CNPJ único, config JSONB tipado, campos expandidos (telefones, site, email, IBGE, certificado)
- **EmpresaCnae** — Junction empresa↔CNAE (código, descrição, principal)
- **User** — Email único global, superAdmin flag
- **UserEmpresa** — Junction N:N user↔empresa (SEM grupoUsuarioId direto)
- **UserEmpresaGrupo** — Junction N:N userEmpresa↔grupoUsuario (permite MULTIPLOS grupos por usuario)
- **UserPermissao** — Permissoes diretas no usuario (override de grupo, com flag `concedida` para grant/deny)
- **GrupoUsuario** — Grupos por empresa (Administradores, Usuarios, Visualizadores + customizados)
- **Permissao** — recurso + ação (ex: "usuarios" + "criar")
- **GrupoUsuarioPermissao** — Junction N:N grupo↔permissão
- **AccessLog** — Login/logout/switch tracking
- **AuditLog** — LGPD audit de operações de escrita
- **UserGridConfig** — Persistência de perfis de colunas do grid
- **Banco** — Tabela global de bancos (codBanco único)
- **BancoCarteira** — Carteiras por banco (global)
- **BancoConta** — Contas bancárias por empresa (multi-tenant, enderecoAgencia JSONB, refs contábeis)
- **Portador** — Portadores de cobrança por empresa (multi-tenant, configBoleto JSONB)
- **Armazem** — Armazéns/locais de estoque (global)
- **Deposito** — Depósitos por empresa (multi-tenant, FK armazem)
- **TipoFrete** — Tipos de frete fiscal (global, seed com CIF/FOB/etc)
- **CliFor** — Clientes/Fornecedores/Transportadoras (multi-tenant, flags, dadosRfb JSONB)
- **PlanoContas** — Plano contábil (global, hierárquico por nível/tipo)
- **NaturezaOperacao** — Naturezas de operação fiscal (multi-tenant, flags, alíquotas, configs ICMS/IPI JSONB)

Padrões:
- UUID como PK (`@db.Uuid`)
- Soft delete (`deletedAt`) em entidades de negócio
- Audit fields (`createdAt`, `updatedAt`, `createdBy`)
- Multi-empresa nativa (`empresaId` FK)
- JSONB para dados variáveis (endereco, config)
- Índices compostos para multi-tenancy
- **Timezone:** PostgreSQL em UTC, Prisma retorna ISO 8601 com `Z`. Frontend converte via `toLocaleString("pt-BR")` para fuso do navegador. NUNCA gravar em horário local — sempre UTC no banco.

## API Endpoints e Contratos

### Auth (`/api/auth`)
| Metodo | Rota | Body | Notas |
|--------|------|------|-------|
| POST | `/login` | `{ email, password }` | Retorna access + refresh tokens |
| POST | `/register` | `{ email, password, nome }` | Registro publico |
| POST | `/refresh` | `{ refreshToken }` | Renova tokens |
| GET | `/me` | — | Retorna usuario + empresas |
| PATCH | `/change-password` | `{ currentPassword, newPassword }` | |
| POST | `/switch-empresa` | `{ empresaId }` | Troca empresa ativa |

### Users (`/api/users`) — Requer JWT + RBAC
| Metodo | Rota | Body | Notas |
|--------|------|------|-------|
| GET | `/` | — | Paginado: `?page=&perPage=&search=` |
| GET | `/:id` | — | Inclui `userEmpresas` com `grupos[]` |
| POST | `/` | `{ email, password, nome, empresaId, grupoUsuarioIds: string[], ativo? }` | **grupoUsuarioIds e array de UUIDs** |
| PUT | `/:id` | `{ email?, nome?, ativo? }` | Update parcial |
| DELETE | `/:id` | — | Soft delete |
| POST | `/:id/reset-password` | `{ newPassword }` | Min 8 chars |
| GET | `/:id/empresas` | — | Lista empresas do usuario |
| POST | `/:id/empresas` | `{ empresaId, grupoUsuarioIds: string[], isDefault? }` | Vincula usuario a empresa |
| DELETE | `/:id/empresas/:empresaId` | — | Remove vinculo |

### Empresas (`/api/empresas`) — Requer JWT + RBAC
| Metodo | Rota | Body | Notas |
|--------|------|------|-------|
| GET | `/` | — | Paginado + `?search=` |
| GET | `/:id` | — | |
| GET | `/:id/grupos` | — | Lista GrupoUsuario ativos da empresa |
| POST | `/` | `{ razaoSocial, cnpj, nomeFantasia?, ... }` | |
| PUT | `/:id` | parcial | |
| DELETE | `/:id` | — | |

### Grupos de Usuarios (`/api/grupos-usuarios`) — Requer JWT + ADMIN
| Metodo | Rota | Body | Notas |
|--------|------|------|-------|
| GET | `/` | — | Paginado + `?search=`, filtra por empresa do JWT |
| GET | `/permissoes` | — | Lista TODAS as permissoes disponiveis |
| GET | `/:id` | — | Inclui permissoes e count de membros |
| POST | `/` | `{ nome, descricao?, permissaoIds: string[] }` | Cria grupo + atribui permissoes |
| PUT | `/:id` | `{ nome?, descricao?, ativo?, permissaoIds?: string[] }` | Atualiza + sync permissoes |
| DELETE | `/:id` | — | Soft delete (bloqueado se `sistema=true` ou tem membros) |

### Logs (somente leitura)
- `GET /api/access-logs` — Logs de acesso
- `GET /api/audit-logs` — Logs de auditoria (LGPD)

## RBAC — Regras Criticas

O sistema de permissoes usa **GrupoUsuario** (tabela `grupos_usuarios`), NAO strings de role.

### Arquitetura multi-grupo
- Um usuario pode pertencer a **MULTIPLOS grupos** por empresa via `UserEmpresaGrupo`
- Permissoes efetivas = uniao das permissoes de todos os grupos + overrides diretos no usuario (`UserPermissao`)
- `UserPermissao.concedida = false` permite negar explicitamente uma permissao herdada de grupo
- O `role` no JWT e derivado pelo grupo de maior privilegio (Administradores > Usuarios > Visualizadores)

### Regras
- **Nunca enviar `role: "ADMIN"`** — usar `grupoUsuarioIds: ["uuid1", "uuid2"]` (array)
- Para obter os grupos disponiveis: `GET /api/empresas/:empresaId/grupos` ou `GET /api/grupos-usuarios`
- O seed cria 3 grupos do sistema por empresa: `Administradores`, `Usuarios`, `Visualizadores`
- Grupos do sistema (`sistema: true`) nao podem ser renomeados nem excluidos
- O frontend exibe `userEmpresas[0].grupos[].grupoUsuario.nome` como badges visuais
- Schemas Zod em `@thesys/schemas` sao a fonte de verdade para validacao
- **Funcao `deriveRole()`** em `auth.service.ts` centraliza a derivacao de role a partir dos grupos

## Migração de Módulos
Usar `/migrate-module` para migrar cada módulo do legado:
1. Informa tabelas do banco legado
2. Fornece screenshots das telas atuais
3. Skill especifica e constrói no novo sistema

## Regras
- NUNCA modificar o projeto legado em `F:\dev2\thesys`
- Sempre usar Zod schemas de `@thesys/schemas` para validação
- **Antes de criar/editar um form, LER o schema Zod correspondente para garantir que os campos enviados batem com o contrato da API**
- **RBAC usa GrupoUsuario (UUID), NUNCA strings de role — consultar seção "RBAC — Regras Criticas"**
- Toda query de negócio DEVE filtrar por `empresaId`
- Labels e textos da UI em português brasileiro
- Testar com Jest/Vitest, meta de 80% cobertura em serviços financeiros/fiscais
- SPED está fora de escopo nesta versão
- SEMPRE antes de fazer alguma modificacao, busque na internet por documentacao oficial do framework, biblioteca ou tecnologia, usando context7 ou diretamente no site oficial. E só implemente se você estiver 100% certo de que vai funcionar.

## Workflow Orchestration

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

### 7. Security First
- Never hardcode secrets, API keys, or credentials under any circumstances
- Always validate and sanitize user inputs or external data sources
- Flag any potential security vulnerabilities in existing code before modifying it

### 8. Rollback Strategy
- If a bug fix or implementation attempt fails 3 times in a row, STOP
- Revert the codebase to the last known working state before trying a new approach
- Document why the previous approach failed in `tasks/lessons.md`

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections
7. **Update Docs**: Modify `README.md` or architectural docs if core behavior changes
8. **Inline Comments**: Add concise comments explaining *why* complex logic was written, not *what* it does

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
- **No Fluff**: Keep communication concise and strictly technical. Do not explain basic programming concepts unless explicitly asked.
- **Leave It Better**: Boy Scout Rule. Refactor small, related pieces of tech debt if you are already touching that specific block of code.
