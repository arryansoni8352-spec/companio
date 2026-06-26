import { Module } from '@nestjs/common';
import { AICompanionController } from './ai-companion.controller';
import { AICompanionService } from './ai-companion.service';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AICompanionController],
  providers: [AICompanionService],
  exports: [AICompanionService],
})
export class AICompanionModule {}
