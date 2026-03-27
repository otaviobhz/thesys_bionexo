USE [THESYS_PRODUCAO]
GO

/****** Object:  Table [dbo].[CliFor]    Script Date: 05/02/2026 12:26:40 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[CliFor](
	[cod_clifor] [int] IDENTITY(1,1) NOT NULL,
	[cod_cligrupo] [int] NULL,
	[razao] [varchar](100) NULL,
	[ativo] [varchar](1) NULL,
	[bairro] [varchar](60) NULL,
	[CODICIDADE] [int] NOT NULL,
	[fantasia] [varchar](100) NULL,
	[id_pais] [int] NOT NULL,
	[cod_atividade] [int] NOT NULL,
	[endereco] [varchar](60) NULL,
	[end_complemento] [varchar](200) NULL,
	[cod_tipologradouro] [varchar](10) NULL,
	[end_numero] [varchar](10) NULL,
	[cep] [varchar](10) NULL,
	[cliente] [varchar](1) NULL,
	[fornec] [varchar](1) NULL,
	[pessoa] [varchar](1) NULL,
	[transportadora] [varchar](1) NULL,
	[vendedor] [varchar](1) NULL,
	[cnpj] [varchar](25) NULL,
	[cpf] [varchar](20) NULL,
	[rg] [varchar](40) NULL,
	[ie] [varchar](20) NULL,
	[insmunicipal] [varchar](20) NULL,
	[telefone1] [varchar](50) NULL,
	[telefone2] [varchar](20) NULL,
	[celular] [varchar](20) NULL,
	[fax] [varchar](20) NULL,
	[cxpostal] [varchar](15) NULL,
	[web] [varchar](150) NULL,
	[email] [varchar](255) NULL,
	[dt_abertura] [datetime] NULL,
	[porte] [varchar](20) NULL,
	[dt_nascto] [datetime] NULL,
	[suframa] [varchar](20) NULL,
	[contribuinte] [varchar](1) NULL,
	[retencao_iss] [varchar](1) NULL,
	[aliquota_iss] [numeric](15, 6) NULL,
	[prospect] [varchar](1) NULL,
	[inscricao_produtorrural] [varchar](20) NULL,
	[emitir_cartacobranca] [varchar](1) NULL,
	[optante_sn] [varchar](1) NULL,
	[ie_nao_contribuinte] [varchar](14) NULL,
	[alccompras_permitealtfornec] [varchar](1) NULL,
	[end_latitude] [numeric](10, 6) NULL,
	[end_longitude] [numeric](10, 6) NULL,
	[situacao_credito] [varchar](1) NULL,
	[consentimento_lgpd] [varchar](1) NULL,
	[obs] [varchar](max) NULL,
	[CODIUF] [int] NOT NULL,
	[CODIBANCO] [int] NULL,
	[RFBTipoMatrizFilial] [varchar](10) NULL,
	[RFBPorteEmpresa] [varchar](10) NULL,
	[RFBCNAEPrincipal] [varchar](150) NULL,
	[RFBCNAESecundarios] [varchar](max) NULL,
	[RFBSituacao] [varchar](50) NULL,
	[RBFDataSituacaoCadastral] [datetime] NULL,
	[RFBMotivoSituacaoCadastral] [varchar](150) NULL,
	[RFBSituacaoEspecial] [varchar](50) NULL,
	[RFBDataSituacaoEspecial] [datetime] NULL,
	[RFBNaturezaJuridica] [varchar](150) NULL,
	[RFBDataHoraConsulta] [datetime] NULL,
	[RFBEnteFederativoResponsavel] [varchar](150) NULL,
	[prestador_interno] [varchar](1) NULL,
	[armadores] [varchar](1) NULL,
	[recinto_alfandegado] [varchar](1) NULL,
	[cod_recinto_alf] [int] NULL,
	[despachantes] [varchar](1) NULL,
	[id_reprvend] [int] NULL,
	[id_transp_padrao] [int] NULL,
	[taxa_spread] [numeric](15, 6) NULL,
	[id_usuario] [int] NULL,
	[id_condicao_pagamento] [int] NULL,
	[id_tabela_padrao_forma_pagamento] [int] NULL,
	[id_portador_cp] [int] NULL,
	[id_portador_cr] [int] NULL,
	[vlr_limite_credito] [numeric](16, 2) NULL,
	[validade_limite_credito] [datetime] NULL,
	[validade_consulta_credito] [datetime] NULL,
	[situacao_consulta_credito] [varchar](50) NULL,
	[dias_bloq_cliente_atraso] [int] NULL,
	[restricao_venda] [varchar](255) NULL,
	[incl_data] [datetime] NULL,
	[incl_user] [varchar](10) NULL,
	[incl_device] [varchar](30) NULL,
	[modi_data] [datetime] NULL,
	[modi_user] [varchar](10) NULL,
	[modi_device] [varchar](30) NULL,
	[excl_data] [nchar](20) NULL,
	[excl_user] [varchar](10) NULL,
	[excl_device] [varchar](30) NULL,
	[id_tipo_frete] [int] NULL,
	[dias_validade_consulta_credito] [int] NULL,
	[check_licencas_para_vendas] [varchar](1) NULL,
	[validade_licenca_pf] [date] NULL,
	[validade_vistoria_pc] [date] NULL,
	[validade_licenca_pc] [date] NULL,
	[industrializacao_por_encomenda] [varchar](1) NULL,
	[data_analise] [date] NULL,
	[Id_Cli_Seg] [int] NULL,
	[Raiz_Cnpj] [varchar](8) NULL,
	[CNPJ_Numerico]  AS ([dbo].[Fn_Limpa_NoNum]([cnpj])) PERSISTED,
	[id_plano] [int] NULL,
	[id_centro_custo] [int] NULL,
	[acumulador] [int] NULL,
	[cod_clifor_matriz_pagamento] [int] NULL,
	[id_deposito_terceiro] [int] NULL,
	[obs_pedido_venda] [varchar](255) NULL,
	[dt_analise_segmento] [date] NULL,
	[INFORMACODITEM_CLIFOR] [char](1) NULL,
	[id_tp_tipoportadormandatorio] [int] NULL,
	[agente_carga] [char](1) NULL,
 CONSTRAINT [PK__clifor__0EE4369E2EB9010A] PRIMARY KEY CLUSTERED 
(
	[cod_clifor] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[CliFor] ADD  CONSTRAINT [DF_clifor_cod_atividade]  DEFAULT ((0)) FOR [cod_atividade]
GO

ALTER TABLE [dbo].[CliFor] ADD  CONSTRAINT [DF_clifor_endereco]  DEFAULT (NULL) FOR [endereco]
GO

ALTER TABLE [dbo].[CliFor] ADD  CONSTRAINT [DF_clifor_cep]  DEFAULT ('00000-000') FOR [cep]
GO

ALTER TABLE [dbo].[CliFor] ADD  CONSTRAINT [DF_clifor_cliente]  DEFAULT ('N') FOR [cliente]
GO

ALTER TABLE [dbo].[CliFor] ADD  CONSTRAINT [DF_clifor_fornec]  DEFAULT ('N') FOR [fornec]
GO

ALTER TABLE [dbo].[CliFor] ADD  CONSTRAINT [DF_clifor_pessoa]  DEFAULT (NULL) FOR [pessoa]
GO

ALTER TABLE [dbo].[CliFor] ADD  CONSTRAINT [transportadora_valor]  DEFAULT ('0') FOR [transportadora]
GO

ALTER TABLE [dbo].[CliFor] ADD  CONSTRAINT [DF_clifor_contribuinte]  DEFAULT ('N') FOR [contribuinte]
GO

ALTER TABLE [dbo].[CliFor] ADD  CONSTRAINT [DF_clifor_retencao_iss]  DEFAULT ('N') FOR [retencao_iss]
GO

ALTER TABLE [dbo].[CliFor] ADD  CONSTRAINT [aliq_iss_valor]  DEFAULT ((0)) FOR [aliquota_iss]
GO

ALTER TABLE [dbo].[CliFor] ADD  CONSTRAINT [DF_clifor_prospect]  DEFAULT ('N') FOR [prospect]
GO

ALTER TABLE [dbo].[CliFor] ADD  CONSTRAINT [DF_clifor_inscricao_produtorrural]  DEFAULT ('00000000000000000000') FOR [inscricao_produtorrural]
GO

ALTER TABLE [dbo].[CliFor] ADD  CONSTRAINT [DF_clifor_emitir_cartacobranca]  DEFAULT ('N') FOR [emitir_cartacobranca]
GO

ALTER TABLE [dbo].[CliFor] ADD  CONSTRAINT [DF_clifor_optante_sn]  DEFAULT ('N') FOR [optante_sn]
GO

ALTER TABLE [dbo].[CliFor] ADD  CONSTRAINT [DF_clifor_alccompras_permitealtfornec]  DEFAULT ('N') FOR [alccompras_permitealtfornec]
GO

ALTER TABLE [dbo].[CliFor] ADD  CONSTRAINT [DF_clifor_consentimento_lgpd]  DEFAULT ('N') FOR [consentimento_lgpd]
GO

ALTER TABLE [dbo].[CliFor]  WITH CHECK ADD FOREIGN KEY([id_centro_custo])
REFERENCES [dbo].[Centro_Custo] ([id_centro_custo])
GO

ALTER TABLE [dbo].[CliFor]  WITH CHECK ADD FOREIGN KEY([id_plano])
REFERENCES [dbo].[Plano_Contas] ([Id_Plano])
GO

ALTER TABLE [dbo].[CliFor]  WITH CHECK ADD  CONSTRAINT [fk_atividade_clifor] FOREIGN KEY([cod_atividade])
REFERENCES [dbo].[Atividades] ([cod_atividade])
GO

ALTER TABLE [dbo].[CliFor] CHECK CONSTRAINT [fk_atividade_clifor]
GO

ALTER TABLE [dbo].[CliFor]  WITH CHECK ADD  CONSTRAINT [fk_bancos_clifor] FOREIGN KEY([CODIBANCO])
REFERENCES [dbo].[Bancos] ([id_banco])
GO

ALTER TABLE [dbo].[CliFor] CHECK CONSTRAINT [fk_bancos_clifor]
GO

ALTER TABLE [dbo].[CliFor]  WITH CHECK ADD  CONSTRAINT [FK_Clifor_CliforSegmentos] FOREIGN KEY([Id_Cli_Seg])
REFERENCES [dbo].[Clifor_Segmentos] ([Id_Cli_Seg])
GO

ALTER TABLE [dbo].[CliFor] CHECK CONSTRAINT [FK_Clifor_CliforSegmentos]
GO

ALTER TABLE [dbo].[CliFor]  WITH CHECK ADD  CONSTRAINT [FK_codicidade_Clifor_cidades] FOREIGN KEY([CODICIDADE])
REFERENCES [dbo].[Cidades] ([CODIGO])
GO

ALTER TABLE [dbo].[CliFor] CHECK CONSTRAINT [FK_codicidade_Clifor_cidades]
GO

ALTER TABLE [dbo].[CliFor]  WITH CHECK ADD  CONSTRAINT [FK_CodUF_Clifor_UFS] FOREIGN KEY([CODIUF])
REFERENCES [dbo].[UFS] ([CODIGO])
GO

ALTER TABLE [dbo].[CliFor] CHECK CONSTRAINT [FK_CodUF_Clifor_UFS]
GO

ALTER TABLE [dbo].[CliFor]  WITH CHECK ADD  CONSTRAINT [fk_forma_pagto_clifor] FOREIGN KEY([id_tabela_padrao_forma_pagamento])
REFERENCES [dbo].[Tabela_Padrao] ([id_tabela_padrao])
GO

ALTER TABLE [dbo].[CliFor] CHECK CONSTRAINT [fk_forma_pagto_clifor]
GO

ALTER TABLE [dbo].[CliFor]  WITH CHECK ADD  CONSTRAINT [FK_Grupo_Clientes_Clifor] FOREIGN KEY([cod_cligrupo])
REFERENCES [dbo].[Grupo_Clientes] ([id_grupo_cliente])
GO

ALTER TABLE [dbo].[CliFor] CHECK CONSTRAINT [FK_Grupo_Clientes_Clifor]
GO

ALTER TABLE [dbo].[CliFor]  WITH CHECK ADD  CONSTRAINT [FK_id_portador_cp_portadores] FOREIGN KEY([id_portador_cp])
REFERENCES [dbo].[Portadores] ([Id_Portador])
GO

ALTER TABLE [dbo].[CliFor] CHECK CONSTRAINT [FK_id_portador_cp_portadores]
GO

ALTER TABLE [dbo].[CliFor]  WITH CHECK ADD  CONSTRAINT [FK_id_portador_cr_portadores] FOREIGN KEY([id_portador_cr])
REFERENCES [dbo].[Portadores] ([Id_Portador])
GO

ALTER TABLE [dbo].[CliFor] CHECK CONSTRAINT [FK_id_portador_cr_portadores]
GO

ALTER TABLE [dbo].[CliFor]  WITH CHECK ADD  CONSTRAINT [FK_id_tipo_frete_Tipos_Frete] FOREIGN KEY([id_tipo_frete])
REFERENCES [dbo].[Tipos_Frete] ([id_tipo_frete])
GO

ALTER TABLE [dbo].[CliFor] CHECK CONSTRAINT [FK_id_tipo_frete_Tipos_Frete]
GO

ALTER TABLE [dbo].[CliFor]  WITH CHECK ADD  CONSTRAINT [fk_pagto_cond_clifor] FOREIGN KEY([id_condicao_pagamento])
REFERENCES [dbo].[Pagamentos_Condicoes] ([id_pagamento_condicao])
GO

ALTER TABLE [dbo].[CliFor] CHECK CONSTRAINT [fk_pagto_cond_clifor]
GO

ALTER TABLE [dbo].[CliFor]  WITH CHECK ADD  CONSTRAINT [FK_Paises_Clifor] FOREIGN KEY([id_pais])
REFERENCES [dbo].[Paises] ([id_pais])
GO

ALTER TABLE [dbo].[CliFor] CHECK CONSTRAINT [FK_Paises_Clifor]
GO

