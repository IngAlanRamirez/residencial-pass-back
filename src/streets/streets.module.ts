import { Module } from '@nestjs/common';
import { StreetsService } from './streets.service';
import { StreetsController } from './streets.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [StreetsController],
  providers: [StreetsService],
  exports: [StreetsService],
})
export class StreetsModule {}
