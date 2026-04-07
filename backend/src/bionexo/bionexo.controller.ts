import { Controller, Get, Post, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
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

  @Get('cadastro/:cnpj')
  buscarCadastro(@Param('cnpj') cnpj: string) {
    return this.bionexoService.buscarCadastro(cnpj)
  }

  @Post('seed-teste')
  seedTeste(@Request() req: any) {
    if (req.user?.perfil !== 'MASTER') {
      throw new ForbiddenException('Apenas usuários MASTER')
    }
    return this.bionexoService.seedCotacoesTeste()
  }

  @Post('aplicar-regras-retroativo')
  aplicarRegrasRetroativo() {
    return this.bionexoService.aplicarRegrasRetroativo()
  }

  @Post('reset-homologacao')
  resetHomologacao(@Request() req: any, @Body() body?: { limparTudo?: boolean }) {
    if (req.user?.perfil !== 'MASTER') {
      throw new ForbiddenException('Apenas usuários MASTER podem resetar a homologação')
    }
    return this.bionexoService.resetHomologacao(body?.limparTudo ?? false)
  }
}
