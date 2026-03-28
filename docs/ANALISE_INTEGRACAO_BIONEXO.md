# Análise Completa da Integração Bionexo — Portal Thesys-Bionexo

**Data:** 2026-03-28
**Baseado em:** Documentação EDI v3.14 + Guia Suprimed Bionexo + Código atual

---

## 1. Status Atual do Sistema

### O que está FUNCIONANDO

| Funcionalidade | Status | Evidência |
|----------------|--------|-----------|
| Conexão SOAP Bionexo | ✅ OK | Sandbox retornou cotação #211652791 (AAS 100mg) |
| Parser WGG (layout correto) | ✅ OK | Campos Pedidos.Pedido.Cabecalho + Itens_Requisicao.Item_Requisicao |
| Id_Artigo salvo no banco | ✅ OK | 136822011 para item AAS 100mg |
| Login JWT | ✅ OK | admin@promeho.com.br / Admin123! |
| Frontend design original | ✅ OK | Título, filtros, coroa, prancheta, batch actions |
| API Cotações (GET /cotacoes) | ✅ OK | 6 itens reais de 3 cotações |
| Batch actions API | ✅ OK | Interessante/Descartar/Restaurar chamam API |
| Toggle prioridade (Coroa) | ✅ OK | PATCH /cotacoes/:id/prioridade |
| Navegar detalhe (Prancheta) | ✅ OK | /cotacoes/:cotacaoId |
| Detalhe cotação com dados reais | ✅ OK | GET /cotacoes/:id com itens |
| Integração Thesys API | ✅ OK | 3313 itens, 3141 preços, 45 hospitais |
| Dark mode | ✅ OK | Toggle funcional |
| Sidebar collapse/expand | ✅ OK | Toggle funcional |
| Multi-sort Shift+click | ✅ OK | Até 3 colunas com indicadores ①②③ |

### O que está com PROBLEMA

| Problema | Gravidade | Descrição |
|----------|-----------|-----------|
| Sandbox 503 | EXTERNO | Servidor sandbox da Bionexo fora do ar (Akamai CDN) |
| Fallback mock silencioso | CRÍTICO | Frontend mostra 122 itens FAKE quando API falha, sem avisar |
| Enviar cotação é STUB | CRÍTICO | POST /cotacoes/:id/enviar NÃO chama Bionexo, só cria log |
| Cancelar cotação é STUB | CRÍTICO | POST /cotacoes/:id/cancelar NÃO chama Bionexo |
| Mensagens 503 inconsistentes | MÉDIO | 4 mensagens diferentes para o mesmo erro |
| Mock backend não usado | BAIXO | backend/src/bionexo/mock/ é código morto |
| Sem switch Sandbox/Produção na UI | UX | Trocar ambiente exige SQL direto no banco |

---

## 2. Validação contra Documentação Oficial

### 2.1 Operações SOAP — Comparação Código vs Documentação v3.14

| Operação | Documentação | Código Atual | Status |
|----------|-------------|-------------|--------|
| **WGG** (Receber cotações) | `<Pedidos><Pedido><Cabecalho>` + `<Itens_Requisicao><Item_Requisicao>` | ✅ Correto (reescrito nesta sessão) | OK |
| **WHS** (Enviar resposta) | Usa `Id_Artigo`, `Id_Forma_Pagamento`, `Codigo_Produto_Fornecedor`, `Fabricante` | ✅ Correto (reescrito nesta sessão) | OK |
| **WHU** (Alterar resposta) | Mesmo layout WH, com parâmetro `ID` | ❌ Não implementado | PENDENTE |
| **WGA** (Prorrogações) | Mesmo layout WG, atualiza datas de vencimento | ✅ Parser implementado | OK |
| **WIJ** (Pedidos confirmados) | Layout WJ: `<Confirmados><Confirmado>` | ✅ Correto (era WJG, corrigido para WIJ) | OK |
| **WKN** (Status itens) | Layout WK: `<Pedidos><Pedido><Itens><Item><Status>` | ✅ Implementado (GET /bionexo/status-itens/:idPdc) | OK |
| **WMG** (Dados cadastrais) | Layout WM: `<Empresas><Empresa>` | ❌ Não implementado | PENDENTE |

### 2.2 Campos do WGG — Comparação

