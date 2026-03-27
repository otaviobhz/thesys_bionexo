# Especificacao da API REST — Thesys ERP para Portal Bionexo

**Versao:** 1.0
**Data:** 2026-03-25
**Destinatarios:** Thanner, Gabriel (equipe Thesys)
**Autor:** Otavio (equipe Portal Bionexo)

---

## 1. Visao Geral

O **Portal Bionexo** e um sistema intermediario que orquestra a comunicacao entre a plataforma Bionexo (marketplace de cotacoes hospitalares) e o ERP Thesys. O portal **nao duplica dados de cadastro** — produtos, precos e hospitais sao consultados diretamente no Thesys em tempo real.

Para isso funcionar, o Thesys precisa expor **4 endpoints REST** que o portal consumira:

| # | Endpoint | Metodo | Finalidade |
|---|----------|--------|------------|
| 1 | `/api/bionexo/itens` | GET | Listar produtos ativos para pareamento de SKU |
| 2 | `/api/bionexo/precos/:idTabela` | GET | Consultar precos de uma tabela de precos |
| 3 | `/api/bionexo/hospitais` | GET | Listar hospitais cadastrados |
| 4 | `/api/bionexo/cotacao` | POST | Criar cotacao de venda no Thesys |

**Fluxo simplificado:**

```
Portal Bionexo ──GET /itens──────────► Thesys ERP (produtos para pareamento)
Portal Bionexo ──GET /precos/5───────► Thesys ERP (precos da tabela 5)
Portal Bionexo ──GET /hospitais──────► Thesys ERP (hospitais para validacao CNPJ)
Portal Bionexo ──POST /cotacao───────► Thesys ERP (grava cotacao respondida)
```

---

## 2. Configuracao Geral

### 2.1 Base URL

```
http://{thesys-server}:{port}/api/bionexo/
```

Exemplo: `http://10.200.0.4:8080/api/bionexo/`

> A URL e porta serao configuradas no portal pelo administrador.

### 2.2 Autenticacao

Todos os endpoints exigem autenticacao via **Bearer Token** no header HTTP:

```http
Authorization: Bearer {token-definido-pelo-thanner}
```

O token sera um valor fixo (ou gerado por mecanismo a definir pelo Thanner) que o portal armazenara em sua configuracao.

**Exemplo de requisicao:**

```http
GET /api/bionexo/itens HTTP/1.1
Host: 10.200.0.4:8080
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### 2.3 Formato de Dados

- **Content-Type:** `application/json`
- **Charset:** UTF-8
- **Valores monetarios:** `number` com ate 4 casas decimais (ex: `12.5000`)
- **Valores nulos:** retornar `null` (nao omitir o campo)

---

## 3. Endpoints

---

### 3.1 Listar Itens (Produtos Ativos)

Retorna a lista de produtos ativos do Thesys para o portal realizar o **pareamento de SKU** (vincular produto Bionexo ao produto Thesys).

**Requisicao:**

```
GET /api/bionexo/itens
GET /api/bionexo/itens?search=luva
```

| Parametro | Tipo | Obrigatorio | Descricao |
|-----------|------|-------------|-----------|
| `search` | string | Nao | Filtra por `Codigo LIKE '%valor%'` OU `descricao LIKE '%valor%'` |

**Query SQL (banco THESYS_PRODUCAO):**

```sql
SELECT
    i.Id_Item     AS id,
    i.Codigo      AS sku,
    i.descricao,
    u.codigo      AS unidade
FROM Itens i
LEFT JOIN Unidades u ON u.id_unidade = i.id_unidade
WHERE i.ativo = 'S'
  AND i.excl_data IS NULL
  -- Se parametro search informado:
  -- AND (i.Codigo LIKE '%search%' OR i.descricao LIKE '%search%')
ORDER BY i.descricao
```

**Resposta — 200 OK:**

```json
[
  {
    "id": 1542,
    "sku": "MED-001",
    "descricao": "Luva de Procedimento Latex M",
    "unidade": "CX"
  },
  {
    "id": 1543,
    "sku": "MED-002",
    "descricao": "Luva de Procedimento Latex G",
    "unidade": "CX"
  }
]
```

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | number | ID interno do item (Id_Item) |
| `sku` | string | Codigo do produto no Thesys |
| `descricao` | string | Descricao do produto |
| `unidade` | string \| null | Codigo da unidade de medida |

---

### 3.2 Consultar Precos de uma Tabela

Retorna os precos de uma tabela de precos especifica. O portal usa esses valores como **sugestao de preco** ao responder cotacoes.

**Requisicao:**

```
GET /api/bionexo/precos/{idTabela}
```

| Parametro | Tipo | Obrigatorio | Descricao |
|-----------|------|-------------|-----------|
| `idTabela` | number (path) | Sim | ID da tabela de precos (`id_compra_preco`) |

**Query SQL (banco THESYS_PRODUCAO):**

```sql
SELECT
    i.Codigo    AS sku,
    i.descricao,
    cpi.preco
