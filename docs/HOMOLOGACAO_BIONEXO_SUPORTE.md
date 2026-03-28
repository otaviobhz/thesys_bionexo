# Solicitação de Reativação — Ambiente de Homologação Bionexo EDI

**Empresa:** PROMEHO
**Data:** 28/03/2026
**Projeto:** Integração EDI WebService Fornecedor (Portal Thesys-Bionexo)
**Enviar para:** integracao@bionexo.com
**Assunto sugerido:** Solicitação de reativação — Homologação EDI PROMEHO (ws_promeho_sand_76283)

---

## 1. Resumo da Situação

Estamos desenvolvendo a integração EDI WebService da PROMEHO com a plataforma Bionexo. O sistema já está funcional e testado, porém o **ambiente de homologação (sandbox) parou de responder** e precisamos que seja reativado para concluir os testes.

### O que já funciona no nosso sistema:
- ✅ Conexão SOAP com Bionexo (método `request` e `post`)
- ✅ Operação **WGG** — Download de cotações (layout WG)
- ✅ Parsing completo do XML (Pedidos/Pedido/Cabecalho + Itens_Requisicao/Item_Requisicao)
- ✅ Salvamento de Id_Pdc, Id_Artigo, todos os campos do layout WG
- ✅ Operação **WHS** — Envio de resposta preparado (layout WH)
- ✅ Operação **WJG** — Download de pedidos confirmados (layout WJ)
- ✅ Operação **WGA** — Prorrogações de vencimento
- ✅ Operação **WKN** — Status dos itens respondidos (layout WK)
- ✅ TOKEN management (armazenamento e reutilização)
- ✅ Interface web completa para operadores (classificação, pareamento, envio)

### Prova de funcionamento:
Na data **28/03/2026 às 00:39 UTC**, conseguimos baixar com sucesso a cotação de teste:
- **PDC #211652791** — "Cotação criada por automação"
- **Hospital:** Automacao Cypress Classica Filial 1
- **CNPJ:** 74.715.947/0001-15
- **Item:** AAS | 100mg | Comprimido | SANOFI MEDLEY (Id_Artigo: 136822011)
- **Token retornado:** 211652791

---

## 2. Problema Atual

O ambiente de homologação **parou de responder com HTTP 503** (erro Akamai CDN).

### Credenciais utilizadas:
- **Usuário:** ws_promeho_sand_76283
- **Senha:** xjtzJnz9FNmB62

### URLs testadas:
| URL | Protocolo | Status |
|-----|-----------|--------|
| https://ws-bionexo-sandbox.bionexo.com/ws2/BionexoBean | HTTPS TLS 1.2/1.3 | **503** |
| https://ws-bionexo-sandbox-ssl.bionexo.com/ws2/BionexoBean | HTTPS TLS 1.1 | **503** |
| http://sandbox.bionexo.com.br/ws2/BionexoBean | HTTP (doc v3.14) | **DNS não resolve** |

### Ambiente de produção (referência):
| URL | Status |
|-----|--------|
| https://ws.bionexo.com.br/BionexoBean | **200 OK** (funciona normalmente) |

### Erro retornado pelo Akamai:
```html
<HTML><HEAD><TITLE>Error</TITLE></HEAD><BODY>
An error occurred while processing your request.
Reference #30.xxxx.xxxxxxxxxx.xxxxxxxx
https://errors.edgesuite.net/30.xxxx...
</BODY></HTML>
```

---

## 3. Timeline dos Testes

| Data/Hora (UTC) | Operação | URL | Resultado |
|-----------------|----------|-----|-----------|
| 27/03 21:02 | WGG TOKEN=0 | sandbox-ssl | ✅ VAZIO (conexão OK) |
| 27/03 21:06 | WGG TOKEN=211652785 | sandbox-ssl | ✅ Retornou dados (status=1) |
| **28/03 00:39** | **WGG TOKEN=211652785** | **sandbox-ssl** | **✅ SUCESSO — 1 cotação salva** |
| 28/03 01:07 | WGG | sandbox-ssl | ❌ 503 |
| 28/03 13:45 | WGG | sandbox | ✅ Voltou brevemente |
| 28/03 14:40 | WGG | sandbox | ✅ Funcionou |
| 28/03 16:28 | WGG | sandbox | ❌ 503 |
| 28/03 17:35 — atual | Todos os testes | Ambas URLs | ❌ 503 persistente |

---

## 4. O que Precisamos

### Solicitação:
**Reativação do ambiente de homologação** para o usuário `ws_promeho_sand_76283` para que possamos concluir os testes das seguintes operações:

| Operação | Descrição | Status do Teste |
|----------|-----------|-----------------|
| **WGG** | Download de cotações | ✅ Testado com sucesso |
| **WHS** | Envio da primeira resposta | ⏳ Pendente — precisa do sandbox |
| **WHU** | Alteração de resposta | ⏳ Pendente |
| **WGA** | Cotações prorrogadas | ⏳ Pendente (código pronto) |
| **WJG** | Pedidos confirmados | ⏳ Pendente (código pronto) |
| **WKN** | Status dos itens | ⏳ Pendente (código pronto) |
| **WMG** | Dados cadastrais | ⏳ Pendente |

