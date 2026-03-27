USE [THESYS_PRODUCAO]
GO

/****** Object:  Table [dbo].[CliFor_Contatos]    Script Date: 05/02/2026 12:27:40 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[CliFor_Contatos](
	[id_clifor_contatos] [int] IDENTITY(1,1) NOT NULL,
	[cod_clifor] [int] NULL,
	[nome] [varchar](50) NULL,
	[area] [varchar](20) NULL,
	[telefone2] [varchar](20) NULL,
	[cargo] [varchar](25) NULL,
	[telefone1] [varchar](20) NULL,
	[email] [varchar](300) NULL,
	[dt_nascto] [datetime] NULL,
	[obs] [varchar](8000) NULL,
	[email_pedcom] [varchar](1) NULL,
	[email_pedven] [varchar](1) NULL,
	[email_emisnf] [varchar](1) NULL,
	[dt_change] [datetime] NULL,
	[cpf] [varchar](14) NULL,
	[email_boleto] [varchar](1) NULL,
	[sequencia] [int] NULL,
	[email_marketing] [varchar](1) NULL,
	[email_chamado] [varchar](1) NULL,
	[email_cte] [varchar](1) NULL,
	[tipo_contato_contrato] [varchar](1) NULL,
	[codigo_controleterceiro] [varchar](40) NULL,
	[ativo] [varchar](1) NULL,
	[motivo_bloqueio] [varchar](30) NULL,
	[email_senha] [varchar](1) NULL,
	[dt_cadastro] [datetime] NULL,
	[cod_usuario_mbm] [varchar](10) NULL,
	[cripto] [varchar](1) NULL,
	[incl_data] [datetime] NULL,
	[incl_user] [varchar](10) NULL,
	[incl_device] [varchar](30) NULL,
	[modi_data] [datetime] NULL,
	[modi_user] [varchar](10) NULL,
	[modi_device] [varchar](30) NULL,
	[excl_data] [datetime] NULL,
	[excl_user] [varchar](10) NULL,
	[excl_device] [varchar](30) NULL,
 CONSTRAINT [PK__clifor_c__24F18BC33BE713E5] PRIMARY KEY CLUSTERED 
(
	[id_clifor_contatos] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[CliFor_Contatos] ADD  CONSTRAINT [DF_CliFor_Contatos_email_pedcom]  DEFAULT ('N') FOR [email_pedcom]
GO

ALTER TABLE [dbo].[CliFor_Contatos] ADD  CONSTRAINT [DF_CliFor_Contatos_ativo]  DEFAULT ('N') FOR [ativo]
GO

ALTER TABLE [dbo].[CliFor_Contatos]  WITH CHECK ADD  CONSTRAINT [FK__clifor_co__cod_c__4CAB505A] FOREIGN KEY([cod_clifor])
REFERENCES [dbo].[CliFor] ([cod_clifor])
GO

ALTER TABLE [dbo].[CliFor_Contatos] CHECK CONSTRAINT [FK__clifor_co__cod_c__4CAB505A]
GO

