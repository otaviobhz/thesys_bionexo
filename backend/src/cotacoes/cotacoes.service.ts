import { Injectable, Inject, NotFoundException, forwardRef } from '@nestjs/common'
import { CategoriaItem, Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { BionexoService } from '../bionexo/bionexo.service'

interface FindAllFilters {
  search?: string
  idPdc?: string
  status?: string
  categoria?: string
  page?: number
  limit?: number
}

export interface FlatCotacaoItem {
  id: string
  cotacaoId: number
  dataVencimento: Date
  horaVencimento: string
  uf: string
  cidade: string
  nomeHospital: string
  cnpjHospital: string
  formaPagamento: string | null
  status: string
  prioritaria: boolean
  sequencia: number
  descricaoBionexo: string
  quantidade: number
  unidadeMedida: string
  marcas: string | null
  categoria: string
  codigoInterno: string | null
  descricaoInterna: string | null
  precoUnitario: number | null
  comentario: string | null
  catComercial: string | null
  codigoProduto: string | null
}

@Injectable()
export class CotacoesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => BionexoService))
    private readonly bionexoService: BionexoService,
  ) {}

  async findAllFlat(filters: FindAllFilters): Promise<{
    data: FlatCotacaoItem[]
    total: number
    page: number
    pages: number
  }> {
    const page = filters.page && filters.page > 0 ? filters.page : 1
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 20
    const skip = (page - 1) * limit

    const where: Prisma.CotacaoItemWhereInput = {}

    if (filters.search) {
      const searchTerm = filters.search
      where.OR = [
        {
          cotacao: {
            nomeHospital: { contains: searchTerm, mode: 'insensitive' },
          },
        },
        { descricaoBionexo: { contains: searchTerm, mode: 'insensitive' } },
        { codigoInterno: { contains: searchTerm, mode: 'insensitive' } },
        { descricaoInterna: { contains: searchTerm, mode: 'insensitive' } },
      ]
    }

    if (filters.idPdc) {
      where.cotacao = {
        ...((where.cotacao as Prisma.CotacaoWhereInput) || {}),
        bionexoId: parseInt(filters.idPdc, 10),
      }
    }

    if (filters.status) {
      where.cotacao = {
        ...((where.cotacao as Prisma.CotacaoWhereInput) || {}),
        status: filters.status as any,
      }
    }

    if (filters.categoria) {
      where.categoria = filters.categoria as CategoriaItem
    }

    const [items, total] = await Promise.all([
      this.prisma.cotacaoItem.findMany({
        where,
        include: { cotacao: true },
        skip,
        take: limit,
        orderBy: [
          { cotacao: { dataVencimento: 'asc' } },
          { sequencia: 'asc' },
        ],
      }),
      this.prisma.cotacaoItem.count({ where }),
    ])

    const data: FlatCotacaoItem[] = items.map((item) => ({
      id: item.id,
      cotacaoId: item.cotacao.bionexoId,
      dataVencimento: item.cotacao.dataVencimento,
      horaVencimento: item.cotacao.horaVencimento,
      uf: item.cotacao.ufHospital,
      cidade: item.cotacao.cidadeHospital,
      nomeHospital: item.cotacao.nomeHospital,
      cnpjHospital: item.cotacao.cnpjHospital,
      formaPagamento: item.cotacao.formaPagamento,
      status: item.cotacao.status,
      prioritaria: item.cotacao.prioritaria,
      sequencia: item.sequencia,
      descricaoBionexo: item.descricaoBionexo,
      quantidade: item.quantidade,
      unidadeMedida: item.unidadeMedida,
      marcas: item.marcas,
      categoria: item.categoria,
      codigoInterno: item.codigoInterno,
      descricaoInterna: item.descricaoInterna,
      precoUnitario: item.precoUnitario,
      comentario: item.comentario,
      catComercial: item.catComercial,
      codigoProduto: item.codigoProduto,
    }))

    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
    }
  }

  async findByCotacaoId(bionexoId: number) {
    const cotacao = await this.prisma.cotacao.findUnique({
      where: { bionexoId },
      include: {
        itens: {
          orderBy: { sequencia: 'asc' },
        },
      },
    })

    if (!cotacao) {
      throw new NotFoundException(
        `Cotação com bionexoId ${bionexoId} não encontrada`,
      )
    }

    return cotacao
  }

  async updateItem(
    itemId: string,
    data: {
      precoUnitario?: number
      comentario?: string
      categoria?: CategoriaItem
      codigoInterno?: string
      descricaoInterna?: string
    },
  ) {
    const item = await this.prisma.cotacaoItem.findUnique({
      where: { id: itemId },
    })

    if (!item) {
      throw new NotFoundException(`Item ${itemId} não encontrado`)
    }

    return this.prisma.cotacaoItem.update({
      where: { id: itemId },
      data,
    })
  }

  async batchUpdateCategoria(ids: string[], categoria: CategoriaItem) {
    const result = await this.prisma.cotacaoItem.updateMany({
      where: { id: { in: ids } },
      data: { categoria },
    })

    return { updated: result.count }
  }

  async togglePrioridade(bionexoId: number) {
    const cotacao = await this.prisma.cotacao.findUnique({ where: { bionexoId } })
    if (!cotacao) throw new NotFoundException(`Cotação ${bionexoId} não encontrada`)
    const updated = await this.prisma.cotacao.update({
      where: { bionexoId },
      data: { prioritaria: !cotacao.prioritaria },
    })
    return { bionexoId, prioritaria: updated.prioritaria }
  }

  async enviarCotacao(cotacaoId: number) {
    const cotacao = await this.prisma.cotacao.findUnique({
      where: { bionexoId: cotacaoId },
    })

    if (!cotacao) {
      throw new NotFoundException(
        `Cotação com bionexoId ${cotacaoId} não encontrada`,
      )
    }

    return this.bionexoService.enviarCotacao(cotacao.id)
  }

  async cancelarCotacao(cotacaoId: number) {
    const cotacao = await this.prisma.cotacao.findUnique({
      where: { bionexoId: cotacaoId },
    })

    if (!cotacao) {
      throw new NotFoundException(
        `Cotação com bionexoId ${cotacaoId} não encontrada`,
      )
    }

    await this.prisma.cotacao.update({
      where: { id: cotacao.id },
      data: { status: 'CANCELADO' },
    })

    await this.prisma.syncLog.create({
      data: {
        operacao: 'CANCELAR',
        direcao: 'OUT',
        status: 'SUCESSO',
        mensagem: `Cotação ${cotacaoId} cancelada`,
        processadas: 1,
      },
    })

    return { message: `Cotação ${cotacaoId} cancelada` }
  }
}
