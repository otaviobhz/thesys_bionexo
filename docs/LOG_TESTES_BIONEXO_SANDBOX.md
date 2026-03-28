# Log de Testes — Sandbox Bionexo

## Credenciais
- **Usuario:** ws_promeho_sand_76283
- **Senha:** xjtzJnz9FNmB62
- **URL TLS 1.2/1.3:** https://ws-bionexo-sandbox.bionexo.com/ws2/BionexoBean
- **URL TLS 1.1:** https://ws-bionexo-sandbox-ssl.bionexo.com/ws2/BionexoBean
- **WSDL TLS 1.2/1.3:** https://ws-bionexo-sandbox.bionexo.com/ws2/BionexoBean?wsdl
- **WSDL TLS 1.1:** https://ws-bionexo-sandbox-ssl.bionexo.com/ws2/BionexoBean?wsdl

## Descobertas

### 1. O sandbox FUNCIONA intermitentemente
Os logs provam que o sandbox funcionou em multiplos momentos:
- 00:39 UTC 28/03 → SUCESSO (1 cotacao salva: #211652791)
- 13:45 UTC 28/03 → SUCESSO (1 cotacao encontrada)
- 14:40 UTC 28/03 → SUCESSO (1 cotacao encontrada)

### 2. Rate limit do Akamai CDN
Toda vez que fizemos multiplas requisicoes seguidas (debugging), o sandbox retornou 503.
A documentacao confirma: "Número de acessos por minuto ultrapassado"

### 3. A lib `soap` do Node.js crasha com XML dentro de `<return>`
Quando o sandbox retorna dados (status=1 com XML), a lib `soap` tenta parsear o XML dentro de `<return>` e causa:
```
TypeError: Cannot use 'in' operator to search for 'Pedidos' in 1;211652791;
at p.onclosetag (soap/lib/wsdl/index.js:385:27)
```
**Solucao:** Usar chamada HTTP raw (rawSoapCall) em vez da lib soap.

### 4. O nome correto da operacao e WJG (nao WIJ)
A documentacao (pagina 19) diz "Operação WJG". O Dados_Acesso.txt confirma: "WJG habitado".
Teste em producao confirmou: `WJG return: 0;309596782;null` (funciona).

### 5. URL da documentacao antiga nao funciona mais
A documentacao v3.14 (pagina 29) mostra `http://sandbox.bionexo.com.br/ws2/BionexoBean` — esse dominio **NAO existe mais** (DNS NXDOMAIN). As URLs corretas sao as do Dados_Acesso.txt.

### 6. WGG e seguro em producao
- WGG usa metodo `request` (leitura) — NAO sinaliza ao hospital
- WJG sinaliza resgate ao hospital (passo 11 do fluxo macro)
- Producao com credenciais sandbox retorna "Incorrect login/password"

## Timeline Completa de Testes

| Hora (UTC) | Status | Detalhes |
|------------|--------|----------|
| 27/03 21:02 | VAZIO | Sandbox OK, sem dados (TOKEN=0) |
| 27/03 21:06 | ERRO | Sandbox com dados! Lib soap crashou ("Cannot use in") |
| 27/03 22:06-22:08 | ERRO | 6x "Cannot use in" — sandbox retornando dados, parser errado |
| 28/03 00:22-00:29 | ERRO | 3x "Cannot use in" — mesmo problema |
| **28/03 00:39** | **SUCESSO** | **1 cotacao SALVA! (#211652791, AAS 100mg)** — rawSoapCall OK |
| 28/03 01:07 | 503 | Sandbox caiu (27min apos sucesso) |
| 28/03 01:07-02:50 | 503 | 10x requests rapidas durante debug — rate limit |
| 28/03 03:57 | VAZIO | Producao OK (trocamos para producao) |
| **28/03 13:45** | **SUCESSO** | Sandbox voltou! (1 encontrada, ja existia) |
| **28/03 14:40** | **SUCESSO** | Sandbox ainda OK |
| 28/03 14:40-14:44 | VAZIO | 4 requests em 2min |
| 28/03 16:28 | 503 | Sandbox caiu de novo (rate limit provavel) |
| 28/03 16:51 | VAZIO | Producao OK |
| 28/03 17:35 | 503 | Sandbox down (testes exhaustivos) |

## Correcoes Aplicadas

1. **rawSoapCall** — bypass da lib soap, HTTP direto
2. **WIJ → WJG** — nome correto da operacao
3. **Parser WGG corrigido** — Pedidos.Pedido.Cabecalho (layout oficial v3.14)
4. **Id_Artigo salvo** — campo obrigatorio para WHS
5. **Sem fallback** — URL unica da config, sem retry automatico
6. **Mensagem 503 centralizada** — formatBionexoError()

## Proximo Teste
- Esperar 5+ min sem requisicoes
- Fazer UMA UNICA chamada WGG
- Registrar resultado aqui

## Testes Adicionais (28/03/2026)

| Hora (UTC) | URL | Espera | Resultado |
|------------|-----|--------|-----------|
| 17:52 | TLS 1.2 (sandbox) | 5 min | 503 |
| 18:08 | TLS 1.1 (sandbox-ssl) | 15 min | 503 |

**Conclusao:** Nao e rate limit. O sandbox esta fora do ar de verdade. Mesmo apos 15 minutos sem requisicoes, ambas URLs retornam 503 Akamai.

**Proximo passo:** Agendar teste automatico a cada 30 minutos para detectar quando voltar.
