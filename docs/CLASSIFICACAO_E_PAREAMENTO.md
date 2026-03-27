# Classificação de Itens e Pareamento de Produtos

## Como o operador trabalha hoje

O operador recebe cotações do Bionexo com itens descritos livremente pelos hospitais. Cada item precisa passar por 3 decisões antes de ser cotado:

**Decisão 1 — "Vendemos isso?"**
O operador lê a descrição do item e decide se é um produto que a PROMEHO comercializa.
- SIM → marca como **Interessante** (item fica verde na grid)
- NÃO → marca como **Descartar** (item fica vermelho na grid)
- NÃO SEI → fica como **Não Analisado** (item fica amarelo na grid)

**Decisão 2 — "Qual é o nosso código?"**
Se o item é interessante, o operador precisa vincular a descrição do Bionexo ao SKU do Thesys.
- Busca no catálogo do Thesys por código ou descrição
- Vincula: "Seringa 10ml Luer Lock" → SKU 9928

**Decisão 3 — "Quanto custa?"**
Com o SKU vinculado, o operador preenche o preço e envia a cotação.

**Regra:** Só pode enviar cotação se o item estiver PAREADO (com SKU). Item "Interessante" sem SKU ainda não pode ser cotado.

---

## As duas ferramentas de automação

### 1. Palavras-Chave (Aprender)

**O que é:** Uma lista de palavras que o sistema usa para AUTO-CLASSIFICAR itens em futuras cotações.

**Como funciona:**
- O operador vê um item novo: "ACETILCISTEINA 200MG COM SACHE - EMS"
- Marca como Interessante
- Clica em **"Aprender"**
- O sistema quebra a descrição em palavras e remove as irrelevantes (stop-words):
  - Remove: COM, -, S/, DE, PARA, etc.
  - Mostra: ACETILCISTEINA, 200MG, SACHE, EMS
- O operador escolhe as palavras que identificam o tipo de produto: **ACETILCISTEINA**
- Define a ação: **Classificar como Interessante**
- Salva

**Resultado:** Da próxima vez que uma cotação chegar com "ACETILCISTEINA" na descrição, o item já aparece VERDE automaticamente.

**Também funciona para descartar:** Se o operador salvar "MANUTENÇÃO" com ação "Descartar", todos os itens com "MANUTENÇÃO" na descrição já chegam VERMELHOS.

### 2. De-Para (Vincular Produto)

**O que é:** Um vínculo direto entre uma descrição do Bionexo e um SKU do Thesys.

**Como funciona:**
- O operador vê um item interessante sem SKU
- Clica em **"Vincular Produto"**
- Busca o SKU no catálogo do Thesys
- Vincula: descrição Bionexo → SKU Thesys

**Resultado:** Da próxima vez que a MESMA descrição aparecer, o item já vem com SKU preenchido, pronto para cotar.

---

## O que cada combinação significa

| Tem keyword? | Tem De-Para? | O que acontece | Cor | Pode cotar? |
|:---:|:---:|---|---|:---:|
| Não | Não | Item chega amarelo. Operador precisa avaliar. | Amarelo | Não |
| Sim (Interessante) | Não | Item chega verde, mas sem SKU. Precisa vincular. | Verde | Não |
| Não | Sim | Item chega com SKU preenchido, auto-interessante. | Verde | **Sim** |
| Sim (Interessante) | Sim | Item chega verde com SKU. Pronto para cotar. | Verde | **Sim** |
| Sim (Descartar) | — | Item chega vermelho. Ignorado. | Vermelho | Não |

---

## Cenário real: passo a passo

### Primeira vez que o operador vê "ACETILCISTEINA 200MG SACHE"

