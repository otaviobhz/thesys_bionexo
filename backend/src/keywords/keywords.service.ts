import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KeywordsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string, acao?: string) {
    const where: any = {};

    if (search) {
      where.palavraChave = { contains: search, mode: 'insensitive' };
    }

    if (acao) {
      where.acaoAutomatica = acao;
    }

    return this.prisma.regraPalavraChave.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: { palavraChave: string; acaoAutomatica: 'INTERESSANTE' | 'DESCARTAR' }) {
    return this.prisma.regraPalavraChave.create({ data });
  }

  async update(id: string, data: { palavraChave?: string; acaoAutomatica?: 'INTERESSANTE' | 'DESCARTAR' }) {
    return this.prisma.regraPalavraChave.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.regraPalavraChave.delete({ where: { id } });
  }
}
