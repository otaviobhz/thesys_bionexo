-- ============================================================================
-- QUERIES PARA API THESYS → PORTAL BIONEXO
-- Estas queries devem ser expostas pelo time Thanner/Gabriel via API REST
-- Database: THESYS_PRODUCAO (SQL Server)
-- ============================================================================


-- ============================================================================
-- 1. PRODUTOS (ITENS) — Cadastro completo de SKUs ativos
-- Endpoint: GET /api/thesys/itens
-- Uso: Pareamento de produtos Bionexo → SKU interno
-- ============================================================================

SELECT
    i.Id_Item                   AS id,
    i.Codigo                    AS sku,              -- "Código Interno" na grid
    i.descricao                 AS descricao,        -- "Descrição SControl/Interna" na grid
    i.descricao_completa        AS descricao_completa,
    i.desc_nfiscal              AS descricao_nf,
    i.ativo                     AS ativo,
    i.tipo_produto              AS tipo_produto,     -- M=Mercadoria, S=Serviço, etc.
    i.preco_reposicao           AS preco_reposicao,
    i.custo_medio               AS custo_medio,
    i.custo_standard            AS custo_standard,
    i.peso_bruto                AS peso_bruto,
    i.peso_liquido              AS peso_liquido,
    i.controla_lote             AS controla_lote,
    i.controla_estoque          AS controla_estoque,
    i.controla_validade         AS controla_validade,
    i.comprado_fabricado        AS comprado_fabricado,
    u.id_unidade                AS unidade_id,
    u.codigo                    AS unidade_codigo,   -- UN, CX, PCT, RL, etc.
    u.descricao                 AS unidade_descricao,
    i.id_grupo_estoque          AS id_grupo,
    i.id_subgrupo_estoque       AS id_subgrupo,
    i.id_familia_comercial      AS id_familia_comercial,
    i.id_clasfisc               AS id_classificacao_fiscal,
    i.dt_inclusao               AS data_cadastro
FROM Itens i
LEFT JOIN Unidades u ON u.id_unidade = i.id_unidade
WHERE i.ativo = 'S'
  AND i.excl_data IS NULL
ORDER BY i.Codigo;


-- ============================================================================
-- 2. BUSCA DE PRODUTO POR SKU OU DESCRIÇÃO
-- Endpoint: GET /api/thesys/itens?search=seringa
-- Uso: Autocomplete no modal de Pareamento
-- ============================================================================

SELECT
    i.Id_Item                   AS id,
    i.Codigo                    AS sku,
    i.descricao                 AS descricao,
    i.descricao_completa        AS descricao_completa,
    u.codigo                    AS unidade_codigo,
    i.preco_reposicao           AS preco_reposicao,
    i.custo_medio               AS custo_medio
FROM Itens i
LEFT JOIN Unidades u ON u.id_unidade = i.id_unidade
WHERE i.ativo = 'S'
  AND i.excl_data IS NULL
  AND (
    i.Codigo LIKE '%@search%'
    OR i.descricao LIKE '%@search%'
    OR i.descricao_completa LIKE '%@search%'
  )
ORDER BY
    CASE WHEN i.Codigo = '@search' THEN 0
         WHEN i.Codigo LIKE '@search%' THEN 1
         ELSE 2 END,
    i.Codigo;


-- ============================================================================
-- 3. PRODUTO POR ID
-- Endpoint: GET /api/thesys/itens/:id
-- Uso: Detalhe completo de um produto específico
-- ============================================================================

SELECT
    i.Id_Item                   AS id,
    i.Codigo                    AS sku,
    i.descricao                 AS descricao,
    i.descricao_completa        AS descricao_completa,
    i.desc_nfiscal              AS descricao_nf,
    i.ativo                     AS ativo,
    i.tipo_produto              AS tipo_produto,
    i.preco_reposicao           AS preco_reposicao,
    i.custo_medio               AS custo_medio,
    i.custo_standard            AS custo_standard,
    i.peso_bruto                AS peso_bruto,
    i.peso_liquido              AS peso_liquido,
    u.codigo                    AS unidade_codigo,
    u.descricao                 AS unidade_descricao,
    i.id_grupo_estoque          AS id_grupo,
    i.id_subgrupo_estoque       AS id_subgrupo,
    i.id_familia_comercial      AS id_familia_comercial,
    i.id_clasfisc               AS id_classificacao_fiscal,
    i.controla_lote             AS controla_lote,
    i.controla_estoque          AS controla_estoque,
    i.obs_pedido_venda          AS obs_pedido_venda,
    i.dt_inclusao               AS data_cadastro
FROM Itens i
LEFT JOIN Unidades u ON u.id_unidade = i.id_unidade
WHERE i.Id_Item = @id;


-- ============================================================================
-- 4. TABELAS DE PREÇO (Compras_Precos → futuro: Preço_Vendas)
-- Endpoint: GET /api/thesys/precos
-- Uso: Listar tabelas de preço disponíveis
-- NOTA: Tabela deve ser renomeada de Compras_Precos para Preço_Vendas
-- ============================================================================

SELECT
    cp.id_compra_preco          AS id_tabela,
    cp.nome_tabela_compras      AS nome_tabela,
    cp.dt_inicio                AS data_inicio,
    cf.razao                    AS fornecedor_razao,
    cf.fantasia                 AS fornecedor_fantasia
