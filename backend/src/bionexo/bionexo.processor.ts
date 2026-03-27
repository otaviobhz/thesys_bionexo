import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { Queue, Worker } from 'bullmq'
import { PrismaService } from '../prisma/prisma.service'
import { BionexoService } from './bionexo.service'

@Injectable()
export class BionexoProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BionexoProcessor.name)
  private worker: Worker | null = null
  private queue: Queue | null = null

  constructor(
    private readonly prisma: PrismaService,
    private readonly bionexoService: BionexoService,
  ) {}

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    const connection = { url: redisUrl }

    this.queue = new Queue('bionexo-polling', { connection })

    this.worker = new Worker('bionexo-polling', async (job) => {
      this.logger.log(`Processing job: ${job.name}`)

      if (job.name === 'poll-cotacoes') {
        const config = await this.prisma.bionexoConfig.findFirst()
        if (!config?.botAtivo) {
          this.logger.log('Bot desativado, pulando polling')
          return
        }

        this.logger.log('Executando polling WGG...')
        await this.bionexoService.receber()
        this.logger.log('Polling WGG concluido')
      }
    }, { connection })

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.name} falhou: ${err.message}`)
    })

    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job.name} concluido com sucesso`)
    })

    // Check if bot is active and schedule
    await this.scheduleIfActive()
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close()
    }
    if (this.queue) {
      await this.queue.close()
    }
  }

  async scheduleIfActive() {
    const config = await this.prisma.bionexoConfig.findFirst()
    if (!config?.botAtivo || !this.queue) return

    const interval = (config.pollingInterval || 5) * 60 * 1000 // minutes to ms

    // Remove existing repeatable jobs
    const repeatableJobs = await this.queue.getRepeatableJobs()
    for (const job of repeatableJobs) {
      await this.queue.removeRepeatableByKey(job.key)
    }

    // Add new repeatable job
    await this.queue.add('poll-cotacoes', {}, {
      repeat: { every: interval },
    })

    this.logger.log(`Bot ativado: polling a cada ${config.pollingInterval} minutos`)
  }

  async stopPolling() {
    if (!this.queue) return
    const repeatableJobs = await this.queue.getRepeatableJobs()
    for (const job of repeatableJobs) {
      await this.queue.removeRepeatableByKey(job.key)
    }
    this.logger.log('Bot desativado: polling parado')
  }
}
