# Modelo de Dados — Portal Thesys-Bionexo

Banco: **PostgreSQL 18** | Porta: **7432** | Database: **thesys_bionexo**

---

## 1. User (Usuários do Portal)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| id | UUID (PK) | Sim | Identificador único |
| email | String (unique) | Sim | E-mail de login |
| passwordHash | String | Sim | Hash bcrypt da senha |
| nome | String | Sim | Nome completo |
| perfil | Enum: MASTER / OPERADOR | Sim | Nível de acesso |
| ativo | Boolean | Sim | Ativo/Inativo (default: true) |
| createdAt | DateTime | Auto | Data de criação |
| updatedAt | DateTime | Auto | Última atualização |

**Regras:** Não se apaga usuário, apenas inativa (para auditoria).

---

## 2. Cotacao (Cotações recebidas do Bionexo)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| id | UUID (PK) | Sim | Identificador único |
| bionexoId | Int (unique) | Sim | ID_PDC no Bionexo |
| cnpjHospital | String | Sim | CNPJ do hospital comprador |
| nomeHospital | String | Sim | Nome do hospital |
| ufHospital | String | Sim | UF do hospital (SP, RJ, etc.) |
| cidadeHospital | String | Sim | Cidade do hospital |
| dataVencimento | DateTime | Sim | Data de vencimento da cotação |
| horaVencimento | String | Sim | Hora de vencimento (HH:MM) |
| formaPagamento | String | Não | Condição de pagamento (30 DDL, etc.) |
| status | Enum (ver abaixo) | Sim | Estágio da cotação (default: RECEBIDO) |
| syncedAt | DateTime | Não | Última sincronização com Bionexo |
| createdAt | DateTime | Auto | Data de criação |
| updatedAt | DateTime | Auto | Última atualização |

**Relações:** `itens` → CotacaoItem[] (1:N)

**Enum CotacaoStatus:**
| Valor | Descrição |
|-------|-----------|
| RECEBIDO | Baixado na integração |
| PAREADO | Itens pareados com SKU |
| COTACAO_ENVIADA | Enviada ao Bionexo |
| EM_ANALISE | Em análise pelo hospital |
| ACEITA | 1+ itens ganhos |
| PEDIDO_GERADO | Pedido criado no Thesys |
| ADQUIRIDO_OUTRA | Perdida para concorrente |
| CANCELADO | Cancelada após envio |

---

## 3. CotacaoItem (Itens de cada cotação)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| id | UUID (PK) | Sim | Identificador único |
| cotacaoId | UUID (FK) | Sim | Referência à Cotacao |
| sequencia | Int | Sim | Número do item na cotação |
| descricaoBionexo | String | Sim | Descrição do produto pelo hospital |
| quantidade | Int | Sim | Quantidade solicitada |
| unidadeMedida | String | Sim | Unidade (UN, CX, PCT, etc.) |
| marcas | String | Não | Marcas aceitas pelo hospital |
| formaPagamento | String | Não | Pagamento do item |
| categoria | Enum (ver abaixo) | Sim | Classificação do item (default: NAO_ANALISADO) |
| codigoInterno | String | Não | SKU do Thesys (quando pareado) |
| descricaoInterna | String | Não | Descrição do SKU no Thesys |
| precoUnitario | Float | Não | Preço da cotação |
| comentario | String | Não | Observação enviada ao Bionexo |
| catComercial | String | Não | Categoria comercial |
| createdAt | DateTime | Auto | Data de criação |
| updatedAt | DateTime | Auto | Última atualização |

**Relações:** `cotacao` → Cotacao (N:1, onDelete: Cascade)

**Enum CategoriaItem:**
| Valor | Cor na Grid | Descrição |
|-------|-------------|-----------|
| NAO_ANALISADO | Amarelo | Sem avaliação |
| INTERESSANTE | Verde | Marcado para cotação |
| COTADO | Branco | Respondido e enviado |
| DESCARTADO | Vermelho | Sem interesse |

---

## 4. MapeamentoSku (De-Para: Bionexo → Thesys)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| id | UUID (PK) | Sim | Identificador único |
| descricaoComprador | String | Sim | Descrição do produto no Bionexo |
| skuThesys | String | Sim | Código SKU no Thesys |
| descricaoInterna | String | Sim | Descrição do SKU no Thesys |
| createdAt | DateTime | Auto | Data de criação |

---

## 5. RegraPalavraChave (Keywords para auto-classificação)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| id | UUID (PK) | Sim | Identificador único |
| palavraChave | String | Sim | Palavra para match (ex: SERINGA) |
| acaoAutomatica | Enum: INTERESSANTE / DESCARTAR | Sim | Ação ao encontrar match |
| matches | Int | Sim | Contador de matches (default: 0) |
| createdAt | DateTime | Auto | Data de criação |

---

## 6. Pedido (Pedidos confirmados pelo hospital)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| id | UUID (PK) | Sim | Identificador único |
| bionexoPedidoId | String | Sim | ID do pedido no Bionexo |
| cotacaoId | String | Não | Referência à cotação original |
| nomeHospital | String | Sim | Hospital que confirmou |
| cnpjHospital | String | Sim | CNPJ do hospital |
| dataPedido | DateTime | Sim | Data do pedido |
| status | String | Sim | Status (CONFIRMADO, EM_ENTREGA, ENTREGUE) |
| valorTotal | Float | Sim | Valor total do pedido |
| createdAt | DateTime | Auto | Data de criação |

---

## 7. SyncLog (Histórico de sincronizações)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| id | UUID (PK) | Sim | Identificador único |
| operacao | String | Sim | Operação (WGG, WHS, WHU, WGA, WJG, THESYS_SYNC) |
| direcao | String | Sim | IN (download) ou OUT (upload) |
| status | String | Sim | SUCESSO, ERRO, VAZIO |
| mensagem | String | Não | Detalhes da operação |
| processadas | Int | Sim | Quantas cotações/itens processados (default: 0) |
| createdAt | DateTime | Auto | Data/hora da operação |

---

## 8. BionexoConfig (Configuração da integração Bionexo)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| id | UUID (PK) | Sim | Identificador único |
| cnpj | String | Sim | CNPJ do fornecedor |
| usuario | String | Sim | Usuário WebService |
| senha | String | Sim | Senha WebService |
| wsdlUrl | String | Sim | URL do WSDL (sandbox ou produção) |
| ambiente | String | Sim | SANDBOX ou PRODUCAO (default: SANDBOX) |
| pollingInterval | Int | Sim | Intervalo de polling em minutos (default: 5) |
| botAtivo | Boolean | Sim | Bot automático ligado/desligado (default: false) |
| ultimoToken | String | Não | Último token retornado pelo WGG (cursor) |

---

## 9. ThesysConfig (Configuração da integração Thesys)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| id | UUID (PK) | Sim | Identificador único |
| baseUrl | String | Sim | URL base da API (ex: http://10.200.0.8:3001/api/bionexo) |
| authToken | String | Não | Bearer token de autenticação |
| ativo | Boolean | Sim | Integração ativa (default: true) |

---

## Diagrama de Relacionamentos

```
User (standalone)

Cotacao (1) ──── (N) CotacaoItem
    │
    └── bionexoId (unique) ← ID_PDC do Bionexo

MapeamentoSku (standalone) ← descrição Bionexo → SKU Thesys
RegraPalavraChave (standalone) ← palavras para auto-classificação
Pedido (standalone) ← pedidos confirmados pelo hospital
SyncLog (standalone) ← histórico de operações
BionexoConfig (standalone) ← credenciais Bionexo
ThesysConfig (standalone) ← credenciais Thesys
```
