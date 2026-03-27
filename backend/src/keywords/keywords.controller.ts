import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { KeywordsService } from './keywords.service';

@Controller('keywords')
@UseGuards(JwtAuthGuard)
export class KeywordsController {
  constructor(private readonly keywordsService: KeywordsService) {}

  @Get()
  findAll(@Query('search') search?: string, @Query('acao') acao?: string) {
    return this.keywordsService.findAll(search, acao);
  }

  @Post()
  create(@Body() body: { palavraChave: string; acaoAutomatica: 'INTERESSANTE' | 'DESCARTAR' }) {
    return this.keywordsService.create(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: { palavraChave?: string; acaoAutomatica?: 'INTERESSANTE' | 'DESCARTAR' },
  ) {
    return this.keywordsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.keywordsService.remove(id);
  }
}
