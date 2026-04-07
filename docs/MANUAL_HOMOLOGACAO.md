# Manual de Homologação — Portal Thesys-Bionexo

> Roteiro de teste **antes** da execução do BLOCO 1 (Sprints 1-3). Tester: Otávio (primeira passada) e Daniel Alves (segunda passada). Objetivo: validar o sistema atual no sandbox + capturar baseline para medir ROI das melhorias.
>
> **Versão:** 2026-04-07 · **Ambiente alvo:** Sandbox Bionexo + API Thesys real
>
> ⚠️ **IMPORTANTE:** este manual lista bugs conhecidos. Quando aparecer ⚠️ "Comportamento esperado vs real", isso é INTENCIONAL — é o que o BLOCO 1 vai consertar. Anote todos os desvios para usar como baseline.

---

## Pré-requisitos antes de começar

- [ ] Docker e os 4 containers rodando (`postgres`, `redis`, `backend`, `frontend`)
- [ ] Acesso ao portal: `http://10.147.20.85:7000` (via ZeroTier) **ou** `http://localhost:7000` (no servidor)
- [ ] Credenciais admin: `admin@promeho.com.br` / `Admin123!`
- [ ] Sandbox Bionexo respondendo (usuário `ws_promeho_sand_76283`)
- [ ] API Thesys acessível (URL + token configurados — pedir ao Thanner/Gabriel se não souber)
- [ ] Cronômetro ou relógio (para medir baseline de tempo)
- [ ] Caderno/planilha para anotar desvios

**Se algum pré-requisito falhar:** parar e abrir issue antes de prosseguir.

---

## ETAPA 0 — Health Check (5 min)

### 0.1 Subir o portal

```bash
cd /home/otavio/Projetos_Oficial/thesys_bionexo
docker compose ps
```

Esperado: 4 containers `Up` (postgres, redis, backend, frontend). Se algum não estiver, `docker compose up -d`.

### 0.2 Login

1. Abrir `http://10.147.20.85:7000/login` no navegador.
2. Digitar `admin@promeho.com.br` / `Admin123!`, clicar **Entrar**.
3. ✅ Esperado: redireciona para `/` (página de Cotações).
4. ❌ Se voltar para login → token JWT expirado/malformado, verificar `JWT_SECRET` no `.env`.

### 0.3 Testar conexão Bionexo

1. Menu lateral → **Configurações**.
2. Seção "Integração Bionexo (EDI SOAP)":
   - Ambiente: **SANDBOX**
   - Usuário: `ws_promeho_sand_76283`
   - WSDL: `https://ws-bionexo-sandbox.bionexo.com/ws2/BionexoBean?wsdl`
3. Clicar **"Testar Conexão"** (ou "Debug Completo").
4. ✅ Esperado: 8 passos verdes (WSDL → Auth → GetToken → FindPedidos → ParseXML → MapToLocalDB → SaveDB → Complete).
5. ❌ Se algum passo falhar:
   - **WSDL fail:** problema de rede/TLS. Tentar URL alternativa `https://ws-bionexo-sandbox-ssl.bionexo.com/ws2/BionexoBean?wsdl`.
   - **Auth fail:** credenciais erradas — pedir senha ao Anderson (`integracao@bionexo.com`, ticket PRODU-182518).
   - **HTTP 503:** sandbox offline. Aguardar 5 min e tentar de novo.
   - **Anotar:** qual passo falhou + tempo + mensagem completa.

### 0.4 Testar conexão Thesys

1. Mesma página, seção "Integração Thesys ERP".
2. Clicar **"Testar Conexão"**.
3. ✅ Esperado: "Conexão OK" / "Helloworld respondeu em Xms".
4. ❌ Se falhar: pegar URL e token corretos com Thanner/Gabriel. **Sem isso, S1.6 (auto-preço) não funciona.**

### 0.5 Capturar uma resposta SOAP do sandbox (importante para S1.2)

> Esta etapa é nova e crítica para o Sprint 1. Pede mais paciência.

1. Abrir terminal no servidor backend:
   ```bash
   docker compose logs -f backend
   ```
