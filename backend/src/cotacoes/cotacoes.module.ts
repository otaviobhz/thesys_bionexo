import { Module, forwardRef } from '@nestjs/common'
import { CotacoesController } from './cotacoes.controller'
import { CotacoesService } from './cotacoes.service'
import { BionexoModule } from '../bionexo/bionexo.module'
import { ThesysModule } from '../thesys/thesys.module'

@Module({
  imports: [forwardRef(() => BionexoModule), ThesysModule],
  controllers: [CotacoesController],
  providers: [CotacoesService],
  exports: [CotacoesService],
})
export class CotacoesModule {}
