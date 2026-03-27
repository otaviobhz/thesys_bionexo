import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MapeamentoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    const where = search
      ? {
          OR: [
            { descricaoComprador: { contains: search, mode: 'insensitive' as const } },
            { skuThesys: { contains: search, mode: 'insensitive' as const } },
            { descricaoInterna: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    return this.prisma.mapeamentoSku.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async create(data: { descricaoComprador: string; skuThesys: string; descricaoInterna: string }) {
    return this.prisma.mapeamentoSku.create({ data });
  }

  async remove(id: string) {
    return this.prisma.mapeamentoSku.delete({ where: { id } });
  }
}
