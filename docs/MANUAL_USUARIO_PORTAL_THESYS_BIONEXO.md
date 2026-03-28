# Manual do Usuário — Portal Thesys-Bionexo

**Versão:** 2026.03.28
**Acesso:** http://10.147.20.85:7000 (via ZeroTier) ou http://localhost:7000 (local)

---

## 1. Login

**Credenciais:**
- **Admin:** admin@promeho.com.br / Admin123!
- **Operador:** operador@promeho.com.br / Operador123!

**Como acessar:**
1. Abra o navegador e acesse a URL do portal
2. Digite e-mail e senha
3. Clique em **Entrar**
4. Será redirecionado para a tela principal de Cotações

---

## 2. Tela Principal — Pedidos de Cotação Bionexo

Esta é a tela principal do sistema. Mostra todos os itens de cotação recebidos da plataforma Bionexo em formato de tabela.

### 2.1 Cabeçalho

| Elemento | Descrição |
|----------|-----------|
| **Empresa** | Mostra "PROMEHO" |
| **Local de envio** | Dropdown para selecionar centro de distribuição (SJC/Valinhos/Jacareí) |
| **Receber novos** (botão verde) | Baixa novas cotações da Bionexo via integração SOAP (operação WGG) |
| **Atualizar** (botão outline) | Atualiza cotações já baixadas (prorrogações e pedidos) |

### 2.2 Filtros

| Filtro | Função |
|--------|--------|
| **Filtro texto** | Busca por hospital, produto ou descrição |
| **Nº PDC** | Busca pelo número da cotação (ID do Pedido de Cotação) |
| **Status** | Filtra por estágio: Recebido, Pareado, Cotação Enviada, Em Análise, Aceita, Pedido Gerado, Adquirido de Outra, Cancelado |
| **Categoria** | Filtra por classificação: Não Analisado, Interessante, Cotado, Descartado |
| **Com oportunidade pendente** | Checkbox que mostra apenas itens Não Analisado ou Interessante |
| **Buscar** (vermelho) | Aplica os filtros |
| **Limpar** | Reseta todos os filtros |

### 2.3 Botões de Ação em Lote

Selecione itens via checkbox e use os botões:

| Botão | Ação | Cor |
|-------|------|-----|
| **Marcar como Interessante** | Classifica itens como "vendemos este produto" | Verde |
| **Desmarcar Interessante** | Remove classificação Interessante | Outline |
| **Descartar** | Marca como "não vendemos este produto" | Outline |
| **Restaurar** | Volta para "Não Analisado" | Outline |
| **Aprender** | Abre modal para ensinar palavras-chave ao sistema | Outline |

### 2.4 Colunas da Tabela

| Coluna | Descrição |
|--------|-----------|
| ☐ | Checkbox para seleção |
| 👑 / 📋 | Coroa (marcar prioridade) / Prancheta (abrir detalhe) |
| **Id PDC** | Número da cotação na Bionexo |
| **Hospital** | Nome do hospital que publicou a cotação |
| **Vencimento** | Data limite para responder |
| **Hora Venc.** | Hora limite |
| **UF** | Estado do hospital |
| **Cidade** | Cidade do hospital |
| **Seq** | Número do item dentro da cotação |
| **Descrição** | Descrição do produto solicitado pelo hospital |
| **Cód. Comercial** | Categoria comercial (Mat. Hospitalar, Mat. Cirúrgico, etc.) |
| **Cód. Prod. Hosp.** | Código do produto no sistema do hospital |
| **Qtde** | Quantidade solicitada |
| **Und medida** | Unidade de medida (UN, CX, PCT, PAR, etc.) |
| **Qtd Emb.** | Quantidade por embalagem (preenchimento futuro) |
| **Marca** | Marca preferida ou aceita pelo hospital |
| **F. Pagto** | Forma de pagamento solicitada (30 DDL, 28 DDL, etc.) |
| **Produto Vinculado** | SKU interno + descrição do ERP Thesys (após pareamento) |
| **Preço Unit.** | Preço unitário cotado |

### 2.5 Cores das Linhas

| Cor | Significado |
|-----|-------------|
| **Amarelo claro** | Não Analisado — item ainda não foi classificado |
| **Verde claro** | Interessante — vendemos este produto, será cotado |
| **Azul claro** | Cotado — preço preenchido e cotação enviada |
| **Vermelho claro** | Descartado — não vendemos este produto |
| **Azul seleção** | Item selecionado via checkbox |

### 2.6 Ordenação Multi-Coluna

