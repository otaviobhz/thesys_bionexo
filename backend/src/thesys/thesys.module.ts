import { Module } from '@nestjs/common';
import { ThesysController } from './thesys.controller';
import { ThesysService } from './thesys.service';

@Module({
  controllers: [ThesysController],
  providers: [ThesysService],
})
export class ThesysModule {}