| Campo Documentação | Tag XML | Código Atual | Banco (Prisma) |
|-------------------|---------|-------------|----------------|
| ID da Cotação | `<Id_Pdc>` | `cab.Id_Pdc` ✅ | `bionexoId` (Int, unique) |
| Título | `<Titulo_Pdc>` | `cab.Titulo_Pdc` ✅ | `tituloPdc` (String?) |
| Hospital | `<Nome_Hospital>` | `cab.Nome_Hospital` ✅ | `nomeHospital` (String) |
| CNPJ Hospital | `<CNPJ_Hospital>` | `cab.CNPJ_Hospital` ✅ | `cnpjHospital` (String) |
| Data Vencimento | `<Data_Vencimento>` DD/MM/YYYY | `cab.Data_Vencimento` ✅ | `dataVencimento` (DateTime) |
| Hora Vencimento | `<Hora_Vencimento>` | `cab.Hora_Vencimento` ✅ | `horaVencimento` (String) |
| UF | `<UF_Hospital>` | `cab.UF_Hospital` ✅ | `ufHospital` (String) |
| Cidade | `<Cidade_Hospital>` | `cab.Cidade_Hospital` ✅ | `cidadeHospital` (String) |
| Forma Pagamento | `<Forma_Pagamento>` | `cab.Forma_Pagamento` ✅ | `formaPagamento` (String?) |
| ID Forma Pagamento | `<Id_Forma_Pagamento>` | `cab.Id_Forma_Pagamento` ✅ | `idFormaPagamento` (Int?) |
| Contato | `<Contato>` | `cab.Contato` ✅ | `contato` (String?) |
| Observação | `<Observacao>` | `cab.Observacao` ✅ | `observacaoComprador` (Text?) |
| Termos | `<Termo>` | `cab.Termo` ✅ | `termos` (Text?) |
| Prioridade | N/A (nosso campo) | Toggle via API ✅ | `prioritaria` (Boolean) |

### 2.3 Campos dos Itens — Comparação

| Campo Documentação | Tag XML | Código Atual | Banco (Prisma) |
|-------------------|---------|-------------|----------------|
| Sequência | `<Sequencia>` | `item.Sequencia` ✅ | `sequencia` (Int) |
| ID Artigo Bionexo | `<Id_Artigo>` NUM(9) | `item.Id_Artigo` ✅ | `idArtigo` (Int) |
| Código Produto | `<Codigo_Produto>` CHAR(30) | `item.Codigo_Produto` ✅ | `codigoProduto` (String?) |
| Descrição | `<Descricao_Produto>` CHAR(1500) | `item.Descricao_Produto` ✅ | `descricaoBionexo` (String) |
| Quantidade | `<Quantidade>` NUMBER(12,4) | `parseFloat(item.Quantidade)` ✅ | `quantidade` (Float) |
| Unidade Medida | `<Unidade_Medida>` CHAR(22) | `item.Unidade_Medida` ✅ | `unidadeMedida` (String) |
| ID Unidade Medida | `<Id_Unidade_Medida>` NUM(4) | `item.Id_Unidade_Medida` ✅ | `idUnidadeMedida` (Int?) |
| Marca Favorita | `<Marca_Favorita>` CHAR(300) | `item.Marca_Favorita` ✅ | `marcaFavorita` (String?) |
| Marcas Homologadas | `<Marcas><Marca>` | `extractMarcas()` ✅ | `marcas` (String?) |

---

## 3. Funcionalidades do Guia Suprimed — Comparação

### 3.1 Tela Principal (Cotações)

| Feature Suprimed | Status Portal | Notas |
|-----------------|---------------|-------|
| Busca por hospital/produto/descrição | ✅ OK | Input de texto com filtro |
| Busca por Nº PDC | ✅ OK | Input numérico |
| Filtro por Status (8 tipos) | ✅ OK | Dropdown com todas opções |
| Filtro por Categoria (4 tipos) | ✅ OK | Dropdown com todas opções |
| Botão "Receber novos" | ✅ OK | Chama WGG, feedback visual |
| Botão "Atualizar" | ⚠️ Parcial | Existe mas sem handler específico |
| Marcar como Interessante | ✅ OK | Batch via API |
| Descartar | ✅ OK | Batch via API |
| Restaurar | ✅ OK | Batch via API |
| Ensinar (Aprender) | ✅ OK | Modal dual-list com stop-words |
| Coroa (Prioridade) | ✅ OK | Toggle via API |
| Prancheta (Abrir cotação) | ✅ OK | Navega para detalhe |
| Multi-sort | ✅ OK | Shift+click, até 3 colunas |
| Checkbox seleção | ✅ OK | Individual + Select All |
| Paginação | ✅ OK | 25 itens/página |
| Cores por categoria | ✅ OK | Verde/vermelho/amarelo/azul |

