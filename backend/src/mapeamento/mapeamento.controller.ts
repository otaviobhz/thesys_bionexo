import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MapeamentoService } from './mapeamento.service';

@Controller('mapeamento')
@UseGuards(JwtAuthGuard)
export class MapeamentoController {
  constructor(private readonly mapeamentoService: MapeamentoService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.mapeamentoService.findAll(search);
  }

  @Post()
  create(@Body() body: { descricaoComprador: string; skuThesys: string; descricaoInterna: string }) {
    return this.mapeamentoService.create(body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mapeamentoService.remove(id);
  }
}
