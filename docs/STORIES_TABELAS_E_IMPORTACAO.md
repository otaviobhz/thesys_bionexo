# Stories — Padronização de Tabelas e Import/Export

## Story 1: Migrar todas as tabelas para MantineReactTable

### Objetivo
Substituir todas as tabelas HTML manuais do portal por `MantineReactTable`, o mesmo componente usado no logmed_consignado. Isso traz filtro por coluna, multi-sort, show/hide colunas, paginação e density toggle — tudo built-in.

### Justificativa
As tabelas atuais são `<table>` manuais com sort customizado. O MantineReactTable oferece todas as funcionalidades solicitadas sem código extra.

### Pré-requisitos
- Instalar `mantine-react-table` e dependências Mantine no frontend
- Instalar `@mantine/core @mantine/hooks @mantine/dates`

### Tabelas a migrar (6 páginas)

#### 1.1 Cotações (`/` — CotacoesPage.tsx)
- **Colunas atuais:** 20 (checkbox, ícones, Id PDC, Hospital, etc.)
- **Funcionalidades a manter:** Cores por categoria, ícones Coroa/Prancheta, checkbox batch
- **Funcionalidades novas:** Filtro por coluna, show/hide colunas, density toggle
- **Cuidados:**
  - Manter handleRowClick para navegação ao detalhe
  - Manter batch actions (Interessante, Descartar, Restaurar, Aprender)
  - Manter cores de linha por categoria (Cell customizado)
  - Manter ícones Coroa e Prancheta na primeira coluna de grupo

#### 1.2 Palavras-Chave (`/palavras-chave` — PalavrasChavePage.tsx)
- **Colunas:** Palavra-Chave, Ação Automática, Matches, Data Criação, Ações
- **Funcionalidades a manter:** Cores por ação (verde/vermelho), botões Editar/Excluir
- **Funcionalidades novas:** Filtro por coluna, show/hide, sort built-in

#### 1.3 Dicionário De-Para (`/mapeamento` — MapeamentoPage.tsx)
- **Colunas:** ID Regra, Descrição Comprador, SKU Thesys, Descrição Interna, Data, Ações
- **Funcionalidades a manter:** Botão Desfazer
- **Funcionalidades novas:** Filtro por coluna, sort built-in

#### 1.4 Pedidos (`/pedidos` — PedidosPage.tsx)
- **Colunas:** Pedido Bionexo, Hospital, CNPJ, Data, Valor Total, Status
- **Funcionalidades a manter:** Badge de status colorido
- **Funcionalidades novas:** Filtro por coluna, sort, paginação

#### 1.5 Utilizadores (`/usuarios` — UsuariosPage.tsx)
- **Colunas:** Nome, E-mail, Perfil, Status, Ações
- **Funcionalidades a manter:** Badges MASTER/OPERADOR, toggle Ativo/Inativo
- **Funcionalidades novas:** Filtro por coluna

#### 1.6 Logs de Sync (`/sync-logs` — SyncLogsPage.tsx)
- **Colunas:** Data/Hora, Operação, Direção, Status, Mensagem, Processadas
- **Funcionalidades a manter:** Badges coloridos por status/direção
- **Funcionalidades novas:** Filtro por coluna (especialmente útil: filtrar por operação ou status)

### Config padrão para todas as tabelas
```tsx
const table = useMantineReactTable({
  columns,
  data,
  enableColumnFilters: true,
  enableSorting: true,
  enablePagination: true,
  enableDensityToggle: false,
  enableColumnActions: true,       // Menu de ações por coluna (hide, filter)
  enableGlobalFilter: true,        // Busca global
  enableColumnResizing: true,      // Redimensionar colunas
  initialState: {
    density: 'xs',
    pagination: { pageIndex: 0, pageSize: 25 }
  },
  mantineTableProps: {
    highlightOnHover: true,
    striped: true,
    withTableBorder: true,
    withColumnBorders: true,
  },
  mantinePaperProps: { shadow: 'none', withBorder: false },
})
```