### 3.2 Tela Detalhe (Cotação)

| Feature Suprimed | Status Portal | Notas |
|-----------------|---------------|-------|
| Info cards (vencimento, pagamento, itens, CNPJ) | ✅ OK | 4 cards no topo |
| Tabela de itens | ✅ OK | 11 colunas |
| Painel edição (SKU, preço, comentário) | ✅ OK | Com observação fornecedor |
| Navegação entre itens | ✅ OK | Primeiro/Anterior/Próximo/Último |
| Filtro "Apenas Interessantes" | ✅ OK | Toggle na navegação |
| Botão Enviar Cotação | ⚠️ STUB | Existe mas não chama Bionexo |
| Botão Cancelar Cotação | ⚠️ STUB | Existe mas não chama Bionexo |
| Botão Atualizar Cotação | ⚠️ STUB | Existe mas não chama Bionexo |
| Warnings (Não Analisado / Sem SKU) | ✅ OK | Alertas amarelos |
| Campos envio (data, validade, pagamento, prazo, frete) | ✅ OK | Formulário completo |
| Ensinar (no detalhe) | ✅ OK | Abre ModalAprender |
| Parear (no detalhe) | ❌ Stub | Botão existe, sem modal |

### 3.3 Features do Guia Suprimed NÃO Implementadas

| Feature | Prioridade | Descrição |
|---------|-----------|-----------|
| Switch Sandbox/Produção na UI | ALTA | Trocar ambiente pela tela de Config |
| WHU (Alterar resposta) | MÉDIA | Editar cotação já enviada |
| WMG (Dados cadastrais) | BAIXA | Buscar dados do hospital por CNPJ |
| Pareamento de produtos | ALTA | Modal para vincular SKU Bionexo → SKU Thesys |
| Exportar/Importar keywords | MÉDIA | CSV de palavras-chave |
| Cotações consolidadas | BAIXA | Suporte a PDCs com múltiplos hospitais |
| Impostos (NCM/IVA/IPI/ICMS) | MÉDIA | Campos de impostos na resposta WHS |
| Programação de entrega | BAIXA | Até 24 datas por item |
| Dashboard/Relatórios | MÉDIA | Indicadores de desempenho |
| Reserva de estoque | BAIXA | Bloqueio temporário (24h) |
| Cotação automática | BAIXA | Para itens que atendem critérios pré-definidos |

---

## 4. Problemas Críticos — Detalhes Técnicos

### 4.1 Fallback Mock Silencioso (CRÍTICO)

**Arquivo:** `frontend/src/pages/CotacoesPage.tsx` linha 77

```typescript
// PROBLEMA: quando API falha, mostra 122 itens FAKE
catch (err) {
  console.error('Failed to fetch cotacoes:', err)
  setAllItems(mockItensFlat)  // ← 122 ITENS FALSOS!
}
```

**Impacto:** Operador trabalha com dados falsos sem saber.

**Solução:** Remover fallback, mostrar mensagem de erro.

### 4.2 Enviar Cotação é STUB (CRÍTICO)

**Arquivo:** `backend/src/cotacoes/cotacoes.service.ts` linha 196-217

```typescript
// PROBLEMA: NÃO chama bionexoService.enviarCotacao()
async enviarCotacao(cotacaoId: number) {
  // Apenas cria log "agendado" e retorna
  await this.prisma.syncLog.create({
    data: { operacao: 'ENVIAR_COTACAO', status: 'PENDENTE', ... }
  })
  return { message: `Cotação ${cotacaoId} marcada para envio` }
  // NADA É ENVIADO AO BIONEXO!
}
```

**Impacto:** Operador clica "Enviar", vê sucesso, mas hospital nunca recebe.

**Solução:** Chamar `bionexoService.enviarCotacao()` com WHS real.

### 4.3 Mensagens 503 Inconsistentes (MÉDIO)

4 mensagens diferentes no mesmo arquivo para a mesma condição:
1. `"Bionexo temporariamente indisponível (503). Aguarde 1-2 minutos e tente novamente."`
2. `"Bionexo: temporariamente indisponível (503)"`
3. `"Bionexo bloqueou (rate limit). Aguarde 1-2 min."`
4. `"Bionexo bloqueou (rate limit). Aguarde 1-2 min."`

