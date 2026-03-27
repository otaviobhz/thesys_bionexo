import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator'
import { Type } from 'class-transformer'
import { CategoriaItem } from '@prisma/client'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CotacoesService } from './cotacoes.service'

class UpdateItemDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  precoUnitario?: number

  @IsOptional()
  @IsString()
  comentario?: string

  @IsOptional()
  @IsEnum(CategoriaItem)
  categoria?: CategoriaItem

  @IsOptional()
  @IsString()
  codigoInterno?: string

  @IsOptional()
  @IsString()
  descricaoInterna?: string
}

class BatchIdsDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[]
}

@UseGuards(JwtAuthGuard)
@Controller('cotacoes')
export class CotacoesController {
  constructor(private readonly cotacoesService: CotacoesService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('idPdc') idPdc?: string,
    @Query('status') status?: string,
    @Query('categoria') categoria?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cotacoesService.findAllFlat({
      search,
      idPdc,
      status,
      categoria,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    })
  }

  @Get(':cotacaoId')
  async findByCotacaoId(@Param('cotacaoId') cotacaoId: string) {
    return this.cotacoesService.findByCotacaoId(parseInt(cotacaoId, 10))
  }

  @Put('itens/:itemId')
  async updateItem(
    @Param('itemId') itemId: string,
    @Body() body: UpdateItemDto,
  ) {
    return this.cotacoesService.updateItem(itemId, body)
  }

  @Post('lote/interessante')
  async batchInteressante(@Body() body: BatchIdsDto) {
    return this.cotacoesService.batchUpdateCategoria(
      body.ids,
      CategoriaItem.INTERESSANTE,
    )
  }

  @Post('lote/descartar')
  async batchDescartar(@Body() body: BatchIdsDto) {
    return this.cotacoesService.batchUpdateCategoria(
      body.ids,
      CategoriaItem.DESCARTADO,
    )
  }

  @Post('lote/restaurar')
  async batchRestaurar(@Body() body: BatchIdsDto) {
    return this.cotacoesService.batchUpdateCategoria(
      body.ids,
      CategoriaItem.NAO_ANALISADO,
    )
  }

  @Post(':cotacaoId/enviar')
  async enviarCotacao(@Param('cotacaoId') cotacaoId: string) {
    return this.cotacoesService.enviarCotacao(parseInt(cotacaoId, 10))
  }

  @Post(':cotacaoId/cancelar')
  async cancelarCotacao(@Param('cotacaoId') cotacaoId: string) {
    return this.cotacoesService.cancelarCotacao(parseInt(cotacaoId, 10))
  }
}
