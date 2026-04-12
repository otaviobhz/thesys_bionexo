# Roleplay de Onboarding — Portal Thesys-Bionexo

> Guia interativo passo a passo para um operador novo aprender a usar o portal.
> Gerado em 2026-04-11, validado ao vivo via Cloudflare Tunnel.

---

## Visão Geral

| Cena | O que aprende | Página |
|---|---|---|
| 1 | Lista de Cotações (overview) | `/` |
| 2 | Detalhe de uma cotação | `/cotacoes/:id` |
| 3 | As 4 categorias de item | `/cotacoes/:id` |
| 4 | Ensinar o sistema (Modal Aprender) | `/cotacoes/:id` → Modal |
| 5 | Parear ao SKU Thesys (Modal Parear) | `/cotacoes/:id` → Modal |
| 6 | Cotar o preço (painel direito) | `/cotacoes/:id` → Painel |
| 7 | Enviar resposta + Logs de Sync | `/cotacoes/:id` + `/sync-logs` |

---

## Cena 1 — Lista de Cotações

**URL:** `/`

**O que o operador vê:**

- **Sidebar esquerda** com 8 menus: Cotações, Palavras-Chave, Dicionário De-Para, Pedidos, Utilizadores, Logs de Sync, Documentação, Configurações
- **Header:** Empresa PROMEHO + Local de envio (dropdown) + botões "Receber novos" e "Atualizar Bionexo"
- **Filtros:** Texto livre, Nº PDC, Status (Todos/Recebido/Enviada/Aceita...), Categoria (Todas/Interessante/Descartado...), checkbox "Com oportunidade pendente"
- **Ações em lote:** Marcar Interessante, Desmarcar, Descartar, Restaurar, Aprender — ativam ao selecionar checkboxes
- **Tabela:** PDC, Hospital, Vencimento, Hora, UF, Cidade, Seq, Descrição, Cód.Comercial, Cód.Prod.Hosp, Qtde, Und, Marca, F.Pagto, Produto Vinculado

**Cores das linhas:**

| Cor | Categoria | Significado |
|---|---|---|
| Amarelo claro | NAO_ANALISADO | Ninguém viu ainda |
| Verde claro | INTERESSANTE | "Vendemos, vamos cotar" |
| Vermelho claro | DESCARTADO | "Não vendemos, ignorar" |
| Azul claro | COTADO | Preço salvo + enviado |

**Ação:** Clicar no ícone "Abrir cotação" ou na linha para entrar no detalhe.

---

## Cena 2 — Detalhe da Cotação

**URL:** `/cotacoes/:id`

**Seções da tela:**

### Header
- Número da cotação + badge de status (Recebido/Enviada/Aceita...)
- Nome do hospital + CNPJ + botão "Ver Cadastro (WMG)"
- Vencimento + Hora + botão "Atualizar vencimento"
- Forma de Pagamento + Total de Itens

### Toolbar de ações
4 botões (ativam ao selecionar itens via checkbox):
- **Descartar** — marca como "não vendemos"
- **Interessante** — marca como "vendemos"
- **Ensinar** — abre Modal Aprender (regra de palavra-chave)
- **Parear** — abre Modal Parear (vincular SKU Thesys)

### Grid de itens
Colunas: Seq, Descrição, Qtde, Und, Marca, Cód.Interno, Desc.Interna, Preço Unit., Comentário, Categoria

### Painel de edição (lado direito)
Aparece ao clicar em um item na grid:
- **Produto (SKU):** código do produto no Thesys
- **Preço Unitário:** R$ por unidade
- **Comentário:** nota interna (só equipe vê)
- **Observação do Fornecedor:** texto que vai para o hospital
- **Salvar / Cancelar** (Cancelar fecha o painel)
- **Navegação:** "1 / N" com setas ← → para pular entre itens

### Formulário de envio (rodapé)
- Data, Validade, Condição de Pagamento, Prazo de Entrega, Faturamento Mínimo, Tipo de Frete (CIF/FOB)
- Botão "Enviar Cotação" — desabilitado se houver itens NAO_ANALISADO ou INTERESSANTE sem SKU

---

## Cena 3 — As 4 Categorias

Cada item da cotação passa por um fluxo decisório:

```
NAO_ANALISADO (amarelo) → operador decide:
  ├── INTERESSANTE (verde) → parear SKU → preencher preço → enviar → COTADO (azul)
  └── DESCARTADO (vermelho) → fim, não precisa preencher nada
```

**Regra de ouro:** não pode ter nenhum item NAO_ANALISADO quando for enviar. O botão "Enviar Cotação" fica desabilitado e mostra aviso amarelo.

---

## Cena 4 — Ensinar o Sistema (Modal Aprender)

**Como abrir:** selecionar item via checkbox → clicar "Ensinar"

**O que o modal mostra:**
- **Item selecionado:** descrição (read-only)
- **Disponíveis (N):** palavras extraídas da descrição (stop-words já removidas)
- **Selecionadas (0):** palavras que formarão a regra
- **4 setas:** `>` mover 1, `>>` mover todas, `<` devolver 1, `<<` devolver todas
- **Ação:** "Classificar como Interessante" ou "Classificar como Descartar"
- **Salvar Regra / Cancelar**

