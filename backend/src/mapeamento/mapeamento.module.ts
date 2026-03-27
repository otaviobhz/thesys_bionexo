import { Module } from '@nestjs/common';
import { MapeamentoController } from './mapeamento.controller';
import { MapeamentoService } from './mapeamento.service';

@Module({
  controllers: [MapeamentoController],
  providers: [MapeamentoService],
})
export class MapeamentoModule {}
