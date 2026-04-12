# Manual de Funcionamento — Portal Thesys-Bionexo

> Documento único com **2 partes**:
>
> **Parte 1 — Visão Geral:** o que o sistema faz, fluxo macro, conceitos chave, tour pelas páginas.
> **Parte 2 — Roteiro de Teste End-to-End:** 9 passos enxutos do login até a confirmação no Thesys (~20 minutos).
>
> Leia a Parte 1 primeiro para entender o sistema, depois siga a Parte 2 para validar.

---

# 📘 PARTE 1 — Visão Geral do Sistema

## 1. O que é o Portal Thesys-Bionexo

É um **portal web interno** que automatiza o processamento de cotações hospitalares vindas da plataforma **Bionexo** e integra com o ERP **Thesys**.

**Quem usa:** operadores comerciais da PROMEHO que respondem cotações de medicamentos e materiais hospitalares.

**O que ele substitui:** trabalho manual de baixar cotações do Bionexo, classificar item por item, buscar SKU no Thesys, preencher preço e enviar resposta — antes feito em planilhas e múltiplas abas do navegador.

---

## 2. Fluxo macro (visão alta)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Hospital  │───▶│   Bionexo   │───▶│   Portal    │───▶│   Thesys    │
│             │    │   (SOAP)    │    │  Thesys-    │    │    (ERP)    │
│             │    │             │    │  Bionexo    │    │             │
└─────────────┘    └─────────────┘    └──────┬──────┘    └──────▲──────┘
                                              │                  │
                                              ▼                  │
                                       ┌──────────────┐          │
                                       │  Operador    │──────────┘
                                       │  PROMEHO     │
                                       └──────────────┘