2. Em outra aba, no portal: clicar **"Receber novos"**.
3. Voltar ao terminal, procurar linha `[WGG] dataPreview=<?xml ...`.
4. Copiar o XML completo, salvar em `/tmp/wgg-sample.xml` (ou colar no caderno).
5. **Procurar** se há tags como `Quantidade_Aproximada`, `Quantidade_Media`, `Faixa_Quantidade`, `QtdEmbalagem`, `Embalagem_Padrao`.
6. Anotar quais campos existem (ou não). **Esse output decide se a coluna `qtdAproximada` fica ou some no Sprint 1.**

---

## ETAPA 1 — Receber e classificar cotações (15 min)

### 1.1 Receber novas cotações do sandbox

1. Menu lateral → **Cotações**.
2. Garantir filtro **"Com oportunidade pendente"** desmarcado.
3. **🕐 Cronômetro:** começar a marcar tempo.
4. Clicar **"Receber novos"** (botão verde).
5. Aguardar spinner.
6. ✅ Esperado: mensagem verde tipo "X cotações recebidas, Y novas salvas".
7. **Anotar:** valor de Y (cotações novas).
8. Se Y=0 e a tela já estava vazia, sandbox pode estar sem cotações. Esperar 5 min e tentar de novo. Se persistir, validar com Anderson.

### 1.2 Inspecionar a lista

1. Olhar a tabela carregada. Quantos itens? Anotar.
2. **⚠️ Bug crítico #1 — esperado:** todos os itens recém-recebidos vêm em **AMARELO** (categoria `NAO_ANALISADO`), mesmo se já existirem regras de palavras-chave ou pareamentos cadastrados.
3. **Validação:** menu lateral → **Palavras-Chave**. Existe regra alguma? Quantas?
4. Voltar para **Cotações**. Conferir se algum item amarelo deveria ter sido auto-classificado por uma das regras existentes.
5. **Anotar:** quantos itens amarelos vs quantos deveriam ter sido auto-classificados (baseline para S1.7 — "Aplicar regras agora").

### 1.3 Bug crítico #2 — Quantidade aproximada random

1. Olhar a coluna **"Qtd Embalagem"** ou similar (alguma coluna com número aparentemente aleatório).
2. **F5** para recarregar a página.
3. Olhar de novo a mesma coluna no mesmo item.
4. ❌ Esperado (bug): números mudaram.
5. **Anotar:** "Qtd Aproximada do item X primeira vez = N1, segunda vez = N2 (deveria ser igual)".

### 1.4 Bug crítico #3 — Mock fallback silencioso

1. Em outro terminal: `docker compose stop backend`.
2. No portal, navegar para menu lateral → **Dicionário De-Para**.
3. ❌ Esperado (bug): página carrega normalmente com vínculos FAKE em vez de mostrar erro.
4. **Anotar:** "Stop do backend não gera erro visível em /mapeamento. Lista mostra X itens fake."
5. `docker compose start backend` (recuperar).

### 1.5 Classificar manualmente (medir tempo do operador)

1. **🕐 Cronômetro:** zerar. Escolher 10 itens variados (uns vendíveis, uns não).
2. Para cada item:
   - Selecionar via checkbox.
   - Clicar **"Marcar como Interessante"** ou **"Descartar"**.
3. **🕐 Parar cronômetro.** Anotar segundos. **Esse é o baseline de "tempo de classificação manual de 10 itens".**

---

## ETAPA 2 — Pareamento e Aprender (15 min)

### 2.1 Ensinar uma palavra-chave

1. Selecionar 1 item interessante (ex: contém "SERINGA" na descrição).
2. Clicar **"Aprender"**.
3. Modal abre com palavras extraídas (stop-words já removidas).
4. Mover **"SERINGA"** para coluna direita usando `>`.
5. Selecionar ação **"Classificar como Interessante"**.
6. Clicar **"Salvar Regra"**.
7. ✅ Validar: menu lateral → **Palavras-Chave** → nova regra existe.

### 2.2 Bug crítico #1 — Validar (provavelmente vai falhar)

