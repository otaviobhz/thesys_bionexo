import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConfigPortalService } from './config-portal.service';

@Controller('config')
@UseGuards(JwtAuthGuard)
export class ConfigPortalController {
  constructor(private readonly configPortalService: ConfigPortalService) {}

  @Get()
  getAll() {
    return this.configPortalService.getAll();
  }

  @Put('bionexo')
  updateBionexo(
    @Body() body: {
      cnpj?: string;
      usuario?: string;
      senha?: string;
      wsdlUrl?: string;
      ambiente?: string;
      pollingInterval?: number;
      botAtivo?: boolean;
    },
  ) {
    // Don't send masked password back to DB
    const data = { ...body };
    if (data.senha === '***' || data.senha === '') delete data.senha;
    return this.configPortalService.updateBionexo(data);
  }

  @Put('thesys')
  updateThesys(
    @Body() body: { baseUrl?: string; authToken?: string; ativo?: boolean },
  ) {
    return this.configPortalService.updateThesys(body);
  }

  @Post('testar-bionexo')
  testarBionexo() {
    return this.configPortalService.testarBionexo();
  }

  @Post('testar-thesys')
  testarThesys() {
    return this.configPortalService.testarThesys();
  }
}
