# Plano: Componente DataTable Reutilizável — Próxima Sessão

## Decisão
Usar `@tanstack/react-table` v8 (já instalado) em vez de MantineReactTable para evitar conflito com shadcn/ui.

## Componente a Criar
`frontend/src/components/ui/DataTable.tsx` — componente genérico reutilizável

### Features obrigatórias
- Filtro por coluna (input em cada header)
- Multi-column sort (Shift+Click, até 3 níveis com ①②③)
- Show/hide colunas (dropdown com checkboxes)
- Busca global (input no topo)
- Paginação (25 itens/página, botões anterior/próxima)
- Redimensionar colunas (drag)
- Density toggle (compacto/normal)
- Dark mode
- Cell customizado (para badges, cores, ícones)

### Props do componente
```tsx
interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  searchPlaceholder?: string
  onRowClick?: (row: T) => void
  renderActions?: (row: T) => ReactNode  // coluna Ações
  pageSize?: number  // default 25
}
```

## Páginas a migrar (6 total)

### 1. Palavras-Chave (`/palavras-chave`)
- 5 colunas: Palavra-Chave, Ação, Matches, Data, Ações
- Manter: cores verde/vermelho por ação, botões Editar/Excluir
- Manter: Export Excel, Import, Info (i)

### 2. Dicionário De-Para (`/mapeamento`)
- 6 colunas: ID, Descrição Comprador, SKU, Descrição Interna, Data, Ações
- Manter: botão Desfazer, Export/Import Excel, Info (i)

### 3. Pedidos (`/pedidos`)
- 6 colunas: Pedido, Hospital, CNPJ, Data, Valor, Status
- Manter: badges de status coloridos

### 4. Utilizadores (`/usuarios`)
- 5 colunas: Nome, Email, Perfil, Status, Ações
- Manter: badges MASTER/OPERADOR, toggle Ativo/Inativo

### 5. Logs de Sync (`/sync-logs`)
- 6 colunas: Data/Hora, Operação, Direção, Status, Mensagem, Processadas
- Manter: badges coloridos

### 6. Cotações (`/` — CotacoesPage)
- 20 colunas: a mais complexa
- Manter: cores por categoria, Coroa/Prancheta, checkbox batch, multi-sort
- Fazer POR ÚLTIMO (mais complexa)

## Ordem de execução recomendada
1. Criar componente `DataTable.tsx` genérico
2. Migrar Palavras-Chave (simples, 5 colunas)
3. Migrar Sync Logs (simples, read-only)
4. Migrar Pedidos (simples, read-only)
5. Migrar Utilizadores (médio, tem ações)
6. Migrar De-Para (médio, tem import/export)
7. Migrar Cotações (complexo, muitas features)

## Referência
Baseado no padrão do logmed_consignado:
- `components/escopo/VinculosAuditoresTab.tsx`
- `components/escopo/AgendamentoTab.tsx`
- `components/LogsDataTable.tsx`

## Regras
- Toda tabela usa DataTable
- Todo import/export tem botão Info (i) circular
- Versionamento vYYYY.MM.DD.HH.MM (fuso SP)
- Commit + push após cada página migrada

## Estimativa
- DataTable component: 2h
- 5 páginas simples: 3h (30-40min cada)
- Cotações (complexa): 2h
- Total: ~7h
