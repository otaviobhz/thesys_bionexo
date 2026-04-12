import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { DocsService } from './docs.service'

@UseGuards(JwtAuthGuard)
@Controller('docs')
export class DocsController {
  constructor(private readonly docs: DocsService) {}

  @Get()
  list(@Query('categoria') categoria?: string) {
    return this.docs.list(categoria)
  }

  @Get(':filename')
  async get(@Param('filename') filename: string) {
    return this.docs.get(filename)
  }
}