FROM Compras_Precos cp
LEFT JOIN CliFor cf ON cf.cod_clifor = cp.id_clifor
WHERE cp.excl_data IS NULL
ORDER BY cp.dt_inicio DESC;


-- ============================================================================
-- 5. ITENS DE UMA TABELA DE PREÇO
-- Endpoint: GET /api/thesys/precos/:idTabela/itens
-- Uso: Buscar preços para cotação
-- ============================================================================

SELECT
    cpi.id_compra_preco_item    AS id_item_preco,
    cpi.id_item                 AS id_item,
    i.Codigo                    AS sku,
    i.descricao                 AS descricao_item,
    u.codigo                    AS unidade,
    cpi.preco                   AS preco
FROM Compras_Precos_Itens cpi
JOIN Itens i ON i.Id_Item = cpi.id_item
LEFT JOIN Unidades u ON u.id_unidade = i.id_unidade
WHERE cpi.id_compra_preco = @idTabela
  AND cpi.excl_data IS NULL
ORDER BY i.Codigo;


-- ============================================================================
-- 6. HOSPITAIS (CliFor com flag hospital = 'S')
-- Endpoint: GET /api/thesys/hospitais
-- Uso: Cache de dados cadastrais dos compradores
-- ============================================================================

SELECT
    c.cod_clifor                AS id,
    c.razao                     AS razao_social,
    c.fantasia                  AS nome_fantasia,
    c.cnpj                      AS cnpj,
    c.endereco                  AS endereco,
    c.bairro                    AS bairro,
    c.cep                       AS cep,
    c.codiuf                    AS id_uf,
    c.codicidade                AS id_cidade,
    c.telefone1                 AS telefone,
    c.email                     AS email,
    c.ID_CONDICAO_PAGAMENTO     AS id_condicao_pagamento
FROM CliFor c
WHERE c.hospital = 'S'
  AND c.ativo = 'S'
  AND c.excl_data IS NULL
ORDER BY c.razao;


-- ============================================================================
-- 7. COTAÇÕES EXISTENTES (para verificar duplicidade)
-- Endpoint: GET /api/thesys/cotacoes?plataforma=BIONEXO
-- Uso: Verificar se cotação já existe no Thesys antes de criar
-- ============================================================================

SELECT
    vc.id_venda_cotacao         AS id,
    vc.numero                   AS numero,
    vc.cod_clifor               AS id_cliente,
    cf.razao                    AS cliente_razao,
    vc.dt_emissao               AS data_emissao,
    vc.id_status                AS id_status,
    sd.StatusDescricao          AS status_descricao,
    vc.id_plataforma            AS id_plataforma,
    vc.prazo_entrega            AS prazo_entrega,
    vc.fat_minimo               AS faturamento_minimo
FROM Vendas_Cotacoes vc
LEFT JOIN CliFor cf ON cf.cod_clifor = vc.cod_clifor
LEFT JOIN Status_Docs sd ON sd.StatusID = vc.id_status
WHERE vc.excl_data IS NULL
  AND vc.id_plataforma IS NOT NULL  -- Filtrar por plataforma Bionexo
ORDER BY vc.dt_emissao DESC;


-- ============================================================================
-- 8. INSERIR COTAÇÃO NO THESYS (após envio via Bionexo)
-- Endpoint: PUT /api/thesys/cotacao
-- Uso: Criar a cotação no ERP com os itens respondidos
-- ============================================================================

-- Header da cotação:
INSERT INTO Vendas_Cotacoes (
    numero, cod_clifor, id_pagamento_condicoes, dt_emissao,
    id_status, id_tipo, id_plataforma, prazo_entrega,
    fat_minimo, id_compra_preco,
    incl_user, incl_data, incl_device
) VALUES (
    @numero, @cod_clifor, @id_pagamento, GETDATE(),
    @id_status, @id_tipo, @id_plataforma_bionexo, @prazo_entrega,
    @fat_minimo, @id_tabela_preco,
    'PORTAL_BNX', GETDATE(), 'BIONEXO_PORTAL'
);

-- Itens da cotação:
INSERT INTO Vendas_Cotacoes_Itens (
    id_venda_cotacao, id_item, quantidade, preco_unitario,
    desconto, preco_fechado, total, id_status, observacao, ordem,
    incl_user, incl_data, incl_device
) VALUES (
    @id_venda_cotacao, @id_item, @quantidade, @preco_unitario,
    @desconto, @preco_fechado, @total, @id_status, @observacao, @ordem,
    'PORTAL_BNX', GETDATE(), 'BIONEXO_PORTAL'
);


-- ============================================================================
-- RESUMO DAS TABELAS UTILIZADAS
-- ============================================================================
-- Itens              → Cadastro de produtos (SKU, descrição, preço, unidade)
-- Unidades           → Unidades de medida (UN, CX, PCT, etc.)
-- Compras_Precos     → Tabelas de preço (header) — RENOMEAR para Preço_Vendas
-- Compras_Precos_Itens → Itens das tabelas de preço
-- CliFor             → Clientes/Hospitais (flag hospital='S')
-- Vendas_Cotacoes    → Cotações (header)
-- Vendas_Cotacoes_Itens → Itens das cotações
-- Status_Docs        → Status das cotações
-- Tabela_Padrao      → Tipos/categorias genéricas
