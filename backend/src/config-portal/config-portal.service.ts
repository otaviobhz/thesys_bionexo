import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { BionexoService } from '../bionexo/bionexo.service'
import { ThesysService } from '../thesys/thesys.service'

@Injectable()
export class ConfigPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bionexoService: BionexoService,
    private readonly thesysService: ThesysService,
  ) {}

  async getAll() {
    const bionexo = await this.prisma.bionexoConfig.findFirst()
    const thesys = await this.prisma.thesysConfig.findFirst()
    const bionexoSafe = bionexo ? { ...bionexo, senha: '***' } : null
    return { bionexo: bionexoSafe, thesys }
  }

  async updateBionexo(data: any) {
    const existing = await this.prisma.bionexoConfig.findFirst()
    if (existing) return this.prisma.bionexoConfig.update({ where: { id: existing.id }, data })
    return this.prisma.bionexoConfig.create({
      data: { cnpj: data.cnpj ?? '', usuario: data.usuario ?? '', senha: data.senha ?? '',
        wsdlUrl: data.wsdlUrl ?? '', ambiente: data.ambiente ?? 'SANDBOX',
        pollingInterval: data.pollingInterval ?? 5, botAtivo: data.botAtivo ?? false },
    })
  }

  async updateThesys(data: any) {
    const existing = await this.prisma.thesysConfig.findFirst()
    if (existing) return this.prisma.thesysConfig.update({ where: { id: existing.id }, data })
    return this.prisma.thesysConfig.create({
      data: { baseUrl: data.baseUrl ?? '', authToken: data.authToken, ativo: data.ativo ?? true },
    })
  }

  async testarBionexo() {
    return this.bionexoService.testarConexao()
  }

  async testarThesys() {
    return this.thesysService.testarConexao()
  }
}
