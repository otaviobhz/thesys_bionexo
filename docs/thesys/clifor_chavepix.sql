USE [THESYS_PRODUCAO]
GO

/****** Object:  Table [dbo].[CliFor_ChavePix]    Script Date: 05/02/2026 12:27:25 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[CliFor_ChavePix](
	[id_chavepix] [int] IDENTITY(1,1) NOT NULL,
	[id_clifor] [int] NOT NULL,
	[id_banco] [int] NULL,
	[tipo_chave] [varchar](30) NULL,
	[tel_celular] [nvarchar](20) NULL,
	[email] [nvarchar](77) NULL,
	[cpfcnpj] [nvarchar](18) NULL,
	[chave_aleatoria] [nvarchar](36) NULL,
	[incl_data] [datetime] NULL,
	[incl_user] [varchar](10) NULL,
	[incl_device] [varchar](30) NULL,
	[modi_data] [datetime] NULL,
	[modi_user] [varchar](10) NULL,
	[modi_device] [varchar](30) NULL,
	[excl_data] [datetime] NULL,
	[excl_user] [varchar](10) NULL,
	[excl_device] [varchar](30) NULL,
	[Pk] [varchar](10) NULL,
 CONSTRAINT [PK__CliFor_C__437FDFF9207ABE40] PRIMARY KEY CLUSTERED 
(
	[id_chavepix] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[CliFor_ChavePix]  WITH CHECK ADD  CONSTRAINT [FK_CliFor_ChavePix_Bancos] FOREIGN KEY([id_banco])
REFERENCES [dbo].[Bancos] ([id_banco])
GO

ALTER TABLE [dbo].[CliFor_ChavePix] CHECK CONSTRAINT [FK_CliFor_ChavePix_Bancos]
GO

ALTER TABLE [dbo].[CliFor_ChavePix]  WITH CHECK ADD  CONSTRAINT [FK_CliFor_ChavePix_CliFor] FOREIGN KEY([id_clifor])
REFERENCES [dbo].[CliFor] ([cod_clifor])
GO

ALTER TABLE [dbo].[CliFor_ChavePix] CHECK CONSTRAINT [FK_CliFor_ChavePix_CliFor]
GO

