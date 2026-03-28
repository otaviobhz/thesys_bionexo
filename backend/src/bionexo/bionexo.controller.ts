import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BionexoService } from './bionexo.service';
import { BionexoProcessor } from './bionexo.processor';

@Controller('bionexo')
@UseGuards(JwtAuthGuard)
export class BionexoController {
  constructor(
    private readonly bionexoService: BionexoService,
    private readonly bionexoProcessor: BionexoProcessor,
  ) {}

  @Post('receber')
  receber() {
    return this.bionexoService.receber();
  }

  @Post('atualizar')
  atualizar() {
    return this.bionexoService.atualizar();
  }

  @Get('status')
  status() {
    return this.bionexoService.status();
  }

  @Post('enviar/:cotacaoId')
  enviar(@Param('cotacaoId') cotacaoId: string) {
    return this.bionexoService.enviarCotacao(cotacaoId);
  }

  @Post('toggle-bot')
  async toggleBot() {
    const statusResult = await this.bionexoService.status()
    if (statusResult.botAtivo) {
      await this.bionexoProcessor.scheduleIfActive()
    } else {
      await this.bionexoProcessor.stopPolling()
    }
    return statusResult
  }

  @Post('debug')
  debug() {
    return this.bionexoService.debugConexao()
  }

  @Get('status-itens/:idPdc')
  verificarStatus(@Param('idPdc') idPdc: string) {
    return this.bionexoService.verificarStatus(parseInt(idPdc))
  }
}
