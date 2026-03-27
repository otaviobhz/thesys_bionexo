import { Module } from '@nestjs/common'
import { ConfigPortalController } from './config-portal.controller'
import { ConfigPortalService } from './config-portal.service'
import { BionexoService } from '../bionexo/bionexo.service'
import { ThesysService } from '../thesys/thesys.service'

@Module({
  controllers: [ConfigPortalController],
  providers: [ConfigPortalService, BionexoService, ThesysService],
})
export class ConfigPortalModule {}
