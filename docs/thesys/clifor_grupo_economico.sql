USE [THESYS_PRODUCAO]
GO

/****** Object:  Table [dbo].[Clifor_Grupo_Economico]    Script Date: 05/02/2026 12:27:56 ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[Clifor_Grupo_Economico](
	[Id_CliGr_Economico] [int] IDENTITY(1,1) NOT NULL,
	[Raiz_Cnpj] [varchar](8) NULL,
	[NomeGrupo] [varchar](100) NOT NULL,
	[Id_Cli_Seg] [int] NULL,
	[Sigla] [varchar](10) NULL,
	[COD_CLIFOR] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[Id_CliGr_Economico] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[Clifor_Grupo_Economico]  WITH CHECK ADD  CONSTRAINT [FK_Clifor_Grupo_Economico_CliforSegmentos] FOREIGN KEY([Id_Cli_Seg])
REFERENCES [dbo].[Clifor_Segmentos] ([Id_Cli_Seg])
GO

ALTER TABLE [dbo].[Clifor_Grupo_Economico] CHECK CONSTRAINT [FK_Clifor_Grupo_Economico_CliforSegmentos]
GO

