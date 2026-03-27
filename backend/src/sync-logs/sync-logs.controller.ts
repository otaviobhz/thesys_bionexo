import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SyncLogsService } from './sync-logs.service';

@Controller('sync-logs')
@UseGuards(JwtAuthGuard)
export class SyncLogsController {
  constructor(private readonly syncLogsService: SyncLogsService) {}

  @Get()
  findAll(@Query('limit') limit?: string) {
    return this.syncLogsService.findAll(limit ? parseInt(limit, 10) : undefined);
  }
}