FROM Compras_Precos_Itens cpi
JOIN Itens i ON i.Id_Item = cpi.id_item
WHERE cpi.id_compra_preco = :idTabela
  AND cpi.excl_data IS NULL
ORDER BY i.descricao
```

> **Nota sobre renomeacao:** A tabela `Compras_Precos` (e `Compras_Precos_Itens`) sera renomeada para `Preco_Vendas` (e `Preco_Vendas_Itens`) em uma atualizacao futura do Thesys. Ver secao 5 para detalhes. A query acima usa o nome **atual** da tabela.

**Resposta — 200 OK:**

```json
[
  {
    "sku": "MED-001",
    "descricao": "Luva de Procedimento Latex M",
    "preco": 45.5000
  },
  {
    "sku": "MED-002",
    "descricao": "Luva de Procedimento Latex G",
    "preco": 48.0000
  }
]
```

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `sku` | string | Codigo do produto no Thesys |
| `descricao` | string | Descricao do produto |
| `preco` | number | Preco unitario (ate 4 casas decimais) |

---

### 3.3 Listar Hospitais

Retorna a lista de hospitais cadastrados no Thesys (registros do CliFor com flag `hospital = 'S'`). O portal usa esses dados para **validacao de CNPJ** e identificacao dos compradores Bionexo.

**Requisicao:**

```
GET /api/bionexo/hospitais
```

Nenhum parametro obrigatorio.

**Query SQL (banco THESYS_PRODUCAO):**

```sql
SELECT
    cod_clifor  AS id,
    razao       AS razao_social,
    fantasia    AS nome_fantasia,
    cnpj
FROM CliFor
WHERE hospital = 'S'
  AND ativo = 'S'
  AND excl_data IS NULL
ORDER BY razao
```

**Resposta — 200 OK:**

```json
[
  {
    "id": 301,
    "razao_social": "Hospital Sao Lucas Ltda",
    "nome_fantasia": "Hospital Sao Lucas",
    "cnpj": "12.345.678/0001-90"
  },
  {
    "id": 455,
    "razao_social": "Santa Casa de Misericordia",
    "nome_fantasia": "Santa Casa",
    "cnpj": "98.765.432/0001-10"
  }
]
```

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | number | Codigo do CliFor (cod_clifor) |
| `razao_social` | string | Razao social do hospital |
| `nome_fantasia` | string \| null | Nome fantasia |
| `cnpj` | string | CNPJ formatado |

---

### 3.4 Criar Cotacao

Cria uma cotacao de venda no Thesys apos o portal enviar a resposta para o Bionexo. Isso garante que o ERP tenha o registro da cotacao respondida.

**Requisicao:**

```
POST /api/bionexo/cotacao
```

**Body (JSON):**

```json
{
  "cod_clifor": 301,
  "id_pagamento_condicoes": 5,
  "prazo_entrega": 7,
  "fat_minimo": 500.00,
  "itens": [
    {
      "id_item": 1542,
      "quantidade": 100,
      "preco_unitario": 45.50,
      "observacao": "Entrega parcial aceita"
    },
    {
      "id_item": 1543,
      "quantidade": 50,
      "preco_unitario": 48.00,
      "observacao": null
    }
  ]
}
```

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `cod_clifor` | number | Sim | Codigo do hospital (CliFor) |
| `id_pagamento_condicoes` | number | Sim | ID da condicao de pagamento |
| `prazo_entrega` | number | Sim | Prazo de entrega em dias |
| `fat_minimo` | number | Sim | Faturamento minimo |
| `itens` | array | Sim | Lista de itens da cotacao |
| `itens[].id_item` | number | Sim | ID do item (Id_Item da tabela Itens) |
| `itens[].quantidade` | number | Sim | Quantidade cotada |
| `itens[].preco_unitario` | number | Sim | Preco unitario cotado |
| `itens[].observacao` | string \| null | Nao | Observacao do item |

**Operacao SQL (banco THESYS_PRODUCAO):**

```sql
-- 1. Inserir cabecalho da cotacao
INSERT INTO Vendas_Cotacoes (
    cod_clifor,
    id_pagamento_condicoes,
    prazo_entrega,
    fat_minimo,
    data_cadastro,
    -- demais campos conforme regra de negocio do Thesys
)
VALUES (
    :cod_clifor,
    :id_pagamento_condicoes,
    :prazo_entrega,
    :fat_minimo,
    GETDATE()
);

-- Recuperar o ID e numero gerados
-- :id_venda_cotacao = SCOPE_IDENTITY() ou @@IDENTITY
-- :numero = numero sequencial gerado pelo Thesys

