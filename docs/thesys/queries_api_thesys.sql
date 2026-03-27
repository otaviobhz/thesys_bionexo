-- ============================================================================
-- QUERIES PARA API THESYS → PORTAL BIONEXO
-- Apenas campos estritamente necessários para o sistema
-- Database: THESYS_PRODUCAO (SQL Server)
-- ============================================================================


-- ============================================================================
-- 1. PRODUTOS ATIVOS (para pareamento e cotação)
-- Endpoint sugerido: GET /api/thesys/itens
-- ============================================================================

SELECT
    i.Id_Item       AS id,
    i.Codigo        AS sku,
    i.descricao     AS descricao,
    u.codigo        AS unidade
FROM Itens i
LEFT JOIN Unidades u ON u.id_unidade = i.id_unidade
WHERE i.ativo = 'S'
  AND i.excl_data IS NULL
ORDER BY i.Codigo;


-- ============================================================================
-- 2. BUSCA DE PRODUTO (autocomplete no modal de pareamento)
-- Endpoint sugerido: GET /api/thesys/itens?search=seringa
-- ============================================================================

SELECT
    i.Id_Item       AS id,
    i.Codigo        AS sku,
    i.descricao     AS descricao,
    u.codigo        AS unidade
FROM Itens i
LEFT JOIN Unidades u ON u.id_unidade = i.id_unidade
WHERE i.ativo = 'S'
  AND i.excl_data IS NULL
  AND (
    i.Codigo LIKE '%@search%'
    OR i.descricao LIKE '%@search%'
  )
ORDER BY i.Codigo;


-- ============================================================================
-- 3. PREÇO DO PRODUTO (para sugestão de preço na cotação)
-- Endpoint sugerido: GET /api/thesys/precos/:idTabela/itens
-- NOTA: Tabela Compras_Precos será renomeada para Preço_Vendas
-- ============================================================================

SELECT
    i.Codigo        AS sku,
    i.descricao     AS descricao,
    cpi.preco       AS preco
FROM Compras_Precos_Itens cpi
JOIN Itens i ON i.Id_Item = cpi.id_item
WHERE cpi.id_compra_preco = @idTabela
  AND cpi.excl_data IS NULL
ORDER BY i.Codigo;


-- ============================================================================
-- 4. HOSPITAIS ATIVOS (cache de compradores)
-- Endpoint sugerido: GET /api/thesys/hospitais
-- ============================================================================

SELECT
    c.cod_clifor    AS id,
    c.razao         AS razao_social,
    c.fantasia      AS nome_fantasia,
    c.cnpj          AS cnpj
FROM CliFor c
WHERE c.hospital = 'S'
  AND c.ativo = 'S'
  AND c.excl_data IS NULL
ORDER BY c.razao;