```

**Passo a passo:**
1. Hospital cria cotação no Bionexo (escolhendo medicamentos/materiais que precisa).
2. Bionexo notifica fornecedores cadastrados via WebService SOAP.
3. **Nosso portal** baixa automaticamente as cotações pendentes (operação `WGG`).
4. **Operador** classifica os itens (vendemos? não vendemos?), pareia com SKU do Thesys e preenche preço.
5. **Nosso portal** envia a resposta de volta ao Bionexo (operação `WHS`).
6. Bionexo encaminha a resposta ao hospital.
7. Hospital decide aceitar, rejeitar ou comprar de outro fornecedor.
8. **Nosso portal** sincroniza o status final via `WGA`/`WJG`/`WKN`.
9. Cotação aceita vira Pedido — também é enviada ao **Thesys ERP** para registro contábil.

---

## 3. Conceitos chave

### 3.1 Cotação (PDC)

Um pedido de cotação criado por um hospital. Tem identificador único (`Id_Pdc`), data de vencimento, hospital, forma de pagamento e uma lista de **itens**.

**Exemplo:** Cotação `211655085` do Hospital Albert Sabin Lapa, vencendo em 13/04/2026, com 6 itens (AAS, GAZE, CATETER, etc.).

### 3.2 Item

Cada linha de uma cotação. Tem descrição livre escrita pelo hospital (ex: `"GAZE RAYON C/ACIDOS GRAXOS 7,5X7,5CM/ PIELSANA"`), quantidade, unidade de medida, marca preferida.

### 3.3 Categoria

Cada item passa por 4 estados ao longo do fluxo:

| Categoria | Cor | Significado |
|---|---|---|
| **NÃO ANALISADO** | 🟡 amarelo | Recém-recebido, ninguém viu ainda |
| **INTERESSANTE** | 🟢 verde | Vendemos esse produto, vamos cotar |
| **DESCARTADO** | 🔴 vermelho | Não vendemos, ignorar |
| **COTADO** | 🔵 azul | Preço preenchido + cotação enviada |

### 3.4 De-Para (Pareamento)

Vínculo entre a **descrição do hospital** (texto livre) e um **SKU do Thesys** (código interno).

**Exemplo:** `"NOVA-CONSOLIDADA-01"` (Bionexo) → `7710` (Thesys: FIO NYLON 3-0 C/AG).

Uma vez criado, o vínculo se aplica automaticamente em futuras cotações com a mesma descrição.

### 3.5 Aprender (Palavras-Chave)

Regras simples que classificam automaticamente itens novos baseados em palavras na descrição.

**Exemplo:** regra `palavra = "GAZE"` + `acao = INTERESSANTE` → todo item futuro com `GAZE` na descrição vem auto-classificado como verde.

---

## 4. Tour pelas páginas

### 4.1 Cotações (`/`)

Página principal. Lista todos os itens recebidos (achatado: 1 linha por item, agrupado visualmente por cotação). Filtros por status, categoria, hospital, número PDC. Multi-sort em até 3 colunas. Botões de ação em lote (Marcar Interessante, Descartar, Aprender).

**Botões importantes do topo:**
- **Receber novos** (verde): baixa cotações pendentes do Bionexo agora
- **Atualizar Bionexo**: sincroniza prorrogações + pedidos confirmados

### 4.2 Detalhe da Cotação (`/cotacoes/:id`)

Aberto clicando na prancheta 📋 ou no ID PDC de qualquer linha. Mostra todos os itens daquela cotação + painel de edição (preço, comentário) + formulário de envio.

### 4.3 Palavras-Chave (`/palavras-chave`)

Gestão das regras de auto-classificação. CRUD completo + import/export Excel.

### 4.4 Dicionário De-Para (`/mapeamento`)

Gestão dos vínculos descrição→SKU. CRUD + import/export Excel.

### 4.5 Pedidos (`/pedidos`)

Lista de pedidos confirmados pelos hospitais (cotações aceitas que viraram compra).

### 4.6 Logs de Sync (`/sync-logs`)

Histórico de todas as operações EDI: WGG (recebimento), WHS (envio), WGA, WJG, WKN, WMG, THESYS_COTACAO. Status, mensagem, contagem de processados.

### 4.7 Configurações (`/config`)

Credenciais Bionexo + Thesys + bot polling automático + debug 8 passos. **Zona de Perigo** para inserir cotações de teste / resetar / limpar tudo.

### 4.8 Documentação (`/documentacao`)

Manuais técnicos do projeto (esta página). Inclui este Manual de Funcionamento + outros documentos de referência.

---

## 5. Glossário

| Termo | Significado |
|---|---|
| **Bionexo** | Marketplace B2B onde hospitais publicam cotações para fornecedores responderem |
| **PDC** | Pedido de Cotação — sinônimo de "cotação" no jargão Bionexo |
| **WGG** | Operação SOAP do Bionexo: baixa cotações pendentes |
| **WHS** | Operação SOAP do Bionexo: envia resposta (preços) ao hospital |
| **WGA** | Operação SOAP: recebe prorrogações de vencimento |
| **WJG** | Operação SOAP: recebe pedidos confirmados (cotações aceitas) |
| **WKN** | Operação SOAP: status dos itens respondidos |
| **WMG** | Operação SOAP: dados cadastrais de hospital por CNPJ |
| **SKU** | Stock Keeping Unit — código interno do produto no ERP Thesys |
| **De-Para** | Mapeamento entre 2 sistemas (descrição Bionexo ↔ SKU Thesys) |
| **EDI** | Electronic Data Interchange — padrão de integração B2B |
| **JWT** | JSON Web Token — usado para autenticar usuários no portal |
| **Sandbox** | Ambiente de homologação do Bionexo, separado da produção |
| **Polling** | Robô que checa o Bionexo periodicamente buscando cotações novas |

---

## 6. Quem é responsável pelo quê

| Papel | Pessoa | Responsabilidade |
|---|---|---|
| **Tech Lead / Dev** | Otávio | Manutenção do portal, fixes, novas features |
| **Operador piloto** | Daniel Alves | Usar o portal no dia-a-dia, reportar bugs e melhorias |
| **Owner Bionexo** | Anderson Carneiro | Suporte EDI, ticket PRODU-182518, `integracao@bionexo.com` |
| **Thesys ERP** | Thanner / Gabriel | Manter API Thesys funcionando, cadastrar preços, validar integração |

---

# 🧪 PARTE 2 — Roteiro de Teste End-to-End

> Agora que você entendeu como o sistema funciona (Parte 1), siga os 9 passos abaixo para validar tudo na prática. **Tempo estimado: ~20 minutos.**

## 📋 Pré-requisitos

- [ ] Portal acessível (`http://localhost:7000` ou via Cloudflare Tunnel)
- [ ] Credenciais admin: `admin@promeho.com.br` / `Admin123!`
- [ ] Sandbox Bionexo respondendo (verificar em Configurações → Testar Conexão)
- [ ] API Thesys respondendo (verificar em Configurações → Testar Conexão)

