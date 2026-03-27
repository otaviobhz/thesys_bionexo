import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map(({ passwordHash, ...user }) => user);
  }

  async create(data: { email: string; nome: string; perfil: 'MASTER' | 'OPERADOR'; password: string }) {
    const { password, ...rest } = data;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { ...rest, passwordHash },
    });
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async update(id: string, data: { nome?: string; email?: string; perfil?: 'MASTER' | 'OPERADOR' }) {
    const user = await this.prisma.user.update({ where: { id }, data });
    const { passwordHash, ...result } = user;
    return result;
  }

  async toggleStatus(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    const updated = await this.prisma.user.update({
      where: { id },
      data: { ativo: !user.ativo },
    });
    const { passwordHash, ...result } = updated;
    return result;
  }
}
