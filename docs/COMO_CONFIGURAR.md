# Como Configurar o Portal Thesys-Bionexo

## Pré-requisitos

- Docker e Docker Compose instalados
- Acesso à rede onde o Thesys roda
- Credenciais da Bionexo (token WebService)

---

## 1. Subir o sistema

```bash
cd /home/otavio/Projetos_Oficial/thesys_bionexo
docker compose up -d
```

Isso sobe 4 containers:
| Container | Porta | URL |
|-----------|-------|-----|
| Frontend | 7000 | http://10.147.20.85:7000 |
| Backend | 7001 | http://10.147.20.85:7001 |
| PostgreSQL | 7432 | localhost:7432 |
| Redis | 7379 | localhost:7379 |

## 2. Primeiro acesso

Acesse: **http://10.147.20.85:7000/login**

Credenciais iniciais:
```
Email: admin@promeho.com.br
Senha: Admin123!
```

## 3. Configurar integração Thesys

### O que pedir para o Thanner/Gabriel:

1. **URL base da API** — Ex: `http://10.200.0.8:3001/api/bionexo`
2. **Token de autenticação** — Bearer token para acessar a API
3. **Confirmar os 4 endpoints** implementados (ver `docs/API_THESYS_SPEC.md`)

### Como configurar:

1. No menu lateral, clique em **Configurações**
2. Na seção "Integração Thesys ERP":
   - Cole a **URL Base da API** que o Thanner passou
   - Cole o **Token de Autenticação**
3. Clique em **"Testar Conexão"**
4. Se mostrar "Conexão OK" → está funcionando
5. Clique em **"Salvar"**

### Como testar via terminal:

```bash
# Testar se a API do Thesys responde
curl -H "Authorization: Bearer TOKEN_DO_THANNER" \
     http://URL_DO_THANNER/api/bionexo/itens

# Deve retornar uma lista de produtos:
# [{"id":1,"sku":"9928","descricao":"SERINGA 10ML","unidade":"CX"}, ...]
```

## 4. Configurar integração Bionexo

### O que pedir para a Bionexo:

1. **Token de integração WebService** — fornecido pelo suporte da Bionexo
2. **Usuário WebService** — um por CNPJ
3. **CNPJ cadastrado** — o CNPJ do fornecedor (PROMEHO)
4. **Acesso ao sandbox** — para testes iniciais

### Como solicitar:

Enviar email para o suporte da Bionexo solicitando:
```
Assunto: Solicitação de acesso WebService EDI - PROMEHO

Prezados,

Solicitamos o acesso ao WebService EDI para integração com nosso sistema.

Dados do fornecedor:
- Razão Social: PROMEHO
- CNPJ: XX.XXX.XXX/XXXX-XX
- Contato técnico: [seu email]

Necessitamos:
1. Token de integração WebService
2. Usuário WebService para download/upload
3. Acesso ao ambiente de homologação (sandbox)

Tipo de integração: EDI WebService SOAP (versão 3.13)

Atenciosamente,
[Nome]
```

### Como configurar:

1. No menu lateral, clique em **Configurações**
2. Na seção "Integração Bionexo":
   - Cole o **CNPJ** do fornecedor
   - Cole o **Token** de integração
   - Selecione o **Ambiente**: Sandbox (testes) ou Produção
   - Defina o **Intervalo de Polling**: 5 minutos (recomendado)
3. Clique em **"Testar Conexão"**
4. Se mostrar "Conexão OK" → está funcionando
5. Clique em **"Salvar"**

### Como testar via terminal:

```bash
# Testar conexão com sandbox Bionexo
curl "http://sandbox.bionexo.com.br/ws2/BionexoBean?wsdl"

# Deve retornar o WSDL do WebService (XML)
```

### Endpoints Bionexo:

| Ambiente | URL |
|----------|-----|
| Sandbox (testes) | http://sandbox.bionexo.com.br/ws2/BionexoBean |
| Produção | https://ws.bionexo.com.br/BionexoBean |

## 5. Ativar o bot automático

Após configurar AMBAS as integrações (Thesys + Bionexo):

1. Na tela de **Configurações**, seção "Bot Automático"
2. Clique em **"Ativar"**
3. O bot vai:
   - Baixar novas cotações a cada X minutos (WGG)
   - Verificar prorrogações (WGA)
   - Baixar pedidos confirmados (WJG)
   - Auto-classificar itens baseado nas palavras-chave cadastradas

## 6. Fluxo de operação diário

```
08:00  Operador abre http://10.147.20.85:7000
       Bot já baixou cotações da noite

       Itens VERDES = auto-classificados por keywords
       Itens VERMELHOS = auto-descartados
       Itens AMARELOS = precisam avaliação manual

       Operador trabalha nos amarelos:
       1. Marca como Interessante ou Descartar
       2. Para itens novos: "Aprender" (salva keywords)
       3. Para itens sem SKU: "Vincular Produto" (parear)
       4. Preenche preço nos itens pareados
       5. Envia cotação

17:00  Operador encerra
       Bot continua baixando cotações automaticamente
```

---

## Checklist de Configuração

| # | Tarefa | Responsável | Status |
|---|--------|-------------|--------|
| 1 | Subir Docker Compose | Otávio | ⬜ |
| 2 | Login com admin@promeho.com.br | Otávio | ⬜ |
| 3 | Receber URL + Token API Thesys | Thanner/Gabriel | ⬜ |
| 4 | Configurar API Thesys no /config | Otávio | ⬜ |
| 5 | Testar conexão Thesys | Otávio | ⬜ |
| 6 | Solicitar token Bionexo | Otávio → Bionexo | ⬜ |
| 7 | Receber token + CNPJ da Bionexo | Bionexo | ⬜ |
| 8 | Configurar Bionexo no /config | Otávio | ⬜ |
| 9 | Testar conexão Bionexo (sandbox) | Otávio | ⬜ |
| 10 | Cadastrar palavras-chave iniciais | Operador | ⬜ |
| 11 | Fazer o primeiro pareamento (De-Para) | Operador | ⬜ |
| 12 | Ativar bot automático | Otávio | ⬜ |
| 13 | Testar fluxo completo no sandbox | Operador | ⬜ |
| 14 | Trocar para ambiente Produção | Otávio | ⬜ |
| 15 | Go-live | Todos | ⬜ |

---

## Troubleshooting

### Backend não inicia
```bash
docker logs bionexo-backend
# Verificar erros de conexão com PostgreSQL
```

### Erro de conexão com Thesys
```bash
# Verificar se a URL está acessível
curl -v http://URL_DO_THANNER/api/bionexo/itens
# Verificar firewall / VPN / rede
```

### Erro de conexão com Bionexo
```bash
# Verificar se o WSDL está acessível
curl -v "http://sandbox.bionexo.com.br/ws2/BionexoBean?wsdl"
# Verificar se o token está correto
```

### Resetar banco de dados
```bash
docker compose down
docker volume rm thesys_bionexo_postgres-data
docker compose up -d
# O seed roda automaticamente e recria os dados iniciais
```