- **Clique simples** no cabeçalho: ordena por aquela coluna (ASC → DESC → Remove)
- **Shift + Clique**: adiciona coluna à ordenação (máximo 3)
- Indicadores ①②③ mostram a prioridade da ordenação

### 2.7 Ícones por Cotação

Na primeira linha de cada grupo de cotação:
- **👑 Coroa**: Clique para marcar/desmarcar como prioritária (dourada = prioritária, cinza = normal)
- **📋 Prancheta**: Clique para abrir a página de detalhe da cotação

---

## 3. Fluxo Completo — Passo a Passo

### Passo 1: Receber Cotações da Bionexo
1. Clique no botão **"Receber novos"** (verde)
2. Aguarde o spinner — o sistema está baixando do Bionexo via SOAP (operação WGG)
3. Mensagem verde ✅ = sucesso, vermelha ❌ = erro
4. Os novos itens aparecem na tabela com status "Não Analisado" (amarelo)

### Passo 2: Classificar Itens
1. **Selecione** itens via checkbox (um ou vários)
2. Clique em **"Marcar como Interessante"** para itens que você vende
3. Clique em **"Descartar"** para itens que você NÃO vende
4. Os itens mudam de cor (verde = interessante, vermelho = descartado)

### Passo 3: Ensinar o Sistema (Aprender)
1. Selecione um item e clique **"Aprender"**
2. O modal mostra as palavras extraídas da descrição
3. **Mova palavras** da lista "Disponíveis" para "Selecionadas" usando as setas
4. Escolha a ação: **Interessante** ou **Descartar**
5. Clique **"Salvar Regra"**
6. Na próxima integração, itens com essas palavras serão classificados automaticamente

### Passo 4: Abrir Detalhe da Cotação
1. Clique no **ícone 📋** ou na **linha** de um item
2. A página de detalhe mostra todos os itens daquela cotação
3. Cards informativos no topo: Vencimento, Forma Pagamento, Total Itens, CNPJ

### Passo 5: Preencher Preços e Dados
1. Clique em um item na tabela de detalhe para selecioná-lo
2. O painel de edição aparece com os campos:
   - **Produto (SKU)**: código interno do seu produto
   - **Preço Unitário**: valor em R$
   - **Comentário**: observações sobre o item
   - **Observação do Fornecedor**: nota para o hospital
3. Clique **"Salvar"** para cada item

### Passo 6: Navegar entre Itens
- Use os botões **◀ ▶** para ir ao item anterior/próximo
- Use **⏮ ⏭** para ir ao primeiro/último
- Ative **"Apenas Interessantes"** para pular itens descartados

### Passo 7: Enviar Cotação ao Bionexo
1. Role até a seção **"Enviar Cotação para Bionexo"**
2. Preencha: Data, Validade, Condição de Pagamento, Prazo de Entrega, Faturamento Mínimo, Tipo de Frete
3. Verifique os avisos:
   - ⚠️ "Existem itens Não Analisado" — classifique antes de enviar
   - ⚠️ "Itens Interessante sem código interno" — vincule o SKU antes
4. Clique **"Enviar Cotação"** — o sistema envia via SOAP (operação WHS)

### Passo 8: Acompanhar Status
- Após enviar, o status muda para **"Cotação Enviada"**
- O hospital analisa e pode aceitar, rejeitar ou comprar de outro fornecedor
- Use **"Atualizar"** para baixar mudanças de status

---

## 4. Palavras-Chave

**Menu:** Palavras-Chave (sidebar)

Gerencia regras de classificação automática. Quando uma cotação é recebida, o sistema verifica se a descrição contém alguma palavra-chave cadastrada e classifica automaticamente.

### Como Adicionar
1. Clique **"+ Adicionar"**
2. Digite a palavra-chave (ex: SERINGA, CATETER, MANUTENÇÃO)
3. Escolha a ação: **Interessante** (verde) ou **Descartar** (vermelho)
4. Clique **"Salvar"**

### Tabela
| Coluna | Descrição |
|--------|-----------|
| Palavra-Chave | A palavra cadastrada |
| Ação Automática | Interessante (verde) ou Descartar (vermelho) |
| Matches | Quantos itens já foram classificados por esta regra |
| Data Criação | Quando foi cadastrada |
| Ações | Editar / Excluir |

### Exportar / Importar (Em breve)
- **Exportar**: baixa todas as palavras-chave como arquivo CSV
- **Importar**: carrega palavras-chave de um arquivo CSV

---

## 5. Dicionário De-Para (Mapeamento)

