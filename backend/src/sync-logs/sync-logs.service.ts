import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SyncLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(limit?: number) {
    return this.prisma.syncLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit ? Number(limit) : undefined,
    });
  }
}