---

## Passo 1 — Login (1 min)

**Ação:** Abrir o portal, preencher email + senha, clicar **Entrar**.

**✅ Esperado:** redireciona para `/` (Cotações).

**❌ Se falhar:** erro 401 → senha errada. Erro de rede → backend offline (`docker compose ps`).

`[ ]` Login OK

---

## Passo 2 — Receber novas cotações (2 min)

**Ação:** Na página de Cotações, clicar **"Receber novos"** (botão verde topo direito).

**✅ Esperado:**
- Spinner aparece
- Toast verde com mensagem tipo `"X cotações recebidas, Y novas salvas"`
- Lista atualiza com itens novos

**❌ Se falhar:** sandbox 503 → tentar de novo em 5 min. `Y=0` → sandbox sem cotações novas (ok, pode usar cotações já existentes).

**Anotar:** Y = _____ cotações novas baixadas

`[ ]` Recebimento OK

---

## Passo 3 — Classificar 3 itens (3 min)

**Ação:**
1. Selecionar 3 checkboxes de itens diferentes (na coluna esquerda da tabela)
2. Clicar **"Marcar como Interessante"** (botão verde) para 1 deles
3. Clicar **"Descartar"** para outro
4. Deixar o terceiro sem mexer

**✅ Esperado:** linhas mudam de cor:
- Item interessante → fundo verde claro
- Item descartado → fundo vermelho claro
- Item não tocado → continua amarelo (NÃO ANALISADO)

**❌ Se falhar:** botão não responde → backend offline. Cor não muda → bug visual.

`[ ]` Classificação OK

---

## Passo 4 — Aprender (criar regra de palavra-chave) (3 min)

**Ação:**
1. Selecionar 1 item interessante (que tenha alguma palavra distintiva, ex: contém "GAZE", "SERINGA", "DIPIRONA")
2. Clicar botão **"Aprender"**
3. No modal, mover a palavra distintiva da coluna "Disponíveis" para "Selecionadas" (com a seta `>`)
4. Marcar a opção **"Classificar como Interessante"**
5. Clicar **"Salvar Regra"**

**✅ Esperado:**
- Modal fecha sem erro
- Indo em **Palavras-Chave** no menu lateral, a regra aparece na lista

**Validação cruzada:** clicar "Receber novos" novamente. Itens novos com a palavra-chave devem **vir verdes automaticamente** (auto-classificação).

`[ ]` Aprender OK
`[ ]` Auto-classificação aplicada na próxima cotação

---

## Passo 5 — Parear item ao SKU Thesys (3 min)

**Ação:**
1. Clicar na **prancheta 📋** ou no número PDC de uma cotação interessante
2. Na página de detalhe, clicar checkbox de 1 item INTERESSANTE sem SKU
3. Clicar botão **"Parear"** (ou "Vincular Produto")
4. No modal, digitar 2+ caracteres de busca (ex: "FIO", "GAZE", "SERIN")
5. Aguardar dropdown com resultados
6. Selecionar 1 SKU
7. Verificar se aparece "Preço Sugerido" (pode estar vazio se Thesys não tem preço)
8. Clicar **"Confirmar Pareamento"**

**✅ Esperado:**
- Modal fecha
- Item agora mostra o SKU na grid
- Indo em **Dicionário De-Para**, o vínculo deve aparecer

`[ ]` Pareamento OK
`[ ]` Vínculo persistido em /mapeamento