```
Cotação do Hospital Albert Einstein chega via Bionexo
Item: "ACETILCISTEINA 200MG COM SACHE - EMS"
→ Sistema verifica keywords: nenhuma encontrada
→ Sistema verifica De-Para: nenhum vínculo
→ Item aparece AMARELO (Não Analisado)

Operador olha: "Vendemos acetilcisteína? Sim."
→ Seleciona o item, clica "Marcar como Interessante"
→ Item fica VERDE

Operador quer automatizar para o futuro:
→ Seleciona o item, clica "Aprender"
→ Modal abre com palavras: ACETILCISTEINA | 200MG | SACHE | EMS
→ Seleciona "ACETILCISTEINA" → Ação: Interessante → Salva

Operador quer vincular ao SKU:
→ Seleciona o item, clica "Vincular Produto"
→ Busca "ACETILCISTEINA" no Thesys
→ Encontra SKU 1234 - ACETILCISTEINA 200MG SACHE
→ Confirma vínculo
→ Item agora está VERDE + SKU 1234

Operador cota:
→ Preenche preço R$ 45,00
→ Preenche comentário: "Entrega em 3 dias úteis"
→ Envia cotação
```

### Na semana seguinte: mesmo produto aparece de novo

```
Cotação do Hospital Sírio-Libanês chega
Item: "ACETILCISTEINA 200MG SACHE EMS"
→ Sistema verifica keywords: "ACETILCISTEINA" → match!
→ Auto-classifica como INTERESSANTE (verde)
→ Sistema verifica De-Para: vínculo exato encontrado!
→ Auto-preenche SKU 1234
→ Item aparece VERDE + SKU 1234 → PRONTO PARA COTAR

Operador só precisa confirmar o preço e enviar.
Tempo gasto: 5 segundos (vs. 2 minutos da primeira vez).
```

### Produto parecido mas diferente

```
Cotação chega com: "ACETILCISTEINA 600MG EFERVESCENTE"
→ Keyword "ACETILCISTEINA" → match! → INTERESSANTE (verde)
→ De-Para: "ACETILCISTEINA 200MG SACHE" ≠ "600MG EFERVESCENTE"
→ NÃO pareia (descrição diferente)
→ Item fica VERDE mas SEM SKU

Operador precisa vincular manualmente ao SKU correto (outro produto).
```

---

## Interface: Modal "Aprender"

Quando o operador clica "Aprender" com um item selecionado:

```
┌────────────────────────────────────────────────────────────┐
│  Aprender — Marcar Palavras                             X  │
│                                                            │
│  Item selecionado:                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ACETILCISTEINA 200MG COM SACHE - EMS                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  Selecione as palavras para auto-classificação:            │
│                                                            │
│  ┌─── Disponíveis ───┐            ┌── Selecionadas ──┐    │
│  │                   │            │                   │    │
│  │ ACETILCISTEINA    │   [ > ]    │                   │    │
│  │ 200MG             │   [>>]    │                   │    │
│  │ SACHE             │   [ < ]    │                   │    │
│  │ EMS               │   [<<]    │                   │    │
│  │                   │            │                   │    │
│  │ 🔍 Buscar...      │            │ 🔍 Buscar...      │    │
│  └───────────────────┘            └───────────────────┘    │
│                                                            │
│  Palavras removidas (stop-words): COM, -                   │
│                                                            │
│  Na próxima integração, itens com estas palavras serão:    │
│  (●) ★ Classificados como Interessante                     │
│  ( ) ✕ Classificados como Descartar                        │
│                                                            │
│                            [ Cancelar ]  [ Salvar Regra ]  │
└────────────────────────────────────────────────────────────┘
```

**Como usar:**
1. Palavras da descrição aparecem à esquerda (já sem stop-words)
2. Clique na palavra + clique `>` para mover para a direita
3. Ou clique `>>` para mover TODAS
4. Escolha a ação (Interessante ou Descartar)
5. Clique "Salvar Regra"

---

## Interface: Tela de Gestão de Palavras-Chave

Acessível pelo menu lateral: **Palavras-Chave** (abaixo de Cotações)

