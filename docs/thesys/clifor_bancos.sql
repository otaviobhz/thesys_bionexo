USE [THESYS_PRODUCAO]
GO

/****** Object:  Table [dbo].[CliFor_Bancos]    Script Date: 05/02/2026 12:26:55 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[CliFor_Bancos](
	[id_banco_seq] [int] IDENTITY(1,1) NOT NULL,
	[id_banco] [int] NOT NULL,
	[id_clifor] [int] NOT NULL,
	[cod_banco] [varchar](50) NULL,
	[num_agencia] [varchar](50) NULL,
	[num_conta] [varchar](50) NULL,
	[nome] [varchar](50) NULL,
	[pessoa] [char](1) NULL,
	[cnpj] [varchar](20) NULL,
	[cpf] [varchar](20) NULL,
	[incl_data] [datetime] NULL,
	[incl_user] [varchar](10) NULL,
	[incl_device] [varchar](30) NULL,
	[modi_data] [datetime] NULL,
	[modi_user] [varchar](10) NULL,
	[modi_device] [varchar](30) NULL,
	[excl_data] [datetime] NULL,
	[excl_user] [varchar](10) NULL,
	[excl_device] [varchar](30) NULL,
	[dv_agencia] [varchar](5) NULL,
	[dv_conta] [varchar](5) NULL,
	[Pk] [varchar](40) NULL,
	[Conta_Padrao] [char](1) NULL,
 CONSTRAINT [PK_clifor_bancos_1] PRIMARY KEY CLUSTERED 
(
	[id_banco_seq] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[CliFor_Bancos]  WITH CHECK ADD  CONSTRAINT [FK_CliFor_Bancos_id_Banco] FOREIGN KEY([id_banco])
REFERENCES [dbo].[Bancos] ([id_banco])
GO

ALTER TABLE [dbo].[CliFor_Bancos] CHECK CONSTRAINT [FK_CliFor_Bancos_id_Banco]
GO

ALTER TABLE [dbo].[CliFor_Bancos]  WITH CHECK ADD  CONSTRAINT [FK_CliFor_Bancos_id_clifor] FOREIGN KEY([id_clifor])
REFERENCES [dbo].[CliFor] ([cod_clifor])
GO

ALTER TABLE [dbo].[CliFor_Bancos] CHECK CONSTRAINT [FK_CliFor_Bancos_id_clifor]
GO

ALTER TABLE [dbo].[CliFor_Bancos]  WITH CHECK ADD  CONSTRAINT [CHK_Conta_Padrao] CHECK  (([Conta_Padrao]='N' OR [Conta_Padrao]='S'))
GO

ALTER TABLE [dbo].[CliFor_Bancos] CHECK CONSTRAINT [CHK_Conta_Padrao]
GO

