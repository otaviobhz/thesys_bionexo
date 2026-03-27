import {
  Controller, Get, Post, Put, Patch,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  @Post()
  create(
    @Body() body: { email: string; nome: string; perfil: 'MASTER' | 'OPERADOR'; password: string },
  ) {
    return this.usuariosService.create(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: { nome?: string; email?: string; perfil?: 'MASTER' | 'OPERADOR' },
  ) {
    return this.usuariosService.update(id, body);
  }

  @Patch(':id/status')
  toggleStatus(@Param('id') id: string) {
    return this.usuariosService.toggleStatus(id);
  }
}