**Menu:** Dicionário De-Para (sidebar)

Gerencia o vínculo entre descrições do hospital (Bionexo) e SKUs internos (Thesys).

### Tab 1: Pareamentos de Produtos (SKUs)
Mostra os vínculos já criados:
- **Descrição do Comprador** — como o hospital descreve o produto
- **SKU Thesys** — código interno no seu ERP
- **Descrição Interna** — nome do produto no ERP
- Botão **"Desfazer"** para remover o vínculo

### Tab 2: Regras de Palavras-Chave
Mesmas regras da página Palavras-Chave, acessíveis também por aqui.

### Exportar / Importar (Em breve)
- **Exportar**: baixa todos os pareamentos como arquivo CSV
- **Importar**: carrega pareamentos de um arquivo CSV

---

## 6. Pedidos Confirmados

**Menu:** Pedidos (sidebar)

Mostra os pedidos confirmados pelos hospitais após aceite da cotação.

| Coluna | Descrição |
|--------|-----------|
| Pedido Bionexo | ID do pedido |
| Hospital | Nome do hospital |
| CNPJ | CNPJ do hospital |
| Data | Data do pedido |
| Valor Total | Valor em R$ |
| Status | CONFIRMADO (azul), EM ENTREGA (amarelo), ENTREGUE (verde), CANCELADO (vermelho) |

---

## 7. Logs de Sincronização

**Menu:** Logs de Sync (sidebar)

Histórico de todas as operações EDI com a Bionexo.

| Coluna | Descrição |
|--------|-----------|
| Data/Hora | Quando a operação foi executada |
| Operação | WGG (receber), WHS (enviar), WJG (pedidos), WGA (prorrogações), WKN (status) |
| Direção | IN (download) ou OUT (upload) |
| Status | SUCESSO (verde), ERRO (vermelho), VAZIO (cinza) |
| Mensagem | Detalhes do resultado |
| Processadas | Quantidade de itens processados |

---

## 8. Configurações

**Menu:** Configurações (sidebar)

### Integração Bionexo (EDI SOAP)
- **CNPJ Fornecedor**: CNPJ da PROMEHO
- **Usuário/Senha**: credenciais do WebService
- **URL do WSDL**: endpoint SOAP
- **Ambiente**: Sandbox (homologação) ou Produção
  - Ao trocar, os campos preenchem automaticamente
- **Intervalo Polling**: frequência do bot automático (3-60 min)
- **Testar Conexão**: verifica se o Bionexo responde
- **Debug Completo**: mostra diagnóstico passo a passo

### Integração Thesys ERP (REST API)
- **URL Base**: endpoint da API Thesys
- **Token**: chave de autenticação

### Bot Automático
- Ativa/desativa o download automático de cotações
- Intervalo configurável em minutos

---

## 9. Gestão de Utilizadores

**Menu:** Utilizadores (sidebar)

- Criar novos usuários com perfil MASTER ou OPERADOR
- MASTER: acesso total
- OPERADOR: apenas cotações
- Ativar/desativar usuários (sem exclusão para auditoria)

---

## 10. Glossário

| Termo | Significado |
|-------|-------------|
| **PDC** | Pedido de Cotação — solicitação do hospital |
| **WGG** | Operação SOAP para baixar cotações |
| **WHS** | Operação SOAP para enviar resposta de cotação |
| **WJG** | Operação SOAP para baixar pedidos confirmados |
| **Token** | Identificador de paginação da Bionexo |
| **Id_Artigo** | ID do item na Bionexo (usado para vincular resposta) |
| **SKU** | Código interno do produto no ERP Thesys |
| **De-Para** | Vínculo entre descrição Bionexo e SKU interno |
| **Sandbox** | Ambiente de homologação (testes) |
| **Produção** | Ambiente real (dados reais de hospitais) |

---

## 11. Dicas Importantes

1. **Não clique "Enviar Cotação" sem querer** — isso envia preços reais ao hospital
2. **WGG é seguro** — apenas lê dados, não sinaliza nada ao hospital
3. **WJG sinaliza ao hospital** — indica que você viu o pedido
4. **Classifique tudo antes de enviar** — itens "Não Analisado" bloqueiam o envio
5. **Use "Aprender" para automatizar** — quanto mais palavras-chave, menos trabalho manual
6. **Salve sempre** — edições de preço/SKU precisam ser salvas item a item
7. **Verifique o vencimento** — cotações vencidas não podem ser respondidas

---

*Manual gerado em 28/03/2026 — Portal Thesys-Bionexo v2026.03.28*