---

## Passo 6 — Cotar preço (2 min)

**Ação:**
1. Ainda na página de detalhe da cotação, com 1 item selecionado
2. No painel direito, preencher **Preço Unitário** (ex: `45,90`)
3. Preencher **Comentário** opcional (ex: "Entrega 3 dias úteis")
4. Clicar **"Salvar"**

**✅ Esperado:** valores aparecem na grid central. Item muda para categoria **COTADO** ou continua INTERESSANTE até envio.

**❌ Se falhar:** botão Salvar dá erro → backend rejeita. Preço não persiste → bug do PUT.

**Repetir** para todos os itens INTERESSANTE da cotação que você quer enviar. Os DESCARTADOS podem ficar sem preço.

`[ ]` Preço salvo

---

## Passo 7 — Enviar cotação ao Bionexo (2 min)

**Ação:**
1. Rolar até a seção **"Enviar Cotação para Bionexo"** no fim da página
2. Verificar avisos no topo (precisa que TODOS os itens estejam classificados E os interessantes pareados)
3. Preencher: Data (hoje), Validade (7 dias), Condição Pagamento (default 30 DDL), Prazo Entrega (3-5 dias), Frete (CIF)
4. Clicar **"Enviar Cotação"**

**✅ Esperado:**
- Mensagem verde "Enviada com sucesso (ID: ...)"
- Status da cotação muda para **"Cotação Enviada"** (cor âmbar)

**❌ Se falhar:**
- Botão desabilitado → ainda tem item NAO_ANALISADO ou interessante sem SKU
- Erro `WH_Cabecalho` → bug do XML WHS (deve estar corrigido na sua versão)
- Erro 503 → sandbox offline

`[ ]` Envio OK
`[ ]` Status mudou para "Cotação Enviada"

---

## Passo 8 — Verificar Logs de Sync (1 min)

**Ação:** Menu lateral → **Logs de Sync**.

**✅ Esperado:** linhas recentes:
- `WHS / OUT / SUCESSO — Cotação X enviada com sucesso (ID: timestamp)`
- `THESYS_COTACAO / OUT / SUCESSO ou ERRO` (se Thesys integração estiver ativa)

`[ ]` SyncLog `WHS SUCESSO` presente
`[ ]` SyncLog `THESYS_COTACAO` presente (sucesso ou erro registrado)

---

## Passo 9 — Confirmar entrada no Thesys (2 min)

**Ação:** Pedir ao **Thanner** ou **Gabriel** (responsáveis pelo Thesys ERP):

> "Pode confirmar se a cotação Bionexo #__________ chegou na sua tabela de vendas?"

**✅ Esperado:** Thanner confirma que o registro chegou no Thesys com os mesmos itens, preços, hospital e CNPJ.

**❌ Se falhar:** SyncLog `THESYS_COTACAO` mostra erro (provável: contrato do payload não bate com o esperado pelo Thesys → ajustar com Thanner).

`[ ]` Cotação confirmada no Thesys

---

## ✅ Critério de aprovação geral

| Item | Status |
|---|---|
| 9 passos do roteiro executados | `[ ]` |
| Nenhum erro 500 ou 401 inesperado | `[ ]` |
| Cotação real enviada ao sandbox Bionexo | `[ ]` |
| SyncLog com WHS SUCESSO | `[ ]` |
| Resposta visível no Thesys (validado pelo Thanner) | `[ ]` |

**Se TUDO acima estiver verde:** o portal está pronto para uso real.
**Se algo falhou:** anotar o passo + mensagem de erro + screenshot e mandar para Otávio.

---

## 🔁 Próximos passos depois deste roteiro

1. Reportar resultado para Otávio
2. Se aprovado, agendar onboarding com keyuser (Daniel Alves)
3. Definir cadência de uso real (diário? duas vezes por semana?)
4. Acompanhar Logs de Sync no primeiro mês para detectar regressões

---

*Manual de Funcionamento (com Roteiro E2E) — versão 2026-04-08 — Portal Thesys-Bionexo*
