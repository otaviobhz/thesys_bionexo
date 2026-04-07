import { Injectable, Inject, NotFoundException, forwardRef, Logger } from '@nestjs/common'
import { CategoriaItem, Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { BionexoService } from '../bionexo/bionexo.service'
import { ThesysService } from '../thesys/thesys.service'

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
  private readonly logger = new Logger(CotacoesService.name)

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => BionexoService))
    private readonly bionexoService: BionexoService,
    private readonly thesysService: ThesysService,
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

    // 1. Envia para Bionexo via WHS
    const bionexoResult = await this.bionexoService.enviarCotacao(cotacao.id)

    // 2. S1.9 — Se WHS sucesso, também envia para Thesys ERP
    // Falha não bloqueia o fluxo principal: cotação já foi para o hospital via Bionexo,
    // o que importa é fechar o loop com o ERP. Se Thesys falhar, log + retry manual.
    if (bionexoResult?.success === true) {
      try {
        const cotacaoCompleta = await this.prisma.cotacao.findUnique({
          where: { id: cotacao.id },
          include: { itens: true },
        })

        if (!cotacaoCompleta) {
          throw new Error('Cotação sumiu entre WHS e fetch para Thesys')
        }

        // Filtra apenas itens efetivamente cotados (com SKU + preço)
        const itensCotados = cotacaoCompleta.itens.filter(
          (i) => i.codigoInterno && i.precoUnitario != null && i.precoUnitario > 0,
        )

        if (itensCotados.length === 0) {
          this.logger.warn(
            `[S1.9] Cotação ${cotacaoId} enviada ao Bionexo mas SEM itens cotados (preço/SKU faltando) — não enviado ao Thesys`,
          )
        } else {
          const thesysPayload = {
            id_pdc: cotacaoCompleta.bionexoId,
            cnpj_hospital: cotacaoCompleta.cnpjHospital,
            nome_hospital: cotacaoCompleta.nomeHospital,
            forma_pagamento: cotacaoCompleta.formaPagamento || '',
            data_vencimento: cotacaoCompleta.dataVencimento.toISOString().split('T')[0],
            itens: itensCotados.map((item) => ({
              sequencia: item.sequencia,
              sku: item.codigoInterno,
              descricao_interna: item.descricaoInterna || '',
              descricao_bionexo: item.descricaoBionexo,
              quantidade: item.quantidade,
              unidade: item.unidadeMedida,
              preco_unitario: item.precoUnitario,
              comentario: item.comentario || '',
              observacao_fornecedor: item.observacaoFornecedor || '',
            })),
          }

          const thesysResult = await this.thesysService.criarCotacao(thesysPayload)

          // Se o Thesys retornou IDs (sucesso real), grava no banco
          if (thesysResult && thesysResult.id_venda_cotacao) {
            await this.prisma.cotacao.update({
              where: { id: cotacao.id },
              data: {
                thesysVendaId: String(thesysResult.id_venda_cotacao),
                thesysVendaNumero: thesysResult.numero ? String(thesysResult.numero) : null,
              },
            })

            await this.prisma.syncLog.create({
              data: {
                operacao: 'THESYS_COTACAO',
                direcao: 'OUT',
                status: 'SUCESSO',
                mensagem: `Cotação ${cotacaoCompleta.bionexoId} enviada para Thesys (venda nº ${thesysResult.numero})`,
                processadas: itensCotados.length,
              },
            })
            this.logger.log(
              `[S1.9] Cotação ${cotacaoCompleta.bionexoId} integrada ao Thesys (venda ${thesysResult.numero})`,
            )
          } else {
            // Resposta vazia ou erro estruturado do Thesys (ex: não configurado)
            const errMsg = thesysResult?.error || 'resposta vazia do Thesys'
            await this.prisma.syncLog.create({
              data: {
                operacao: 'THESYS_COTACAO',
                direcao: 'OUT',
                status: 'ERRO',
                mensagem: `Cotação ${cotacaoCompleta.bionexoId} enviada ao Bionexo mas falhou no Thesys: ${errMsg}`,
                processadas: 0,
              },
            })
            this.logger.warn(`[S1.9] Thesys retornou sem id_venda_cotacao: ${errMsg}`)
          }
        }
      } catch (thesysErr: any) {
        // Falha no Thesys NÃO bloqueia o fluxo — Bionexo já recebeu
        await this.prisma.syncLog.create({
          data: {
            operacao: 'THESYS_COTACAO',
            direcao: 'OUT',
            status: 'ERRO',
            mensagem: `Cotação ${cotacaoId} enviada ao Bionexo mas falhou no Thesys: ${thesysErr?.message || 'erro desconhecido'}`,
            processadas: 0,
          },
        })
        this.logger.error(`[S1.9] Erro ao enviar para Thesys: ${thesysErr?.message}`)
      }
    }

    return bionexoResult
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