### Critérios de Aceite
- [ ] Todas as 6 tabelas usam MantineReactTable
- [ ] Filtro por coluna funciona em todas
- [ ] Multi-sort funciona (Shift+Click)
- [ ] Show/hide colunas funciona
- [ ] Paginação funciona
- [ ] Cores, ícones e badges preservados
- [ ] Dark mode funciona
- [ ] Busca global funciona
- [ ] Botões de ação (editar, excluir, etc.) funcionam

### Estimativa: 4-6 horas

---

## Story 2: Padronizar botão Info (i) em toda importação/exportação Excel

### Objetivo
Garantir que toda funcionalidade de upload/download de Excel tenha o botão Info (i) circular ao lado, que abre modal popup mostrando o formato esperado das colunas.

### Padrão Visual (já implementado)
```
[Excel (verde)] [Importar] [Info (i circular)]
```

Ao clicar no (i):
- Abre modal popup com overlay escuro
- Header gradiente verde com ícone Info + título
- Grid mostrando colunas A, B, C... com badges "obrigatório"/"opcional"
- Descrição de cada coluna
- Nota sobre formatos aceitos
- Botão "Fechar"

### Componente reutilizável (já criado)
`frontend/src/components/modals/ImportInfoModal.tsx`

### Páginas que já têm o padrão
- [x] Palavras-Chave (`/palavras-chave`) — 2 colunas
- [x] Dicionário De-Para (`/mapeamento`) — 3 colunas

### Páginas que precisam do padrão (quando tiverem import/export)
- [ ] Cotações (`/`) — se adicionar export de cotações
- [ ] Pedidos (`/pedidos`) — se adicionar export de pedidos
- [ ] Utilizadores (`/usuarios`) — se adicionar import de usuários
- [ ] Sync Logs (`/sync-logs`) — se adicionar export de logs

### Regra para novos desenvolvimentos
> **REGRA:** Toda vez que uma nova tabela for criada ou uma funcionalidade de upload/download de Excel for adicionada a qualquer página:
> 1. Usar `MantineReactTable` para a tabela
> 2. Adicionar botão (i) circular ao lado dos botões Excel/Importar
> 3. O (i) deve abrir o `ImportInfoModal` com as colunas esperadas
> 4. Manter o padrão visual: `[Excel verde] [Importar outline] [Info circular]`

### Critérios de Aceite
- [ ] ImportInfoModal existe e é reutilizável
- [ ] Todas as páginas com import/export usam o padrão
- [ ] Botão (i) abre modal popup (não colapsável)
- [ ] Modal mostra colunas com badges obrigatório/opcional
- [ ] Documentação em docs/CLAUDE.md atualizada com a regra

### Estimativa: 1-2 horas (maior parte já implementada)

---

## Regras para Documentação (docs/CLAUDE.md)

Adicionar ao CLAUDE.md do projeto:

### Padrão de Tabelas (OBRIGATÓRIO)

Toda tabela do portal DEVE usar `MantineReactTable` com a config padrão:
- `enableColumnFilters: true`
- `enableSorting: true`
- `enablePagination: true`
- `enableColumnActions: true`
- `enableGlobalFilter: true`
- `initialState: { density: 'xs', pagination: { pageSize: 25 } }`

### Padrão de Import/Export Excel (OBRIGATÓRIO)

Toda funcionalidade de upload/download de Excel DEVE incluir:
1. Botão **Excel** (verde, bg-green-600) para download
2. Botão **Importar** (outline) para upload
3. Botão **Info (i)** circular ao lado, que abre `ImportInfoModal`
4. O modal deve listar todas as colunas com badges obrigatório/opcional
5. Usar lib `xlsx` (SheetJS) para leitura/escrita de arquivos

### Padrão de Versionamento

- Formato: `vYYYY.MM.DD.HH.MM` (fuso São Paulo)
- Gerado automaticamente no build via `vite.config.ts`
- Toda alteração deve ter entrada no `CHANGELOG.md`