```
┌────────────────────────────────────────────────────────────┐
│  ★ Palavras-Chave                        [ + Adicionar ]   │
│                                                            │
│  🔍 Buscar: [__________]  Ação: [Todas ▼]  🔍  ✕           │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Palavra-Chave     │ Ação            │ Matches │ Ações  │ │
│ │────────────────────────────────────────────────────────│ │
│ │ ACETILCISTEINA    │ ★ Interessante  │    47   │ ✏️ 🗑   │ │
│ │ SERINGA           │ ★ Interessante  │   132   │ ✏️ 🗑   │ │
│ │ LUVA CIRURGICA    │ ★ Interessante  │    89   │ ✏️ 🗑   │ │
│ │ CATETER           │ ★ Interessante  │    56   │ ✏️ 🗑   │ │
│ │ FIO SUTURA        │ ★ Interessante  │    34   │ ✏️ 🗑   │ │
│ │ MASCARA CIRURGICA │ ★ Interessante  │    28   │ ✏️ 🗑   │ │
│ │ ALGODAO           │ ★ Interessante  │    21   │ ✏️ 🗑   │ │
│ │────────────────────────────────────────────────────────│ │
│ │ MANUTENÇÃO        │ ✕ Descartar     │    23   │ ✏️ 🗑   │ │
│ │ PAPEL A4          │ ✕ Descartar     │    15   │ ✏️ 🗑   │ │
│ │ LIMPEZA           │ ✕ Descartar     │     8   │ ✏️ 🗑   │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│  ★ Interessante = itens com esta palavra ficam VERDES      │
│  ✕ Descartar = itens com esta palavra ficam VERMELHOS      │
│  Matches = quantos itens foram classificados por esta regra│
└────────────────────────────────────────────────────────────┘
```

**O que o operador pode fazer aqui:**
- Ver todas as palavras-chave cadastradas
- Buscar uma palavra específica
- Filtrar por ação (Interessante/Descartar/Todas)
- Editar uma regra (mudar palavra ou ação)
- Excluir uma regra
- Adicionar uma nova regra manualmente (sem precisar ir pela cotação)

---

## Stop-words: o que o sistema filtra automaticamente

Quando o sistema quebra a descrição "ACETILCISTEINA 200MG COM SACHE - EMS" em palavras, ele remove automaticamente:

**Sempre remove:**
- Preposições: COM, DE, DO, DA, PARA, POR, EM, NO, NA, E, OU
- Artigos: O, A, OS, AS, UM, UMA
- Símbolos: - / % + C/ S/
- Genéricos: TIPO, MARCA, REF, COD, LOTE

**Mantém tudo que pode ser nome de produto, especificação ou marca.**

---

## Onde cada funcionalidade fica no sistema

| Funcionalidade | Onde | Como acessa |
|---|---|---|
| Marcar Interessante | Tela de Cotações | Seleciona item(s) → botão "Marcar como Interessante" |
| Descartar | Tela de Cotações | Seleciona item(s) → botão "Descartar" |
| Aprender (salvar keywords) | Modal na Tela de Cotações | Seleciona item → botão "Aprender" → modal abre |
| Vincular Produto (De-Para) | Modal na Tela de Cotações | Seleciona item → botão "Vincular Produto" → modal abre |
| Gestão de keywords | Tela Palavras-Chave | Menu lateral → "Palavras-Chave" |
| Gestão de De-Para | Tela Dicionário De-Para | Menu lateral → "Dicionário De-Para" |

---

## Menu lateral

```
1. Cotações              → Tela principal (grid de itens)
2. Palavras-Chave        → Gestão de keywords
3. Dicionário De-Para    → Gestão de pareamentos SKU
4. Pedidos               → Pedidos confirmados
5. Visão Geral           → Dashboard com estatísticas
6. Utilizadores          → Gestão de usuários
7. Logs de Sync          → Histórico de integrações
8. Configurações         → Token, polling, endpoints
```
