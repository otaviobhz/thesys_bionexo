import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ThesysService } from './thesys.service'

@Controller('thesys')
@UseGuards(JwtAuthGuard)
export class ThesysController {
  constructor(private readonly thesysService: ThesysService) {}

  @Get('itens')
  getItens(@Query('search') search?: string) {
    return this.thesysService.getItens(search)
  }

  @Get('precos')
  getPrecos(@Query('cnpj') cnpj?: string, @Query('codigo') codigo?: string) {
    return this.thesysService.getPrecos(cnpj, codigo)
  }

  @Get('hospitais')
  getHospitais() {
    return this.thesysService.getHospitais()
  }
}
