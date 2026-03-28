-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('MASTER', 'OPERADOR');

-- CreateEnum
CREATE TYPE "CotacaoStatus" AS ENUM ('RECEBIDO', 'PAREADO', 'COTACAO_ENVIADA', 'EM_ANALISE', 'ACEITA', 'PEDIDO_GERADO', 'ADQUIRIDO_OUTRA', 'CANCELADO');

-- CreateEnum
CREATE TYPE "CategoriaItem" AS ENUM ('NAO_ANALISADO', 'INTERESSANTE', 'COTADO', 'DESCARTADO');

-- CreateEnum
CREATE TYPE "AcaoKeyword" AS ENUM ('INTERESSANTE', 'DESCARTAR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL DEFAULT 'OPERADOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cotacao" (
    "id" TEXT NOT NULL,
    "bionexoId" INTEGER NOT NULL,
    "tituloPdc" TEXT,
    "cnpjHospital" TEXT NOT NULL,
    "nomeHospital" TEXT NOT NULL,
    "ufHospital" TEXT NOT NULL,
    "cidadeHospital" TEXT NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "horaVencimento" TEXT NOT NULL,
    "idFormaPagamento" INTEGER,
    "formaPagamento" TEXT,
    "contato" TEXT,
    "observacaoComprador" TEXT,
    "termos" TEXT,
    "status" "CotacaoStatus" NOT NULL DEFAULT 'RECEBIDO',
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cotacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CotacaoItem" (
    "id" TEXT NOT NULL,
    "cotacaoId" TEXT NOT NULL,
    "sequencia" INTEGER NOT NULL,
    "idArtigo" INTEGER NOT NULL,
    "descricaoBionexo" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "unidadeMedida" TEXT NOT NULL,
    "idUnidadeMedida" INTEGER,
    "marcaFavorita" TEXT,
    "codigoProduto" TEXT,
    "marcas" TEXT,
    "formaPagamento" TEXT,
    "categoria" "CategoriaItem" NOT NULL DEFAULT 'NAO_ANALISADO',
    "codigoInterno" TEXT,
    "descricaoInterna" TEXT,
    "precoUnitario" DOUBLE PRECISION,
    "comentario" TEXT,
    "observacaoFornecedor" TEXT,
    "catComercial" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CotacaoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapeamentoSku" (
    "id" TEXT NOT NULL,
    "descricaoComprador" TEXT NOT NULL,
    "skuThesys" TEXT NOT NULL,
    "descricaoInterna" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MapeamentoSku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegraPalavraChave" (
    "id" TEXT NOT NULL,
    "palavraChave" TEXT NOT NULL,
    "acaoAutomatica" "AcaoKeyword" NOT NULL,
    "matches" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegraPalavraChave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "idPdc" INTEGER NOT NULL,
    "idConfirmacao" INTEGER NOT NULL,
    "idArtigo" INTEGER NOT NULL,
    "codigoProduto" TEXT,
    "descricaoProduto" TEXT,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "unidadeMedida" TEXT,
    "fabricante" TEXT,
    "nomeHospital" TEXT NOT NULL,
    "cnpjHospital" TEXT NOT NULL,
    "contato" TEXT,
    "formaPagamento" TEXT,
    "enderecoEntrega" TEXT,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "operacao" TEXT NOT NULL,
    "direcao" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "mensagem" TEXT,
    "processadas" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BionexoConfig" (
    "id" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "wsdlUrl" TEXT NOT NULL DEFAULT 'https://ws-bionexo-sandbox.bionexo.com/ws2/BionexoBean?wsdl',
    "ambiente" TEXT NOT NULL DEFAULT 'SANDBOX',
    "pollingInterval" INTEGER NOT NULL DEFAULT 5,
    "botAtivo" BOOLEAN NOT NULL DEFAULT false,
    "ultimoToken" TEXT DEFAULT '0',

    CONSTRAINT "BionexoConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThesysConfig" (
    "id" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "authToken" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ThesysConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cotacao_bionexoId_key" ON "Cotacao"("bionexoId");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_idConfirmacao_key" ON "Pedido"("idConfirmacao");

-- AddForeignKey
ALTER TABLE "CotacaoItem" ADD CONSTRAINT "CotacaoItem_cotacaoId_fkey" FOREIGN KEY ("cotacaoId") REFERENCES "Cotacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
