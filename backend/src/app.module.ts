import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { CotacoesModule } from './cotacoes/cotacoes.module'
import { MapeamentoModule } from './mapeamento/mapeamento.module'
import { KeywordsModule } from './keywords/keywords.module'
import { UsuariosModule } from './usuarios/usuarios.module'
import { ConfigPortalModule } from './config-portal/config-portal.module'
import { SyncLogsModule } from './sync-logs/sync-logs.module'
import { PedidosModule } from './pedidos/pedidos.module'
import { BionexoModule } from './bionexo/bionexo.module'
import { ThesysModule } from './thesys/thesys.module'
import { DocsModule } from './docs/docs.module'

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CotacoesModule,
    MapeamentoModule,
    KeywordsModule,
    UsuariosModule,
    ConfigPortalModule,
    SyncLogsModule,
    PedidosModule,
    BionexoModule,
    ThesysModule,
    DocsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