1. Voltar para **Cotações**.
2. Clicar **"Receber novos"** de novo (assumindo que o sandbox tem mais cotações com SERINGA).
3. **⚠️ Esperado pelo doc, mas NÃO acontece:** itens com "SERINGA" na descrição deveriam vir VERDES automaticamente.
4. **Anotar:** "Após criar regra SERINGA, novos itens com SERINGA vieram amarelos (bug confirmado)."
5. Se vieram verdes → o sistema mudou desde a análise. Avisar Otávio.

### 2.3 Parear um item ao SKU Thesys

1. Clicar na **prancheta 📋** ou na linha de uma cotação.
2. Página de detalhe abre.
3. Selecionar 1 item interessante.
4. Clicar **"Parear"** ou **"Vincular Produto"**.
5. Modal abre.
6. Digitar 2+ caracteres (ex: "SERIN") → aguardar 300ms.
7. ✅ Esperado: dropdown mostra resultados do Thesys (até 15 itens).
8. ❌ Se mostrar 0 resultados ou erro: API Thesys não respondeu. Verificar conexão (Etapa 0.4).
9. Selecionar 1 SKU → preview aparece.
10. Clicar **"Confirmar Pareamento"**.

### 2.4 Bug crítico #4 — Validar persistência do De-Para

1. ✅ O item na grid deveria mostrar o SKU agora.
2. **Validação:** menu lateral → **Dicionário De-Para**. O vínculo recém-criado DEVE aparecer aqui.
3. **❌ Se NÃO aparecer:** bug crítico #4 confirmado — `POST /mapeamento` falhou silenciosamente. Anotar.
4. Se aparecer → ok, esse caso específico funcionou (mas o erro silencioso ainda é um risco).

### 2.5 Medir tempo de pareamento

1. **🕐 Cronômetro:** começar.
2. Parear 5 itens (cada um: clicar item → Parear → digitar busca → escolher → confirmar).
3. **🕐 Parar.** Anotar segundos. **Baseline: tempo de pareamento manual de 5 itens.**

---

## ETAPA 3 — Preço e envio (15 min)

### 3.1 Preencher preço (com observação importante)

1. Ainda no detalhe da cotação, com 1 item selecionado.
2. Painel direito mostra Produto/Preço/Comentário.
3. **⚠️ Observar:** o campo "Preço Unitário" vem vazio. **Hoje não há auto-preenchimento do Thesys** (S1.6 vai consertar).
4. Anotar: "Para 5 itens preenchi preço manualmente (tempo: X segundos)."
5. Ir até o ERP Thesys em outra aba ou perguntar ao Thanner/Gabriel um preço de teste.
6. Voltar e digitar preço (ex: `45,90`).
7. Clicar **"Salvar"** para cada item.

### 3.2 Tentar enviar a cotação (vai bloquear se algo estiver pendente)

1. Rolar até **"Enviar Cotação para Bionexo"**.
2. Preencher: Data (hoje), Validade (7), Condição Pagamento (deixar default), Prazo Entrega (3), Frete CIF.
3. Olhar se aparecem avisos amarelos no topo:
   - ⚠️ "Existem itens Não Analisado" → precisa classificar todos.
   - ⚠️ "Itens Interessante sem código interno" → precisa parear todos os interessantes.
4. Resolver os bloqueios (classificar/parear o que falta).
5. Clicar **"Enviar Cotação"** (botão verde).
6. ✅ Esperado: mensagem de sucesso. Status muda para **"Cotação Enviada"** (âmbar).

### 3.3 Validar SyncLog

1. Menu lateral → **Logs de Sync**.
2. ✅ Esperado: linha `WHS / OUT / SUCESSO` com `processadas` igual ao número de itens enviados.
3. ❌ Se aparecer ERRO: anotar mensagem completa.

### 3.4 ⚠️ NOVO — Validar integração com Thesys (vai falhar, é o S1.9)

1. Em outra aba ou via SSH no servidor onde o Thesys roda, perguntar ao Thanner/Gabriel:
   > "A cotação Bionexo #{cotacaoId} chegou no Thesys?"
