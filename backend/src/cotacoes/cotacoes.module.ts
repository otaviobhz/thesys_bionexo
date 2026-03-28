import { Module, forwardRef } from '@nestjs/common'
import { CotacoesController } from './cotacoes.controller'
import { CotacoesService } from './cotacoes.service'
import { BionexoModule } from '../bionexo/bionexo.module'

@Module({
  imports: [forwardRef(() => BionexoModule)],
  controllers: [CotacoesController],
  providers: [CotacoesService],
  exports: [CotacoesService],
})
export class CotacoesModule {}
