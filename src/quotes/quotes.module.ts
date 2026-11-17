import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quote } from '../entities/Quote';
import { MaintenanceRequest } from '../entities/MaintenanceRequest';
import { User } from '../entities/User';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Quote, MaintenanceRequest, User])],
  controllers: [QuotesController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