**Solução:** Centralizar em uma função utilitária.

---

## 5. Solução Raw SOAP (Problema da lib `soap`)

### Problema Descoberto

A biblioteca `soap` do Node.js **crasha** quando a Bionexo retorna XML dentro da tag `<return>`. O parser interno tenta interpretar `<Pedidos>` como parte do WSDL e falha com:

```
TypeError: Cannot use 'in' operator to search for 'Pedidos' in 1;211652791;
at p.onclosetag (soap/lib/wsdl/index.js:385:27)
```

### Solução Implementada

Substituímos `client.requestAsync()` por chamada HTTP raw direta:

```typescript
private async rawSoapCall(config, operation, parameters, xml?): Promise<string> {
  // Monta envelope SOAP manualmente
  // Faz POST HTTP direto ao endpoint
  // Extrai <return> via regex
  // Retorna o conteúdo raw (status;token;xmldata)
}
```

Isso **bypassa completamente** o bug da lib soap e funciona 100%.

---

## 6. Credenciais e Ambientes

### Sandbox (Homologação)
- **Usuário:** `ws_promeho_sand_76283`
- **Senha:** `xjtzJnz9FNmB62`
- **WSDL:** `https://ws-bionexo-sandbox-ssl.bionexo.com/ws2/BionexoBean?wsdl`
- **Status atual:** 503 (Akamai CDN fora do ar)

### Produção
- **Usuário:** `ws_promeho_prod_152566`
- **Senha:** `RgjoSWVdzKuU6j`
- **WSDL:** `https://ws.bionexo.com.br/BionexoBean?wsdl`
- **Status atual:** Online (HTTP 200)

### Portal de Teste Sandbox
- **URL:** `http://sandbox-apex.cloud.bionexo.com.br/pls/apex/f?p=70000`
- **Propósito:** Simular criação de cotações pelo lado do hospital

---

## 7. Tabelas De-Para (Mapeamento)

### Formas de Pagamento
- 300 formas catalogadas
- Arquivo: `docs/bionexo_novo/de_para/Formas_pagamento_07_2021.xlsx`
- Formato: ID_FORMA_PAGO | DESCRIÇÃO

### Unidades de Medida
- 150+ unidades catalogadas
- Arquivo: `docs/bionexo_novo/de_para/Unidades Medida_07_2021.xlsx`
- Formato: ID_UNIDAD_MEDIDA | DESCRIPCION | ABREVIACAO

---

## 8. Próximos Passos (Ordem de Prioridade)

1. **Switch Sandbox/Produção na UI** — Permitir trocar ambiente pela tela de Configurações
2. **Remover fallback mock** — Frontend mostra erro em vez de dados fake
3. **Conectar Enviar/Cancelar ao Bionexo** — Chamar WHS/WHU de verdade
4. **Pareamento de produtos** — Modal para vincular SKU Bionexo → SKU Thesys
5. **Implementar WHU** — Alterar cotação já enviada
6. **Implementar WMG** — Buscar dados cadastrais do hospital
7. **Impostos** — Campos NCM/IVA/IPI/ICMS na resposta
8. **Dashboard** — Indicadores de desempenho
9. **Cotação automática** — Para itens pré-configurados

---

## 9. Arquitetura Técnica

```
Frontend (React 19 + Vite)     Backend (NestJS 11)          Bionexo SOAP
  ┌──────────────┐              ┌──────────────┐            ┌──────────────┐
  │ CotacoesPage │──GET /cot──▶│ CotacoesCtrl │──Prisma──▶│ PostgreSQL   │
  │ DetalhePage  │──POST/rec──▶│ BionexoCtrl  │──rawSOAP─▶│ ws.bionexo   │
  │ ConfigPage   │──PUT/cfg──▶│ ConfigCtrl   │           │ .com.br      │
  │ KeywordsPage │──CRUD────▶│ KeywordsCtrl │           └──────────────┘
  └──────────────┘              └──────────────┘
         │                            │
         └──axios──────────────────────┘
           JWT auth + interceptors

  Thesys API (REST)
  ┌──────────────┐
  │ thesys.atrp  │
  │ services.com │──X-API-Key──▶ 3313 itens, 3141 preços, 45 hospitais
  └──────────────┘
```

---

*Documento gerado automaticamente pela análise do código e documentação do projeto.*