**Exemplo:** Selecionar "DIPIRONA" → Interessante → Salvar Regra. Da próxima vez que chegar cotação com "DIPIRONA", o item já vem VERDE automaticamente.

**Onde verificar regras existentes:** Menu Palavras-Chave

---

## Cena 5 — Parear ao SKU Thesys (Modal Parear)

**Como abrir:** selecionar item via checkbox → clicar "Parear"

**O que o modal mostra:**
- **Descrição Bionexo:** o que o hospital pediu (read-only)
- **Campo de busca:** "Digite código, descrição ou EAN..." — mínimo 2 caracteres
- **Dropdown de resultados:** até 15 SKUs do Thesys (busca em tempo real)
- **Preview:** SKU, descrição, unidade
- **Confirmar Pareamento / Cancelar**

**Ao confirmar:**
1. Item recebe o SKU vinculado
2. Vínculo é salvo no Dicionário De-Para
3. Na próxima cotação com a mesma descrição, o SKU já vem preenchido

**Diferença Aprender vs Parear:**

| | Aprender (Keyword) | Parear (De-Para) |
|---|---|---|
| O que cria | Regra por palavra-chave | Vínculo exato descrição → SKU |
| Granularidade | Genérica ("DIPIRONA" = qualquer dipirona) | Específica (descrição exata → SKU exato) |
| Preenche SKU? | Não — só muda a cor | Sim — traz SKU + preço |
| Quando usar | Classificar rápido em massa | Pareamento completo |

**Onde verificar vínculos existentes:** Menu Dicionário De-Para

---

## Cena 6 — Cotar o Preço

**Onde:** Painel de edição (lado direito da grid de itens)

**Campos:**
- **Produto (SKU):** preenchido pelo pareamento (ou manual)
- **Preço Unitário (R$):** preço por unidade para o hospital
- **Comentário:** nota interna (equipe)
- **Observação do Fornecedor:** texto visível ao hospital

**Fluxo:**
1. Parear SKU → preço pode vir auto-preenchido do Thesys
2. Operador revisa/ajusta preço
3. Clicar "Salvar"
4. Seta → próximo item
5. Repetir

**Navegação:** botão "Apenas Interessantes" filtra só itens que precisam preço. Setas « ‹ › » para pular.

---

## Cena 7 — Enviar Cotação + Logs de Sync

### Formulário de envio

| Campo | Descrição |
|---|---|
| Data | Data da proposta (normalmente hoje) |
| Validade | Até quando o preço é válido |
| Condição de Pagamento | 30 DDL, 28 DDL, etc. (herda do hospital) |
| Prazo de Entrega | Dias para entregar |
| Faturamento Mínimo | R$ mínimo para faturar |
| Tipo de Frete | CIF (incluso) ou FOB (hospital paga) |

**Validações:**
- Nenhum item NAO_ANALISADO → classificar todos
- Itens INTERESSANTE devem ter SKU pareado
- Data e Validade preenchidas

**Ao enviar:** portal empacota em XML (WH_Resposta) → envia via SOAP → Bionexo repassa ao hospital → status muda para "Cotação Enviada"

### Logs de Sincronização (`/sync-logs`)

Cada linha é uma operação EDI:

| Operação | Direção | O que faz |
|---|---|---|
| WGG | Download | Receber cotações do Bionexo |
| WHS | Upload | Enviar resposta de cotação |
| WGA | Download | Verificar prorrogações de vencimento |
| WJG | Download | Verificar pedidos confirmados |
| WKN | Download | Verificar status dos itens |
| WMG | Download | Consultar cadastro de hospital |
| THESYS_COTACAO | Upload | Replicar cotação no Thesys ERP |

**Status:** SUCESSO (verde), ERRO (vermelho), VAZIO (cinza)

**Fluxo esperado:**
```
WGG SUCESSO → "X cotações recebidas"     (chegou do Bionexo)
WHS SUCESSO → "PDC xxxxxx enviada"       (você respondeu)
WGA SUCESSO → prorrogações (se houver)
WJG SUCESSO → "pedido gerado"            (hospital aceitou!)
```

---

## 7 Perguntas de Validação

Ao final do onboarding, o operador deve saber responder:

1. **Como abrir uma cotação?** → Clicar no ícone ou na linha na lista
2. **Como classificar um item?** → Checkbox + botão Interessante ou Descartar
3. **Como parear ao Thesys?** → Checkbox + Parear → digitar 2+ chars → selecionar SKU → Confirmar
4. **Como preencher preço?** → Clicar no item → painel direito → R$ → Salvar
5. **Como enviar?** → Formulário rodapé (Data/Validade/Pagamento/Frete) → "Enviar Cotação"
6. **Onde ver se deu certo?** → Menu Logs de Sync → procurar WHS SUCESSO
7. **Diferença Aprender vs Parear?** → Aprender = palavra-chave (muda cor) / Parear = vínculo exato (preenche SKU + preço)
