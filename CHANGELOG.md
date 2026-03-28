# Changelog — Portal Thesys-Bionexo

Toda alteração no código deve gerar uma nova entrada aqui com a data e versão.

O versionamento segue o formato: `vYYYY.MM.DD.HH.MM`

---

## v2026.03.28.22.30

### Alterações
- Favicon fixo como lightmode (T·B fundo claro) em todas as situações
- Bot Automático movido para lado direito da Integração Thesys (grid 2 colunas)
- Modal info (i) circular no padrão logmed (popup com overlay, não colapsável)

---

## v2026.03.28.22.07

### Novas funcionalidades
- Integração Bionexo EDI v3.14 completa (WGG, WHS, WJG, WGA, WKN)
- Parser XML corrigido para layout oficial (Pedidos.Pedido.Cabecalho)
- Raw SOAP call (bypass bug lib soap)
- Toggle Sandbox/Produção na tela Configurações
- Coroa (prioridade) e Prancheta (detalhe) funcionais
- Colunas novas: Cód. Comercial, Cód. Prod. Hosp, Qtd Emb, Produto Vinculado
- Logos dark/light mode (INTEGRAÇÃO THESYS · BIONEXO + favicon T·B)
- Editar palavras-chave funcional
- Export/Import XLSX (palavras-chave + de-para)
- Modal info (i) padrão logmed para formato importação
- Manual do usuário completo
- Documentação de análise e homologação

### Correções
- API URL dinâmica (window.location.hostname) para acesso ZeroTier
- CORS explícito + Docker ports 0.0.0.0
- Sem fallback mock (dados sempre da API real)
- Mensagens 503 centralizadas
- WJG (nome correto, era WIJ)
- useParams strict:false no detalhe cotação
- DATABASE_URL fix no Docker (.dockerignore)

---

## v2026.03.26.21.55 (deploy staging)

### Funcionalidades iniciais
- Frontend React 19 + Vite + TanStack Router
- Backend NestJS 11 + Prisma 7 + PostgreSQL 18
- Login JWT + 8 telas funcionais
- Integração Bionexo SOAP (WGG básico)
- Integração Thesys API (4 endpoints)
- Docker Compose (4 containers)
