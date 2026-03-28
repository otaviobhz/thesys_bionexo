import { PrismaClient, Perfil, CotacaoStatus, CategoriaItem, AcaoKeyword } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcrypt'

const connectionString = process.env.DATABASE_URL || 'postgresql://bionexo:bionexo_dev_2026@localhost:7432/thesys_bionexo'
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Admin user
  const hash = await bcrypt.hash('Admin123!', 10)
  await prisma.user.upsert({
    where: { email: 'admin@promeho.com.br' },
    update: {},
    create: {
      email: 'admin@promeho.com.br',
      passwordHash: hash,
      nome: 'Administrador PROMEHO',
      perfil: Perfil.MASTER,
    },
  })

  // Operador user
  const hashOp = await bcrypt.hash('Operador123!', 10)
  await prisma.user.upsert({
    where: { email: 'operador@promeho.com.br' },
    update: {},
    create: {
      email: 'operador@promeho.com.br',
      passwordHash: hashOp,
      nome: 'Operador Cotações',
      perfil: Perfil.OPERADOR,
    },
  })

  // Bionexo Config (sandbox default)
  const existingBnx = await prisma.bionexoConfig.findFirst()
  if (!existingBnx) {
    await prisma.bionexoConfig.create({
      data: {
        cnpj: 'CONFIGURAR_CNPJ',
        usuario: 'ws_promeho_sand_76283',
        senha: 'xjtzJnz9FNmB62',
        wsdlUrl: 'https://ws-bionexo-sandbox-ssl.bionexo.com/ws2/BionexoBean?wsdl',
        ambiente: 'SANDBOX',
        pollingInterval: 5,
        botAtivo: false,
        ultimoToken: '0',
      },
    })
  }

  // Thesys Config
  const existingThesys = await prisma.thesysConfig.findFirst()
  if (!existingThesys) {
    await prisma.thesysConfig.create({
      data: {
        baseUrl: 'http://CONFIGURAR_URL_THESYS:3001/api/bionexo',
        authToken: 'CONFIGURAR_TOKEN_THESYS',
        ativo: false,
      },
    })
  }

  // Sample keywords
  const keywords = [
    { palavraChave: 'SERINGA', acaoAutomatica: AcaoKeyword.INTERESSANTE },
    { palavraChave: 'LUVA CIRURGICA', acaoAutomatica: AcaoKeyword.INTERESSANTE },
    { palavraChave: 'CATETER', acaoAutomatica: AcaoKeyword.INTERESSANTE },
    { palavraChave: 'GAZE', acaoAutomatica: AcaoKeyword.INTERESSANTE },
    { palavraChave: 'FIO SUTURA', acaoAutomatica: AcaoKeyword.INTERESSANTE },
    { palavraChave: 'MANUTENÇÃO', acaoAutomatica: AcaoKeyword.DESCARTAR },
    { palavraChave: 'PAPEL A4', acaoAutomatica: AcaoKeyword.DESCARTAR },
    { palavraChave: 'LIMPEZA', acaoAutomatica: AcaoKeyword.DESCARTAR },
  ]
  for (const kw of keywords) {
    const exists = await prisma.regraPalavraChave.findFirst({ where: { palavraChave: kw.palavraChave } })
    if (!exists) await prisma.regraPalavraChave.create({ data: kw })
  }

  // Sample cotação with items
  const existingCot = await prisma.cotacao.findFirst()
  if (!existingCot) {
    await prisma.cotacao.create({
      data: {
        bionexoId: 636020707,
        cnpjHospital: '60.765.823/0001-30',
        nomeHospital: 'Hospital Albert Einstein',
        ufHospital: 'SP',
        cidadeHospital: 'São Paulo',
        dataVencimento: new Date('2026-04-01'),
        horaVencimento: '14:00',
        formaPagamento: '30 DDL',
        status: CotacaoStatus.RECEBIDO,
        idFormaPagamento: 30,
        contato: 'Compras Einstein',
        tituloPdc: 'Cotação Mat. Hospitalar Abril/2026',
        itens: {
          create: [
            { sequencia: 1, idArtigo: 900001001, descricaoBionexo: 'SERINGA 10ML LUER LOCK S/ AGULHA', quantidade: 500, unidadeMedida: 'CX', idUnidadeMedida: 6, marcaFavorita: 'Aceita Alternativas', codigoProduto: '90001010', marcas: 'BD, Injex', formaPagamento: '30 DDL', categoria: CategoriaItem.NAO_ANALISADO, catComercial: 'Mat. Hospitalar' },
            { sequencia: 2, idArtigo: 900001002, descricaoBionexo: 'GAZE ESTERIL 13 FIOS 7,5X7,5CM', quantidade: 1000, unidadeMedida: 'PCT', idUnidadeMedida: 6, marcaFavorita: 'Cremer', codigoProduto: '90001020', marcas: 'Cremer', formaPagamento: '30 DDL', categoria: CategoriaItem.NAO_ANALISADO, catComercial: 'Mat. Hospitalar' },
            { sequencia: 3, idArtigo: 900001003, descricaoBionexo: 'LUVA CIRURGICA ESTERIL TAM 7.5', quantidade: 200, unidadeMedida: 'PAR', idUnidadeMedida: 6, marcaFavorita: 'Aceita Alternativas', codigoProduto: '90001030', marcas: 'Supermax, Medline', formaPagamento: '30 DDL', categoria: CategoriaItem.NAO_ANALISADO, catComercial: 'Mat. Cirúrgico' },
          ],
        },
      },
    })

    await prisma.cotacao.create({
      data: {
        bionexoId: 636020708,
        cnpjHospital: '60.944.631/0001-53',
        nomeHospital: 'Hospital Sírio-Libanês',
        ufHospital: 'SP',
        cidadeHospital: 'São Paulo',
        dataVencimento: new Date('2026-04-02'),
        horaVencimento: '16:00',
        formaPagamento: '28 DDL',
        status: CotacaoStatus.RECEBIDO,
        idFormaPagamento: 28,
        contato: 'Compras Sírio',
        tituloPdc: 'Cotação Mat. Cirúrgico Abril/2026',
        itens: {
          create: [
            { sequencia: 1, idArtigo: 900002001, descricaoBionexo: 'CATETER INTRAVENOSO 18G', quantidade: 300, unidadeMedida: 'UN', idUnidadeMedida: 6, marcaFavorita: 'BD, Jelco', codigoProduto: '90002010', marcas: 'BD, Jelco', formaPagamento: '28 DDL', categoria: CategoriaItem.NAO_ANALISADO, catComercial: 'Mat. Hospitalar' },
            { sequencia: 2, idArtigo: 900002002, descricaoBionexo: 'FIO SUTURA NYLON 3-0 C/ AGULHA', quantidade: 100, unidadeMedida: 'ENV', idUnidadeMedida: 28, marcaFavorita: 'Aceita Alternativas', codigoProduto: '90002020', marcas: 'Ethicon, Brasuture', formaPagamento: '28 DDL', categoria: CategoriaItem.NAO_ANALISADO, catComercial: 'Mat. Cirúrgico' },
          ],
        },
      },
    })
  }

  console.log('Seed completed successfully')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
