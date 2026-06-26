import { Module } from '@nestjs/common';
import { CompanioController } from './companio.controller';
import { CompanioService } from './companio.service';
import { MatchingEngine } from './matching.engine';

@Module({
  controllers: [CompanioController],
  providers: [CompanioService, MatchingEngine],
  exports: [CompanioService],
})
export class CompanioModule {}