2. **❌ Esperado: NÃO chegou.** O endpoint `POST /bionexo/cotacao` no Thesys existe no service mas nunca é chamado pelo nosso fluxo.
3. **Anotar:** "Após enviar para Bionexo, a cotação NÃO chegou no Thesys. S1.9 vai consertar."

---

## ETAPA 4 — Atualizar status e pedidos (10 min)

### 4.1 Sincronizar status

1. Menu lateral → **Cotações**.
2. Clicar **"Atualizar Bionexo"** (botão outline).
3. ✅ Esperado: backend executa WGA + WJG + WKN. Mensagem de sucesso.
4. **Anotar:** quantas cotações mudaram de status.

### 4.2 Verificar Logs

1. Menu lateral → **Logs de Sync**.
2. ✅ Esperado: linhas `WGA / IN / SUCESSO`, `WJG / IN / SUCESSO|VAZIO`, `WKN / IN / ?`.
3. **Anotar** mensagens de cada uma.

### 4.3 Pedidos confirmados

1. Menu lateral → **Pedidos**.
2. Se alguma cotação que enviamos foi aceita pelo hospital, deve aparecer aqui.
3. ✅ Conferir colunas: Pedido Bionexo, Hospital, Valor, Status.
4. Se vazio: ok, hospital ainda não respondeu. Não é bug.

---

## ETAPA 5 — Capturar baseline final (5 min)

> Estes números são o "antes" para medir o ROI do Sprint 1. **Anotar todos.**

| Métrica | Valor |
|---|---|
| Cotações novas baixadas (Etapa 1.1) | _____ |
| Itens amarelos esperados-virassem-coloridos (Etapa 1.2) | _____ |
| Tempo para classificar 10 itens manualmente (Etapa 1.5) | _____ s |
| Tempo para parear 5 itens manualmente (Etapa 2.5) | _____ s |
| Tempo para preencher preço de 5 itens (Etapa 3.1) | _____ s |
| Tempo total da Etapa 3 (preço+envio) | _____ s |
| Bug crítico #1 confirmado? (Aprender não auto-aplica) | sim / não |
| Bug crítico #2 confirmado? (qtdAproximada random) | sim / não |
| Bug crítico #3 confirmado? (mock fallback silencioso) | sim / não |
| Bug crítico #4 confirmado? (erro De-Para silenciado) | sim / não |
| S1.9 confirmado? (cotação NÃO chega no Thesys) | sim / não |
| Campos extra descobertos no XML WGG (Etapa 0.5) | _____ |

---

## Critérios de aprovação do teste

- ✅ Login funciona.
- ✅ Conexão Bionexo OK (8 passos verdes).
- ✅ Conexão Thesys OK.
- ✅ Recebimento de cotações funciona (`WGG` retorna XML válido).
- ✅ Classificação manual funciona.
- ✅ Pareamento funciona (mesmo se não persistir no De-Para).
- ✅ Envio para Bionexo funciona (`WHS OUT SUCESSO`).
- ✅ Atualização de status funciona (`WGA/WJG/WKN`).
- ⚠️ Bugs críticos #1-#4 + S1.9 documentados (esperado: todos confirmados; isso é OK porque vão ser consertados no Sprint 1).
- ❌ Travamentos com erro 500 ou 401 persistente: parar e abrir issue.

---

## Como reportar problemas

1. **Anotar:** etapa, número do passo, comportamento esperado vs real.
2. **Captura de tela** se for bug visual.
3. **Log do backend:** `docker compose logs --tail=100 backend > /tmp/bug-XXX.log`.
4. **Log do navegador:** F12 → Console → copiar erros vermelhos.
5. **Mandar para Otávio** com tudo isso anexado. Otávio decide se vira issue ou se entra no escopo do Sprint 1.

---

## Próximos passos depois deste manual

Com a baseline coletada, Otávio aprova o **Sprint 1** (`~/.claude/plans/sprint1-quick-wins.md`). Após Sprint 1 executado, **rodar este mesmo manual de novo** para comparar números e validar que os bugs foram consertados. Esse "antes vs depois" é o ROI do BLOCO 1.

---

*Manual gerado em 2026-04-07 para homologação pré-Sprint-1 do BLOCO 1 (Portal Thesys-Bionexo).*
