import { Module } from '@nestjs/common';
import { BionexoController } from './bionexo.controller';
import { BionexoService } from './bionexo.service';
import { BionexoProcessor } from './bionexo.processor';

@Module({
  controllers: [BionexoController],
  providers: [BionexoService, BionexoProcessor],
  exports: [BionexoProcessor],
})
export class BionexoModule {}