-- 2. Inserir itens da cotacao (para cada item do array)
INSERT INTO Vendas_Cotacoes_Itens (
    id_venda_cotacao,
    id_item,
    quantidade,
    preco_unitario,
    observacao
)
VALUES (
    :id_venda_cotacao,
    :id_item,
    :quantidade,
    :preco_unitario,
    :observacao
);
```

> A logica exata de campos adicionais, numeracao sequencial e validacoes internas fica a criterio da implementacao do Thesys. Os campos acima sao o **minimo necessario** que o portal enviara.

**Resposta — 201 Created:**

```json
{
  "id_venda_cotacao": 8745,
  "numero": 2026001234
}
```

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id_venda_cotacao` | number | ID interno da cotacao criada |
| `numero` | number | Numero sequencial da cotacao no Thesys |

---

## 4. Tratamento de Erros

Todos os endpoints devem retornar erros no seguinte formato padrao:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Descricao legivel do erro"
}
```

### Codigos HTTP utilizados

| Codigo | Significado | Quando usar |
|--------|------------|-------------|
| `200` | OK | GET executado com sucesso |
| `201` | Created | POST /cotacao criou o registro com sucesso |
| `400` | Bad Request | Parametros invalidos ou faltantes |
| `401` | Unauthorized | Token ausente ou invalido |
| `404` | Not Found | Recurso nao encontrado (ex: idTabela inexistente) |
| `500` | Internal Server Error | Erro interno do servidor / banco |

### Exemplos de erro

**Token invalido (401):**

```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Token de autenticacao invalido ou expirado"
}
```

**Tabela de precos nao encontrada (404):**

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Tabela de precos com id 999 nao encontrada"
}
```

**Item inexistente no POST /cotacao (400):**

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Item com id_item 9999 nao encontrado ou inativo"
}
```

**Erro de banco de dados (500):**

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Erro ao acessar banco THESYS_PRODUCAO"
}
```

---

## 5. Observacoes Importantes

### 5.1 Renomeacao da tabela Compras_Precos

A tabela `Compras_Precos` (e sua filha `Compras_Precos_Itens`) tem nomenclatura incorreta — ela armazena **precos de venda**, nao de compra. Esta prevista a renomeacao para:

| Nome atual | Nome futuro |
|-----------|-------------|
| `Compras_Precos` | `Preco_Vendas` |
| `Compras_Precos_Itens` | `Preco_Vendas_Itens` |

**Impacto na API:** Nenhum. Os nomes dos campos no JSON (`sku`, `descricao`, `preco`) nao mudam. A renomeacao afeta apenas as queries internas do Thesys. O contrato da API (endpoint + formato JSON) permanece o mesmo.

**Recomendacao:** Realizar a renomeacao **antes** de implementar os endpoints, para evitar refatoracao posterior.

### 5.2 Banco de Dados

- Todos os endpoints consultam o banco **THESYS_PRODUCAO** (SQL Server)
- As queries fornecidas sao de referencia. A implementacao final pode adaptar conforme necessidade (paginacao, indices, etc.)
- O filtro `excl_data IS NULL` garante que registros excluidos logicamente nao aparecem

### 5.3 Performance

- O endpoint `GET /itens` pode retornar muitos registros. Considerar implementar **paginacao** (`?page=1&limit=50`) se o volume for muito grande
- O portal faz cache de itens (30 minutos) e hospitais (1 hora), entao a carga nos endpoints GET sera moderada
- O `POST /cotacao` sera chamado sob demanda pelo operador (volume baixo)

### 5.4 Seguranca

- O token Bearer deve ser validado em **todos** os endpoints
- Nao expor mensagens de erro detalhadas do SQL Server na resposta (usar mensagens genericas em producao)
- Considerar limitar o acesso por IP se o portal estiver em rede interna

---

## 6. Resumo para Implementacao

**Prioridade sugerida de implementacao:**

| Prioridade | Endpoint | Justificativa |
|-----------|----------|---------------|
| 1 | `GET /itens` | Necessario para o pareamento (funcionalidade base) |
| 2 | `GET /hospitais` | Necessario para validacao de CNPJ |
| 3 | `GET /precos/:idTabela` | Necessario para sugestao de precos |
| 4 | `POST /cotacao` | Necessario para gravar cotacao no ERP |

**Checklist:**

- [ ] Definir token de autenticacao Bearer
- [ ] Implementar `GET /itens` com filtro `search` opcional
- [ ] Implementar `GET /precos/:idTabela`
- [ ] Implementar `GET /hospitais`
- [ ] Implementar `POST /cotacao` com INSERT no cabecalho + itens
- [ ] Padronizar respostas de erro conforme secao 4
- [ ] Avaliar renomeacao `Compras_Precos` → `Preco_Vendas` antes do desenvolvimento
- [ ] Testar endpoints com dados reais do THESYS_PRODUCAO
- [ ] Compartilhar URL base + token com a equipe do portal

---

*Documento gerado em 2026-03-25. Em caso de duvidas, entrar em contato com Otavio (equipe Portal Bionexo).*