### Informações adicionais:
- **Versão da documentação:** EDI_WebService_Fornecedores_pt_v3.14
- **Operação WJG:** Conforme Dados_Acesso.txt, WJG está "habitado" para a conta de produção
- **Método utilizado:** `request` para downloads, `post` para uploads
- **Encoding:** ISO=0 (UTF-8)
- **Layout:** WG para download, WH para upload de respostas

### Perguntas para o suporte:
1. O ambiente de homologação tem **prazo de utilização definido**? O nosso expirou?
2. É possível **reativar o sandbox** por mais um período para completarmos os testes?
3. Existe alguma **URL alternativa** para o sandbox que devemos usar?
4. Podemos usar a conta de **produção apenas para WGG** (download/leitura) durante a homologação, sem risco de enviar cotações?

---

## 5. Dados Técnicos do Nosso Sistema

### Stack:
- **Backend:** NestJS 11 + TypeScript + Prisma ORM 7 + PostgreSQL 18
- **Frontend:** React 19 + Vite + TanStack Router
- **Infraestrutura:** Docker Compose (4 containers)
- **Integração SOAP:** Chamada HTTP raw direta (sem dependência de lib WSDL)

### Operações implementadas conforme documentação:
```
WGG: request(user, pass, 'WGG', 'LAYOUT=WG;TOKEN={token};ISO=0')
WHS: post(user, pass, 'WHS', 'LAYOUT=WH', <XML WH/>)
WHU: post(user, pass, 'WHU', 'LAYOUT=WH;ID={id}', <XML WH/>)
WGA: request(user, pass, 'WGA', 'DT_BEGIN={dt};DT_END={dt};LAYOUT=WG;ISO=0')
WJG: request(user, pass, 'WJG', 'TOKEN={token};LAYOUT=WJ;ISO=0')
WKN: request(user, pass, 'WKN', 'ID={id};LAYOUT=WK;ISO=0')
WMG: request(user, pass, 'WMG', 'CNPJ={cnpj};LAYOUT=WM;ISO=0')
```

### XML de teste WGG que funcionou:
```xml
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:tns="http://webservice.bionexo.com/">
  <soap:Body>
    <tns:request>
      <login>ws_promeho_sand_76283</login>
      <password>xjtzJnz9FNmB62</password>
      <operation>WGG</operation>
      <parameters>LAYOUT=WG;TOKEN=211652785;ISO=0</parameters>
    </tns:request>
  </soap:Body>
</soap:Envelope>
```

### Resposta recebida com sucesso:
```
1;211652791;<?xml version="1.0" encoding="UTF-8"?>
<Pedidos xmlns="http://www.bionexo.com.br">
  <Pedido>
    <Cabecalho>
      <Id_Pdc>211652791</Id_Pdc>
      <Titulo_Pdc>Cotação criada por automação</Titulo_Pdc>
      <Data_Vencimento>24/03/2030</Data_Vencimento>
      <Hora_Vencimento>19:03</Hora_Vencimento>
      <Nome_Hospital>Automacao Cypress Classica Filial 1</Nome_Hospital>
      <CNPJ_Hospital>74.715.947/0001-15</CNPJ_Hospital>
      ...
    </Cabecalho>
    <Itens_Requisicao>
      <Item_Requisicao>
        <Sequencia>1</Sequencia>
        <Id_Artigo>136822011</Id_Artigo>
        <Codigo_Produto>11781528</Codigo_Produto>
        <Descricao_Produto>AAS | 100mg | Comprimido | SANOFI MEDLEY</Descricao_Produto>
        <Quantidade>10.0</Quantidade>
        <Unidade_Medida>Comprimido</Unidade_Medida>
        ...
      </Item_Requisicao>
    </Itens_Requisicao>
  </Pedido>
</Pedidos>
```

---

## 6. Pesquisa Adicional Realizada (28/03/2026)

Verificamos que **todo o ecossistema sandbox da Bionexo** está indisponível, não apenas o WebService:

| Serviço Sandbox | URL | Status |
|-----------------|-----|--------|
| WebService TLS 1.2 | ws-bionexo-sandbox.bionexo.com | **503** |
| WebService TLS 1.1 | ws-bionexo-sandbox-ssl.bionexo.com | **503** |
| Portal Apex (teste hospital) | sandbox-apex.cloud.bionexo.com.br | **DNS falha** |
| Site Sandbox | sandbox.bionexo.com.br | **DNS falha** |
| BioID Sandbox | bioid-shared-sandbox.bionexo.com | **503** |
| **Produção** | **ws.bionexo.com.br** | **200 OK** |

A página de status (status.bionexo.com) não reporta incidentes — confirmando que o sandbox não é monitorado publicamente e é ativado/desativado sob demanda para cada fornecedor em homologação.

---

## 7. Contato

**Responsável técnico:** Otávio (PROMEHO)
**Sistema:** Portal Thesys-Bionexo v2026.03.28
**Email integração Bionexo:** integracao@bionexo.com

Ficamos no aguardo da reativação para concluir a homologação.

Atenciosamente,
**PROMEHO**
